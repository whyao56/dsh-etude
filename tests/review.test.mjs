import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  cardKey,
  clampGrade,
  dueSummary,
  emptyReview,
  intervalText,
  nextSchedule,
  recentReviews,
  reviewStats,
  submitReview,
} from '../lib/review.js'
import { reviewFile } from '../lib/paths.js'

const NOW = Date.UTC(2026, 10, 3, 4, 0, 0) // 2026-11-03 12:00 +08:00
const DAY = 24 * 60 * 60 * 1000

async function withRoot(fn) {
  const root = await mkdtemp(join(tmpdir(), 'etude-review-'))
  try {
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('评分只能是 1–4', () => {
  assert.equal(clampGrade(1), 1)
  assert.equal(clampGrade('3'), 3)
  assert.equal(clampGrade(4.4), 4)
  assert.throws(() => clampGrade(0), /评分只能是/)
  assert.throws(() => clampGrade(5), /评分只能是/)
  assert.throws(() => clampGrade('abc'), /评分只能是/)
})

test('新卡四个档位排出来的天数跟界面写的一致', () => {
  const cases = [
    [1, 0, '1 分钟'],
    [2, 3, '3 天'],
    [3, 8, '8 天'],
    [4, 15, '15 天'],
  ]
  for (const [grade, days, text] of cases) {
    const next = nextSchedule(null, grade, NOW)
    assert.equal(next.interval, days, `grade ${grade}`)
    assert.equal(intervalText(next), text, `grade ${grade}`)
  }
})

test('重来排到 1 分钟后，不是明天', () => {
  const next = nextSchedule({ ease: 2.5, interval: 10, reps: 4, lapses: 0 }, 1, NOW)
  assert.equal(next.interval, 0)
  assert.equal(next.due, NOW + 60 * 1000)
  assert.equal(next.lapses, 1)
})

test('ease 落在 1.3–2.8 之间，点简单会升、点重来会降', () => {
  let card = { ease: 2.5, interval: 8, reps: 3, lapses: 0 }
  const up = nextSchedule(card, 4, NOW)
  assert.ok(up.ease > card.ease)
  const down = nextSchedule(card, 1, NOW)
  assert.ok(down.ease < card.ease)

  let ease = 2.5
  for (let i = 0; i < 40; i += 1) ease = nextSchedule({ ease, interval: 8, reps: 9 }, 4, NOW).ease
  assert.ok(ease <= 2.8, `上限应被夹住，实际 ${ease}`)

  let floor = 2.5
  for (let i = 0; i < 40; i += 1) floor = nextSchedule({ ease: floor, interval: 8, reps: 9 }, 1, NOW).ease
  assert.ok(floor >= 1.3, `下限应被夹住，实际 ${floor}`)
})

test('后一次良好一定比前一次长（不会越点越短）', () => {
  let card = null
  let last = 0
  for (let i = 0; i < 5; i += 1) {
    card = nextSchedule(card, 3, NOW)
    assert.ok(card.interval >= last, `第 ${i + 1} 次变小了：${last} → ${card.interval}`)
    last = card.interval
  }
})

test('前三次封顶 15 天，之后放开', () => {
  let card = null
  for (let i = 0; i < 3; i += 1) card = nextSchedule(card, 4, NOW)
  assert.ok(card.interval <= 15)
  for (let i = 0; i < 6; i += 1) card = nextSchedule(card, 4, NOW)
  assert.ok(card.interval > 15)
})

test('写进去、读出来、统计能算', async () => {
  await withRoot(async (root) => {
    const packId = 'abcdef0123456789'
    const first = await submitReview(root, { packId, exampleId: 'e1', grade: 3, face: 'read', now: NOW })
    assert.equal(first.card.interval, 8)
    assert.equal(first.intervalText, '8 天')

    await submitReview(root, { packId, exampleId: 'e2', grade: 1, face: 'listen', now: NOW + 1000 })
    await submitReview(root, { packId, exampleId: 'e1', grade: 4, face: 'type', now: NOW + 2000 })

    const raw = JSON.parse(await readFile(reviewFile(root), 'utf8'))
    assert.equal(Object.keys(raw.cards).length, 2)
    assert.equal(raw.log.length, 3)
    assert.ok(raw.cards[cardKey(packId, 'e1')].reps >= 2)

    const stats = await reviewStats(root, NOW + 3000)
    assert.equal(stats.reviews, 3)
    assert.equal(stats.cards, 2)
    assert.equal(stats.daily.length, 14)
    assert.equal(stats.hourly.length, 24)
    assert.equal(stats.byGrade.reduce((n, one) => n + one.count, 0), 3)
    assert.ok(stats.avgEase !== null)
  })
})

test('到期统计：今天到期的算 due，已经过点的算 overdue', async () => {
  await withRoot(async (root) => {
    const packId = 'aaaaaaaaaaaaaaaa'
    await submitReview(root, { packId, exampleId: 'e1', grade: 3, now: NOW })
    // e1 排到 8 天后
    const soon = await dueSummary(root, NOW + 1000)
    assert.equal(soon.due, 0)
    assert.equal(soon.started, 1)
    const later = await dueSummary(root, NOW + 9 * DAY)
    assert.equal(later.due, 1)
    assert.equal(later.overdue, 1)
    assert.equal(later.byPack[packId], 1)
  })
})

test('最近几条记录按时间倒序，只给这个包的', async () => {
  await withRoot(async (root) => {
    await submitReview(root, { packId: 'p1', exampleId: 'e1', grade: 3, now: NOW })
    await submitReview(root, { packId: 'p2', exampleId: 'e9', grade: 2, now: NOW + 10 })
    await submitReview(root, { packId: 'p1', exampleId: 'e2', grade: 4, now: NOW + 20 })
    const rows = await recentReviews(root, 'p1', 7)
    assert.equal(rows.length, 2)
    assert.ok(rows[0].at > rows[1].at)
  })
})

test('空账本能读，不抛', async () => {
  await withRoot(async (root) => {
    const stats = await reviewStats(root, NOW)
    assert.equal(stats.reviews, 0)
    assert.equal(stats.avgEase, null)
    const due = await dueSummary(root, NOW)
    assert.deepEqual(due, { due: 0, overdue: 0, started: 0, reviews: 0, byPack: {} })
    assert.deepEqual(emptyReview().cards, {})
  })
})
