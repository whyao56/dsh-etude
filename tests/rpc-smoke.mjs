/**
 * RPC 冒烟：把界面会调的每一个端点真调一遍。
 *
 * 为什么值得单独跑一遍：客户端半只通过 `/etude` 这条通道说话，端点名写错一个
 * 字母、参数名从 `id` 改成 `packId`、job 没等完就去取详情 —— 这些都不会在
 * 单元测试里露头，但用户点下去就是「转圈然后什么也没有」。
 *
 * 这里用真工厂（假模型占住模型的位置），按界面上的顺序走：
 *   state → 造包 → 取详情 → 找候选 → 挑一张 → 合成语音 → 我听过了 → 打包 → 自检 → 删掉
 *
 * 用法：node tests/rpc-smoke.mjs
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

/** 文件在不在；在就 true，不在就 false（不抛）。 */
async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

import { createRpcHandler } from '../lib/rpc.js'
import { createJobRunner } from '../lib/jobs.js'
import { makeConfig, makeCtx, makeTempRoot } from './helpers/env.mjs'
import { startFakeModel } from './helpers/fake-model.mjs'

const problems = []
function check(label, condition, detail) {
  if (condition) {
    console.log(`   OK   ${label}`)
  } else {
    problems.push(`${label}${detail === undefined ? '' : ` — ${detail}`}`)
    console.error(`   FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`)
  }
}

function unwrap(result) {
  if (!result || result.ok !== true) {
    const message = result?.error?.message ?? '(没有错误信息)'
    throw new Error(`RPC 失败：${message}`)
  }
  return result.value
}

const temp = await makeTempRoot('dsh-etude-rpc-')
const fake = await startFakeModel({ faults: false })
const jobs = createJobRunner()

const config = makeConfig({
  llmBaseUrl: fake.url,
  llmModel: 'fake-model',
  ttsEngine: 'edge',
  candidateLimit: 4,
  examplesPerLesson: 3,
})

const ctx = makeCtx()
const handler = createRpcHandler({
  ctx,
  getConfig: () => config,
  getRoot: () => temp.root,
  jobs,
  version: '0.1.0-test',
})

const call = async (endpoint, payload) => unwrap(await handler(endpoint, payload, new AbortController().signal))

/** 起一个后台任务并等它跑完 —— 界面就是这么干的。 */
async function runJob(endpoint, payload, timeoutMs = 240000) {
  const job = await call(endpoint, payload)
  if (!job || !job.id) throw new Error(`${endpoint} 没有返回任务号`)
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const current = await call('job.get', { id: job.id })
    if (!current) throw new Error(`任务 ${job.id} 不见了`)
    if (current.status === 'done' || current.status === 'failed' || current.status === 'cancelled') return current
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`${endpoint} 超时（${timeoutMs}ms）`)
}

try {
  console.log('— 起点 —')
  const initial = await call('state')
  check('state 里有 root/packs/selfcheck/version 四个字段',
    typeof initial.root === 'string' &&
      Array.isArray(initial.packs) &&
      Boolean(initial.selfcheck) &&
      typeof initial.version === 'string',
    JSON.stringify(Object.keys(initial)))
  check('一开始一个包也没有', initial.packs.length === 0, `${initial.packs.length} 个`)
  const checks = initial.selfcheck?.checks
  check('自检给了条目，每条有 id 与 ok',
    Array.isArray(checks) && checks.length >= 5 &&
      checks.every((one) => typeof one.id === 'string' && typeof one.ok === 'boolean'),
    JSON.stringify(checks?.map((one) => one.id)))
  check('自检里 sharp 与 ws 都在', checks?.find((one) => one.id === 'sharp')?.ok === true &&
    checks?.find((one) => one.id === 'ws')?.ok === true, JSON.stringify(checks))

  console.log('— 造包（后台任务）—')
  const createJob = await runJob('pack.create', { target: 'run out of', examples: 3 })
  check('造包任务成功', createJob.status === 'done', createJob.error ?? '')
  const packId = createJob.result?.packId
  check('任务结果里带 packId', typeof packId === 'string' && packId.length === 16, String(packId))

  const afterCreate = await call('state')
  check('列表里多了一个包', afterCreate.packs.length === 1, `${afterCreate.packs.length} 个`)
  check('包状态是 text（等配图和语音）', afterCreate.packs[0].status === 'text', afterCreate.packs[0].status)
  check('包的例句条数是对的', afterCreate.packs[0].progress.total === 3, String(afterCreate.packs[0].progress.total))

  const detail = await call('pack.get', { id: packId })
  check('pack.get 能拿到整包', detail.id === packId)
  check('例句还没配图', detail.examples.filter((one) => one.image).length === 0)
  check('例句还没语音', detail.examples.filter((one) => one.audio).length === 0)
  check('每条例句都有句子与场景', detail.examples.every((one) => one.sentence && one.sceneEn && one.sceneZh))

  console.log('— 候选图 —')
  const candidatesJob = await runJob('pack.candidates', { id: packId, ord: 1 })
  check('找候选图任务成功', candidatesJob.status === 'done', candidatesJob.error ?? '')

  const listed = await call('candidate.list', { id: packId, ord: 1 })
  const candidates = Array.isArray(listed) ? listed : listed.candidates
  check('候选图有至少 2 张', candidates.length >= 2, `${candidates.length} 张`)
  check('每张候选都带能直接放的 url 与 stagedName',
    candidates.every((one) => typeof one.url === 'string' && one.url.startsWith('/etude/candidate/') && one.stagedName))
  check('候选图带尺寸（界面要按比例排版）', candidates.every((one) => one.width > 0 && one.height > 0))

  const picked = candidates[0]
  const afterPick = await call('pack.pick', { id: packId, ord: 1, stagedName: picked.stagedName, by: 'rpc-smoke' })
  check('挑图后这一条有了图', Boolean(afterPick.examples[0].image))
  check('挑图留下了复核记录（谁、什么时候、几张候选）',
    afterPick.examples[0].imageReview?.by === 'rpc-smoke' && Boolean(afterPick.examples[0].imageReview?.at),
    JSON.stringify(afterPick.examples[0].imageReview))

  console.log('— 语音 —')
  const audioJob = await runJob('pack.audio', { id: packId, ord: 1 })
  check('合成语音任务成功', audioJob.status === 'done', audioJob.error ?? '')

  const afterAudio = await call('pack.get', { id: packId })
  const firstExample = afterAudio.examples[0]
  check('这一条有了语音', Boolean(firstExample.audio))
  check('语音带时长（不是只回字节数）', firstExample.audio?.seconds > 0, String(firstExample.audio?.seconds))
  check('语音引擎写的是实际用的那个', ['edge', 'openai', 'openai-compatible'].includes(firstExample.audio?.engine),
    String(firstExample.audio?.engine))
  check('合成完还没标「听过了」', firstExample.audioReview === null || firstExample.audioReview === undefined,
    JSON.stringify(firstExample.audioReview))

  // 面板播不出声音这件事曾经是真的：`image.bytes` 的文件名校验只放图片扩展名，
  // 于是每条语音都被判「文件名不合法」。这条断言就是钉住那一次。
  const audioBytes = await call('image.bytes', { kind: 'audio', file: firstExample.audio.file })
  check(
    '宿主能把语音字节传给界面（面板才播得出来）',
    typeof audioBytes.dataBase64 === 'string' && audioBytes.dataBase64.length > 1000,
    `${Math.round((audioBytes.dataBase64?.length ?? 0) / 1024)} KB base64`,
  )

  const afterConfirm = await call('pack.confirmAudio', { id: packId, ord: 1, by: 'rpc-smoke' })
  check('标了「我听过了」', afterConfirm.examples[0].audioReview?.listened === true)

  console.log('— 半成品不许打包 —')
  let packRefused = false
  let refusalMessage = ''
  try {
    const refused = await runJob('pack.pack', { id: packId })
    packRefused = refused.status === 'failed'
    refusalMessage = refused.error ?? ''
  } catch (error) {
    packRefused = true
    refusalMessage = error.message
  }
  check('还剩两条没图没声时打包被拒绝', packRefused, refusalMessage)
  check('拒绝时说明了还差什么', /配图|语音|复核/.test(refusalMessage), refusalMessage)

  console.log('— 补齐剩下两条 —')
  const filled = await runJob('pack.candidatesAll', { id: packId })
  check('批量找候选任务成功', filled.status === 'done', filled.error ?? '')
  check('只补还没候选的那两条（已有的不动）', filled.result?.total === 2, String(filled.result?.total))
  check('两条都补上了', filled.result?.done === 2 && (filled.result?.failures?.length ?? 0) === 0,
    JSON.stringify(filled.result?.failures))

  // 批量取候选时两条例句的 image_query 常常撞车，图库回的是同一批结果。
  // 这里必须能看出两批候选「没有同一份字节」—— 否则九个格子是同一张照片的九个位置，
  // 而且挑完打包会被契约判「第 3 条和第 2 条重了」。
  const digests = []
  for (const ord of [2, 3]) {
    const more = await call('candidate.list', { id: packId, ord })
    const list = Array.isArray(more) ? more : more.candidates
    const bytes = Buffer.from((await call('candidate.bytes', { stagedName: list[0].stagedName })).dataBase64, 'base64')
    digests.push(createHash('sha256').update(bytes).digest('hex'))
  }
  check('两条的首张候选不是同一份字节', digests[0] !== digests[1], digests.join(' / '))

  for (const ord of [2, 3]) {
    const more = await call('candidate.list', { id: packId, ord })
    const list = Array.isArray(more) ? more : more.candidates
    await call('pack.pick', { id: packId, ord, stagedName: list[0].stagedName, by: 'rpc-smoke' })
    await runJob('pack.audio', { id: packId, ord })
    await call('pack.confirmAudio', { id: packId, ord, by: 'rpc-smoke' })
  }

  console.log('— 打包 —')
  const packJob = await runJob('pack.pack', { id: packId })
  check('打包任务成功', packJob.status === 'done', packJob.error ?? '')
  const dir = packJob.result?.dir
  check('打包结果里有目录', typeof dir === 'string' && dir.length > 0, String(dir))

  const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'))
  check('清单 format/format_version 正确', manifest.format === 'card-pack' && manifest.format_version === 2, String(manifest.format))
  check('清单里三条例句都带媒体与复核',
    manifest.examples.length === 3 &&
      manifest.examples.every((one) => one.media?.image && one.media?.audio && one.review?.image?.by && one.review?.audio?.by))
  check('quality.flat_images 是 0', manifest.quality.flat_images === 0, String(manifest.quality.flat_images))
  check('quality.text_in_images 老实留 null', manifest.quality.text_in_images === null)

  const checked = await call('pack.check', { id: packId })
  check('pack.check 说这个包是好的', checked.verdict?.ok === true, JSON.stringify(checked.verdict?.errors))
  check('pack.check 走的是完整模式（真的读了文件）', checked.verdict?.mode === 'full', checked.verdict?.mode)

  const afterPack = await call('state')
  check('包状态变成 packed', afterPack.packs[0].status === 'packed', afterPack.packs[0].status)

  console.log('— 导出 —')
  const exportJob = await runJob('pack.export', { id: packId })
  check('导出任务成功', exportJob.status === 'done', exportJob.error ?? '')
  const exportedDir = exportJob.result?.dir
  const sourceDir = exportJob.result?.sourceDir
  check('导出结果里有目录', typeof exportedDir === 'string' && exportedDir.length > 0, String(exportedDir))
  check('导出的副本里有清单', await exists(join(exportedDir, 'manifest.json')))
  const exportedManifest = JSON.parse(await readFile(join(exportedDir, 'manifest.json'), 'utf8'))
  const firstImage = exportedManifest.examples[0].media.image.file
  check('导出的副本里有图有音',
    await exists(join(exportedDir, firstImage)) &&
      await exists(join(exportedDir, exportedManifest.examples[0].media.audio.file)),
    firstImage)

  const afterExport = await call('state')
  check('包状态变成 exported', afterExport.packs[0].status === 'exported', afterExport.packs[0].status)
  check('列表里带着导出位置', typeof afterExport.packs[0].exportDir === 'string', String(afterExport.packs[0].exportDir))
  check('导出时说清了复验过了', exportJob.result?.verified === true, String(exportJob.result?.verified))

  // 同一个包重导，旧文件不能留着：目录里躺着 manifest 没提过的东西，人一看
  // 就以为包是坏的。这里真塞一个进去，再导一次，看它消没消失。
  const stale = join(exportedDir, 'zzz-stale.txt')
  await writeFile(stale, 'stale')
  const reExport = await runJob('pack.export', { id: packId })
  check('重导成功', reExport.status === 'done', reExport.error ?? '')
  check('重导把上一次的残留清掉了', !(await exists(stale)), stale)

  // 副本坏了要能拦住：把源包里那张图末字节改掉，sha256 就对不上了。
  const sourceImage = join(sourceDir, firstImage)
  const original = await readFile(sourceImage)
  await writeFile(sourceImage, Buffer.concat([original, Buffer.from([0])]))
  const brokenExport = await runJob('pack.export', { id: packId })
  check('源包被改坏时导出失败', brokenExport.status === 'failed', brokenExport.status)
  check('失败原因说的是副本没过校验', brokenExport.code === 'export-invalid', String(brokenExport.code))
  await writeFile(sourceImage, original)

  console.log('— 收摊 —')
  await call('pack.delete', { id: packId })
  const afterDelete = await call('state')
  check('删掉之后列表空了', afterDelete.packs.length === 0, `${afterDelete.packs.length} 个`)
} catch (error) {
  problems.push(`意外中断：${error.message}`)
  console.error(`\n   FAIL 意外中断 — ${error.stack}`)
} finally {
  await fake.close()
  await temp.cleanup()
}

if (problems.length > 0) {
  console.error(`\nRPC 冒烟没过，${problems.length} 处：`)
  for (const one of problems) console.error(`  · ${one}`)
  process.exit(1)
}

console.log('\nRPC 冒烟全过：界面会调的每个端点都通。')
