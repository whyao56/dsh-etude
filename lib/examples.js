import { completeJsonPrompt, extractJson } from './llm.js'
import { PROMPT_VERSION, buildMessages, repairInstruction } from './prompts.js'
import {
  FactoryError,
  compareKey,
  normalizeSpace,
  similarity,
  throwIfAborted,
  truncate,
  wordCount,
} from './util.js'

/**
 * 造句。
 *
 * 模型的活只有一半。另一半是确定性的：句子是不是真的含目标词、场景是不是
 * 真的不一样、中文说法是不是真的三种。这些不该靠「再问一遍模型」来保证，
 * 所以这里先自己查，查不过才把问题列表甩回给模型改一次 —— 一次，不是三次。
 * 改完还不过就收下能收的部分，把问题记进 `problems` 一路带到清单里，
 * 让人在界面上看到「这几条要留意」，而不是假装没事。
 */

const ALLOWED_REGISTER = new Set(['日常口语', '正式', '书面', '俚语'])

/** 两条场景的相似度超过它，就认为「说的是同一个场合」。 */
const SCENE_SIMILARITY_LIMIT = 0.86

/**
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {object} options.config
 * @param {string} options.target
 * @param {'word' | 'phrase' | 'sentence'} options.kind
 * @param {number} options.examples 要几条
 * @param {number} options.zhVariants 每条几种中文说法
 * @param {AbortSignal} [options.signal]
 */
export async function generateExamples({ ctx, config, target, kind, examples, zhVariants, signal }) {
  const requested = { target, kind, examples, zhVariants }
  const messages = buildMessages(requested)

  throwIfAborted(signal)
  const first = await completeJsonPrompt({ ctx, config, system: messages.system, user: messages.user, signal })
  const firstParsed = interpret(first.text, requested)

  if (firstParsed.blocking.length === 0) {
    return {
      ...firstParsed.value,
      problems: firstParsed.warnings,
      meta: { model: first.model, provider: first.provider, promptVersion: PROMPT_VERSION, attempts: 1 },
    }
  }

  // 只改一次。再问下去模型会开始在原地打转，而且每问一次都是钱。
  throwIfAborted(signal)
  const second = await completeJsonPrompt({
    ctx,
    config,
    system: messages.system,
    user: `${messages.user}\n\n${repairInstruction(firstParsed.blocking)}`,
    signal,
  })
  const secondParsed = interpret(second.text, requested)

  const winner =
    secondParsed.blocking.length < firstParsed.blocking.length ||
    (secondParsed.blocking.length === firstParsed.blocking.length &&
      secondParsed.warnings.length < firstParsed.warnings.length)
      ? secondParsed
      : firstParsed

  if (winner.blocking.length > 0 && winner.value.examples.length === 0) {
    throw new FactoryError(`模型两次都没给出能用的例句：${winner.blocking.join('；')}`, 'bad-model-output', {
      blocking: winner.blocking,
    })
  }

  return {
    ...winner.value,
    problems: [...winner.blocking.map((line) => `没修好：${line}`), ...winner.warnings],
    meta: {
      model: second.model,
      provider: second.provider,
      promptVersion: PROMPT_VERSION,
      attempts: 2,
    },
  }
}

/**
 * 从模型的原文里得到「能用的记录 + 问题清单」。
 *
 * @param {string} raw
 * @param {{ target: string, kind: string, examples: number, zhVariants: number }} requested
 */
export function interpret(raw, requested) {
  const payload = extractJson(raw)
  return validatePayload(payload, requested)
}

/**
 * 确定性校验。不联网、不调模型，可以单独测。
 *
 * @param {Record<string, unknown>} payload
 * @param {{ target: string, kind: string, examples: number, zhVariants: number }} requested
 */
export function validatePayload(payload, requested) {
  const blocking = []
  const warnings = []
  const target = normalizeSpace(requested.target)
  const targetKind = requested.kind

  const kind = ['word', 'phrase', 'sentence'].includes(String(payload.kind)) ? String(payload.kind) : targetKind
  if (kind !== targetKind) warnings.push(`模型把类型判成了「${kind}」，按请求的「${targetKind}」处理。`)

  const ipa = normalizeSpace(payload.ipa)
  const gloss = truncate(normalizeSpace(payload.gloss), 400)
  const note = truncate(normalizeSpace(payload.note), 400)
  if (!gloss) warnings.push('没给英文释义（gloss）。')

  const rawExamples = Array.isArray(payload.examples) ? payload.examples : []
  if (rawExamples.length === 0) blocking.push('返回里一条例句都没有。')

  /** @type {Array<Record<string, unknown>>} */
  const examples = []
  const seenSentences = new Set()

  for (const raw of rawExamples) {
    if (!raw || typeof raw !== 'object') continue
    const sentence = normalizeSpace(raw.sentence)
    if (!sentence) {
      warnings.push('扔掉了一条空句子。')
      continue
    }
    const key = compareKey(sentence)
    if (seenSentences.has(key)) {
      blocking.push(`句子重复了：${truncate(sentence, 60)}`)
      continue
    }
    seenSentences.add(key)

    if (sentence.length > 400) warnings.push(`句子太长，截断：${truncate(sentence, 40)}`)
    const words = wordCount(sentence)
    if (words < 3) warnings.push(`这句太短了（${words} 词）：${sentence}`)
    else if (words > 16) warnings.push(`这句有点长（${words} 词）：${truncate(sentence, 60)}`)

    if (!containsTarget(sentence, target, targetKind)) {
      if (targetKind === 'phrase') blocking.push(`这句里没有原样的短语「${target}」：${sentence}`)
      else if (targetKind === 'word') warnings.push(`这句里认不出目标词「${target}」：${sentence}`)
    }

    const sceneEn = truncate(normalizeSpace(raw.scene_en), 600)
    const sceneZh = truncate(normalizeSpace(raw.scene_zh), 600)
    if (!sceneEn) blocking.push(`缺英文场景说明：${sentence}`)
    if (!sceneZh) blocking.push(`缺中文场景说明：${sentence}`)
    if (sceneZh && sceneZh.length < 4) blocking.push(`中文场景说明太短，像是没写：${sceneZh}`)
    if (sceneEn && compareKey(sceneEn).includes(compareKey(sentence))) {
      blocking.push(`场景写成了句子本身（违反第 2 条硬规矩）：${truncate(sceneEn, 60)}`)
    }
    if (sceneZh && compareKey(sceneZh).includes(compareKey(sentence).toLowerCase())) {
      blocking.push(`中文场景把英文句子抄进去了：${truncate(sceneZh, 60)}`)
    }

    let zhVariants = Array.isArray(raw.zh_variants)
      ? raw.zh_variants.map((item) => normalizeSpace(item)).filter(Boolean)
      : []
    zhVariants = [...new Set(zhVariants)]
    if (zhVariants.length < 2) blocking.push(`中文说法不足两种：${truncate(sentence, 50)}`)
    if (zhVariants.length > 4) {
      zhVariants = zhVariants.slice(0, 4)
      warnings.push(`中文说法超过四种，只留前四种：${truncate(sentence, 50)}`)
    }
    if (zhVariants.some((item) => item.length > 200)) {
      zhVariants = zhVariants.map((item) => truncate(item, 200))
      warnings.push('有中文说法太长，截断到 200 字。')
    }

    const register = ALLOWED_REGISTER.has(normalizeSpace(raw.register))
      ? normalizeSpace(raw.register)
      : '日常口语'
    if (!ALLOWED_REGISTER.has(normalizeSpace(raw.register))) warnings.push('语域不在四档里，按日常口语算。')

    const voiceHint = truncate(normalizeSpace(raw.voice_hint), 200)
    if (!voiceHint) warnings.push(`这句没给 voice_hint：${truncate(sentence, 50)}`)

    const imageQuery = normalizeSpace(raw.image_query) || deriveImageQuery(sentence, target)
    if (!normalizeSpace(raw.image_query)) warnings.push(`这句没给 image_query，靠猜：${truncate(sentence, 50)}`)

    examples.push({
      ord: examples.length + 1,
      sentence,
      sceneEn,
      sceneZh,
      zhVariants,
      register,
      voiceHint,
      imageQuery,
    })
  }

  if (rawExamples.length > 0 && examples.length < requested.examples) {
    if (examples.length === 0) blocking.push('清洗之后一条都不剩。')
    else warnings.push(`要 ${requested.examples} 条，实际能用 ${examples.length} 条。`)
  }

  // 场景互不相同：Etude 原版只说「变化情境」，模型照样会交三条「在咖啡店」。
  for (let i = 0; i < examples.length; i += 1) {
    for (let j = i + 1; j < examples.length; j += 1) {
      const score = similarity(examples[i].sceneEn, examples[j].sceneEn)
      if (score >= SCENE_SIMILARITY_LIMIT) {
        blocking.push(
          `第 ${examples[i].ord} 条和第 ${examples[j].ord} 条场景几乎一样（相似度 ${score.toFixed(2)}），要换场合。`,
        )
      }
    }
  }

  const swaps = normalizeSwaps(payload.swaps, warnings)

  return {
    blocking,
    warnings,
    value: { kind: targetKind, ipa, gloss, note, examples, swaps },
  }
}

/**
 * 句子里有没有目标词。
 *
 * 单字允许形态变化（walk → walking / walks），短语要求原样出现。
 * 词形还原只做最低限度：去掉词尾 e / y 再看前缀，够挡住常见误判，
 * 不用真写一套 stemming。
 */
export function containsTarget(sentence, target, kind) {
  if (!target) return true
  const haystack = ` ${compareKey(sentence).replace(/[^\p{L}\p{N}'\s-]/gu, ' ').replace(/\s+/g, ' ')} `
  const needle = compareKey(target)
  if (kind === 'phrase' || needle.includes(' ')) return haystack.includes(` ${needle} `) || haystack.includes(`${needle} `)

  if (haystack.includes(` ${needle} `)) return true
  if (haystack.includes(`${needle}s `) || haystack.includes(`${needle}d `)) return true

  const stem = needle.endsWith('e') ? needle.slice(0, -1) : needle
  if (stem.length >= 3 && haystack.includes(` ${stem}`)) return true
  if (needle.length >= 4 && haystack.includes(needle)) return true
  return false
}

function normalizeSwaps(raw, warnings) {
  if (!Array.isArray(raw)) return []
  const swaps = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const role = normalizeSpace(item.role)
    const original = normalizeSpace(item.original)
    if (!role || !original) continue
    const candidates = Array.isArray(item.candidates)
      ? item.candidates.map((one) => normalizeSpace(one)).filter(Boolean).slice(0, 6)
      : []
    const samples = Array.isArray(item.samples)
      ? item.samples.map((one) => truncate(normalizeSpace(one), 200)).filter(Boolean).slice(0, 4)
      : []
    if (candidates.length === 0) {
      warnings.push(`swaps 里「${role}」没有候选词，丢掉了。`)
      continue
    }
    swaps.push({ role, original, candidates, samples })
  }
  return swaps.slice(0, 6)
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'his', 'her', 'their', 'my', 'your', 'our', 'its',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'them', 'us',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'shall',
  'not', 'no', 'yes', 'and', 'or', 'but', 'if', 'so', 'than', 'then', 'as', 'at', 'by', 'for', 'from',
  'in', 'into', 'of', 'on', 'onto', 'over', 'to', 'up', 'with', 'about', 'after', 'before', 'again',
  'here', 'there', 'when', 'where', 'why', 'how', 'what', 'who', 'which', 'just', 'really', 'very',
  'some', 'any', 'all', 'more', 'most', 'much', 'many', 'one', 'two', 'get', 'got', 'let', 'put',
])

/**
 * 模型没给 image_query 时的兜底：抓句子里的实词。
 *
 * 这比「把整句丢给图库搜」强，但明显不如模型自己给的准 —— 所以它只是兜底，
 * 一旦走到这里就会记一条 warning，界面上能看见。
 */
export function deriveImageQuery(sentence, target) {
  const words = compareKey(sentence)
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
  const fromTarget = compareKey(target)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
  const merged = [...new Set([...fromTarget, ...words])]
  return merged.slice(0, 2).join(' ') || compareKey(target) || 'everyday life'
}

/** 给条目补上空的媒体位，让状态文件形态固定。 */
export function emptyMediaFields(example) {
  return {
    ...example,
    image: null,
    imageCandidates: [],
    imageRejected: [],
    imageReview: null,
    audio: null,
    audioReview: null,
  }
}
