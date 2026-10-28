/**
 * 判断一个目标词是「词」「短语」还是「整句」。
 *
 * 这是 Etude 的 `classify_target()` 的 JS 版，判断顺序也一样。
 * 顺序是有讲究的：
 *
 * - `in the long run`、`get along with someone` 都是 4 个词，按词数一刀切
 *   会被当成整句，提示词方向从第一句就跑偏（模型会去「变体原句」而不是
 *   「保留短语换情境」）。所以先看首词是不是句子的开头词。
 * - `Don't worry about it` 的首词是缩写，得先把 `'t` 之外的缩写后缀还原，
 *   再和 `don't` / `dont` 比对，否则也被当成短语。
 */

const SENTENCE_STARTERS = new Set([
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'this',
  'that',
  'these',
  'those',
  'there',
  'who',
  'what',
  'someone',
  'somebody',
  'anyone',
  'anybody',
  'everyone',
  'nobody',
  "let's",
  'lets',
  'dont',
  "don't",
])

const CONTRACTION = /^(.+?)['\u2019](ve|ll|re|d|m|s)$/i

/**
 * @param {string} raw
 * @returns {'word' | 'phrase' | 'sentence'}
 */
export function classifyTarget(raw) {
  const target = String(raw ?? '').trim()
  if (!target) return 'word'
  if (/[.!?]$/.test(target)) return 'sentence'

  const tokens = target.split(/\s+/).filter(Boolean)
  if (tokens.length <= 1) return 'word'

  const first = tokens[0].replace(/^[\s"'`\u201c\u201d\u2018\u2019]+|[\s"'`\u201c\u201d\u2018\u2019]+$/g, '').toLowerCase()
  if (isStarter(first)) return 'sentence'

  if (tokens.length >= 6) return 'sentence'
  return 'phrase'
}

function isStarter(word) {
  if (SENTENCE_STARTERS.has(word)) return true
  const match = CONTRACTION.exec(word)
  if (!match) return false
  const base = `${match[1]}'${match[2].toLowerCase()}`
  return SENTENCE_STARTERS.has(base) || SENTENCE_STARTERS.has(match[1])
}

/** 展示用：让界面能说「这是个短语」。 */
export function kindLabel(kind) {
  if (kind === 'sentence') return '整句'
  if (kind === 'phrase') return '短语'
  return '单词'
}
