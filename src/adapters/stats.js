/* stats · 统计页接真账本
 *
 * 设计稿这一页有 11 张卡。数据分三个来源：
 *   · 账本（state.packs）：包数、例句数、配图齐、语音齐、能出厂、按 status 的分布、
 *     按 createdAt 分到最近 14 天、正在跑的任务、自检、目录与版本
 *     → 「规模」（原「今天」）、「卡片数量」、「新增」三张卡。
 *   · 复习日志（api.rpc('review.stats')，见 lib/review.js 的 reviewStats）：
 *     daily / retention / intervalHistogram / hourly / byGrade / avgEase / easeDistribution
 *     → 「复习」「记忆保留率」「复习间隔」「逐小时分析」「回答按钮」「卡片简易度」六张卡用真数。
 *   · state.review（lib/review.js 的 dueSummary）：due / overdue / started / reviews
 *     → 「预测」那张卡画不出排期，但 .sums 四个格子填真数。
 *
 * 还是画不出来的只有两张：「预测」要未来每天的排期（后端只记到期时刻，没有排期分布）、
 * 「日程表」要最近半年的每日记录（daily 只给 14 天）。这两张不编柱子，写清缺什么。
 *
 * 空态分两种，说法不一样：
 *   · reviews === 0：不是加载失败，是一次都没练过 —— 说清「练一次就有了」。
 *   · review.stats 拿不到（预览里假 rpc 回 {}、或接口还没上）：写「还不知道」，不写 0。
 *
 * 硬规矩：只改现有节点的值（textContent / setAttribute / style），不新增 SVG 元素、
 * 不重排结构；找不到锚点就 console.warn 跳过，绝不抛错。宿主每拿到新 state 就调一次，
 * 所以每个函数都先拆上一轮插的节点再插，重复调用不会越堆越多。
 */
window.__ETUDE_APPLY__ = function (state, api) {
  try {
    apply(state, api)
  } catch (error) {
    // 适配器挂掉不该让整页白屏：宿主会收到 apply-error，这里只留一行日志
    console.warn('[etude/stats] 适配器出错，页面按设计稿原样留着', error)
  }
}

function apply(state, api) {
  if (!state || state.status !== 'ready') {
    const line = document.querySelector('#s-today .takeaway')
    if (line) {
      line.textContent =
        state && state.status === 'error'
          ? '账本读不出来，去「设置」页看自检那几条。'
          : '账本还在读，等一下。'
    }
    return
  }

  const packs = Array.isArray(state.packs) ? state.packs : []
  const nums = countPacks(packs)

  scaleCard(state, nums)
  statusCard(nums)
  addedCard(nums)
  reviewCards(state, api)
  hideFakeControls()
}

/* ---------------------------------------------------------------- 小工具 */

function q(selector, root) {
  return (root || document).querySelector(selector)
}

function qa(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector))
}

function miss(what) {
  console.warn('[etude/stats] 页面上找不到 ' + what + '，跳过')
}

/** 改文字；找不到就 warn，不抛错 */
function setText(node, value) {
  if (!node) return null
  node.textContent = value
  return node
}

function setAttr(node, name, value) {
  if (!node) return
  try {
    node.setAttribute(name, value)
  } catch (error) {
    console.warn('[etude/stats] 改属性 ' + name + ' 失败', error)
  }
}

function hide(target, root) {
  const node = typeof target === 'string' ? q(target, root) : target
  if (!node) {
    if (typeof target === 'string') miss(target)
    return null
  }
  node.style.display = 'none'
  return node
}

/** 上一轮藏过的东西这一轮要露出来（宿主会反复推 state） */
function show(target, root) {
  const node = typeof target === 'string' ? q(target, root) : target
  if (!node) return null
  node.style.display = ''
  return node
}

function startOfDay(stamp) {
  const date = new Date(stamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** y 轴上限用的「好看的最大值」：1 / 2 / 5 / 10，再大就取 5 的整数倍 */
function niceMax(value) {
  if (!(value > 0)) return 1
  if (value <= 1) return 1
  if (value <= 2) return 2
  if (value <= 5) return 5
  if (value <= 10) return 10
  return Math.ceil(value / 5) * 5
}

/** 账本里一共多少东西。全部来自 packs[].progress（lib/store.js 的 packProgress） */
function countPacks(packs) {
  const out = {
    packs: packs.length,
    examples: 0,
    images: 0,
    audios: 0,
    learnable: 0,
    done: 0,
    dated: 0,
    status: {},
    buckets: new Array(14).fill(0),
  }
  const KNOWN = ['text', 'generating', 'media', 'packed', 'exported', 'failed']
  packs.forEach((pack) => {
    if (!pack) return
    const progress = pack.progress || {}
    out.examples += Number(progress.total) || 0
    out.images += Number(progress.images) || 0
    out.audios += Number(progress.audios) || 0
    if (progress.done) out.done += 1
    if (pack.learnable === true) out.learnable += 1

    const status = String(pack.status || '')
    if (KNOWN.indexOf(status) >= 0) out.status[status] = (out.status[status] || 0) + 1
    else if (status) console.warn('[etude/stats] 不认识的状态：' + status)

    // 最近 14 天，按本地日期分桶：0 = 13 天前，13 = 今天
    const stamp = Date.parse(pack.createdAt || '')
    if (isFinite(stamp)) {
      out.dated += 1
      const index = 13 - Math.round((startOfDay(Date.now()) - startOfDay(stamp)) / 86400000)
      if (index >= 0 && index < 14) out.buckets[index] += 1
    }
  })
  return out
}

/** 自检在真宿主是 { checks:[…] }，在预览里是数组，两种都吃 */
function checksOf(state) {
  const raw = state && state.selfcheck
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.checks)) return raw.checks
  return []
}

/* ------------------------------------------------- 规模卡（原「今天」卡） */

function scaleCard(state, nums) {
  const card = document.getElementById('s-today')
  if (!card) return miss('#s-today')

  setText(q('.shead2 .stitle', card), '规模')
  setText(
    q('.shead2 .smut', card),
    nums.packs + ' 个包 · ' + nums.examples + ' 条例句 · ' + nums.learnable + ' 个能出厂',
  )

  // 原图是「今天每小时练了几次」—— 账本里没有作答时间，藏起来，不留假柱子
  hide('.chartbox', card)

  // 五个数用设计稿自己的 .sums 排版（不用新 CSS）。幂等：先拆上一轮插的。
  const old = document.getElementById('etude-scale-sums')
  if (old && old.parentNode) old.parentNode.removeChild(old)

  const sums = document.createElement('div')
  sums.className = 'sums'
  sums.id = 'etude-scale-sums'
  ;[
    ['包', nums.packs],
    ['例句', nums.examples],
    ['配图齐', nums.images],
    ['语音齐', nums.audios],
    ['能出厂', nums.learnable],
  ].forEach((pair) => {
    const cell = document.createElement('div')
    const label = document.createElement('span')
    label.className = 'mut'
    label.textContent = pair[0]
    const value = document.createElement('b')
    value.textContent = String(pair[1])
    cell.appendChild(label)
    cell.appendChild(value)
    sums.appendChild(cell)
  })

  const takeaway = q('.takeaway', card)
  if (takeaway) card.insertBefore(sums, takeaway)
  else card.appendChild(sums)

  if (!takeaway) return miss('#s-today .takeaway')

  // 口径 + 环境 + 自检 + 正在跑的任务：这四样账本里有，写实
  const checks = checksOf(state)
  const ok = checks.filter((one) => one && one.ok).length
  const jobs = Array.isArray(state.jobs) ? state.jobs : []
  const parts = []
  parts.push('配图齐 / 语音齐 按你挑过图的例句、听过音频的例句算；能出厂要求两样全齐且已打包。')
  if (nums.done && nums.done !== nums.learnable) {
    parts.push('另有 ' + (nums.done - nums.learnable) + ' 个素材齐了但状态还没到能出厂。')
  }
  parts.push('账本在 ' + (state.root || '（宿主没给目录）') + '，版本 ' + (state.version || '?') + '。')
  parts.push(checks.length ? '自检 ' + ok + '/' + checks.length + ' 项通过。' : '自检还没跑。')
  parts.push(
    jobs.length
      ? '现在跑着 ' + jobs.length + ' 个任务：' + jobs.map((one) => one.label || one.kind || '任务').join('、') + '。'
      : '现在没有任务在跑。',
  )
  setText(takeaway, parts.join(''))
}

/* ------------------------------------------- 卡片数量（环图 + 图例）按状态 */

function statusCard(nums) {
  const card = document.getElementById('s-counts')
  if (!card) return miss('#s-counts')

  // 设计稿的 5 段环、7 行图例，这里只留账本真有的 5 种状态，
  // 顺序照设计稿的 class 走：c1 c3 c4 c6 c7
  const rows = [
    { label: '造例句', count: (nums.status.text || 0) + (nums.status.generating || 0) },
    { label: '配素材', count: nums.status.media || 0 },
    { label: '上次出错', count: nums.status.failed || 0 },
    { label: '能出厂', count: nums.status.packed || 0 },
    { label: '已导出', count: nums.status.exported || 0 },
  ]
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  // 环的周长：设计稿 r=85；弧与弧之间留 2.4 的缝（照设计稿的数值反推出来的）
  const CIRCLE = 2 * Math.PI * 85
  const GAP = 2.4
  const arcs = qa('.donut .dspin circle.dc', card)
  const legend = qa('.legend > li', card).filter((one) => !one.classList.contains('tot'))

  let walked = 0
  rows.forEach((row, index) => {
    const share = total ? (row.count / total) * CIRCLE : 0
    const dash = row.count ? Math.max(0, share - GAP) : 0
    const percent = total ? Math.round((row.count / total) * 100) : 0

    const arc = arcs[index]
    if (arc) {
      setAttr(arc, 'stroke-dasharray', dash.toFixed(2) + ' ' + (CIRCLE - dash).toFixed(2))
      setAttr(arc, 'stroke-dashoffset', (-walked).toFixed(2))
      const tip = row.label + ' · ' + row.count + ' 个 (' + percent + '%)'
      setAttr(arc, 'data-tip', tip)
      setText(q('title', arc), tip)
    } else {
      miss('环图第 ' + (index + 1) + ' 段')
    }

    const li = legend[index]
    if (li) {
      setText(q('span', li), row.label)
      setText(q('b', li), String(row.count))
      setText(q('span.mut', li), percent + '%')
      li.style.display = ''
    } else {
      miss('图例第 ' + (index + 1) + ' 行')
    }

    walked += share
  })

  // 后两行是「已暂停 / 已搁置」，Anki 的卡面状态，账本里没有这两个字段
  for (let index = rows.length; index < legend.length; index += 1) legend[index].style.display = 'none'

  const tot = q('.legend > li.tot', card)
  if (tot) {
    setText(q('b', tot), String(total))
    const muts = qa('span.mut', tot)
    if (muts.length > 1) setText(muts[muts.length - 1], total ? '100%' : '0%')
  } else {
    miss('.legend li.tot')
  }

  setText(q('.donut-big', card), String(total))
  setText(q('.donut-label', card), '个包 · 全部')
  setText(q('.shead2 .smut', card), '按包算 · ' + total + ' 个')

  const takeaway = q('.takeaway', card)
  if (!takeaway) {
    miss('#s-counts .takeaway')
    return
  }
  if (!total) {
    takeaway.textContent = '账本里还没有包。去「卡片」页造第一个，这里就有环了。'
    return
  }
  const parts = [
    '账本里 ' +
      total +
      ' 个包：造例句 ' +
      rows[0].count +
      '、配素材 ' +
      rows[1].count +
      '、能出厂 ' +
      rows[3].count +
      '、已导出 ' +
      rows[4].count +
      '。',
    '能出厂＝每条例句的图都挑过、语音都听过。',
  ]
  if (rows[2].count) parts.push('有 ' + rows[2].count + ' 个上次出错，去「卡片」页看那一行的提示。')
  takeaway.textContent = parts.join('')
}

/* ------------------------------------------------- 新增：最近 14 天，按天分桶 */

function addedCard(nums) {
  const card = document.getElementById('s-added')
  if (!card) return miss('#s-added')
  const svg = q('#box-added svg', card)
  if (!svg) return miss('#box-added 里的图')

  const DAYS = 14
  const BASE = 148 // 设计稿的基线 y
  const TOP = 14 // 设计稿里最大值那个点落在的 y
  const WIDE = 584 // 设计稿画区宽（x 从 0 到 584）
  const step = WIDE / (DAYS - 1)

  const values = nums.buckets
  const maxValue = niceMax(Math.max.apply(null, values))
  const yOf = (value) => BASE - ((BASE - TOP) * value) / maxValue
  const xs = values.map((value, index) => Number((index * step).toFixed(1)))

  // 起点的日期：0 号桶是 13 天前
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOf = (index) => {
    const date = new Date(today.getTime())
    date.setDate(date.getDate() - (DAYS - 1 - index))
    return date.getMonth() + 1 + '/' + date.getDate()
  }
  const sum = values.reduce((one, two) => one + two, 0)

  // 两条 path 只改 d：面积闭合到基线，折线穿所有点
  const points = xs.map((x, index) => x + ' ' + yOf(values[index]).toFixed(1))
  setAttr(q('path.line2', svg), 'd', 'M' + points.join(' L'))
  setAttr(
    q('path.area2', svg),
    'd',
    'M' + xs[0] + ' ' + BASE + ' L' + points.join(' L') + ' L' + xs[DAYS - 1] + ' ' + BASE + ' Z',
  )

  // 设计稿画了 30 天（30 对圆点），我们只画 14 天：
  // 前 14 对挪到新位置，后面 16 对藏掉 —— 不删节点，宿主重推 state 时还要用。
  const dots = qa('circle.adot', svg)
  const hits = qa('circle.ahit', svg)
  values.forEach((value, index) => {
    const tip = dayOf(index) + ' · ' + value + ' 个包'
    const cy = yOf(value).toFixed(1)
    ;[dots[index], hits[index]].forEach((node) => {
      if (!node) return
      setAttr(node, 'cx', String(xs[index]))
      setAttr(node, 'cy', cy)
      node.style.display = ''
    })
    if (hits[index]) {
      setAttr(hits[index], 'data-tip', tip)
      setText(q('title', hits[index]), tip)
    }
  })
  for (let index = DAYS; index < dots.length; index += 1) {
    if (dots[index]) dots[index].style.display = 'none'
    if (hits[index]) hits[index].style.display = 'none'
  }

  // x 轴 6 个刻度均分 14 天；y 轴三格按真实最大值换算
  const ticks = qa('text.tx', svg).filter((node) => !node.classList.contains('ty'))
  ticks.forEach((node, index) => {
    const bucket = Math.round((index * (DAYS - 1)) / (ticks.length - 1 || 1))
    setAttr(node, 'x', String(xs[bucket]))
    setText(node, dayOf(bucket))
  })
  const axis = qa('text.tx.ty', svg)
  if (axis.length === 3) {
    setText(axis[0], String(maxValue))
    setText(axis[1], String(maxValue / 2))
    setText(axis[2], '0')
  } else {
    miss('新增卡的 y 轴刻度')
  }

  setText(q('.shead2 .smut', card), '最近 14 天进了 ' + sum + ' 个包')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-added .takeaway')
  if (sum) {
    takeaway.textContent =
      '最近 14 天进了 ' + sum + ' 个包，按创建时间分到天。这一页只算包，不算句数。'
  } else if (nums.dated) {
    takeaway.textContent = '最近 14 天没有新包，所以这条线是平的。之前造的包都在 14 天以前。'
  } else {
    takeaway.textContent = '最近 14 天没有新包。账本里这几个包没带创建时间，下次新建的包才会落在这条线上。'
  }
}

/* ------------------------------------- 复习那 8 张：review.stats 的真数 */

const BAR_BASE = 148 // 柱状图基线（设计稿每张柱图都一样）
const BAR_TOP = 14 // 最大值的柱顶落在的 y

const REVIEW_CARDS = [
  's-forecast',
  's-heat',
  's-reviews',
  's-intervals',
  's-ease',
  's-retention',
  's-hourly',
  's-buttons',
]

/** 一次都没练过：这不是加载失败 */
const TIP_EMPTY =
  '不是加载失败 —— 账本里一次复习都还没有，所以这几张图还空着。练一次就有了：去「卡片」页随便练一句、给个评分，再回这页看。'

/** 接口没回数（预览里的假 rpc 回的是 {}）：说不知道，不拿 0 冒充 */
const TIP_UNKNOWN =
  '复习记录还没读出来。可能是一次都没练过，也可能是 review.stats 这条还没接上；练过一次、接口通了，这里就有数。'

/** 只从 state.review 拿到总数，明细没回来 */
const TIP_PARTIAL = '复习明细还没读出来，现在只拿得到总数。每天几次、间隔分布、通过率要等 review.stats 回话。'

/** 要复习的数和到期明细全从 state.review（dueSummary）来 */
function hostNumbers(host) {
  const num = (value) => (typeof value === 'number' && isFinite(value) ? value : null)
  return {
    reviews: num(host && host.reviews),
    due: num(host && host.due),
    overdue: num(host && host.overdue),
    started: num(host && host.started),
  }
}

/** 预览环境回 {}、旧宿主没有 review.stats：这些都不算「有数」 */
function normalizeStats(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.reviews !== 'number' || !isFinite(raw.reviews)) return null
  const rows = (value) => (Array.isArray(value) ? value.filter((one) => one && typeof one === 'object') : [])
  return {
    reviews: raw.reviews,
    cards: typeof raw.cards === 'number' && isFinite(raw.cards) ? raw.cards : null,
    daily: rows(raw.daily),
    retention: rows(raw.retention),
    intervals: rows(raw.intervalHistogram),
    hourly: rows(raw.hourly),
    grades: rows(raw.byGrade),
    avgEase: typeof raw.avgEase === 'number' && isFinite(raw.avgEase) ? raw.avgEase : null,
    ease: rows(raw.easeDistribution),
  }
}

/** 拿 review.stats，回来以后按「有数 / 没练过 / 不知道」三选一画 */
function reviewCards(state, api) {
  const host = hostNumbers(state && state.review)
  const paint = (raw) => {
    try {
      const stats = normalizeStats(raw)
      if (stats && stats.reviews > 0) paintReviews(stats, host)
      else if (stats && stats.reviews === 0) quietCards(TIP_EMPTY, '还没练过')
      else if (host.reviews !== null && host.reviews > 0) paintPartial(host)
      else quietCards(TIP_UNKNOWN, '还没读到复习记录')
    } catch (error) {
      console.warn('[etude/stats] 复习那几张卡画到一半出错', error)
    }
  }

  if (!api || typeof api.rpc !== 'function') {
    miss('宿主的 api.rpc')
    paint(null)
    return
  }
  let pending
  try {
    pending = api.rpc('review.stats', {})
  } catch (error) {
    console.warn('[etude/stats] review.stats 调不动', error)
    paint(null)
    return
  }
  Promise.resolve(pending).then(paint, (error) => {
    console.warn('[etude/stats] review.stats 没回数，按「还不知道」写', error)
    try {
      paint(null)
    } catch (inner) {
      console.warn('[etude/stats] 空态也画不动', inner)
    }
  })
}

function paintReviews(stats, host) {
  reviewsCard(stats, host)
  retentionCard(stats)
  intervalsCard(stats)
  easeCard(stats)
  hourlyCard(stats)
  buttonsCard(stats)
  forecastCard(stats, host)
  heatCard(stats)
}

/** 只有 state.review 的总数：预测卡的四个格子照填，其余写「明细还没有」 */
function paintPartial(host) {
  quietCards(TIP_PARTIAL, '只读到总数')
  forecastCard(null, host)
}

/** 没数的时候：图藏掉、卡头写清是哪种空、底部一句话。不新增节点。 */
function quietCards(tip, smut) {
  REVIEW_CARDS.forEach((id) => {
    const card = document.getElementById(id)
    if (!card) return miss('#' + id)
    hide('.chartbox', card)
    hide('.sctls', card)
    hide('table.rt', card)
    hide('.sums', card)
    // 设计稿里那些示例数字一起抹掉：这张卡现在是空的，页面上不许留假数
    qa('table.rt tbody td', card).forEach((cell) => setText(cell, '—'))
    qa('.sums b', card).forEach((sum) => setText(sum, '—'))
    setText(q('.shead2 .smut', card), smut)
    const takeaway = q('.takeaway', card)
    if (!takeaway) return miss('#' + id + ' 的说明行')
    setText(takeaway, tip)
  })
}

/* ------------------------------------------------------------ 画柱子 */

function round2(value) {
  return String(Math.round(value * 100) / 100)
}

/**
 * 一根柱子：只改它自己的 d（圆角半径 4 照设计稿），不新增节点。
 * centerX 给了就把柱子整体挪到那个中心（逐小时卡要按小时排）。
 */
function paintBar(node, count, max, tip, centerX) {
  if (!node) return miss('柱子')
  const nums = String(node.getAttribute('d') || '').match(/-?[\d.]+/g)
  if (!nums || nums.length < 16) return miss('柱子的 d 认不出来')
  let x1 = Number(nums[0])
  let x2 = Number(nums[14])
  if (!isFinite(x1) || !isFinite(x2) || !(x2 > x1)) return miss('柱子的宽度认不出来')
  if (typeof centerX === 'number' && isFinite(centerX)) {
    const shift = centerX - (x1 + x2) / 2
    x1 += shift
    x2 += shift
  }
  const top = count > 0 ? BAR_BASE - ((BAR_BASE - BAR_TOP) * count) / max : BAR_BASE
  // 0 的柱不留高度（不然圆角会从基线下面拐一下，看着像负值）；柱子太矮时圆角也跟着收
  const r = count > 0
    ? Math.min(4, Math.max(0, (x2 - x1) / 2 - 0.5), Math.max(0, (BAR_BASE - top) / 2))
    : 0
  const d =
    'M' + round2(x1) + ' ' + BAR_BASE +
    ' L' + round2(x1) + ' ' + round2(top + r) +
    ' Q' + round2(x1) + ' ' + round2(top) + ' ' + round2(x1 + r) + ' ' + round2(top) +
    ' L' + round2(x2 - r) + ' ' + round2(top) +
    ' Q' + round2(x2) + ' ' + round2(top) + ' ' + round2(x2) + ' ' + round2(top + r) +
    ' L' + round2(x2) + ' ' + BAR_BASE + ' Z'
  setAttr(node, 'd', d)
  node.style.display = ''
  setAttr(node, 'data-tip', tip)
  setText(q('title', node), tip)
}

function dayLabel(stamp) {
  const date = new Date(Number(stamp))
  if (!isFinite(date.getTime())) return '—'
  return date.getMonth() + 1 + '/' + date.getDate()
}

function monthDay(stamp) {
  const date = new Date(Number(stamp))
  if (!isFinite(date.getTime())) return '还不知道'
  return date.getMonth() + 1 + '月' + date.getDate() + '日'
}

/** 档位标签里的上界：'2–3' → 3、'90+' → 90 */
function upperOf(label) {
  const nums = String(label).match(/\d+/g) || []
  return nums.length ? nums[nums.length - 1] : String(label)
}

function countWord(rows) {
  return rows.reduce((sum, one) => sum + (Number(one.count) || 0), 0)
}

/* ----------------------------------------- 复习：最近 N 天答了几次（面积图） */

function reviewsCard(stats, host) {
  const card = document.getElementById('s-reviews')
  if (!card) return miss('#s-reviews')
  show('.chartbox', card)
  const svg = q('#box-reviews svg', card)
  if (!svg) return miss('#box-reviews 里的图')

  const daily = stats.daily.filter((one) => isFinite(Number(one.count)) && isFinite(Number(one.at)))
  if (daily.length < 2) return miss('复习曲线的天')

  const BASE = BAR_BASE
  const TOP = BAR_TOP
  const WIDE = 584 // 设计稿画区宽（x 0 → 584）
  const DAYS = daily.length
  const step = WIDE / (DAYS - 1)
  const values = daily.map((one) => Number(one.count) || 0)
  const maxValue = niceMax(Math.max.apply(null, values))
  const yOf = (value) => BASE - ((BASE - TOP) * value) / maxValue
  const xs = values.map((unused, index) => Math.round(index * step * 10) / 10)
  const points = xs.map((x, index) => x + ' ' + yOf(values[index]).toFixed(1))

  setAttr(q('path.line2', svg), 'd', 'M' + points.join(' L'))
  setAttr(
    q('path.area2', svg),
    'd',
    'M' + xs[0] + ' ' + BASE + ' L' + points.join(' L') + ' L' + xs[DAYS - 1] + ' ' + BASE + ' Z',
  )

  // 设计稿画了 30 天，我们只画 daily 给的那几天：多出来的圆点藏掉，不删节点
  const dots = qa('circle.adot', svg)
  const hits = qa('circle.ahit', svg)
  daily.forEach((one, index) => {
    const value = values[index]
    const tip = dayLabel(one.at) + ' · ' + value + ' 次'
    const cy = yOf(value).toFixed(1)
    ;[dots[index], hits[index]].forEach((node) => {
      if (!node) return
      setAttr(node, 'cx', String(xs[index]))
      setAttr(node, 'cy', cy)
      node.style.display = ''
    })
    if (hits[index]) {
      setAttr(hits[index], 'data-tip', tip)
      setText(q('title', hits[index]), tip)
    }
  })
  for (let index = DAYS; index < dots.length; index += 1) {
    if (dots[index]) dots[index].style.display = 'none'
    if (hits[index]) hits[index].style.display = 'none'
  }

  const ticks = qa('text.tx', svg).filter((node) => !node.classList.contains('ty'))
  ticks.forEach((node, index) => {
    const bucket = Math.round((index * (DAYS - 1)) / (ticks.length - 1 || 1))
    node.style.display = ''
    setAttr(node, 'x', String(xs[bucket]))
    setText(node, dayLabel(daily[bucket].at))
  })
  const axis = qa('text.tx.ty', svg)
  if (axis.length === 3) {
    setText(axis[0], String(maxValue))
    setText(axis[1], String(maxValue / 2))
    setText(axis[2], '0')
  } else {
    miss('复习卡的 y 轴刻度')
  }

  const sum = values.reduce((one, two) => one + two, 0)
  const busy = values.filter((one) => one > 0).length
  const today = values[DAYS - 1]
  setText(q('.shead2 .smut', card), '最近 ' + DAYS + ' 天 · 共 ' + sum + ' 次回答')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-reviews .takeaway')
  const parts = ['最近 ' + DAYS + ' 天答了 ' + sum + ' 次，其中今天 ' + today + ' 次。']
  parts.push(busy ? '有 ' + busy + ' 天在练，' + (DAYS - busy) + ' 天一次没练。' : '这 ' + DAYS + ' 天一次都没练。')
  if (host.due !== null) {
    parts.push('现在有 ' + host.due + ' 张卡到期' + (host.overdue ? '（其中 ' + host.overdue + ' 张已经过期）' : '') + '。')
  } else {
    parts.push('到期张数还不知道：state.review 没给。')
  }
  parts.push('正确率那条线没画 —— 后端只有按天的次数，没有按天的正确率。')
  setText(takeaway, parts.join(''))
}

/* ----------------------------------------------- 记忆保留率：按间隔档的表 */

function retentionCard(stats) {
  const card = document.getElementById('s-retention')
  if (!card) return miss('#s-retention')
  show('table.rt', card)
  const table = q('table.rt', card)
  if (!table) return miss('#s-retention 的表')

  const buckets = stats.retention
  if (!buckets.length) return miss('保留率的分档')

  const head = qa('thead th', table)
  const HEAD = ['间隔', '答对', '答错', '通过率', '复习次数']
  HEAD.forEach((label, index) => setText(head[index], label))

  const rows = qa('tbody tr', table)
  buckets.forEach((one, index) => {
    const row = rows[index]
    if (!row) return miss('保留率第 ' + (index + 1) + ' 行')
    row.style.display = ''
    const reviews = Number(one.reviews) || 0
    const passed = Number(one.passed) || 0
    const rate = typeof one.rate === 'number' && isFinite(one.rate) ? one.rate : null
    setText(q('th', row), String(one.label || '—'))
    const cells = qa('td', row)
    setText(cells[0], String(passed))
    setText(cells[1], String(reviews - passed))
    // 一次都没练过的档位通过率是真不知道，写「—」不写 0%
    setText(cells[2], rate === null ? '—' : rate + '%')
    setText(cells[3], String(reviews))
  })
  for (let index = buckets.length; index < rows.length; index += 1) rows[index].style.display = 'none'

  const solid = buckets.filter((one) => Number(one.reviews) > 0 && typeof one.rate === 'number')
  setText(q('.shead2 .smut', card), '按间隔 5 档 · 通过＝良好或简单')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-retention .takeaway')
  if (!solid.length) {
    setText(takeaway, '复习间隔都不到 1 天，所以这张表还没有能比的长短。练几天再回来。')
    return
  }
  const first = solid[0]
  const last = solid[solid.length - 1]
  const parts = [
    '间隔 ' + first.label + '：' + first.rate + '% 通过（' + first.reviews + ' 次）。',
    '间隔 ' + last.label + '：' + last.rate + '% 通过（' + last.reviews + ' 次）。',
    solid.length > 1
      ? '差了 ' + Math.round(Math.abs(last.rate - first.rate) * 10) / 10 + ' 个百分点 —— 掉得越快，间隔该收得越短。'
      : '只有一档有记录，还比不出长短。',
    '空白格＝这一档一次都没复习过，不是 0%。',
  ]
  setText(takeaway, parts.join(''))
}

/* -------------------------------------------------- 复习间隔直方图（7 档） */

function intervalsCard(stats) {
  const card = document.getElementById('s-intervals')
  if (!card) return miss('#s-intervals')
  show('.chartbox', card)
  const svg = q('#box-intervals svg', card)
  if (!svg) return miss('#box-intervals 里的图')

  const bars = qa('path.bar', svg)
  const buckets = stats.intervals
  if (!buckets.length) return miss('间隔分档')
  const max = niceMax(Math.max.apply(null, buckets.map((one) => Number(one.count) || 0)))

  buckets.forEach((one, index) => {
    const bar = bars[index]
    if (!bar) return miss('间隔分布第 ' + (index + 1) + ' 根柱')
    const count = Number(one.count) || 0
    paintBar(bar, count, max, one.label + ' 天 · ' + count + ' 张卡')
  })
  for (let index = buckets.length; index < bars.length; index += 1) bars[index].style.display = 'none'

  // 刻度挪到相邻两根柱中间的缝里，写这一档的上界（天）
  const edges = []
  buckets.forEach((one, index) => {
    const bar = bars[index]
    if (!bar) return
    const nums = String(bar.getAttribute('d') || '').match(/-?[\d.]+/g) || []
    edges.push({ x1: Number(nums[0]), x2: Number(nums[14]), label: one.label })
  })
  const ticks = qa('text.tx', svg)
  ticks.forEach((node, index) => {
    const left = edges[index]
    const right = edges[index + 1]
    if (!left || !right) {
      node.style.display = 'none'
      return
    }
    node.style.display = ''
    setAttr(node, 'x', round2((left.x2 + right.x1) / 2))
    setText(node, upperOf(left.label))
  })

  const total = countWord(buckets)
  const top = buckets.slice().sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0]
  setText(q('.shead2 .smut', card), total + ' 张卡的当前间隔')
  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-intervals .takeaway')
  setText(
    takeaway,
    '按卡片的当前间隔分 7 档，横轴写到的是这一档的上界：「1」＝当天就再见到，「90+」＝三个月以上才回来。' +
      '现在 ' + total + ' 张卡里最多的是 ' + (top ? top.label + ' 天这一档（' + (Number(top.count) || 0) + ' 张）' : '还不知道') +
      '。间隔为 0 的卡（还没排上）不在这张图里。',
  )
}

/* ------------------------------------------------ 卡片简易度（ease 分档） */

function easeCard(stats) {
  const card = document.getElementById('s-ease')
  if (!card) return miss('#s-ease')
  show('.chartbox', card)
  const svg = q('#box-ease svg', card)
  if (!svg) return miss('#box-ease 里的图')

  const bars = qa('path.bar', svg)
  const buckets = stats.ease
  if (!buckets.length) return miss('简易度的分档')

  // 设计稿 9 根柱：4 档放第 0/2/4/6 根，中间那几根（原来凑数的）藏掉
  const slots = [0, 2, 4, 6]
  const max = niceMax(Math.max.apply(null, buckets.map((one) => Number(one.count) || 0)))
  buckets.forEach((one, index) => {
    const bar = bars[slots[index]]
    if (!bar) return miss('简易度第 ' + (index + 1) + ' 根柱')
    const count = Number(one.count) || 0
    paintBar(bar, count, max, one.label + ' · ' + count + ' 张卡')
  })
  bars.forEach((bar, index) => {
    if (slots.indexOf(index) < 0) bar.style.display = 'none'
  })

  const ticks = qa('text.tx', svg)
  ticks.forEach((node, index) => {
    const one = buckets[index]
    if (!one) {
      node.style.display = 'none'
      return
    }
    node.style.display = ''
    setText(node, one.label)
  })

  const total = stats.cards === null ? countWord(buckets) : stats.cards
  const top = buckets.slice().sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0]
  const avg = stats.avgEase
  setText(q('.shead2 .smut', card), avg === null ? '还没有难度值' : '越高越容易 · 平均 ' + avg.toFixed(2))

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-ease .takeaway')
  if (avg === null) {
    setText(takeaway, '简易度是按卡片算的，一张卡都没有，所以还没有平均值。练一句，下次给的评分就会算出 ease。')
    return
  }
  setText(
    takeaway,
    '平均简易度 ' + avg.toFixed(2) + '（这个值越高越容易；每答一次按评分加减一点）。' +
      '当前 ' + (total === null ? '—' : total) + ' 张卡里，落在 ' + (top ? top.label + ' 这一档的最多：' + (Number(top.count) || 0) + ' 张' : '还不知道') + '。',
  )
}

/* ------------------------------------------------------------ 逐小时分析 */

function hourlyCard(stats) {
  const card = document.getElementById('s-hourly')
  if (!card) return miss('#s-hourly')
  show('.chartbox', card)
  const svg = q('#box-hourly svg', card)
  if (!svg) return miss('#box-hourly 里的图')

  const bars = qa('path.bar', svg)
  const rows = stats.hourly
    .map((one) => ({ hour: Number(one.hour), count: Number(one.count) || 0 }))
    .filter((one) => isFinite(one.hour) && one.hour >= 0 && one.hour <= 23)
  if (!rows.length) return miss('逐小时的次数')

  // 设计稿只有 7 根柱：画练得最多的 7 个小时，柱心按小时刻度（15.9167 + h*25.8333）
  const shown = rows
    .slice()
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, bars.length)
    .filter((one) => one.count > 0)
    .sort((a, b) => a.hour - b.hour)

  if (!shown.length) return miss('有练习的小时')
  const max = niceMax(shown.reduce((best, one) => Math.max(best, one.count), 0))
  shown.forEach((one, index) => {
    const bar = bars[index]
    if (!bar) return miss('逐小时第 ' + (index + 1) + ' 根柱')
    paintBar(bar, one.count, max, one.hour + ' 点 · ' + one.count + ' 次', 15.9167 + one.hour * 25.8333)
  })
  for (let index = shown.length; index < bars.length; index += 1) bars[index].style.display = 'none'

  const total = countWord(rows)
  const top = shown.slice().sort((a, b) => b.count - a.count)[0]
  setText(q('.shead2 .smut', card), '练得最多的 ' + shown.length + ' 个小时 · 共 ' + total + ' 次')
  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-hourly .takeaway')
  setText(
    takeaway,
    '横轴是钟点，只画了练得最多的 ' + shown.length + ' 个小时：' +
      shown
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((one) => one.hour + ' 点 ' + one.count + ' 次')
        .join('、') +
      '。设计稿那条「正确率」线没画 —— 后端只给按小时的次数，没有按小时的正确率。',
  )
}

/* --------------------------------------------------------- 回答按钮分布 */

function buttonsCard(stats) {
  const card = document.getElementById('s-buttons')
  if (!card) return miss('#s-buttons')
  show('.chartbox', card)
  const svg = q('#box-buttons svg', card)
  if (!svg) return miss('#box-buttons 里的图')

  const bars = qa('path.bar', svg)
  const grades = stats.grades
  if (!grades.length) return miss('四个回答按钮')
  const max = niceMax(Math.max.apply(null, grades.map((one) => Number(one.count) || 0)))
  const FALLBACK = ['重来', '困难', '良好', '简单']

  grades.forEach((one, index) => {
    const bar = bars[index]
    if (!bar) return miss('回答按钮第 ' + (index + 1) + ' 根柱')
    const count = Number(one.count) || 0
    paintBar(bar, count, max, (one.label || FALLBACK[index] || '按钮') + ' · ' + count + ' 次')
  })
  for (let index = grades.length; index < bars.length; index += 1) bars[index].style.display = 'none'

  const ticks = qa('text.tx', svg)
  ticks.forEach((node, index) => {
    const one = grades[index]
    if (!one) {
      node.style.display = 'none'
      return
    }
    node.style.display = ''
    setText(node, String(one.label || FALLBACK[index] || '—'))
  })

  const total = countWord(grades)
  const passed =
    grades.reduce((sum, one) => sum + (Number(one.grade) >= 3 ? Number(one.count) || 0 : 0), 0)
  const share = total ? Math.round((passed / total) * 100) : 0
  const best = grades.slice().sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0]
  setText(q('.shead2 .smut', card), '共 ' + total + ' 次 · 通过 ' + share + '%')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-buttons .takeaway')
  setText(
    takeaway,
    '共 ' + total + ' 次回答：' +
      grades
        .map((one, index) => (one.label || FALLBACK[index] || '—') + ' ' + (Number(one.count) || 0))
        .join('、') +
      '。通过＝按了良好或简单，占 ' + share + '%' +
      (best ? '，最多的是「' + (best.label || '—') + '」。' : '。'),
  )
}

/* --------------------------------- 预测：排期画不出来，但四个总数是真的 */

function forecastCard(stats, host) {
  const card = document.getElementById('s-forecast')
  if (!card) return miss('#s-forecast')
  // 后端只记「什么时候到期」，没有未来每天的排期分布，这张图不编柱子
  hide('.chartbox', card)
  show('.sums', card)
  const cells = qa('.sums > div', card)
  const text = (value, unit) => (typeof value === 'number' && isFinite(value) ? String(value) + unit : '还不知道')
  const rows = [
    ['复习过', text(stats ? stats.reviews : host.reviews, ' 次')],
    ['练过卡', text(stats ? stats.cards : host.started, ' 张')],
    ['现在到期', text(host.due, ' 张')],
    ['其中过期', text(host.overdue, ' 张')],
  ]
  rows.forEach((row, index) => {
    const cell = cells[index]
    if (!cell) return miss('预测卡第 ' + (index + 1) + ' 个格子')
    setText(q('span.mut', cell), row[0])
    setText(q('b', cell), row[1])
  })
  setText(q('.shead2 .smut', card), '后端还没有排期')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-forecast .takeaway')
  setText(
    takeaway,
    '这张图要「以后每天有多少张到期」的排期，后端现在只记每张卡的到期时刻、没有按天的分布，所以画不出来。' +
      '能算的四个数填在上面了：复习过 ' + rows[0][1] + '、练过 ' + rows[1][1] + '卡、现在到期 ' + rows[2][1] +
      '（其中过期 ' + rows[3][1] + '）。',
  )
}

/* --------------------------------- 日程表：热力图要半年，后端只给 14 天 */

function heatCard(stats) {
  const card = document.getElementById('s-heat')
  if (!card) return miss('#s-heat')
  hide('.chartbox', card)
  const days = stats && stats.daily.length ? stats.daily.length : null
  setText(q('.shead2 .smut', card), days ? '要半年 · 后端只给 ' + days + ' 天' : '要半年 · 后端只给两周')

  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#s-heat .takeaway')
  setText(
    takeaway,
    '热力图是最近半年、一天一格。后端现在只给最近 ' + (days || 14) + ' 天的每日次数（画在「复习」那张卡上了），' +
      '不够铺满 52 列，所以这张不打颜色 —— 不编格子。',
  )
}

/* 标题栏和卡头上那些背后没有真数据的控件 */

function hideFakeControls() {
  // 牌组下拉里是 succumb / run out of / put off —— 设计稿的样例牌组，账本里没这些名字
  hide('.hdr .deck')
  // 卡头那一排「积压 / 用时 / 分开统计暂停搁置」和 1 个月 · 3 个月 · 1 年的范围选择，
  // 背后没有能切的真数据，留着会让人以为点得动
  qa('.sctls').forEach((node) => {
    node.style.display = 'none'
  })
}
