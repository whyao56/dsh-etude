/* 60 · 统计页：只画账本里真的有的数
   设计稿（design/gen.mjs 的 screens.stats）画的是 Anki 的复习历史 —— 今天练了几次、
   未来到期预测、半年热力图、卡片数量环图、记忆保留率。这一版插件里没有调度引擎、
   没有复习记录、也没有「复习次数」这个字段，那些图一张都画不出来。
   所以这一屏只画能从 state 里真算出来的东西：
     包数 / 例句总数 / 配图完成度 / 语音完成度 / 全齐的包 / 状态分布 / 最近新建 /
     在跑的任务 / 自检结果 / 数据目录与版本。
   其余位置写清楚「这一项等调度引擎做出来才有」—— 编一条假曲线比空着更糟。 */

/* ── 小工具：数值、日期、百分比 ─────────────────────────────── */

/* 只认「正的有限数」，undefined / null / '3 条' / NaN 一律当 0，避免图表里出现 NaN */
function ST_Num(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

function ST_Pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

function ST_DateKey(d) {
  return d.getFullYear() + '-' + ST_Pad2(d.getMonth() + 1) + '-' + ST_Pad2(d.getDate())
}

function ST_Md(d) {
  return ST_Pad2(d.getMonth() + 1) + '-' + ST_Pad2(d.getDate())
}

function ST_Pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function ST_Dur(ms) {
  const s = Math.max(0, Math.round(ST_Num(ms) / 1000))
  if (s < 60) return s + ' 秒'
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? m + ' 分 ' + rest + ' 秒' : m + ' 分钟'
}

/* ── 读 state：包、状态、汇总、每日、任务、自检、目录 ──────── */

function ST_Packs(state) {
  return state && Array.isArray(state.packs) ? state.packs : []
}

/* 真实 status 只有六种（lib/packs.js）：generating / text / media / packed /
   exported / failed。STATUS_TEXT（20-bridge.js:75）那五个是设计稿的词，
   真数据里永远对不上，所以这里两套都认，查不到就照原样显示，不硬编。 */
function ST_StatusDefs() {
  return [
    { id: 'generating', label: '造例句中', color: 'c3' },
    { id: 'text', label: '例句已出', color: 'c1' },
    { id: 'media', label: '找素材', color: 'c7' },
    { id: 'packed', label: '已打包', color: 'c6' },
    { id: 'exported', label: '已导出', color: 'c9' },
    { id: 'failed', label: '失败了', color: 'c4' },
    { id: 'draft', label: '刚建好', color: 'c8' },
    { id: 'examples', label: '造例句', color: 'c3' },
    { id: 'review', label: '等确认', color: 'c5' },
    { id: 'ready', label: '能出厂', color: 'c2' },
  ]
}

function ST_StatusDef(status) {
  const defs = ST_StatusDefs()
  for (let i = 0; i < defs.length; i += 1) {
    if (defs[i].id === status) return defs[i]
  }
  return null
}

function ST_StatusLabel(status) {
  const def = ST_StatusDef(status)
  if (def) return def.label
  if (typeof STATUS_TEXT !== 'undefined' && STATUS_TEXT && STATUS_TEXT[status]) return STATUS_TEXT[status]
  return status ? String(status) : '未知'
}

function ST_StatusColor(status) {
  const def = ST_StatusDef(status)
  return def ? def.color : 'c8'
}

/* 一堆包求和。progress.done 是布尔（lib/store.js:126 packProgress），不是条数：
   「两样都齐」的例句数要按包把 progress.total 加进去，不能直接拿 done 求和。 */
function ST_Totals(state) {
  const packs = ST_Packs(state)
  let total = 0
  let images = 0
  let audios = 0
  let both = 0
  let learnable = 0
  let exported = 0
  let failed = 0
  const byStatus = {}
  packs.forEach((p) => {
    const pr = p && p.progress ? p.progress : {}
    const n = ST_Num(pr.total)
    total += n
    images += ST_Num(pr.images)
    audios += ST_Num(pr.audios)
    if (pr.done === true && n > 0) both += n
    if (p && p.learnable === true) learnable += 1
    if (p && p.exportedAt) exported += 1
    if (p && p.status === 'failed') failed += 1
    const s = (p && p.status) || 'unknown'
    byStatus[s] = (byStatus[s] || 0) + 1
  })
  return {
    count: packs.length,
    total,
    images,
    audios,
    both,
    learnable,
    exported,
    failed,
    byStatus,
  }
}

/* 按 createdAt 落地本地日期，取最近 days 天（含今天）的新建包数 */
function ST_Daily(state, days) {
  const packs = ST_Packs(state)
  const n = days > 0 ? days : 14
  const out = []
  const index = {}
  const now = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = ST_DateKey(d)
    index[key] = out.length
    out.push({ key, day: d, value: 0 })
  }
  packs.forEach((p) => {
    const t = p && p.createdAt ? Date.parse(p.createdAt) : NaN
    if (!isFinite(t)) return
    const key = ST_DateKey(new Date(t))
    if (key in index) out[index[key]].value += 1
  })
  return out
}

/* selfcheck 真实形状是对象 {checks:[{id,ok,detail}],...}（lib/rpc.js），
   tests/client-smoke.mjs 喂的却是数组 —— 两种都收，别让页面炸。 */
function ST_Checks(state) {
  const sc = state && state.selfcheck
  const list = Array.isArray(sc) ? sc : sc && Array.isArray(sc.checks) ? sc.checks : []
  return list.filter((one) => one && typeof one === 'object')
}

function ST_CheckName(id) {
  const map = {
    node: 'Node 运行时',
    sharp: 'sharp 图像库',
    ws: 'WebSocket 通道',
    fetch: '网络请求 fetch',
    network: '外网连通',
    llm: '模型接口',
    storage: '数据目录可写',
  }
  return map[id] || String(id || '未命名检查')
}

function ST_JobKind(kind) {
  const map = {
    create: '造例句',
    candidates: '找候选图',
    'candidates-all': '批量找候选图',
    audio: '合成语音',
    'audio-all': '批量合成语音',
    pack: '打包',
    export: '导出',
    sample: '试听样本',
  }
  return map[kind] || String(kind || '任务')
}

function ST_Where(state) {
  const sc = state && state.selfcheck && !Array.isArray(state.selfcheck) ? state.selfcheck : {}
  const rows = []
  const add = (k, v) => {
    if (v) rows.push({ k, v: String(v) })
  }
  add('数据目录', (state && state.root) || sc.root)
  add('导出目录', (state && state.exportDir) || sc.exportDir)
  add('配置目录', sc.profile)
  add('代理', sc.proxy)
  add('版本', (state && state.version) || sc.version)
  return rows
}

/* ── 两种图：竖柱图 + 环图（手写 SVG，不引图表库） ───────────── */

/* 照 design/gen.mjs:1494 的 barChart：等宽槽位、柱宽 3–22、底部留 22 给标签、
   0 值不画柱（一排 0 高柱子等于假图，只留标签）。宽度变量叫 boxW/boxH，
   不能叫 w/h —— h 是 00-base.js 里的 createElement，局部一遮蔽整张图就炸。
   viewBox 宽默认 1000：卡最宽 1040（.screen.half），画布跟容器差不多宽才不会
   按 preserveAspectRatio 缩小、两边留一大块空白（620 宽时实测两边各空 200px）。 */
function StatsBars(props) {
  const items = Array.isArray(props.items) ? props.items : []
  if (!items.length) return null
  const boxW = props.width || 1000
  const boxH = props.height || 170
  const base = 22
  const top = 14
  const pad = props.axis === false ? 0 : 34
  const plotW = boxW - pad
  const bottom = boxH - base
  const areaH = bottom - top
  const peak = items.reduce((m, one) => Math.max(m, ST_Num(one.value)), 0)
  const max = props.max && props.max > 0 ? props.max : peak
  if (!max || !peak) return null

  const kids = []
  kids.push(h('line', { key: 'gbase', x1: 0, y1: bottom, x2: plotW, y2: bottom, className: 'gbase' }))
  const steps = [0.25, 0.5, 0.75]
  steps.forEach((f) => {
    const y = Math.round(bottom - areaH * f)
    kids.push(h('line', { key: 'gl' + f, x1: 0, y1: y, x2: plotW, y2: y, className: 'gl' }))
  })
  if (pad) {
    const ticks = [1, 0.5]
    ticks.forEach((f) => {
      const y = Math.round(bottom - areaH * f)
      kids.push(
        h('text', { key: 'ty' + f, x: plotW + 9, y: y + 3.5, textAnchor: 'start', className: 'tx ty' }, String(Math.round(max * f))),
      )
    })
  }

  const slot = plotW / Math.max(1, items.length)
  const barW = Math.max(3, Math.min(22, slot * 0.46))
  items.forEach((one, i) => {
    const v = ST_Num(one.value)
    const cx = i * slot + slot / 2
    if (one.label) {
      kids.push(h('text', { key: 'lb' + i, x: cx, y: boxH - 6, textAnchor: 'middle', className: 'tx' }, one.label))
    }
    if (!(v > 0)) return
    const bh = Math.max(2, (v / max) * areaH)
    const bw = Math.min(barW, slot * 0.8)
    kids.push(
      h(
        'rect',
        {
          key: 'b' + i,
          x: i * slot + (slot - bw) / 2,
          y: bottom - bh,
          width: bw,
          height: bh,
          rx: Math.min(4, bw / 2),
          className: 'bar ' + (one.color || 'c1'),
        },
        h('title', { key: 't' }, one.tip || String(v)),
      ),
    )
  })

  return h(
    'svg',
    { className: 'chart bars', viewBox: '0 0 ' + boxW + ' ' + boxH, width: '100%', height: boxH, role: 'img', 'aria-label': props.label || '' },
    kids,
  )
}

/* 照 design/gen.mjs:1583 的 donut：r = size/2 - thick/2 - 6，每段留 2.4 的缝，
   stroke-dasharray 画弧、rotate(-90) 从 12 点起，中心两行字。 */
function StatsDonut(props) {
  const parts = (Array.isArray(props.parts) ? props.parts : []).filter((one) => ST_Num(one.value) > 0)
  const total = parts.reduce((sum, one) => sum + ST_Num(one.value), 0)
  if (!total) return null
  const size = props.size || 200
  const thick = props.thick || 18
  const gap = 2.4
  const r = size / 2 - thick / 2 - 6
  const c = 2 * Math.PI * r
  const cx = size / 2

  const arcs = []
  let offset = 0
  parts.forEach((one, i) => {
    const raw = (ST_Num(one.value) / total) * c
    const len = Math.max(0.0001, raw - (parts.length > 1 ? gap : 0))
    const pct = Math.round((ST_Num(one.value) / total) * 100)
    arcs.push(
      h(
        'circle',
        {
          key: 'd' + i,
          className: 'dc ' + (one.color || 'c1'),
          cx: cx,
          cy: cx,
          r: r,
          fill: 'none',
          strokeWidth: thick,
          strokeLinecap: 'butt',
          strokeDasharray: len.toFixed(2) + ' ' + (c - len).toFixed(2),
          strokeDashoffset: (-offset).toFixed(2),
          transform: 'rotate(-90 ' + cx + ' ' + cx + ')',
        },
        h('title', { key: 't' }, (one.label || '') + ' · ' + ST_Num(one.value) + ' 个（' + pct + '%）'),
      ),
    )
    offset += raw
  })

  const digits = String(total).length
  const big = digits >= 4 ? size * 0.16 : size * 0.19
  const kids = [
    h('g', { className: 'dspin', key: 'g' }, [h('circle', { key: 'tr', className: 'dtrack', cx: cx, cy: cx, r: r, fill: 'none', strokeWidth: thick })].concat(arcs)),
    h(
      'text',
      { key: 'big', x: cx, y: cx + big * 0.24, textAnchor: 'middle', className: 'donut-big', style: { fontSize: big.toFixed(1) + 'px' } },
      String(total),
    ),
    h(
      'text',
      { key: 'lab', x: cx, y: cx + big * 0.24 + 19, textAnchor: 'middle', className: 'donut-label' },
      props.centerLabel || '',
    ),
  ]
  return h('svg', { className: 'chart donut', viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, role: 'img' }, kids)
}

/* ── 卡壳：卡头 + 空/加载/出错三态 ──────────────────────────── */

function StatsCard({ id, title, mut, children }) {
  return h(
    'section',
    { className: 'card stat', id },
    h(
      'div',
      { className: 'shead2' },
      h('span', { className: 'stitle' }, title),
      mut ? h('span', { className: 'smut' }, mut) : null,
    ),
    children,
  )
}

/* 三种态共用 .state 骨架（design/app.css:7052），只换修饰类：
   空 = 虚线框 + 三条空行；加载中 = 实线框 + 转圈 + 三条骨架条；出错 = 圆点 + 重试。 */
function StatsBlock({ kind, title, hint, note, onRetry, retryText }) {
  const cls = 'state state-sm' + (kind === 'loading' ? ' state-loading' : kind === 'error' ? ' state-error' : '')
  return h(
    'div',
    { className: cls, role: kind === 'error' ? 'alert' : undefined },
    h('div', { className: 'state-fig', 'aria-hidden': 'true' }),
    h('div', { className: 'state-title' }, title),
    hint ? h('div', { className: 'state-hint' }, hint) : null,
    note ? h('div', { className: 'state-note' }, note) : null,
    kind === 'loading' ? h('div', { className: 'st-sk' }, h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })) : null,
    onRetry
      ? h('div', { className: 'state-acts' }, h('button', { className: 'btn primary', type: 'button', onClick: onRetry }, retryText || '重试'))
      : null,
  )
}

function StatsSum({ label, value }) {
  return h('div', null, h('span', { className: 'mut' }, label), h('b', null, String(value)))
}

/* ── 1 · 规模：全是求和，没有一项是估的 ─────────────────────── */

function StatsScaleCard({ state }) {
  const t = ST_Totals(state)
  const gapImage = Math.max(0, t.total - t.images)
  const gapAudio = Math.max(0, t.total - t.audios)

  if (!t.count) {
    return h(
      StatsCard,
      { id: 's-scale', title: '规模', mut: '账本里的全部家底' },
      h(StatsBlock, {
        kind: 'empty',
        title: '账本里还没有包',
        hint: '去卡片页造第一个包：造完这一屏就有数了。这里统计的是包、例句、配图、语音——都是真数出来的，不是示例。',
        note: '包数 = state.packs.length；例句 = Σ progress.total。',
      }),
    )
  }

  return h(
    StatsCard,
    { id: 's-scale', title: '规模', mut: t.count + ' 个包 · ' + t.total + ' 条例句' },
    h(
      'div',
      { className: 'sums' },
      h(StatsSum, { label: '包', value: t.count }),
      h(StatsSum, { label: '例句', value: t.total }),
      h(StatsSum, { label: '配图齐', value: t.images }),
      h(StatsSum, { label: '语音齐', value: t.audios }),
      h(StatsSum, { label: '能出厂', value: t.learnable }),
    ),
    h(
      'p',
      { className: 'takeaway' },
      gapImage || gapAudio
        ? '还差 ' + gapImage + ' 条配图、' + gapAudio + ' 条语音；两样都齐的包才算能出厂，现在有 ' + t.learnable + ' 个。'
        : '所有例句的配图和语音都齐了，' + t.learnable + ' 个包能出厂。',
    ),
  )
}

/* ── 2 · 素材完成度：以例句总数为分母的三根柱 ───────────────── */

function StatsProgressCard({ state }) {
  const t = ST_Totals(state)
  if (!t.total) {
    return h(
      StatsCard,
      { id: 's-progress', title: '素材完成度', mut: '配图 / 语音 / 两样都齐' },
      h(StatsBlock, {
        kind: 'empty',
        title: '还没有例句，完成度没有分母',
        hint: '先造一个包的例句。配图完成度和语音完成度都是「已确认条数 ÷ 例句总数」，一条例句都没有的时候这个除法没有意义。',
        note: '语音要你亲耳点过才算（audioReview.listened），所以这一项通常比配图慢。',
      }),
    )
  }

  const pctImage = ST_Pct(t.images, t.total)
  const pctAudio = ST_Pct(t.audios, t.total)
  const pctBoth = ST_Pct(t.both, t.total)
  return h(
    StatsCard,
    { id: 's-progress', title: '素材完成度', mut: '满值 = ' + t.total + ' 条例句' },
    h(
      'div',
      { className: 'chartbox' },
      h(StatsBars, {
        items: [
          { label: '配图', value: t.images, color: 'c1', tip: '配图 ' + t.images + '/' + t.total + '（' + pctImage + '%）' },
          { label: '语音', value: t.audios, color: 'c6', tip: '语音 ' + t.audios + '/' + t.total + '（' + pctAudio + '%）' },
          { label: '两样都齐', value: t.both, color: 'c3', tip: '两样都齐 ' + t.both + '/' + t.total + '（' + pctBoth + '%）' },
        ],
        max: t.total,
        height: 170,
        label: '素材完成度',
      }),
    ),
    h(
      'div',
      { className: 'sums' },
      h(StatsSum, { label: '配图', value: pctImage + '%' }),
      h(StatsSum, { label: '语音', value: pctAudio + '%' }),
      h(StatsSum, { label: '两样都齐', value: pctBoth + '%' }),
    ),
    h(
      'p',
      { className: 'takeaway' },
      '配图 = Σ progress.images ÷ Σ progress.total，语音 = Σ progress.audios ÷ 同一个分母。语音那一项要你自己听过一遍才算数，所以它比配图慢是正常的。',
    ),
  )
}

/* ── 3 · 状态分布：环形图 + 图例（按真实 status 分组） ──────── */

function StatsStatusCard({ state }) {
  const t = ST_Totals(state)
  if (!t.count) {
    return h(
      StatsCard,
      { id: 's-status', title: '状态分布', mut: '每个包现在停在哪一步' },
      h(StatsBlock, {
        kind: 'empty',
        title: '还没有包，分不出阶段',
        hint: '包的状态只会在「造例句 → 找素材 → 打包 → 导出」这条线上走。一个包都没有的时候，这张图没有东西可分。',
      }),
    )
  }

  const defs = ST_StatusDefs()
  const groups = []
  defs.forEach((def) => {
    if (t.byStatus[def.id] > 0) groups.push({ name: def.label, value: t.byStatus[def.id], color: def.color, id: def.id })
  })
  const known = {}
  defs.forEach((def) => {
    known[def.id] = true
  })
  Object.keys(t.byStatus).forEach((key) => {
    if (!known[key] && t.byStatus[key] > 0) groups.push({ name: ST_StatusLabel(key), value: t.byStatus[key], color: 'c8', id: key })
  })

  let top = groups[0]
  groups.forEach((g) => {
    if (g.value > top.value) top = g
  })
  /* 并列最多时别说「就是这一步最堵」—— 那句话只在真的有个最大值时成立 */
  const tiedWithTop = groups.filter((g) => g.value === top.value).length
  const legend = groups.map((g) =>
    h(
      'li',
      { key: g.id },
      h('i', { className: g.color }),
      h('span', null, g.name),
      h('b', null, String(g.value)),
      h('span', { className: 'mut' }, ST_Pct(g.value, t.count) + '%'),
    ),
  )
  legend.push(
    h(
      'li',
      { className: 'tot', key: 'tot' },
      h('span', { className: 'mut' }, '总计'),
      h('b', null, String(t.count)),
      h('span', { className: 'mut' }, '100%'),
    ),
  )

  return h(
    StatsCard,
    { id: 's-status', title: '状态分布', mut: '按包的 status 分组 · ' + t.count + ' 个' },
    h(
      'div',
      { className: 'donutwrap' },
      h('div', { className: 'donut-center' }, h(StatsDonut, { parts: groups, size: 200, centerLabel: '个包' })),
      h('ul', { className: 'legend' }, legend),
    ),
    h(
      'p',
      { className: 'takeaway' },
      groups.length > 1
        ? tiedWithTop > 1
          ? '有 ' + tiedWithTop + ' 个阶段一样多（各 ' + top.value + ' 个），说不上堵在哪一步。'
          : '最多的一步是「' + top.name + '」' + top.value + ' 个（' + ST_Pct(top.value, t.count) + '%），这一步就是现在最堵的地方。'
        : '所有包都停在同一处：「' + top.name + '」。',
    ),
  )
}

/* ── 4 · 最近两周新建：按 createdAt 落本地日期分桶 ──────────── */

function StatsAddedCard({ state }) {
  const days = ST_Daily(state, 14)
  const sum = days.reduce((n, d) => n + d.value, 0)
  const packCount = ST_Packs(state).length

  if (!sum) {
    return h(
      StatsCard,
      { id: 's-added', title: '最近两周新建', mut: '最近 14 天' },
      h(StatsBlock, {
        kind: 'empty',
        title: '最近 14 天没有新建的包',
        hint: packCount
          ? '账本里那 ' + packCount + ' 个包都是 14 天以前建的。想再造一个回卡片页输入一个词就行。'
          : '账本里还一个包都没有，所以每天都是 0——这张图没有可画的柱子。',
        note: '按 pack.createdAt 落本地日期统计，跨月的天按本地时区算。',
      }),
    )
  }

  /* 并列最多是常态（一天就造一个包），所以不能只报「第一个最大的那天」——
     那会把 10-28 说成唯一的高峰，而 11-01 明明也一样多。改成：
     报最近的那天 + 数一共几天一样多。 */
  let peak = 0
  days.forEach((d) => {
    if (d.value > peak) peak = d.value
  })
  let best = days[0]
  days.forEach((d) => {
    if (d.value === peak) best = d
  })
  const ties = days.filter((d) => d.value === peak).length
  const items = days.map((d, at) => ({
    label: d.day.getDate() === 1 || at === days.length - 1 ? ST_Md(d.day) : '',
    value: d.value,
    color: 'c1',
    tip: ST_Md(d.day) + ' · 新建 ' + d.value + ' 个包',
  }))

  return h(
    StatsCard,
    { id: 's-added', title: '最近两周新建', mut: '最近 14 天 · 共 ' + sum + ' 个' },
    h('div', { className: 'chartbox' }, h(StatsBars, { items, height: 150, label: '最近 14 天新建的包' })),
    h(
      'p',
      { className: 'takeaway' },
      ties > 1
        ? '有 ' + ties + ' 天一样多（各 ' + peak + ' 个），最近一次是 ' + ST_Md(best.day) + '；14 天平均每天 ' + (sum / 14).toFixed(1) + ' 个。'
        : '最多的一天是 ' + ST_Md(best.day) + '，新建了 ' + best.value + ' 个；14 天平均每天 ' + (sum / 14).toFixed(1) + ' 个。',
    ),
  )
}

/* ── 5 · 复习历史：设计稿这一整屏，插件里没有数据 ───────────── */

function StatsMissingRows() {
  return [
    { k: '今天', v: '每小时练了几次、练了多久 —— 要每次作答的时间戳' },
    { k: '预测', v: '未来每天到期多少张 —— 要调度引擎的到期队列' },
    { k: '日程表', v: '半年热力图 —— 要按天累计的复习次数' },
    { k: '卡片数量', v: 'Unlearned / Learning / Relearning 分面 —— 要每张卡的记忆状态' },
    { k: '复习 / 复习间隔', v: '答了多少次、下次隔几天再来 —— 要 SM-2 那套调度' },
    { k: '卡片简易度', v: 'Easy / Good / Hard / Again 的分布 —— 要每次回答后的难度记录' },
    { k: '记忆保留率', v: '按间隔档统计答对率 —— 要成对的历史作答' },
    { k: '逐小时分析', v: '一天里哪个钟点最准 —— 要全部作答的时间戳' },
  ]
}

function StatsReviewCard() {
  const rows = StatsMissingRows()
  return h(
    StatsCard,
    { id: 's-review', title: '复习历史', mut: '这一屏设计稿画的东西 · 现在没有数据' },
    h(StatsBlock, {
      kind: 'empty',
      title: '账本里没有任何一次作答记录',
      hint: '设计稿这一屏画的是 Anki 的复习历史。插件现在只有「包 / 例句 / 配图 / 语音」，没有调度引擎，也从来没记过谁在哪一秒点过哪个按钮——所以下面这些图一个都画不出来。',
      note: '这不是加载失败，是账本里根本没有这项数据。等调度引擎做出来才有。',
    }),
    h(
      'ul',
      {
        className: 'stt-missing',
        style: { listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 0 },
      },
      rows.map((row) =>
        h(
          'li',
          {
            key: row.k,
            style: {
              display: 'grid',
              gridTemplateColumns: '132px minmax(0,1fr)',
              gap: '12px',
              alignItems: 'baseline',
              padding: '7px 0',
              borderTop: '1px solid rgba(var(--w),.05)',
              fontSize: '12.5px',
              color: 'var(--fg2)',
            },
          },
          h('span', { style: { color: 'var(--fg)' } }, row.k),
          h('span', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, row.v),
        ),
      ),
    ),
  )
}

/* ── 6 · 正在跑的任务：state.jobs 只含 running ─────────────── */

function StatsJobsCard({ state }) {
  const jobs = state && Array.isArray(state.jobs) ? state.jobs.filter((j) => j && typeof j === 'object') : []
  if (!jobs.length) {
    return h(
      StatsCard,
      { id: 's-jobs', title: '正在跑的任务', mut: '现在没有' },
      h(StatsBlock, {
        kind: 'empty',
        title: '现在没有在跑的任务',
        hint: '造例句、找候选图、合成语音、打包、导出这些活儿，跑起来的时候会出现在这里，带进度和最后一句日志。',
        note: '这里只列 state.jobs 里 status 为 running 的；跑完的会被服务端从这份列表里拿掉。',
      }),
    )
  }

  const rows = jobs.map((job, at) => {
    const pr = job.progress && typeof job.progress === 'object' ? job.progress : null
    const done = pr ? ST_Num(pr.done) : 0
    const total = pr ? ST_Num(pr.total) : 0
    const pct = total > 0 ? ST_Pct(done, total) : 0
    const log = Array.isArray(job.log) && job.log.length ? job.log[job.log.length - 1] : ''
    const meta = [
      ST_JobKind(job.kind),
      total > 0 ? done + '/' + total + '（' + pct + '%）' : '进度未报',
      job.startedAt ? '已跑 ' + ST_Dur(Date.now() - ST_Num(job.startedAt)) : '',
    ].filter(Boolean)
    return h(
      'div',
      {
        key: String(job.id || job.label || 'job-' + at),
        className: 'stt-job',
        style: {
          display: 'grid',
          gridTemplateColumns: '10px minmax(0,1fr)',
          gap: '10px',
          alignItems: 'start',
          padding: '10px 0',
          borderTop: '1px solid rgba(var(--w),.06)',
        },
      },
      h('i', { className: 'pip ok', style: { marginTop: 5 } }),
      h(
        'div',
        { style: { minWidth: 0 } },
        h(
          'div',
          { style: { fontSize: '12.5px', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          job.label ? String(job.label) : ST_JobKind(job.kind),
        ),
        h('div', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, meta.join(' · ')),
        log
          ? h(
              'div',
              {
                className: 'mut',
                style: {
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: 'var(--ghost)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              },
              String(log),
            )
          : null,
      ),
    )
  })

  return h(
    StatsCard,
    { id: 's-jobs', title: '正在跑的任务', mut: jobs.length + ' 个在跑' },
    h('div', null, rows),
    h('p', { className: 'takeaway' }, '这些数字是页面打开那一刻的快照。要刷新就点右上角「刷新」——不会打断正在跑的任务。'),
  )
}

/* ── 7 · 自检：state.selfcheck.checks ──────────────────────── */

function StatsCheckCard({ state, onReload }) {
  const checks = ST_Checks(state)
  const okCount = checks.filter((c) => c.ok === true).length

  return h(
    StatsCard,
    {
      id: 's-check',
      title: '自检',
      mut: checks.length ? okCount + '/' + checks.length + ' 项通过' : '没有结果',
    },
    checks.length
      ? h(
          'div',
          null,
          checks.map((c) =>
            h(
              'div',
              {
                key: String(c.id),
                style: {
                  display: 'grid',
                  gridTemplateColumns: '10px minmax(0,1fr)',
                  gap: '10px',
                  alignItems: 'start',
                  padding: '9px 0',
                  borderTop: '1px solid rgba(var(--w),.06)',
                },
              },
              h('i', { className: 'pip ' + (c.ok === true ? 'ok' : 'bad'), style: { marginTop: 5 } }),
              h(
                'div',
                { style: { minWidth: 0 } },
                h(
                  'div',
                  { style: { fontSize: '12.5px', color: 'var(--fg)' } },
                  ST_CheckName(c.id) + (c.ok === true ? '' : ' · 不通'),
                ),
                c.detail ? h('div', { className: 'mut', style: { fontSize: '11.5px', lineHeight: 1.6 } }, String(c.detail)) : null,
              ),
            ),
          ),
          h(
            'p',
            { className: 'takeaway' },
            okCount === checks.length
              ? '全部通过。这一屏的每个数都是从同一个账本读出来的，自检通过说明读得到。'
              : '有 ' + (checks.length - okCount) + ' 项不通。下面的数可能不全，先把不通的那项修掉再回来看。',
          ),
        )
      : h(StatsBlock, {
          kind: 'empty',
          title: '自检没有返回结果',
          hint: 'state.selfcheck 里应该有一份 checks 列表。这次是空的——点下面的按钮让服务端重新跑一遍自检。',
          onRetry: onReload,
          retryText: '重新自检',
        }),
    checks.length
      ? h('div', { style: { marginTop: 14 } }, h('button', { className: 'btn ghost sm', type: 'button', onClick: onReload }, '重新自检'))
      : null,
  )
}

/* ── 8 · 目录与版本 ────────────────────────────────────────── */

function StatsWhereCard({ rows }) {
  if (!rows.length) {
    return h(
      StatsCard,
      { id: 's-where', title: '目录与版本', mut: '没读到' },
      h(StatsBlock, {
        kind: 'empty',
        title: '没拿到数据目录',
        hint: 'state.root 是空的时候，说明账本还没定位到磁盘上。去工厂页看一眼自检里的「数据目录可写」。',
      }),
    )
  }
  return h(
    StatsCard,
    { id: 's-where', title: '目录与版本', mut: rows.length + ' 项' },
    h(
      'div',
      {
        className: 'stt-kv',
        style: { display: 'grid', gridTemplateColumns: '76px minmax(0,1fr)', gap: '9px 14px', alignItems: 'baseline' },
      },
      rows.map((row) =>
        h(
          'div',
          { key: row.k, style: { display: 'contents' } },
          h('span', { className: 'mut', style: { fontSize: '11.5px' } }, row.k),
          h(
            'span',
            {
              className: 'stt-val',
              style: {
                fontSize: '11.5px',
                color: 'var(--fg2)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              },
            },
            row.v,
          ),
        ),
      ),
    ),
  )
}

/* ── 三态的两张整页兜底卡 ─────────────────────────────────── */

function StatsLoadingCard() {
  return h(
    StatsCard,
    { id: 's-loading', title: '正在读账本', mut: '第一次进这屏会慢一点' },
    h(StatsBlock, {
      kind: 'loading',
      title: '正在读账本…',
      hint: '这一屏每个数都要先把本地 ledger.json 读一遍。读完之后包、例句、任务的数字就会出来。',
    }),
  )
}

function StatsErrorCard({ error, onReload }) {
  return h(
    'div',
    { className: 'card stat' },
    h('div', { className: 'shead2' }, h('span', { className: 'stitle' }, '没取到账本')),
    h(StatsBlock, {
      kind: 'error',
      title: '读账本的时候出错了',
      hint: String(error || 'state 接口没有返回。'),
      note: '这一屏所有数字都是从账本里求和的，账本读不到就一个都算不出来。点「重试」再读一遍；如果还不行，去工厂页看自检。',
      onRetry: onReload,
      retryText: '重试',
    }),
  )
}

/* ── 页面 ─────────────────────────────────────────────────── */

/* 90-app.js 现在传的是 { rpc, state, error, reload }，不是 onReload ——
   两个名字都收，免得按钮点了没反应。 */
function StatsPage({ state, error, onReload, reload }) {
  const again = typeof onReload === 'function' ? onReload : reload
  const loading = !state || state.status === 'loading'
  const where = ST_Where(state)

  return h(
    Screen,
    { className: 'half' },
    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '统计'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), state && state.root ? '账本已连' : '示例数据'),
        h('button', { className: 'btn ghost sm', type: 'button', onClick: again }, '刷新'),
      ),
    ),

    h(
      'div',
      { className: 'sgrid' },
      error
        ? h(StatsErrorCard, { error, onReload: again })
        : loading
          ? h(StatsLoadingCard)
          : [
              h(StatsScaleCard, { key: 'scale', state }),
              h(StatsProgressCard, { key: 'progress', state }),
              h(StatsStatusCard, { key: 'status', state }),
              h(StatsAddedCard, { key: 'added', state }),
              h(StatsReviewCard, { key: 'review' }),
              h(StatsJobsCard, { key: 'jobs', state }),
              h(StatsCheckCard, { key: 'check', state, onReload: again }),
              h(StatsWhereCard, { key: 'where', rows: where }),
            ],
    ),

    /* 不用 .tip：app.css:839 那个 .tip 是图表悬停提示（position:fixed + nowrap），
       当脚注用会飘成一条浮在左上角的长条。小灰字用 .mut。 */
    h(
      'p',
      { className: 'mut', style: { margin: '2px 2px 0', lineHeight: 1.75 } },
      '这一屏只画账本里真的有的数：包、例句、配图、语音、在跑的任务、自检。没记过的东西（复习历史那一整组）宁可空着写清楚，也不编一条曲线出来。',
    ),
  )
}
