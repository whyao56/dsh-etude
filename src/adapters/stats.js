/* stats · 统计页接真账本
 *
 * 设计稿这一页有 11 张卡，其中 8 张画的是复习历史（热力图、复习曲线、间隔分布、
 * 简易度分布、记忆保留率、回答按钮、逐小时正确率、预测）。这些数据账本里一条都没有：
 * lib/rpc.js 的 state() 只给 { root, packs, selfcheck, jobs, exportDir, version }，
 * 包上也只有 { status, progress:{total,images,audios,done}, learnable, createdAt, … }。
 * 没有 reviews / answers / revlog / due / interval / ease / retention —— 全查过。
 *
 * 所以分两拨处理：
 *   · 能从账本真算的：包数、例句数、配图齐、语音齐、能出厂、按 status 的分布、
 *     按 createdAt 分到最近 14 天、正在跑的任务、自检、目录与版本
 *     → 填进「规模」（原「今天」）、「卡片数量」、「新增」三张卡。
 *   · 算不出来的：不画假柱子。图 display:none，卡头写「暂时算不出来」，底部写清「要什么才有」。
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
  blankCards()
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

/* --------------------------------------------- 算不出来的那 8 张：写字说明 */

const NO_RECORD = '账本里没有作答记录，这张图要等你练过才有。'

function blankCards() {
  blank('s-forecast', '账本里没有排期，这张图要等你练过才有。', '要什么才有：每条例句的复习时间，和它下次什么时候到期。', [
    '.sums',
  ])
  blank('s-heat', NO_RECORD, '要什么才有：每条例句的练习时间。练够几天，格子上才有颜色。')
  blank('s-reviews', NO_RECORD, '要什么才有：每天答了几次、答得对不对的记录。')
  blank('s-intervals', NO_RECORD, '要什么才有：同一条例句两次复习之间隔了几天。')
  blank('s-ease', NO_RECORD, '要什么才有：每次作答后算出来的难度值。')
  blank('s-retention', NO_RECORD, '要什么才有：每次作答按的是「记得」还是「忘了」。', ['table.rt'])
  blank('s-hourly', NO_RECORD, '要什么才有：每次作答的时刻。')
  blank('s-buttons', NO_RECORD, '要什么才有：每次作答按的哪个按钮。')
}

/**
 * 一张算不出来的卡：图藏掉、卡头标「暂时算不出来」、底部一句「要什么才有」。
 * 不新增节点 —— 说明就写在设计稿本来就有的 .takeaway 里。
 */
function blank(id, head, why, extra) {
  const card = document.getElementById(id)
  if (!card) return miss('#' + id)
  hide('.chartbox', card)
  hide('.sctls', card)
  ;(extra || []).forEach((selector) => hide(selector, card))
  setText(q('.shead2 .smut', card), '暂时算不出来')
  const takeaway = q('.takeaway', card)
  if (!takeaway) return miss('#' + id + ' 的说明行')
  setText(takeaway, head + why)
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
