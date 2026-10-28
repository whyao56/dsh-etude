/** 小工具。没有依赖，任何模块都可以引。 */

/** 带机器可读 code 的错误。RPC 层会把它翻译成 {code, message}。 */
export class EtudeError extends Error {
  /**
   * @param {string} message 给人看的中文话
   * @param {string} code 机器读的短码
   * @param {Record<string, unknown>} [details]
   */
  constructor(message, code = 'internal', details = {}) {
    super(message)
    this.name = 'EtudeError'
    this.code = code
    this.details = details
  }
}

/** 用户能改的错（输入不合法、缺参数）。 */
export class BadRequest extends EtudeError {
  constructor(message, details = {}) {
    super(message, 'bad-request', details)
    this.name = 'BadRequest'
  }
}

export const ok = (value) => ({ ok: true, value })

export function failure(error) {
  if (error instanceof EtudeError) {
    return { ok: false, error: { code: error.code, message: error.message, details: error.details } }
  }
  const message = error instanceof Error ? error.message : String(error)
  return { ok: false, error: { code: 'internal', message, details: {} } }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 有并发上限的 map。
 *
 * 找一次候选图要下载好几个文件，一个一个来会慢到用户以为卡死
 * （实测顺序下载 4 张图花了 136 秒）。并发 4 路之后不到 10 秒。
 * 但不设上限又容易把图库的限流撞出来，所以取一个折中。
 */
export async function mapLimit(items, limit, worker) {
  const list = [...items]
  const out = new Array(list.length)
  let cursor = 0
  const width = Math.max(1, Math.min(limit, list.length))
  const runners = Array.from({ length: width }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= list.length) return
      out[index] = await worker(list[index], index)
    }
  })
  await Promise.all(runners)
  return out
}

export function clampInt(value, min, max, fallback) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/** 统一的空白折叠：换行、制表、全角空格都算空白。 */
export function normalizeSpace(text) {
  return String(text ?? '')
    .replace(/[\s\u00a0\u3000]+/g, ' ')
    .trim()
}

export function wordCount(text) {
  const t = normalizeSpace(text)
  if (!t) return 0
  return t.split(' ').filter(Boolean).length
}

/** 大小写无关的比较键。Etude 那边用 Python casefold，这边用 lower —— 英文目标够用。 */
export function compareKey(text) {
  return normalizeSpace(text).toLowerCase()
}

/** 词级编辑距离。用来判断两条例句是不是「只换了个名词」。 */
export function tokenDistance(a, b) {
  const left = compareKey(a).split(' ').filter(Boolean)
  const right = compareKey(b).split(' ').filter(Boolean)
  return levenshtein(left, right)
}

/** 归一化相似度：0 完全不同，1 完全一样。 */
export function similarity(a, b) {
  const left = compareKey(a).split(' ').filter(Boolean)
  const right = compareKey(b).split(' ').filter(Boolean)
  const longest = Math.max(left.length, right.length)
  if (longest === 0) return 1
  return 1 - levenshtein(left, right) / longest
}

function levenshtein(left, right) {
  if (left.length === 0) return right.length
  if (right.length === 0) return left.length
  let previous = new Array(right.length + 1)
  for (let j = 0; j <= right.length; j += 1) previous[j] = j
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Array(right.length + 1)
    current[0] = i
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[right.length]
}

export function truncate(text, max) {
  const t = String(text ?? '')
  if (t.length <= max) return t
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

/** 把 aborted 之类的取消原因变成统一的中文错误。 */
export function abortError(signal) {
  if (signal?.aborted) return new EtudeError('操作已取消。', 'aborted')
  return undefined
}

export function throwIfAborted(signal) {
  const error = abortError(signal)
  if (error) throw error
}
