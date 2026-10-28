import { resolveSecret } from './credentials.js'
import { httpFetch } from './net.js'
import { FactoryError, throwIfAborted } from './util.js'

/**
 * OpenAI 兼容的 `/audio/speech`。
 *
 * 这条是「主链」：用户已经有 key 的话，音质比 Edge 好，而且能挑的音色更多。
 * 但它不许成为**必需品** —— 没配 key、服务 404、限流、超时，任何一种失败
 * 都要能退到 Edge，并且把「实际用的是谁」写进清单。HANDOVER 里那条
 * 「settings 里选引擎导致静默降级」的坑，靠的就是这份如实记录。
 *
 * key 不进插件配置。配置里只存一个环境变量名，真正取值走 DSH 的 credentials
 * 服务 —— 这样 key 只有一处，换机器、换 key 都不用动插件。
 */

/** `+10%` → `1.1`。OpenAI 那边只认这个倍率，不认百分比。 */
export function rateToSpeed(rate) {
  const match = /^([+-]?\d{1,3})%$/.exec(String(rate ?? '').trim())
  if (!match) return 1
  const percent = Number.parseInt(match[1], 10)
  const speed = 1 + percent / 100
  return Math.min(4, Math.max(0.25, Math.round(speed * 100) / 100))
}

/**
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {object} options.config
 * @param {string} options.text
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Buffer>}
 */
export async function synthesizeOpenAI({ ctx, config, text, signal }) {
  throwIfAborted(signal)
  const clean = String(text ?? '').trim()
  if (!clean) throw new FactoryError('要合成的句子是空的。', 'tts-empty-text')

  const baseUrl = normalizeBaseUrl(config.ttsBaseUrl)
  if (!baseUrl) throw new FactoryError('没配 TTS 服务地址。', 'tts-no-base-url')

  const apiKey = await resolveSecret(ctx, config.ttsApiKeyEnv)
  if (!apiKey) {
    throw new FactoryError(
      `找不到 TTS 的 key。把 ${config.ttsApiKeyEnv} 配到 DSH 的凭据里，或者把引擎换成 Edge。`,
      'tts-no-key',
    )
  }

  const body = {
    model: String(config.ttsModel ?? '').trim() || 'tts-1',
    input: clean,
    voice: String(config.ttsVoice ?? '').trim() || 'alloy',
    response_format: 'mp3',
    speed: rateToSpeed(config.rate),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await httpFetch(`${baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      maxBytes: 12 * 1024 * 1024,
    })
    if (!response.ok) {
      const detail = await safeText(response)
      throw new FactoryError(
        `TTS 服务回了 ${response.status}：${detail || '(没有正文)'}`,
        'tts-http-error',
        { status: response.status },
      )
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0) throw new FactoryError('TTS 服务回了空音频。', 'tts-empty-audio')
    return bytes
  } catch (error) {
    if (signal?.aborted) throw new FactoryError('合成已取消。', 'aborted')
    if (error?.name === 'AbortError') throw new FactoryError('TTS 服务 45 秒没回话。', 'tts-timeout')
    if (error instanceof FactoryError) throw error
    throw new FactoryError(`调 TTS 服务失败：${error.message}`, 'tts-network-error')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

function normalizeBaseUrl(value) {
  return String(value ?? '').trim().replace(/\/+$/, '')
}

async function safeText(response) {
  try {
    return (await response.text()).slice(0, 300)
  } catch {
    return ''
  }
}
