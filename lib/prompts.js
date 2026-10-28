/**
 * 提示词。
 *
 * `system` 段是 Etude 的 `prompts.SYSTEM` 逐字搬过来的 —— 那七条 HARD RULES
 * 不是装饰，是这套方法能不能成立的全部原因，所以一个字都不改。
 *
 * 后面两段是本插件自己的：在 Etude 的 `_schema` 上加了两样东西，
 * 因为这两样东西只有「造卡工厂」需要，训练器不需要：
 * - `voice_hint`：这句话该怎么说（语气/快慢/情绪）。TTS 拿它调语速，
 *   界面上也当元信息显示。没有它，八句全用同一个播报腔，练不出语感。
 * - `image_query`：检索配图用的 2–4 个英文实词。让模型顺手给出这个，
 *   比事后从句子里的名词瞎猜准得多，而且不额外花钱（同一次调用）。
 *
 * 场景必须互不相同也写进了 schema —— Etude 原版只说「变化情境」，
 * 实测模型会给出三条「在咖啡店」的不同句子，八张卡片就废了。
 *
 * 这些文本同时存在 `lib/prompts/*.txt` 里，`tests/prompts.test.js` 会逐字节
 * 比对两边，防止有人只改了一处。
 */

/** 改动提示词就要动这个版本号：幂等键里有它，老包不会误命中新提示词的结果。 */
export const PROMPT_VERSION = 'dsh-etude-1'

/** Etude `prompts.SYSTEM` 逐字复制。 */
export const SYSTEM = `You are the material generator inside a language-drilling app that follows a specific learning theory. Read the rules carefully; they are unusual and you must follow them exactly.

THEORY (why these rules exist)
- Language is a MOTOR skill, not a thinking skill. The learner must build automatic input→output links by meeting many DIFFERENT examples, never by analysing grammar. So: never explain grammar, never give rules.
- The unit of learning is a SENTENCE, not a word.
- "Scene" means THE SITUATION IN WHICH SOMEONE WOULD SAY THIS SENTENCE — not a translation of the sentence. This is critical: the app shows the scene as a prompt and asks the learner to produce the English. If your scene is just a literal translation, the exercise degrades into translation practice and the whole method fails.

HARD RULES
1. Output ONE JSON object. No markdown, no commentary, no code fences.
2. The "situation" fields (scene_en, scene_zh) must NOT contain the target sentence or a word-for-word translation of it.
3. scene_zh must be natural spoken Chinese describing the situation. It may hint at the meaning but must never be a literal mirror of the English.
4. zh_variants: 2-3 DIFFERENT Chinese renderings of the sentence's meaning, deliberately NOT consistent with each other — one very short and colloquial, one fuller, one from a different angle. The app shows a different one each review so the learner cannot lock onto a single Chinese equivalent.
5. Sentences must be SHORT (mostly 4-12 words) — the learner has to process them without stopping to think.
6. Every sentence must be something a real person would actually say. No textbook filler, no tongue twisters.
7. Do not repeat the same sentence pattern with only the noun swapped; vary the situation, the register, and the sentence structure.
8. All English must be correct and idiomatic. British or American spelling, but be consistent.`

/**
 * 本插件的返回结构。
 *
 * @param {number} examples
 * @param {number} zhVariants
 */
export function schema(examples, zhVariants) {
  return `
Return exactly this JSON shape:

{
  "kind": "word | phrase | sentence",
  "ipa": "IPA for the target if it is a single word, else empty string",
  "gloss": "A short definition written in SIMPLE English (CEFR A2-B1 vocabulary). Explain the meaning the way a dictionary for learners would. Never use Chinese here, and avoid using the target word inside its own definition.",
  "note": "One short English sentence about when this is used, or empty string.",
  "examples": [
    {
      "sentence": "the English sentence",
      "scene_en": "English description of the SITUATION in which this sentence is said (1 short sentence)",
      "scene_zh": "中文描述「什么情况下会说这句话」，口语化，1 句，不要逐字对译",
      "zh_variants": ["${zhVariants} 种彼此不同的中文说法，短的极短，长的换个角度"],
      "register": "one of: 日常口语 / 正式 / 书面 / 俚语",
      "voice_hint": "how to SAY it, in 4-8 English words: tone, pace, emotion. e.g. 'flat and tired, slightly impatient'",
      "image_query": "a 2-4 word English phrase naming a PHOTOGRAPHABLE thing in this scene, for stock-photo search. Concrete nouns only. No abstract words, no people's names, no text."
    }
  ],
  "swaps": [
    {
      "role": "subject | verb | object",
      "original": "the part of the sentence being replaced",
      "candidates": ["3 replacement words or phrases that fit grammatically"],
      "samples": ["2 full sentences built by making that replacement"]
    }
  ]
}

Provide exactly ${examples} examples. Provide one swaps entry for each role that actually exists in the examples (subject, then verb, then object). If the target is a full sentence rather than a word or phrase, still provide ${examples} examples — vary them by shifting the situation, the person, or the tense while keeping the target structure recognisable.

TWO EXTRA REQUIREMENTS, WHICH MATTER MORE THAN THEY LOOK:
A. Every scene must be a DIFFERENT situation. Not "at a cafe" three times — a cafe counter, a phone call about a late delivery, a doctor asking how you slept. Eight examples that all happen in one place are eight examples of one thing, and the learner learns nothing from the repeats.
B. scene_zh describes the situation and nothing else. It is a prompt for the learner, not a translation of the answer. If a Chinese speaker could read scene_zh and produce the English sentence word-for-word, it is wrong — rewrite it.`
}

const TARGET = {
  word: (target) => `The target is the English word "${target}".

Every sentence must contain that word, in a form a person would actually say (inflections are fine, the word itself must stay recognisable). If the word has more than one sense, spread the examples across those senses instead of using it the same way eight times.`,

  phrase: (target) => `The target is the English phrase "${target}".

Every sentence must contain that exact phrase, unchanged. Change the situation around it, never the phrase itself.`,

  sentence: (target) => `The target is the English sentence "${target}".

Build the examples as close variants of it: same structure, different situation, different subject, different tense. Include the original sentence itself as one of the examples.`,
}

/**
 * @param {string} target
 * @param {'word' | 'phrase' | 'sentence'} kind
 */
export function targetInstruction(target, kind) {
  const build = TARGET[kind] ?? TARGET.word
  return build(target)
}

/**
 * @param {object} options
 * @param {string} options.target
 * @param {'word' | 'phrase' | 'sentence'} options.kind
 * @param {number} options.examples
 * @param {number} options.zhVariants
 * @returns {{ system: string, user: string }}
 */
export function buildMessages({ target, kind, examples, zhVariants }) {
  const user = [
    targetInstruction(target, kind),
    schema(examples, zhVariants).trimStart(),
    'Remember: scene, not translation. Short sentences. Real speech. Strict JSON only.',
  ].join('\n\n')
  return { system: SYSTEM, user }
}

/**
 * 确定性校验不过关时，拿这段话说服模型改一次。
 *
 * @param {string[]} problems
 */
export function repairInstruction(problems) {
  const list = problems.map((line) => `- ${line}`).join('\n')
  return `Your previous answer broke these rules:

${list}

Return the whole JSON object again, fixed. Same shape, no commentary, no code fences.`
}
