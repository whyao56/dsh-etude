import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { mp3Duration, sniffAudioKind } from './mp3.js'
import { mediaDir } from './paths.js'
import { sha256Hex, shortDigest } from './sha.js'
import { DEFAULT_EDGE_VOICE, synthesizeEdge } from './tts-edge.js'
import { synthesizeOpenAI } from './tts-openai.js'
import { EtudeError, throwIfAborted } from './util.js'

/**
 * 语音的统一入口。
 *
 * 三条硬要求决定了这里长什么样：
 *
 * 1. **试听必须真能播。** 所以合成完不是「拿到 Buffer 就算完」：要嗅文件头、
 *    要真的把 mp3 帧走一遍算出时长。算不出时长就当这次失败 —— 一个时长
 *    为零的文件，用户点了播放只会更困惑。
 * 2. **降级要如实。** HANDOVER 里 Etude 的毛病是「界面上选了引擎，实际用了
 *    另一个，还不告诉人」。这里无论怎么退，退到哪一步，都写进返回值的
 *    `engine`，一路带到清单的 `media.audio.engine` 和 `lesson.voice.engine`。
 * 3. **不重复收费。** 文件名就是内容哈希，同一个引擎+同一句话不会问第二遍；
 *    试听和最终入包用的是同一个函数，所以试听过的不会在打包时再合成一遍。
 */

/** 模型给的语气提示 → 语速微调。只为让八句话听起来不是一个人念稿。 */
const SLOW_HINTS = ['tired', 'flat', 'dry', 'slow', 'quiet', 'sigh', 'sad', 'calm', 'patient', 'weary']
const FAST_HINTS = ['excited', 'urgent', 'quick', 'fast', 'rushed', 'angry', 'sharp', 'loud', 'eager']

/**
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {object} options.config
 * @param {string} options.root
 * @param {string} options.text
 * @param {string} [options.voiceHint]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ file: string, sha256: string, bytes: number, seconds: number, engine: string, voice: string, rate: string, fellBackFrom?: string, fellBackReason?: string }>}
 */
export async function synthesizeForPack({ ctx, config, root, text, voiceHint, signal }) {
  throwIfAborted(signal)
  const clean = String(text ?? '').trim()
  if (!clean) throw new EtudeError('要合成的句子是空的。', 'tts-empty-text')

  const requested = String(config.ttsEngine ?? 'auto').trim().toLowerCase()
  const rate = hintRate(voiceHint, config.rate)
  const wantsOpenAI = requested === 'openai' || (requested !== 'edge' && Boolean(String(config.ttsBaseUrl ?? '').trim()))

  /** @type {Array<{ engine: string, run: () => Promise<Buffer> }>} */
  const attempts = []

  if (wantsOpenAI) {
    attempts.push({
      engine: 'openai',
      run: () => synthesizeOpenAI({ ctx, config, text: clean, signal }),
    })
  }
  // Edge 永远排在后面。用户明确选了 openai 也照样兜底 —— 卡片包里有声
  // 比「引擎符合设置」重要得多，而且降级会如实写进 engine 字段。
  attempts.push({
    engine: 'edge',
    run: () =>
      synthesizeEdge({
        text: clean,
        voice: String(config.ttsVoiceEdge ?? '').trim() || DEFAULT_EDGE_VOICE,
        rate,
        volume: String(config.volume ?? '+10%'),
        signal,
      }),
  })

  let firstError
  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index]
    const voice =
      attempt.engine === 'openai'
        ? String(config.ttsVoice ?? '').trim() || 'alloy'
        : String(config.ttsVoiceEdge ?? '').trim() || DEFAULT_EDGE_VOICE
    try {
      const bytes = await attempt.run()
      const stored = await storeAudio({ root, bytes, engine: attempt.engine })
      const result = {
        file: stored.file,
        sha256: stored.sha256,
        bytes: stored.bytes,
        seconds: stored.seconds,
        engine: attempt.engine,
        voice,
        rate: attempt.engine === 'edge' ? rate : 'default',
      }
      if (index > 0 && firstError) {
        result.fellBackFrom = attempts[0].engine
        result.fellBackReason = firstError.message
      }
      return result
    } catch (error) {
      if (signal?.aborted) throw error
      if (index === 0) firstError = error
      if (index === attempts.length - 1) {
        if (firstError && attempts.length > 1) {
          throw new EtudeError(
            `两个 TTS 引擎都失败了。主链：${firstError.message}；兜底：${error.message}`,
            'tts-all-engines-failed',
          )
        }
        throw error
      }
    }
  }

  throw new EtudeError('没有可用的 TTS 引擎。', 'tts-all-engines-failed')
}

/**
 * 落盘 + 算时长。文件名即内容哈希，同一份字节只会存在一份。
 */
async function storeAudio({ root, bytes, engine }) {
  const kind = sniffAudioKind(bytes)
  if (kind !== 'mp3') {
    throw new EtudeError(
      `拿到的不是 mp3（嗅探结果：${kind}）。这种字节进不了卡片包。`,
      'tts-not-mp3',
    )
  }
  const info = mp3Duration(bytes)
  if (!info || !(info.seconds > 0)) {
    throw new EtudeError('读不出这段音频的时长，可能是半截文件。', 'tts-bad-audio')
  }
  const sha = sha256Hex(bytes)
  const file = `${engine}-${shortDigest(bytes)}.mp3`
  const dir = mediaDir(root, 'audio')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, file), bytes)
  return { file, sha256: sha, bytes: bytes.length, seconds: info.seconds }
}

/**
 * 语气提示 → 语速。
 *
 * 不做「情绪」，因为 Edge 的 SSML 在免费通道上不认 express-as；
 * 只动语速，这是唯一真的会有区别的参数。clamp 在 ±18% 以内，
 * 再快就跟不上、再慢就失真。
 */
export function hintRate(voiceHint, baseRate) {
  const base = parsePercent(baseRate)
  const hint = String(voiceHint ?? '').toLowerCase()
  if (!hint) return formatPercent(base)
  let delta = 0
  if (SLOW_HINTS.some((word) => hint.includes(word))) delta -= 10
  if (FAST_HINTS.some((word) => hint.includes(word))) delta += 10
  // 「慢一点但很急」这种自相矛盾的提示，两边抵消，回到基准。
  const total = Math.max(-18, Math.min(18, base + delta))
  return formatPercent(total)
}

function parsePercent(value) {
  const match = /^([+-]?\d{1,3})%$/.exec(String(value ?? '').trim())
  if (!match) return 0
  return Math.max(-50, Math.min(50, Number.parseInt(match[1], 10)))
}

function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value}%`
}
