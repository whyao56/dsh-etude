/**
 * 纯 JS 那几块的单元测试：跑 `node --test tests/`。
 *
 * 挑着测的原则是「错了会静默地错」：MP3 时长算错，界面显示的秒数就是假的，
 * 而没人在意；Edge token 算错，报错信息只会说 403，看不出是算法漂了；
 * 提示词字段丢了，模型照样返回 JSON，只是少了 voice_hint。
 * 这几处都必须由测试钉住。
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { classifyTarget, kindLabel } from '../lib/classify.js'
import { mp3Duration, sniffAudioKind } from '../lib/mp3.js'
import { PROMPT_VERSION, SYSTEM, buildMessages, schema, targetInstruction } from '../lib/prompts.js'
import { generateSecMsGec, tokenSalt } from '../lib/edge-token.js'
import { idempotencyKey, sha256Hex, shortDigest } from '../lib/sha.js'
import { normalizeSpace, similarity, wordCount } from '../lib/util.js'
import { isLearnable } from '../lib/packs.js'

// ── MP3 时长 ───────────────────────────────────────────────────────────────

/** 手工拼一个 MPEG1 Layer III / 128kbps / 44.1kHz 的帧串。 */
function buildMp3(frames) {
  const frameLength = Math.floor((1152 / 8) * 128000 / 44100) // 417 字节
  const frame = Buffer.alloc(frameLength)
  frame[0] = 0xff
  frame[1] = 0xfb // MPEG1, Layer III, 无 CRC
  frame[2] = 0x90 // 128kbps, 44.1kHz, 无 padding
  frame[3] = 0x64 // 立体声
  return Buffer.concat(Array.from({ length: frames }, () => frame))
}

test('mp3Duration 数得清帧，算得出秒数', () => {
  const audio = buildMp3(100)
  const result = mp3Duration(audio)
  assert.ok(result, '应当认出这是 MP3')
  assert.equal(result.frames, 100)
  assert.equal(result.sampleRate, 44100)
  assert.ok(!result.estimated, '帧都认出来了就不该走估算')
  // 100 帧 × 1152 采样 ÷ 44100 = 2.6122…
  assert.ok(Math.abs(result.seconds - 2.6122) < 0.01, `秒数不对：${result.seconds}`)
})

test('mp3Duration 跳过 ID3v2 标签', () => {
  const id3 = Buffer.alloc(10 + 128)
  id3.write('ID3', 0, 'binary')
  id3[3] = 4
  id3[4] = 0
  id3[5] = 0
  // syncsafe 长度：128 字节正文
  id3[6] = 0
  id3[7] = 0
  id3[8] = 1
  id3[9] = 0
  const audio = Buffer.concat([id3, buildMp3(10)])
  const result = mp3Duration(audio)
  assert.ok(result)
  assert.equal(result.frames, 10, '标签不能被当成音频帧')
})

test('mp3Duration 对不是 MP3 的东西返回 null，而不是瞎猜一个数', () => {
  assert.equal(mp3Duration(Buffer.from('this is not audio at all, sorry')), null)
  assert.equal(mp3Duration(Buffer.alloc(0)), null)
})

test('sniffAudioKind 认得 mp3 / wav / ogg', () => {
  assert.equal(sniffAudioKind(buildMp3(1)), 'mp3')
  assert.equal(sniffAudioKind(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')])), 'wav')
  assert.equal(sniffAudioKind(Buffer.from('OggS\0\0\0\0')), 'ogg')
  assert.equal(sniffAudioKind(Buffer.from('<html>404</html>')), 'unknown')
})

// ── 目标类型判定 ───────────────────────────────────────────────────────────

test('classifyTarget 和 Etude 那边判得一样', () => {
  assert.equal(classifyTarget('coffee'), 'word')
  assert.equal(classifyTarget('  coffee  '), 'word')
  assert.equal(classifyTarget('in the long run'), 'phrase')
  // 四词的短语如果不当短语看，提示词从一开始就会往「造句」上跑。
  assert.equal(classifyTarget('get along with someone'), 'phrase')
  assert.equal(classifyTarget('I would like a coffee.'), 'sentence')
  assert.equal(classifyTarget('we should call it a day'), 'sentence')
  assert.equal(classifyTarget("Let's get started"), 'sentence')
  assert.equal(classifyTarget("Don't worry about it"), 'sentence')
  assert.equal(classifyTarget(''), 'word')
})

test('判定故意跟 Etude 保持一致，哪怕有个别地方「理论上可以更聪明」', () => {
  // `Let us get started` 少个撇号就掉进短语档，因为句首词表里收的是 let's
  // 而不是 let —— 而把 let 直接算句首，`let out`、`let alone` 这些短语就会
  // 被当成句子。两害相权，选择与参考实现一致，不自己发明更聪明的规则。
  assert.equal(classifyTarget('Let us get started'), 'phrase')
  assert.equal(classifyTarget('let out'), 'phrase')
})

test('kindLabel 给的是中文档位', () => {
  assert.equal(kindLabel('word'), '单词')
  assert.equal(kindLabel('phrase'), '短语')
  assert.equal(kindLabel('sentence'), '整句')
})

// ── 提示词 ─────────────────────────────────────────────────────────────────

test('SYSTEM 里那几条硬规矩都在（别在改文案时把它们弄丢）', () => {
  assert.match(SYSTEM, /motor skill/i)
  assert.match(SYSTEM, /scene/i)
  for (const marker of [
    'HARD RULES',
    'JSON',
    'zh_variants',
    'translation',
  ]) {
    assert.ok(SYSTEM.includes(marker), `SYSTEM 里少了 ${marker}`)
  }
  assert.ok(PROMPT_VERSION.length > 0)
})

test('schema 带着 voice_hint 与 image_query 两个附加字段', () => {
  const text = schema(8, 3)
  assert.match(text, /voice_hint/)
  assert.match(text, /image_query/)
  assert.match(text, /"examples"/)
  assert.match(text, /"swaps"/)
  // 条数得跟着参数走，不然模型会造错数量。
  assert.match(text, /8/)
})

test('buildMessages 把目标、类型指令、schema 拼成一轮对话', () => {
  const { system, user } = buildMessages({ target: 'run out of', kind: 'phrase', examples: 8, zhVariants: 3 })
  assert.equal(system, SYSTEM)
  assert.ok(user.includes('run out of'))
  assert.match(user, /voice_hint/)
  assert.ok(user.length > 1500, '用户那一侧不该短到没有指令')
})

test('三种类型的指令不一样，短语要求原样出现', () => {
  const word = targetInstruction('coffee', 'word')
  const phrase = targetInstruction('run out of', 'phrase')
  const sentence = targetInstruction('I would like a coffee.', 'sentence')
  assert.notEqual(word, phrase)
  assert.notEqual(phrase, sentence)
  assert.match(phrase, /run out of/)
  assert.match(sentence, /I would like a coffee\./)
})

// ── Edge token（钉住那套被混淆过的哈希） ───────────────────────────────────

test('Edge token 形状正确', () => {
  const token = generateSecMsGec(1700000000)
  assert.match(token, /^[0-9A-F]{16}-[0-9A-F]{64}$/)
})

test('Edge token 与 Python 侧逐字节一致（回归钉子）', () => {
  // 这三个值是用 edge-tts 7.3.1 的 Python 实现算出来的原值。
  // 只要有一天这里对不上，就说明有人「顺手优化」了那套非标准哈希 —— 拒绝提交。
  const cases = [
    ['1700000000', '2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2'],
    ['1750000000', 'B029A7426816F097-4579D112DC47FC3BF432B499C0A282F427C659474AF9BF5FA33CE2C003F9E9C2'],
    ['1760000000', '6D50DDDB91812C33-DD68EFB01898B0750C9797D51A5FF93471DFDAE6888A1039D532CBDCCE54545D'],
  ]
  for (const [timestamp, expected] of cases) {
    assert.equal(generateSecMsGec(Number(timestamp)), expected, `时间戳 ${timestamp} 的 token 变了`)
  }
})

test('EDGE 窗口内的 token 不变（同一 300 秒窗口）', () => {
  // 窗口是按 1601 年纪元对齐的 300 秒格子，不是按 Unix 纪元。1700000000
  // 落在 [1699999800, 1700000100) 这格里，所以 +50 秒仍在同一格。
  const salt = (timestamp) => tokenSalt(timestamp).toString('binary')
  assert.equal(salt(1700000000), salt(1700000050), '同一格子里的盐必须一样')
  assert.notEqual(salt(1700000000), salt(1700000100), '跨到下一格就该换')
})

// ── 哈希与幂等键 ───────────────────────────────────────────────────────────

test('shortDigest 就是 sha256 的前 20 位（要能直接当 Etude 的文件名）', () => {
  const bytes = Buffer.from('hello')
  assert.equal(shortDigest(bytes), sha256Hex(bytes).slice(0, 20))
  assert.match(shortDigest(bytes), /^[0-9a-f]{20}$/)
})

test('幂等键与字段顺序无关，与取值有关', () => {
  const a = idempotencyKey({ target: 'coffee', kind: 'word', examples: 8 })
  const b = idempotencyKey({ examples: 8, kind: 'word', target: 'coffee' })
  const c = idempotencyKey({ target: 'coffee', kind: 'word', examples: 9 })
  assert.equal(a, b, '换个书写顺序不该多花一次钱')
  assert.notEqual(a, c)
  assert.match(a, /^[0-9a-f]{32}$/)
})

// ── 小工具 ─────────────────────────────────────────────────────────────────

test('normalizeSpace 收掉各种空白', () => {
  assert.equal(normalizeSpace('  a \u00a0 b \u3000 c  '), 'a b c')
  assert.equal(wordCount('one two three'), 3)
})

test('similarity 落在 0–1 且明显句子不判成相似', () => {
  const same = similarity('I need coffee now', 'I need coffee now')
  const other = similarity('I need coffee now', 'Where did the money go?')
  assert.equal(same, 1)
  assert.ok(other < 0.5, `不同句子居然相似度 ${other}`)
})

// ── 学习区只认成品包 ─────────────────────────────────────────────────────────

const finishedExample = {
  ord: 1,
  sentence: 'We had to abandon the car in the snow.',
  image: { file: 'images/commons-34958284bf84a30c8729.jpg' },
  imageReview: { by: '本机用户', at: '2026-10-29T12:00:00.000Z', candidates: 9, picked: 'a-1-1.jpg' },
  audio: { file: 'audio/edge-1587b6105fb7f373b0dc.mp3', seconds: 2.74 },
  audioReview: { by: '本机用户', at: '2026-10-29T12:00:01.000Z', listened: true },
}

test('打包完、图音齐的包才能拿去练', () => {
  const pack = { status: 'packed', examples: [finishedExample] }
  assert.equal(isLearnable(pack), true)
  assert.equal(isLearnable({ ...pack, status: 'exported' }), true)
})

test('还在制卡的包不进学习区', () => {
  assert.equal(isLearnable({ status: 'media', examples: [finishedExample] }), false)
  assert.equal(isLearnable({ status: 'text', examples: [finishedExample] }), false)
  assert.equal(isLearnable({ status: 'generating', examples: [] }), false)
  assert.equal(isLearnable({ status: 'failed', examples: [finishedExample] }), false)
})

test('有文件但没人点过头 / 没人听过，也不算成品', () => {
  const noImageReview = { status: 'packed', examples: [{ ...finishedExample, imageReview: null }] }
  const noAudioReview = { status: 'packed', examples: [{ ...finishedExample, audioReview: { by: 'x', at: 'y', listened: false } }] }
  assert.equal(isLearnable(noImageReview), false)
  assert.equal(isLearnable(noAudioReview), false)
})

test('缺一张图或缺一条音就整包不算成品', () => {
  const noImage = { status: 'packed', examples: [finishedExample, { ...finishedExample, ord: 2, image: null }] }
  const noAudio = { status: 'packed', examples: [finishedExample, { ...finishedExample, ord: 2, audio: { file: '', seconds: 0 } }] }
  const zeroLength = { status: 'packed', examples: [{ ...finishedExample, audio: { file: 'audio/x.mp3', seconds: 0 } }] }
  assert.equal(isLearnable(noImage), false)
  assert.equal(isLearnable(noAudio), false)
  assert.equal(isLearnable(zeroLength), false)
  assert.equal(isLearnable({ status: 'packed', examples: [] }), false)
  assert.equal(isLearnable(null), false)
})

