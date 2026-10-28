/**
 * 整条链路自检：造例句 → 找候选图 → 挑图 → 合成语音 → 试听确认 → 打包 → 校验 → 导出。
 *
 * 为什么要有它：宿主里的那套工具只能在 DSH 界面里点，而
 * 「图搜得到吗、sharp 会不会挂、Edge TTS 能不能出声、清单校验器认不认、
 * 导出的那份副本能不能独立过校验」这些事必须能一条命令跑出来。
 * 模型那一步用本地假模型顶替，其余全是真的。
 *
 * 用法：
 *   node tests/selftest.mjs                 跑一遍，成功就删掉临时目录
 *   node tests/selftest.mjs --keep          留着产物（会打印目录）
 *   node tests/selftest.mjs --target umbrella
 *   node tests/selftest.mjs --examples 4
 *   node tests/selftest.mjs --no-images     跳过配图（只验文字与语音）
 *   node tests/selftest.mjs --export        最后再导出成品包
 *   node tests/selftest.mjs --root D:\x --export-dir E:\y
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { validateManifest } from '../contract/validate.js'
import { dependencyReport } from '../lib/deps.js'
import { exportPack } from '../lib/export.js'
import { imageSize } from '../lib/images.js'
import { mp3Duration } from '../lib/mp3.js'
import {
  buildPackDir,
  checkPack,
  confirmAudio,
  createPack,
  getPack,
  pickCandidate,
  prepareCandidatesFor,
  synthesizeExample,
} from '../lib/packs.js'
import { makeConfig, makeCtx, makeTempRoot } from './helpers/env.mjs'
import { startFakeModel } from './helpers/fake-model.mjs'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback
}

const KEEP = flag('keep')
const WITH_IMAGES = !flag('no-images')
const WITH_EXPORT = flag('export')
const TARGET = value('target', 'coffee')
const EXAMPLES = Number.parseInt(value('examples', '8'), 10)
const CANDIDATES = Number.parseInt(value('candidates', '5'), 10)
/**
 * 指定一个固定数据目录与导出目录。
 *
 * 平时两者都在临时目录里跑完就删；要留证据时用 `--root` 与 `--export-dir` 指定。
 */
const FIXED_ROOT = value('root', '')
const FIXED_EXPORT = value('export-dir', '')

const START = Date.now()
const step = (text) => {
  const seconds = ((Date.now() - START) / 1000).toFixed(1)
  console.log(`[${seconds.padStart(6)}s] ${text}`)
}

let failures = 0
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`   OK   ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    failures += 1
    console.log(`   FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/** 递归数一个目录里的文件数（不含子目录自身）。 */
async function countFiles(directory) {
  let total = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    total += entry.isDirectory() ? await countFiles(full) : 1
  }
  return total
}

async function main() {
  step(`依赖：${JSON.stringify({ sharp: dependencyReport().sharp, ws: dependencyReport().ws })}`)

  const { root, cleanup } = FIXED_ROOT
    ? { root: FIXED_ROOT, cleanup: async () => {} }
    : await makeTempRoot('dsh-etude-selftest-')
  const model = await startFakeModel()
  step(`假模型在 ${model.url}，数据目录 ${root}`)

  const exportDir = FIXED_EXPORT || join(root, 'export')
  const config = makeConfig({
    llmBaseUrl: model.url,
    llmModel: 'fake-model',
    candidateLimit: CANDIDATES,
    pixelCheck: true,
    autoPrepareCandidates: false,
    examplesPerLesson: EXAMPLES,
    ttsEngine: 'edge',
    exportDir,
  })
  const ctx = makeCtx()

  try {
    // ---- 1. 造例句 ----
    step(`造例句：target=${TARGET} examples=${EXAMPLES}`)
    const created = await createPack({ ctx, config, root, target: TARGET, onProgress: (line) => console.log(`        · ${line}`) })
    check('状态是 text', created.status === 'text', created.status)
    check('例句条数对', created.examples.length === EXAMPLES, `${created.examples.length}/${EXAMPLES}`)
    check('每句都有 scene_en 和 scene_zh', created.examples.every((one) => one.sceneEn && one.sceneZh))
    check('每句都有 2 条以上中文说法', created.examples.every((one) => Array.isArray(one.zhVariants) && one.zhVariants.length >= 2))
    const scenes = new Set(created.examples.map((one) => one.sceneEn.toLowerCase()))
    check('场景互不相同', scenes.size === created.examples.length, `${scenes.size}/${created.examples.length}`)

    // ---- 2. 幂等 ----
    const again = await createPack({ ctx, config, root, target: TARGET })
    check('同样的目标不重复花钱', again.id === created.id, `${again.id} vs ${created.id}`)

    // ---- 3. 找图 + 挑图 ----
    const picked = []
    if (WITH_IMAGES) {
      for (const example of created.examples) {
        const before = Date.now()
        let batch = null
        try {
          batch = await prepareCandidatesFor(root, created.id, example.ord, { config })
        } catch (error) {
          check(`第 ${example.ord} 条找图`, false, error.message)
          continue
        }
        const kept = batch.kept ?? []
        const rejected = batch.rejectedCount ?? 0
        check(
          `第 ${example.ord} 条有候选图`,
          kept.length > 0,
          `${kept.length} 张可用 / ${rejected} 张被挡（${((Date.now() - before) / 1000).toFixed(1)}s，query=${JSON.stringify(batch.queries?.[0] ?? '')}）`,
        )
        if (kept.length === 0) continue
        const afterPick = await pickCandidate(root, created.id, example.ord, kept[0].stagedName, { by: 'selftest' })
        const lockedExample = afterPick.examples.find((one) => one.ord === example.ord)
        const image = lockedExample?.image
        check(`第 ${example.ord} 条锁定配图`, Boolean(image?.file), image?.file)
        check(
          `第 ${example.ord} 条配图短边够 640`,
          Boolean(image) && Math.min(image.width, image.height) >= 640,
          image ? `${image.width}x${image.height}` : '没有图',
        )
        check(`第 ${example.ord} 条写了复核人`, Boolean(lockedExample?.imageReview?.by), lockedExample?.imageReview?.by)
        picked.push(example.ord)
      }
      check('八条图都点过头', picked.length === created.examples.length, `${picked.length}/${created.examples.length}`)
    }

    // ---- 4. 语音 ----
    step('合成语音（Edge TTS）')
    for (const example of created.examples) {
      const before = Date.now()
      let audioRecord = null
      try {
        audioRecord = await synthesizeExample({ ctx, config, root, packId: created.id, ord: example.ord })
      } catch (error) {
        check(`第 ${example.ord} 条合成语音`, false, error.message)
        continue
      }
      check(
        `第 ${example.ord} 条出声了`,
        Boolean(audioRecord?.file) && audioRecord.bytes > 0,
        `${audioRecord?.file} ${audioRecord?.bytes}B ${audioRecord?.seconds}s engine=${audioRecord?.engine}（${((Date.now() - before) / 1000).toFixed(1)}s）`,
      )
      const midPack = await getPack(root, created.id)
      const midExample = midPack.examples.find((one) => one.ord === example.ord)
      check(`第 ${example.ord} 条还没算听过`, !midExample?.audioReview, '合成了但没写试听记录，这是对的')
      const afterConfirm = await confirmAudio(root, created.id, example.ord, { by: 'selftest' })
      const confirmedExample = afterConfirm.examples.find((one) => one.ord === example.ord)
      check(`第 ${example.ord} 条记下试听`, confirmedExample?.audioReview?.listened === true)
    }

    // ---- 5. 打包 ----
    step('打包')
    const packed = await buildPackDir({ ctx, config, root, packId: created.id })
    check('包校验通过', packed.verdict?.ok === true, JSON.stringify(packed.verdict?.errors ?? []))
    check('落到了 packs 目录', Boolean(packed.dir), packed.dir)
    check(
      '质量统计对得上',
      packed.manifest.quality.examples === EXAMPLES && packed.manifest.quality.images === picked.length,
      JSON.stringify(packed.manifest.quality),
    )
    check('没有纯色块图', packed.manifest.quality.flat_images === 0, String(packed.manifest.quality.flat_images))

    // 包目录里到底几个文件：manifest + 每条例句的一张图一条音。
    const packedFiles = await countFiles(packed.dir)
    check('包目录里有清单和全部媒体', packedFiles === EXAMPLES * 2 + 1, `${packedFiles} 个文件`)

    // ---- 6. 独立校验器再过一遍（读真实文件） ----
    step('用 contract/validate.js 独立验一遍清单')
    const manifestPath = join(packed.dir, 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const verdict = await validateManifest(manifest, {
      loadFile: async (relative) => readFile(join(packed.dir, relative)),
    })
    check('独立校验通过', verdict.ok === true, JSON.stringify(verdict.errors))
    check('模式是 full', verdict.mode === 'full', verdict.mode)

    const reread = await getPack(root, created.id)
    check('账本状态是 packed', reread.status === 'packed', reread.status)
    const dry = await checkPack(root, created.id)
    check('checkPack 也通过', dry.verdict?.ok === true)

    // ---- 7. 导出成品包（可选） ----
    // 以前这一段是「导入 Etude 并核对它的界面能取回图」。现在插件自己就是全套，
    // 所以要证的是另一件事：导出目录里那份副本能独立通过契约校验，字符和字节都对得上。
    if (WITH_EXPORT) {
      step('导出成品包')
      const exported = await exportPack({ root, packId: created.id, exportDir: exportDir })
      check('导出目录建出来了', Boolean(exported.dir), exported.dir)
      check('导出里的文件数和包一致', exported.files === packedFiles, `${exported.files}/${packedFiles}`)
      check('导出字节不为零', exported.bytes > 0, `${Math.round(exported.bytes / 1024)} KB`)

      const exportedManifestPath = join(exported.dir, 'manifest.json')
      const exportedManifest = JSON.parse(await readFile(exportedManifestPath, 'utf8'))
      const exportVerdict = await validateManifest(exportedManifest, {
        loadFile: async (relative) => readFile(join(exported.dir, relative)),
      })
      check('导出的那份也能独立过校验', exportVerdict.ok === true, JSON.stringify(exportVerdict.errors))
      check('导出的是新 format', exportedManifest.format === 'card-pack', String(exportedManifest.format))

      const mark = await getPack(root, created.id)
      check('账本记了导出位置', Boolean(mark.export?.dir), mark.export?.dir ?? '没记')
      check('状态变成 exported', mark.status === 'exported', mark.status)

      // 每张图、每条音都要能在导出目录里按 manifest 写的位置读到，且尺寸/时长能解出来。
      let images = 0
      let audios = 0
      let tooSmall = 0
      for (const item of exportedManifest.examples) {
        const imagePath = join(exported.dir, item.media.image.file)
        const imageBytes = await readFile(imagePath)
        const size = imageSize(imageBytes)
        if (size) {
          images += 1
          if (Math.min(size.width, size.height) < 480) tooSmall += 1
        }
        const audioBytes = await readFile(join(exported.dir, item.media.audio.file))
        const duration = mp3Duration(audioBytes)
        if (duration?.seconds > 0) audios += 1
      }
      check('导出里的图都能解出尺寸', images === picked.length, `${images}/${picked.length}`)
      check('导出的图短边都不小于 480', tooSmall === 0, `${tooSmall} 张太小`)
      check('导出里的语音都能算出时长', audios === picked.length, `${audios}/${picked.length}`)
    }

    console.log('')
    console.log(`产物：${packed.dir}`)
    console.log(`清单：${manifestPath}`)
    if (failures === 0) {
      console.log('全过。')
    } else {
      console.log(`有 ${failures} 项没过。`)
      process.exitCode = 1
    }
  } finally {
    await model.close()
    if (KEEP || failures > 0) {
      console.log(`（留着 ${root} 方便看）`)
    } else {
      await cleanup()
    }
  }
}

main().catch((error) => {
  console.error('跑挂了：', error)
  process.exitCode = 1
})
