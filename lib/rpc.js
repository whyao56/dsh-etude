import { access, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { dependencyReport } from './deps.js'
import { exportPack } from './export.js'
import { describeNetwork } from './net.js'
import { BadRequest, FactoryError, clampInt, normalizeSpace, ok, failure } from './util.js'
import {
  buildPackDir,
  checkPack,
  confirmAudio,
  createPack,
  deletePack,
  getPack,
  listPacks,
  pickCandidate,
  prepareCandidatesFor,
  setPackVoice,
  synthesizeExample,
  unlockAudio,
  unlockImage,
  uploadCandidate,
} from './packs.js'
import { mediaDir, defaultExportDir } from './paths.js'
import { fetchEdgeVoices, DEFAULT_EDGE_VOICE } from './tts-edge.js'
import { synthesizeForPack } from './tts.js'

/**
 * 客户端那半只能通过这条通道跟宿主说话。
 *
 * 所有会花时间、会花钱的动作都返回一个任务号（jobId），不在这里等它跑完：
 * 一次模型调用十几秒，一次抓图几十个往返，把界面卡在 await 上是最糟的选择。
 * 界面拿任务号去轮询日志，用户就能看到「第 3 条正在找候选图」这种句子，
 * 而不是一个转圈的圈。
 */
export function createRpcHandler({ ctx, getConfig, getRoot, jobs, version }) {
  const handlers = {
    async state() {
      const root = getRoot()
      // 变量名不能也叫 selfcheck：同一个语句里声明它又调用它，右边命中的是悬空绑定，
      // 会抛 "Cannot access 'selfcheck' before initialization"，界面的第一个调用就死。
      const [packs, checks] = await Promise.all([listPacks(root), selfcheck()])
      return {
        root,
        packs,
        selfcheck: checks,
        jobs: jobs.running(),
        exportDir: exportTarget(),
        version,
      }
    },

    async 'pack.get'(payload) {
      return getPack(getRoot(), requireId(payload))
    },

    async 'pack.create'(payload) {
      const config = getConfig()
      const root = getRoot()
      const target = normalizeSpace(payload?.target)
      if (!target) throw new BadRequest('要给一个词、短语或者整句。')
      return jobs.start('create', `造例句：${target}`, async ({ signal, onProgress }) => {
        const pack = await createPack({
          ctx,
          config,
          root,
          target,
          kind: payload?.kind,
          examplesCount: payload?.examples,
          zhVariants: payload?.variants,
          prepareCandidates: payload?.prepareCandidates,
          onProgress,
          signal,
        })
        return { packId: pack.id, status: pack.status }
      })
    },

    async 'pack.candidates'(payload) {
      const config = getConfig()
      const root = getRoot()
      const packId = requireId(payload)
      const ord = clampInt(payload?.ord, 1, 40, 1)
      return jobs.start('candidates', `找候选图：第 ${ord} 条`, async ({ signal, onProgress }) => {
        onProgress('正在图库里检索……')
        const typed = normalizeSpace(payload?.query)
        const result = await prepareCandidatesFor(root, packId, ord, { config, signal, query: typed })
        onProgress(`留下 ${result.kept.length} 张候选，挡掉 ${result.rejectedCount} 张。`)
        return { kept: result.kept.length, rejected: result.rejectedCount, queries: result.queries }
      })
    },

    async 'pack.voice'(payload) {
      const root = getRoot()
      const packId = requireId(payload)
      const pack = await setPackVoice(root, packId, {
        voice: normalizeSpace(payload?.voice),
        rate: normalizeSpace(payload?.rate),
      })
      return { voiceChoice: pack.voiceChoice ?? null }
    },

    /**
     * 能选哪些音色。
     *
     * 以前 Edge 只有 7 个写死的音色，现在向服务要一次全表（几百个），
     * 只挑英文的；拿不到就退化成一个能用的默认值 —— 取不到音色表
     * 不该让人连音色都没得选。
     */
    async 'pack.voice.list'() {
      const requested = String(getConfig().ttsEngine ?? 'auto').trim().toLowerCase()
      const engine = requested === 'openai' ? 'openai' : 'edge'
      const fallback = [
        { id: DEFAULT_EDGE_VOICE, label: 'Aria · 女声（默认）', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-GuyNeural', label: 'Guy · 男声', locale: 'en-US', gender: 'Male' },
        { id: 'en-GB-SoniaNeural', label: 'Sonia · 英式女声', locale: 'en-GB', gender: 'Female' },
      ]
      if (engine === 'openai') {
        return { engine, defaultVoice: '', voices: [{ id: 'alloy', label: 'alloy', locale: '', gender: '' }] }
      }
      try {
        const list = await fetchEdgeVoices({})
        const english = list.filter((one) => String(one.locale ?? '').startsWith('en-'))
        const picked = english.length > 0 ? english : list
        return {
          engine,
          defaultVoice: DEFAULT_EDGE_VOICE,
          voices: picked.map((one) => ({
            id: one.shortName,
            label: one.shortName,
            locale: one.locale,
            gender: one.gender,
          })),
        }
      } catch (error) {
        return { engine, defaultVoice: DEFAULT_EDGE_VOICE, voices: fallback, error: error.message }
      }
    },

    async 'pack.candidatesAll'(payload) {
      const config = getConfig()
      const root = getRoot()
      const packId = requireId(payload)
      // 八条例句各点一次「找候选图」，等于开头先点八下才能开始看 —— 这一步
      // 只是去图库里取货，不涉及任何「点头」，所以可以批量做。已经定了图的、
      // 或者已经有候选等着挑的，都跳过（重取会把人家挑好的那批冲掉）。
      return jobs.start('candidates-all', '找全部候选图', async ({ signal, onProgress, setProgress }) => {
        const pack = await getPack(root, packId)
        const pending = pack.examples.filter((one) => !one.image && (one.imageCandidates?.length ?? 0) === 0)
        const total = pending.length
        let done = 0
        const failures = []
        // 整批共用一份「已经给出去的字节」，不然八条的 image_query 撞车时，
        // 九个格子会是同一张照片的九个位置。
        const avoid = new Set()
        if (total === 0) onProgress('每条都已经有候选图了，不用再找。')
        for (const example of pending) {
          if (signal.aborted) break
          setProgress({ done, total })
          onProgress(`第 ${example.ord} 条：去图库里检索……`)
          try {
            const result = await prepareCandidatesFor(root, packId, example.ord, { config, signal, avoid })
            onProgress(`第 ${example.ord} 条：留下 ${result.kept.length} 张（挡掉 ${result.rejectedCount} 张）`)
          } catch (error) {
            failures.push({ ord: example.ord, reason: error instanceof Error ? error.message : String(error) })
            onProgress(`第 ${example.ord} 条失败：${failures.at(-1).reason}`)
          }
          done += 1
        }
        setProgress({ done, total })
        return { total, done, failures }
      })
    },

    async 'pack.pick'(payload) {
      const root = getRoot()
      return pickCandidate(root, requireId(payload), clampInt(payload?.ord, 1, 40, 1), String(payload?.stagedName ?? ''), {
        by: payload?.by,
      })
    },

    async 'pack.upload'(payload) {
      const root = getRoot()
      const base64 = String(payload?.dataBase64 ?? '')
      if (!base64) throw new BadRequest('没有收到图片内容。')
      return uploadCandidate(root, requireId(payload), clampInt(payload?.ord, 1, 40, 1), {
        bytes: Buffer.from(base64, 'base64'),
        mediaType: String(payload?.mediaType ?? ''),
        by: payload?.by,
        force: payload?.force === true,
      })
    },

    async 'pack.unlockImage'(payload) {
      return unlockImage(getRoot(), requireId(payload), clampInt(payload?.ord, 1, 40, 1))
    },

    async 'pack.audio'(payload) {
      const root = getRoot()
      const config = getConfig()
      const packId = requireId(payload)
      const ord = clampInt(payload?.ord, 1, 40, 1)
      return jobs.start('audio', `合成语音：第 ${ord} 条`, async ({ signal, onProgress }) => {
        onProgress('正在合成……')
        const audio = await synthesizeExample({ ctx, config, root, packId, ord, signal })
        const where = audio.fellBackFrom ? `（${audio.fellBackFrom} 不可用，降级到 ${audio.engine}）` : ''
        onProgress(`好了：${audio.engine} / ${audio.voice}，${audio.seconds.toFixed(2)} 秒${where}`)
        return audio
      })
    },

    async 'pack.audioAll'(payload) {
      const root = getRoot()
      const config = getConfig()
      const packId = requireId(payload)
      return jobs.start('audio-all', '合成全部语音', async ({ signal, onProgress, setProgress }) => {
        const pack = await getPack(root, packId)
        const total = pack.examples.length
        let done = 0
        const failures = []
        for (const example of pack.examples) {
          if (signal.aborted) break
          setProgress({ done, total })
          try {
            const audio = await synthesizeExample({ ctx, config, root, packId, ord: example.ord, signal })
            onProgress(`第 ${example.ord} 条：${audio.seconds.toFixed(2)} 秒 / ${audio.engine}`)
          } catch (error) {
            failures.push({ ord: example.ord, reason: error instanceof Error ? error.message : String(error) })
            onProgress(`第 ${example.ord} 条失败：${failures.at(-1).reason}`)
          }
          done += 1
        }
        setProgress({ done, total })
        return { total, done, failures }
      })
    },

    async 'pack.confirmAudio'(payload) {
      return confirmAudio(getRoot(), requireId(payload), clampInt(payload?.ord, 1, 40, 1), { by: payload?.by })
    },

    async 'pack.unlockAudio'(payload) {
      return unlockAudio(getRoot(), requireId(payload), clampInt(payload?.ord, 1, 40, 1))
    },

    async 'pack.pack'(payload) {
      const root = getRoot()
      const config = getConfig()
      const packId = requireId(payload)
      return jobs.start('pack', '打包', async ({ signal, onProgress }) => {
        onProgress('正在把媒体文件和清单落盘……')
        const result = await buildPackDir({ ctx, config, root, packId, version, signal })
        onProgress(`打好了：${result.dir}`)
        return {
          dir: result.dir,
          quality: result.manifest.quality,
          errors: result.verdict.errors,
          warnings: result.verdict.warnings,
        }
      })
    },

    async 'pack.check'(payload) {
      return checkPack(getRoot(), requireId(payload), version)
    },

    async 'pack.export'(payload) {
      const root = getRoot()
      const packId = requireId(payload)
      return jobs.start('export', '导出成品包', async ({ signal, onProgress }) =>
        exportPack({
          root,
          packId,
          exportDir: normalizeSpace(payload?.exportDir) || exportTarget(),
          signal,
          onProgress,
        }),
      )
    },

    async 'pack.delete'(payload) {
      return deletePack(getRoot(), requireId(payload))
    },

    async selfcheck() {
      return selfcheck({ deep: false })
    },

    async 'voice.list'(payload) {
      const config = getConfig()
      const voices = await fetchEdgeVoices({ timeoutMs: clampInt(payload?.timeoutMs, 3000, 30000, 15000) })
      return {
        defaultVoice: config.ttsVoiceEdge || DEFAULT_EDGE_VOICE,
        voices: voices.map((one) => ({ id: one.shortName, label: one.friendlyName || one.shortName, locale: one.locale, gender: one.gender })),
      }
    },

    /**
     * 试听。三句不同长度，同一个引擎同一次调用里合成 —— 声明的引擎、实测的
     * 时长、真实的字节数，三样都在这里返回给界面。
     * 短句样本的 URL 由 webServer 那条媒体路由提供，能直接塞进 <audio src>。
     */
    async 'sample.audio'(payload) {
      const config = getConfig()
      const root = getRoot()
      return jobs.start('sample', '合成试听样本', async ({ signal, onProgress }) => {
        const texts = Array.isArray(payload?.texts) && payload.texts.length > 0
          ? payload.texts.map((one) => normalizeSpace(one)).filter(Boolean).slice(0, 4)
          : ['It depends on how you look at it.', 'Pass me the salt, please.', 'Actually, I already told him the whole story.']
        const results = []
        for (const text of texts) {
          if (signal.aborted) break
          onProgress(`合成：${text}`)
          try {
            const audio = await synthesizeForPack({ ctx, config, root, text, voiceHint: '', signal })
            results.push({
              text,
              words: text.split(/\s+/).length,
              url: `/etude/media/audio/${encodeURIComponent(audio.file)}`,
              file: audio.file,
              bytes: audio.bytes,
              seconds: audio.seconds,
              engine: audio.engine,
              voice: audio.voice,
              rate: audio.rate,
              fellBackFrom: audio.fellBackFrom ?? null,
              fellBackReason: audio.fellBackReason ?? null,
            })
          } catch (error) {
            results.push({
              text,
              words: text.split(/\s+/).length,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
        return { samples: results }
      })
    },

    async 'job.get'(payload) {
      return jobs.get(String(payload?.id ?? ''))
    },

    async 'job.cancel'(payload) {
      return jobs.cancel(String(payload?.id ?? ''))
    },

    /**
     * 给图片这一块单独开一条：客户端要把候选图放到九宫格里，
     * 用 <img src> 走 webServer 的媒体路由，比走 base64 省得多。
     */
    async 'candidate.list'(payload) {
      const root = getRoot()
      const pack = await getPack(root, requireId(payload))
      const ord = clampInt(payload?.ord, 1, 40, 1)
      const example = pack.examples.find((one) => one.ord === ord)
      if (!example) throw new BadRequest(`第 ${ord} 条不存在。`)
      return {
        ord,
        candidates: example.imageCandidates.map((one) => ({
          stagedName: one.stagedName,
          url: `/etude/candidate/${encodeURIComponent(one.stagedName)}`,
          width: one.width,
          height: one.height,
          bytes: one.bytes,
          source: one.source,
          query: one.query,
          license: one.license,
          author: one.author,
          creditUrl: one.creditUrl,
        })),
        rejected: example.imageRejected,
      }
    },

    async 'pack.read'(payload) {
      const root = getRoot()
      const pack = await getPack(root, requireId(payload))
      if (!pack.pack?.manifestPath) throw new FactoryError('这个包还没打包。', 'not-packed')
      const manifest = await readFile(pack.pack.manifestPath, 'utf8')
      return { manifest: JSON.parse(manifest), path: pack.pack.manifestPath }
    },

    async 'image.bytes'(payload) {
      const root = getRoot()
      const kind = String(payload?.kind ?? 'images')
      const file = String(payload?.file ?? '')
      // 图片和音频的扩展名不一样：语音是 .mp3。这条正则以前只放图，
      // 结果面板上每条语音都卡在「文件名不合法」——按钮点下去一片安静。
      const namePattern =
        kind === 'audio' ? /^[a-z]+-[0-9a-f]{20}\.mp3$/ : /^[a-z]+-[0-9a-f]{20}\.(jpg|png|webp|gif)$/
      if (!namePattern.test(file)) throw new BadRequest('文件名不合法。')
      const dir = mediaDir(root, kind === 'audio' ? 'audio' : 'images')
      return { dataBase64: (await readFile(join(dir, file))).toString('base64') }
    },

    /**
     * 候选图的字节。
     *
     * 界面上的九宫格要真能看到图 —— 这一条不许换成一串 URL 就完事：
     * 宿主 web 服务整站要鉴权，子资源请求带不上凭据，最后就是九个空格子。
     */
    async 'candidate.bytes'(payload) {
      const root = getRoot()
      const stagedName = String(payload?.stagedName ?? '')
      if (!/^[0-9a-z]{6,40}-\d{1,3}-\d{1,3}\.(jpg|png|webp|gif)$/i.test(stagedName)) {
        throw new BadRequest('候选图名字不合法。')
      }
      const path = join(root, 'factory', 'candidates', stagedName)
      return { dataBase64: (await readFile(path)).toString('base64') }
    },
  }

  /** 导出目标：配置里写了就用它，否则 `%USERPROFILE%\Downloads\dsh-etude`。 */
  function exportTarget() {
    return normalizeSpace(getConfig().exportDir) || defaultExportDir()
  }

  /** 深层自检时才验：数据目录真的能写。写不进去的话整套东西都是空谈。 */
  async function storageCheck() {
    const root = getRoot()
    try {
      await mkdir(root, { recursive: true })
      await access(root)
      return { id: 'storage', ok: true, detail: root }
    } catch (error) {
      return { id: 'storage', ok: false, detail: `${root} 进不去：${error instanceof Error ? error.message : String(error)}` }
    }
  }

  async function selfcheck({ deep = false } = {}) {
    const config = getConfig()
    const checks = []
    checks.push({ id: 'node', ok: true, detail: process.version })
    const deps = dependencyReport()
    checks.push({
      id: 'sharp',
      ok: deps.sharp,
      detail: deps.sharp ? '像素级预检（纯色 / 渐变 / 大色块）：可用' : '没有 sharp：只做结构检查，纯色块图拦不住了',
    })
    checks.push({
      id: 'ws',
      ok: deps.ws,
      detail: deps.ws ? 'Edge TTS 的 WebSocket 通道：可用' : `没有 ws：Edge TTS 用不了（找过 ${deps.dirs.join(' / ') || '无'}）`,
    })
    checks.push({ id: 'fetch', ok: typeof fetch === 'function', detail: typeof fetch === 'function' ? '可用' : '没有 fetch' })
    checks.push({ id: 'network', ok: true, detail: await describeNetwork() })
    const llm = ctx.get('llm')
    checks.push({ id: 'llm', ok: Boolean(llm), detail: llm ? '可用' : '拿不到 llm 服务' })
    if (deep) checks.push(await storageCheck())
    return { checks, root: getRoot(), version, profile: deps.dirs, proxy: config.proxyUrl || '', exportDir: exportTarget() }
  }

  return async function handle(endpoint, payload, signal) {
    const key = String(endpoint ?? '').replace(/^\/+/, '')
    const handler = handlers[key]
    if (!handler) return failure(new FactoryError(`不认识这个接口：${key}`, 'unknown-endpoint'))
    if (signal?.aborted) return failure(new FactoryError('取消了。', 'aborted'))
    try {
      return ok(await handler(payload ?? {}, signal))
    } catch (error) {
      return failure(error)
    }
  }
}

function requireId(payload) {
  const id = normalizeSpace(payload?.id)
  if (!id) throw new BadRequest('缺卡片包 id。')
  return id
}
