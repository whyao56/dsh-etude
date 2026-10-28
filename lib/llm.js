import { resolveSecret } from './credentials.js'
import { httpFetch } from './net.js'
import { BadRequest, FactoryError, normalizeSpace, throwIfAborted } from './util.js'

/**
 * 调模型。
 *
 * 这里刻意不自己管 key、不自己拼 HTTP：DSH 有 `llm` 服务，模型与凭据都已经配好。
 * 我们要的是「一段 JSON」，所以只做三件事：
 * 1. 拼 system + user
 * 2. 把流式 chunk 拼成整段文本
 * 3. 从文本里把 JSON 抠出来（模型爱加围栏、爱加解说，这个必须扛住）
 */

/**
 * @param {{ get: (name: string) => unknown }} ctx
 * @returns {{ provider: string, model: string, reasoningEffort?: string } | null}
 */
export function defaultSelection(ctx) {
  try {
    const service = ctx.get?.('agentDefaultModel')
    const selection = service?.currentSelection?.()
    if (!selection) return null
    const provider = selection.provider ?? selection.providerId ?? selection.provider_id
    const model = selection.model ?? selection.modelId ?? selection.model_id
    if (typeof provider !== 'string' || typeof model !== 'string') return null
    const effort = selection.reasoningEffort ?? selection.reasoning_effort ?? selection.effort
    return { provider, model, reasoningEffort: typeof effort === 'string' ? effort : undefined }
  } catch {
    return null
  }
}

/**
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {object} options.config 归一化后的插件配置（index.js 的 normalizeConfig）
 * @param {string} options.system
 * @param {string} options.user
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ text: string, provider: string, model: string }>}
 */
export async function completeJsonPrompt({ ctx, config, system, user, signal }) {
  // 显式配了 `llmBaseUrl` 就走那条路：用户可能在一个没有 llm 服务的 Harness 里用
  // 这个插件，或者就想要某个特定的兼容端点。默认是空串，所以平时还是走宿主。
  const llmBaseUrl = normalizeSpace(config.llmBaseUrl)
  if (llmBaseUrl) {
    const text = await completeViaHttp({ ctx, config, llmBaseUrl, system, user, signal })
    return { text, provider: 'openai-compatible', model: normalizeSpace(config.llmModel) || '(默认)' }
  }

  const llm = ctx.get?.('llm')
  if (!llm || typeof llm.stream !== 'function') {
    throw new FactoryError('这个 Harness 没有提供 llm 服务，造不了例句。', 'no-llm')
  }

  const explicitProvider = normalizeSpace(config.provider)
  const explicitModel = normalizeSpace(config.model)
  const fallback = defaultSelection(ctx)

  const provider = explicitProvider || fallback?.provider || ''
  const model = explicitModel || fallback?.model || ''
  if (!provider || !model) {
    throw new BadRequest(
      '还没选模型。去 设置 → 模型 选一个默认模型，或者在插件配置里填 provider 和 model。',
    )
  }

  const base = {
    provider,
    model,
    system,
    temperature: 0.8,
    maxTokens: 6000,
    signal,
  }
  if (!explicitProvider && fallback?.reasoningEffort) base.reasoningEffort = fallback.reasoningEffort

  // GenerateOptions.messages 的元素类型是 Message | RequestUserInput，而 UserMessage['content']
  // 的确切形状各版本不完全一样。先按「内容块数组」传，抛形状错误再退化成纯字符串。
  const attempts = [
    [{ role: 'user', content: [{ type: 'text', text: user }] }],
    [{ role: 'user', content: user }],
  ]

  let lastError
  for (const messages of attempts) {
    throwIfAborted(signal)
    try {
      const text = await collectStream(llm.stream({ ...base, messages }), signal)
      if (!normalizeSpace(text)) throw new FactoryError('模型返回了空内容。', 'empty-model-output')
      return { text, provider, model }
    } catch (error) {
      lastError = error
      if (signal?.aborted) break
      // 只有「参数形状不对」才换一种写法重试；网络/额度错误换了也没用。
      const message = error instanceof Error ? error.message : String(error)
      if (!/content|messages|invalid|schema|type/i.test(message) || attempts.indexOf(messages) === attempts.length - 1) break
    }
  }
  throw toModelError(lastError)
}

/**
 * 直接打一个 OpenAI 兼容的 `/chat/completions`。
 *
 * 只在用户显式配了 `llmBaseUrl` 时才会走到。存在的理由有三个：
 * 插件得能在没有 `llm` 服务的 Harness 里用；测试要能对着本地 stub 跑
 * 一整条链路；用户手里可能就只有一个兼容端点。
 *
 * 这里用非流式：要的是「一段完整 JSON」，流式拼起来并不会更快，
 * 反而多一层 chunk 解析的失败面。
 */
async function completeViaHttp({ ctx, config, llmBaseUrl, system, user, signal }) {
  throwIfAborted(signal)
  const baseUrl = llmBaseUrl.replace(/\/+$/, '')
  const model = normalizeSpace(config.llmModel) || 'default'
  const apiKey = await resolveSecret(ctx, config.llmApiKeyEnv)

  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180000)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await httpFetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 6000,
        stream: false,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = await safeText(response)
      throw new FactoryError(
        `模型服务回了 ${response.status}：${detail || '(没有正文)'}`,
        response.status === 401 || response.status === 403
          ? 'model-auth'
          : response.status === 429
            ? 'model-rate-limit'
            : 'model-failed',
        { status: response.status },
      )
    }
    const body = await response.json()
    const text = body?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !normalizeSpace(text)) {
      throw new FactoryError('模型返回了空内容。', 'empty-model-output', { preview: JSON.stringify(body).slice(0, 300) })
    }
    return text
  } catch (error) {
    if (signal?.aborted) throw new FactoryError('操作已取消。', 'aborted')
    if (error?.name === 'AbortError') throw new FactoryError('模型 3 分钟没回话。', 'model-failed')
    throw toModelError(error)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function safeText(response) {
  try {
    return (await response.text()).slice(0, 300)
  } catch {
    return ''
  }
}

function toModelError(error) {
  if (error instanceof FactoryError) return error
  const message = error instanceof Error ? error.message : String(error)
  if (/abort/i.test(message)) return new FactoryError('操作已取消。', 'aborted')
  if (/401|unauthor|api key|credential/i.test(message)) {
    return new FactoryError(`模型不认这把钥匙：${message}`, 'model-auth')
  }
  if (/429|rate limit|quota/i.test(message)) {
    return new FactoryError(`模型那边限流或者没额度了：${message}`, 'model-rate-limit')
  }
  return new FactoryError(`调模型失败：${message}`, 'model-failed')
}

async function collectStream(stream, signal) {
  let text = ''
  for await (const chunk of stream) {
    throwIfAborted(signal)
    if (chunk === null || typeof chunk !== 'object') continue
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      text += chunk.text
      continue
    }
    if (chunk.type === 'block-end') {
      const block = chunk.block
      if (block && block.type === 'text' && typeof block.text === 'string' && !text.endsWith(block.text)) {
        text += block.text
      }
      continue
    }
    if (chunk.type === 'finish' && chunk.reason === 'aborted') {
      throw new FactoryError('模型那边把请求掐了。', 'model-aborted')
    }
  }
  return text
}

/**
 * 三层抽取：直接解析 → 剥围栏 → 从每一个 `{` 开始配平扫描。
 *
 * 这是 Etude 的 `extract_json()` 的 JS 版。第三层是真正救命的那个：
 * 模型经常在 JSON 前面写一句「好的，这是你要的内容：」，后面再补一段解释。
 *
 * @param {string} raw
 * @returns {Record<string, unknown>}
 */
export function extractJson(raw) {
  const text = String(raw ?? '').trim()
  if (!text) throw new FactoryError('模型什么都没返回。', 'json-empty')

  const direct = tryParse(text)
  if (direct) return direct

  const fenced = stripFences(text)
  if (fenced !== text) {
    const parsed = tryParse(fenced)
    if (parsed) return parsed
  }

  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== '{') continue
    const slice = balancedObject(text, start)
    if (!slice) continue
    const parsed = tryParse(slice)
    if (parsed) return parsed
  }

  throw new FactoryError(`模型返回的不是 JSON：${explainJsonError(text)}`, 'json-unparsable', {
    preview: text.slice(0, 400),
  })
}

function tryParse(text) {
  try {
    const value = JSON.parse(text)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
    return null
  } catch {
    return null
  }
}

function stripFences(text) {
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : text
}

/** 从 start 的 `{` 起配平括号，跳过字符串里的花括号。 */
function balancedObject(text, start) {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function explainJsonError(text) {
  if (!text.includes('{')) return '里面一个左花括号都没有。'
  if (!text.includes('}')) return '左花括号没有对应的右花括号，八成被截断了。'
  const preview = text.slice(0, 160).replace(/\s+/g, ' ')
  return `括号是配平的，但内容不合法。开头是「${preview}」。`
}
