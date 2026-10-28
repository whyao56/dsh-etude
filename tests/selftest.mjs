/**
 * 整条链路自检：造例句 → 找候选图 → 挑图 → 合成语音 → 试听确认 → 打包 → 校验清单。
 *
 * 为什么要有它：宿主里的那套工具只能在 DSH 界面里点，而
 * 「图搜得到吗、sharp 会不会挂、Edge TTS 能不能出声、清单校验器认不认」
 * 这些事必须能一条命令跑出来。模型那一步用本地假模型顶替，其余全是真的。
 *
 * 用法：
 *   node tests/selftest.mjs                 跑一遍，成功就删掉临时目录
 *   node tests/selftest.mjs --keep          留着产物（会打印目录）
 *   node tests/selftest.mjs --target umbrella
 *   node tests/selftest.mjs --examples 4
 *   node tests/selftest.mjs --no-images     跳过配图（只验文字与语音）
 *   node tests/selftest.mjs --install       最后再装进 Etude（需要 Etude 在跑）
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { validateManifest } from '../contract/validate.js'
import { installPack } from '../lib/etude.js'
import { dependencyReport } from '../lib/deps.js'
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
const WITH_INSTALL = flag('install')
const TARGET = value('target', 'coffee')
const EXAMPLES = Number.parseInt(value('examples', '8'), 10)
const CANDIDATES = Number.parseInt(value('candidates', '5'), 10)
/**
 * 指定一个固定数据目录 / Etude 地址。
 *
 * 装进 Etude 的那一步要求两件事：插件的数据目录和 Etude 的数据目录是同一个
 * （媒体文件按名字直接落过去，不重复存一份），以及那个 Etude 是跑着的。
 * 所以验 M4 时用 `--root <Etude 的数据目录> --etude http://127.0.0.1:8978`。
 */
const FIXED_ROOT = value('root', '')
const ETUDE_URL = value('etude', 'http://127.0.0.1:8977')

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

async function main() {
  step(`依赖：${JSON.stringify({ sharp: dependencyReport().sharp, ws: dependencyReport().ws })}`)

  const { root, cleanup } = FIXED_ROOT
    ? { root: FIXED_ROOT, cleanup: async () => {} }
    : await makeTempRoot('dsh-etude-selftest-')
  const model = await startFakeModel()
  step(`假模型在 ${model.url}，数据目录 ${root}`)

  const config = makeConfig({
    llmBaseUrl: model.url,
    llmModel: 'fake-model',
    candidateLimit: CANDIDATES,
    pixelCheck: true,
    autoPrepareCandidates: false,
    examplesPerLesson: EXAMPLES,
    ttsEngine: 'edge',
    etudeUrl: ETUDE_URL,
    etudeWriteAudioPath: true,
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

    // ---- 7. 装进 Etude（可选） ----
    if (WITH_INSTALL) {
      step('装进 Etude')
      const installed = await installPack({ root, packId: created.id, url: config.etudeUrl })
      check('Etude 收了', Boolean(installed.lessonId), `lesson ${installed.lessonId}`)
      check('配图写进 Etude 了', installed.images === picked.length, `${installed.images} 条`)
      check('语音路径也写了', installed.audios === picked.length, `${installed.audios} 条，问题：${installed.audioError ?? '无'}`)
      if (Array.isArray(installed.imageFailures) && installed.imageFailures.length > 0) {
        console.log(`        · 没配上图的：${JSON.stringify(installed.imageFailures)}`)
      }

      // 图片真的能从 Etude 自己的路由拿回来 —— 这才是界面上「看得到图」的证据。
      // 只看数据库里有个文件名是不够的：名字对不上、文件没落盘都会是 404。
      const detail = await fetch(`${installed.url.replace(/\/+$/, '')}/api/lessons/${installed.lessonId}`).then((one) => one.json())
      const rows = Array.isArray(detail?.examples) ? detail.examples : []
      let served = 0
      let tooSmall = 0
      for (const row of rows) {
        if (!row.scene_image) continue
        const response = await fetch(`${installed.url.replace(/\/+$/, '')}/api/images/${row.scene_image}`)
        if (!response.ok) continue
        const bytes = Buffer.from(await response.arrayBuffer())
        const size = imageSize(bytes)
        if (!size) continue
        served += 1
        if (Math.min(size.width, size.height) < 480) tooSmall += 1
      }
      check('Etude 能按名字取回配图', served === picked.length, `${served}/${picked.length}`)
      check('取回的图短边都不小于 480', tooSmall === 0, `${tooSmall} 张太小`)

      const audioRows = rows.filter((row) => row.audio_path)
      check('Etude 里每条都指到语音文件', audioRows.length === picked.length, `${audioRows.length}/${picked.length}`)
      if (audioRows.length > 0) {
        const first = audioRows[0].audio_path
        const response = await fetch(`${installed.url.replace(/\/+$/, '')}/api/audio/${first}`)
        const bytes = Buffer.from(await response.arrayBuffer())
        const duration = mp3Duration(bytes)
        check('Etude 能播这条语音', response.ok && Boolean(duration?.seconds), `${first} ${bytes.length}B ${duration?.seconds?.toFixed(2) ?? '?'}s`)
      }
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
