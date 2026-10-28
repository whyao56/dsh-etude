import { randomUUID } from 'node:crypto'

import { dependencyDirs, loadOptional } from './deps.js'
import { generateSecMsGec } from './edge-token.js'
import { httpFetch } from './net.js'
import { FactoryError, throwIfAborted } from './util.js'

/**
 * Edge TTS，零配置的那条路。
 *
 * 为什么值得自己写：Etude 用 Python 的 `edge-tts` 包，本插件是 Node，
 * 想「兜底引擎不需要任何 key、装好插件就能出声」，就只能把这条 WebSocket
 * 协议自己走一遍。麻烦的地方只有一个 —— 它要一个签名的 DRM token
 * （`Sec-MS-GEC`），那是被混淆过的 SHA-256 变体，见 `lib/edge-token.js`。
 *
 * 这里刻意不引第三方 TTS 包：整个协议就是「发两帧、收一堆 mp3 帧」，
 * 依赖越少，用户那边装不上的概率越低。`ws` 是唯一的例外，因为 Node 自带的
 * `WebSocket` 不许设 header，而这里必须带 Origin / User-Agent / Cookie。
 */

const TRUSTED = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM = '143.0.3650.75'
const HOST = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud'

export const DEFAULT_EDGE_VOICE = 'en-US-AriaNeural'

let wsModule

function loadWs() {
  if (wsModule !== undefined) return wsModule
  const loaded = loadOptional('ws')
  const socket = typeof loaded === 'function' ? loaded : loaded?.WebSocket
  if (typeof socket !== 'function') {
    throw new FactoryError(
      `找不到 ws 模块，Edge TTS 用不了（找过：${dependencyDirs().join(' / ') || '没有可用目录'}）。装一份 ws，或者换一个 TTS 引擎。`,
      'edge-no-ws',
    )
  }
  wsModule = socket
  return wsModule
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function ssml(text, voice, rate, volume) {
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
    `<voice name='${escapeXml(voice)}'>` +
    `<prosody pitch='+0Hz' rate='${normalizePercent(rate)}' volume='${normalizePercent(volume)}'>` +
    `${escapeXml(text)}</prosody></voice></speak>`
  )
}

/** Edge 只认 `+10%` / `-5%` / `+0%` 这种写法，别的它不报错，直接忽略。 */
function normalizePercent(value) {
  const text = String(value ?? '').trim()
  return /^[+-]\d{1,3}%$/.test(text) ? text : '+0%'
}

/** Edge 要的时间串长这样：`Wed Oct 28 2026 20:41:02 GMT+0000 (Coordinated Universal Time)`。 */
function dateToString(now = new Date()) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${pad(now.getUTCDate())} ${now.getUTCFullYear()} ` +
    `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`
  )
}

/**
 * 合成一句。返回 mp3 字节。
 *
 * @param {object} options
 * @param {string} options.text
 * @param {string} [options.voice]
 * @param {string} [options.rate] 形如 `+10%`
 * @param {string} [options.volume] 形如 `+10%`
 * @param {number} [options.timeoutMs]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Buffer>}
 */
export async function synthesizeEdge({ text, voice = DEFAULT_EDGE_VOICE, rate = '+10%', volume = '+10%', timeoutMs = 30000, signal }) {
  throwIfAborted(signal)
  const clean = String(text ?? '').trim()
  if (!clean) throw new FactoryError('要合成的句子是空的。', 'tts-empty-text')

  const WS = loadWs()
  const url =
    `wss://${HOST}/edge/v1?TrustedClientToken=${TRUSTED}` +
    `&ConnectionId=${randomUUID().replace(/-/g, '')}` +
    `&Sec-MS-GEC=${generateSecMsGec()}` +
    `&Sec-MS-GEC-Version=2-${CHROMIUM}`

  const major = CHROMIUM.split('.')[0]
  const socket = new WS(url, {
    headers: {
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
        `Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.0.0`,
      Cookie: `muid=${randomUUID().replace(/-/g, '').toUpperCase()};`,
    },
  })

  const chunks = []
  let turnEnded = false

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        reject(new FactoryError(`Edge TTS 超过 ${timeoutMs} 毫秒没回应。`, 'edge-timeout'))
      }, timeoutMs)

      function cleanup() {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }

      function onAbort() {
        cleanup()
        try {
          socket.terminate()
        } catch {
          /* 已经关了 */
        }
        reject(new FactoryError('合成已取消。', 'aborted'))
      }

      if (signal) {
        if (signal.aborted) {
          onAbort()
          return
        }
        signal.addEventListener('abort', onAbort, { once: true })
      }

      socket.on('open', () => {
        socket.send(
          `X-Timestamp:${dateToString()}\r\n` +
            'Content-Type:application/json; charset=utf-8\r\n' +
            'Path:speech.config\r\n\r\n' +
            JSON.stringify({
              context: {
                synthesis: {
                  audio: {
                    metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                    // 48kbit 单声道 24khz：卡片的语音只在手机上听，再高就是浪费。
                    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
                  },
                },
              },
            }),
        )
        socket.send(
          `X-RequestId:${randomUUID().replace(/-/g, '')}\r\n` +
            'Content-Type:application/ssml+xml\r\n' +
            `X-Timestamp:${dateToString()}Z\r\n` +
            'Path:ssml\r\n\r\n' +
            ssml(clean, voice, rate, volume),
        )
      })

      socket.on('message', (data, isBinary) => {
        if (!isBinary) {
          const frame = data.toString()
          if (frame.includes('Path:turn.end')) {
            turnEnded = true
            cleanup()
            try {
              socket.close()
            } catch {
              /* 已经关了 */
            }
            resolve()
          }
          return
        }
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
        const marker = buffer.indexOf('Path:audio\r\n')
        if (marker >= 0) chunks.push(buffer.subarray(marker + 12))
      })

      socket.on('error', (error) => {
        cleanup()
        reject(
          new FactoryError(
            `Edge TTS 连接出错：${error.message}。多半是网络到不了 speech.platform.bing.com。`,
            'edge-connect-failed',
          ),
        )
      })

      socket.on('close', () => {
        cleanup()
        if (!turnEnded) reject(new FactoryError('Edge TTS 在说完之前把连接关了。', 'edge-closed-early'))
      })
    })
  } catch (error) {
    try {
      socket.terminate()
    } catch {
      /* 已经关了 */
    }
    throw error
  }

  const audio = Buffer.concat(chunks)
  if (audio.length === 0) throw new FactoryError('Edge TTS 回了空音频。', 'edge-empty-audio')
  return audio
}

/**
 * 取音色表。
 *
 * Etude 那份实现只硬编码了 7 个音色，这是 HANDOVER 点名要修的设置类缺陷之一。
 * Edge 自己有一个公开的音色清单接口，就地取来、按语言过滤，用户就能搜
 * `en-GB-*`、`zh-CN-*` 这些，而不是在 7 个里挑。
 *
 * @returns {Promise<Array<{ shortName: string, locale: string, gender: string, friendlyName: string }>>}
 */
export async function fetchEdgeVoices({ timeoutMs = 15000 } = {}) {
  const url = `https://${HOST}/voices/list?trustedclienttoken=${TRUSTED}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await httpFetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/${CHROMIUM}`,
        'Sec-MS-GEC': generateSecMsGec(),
        'Sec-MS-GEC-Version': `2-${CHROMIUM}`,
      },
      maxBytes: 4 * 1024 * 1024,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const list = await response.json()
    if (!Array.isArray(list)) throw new Error('返回的不是数组')
    return list.map((voice) => ({
      shortName: String(voice.ShortName ?? ''),
      locale: String(voice.Locale ?? ''),
      gender: String(voice.Gender ?? ''),
      friendlyName: String(voice.FriendlyName ?? voice.ShortName ?? ''),
    }))
  } catch (error) {
    throw new FactoryError(`取不到 Edge 音色表：${error.message}`, 'edge-voices-failed')
  } finally {
    clearTimeout(timer)
  }
}
