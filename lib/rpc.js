import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { probeEtude, DEFAULT_ETUDE_URL } from './etude.js'
import { dependencyReport } from './deps.js'
import { describeNetwork } from './net.js'
import { BadRequest, EtudeError, clampInt, normalizeSpace, ok, failure } from './util.js'
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
  synthesizeExample,
  unlockAudio,
  unlockImage,
  uploadCandidate,
} from './packs.js'
import { mediaDir } from './paths.js'
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
        etudeUrl: normalizeSpace(getConfig().etudeUrl) || DEFAULT_ETUDE_URL,
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
        const result = await prepareCandidatesFor(root, packId, ord, { config, signal })
        onProgress(`留下 ${result.kept.length} 张候选，挡掉 ${result.rejectedCount} 张。`)
        return { kept: result.kept.length, rejected: result.rejectedCount, queries: result.queries }
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

    async 'pack.install'(payload) {
      const root = getRoot()
      const config = getConfig()
      const packId = requireId(payload)
      return jobs.start('install', '装进 Etude', async ({ signal, onProgress }) => {
        const { installPack } = await import('./etude.js')
        return installPack({
          root,
          packId,
          url: config.etudeUrl,
          writeAudioPath: config.etudeWriteAudioPath !== false,
          signal,
          onProgress,
        })
      })
    },

    async 'pack.delete'(payload) {
      return deletePack(getRoot(), requireId(payload))
    },

    async 'etude.probe'() {
      return probeEtude({ url: getConfig().etudeUrl })
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
      if (!pack.pack?.manifestPath) throw new EtudeError('这个包还没打包。', 'not-packed')
      const manifest = await readFile(pack.pack.manifestPath, 'utf8')
      return { manifest: JSON.parse(manifest), path: pack.pack.manifestPath }
    },

    async 'image.bytes'(payload) {
      const root = getRoot()
      const kind = String(payload?.kind ?? 'images')
      const file = String(payload?.file ?? '')
      if (!/^[a-z]+-[0-9a-f]{20}\.(jpg|png|webp|gif)$/.test(file)) throw new BadRequest('文件名不合法。')
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
    checks.push(await tryImport('node:sqlite', '把语音路径写回 Etude'))
    checks.push({ id: 'fetch', ok: typeof fetch === 'function', detail: typeof fetch === 'function' ? '可用' : '没有 fetch' })
    checks.push({ id: 'network', ok: true, detail: await describeNetwork() })
    const llm = ctx.get('llm')
    checks.push({ id: 'llm', ok: Boolean(llm), detail: llm ? '可用' : '拿不到 llm 服务' })
    if (deep) checks.push({ id: 'etude', ...(await probeEtude({ url: config.etudeUrl })) })
    return { checks, root: getRoot(), version, profile: deps.dirs, proxy: config.proxyUrl || '' }
  }

  return async function handle(endpoint, payload, signal) {
    const key = String(endpoint ?? '').replace(/^\/+/, '')
    const handler = handlers[key]
    if (!handler) return failure(new EtudeError(`不认识这个接口：${key}`, 'unknown-endpoint'))
    if (signal?.aborted) return failure(new EtudeError('取消了。', 'aborted'))
    try {
      return ok(await handler(payload ?? {}, signal))
    } catch (error) {
      return failure(error)
    }
  }
}

async function tryImport(specifier, label) {
  try {
    await import(specifier)
    return { id: specifier, ok: true, detail: `${label}：可用` }
  } catch (error) {
    return { id: specifier, ok: false, detail: `${label}：不可用（${error.message}）` }
  }
}

function requireId(payload) {
  const id = normalizeSpace(payload?.id)
  if (!id) throw new BadRequest('缺卡片包 id。')
  return id
}
