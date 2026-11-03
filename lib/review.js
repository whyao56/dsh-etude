import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { reviewFile } from './paths.js'
import { FactoryError } from './util.js'

/**
 * 复习记录 + 调度。
 *
 * 这一块以前完全没有，所以学习页那四个评分键只能写「未接调度」、统计页的
 * 复习/保留率/间隔分布全是空卡。现在补上，口径是**能算的才算**：
 *
 * - 每张卡按「包 + 例句」记一条，字段只有实际会用到的那几个
 *   （ease / interval 天 / due 时间戳 / reps / lapses / 上次评分）。
 * - 调度用 SM-2 的简化版：四档评分 1–4，ease 在 1.3–2.8 之间挪动，
 *   间隔按 ease 相乘。**故意不追 SM-2 原版的公式**——原版的分档是 0–5，
 *   界面上只有四档，硬套会出现「点了良好反而变短」这种反直觉结果。
 * - 记录是追加日志，不覆盖。统计页的保留率、间隔分布、逐小时都从日志算，
 *   这样「上周答对多少」这种问题是可回溯的，而不是靠一堆计数器。
 *
 * 写盘跟账本一样：临时文件 + rename，失败最多丢这一次记录。
 */

const DAY = 24 * 60 * 60 * 1000

/** 新卡第一次评分时给的天数，跟界面上那四个键写的字一致。 */
const FIRST_INTERVAL = { 1: 0, 2: 3, 3: 8, 4: 15 }
/** 重来 1 分钟：新卡的「重来」不该排到明天。 */
const RELEARN_MINUTES = 1

const EASE_START = 2.5
const EASE_MIN = 1.3
const EASE_MAX = 2.8
const EASE_DELTA = { 1: -0.2, 2: -0.15, 3: 0, 4: 0.15 }

export const GRADES = {
  1: '重来',
  2: '困难',
  3: '良好',
  4: '简单',
}

export function emptyReview() {
  return { version: 1, cards: {}, log: [] }
}

export function cardKey(packId, exampleId) {
  return `${packId}:${exampleId}`
}

export function clampGrade(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 1 || n > 4) {
    throw new FactoryError('评分只能是 1–4（重来 / 困难 / 良好 / 简单）。', 'bad-grade')
  }
  return n
}

/**
 * 算出下一次排到哪天。
 * @param {{ease:number, interval:number, reps:number}|null} before 之前的调度状态
 * @param {number} grade 1–4
 * @param {number} now 时间戳
 */
export function nextSchedule(before, grade, now = Date.now()) {
  const prev = before && Number.isFinite(before.interval) ? before : null
  const ease = Math.min(
    EASE_MAX,
    Math.max(EASE_MIN, (prev ? Number(prev.ease) || EASE_START : EASE_START) + EASE_DELTA[grade]),
  )
  const reps = (prev ? Number(prev.reps) || 0 : 0) + 1
  const lapses = (prev ? Number(prev.lapses) || 0 : 0) + (grade === 1 ? 1 : 0)

  let interval // 天
  if (!prev || !prev.interval) {
    // 第一次练这张卡：直接用界面写的那四个数
    interval = FIRST_INTERVAL[grade]
  } else if (grade === 1) {
    interval = 0 // 走分钟级重学
  } else if (grade === 2) {
    interval = Math.max(1, Math.round(prev.interval * 1.2))
  } else if (grade === 3) {
    interval = Math.max(1, Math.round(Math.max(prev.interval, 1) * ease))
  } else {
    interval = Math.max(1, Math.round(Math.max(prev.interval, 1) * ease * 1.3))
  }
  // 刚学会的东西不该一下跳到几十天后：前三次封顶，之后就交给 ease
  if (reps <= 3 && interval > 15) interval = 15

  const due = interval === 0 ? now + RELEARN_MINUTES * 60 * 1000 : now + interval * DAY
  return { ease, interval, reps, lapses, grade, due, lastAt: now }
}

async function readReview(root) {
  const path = reviewFile(root)
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyReview()
    throw new FactoryError(`读不了复习记录：${error.message}`, 'review-unreadable', { path })
  }
  try {
    const parsed = JSON.parse(raw)
    const out = emptyReview()
    if (parsed && typeof parsed === 'object') {
      if (parsed.cards && typeof parsed.cards === 'object') out.cards = parsed.cards
      if (Array.isArray(parsed.log)) out.log = parsed.log
    }
    return out
  } catch (error) {
    // 坏就坏着，别把整个面板卡死：重建一份空的，原文件改名留证。
    throw new FactoryError(
      `复习记录坏了（${path}）：${error.message}。把它删掉就重新开始记。`,
      'review-corrupt',
      { path },
    )
  }
}

async function writeReview(root, data) {
  const path = reviewFile(root)
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tmp, path)
}

/**
 * 记一次评分。
 * @returns {Promise<{ card: any, intervalText: string }>}
 */
export async function submitReview(root, { packId, exampleId, grade, face, now = Date.now() }) {
  const key = cardKey(packId, exampleId)
  const data = await readReview(root)
  const before = data.cards[key] || null
  const next = nextSchedule(before, clampGrade(grade), now)
  data.cards[key] = next
  data.log.push({
    at: now,
    packId,
    exampleId,
    face: face || 'read',
    grade: next.grade,
    interval: next.interval,
    ease: Number(next.ease.toFixed(3)),
    due: next.due,
  })
  // 日志只留最近 5000 条：统计页最远看一年，再多也没人看
  if (data.log.length > 5000) data.log = data.log.slice(-5000)
  await writeReview(root, data)
  return { card: { ...next, key }, intervalText: intervalText(next) }
}

/** 界面上那句「良好 8 天」要跟着真实间隔走。 */
export function intervalText(card) {
  if (!card || !card.interval) return '1 分钟'
  if (card.interval < 1) return '1 分钟'
  if (card.interval < 30) return `${card.interval} 天`
  const months = Math.round(card.interval / 30)
  return months < 12 ? `${months} 个月` : `${Math.round(card.interval / 365)} 年`
}

/** 到期待复习的数量。只看记录本身（key 就是 packId:exampleId），不需要账本。 */
export async function dueSummary(root, now = Date.now()) {
  const data = await readReview(root)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  const todayEnd = endOfToday.getTime()

  let due = 0
  let overdue = 0
  const byPack = {}
  const cards = Object.values(data.cards)
  for (const card of cards) {
    if (!card || !Number.isFinite(card.due)) continue
    if (card.due <= todayEnd) {
      due += 1
      if (card.due < now) overdue += 1
    }
  }
  for (const key of Object.keys(data.cards)) {
    const packId = key.split(':')[0]
    const card = data.cards[key]
    if (card && card.due <= todayEnd) byPack[packId] = (byPack[packId] || 0) + 1
  }
  return { due, overdue, started: cards.length, reviews: data.log.length, byPack }
}

/**
 * 统计页要的那些数，全部从日志算。
 * 算不出来的（比如从没练过）就返回 0 / 空数组，让界面能如实说「还没有」。
 */
export async function reviewStats(root, now = Date.now()) {
  const data = await readReview(root)
  const cards = Object.values(data.cards)
  const log = data.log

  const reviews = log.length
  const daily = []
  for (let i = 13; i >= 0; i -= 1) {
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const start = dayStart.getTime() - i * DAY
    const end = start + DAY
    daily.push({ at: start, count: log.filter((one) => one.at >= start && one.at < end).length })
  }

  // 保留率按「间隔档」分桶：1 天 / 2–7 / 8–30 / 31–90 / 90+
  const buckets = [
    { label: '1 天', min: 0, max: 1 },
    { label: '2–7 天', min: 1, max: 7 },
    { label: '8–30 天', min: 7, max: 30 },
    { label: '31–90 天', min: 30, max: 90 },
    { label: '90 天以上', min: 90, max: Infinity },
  ]
  const retention = buckets.map((bucket) => {
    const rows = log.filter((one) => one.interval > bucket.min && one.interval <= bucket.max)
    const passed = rows.filter((one) => one.grade >= 3).length
    return {
      label: bucket.label,
      reviews: rows.length,
      passed,
      rate: rows.length ? Math.round((passed / rows.length) * 1000) / 10 : null,
    }
  })

  // 间隔分布（天），给直方图
  const intervalHistogram = [
    { label: '1', max: 1 },
    { label: '2–3', max: 3 },
    { label: '4–7', max: 7 },
    { label: '8–14', max: 14 },
    { label: '15–30', max: 30 },
    { label: '31–90', max: 90 },
    { label: '90+', max: Infinity },
  ].map((bucket) => ({
    label: bucket.label,
    count: cards.filter((one) => one.interval >= 1 && one.interval <= bucket.max).length,
  }))

  // 逐小时（0–23）
  const hourly = Array.from({ length: 24 }, (unused, hour) => ({ hour, count: 0 }))
  for (const one of log) {
    const hour = new Date(one.at).getHours()
    hourly[hour].count += 1
  }

  // 四档各点了几次
  const byGrade = [1, 2, 3, 4].map((grade) => ({
    grade,
    label: GRADES[grade],
    count: log.filter((one) => one.grade === grade).length,
  }))

  const avgEase = cards.length
    ? Math.round((cards.reduce((sum, one) => sum + (Number(one.ease) || 0), 0) / cards.length) * 100) / 100
    : null

  return {
    reviews,
    cards: cards.length,
    daily,
    retention,
    intervalHistogram,
    hourly,
    byGrade,
    avgEase,
    easeDistribution: avgEase === null ? [] : easyBuckets(cards),
  }
}

function easyBuckets(cards) {
  const buckets = [
    { label: '1.3–1.7', min: 1.3, max: 1.7 },
    { label: '1.7–2.1', min: 1.7, max: 2.1 },
    { label: '2.1–2.5', min: 2.1, max: 2.5 },
    { label: '2.5–2.8', min: 2.5, max: 2.81 },
  ]
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: cards.filter((one) => one.ease >= bucket.min && one.ease < bucket.max).length,
  }))
}

/** 详情页要「这张卡什么时候再出现」。 */
export async function cardState(root, packId, exampleId) {
  const data = await readReview(root)
  return data.cards[cardKey(packId, exampleId)] || null
}

/** 最近几条记录，详情页的「最近七次」用它（不再编日期）。 */
export async function recentReviews(root, packId, limit = 7) {
  const data = await readReview(root)
  return data.log
    .filter((one) => one.packId === packId)
    .slice(-limit)
    .reverse()
}

/** 测试用：把整个文件读出来 / 写回去。 */
export const __testing = { readReview, writeReview }
