/* adapters/factory.js · 工厂页的数据适配
 *
 * 设计稿这一页写死的是：左边 5 个词、右边 abandon 的 8 句、3 已出厂 / 3 有缺口 /
 * 2 正在加工、5 条五维里 4 条「齐了」、图是 ./assets/factory/c1.jpg、语音 3.1s。
 * 插件里这些全换成账本里的真数据。
 *
 * 契约（其它页的适配器也是这套）：
 *   window.__ETUDE_APPLY__ = function (state, api) { ... }
 *   api.rpc('pack.get', { id })          → 整包（packs[] 里没有 examples）
 *   api.rpc('image.bytes', { file })     → { dataBase64 }    图片
 *   api.rpc('image.bytes', { file, kind:'audio' }) → { dataBase64 }  语音
 *   api.rpc('pack.voice.list')           → { voices:[{ id, label }] }
 *
 * 规矩（docs/ADAPTERS.md）：
 *   · 只改值，不重排结构 —— 只有「一行一个数据」的 .fx-row / .resl li / .bgl li
 *     才允许增删，而且每轮先把上一轮插的删干净（每次 state 推过来都会重跑一遍）；
 *   · 找不到锚点就 console.warn 跳过，绝不抛错把整页打空；
 *   · 后端没有的（录音 / 作答 / 变体落到哪句 / 情境画像 / 资源 / 背景 / 多语言）
 *     一律写「还没接」，不编数字，留着设计稿的假数字更糟；
 *   · 三条死规矩不在文案上糊过去：图要人点过头（imageReview.by）、
 *     语音要真听过（audioReview.listened）、同一个词造两次不重复花钱。
 *
 * 状态条那三个数必须自洽：已出厂 + 有缺口 + 正在加工 = 句。
 */

/* 跨轮次记住的东西：上一轮选了哪个包、上一轮的 token（异步回来的旧结果要丢掉）、
   还有从设计稿里抠出来的行模板（每轮都重建行，但模板只抠一次）。 */
var view = {
  token: 0,
  sel: null,
  api: null,
  state: null,
  settings: {},
  area: null,
  list: null,
  rowBodyTpl: null,
  rowTpl: null,
}

window.__ETUDE_APPLY__ = function (state, api) {
  if (api) view.api = api
  if (state) view.state = state
  view.settings = (state && state.settings) || {}
  view.token += 1
  var token = view.token

  // 设计稿里 .fx-sense 是 .fx-list 的子节点，但浏览器把这几个 div 解析成了
  // .fx-main 的兄弟（设计稿自己也是这个形状，grep 看不出来，得在真 DOM 里看）。
  // 所以义项和句子行一律按 .fx-main 这个作用域找，不按 .fx-list 找。
  if (!view.area) view.area = document.querySelector('.fx-main') || document.querySelector('.fx-list')
  view.list = document.querySelector('.fx-list') || view.area
  if (!view.area) warn('.fx-main / .fx-list')
  captureTemplates()

  var ready = Boolean(state && state.status === 'ready')
  var packs = ready ? sortPacks(state.packs || []) : []
  var pack = packs.length ? pickPack(packs) : null

  drawSideCount(packs.length, ready)
  drawWords(packs, ready)
  hideExtraSenses()

  if (!ready) {
    blankMain(state)
    return
  }
  if (!pack) {
    blankMain(state, '账本里还没有包。上面输入一个词，按「造料」开一个。')
    setFoot('空账本。造第一个包之后，左边词表和这一页都会长出来。')
    return
  }

  drawPack(pack, state, token)
}

/* ── 左栏：一行一个包 ──────────────────────────────────────────────────── */

function drawWords(packs, ready) {
  var list = document.querySelector('.fx-words')
  if (!list) {
    warn('.fx-words')
    return
  }
  clear(list)
  if (!ready) return
  for (var i = 0; i < packs.length; i += 1) {
    var pack = packs[i]
    var on = pack.id === view.sel
    var dot = dotClass(pack)
    var li = document.createElement('li')
    li.className = on ? 'on' : ''
    li.setAttribute('data-pack', pack.id)
    li.title = packTitle(pack)
    li.innerHTML = '<b>' + esc(pack.target || '(没名字)') + '</b><i class="' + dot + '"></i>'
    // 设计稿的 CSS 里 `li.on>.fdot` 一律是主色，选中的那一行看不出还缺不缺东西。
    // 只在选中行、且没齐的时候盖一下颜色（改的是值，不是结构）。
    var mark = li.querySelector('i')
    if (on && mark && dot !== 'fdot ok') {
      mark.style.background = dot === 'fdot half' ? 'var(--warn)' : 'var(--danger)'
    }
    li.addEventListener('click', makeSelectHandler(pack.id))
    list.appendChild(li)
  }
}

function makeSelectHandler(id) {
  return function () {
    if (view.sel === id) return
    view.sel = id
    // 页面里没有路由，切词就是拿上一份 state 重跑一遍适配器。
    // 优先用自己存的那份：预览里宿主不会往 window 上放 __ETUDE_STATE__。
    var snapshot = view.state || window.__ETUDE_STATE__
    if (snapshot) window.__ETUDE_APPLY__(snapshot, view.api)
  }
}

/* 状态点：齐了 / 做了一半 / 还没开始。设计稿是 ok / half / none 三档。 */
function dotClass(pack) {
  var progress = pack.progress || {}
  var total = progress.total || 0
  if (pack.learnable || progress.done === true) return 'fdot ok'
  if (pack.status === 'failed') return 'fdot none'
  if (total === 0) return 'fdot none'
  if (pack.status === 'media' || pack.status === 'packed') return 'fdot half'
  return 'fdot none'
}

function packTitle(pack) {
  var progress = pack.progress || {}
  return (
    (pack.target || '') +
    ' · ' +
    statusText(pack.status) +
    ' · ' +
    (progress.total || 0) +
    ' 句 / 图 ' +
    (progress.images || 0) +
    ' / 声 ' +
    (progress.audios || 0)
  )
}

function statusText(status) {
  if (status === 'generating') return '正在造例句'
  if (status === 'text') return '例句有了，缺素材'
  if (status === 'media') return '正在配素材'
  if (status === 'packed') return '能出厂'
  if (status === 'exported') return '已导出'
  if (status === 'failed') return '上次出错'
  return status || '刚建好'
}

function drawSideCount(count, ready) {
  var head = document.querySelector('.fx-sidehd')
  if (head) {
    var mut = head.querySelector('.mut')
    if (mut) mut.textContent = ready ? String(count) : '—'
    var nodes = head.childNodes
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].nodeType === 3) {
        nodes[i].nodeValue = '包 '
        break
      }
    }
  } else {
    warn('.fx-sidehd')
  }
  var filter = document.querySelector('.fx-side input.inp')
  if (filter) filter.setAttribute('placeholder', ready ? '在 ' + count + ' 个包里筛…' : '等账本出来…')
}

/* ── 一个包：标题 / 状态条 / 例句 / 六个素材块 ────────────────────────── */

function drawPack(pack, state, token) {
  drawHeader(pack, null)
  drawInfo(pack, null, state)
  drawRows(pack, null)
  // 先把六个素材块里的演示值擦掉，别让设计稿的假图假语音亮着等 RPC
  fillBody(pack, null, null)

  if (!view.api || typeof view.api.rpc !== 'function') {
    insertNote('宿主没给 RPC，例句取不到。')
    return
  }
  callRpc('pack.get', { id: pack.id })
    .then(function (full) {
      if (token !== view.token) return
      if (!full || !Array.isArray(full.examples)) {
        drawRows(null, [])
        insertNote('例句没取到（宿主没回话）。')
        return
      }
      drawHeader(pack, full)
      drawInfo(pack, full.examples, state)
      drawRows(pack, full.examples)
      fillBody(pack, full, full.examples[0] || null)
    })
    .catch(function () {
      if (token !== view.token) return
      drawRows(null, [])
      insertNote('例句没取到（宿主没回话）。')
    })
}

function drawHeader(pack, full) {
  var head = document.querySelector('.fx-wordhd')
  if (!head) {
    warn('.fx-wordhd')
    return
  }
  var h2 = head.querySelector('h2')
  if (h2) h2.textContent = pack.target || '(没名字)'
  var ipa = head.querySelector('.mut.opt')
  if (ipa) ipa.textContent = ipaText(full && full.ipa)
  var chip = head.querySelector('.chip')
  if (chip) chip.textContent = kindText(pack.kind)

  // 义项：账本里一个包只有一条 gloss，所以只有「义项 1」有字
  var def = document.querySelector('.fx-list .fx-def')
  if (def) {
    var dt = def.querySelector('.dt')
    if (dt) dt.textContent = (full && full.gloss) || pack.gloss || '账本里没写释义'
    // 情境画像（场景 / 语域 / 考试 / 出处权重）后端完全没有，别留假百分比
    var prob = def.querySelector('.prob')
    if (prob) {
      prob.style.display = 'none'
      prob.title = '情境画像要模型估一遍，后端还没有这一项'
    }
    var more = def.querySelector('.morep')
    if (more) more.style.display = 'none'
  }
}

function ipaText(ipa) {
  var text = String(ipa || '').trim()
  if (!text) return '没有音标'
  if (text.charAt(0) === '/') return text
  return '/' + text + '/'
}

function kindText(kind) {
  if (kind === 'phrase') return '说法'
  if (kind === 'sentence') return '整句'
  if (kind === 'word') return '单词'
  return '包'
}

/* 状态条：句 / 已出厂 / 有缺口 / 正在加工 / 语言。三个子集按例句逐条数，
   相加一定等于第一项 —— 设计稿的弹层也是这么解释的。 */
function drawInfo(pack, examples, state) {
  var box = document.querySelector('.fx-info')
  if (!box) {
    warn('.fx-info')
    return
  }
  var plain = box.querySelectorAll(':scope > span:not(.sub):not(.sp)')
  var subs = box.querySelectorAll(':scope > span.sub')

  if (!examples) {
    // 例句还没到手：只敢写总的条数（progress 里真有），其余写「还没数」
    setB(plain[0], (pack.progress && pack.progress.total) || 0)
    for (var k = 0; k < subs.length; k += 1) setB(subs[k], '—')
    if (plain[0]) plain[0].title = '例句还在取，三个子集等取到再数'
    return
  }

  var total = examples.length
  var done = 0
  for (var i = 0; i < examples.length; i += 1) if (isComplete(examples[i])) done += 1
  var running = jobRunning(pack, state) ? total - done : 0
  var gap = total - done - running

  setB(plain[0], total)
  if (plain[0]) plain[0].removeAttribute('title')
  setB(subs[0], done)
  setB(subs[1], gap)
  setB(subs[2], running)
  if (subs[0]) subs[0].title = '图有人点过头、语音有人听过，五维齐了的句子'
  if (subs[1]) subs[1].title = '五维没齐，也没在加工'
  if (subs[2]) subs[2].title = running > 0 ? '这个包有后台任务在跑' : '现在没有正在跑的任务'

  // 语言只有 en（LANGUAGES = ['en']），按账本写，不假装支持别的
  var lang = plain[1]
  if (lang) {
    setB(lang, 'en')
    var settings = (state && state.settings) || {}
    if (settings.language && settings.language !== 'en') setB(lang, String(settings.language))
    lang.title = '现在只有英语能生成'
  }
}

function setB(span, value) {
  if (!span) return
  var b = span.querySelector('b')
  if (b) b.textContent = String(value)
  else span.textContent = String(value)
}

/* 一条句子算「齐了」：图有人点头 + 语音有人听过。跟 lib/packs.js 的
   isLearnable 同一套口径 —— 界面上的「齐了」不能比打包那一步更松。 */
function isComplete(example) {
  if (!example) return false
  var image = example.image
  var audio = example.audio
  var imageReview = example.imageReview
  var audioReview = example.audioReview
  return Boolean(
    image &&
      image.file &&
      imageReview &&
      imageReview.by &&
      audio &&
      audio.file &&
      audio.seconds > 0 &&
      audioReview &&
      audioReview.listened === true,
  )
}

function jobRunning(pack, state) {
  var jobs = (state && state.jobs) || []
  for (var i = 0; i < jobs.length; i += 1) {
    var job = jobs[i]
    if (!job) continue
    if (job.result && job.result.packId === pack.id) return true
    if (job.label && String(job.label).indexOf(pack.target || '') >= 0) return true
  }
  return false
}

/* ── 例句列表：一行一句 ───────────────────────────────────────────────── */

function captureTemplates() {
  if (view.rowBodyTpl) return
  if (!view.area) return
  var rows = view.area.querySelectorAll('.fx-row')
  if (!rows.length) {
    warn('.fx-row（设计稿模板）')
    return
  }
  var withBody = null
  var plain = null
  for (var i = 0; i < rows.length; i += 1) {
    if (!withBody && rows[i].querySelector('.fx-body')) withBody = rows[i]
    else if (!plain) plain = rows[i]
  }
  if (!withBody) withBody = rows[0]
  if (!plain) {
    plain = withBody.cloneNode(true)
    var body = plain.querySelector('.fx-body')
    if (body && body.parentNode) body.parentNode.removeChild(body)
  }
  view.rowBodyTpl = withBody.cloneNode(true)
  view.rowTpl = plain.cloneNode(true)
  view.rowBodyTpl.setAttribute('open', '')
  view.rowTpl.removeAttribute('open')
}

function clearRows() {
  if (!view.area) return
  var rows = view.area.querySelectorAll('.fx-row')
  for (var i = 0; i < rows.length; i += 1) {
    if (rows[i].parentNode) rows[i].parentNode.removeChild(rows[i])
  }
  var notes = view.area.querySelectorAll('.fx-note')
  for (var k = 0; k < notes.length; k += 1) {
    if (notes[k].parentNode) notes[k].parentNode.removeChild(notes[k])
  }
}

function drawRows(pack, examples) {
  if (!view.area) return
  clearRows()
  hideExtraSenses()
  if (!examples || !examples.length) {
    insertNote(pack ? '这个包还没有例句，先在上面造料。' : '')
    return
  }
  var senses = view.area.querySelectorAll('.fx-sense')
  var host = senses[0]
  if (!host) {
    warn('.fx-sense')
    return
  }
  for (var i = 0; i < examples.length; i += 1) {
    var template = i === 0 ? view.rowBodyTpl : view.rowTpl
    if (!template) return
    var row = template.cloneNode(true)
    if (i === 0) row.setAttribute('open', '')
    else row.removeAttribute('open')
    fillRow(row, pack, examples[i])
    host.appendChild(row)
  }
}

function fillRow(row, pack, example) {
  var sentence = row.querySelector('.s')
  if (sentence) sentence.innerHTML = highlight(example.sentence || '', pack.target)

  var picks = row.querySelectorAll('.pick')
  for (var p = 0; p < picks.length; p += 1) picks[p].checked = false

  // 五个小点：听 / 说 / 读 / 写 / 改。说（录音）和写（作答）后端没有记录，
  // 一直是空的 —— 这一点在 title 里说清楚，不假装它有。
  var pips = row.querySelectorAll('.pips i')
  var flags = [
    { on: hasAudio(example), why: hasAudio(example) ? '有语音' : '还没有语音' },
    { on: false, why: '录音没有接，这一面一直是空的' },
    { on: hasImage(example), why: hasImage(example) ? '有人点过头的图' : '还没有图' },
    { on: false, why: '没有作答记录' },
    {
      on: false,
      why: hasVariant(pack) ? '替换候选只在包这一层，没记这句选了哪个' : '还没造变体',
    },
  ]
  for (var i = 0; i < pips.length && i < flags.length; i += 1) {
    pips[i].className = flags[i].on ? 'ok' : ''
    pips[i].setAttribute('title', flags[i].why)
  }

  var wc = row.querySelector('.wc')
  if (wc) wc.textContent = wordCount(example.sentence) + ' 词'

  var ix = row.querySelector('.ix')
  if (ix) {
    // 设计稿这一格就是「▶」（时长在下面声块里），别把分秒塞进来挤占句子宽度
    ix.textContent = '▶'
    ix.setAttribute('title', hasAudio(example) ? '播放 ' + secondsText(example.audio.seconds) + '（还没接播放器）' : '还没有语音')
  }

  // 「出厂」这一格的文案照设计稿不动（就是「出厂」），齐没齐写在 title 里。
  // 这里绝不能自己改成「已确认」—— 图要人点过头、语音要人真听过才算。
  var go = row.querySelector('.mini.go')
  if (go) {
    go.textContent = '出厂'
    if (isComplete(example)) go.setAttribute('title', '这一条齐了，可以打包')
    else go.setAttribute('title', '图要人点头、语音要有人听过，这条还没齐')
  }
}

/* ── 六个素材块（只在第一条例句的 .fx-body 里） ───────────────────────── */

function fillBody(pack, full, example) {
  if (!view.area) return
  var body = view.area.querySelector('.fx-body')
  if (!body) {
    warn('.fx-body')
    return
  }
  drawFive(body, pack, full, example)
  drawImage(body, pack, example)
  drawVoice(body, pack, full, example)
  drawVariants(body, pack, full)
  drawResources(body)
  drawBackground(body)
  setFoot(
    '账本里一个包只有一条释义、每句一张图一条语音。义项分组、情境画像、录音、背景、资源挂载都还没有后端字段，' +
      '这里如实空着。图要人点过头、语音要人真听过，两条都过了才算齐。',
  )
}

function drawFive(body, pack, full, example) {
  var rows = body.querySelectorAll('.f5list .f5row')
  if (!rows.length) {
    warn('.f5list .f5row')
    return
  }
  var examples = (full && full.examples) || []
  var total = examples.length
  var audio = countBy(examples, hasAudio)
  var image = countBy(examples, hasImage)
  // 「改」要的是每句换成了哪个说法，账本里只记了包这一层的候选（swaps），
  // 没记每句选了哪个 —— 所以这一维的缺口只能算成整批，不能装作齐了。
  var variants = 0

  // 听 / 说 / 读 / 写 / 改：说和写后端没有数据来源（null = 算不出来）
  var dims = [
    { have: audio, missing: '语音' },
    { have: null, missing: '录音' },
    { have: image, missing: '配图' },
    { have: null, missing: '作答' },
    { have: variants, missing: '变体' },
  ]
  for (var i = 0; i < rows.length && i < dims.length; i += 1) {
    var em = rows[i].querySelector('em')
    if (!em) continue
    var have = dims[i].have
    if (have === null) {
      em.className = 'warn'
      em.textContent = '还没接'
      em.setAttribute(
        'title',
        dims[i].missing === '录音' ? '后端没有录音字段，这一面用不了' : '后端没有作答记录，这一面用不了',
      )
      continue
    }
    if (total === 0) {
      em.className = 'warn'
      em.textContent = '还没有句子'
      em.setAttribute('title', '这个包还没有例句，五维没法数')
      continue
    }
    if (total > 0 && have >= total) {
      em.className = 'ok'
      em.textContent = '齐了'
      em.setAttribute('title', total + ' 条都齐了')
    } else {
      em.className = 'warn'
      em.textContent = '差 ' + (total - have) + ' 个'
      if (dims[i].missing === '变体') {
        em.setAttribute(
          'title',
          hasVariant(pack)
            ? '账本里有 ' + pack.swaps.length + ' 组替换候选，但没记每句最后选了哪个'
            : '还没造变体',
        )
      } else {
        em.setAttribute('title', '还缺 ' + dims[i].missing + '的 ' + (total - have) + ' 条（共 ' + total + ' 条）')
      }
    }
  }
  var lastRow = rows[rows.length - 1]
  if (lastRow) {
    var d = lastRow.querySelector('.d')
    if (d) d.textContent = hasVariant(pack) ? '换一个说法（只到包这一层）' : '换一个说法'
  }
}

function countBy(examples, test) {
  var n = 0
  for (var i = 0; i < examples.length; i += 1) if (test(examples[i])) n += 1
  return n
}

function hasImage(example) {
  return Boolean(example && example.image && example.image.file && example.imageReview && example.imageReview.by)
}

function hasAudio(example) {
  return Boolean(
    example &&
      example.audio &&
      example.audio.file &&
      example.audioReview &&
      example.audioReview.listened === true,
  )
}

function hasVariant(pack) {
  return Boolean(pack && pack.swaps && pack.swaps.length)
}

/* 空的透明占位图。img 得留在版面上，抽掉它 .imgbar 的 flex 行会塌，
   .giftag 和右边那两行字就叠到一起了。 */
var EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/* 图块：图从 RPC 拿字节（宿主整站鉴权，直接写 URL 会是个空格子）。 */
function drawImage(body, pack, example) {
  var bar = body.querySelector('.imgbar')
  if (!bar) {
    warn('.imgbar')
    return
  }
  var img = bar.querySelector('img')
  var tag = bar.querySelector('.giftag')
  var im = bar.querySelector('.im')
  var title = im && im.querySelector('b')
  var meta = im && im.querySelector('span')
  var image = (example && example.image) || null

  if (img) {
    img.style.display = ''
    img.src = EMPTY_IMAGE
    img.setAttribute('alt', image && image.file ? example.sentence || '例句配图' : '还没有图')
    img.setAttribute('title', '点开换图')
  }
  if (!image || !image.file) {
    if (title) title.textContent = '还没选图'
    if (meta) meta.textContent = '账本里这一条没有图'
    if (tag) tag.hidden = true
    return
  }
  if (tag) {
    tag.hidden = false
    tag.textContent = '静图'
  }
  if (title) {
    title.textContent =
      example.imageReview && example.imageReview.by
        ? '人已点头 · ' + example.imageReview.by
        : '还没人看过这张'
  }
  if (meta) {
    meta.textContent = [
      image.source || '图库',
      image.license || '许可没写',
      image.width && image.height ? image.width + '×' + image.height : '尺寸没记',
    ].join(' · ')
  }
  var token = view.token
  callRpc('image.bytes', { file: image.file, kind: 'images' })
    .then(function (result) {
      if (token !== view.token) return
      var base64 = result && result.dataBase64
      if (!base64) {
        if (meta) meta.textContent += ' · 图没取到'
        return
      }
      if (!img) return
      img.src = 'data:' + mimeOf(image.file, result.mediaType) + ';base64,' + base64
    })
    .catch(function () {
      if (token !== view.token) return
      if (meta) meta.textContent += ' · 图没取到'
    })
}

function mimeOf(file, mediaType) {
  if (mediaType) return mediaType
  var name = String(file || '').toLowerCase()
  if (name.slice(-4) === '.png') return 'image/png'
  if (name.slice(-5) === '.webp') return 'image/webp'
  if (name.slice(-4) === '.gif') return 'image/gif'
  return 'image/jpeg'
}

/* 声块：音色表是真的（pack.voice.list），时长是音频文件里记的秒数。 */
function drawVoice(body, pack, full, example) {
  var line = body.querySelector('.vline')
  if (!line) {
    warn('.vline')
    return
  }
  var select = line.querySelector('select')
  var duration = line.querySelector('span.mut')
  var audio = (example && example.audio) || null
  var current = (audio && audio.voice) || (full && full.voiceChoice && full.voiceChoice.voice) || ''
  var settings = view.settings.voice || ''

  if (duration) {
    if (audio && audio.seconds > 0) {
      duration.textContent = secondsText(audio.seconds)
      duration.setAttribute(
        'title',
        '引擎 ' + (audio.engine || '没记') + ' · 音色 ' + (audio.voice || '没记'),
      )
    } else {
      duration.textContent = '没有语音'
      duration.setAttribute('title', '这一条还没合成')
    }
  }

  if (!select) {
    warn('.vline select')
    return
  }
  var token = view.token
  var fallback = current || settings
  // 先放一个能用的：账本里记着的那条语音用的音色
  setVoiceOptions(select, fallback ? [{ id: fallback, label: fallback }] : [], fallback)
  if (!view.api) return
  callRpc('pack.voice.list')
    .then(function (result) {
      if (token !== view.token) return
      var voices = (result && result.voices) || []
      if (!voices.length) return
      setVoiceOptions(select, voices, fallback)
    })
    .catch(function () {
      /* 音色表取不到就留着那一个真实音色，不编列表 */
    })
}

function setVoiceOptions(select, voices, current) {
  clear(select)
  if (!voices.length) {
    var none = document.createElement('option')
    none.textContent = '没有语音'
    select.appendChild(none)
    select.disabled = true
    return
  }
  var matched = false
  for (var i = 0; i < voices.length && i < 400; i += 1) {
    var voice = voices[i] || {}
    var option = document.createElement('option')
    option.value = voice.id || ''
    option.textContent = voice.label || voice.id || '没名字的音色'
    if (voice.locale) option.setAttribute('data-locale', voice.locale)
    if (current && voice.id === current) matched = true
    select.appendChild(option)
  }
  select.disabled = false
  if (current) select.value = matched ? current : voices[0].id || ''
  else select.selectedIndex = 0
}

/* 变体块：账本里只有「包这一层的替换候选」，没记每句最后选了哪个。 */
function drawVariants(body, pack, full) {
  var chips = body.querySelector('.chips')
  if (!chips) {
    warn('.chips')
    return
  }
  clear(chips)
  var swaps = (full && full.swaps) || (pack && pack.swaps) || []
  var shown = 0
  for (var i = 0; i < swaps.length && shown < 8; i += 1) {
    var swap = swaps[i] || {}
    var candidates = swap.candidates || []
    for (var k = 0; k < candidates.length && shown < 8; k += 1) {
      var chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = candidates[k]
      chip.setAttribute(
        'title',
        (swap.role ? swap.role + ' · ' : '') + '原句用的是 ' + (swap.original || '？') + '；账本没记选了哪个',
      )
      chips.appendChild(chip)
      shown += 1
    }
  }
  if (!shown) {
    var empty = document.createElement('span')
    empty.className = 'chip'
    empty.textContent = '还没造变体'
    chips.appendChild(empty)
  }
  var sibling = chips.parentNode ? chips.parentNode.querySelector('p.mut.note') : null
  if (sibling) {
    sibling.textContent =
      '变体只造到包这一层：账本里有 ' +
      swaps.length +
      ' 组替换候选，但没记每句最后选了哪个，也没加图没加声。'
  }
}

/* 资源块：RPC 里没有资源挂载。 */
function drawResources(body) {
  var list = body.querySelector('.resl')
  if (!list) {
    warn('.resl')
    return
  }
  clear(list)
  var li = document.createElement('li')
  li.innerHTML =
    '<span class="rt post">—</span>' +
    '<span class="mut">资源挂载还没接：RPC 里没有这一项，动图、视频、帖子都填不进来</span>'
  list.appendChild(li)
}

/* 背景块：RPC 里没有背景字段（谁 / 何时 / 何处 / 语气）。 */
function drawBackground(body) {
  var list = body.querySelector('.bgl')
  if (!list) {
    warn('.bgl')
    return
  }
  clear(list)
  var li = document.createElement('li')
  li.innerHTML =
    '<b>背景</b><span class="mut">还没接：账本里没有「谁 / 何时 / 何处 / 语气」这几个字段</span>' +
    '<span class="bops"></span>'
  list.appendChild(li)
  var add = body.querySelector('.bgadd')
  if (add) add.setAttribute('title', '后端没有背景字段，加了也存不进账本')
}

/* ── 小工具 ───────────────────────────────────────────────────────────── */

function pickPack(packs) {
  if (view.sel) {
    for (var i = 0; i < packs.length; i += 1) if (packs[i].id === view.sel) return packs[i]
  }
  view.sel = packs[0].id
  return packs[0]
}

function sortPacks(packs) {
  return packs.slice().sort(function (a, b) {
    var left = String(a.updatedAt || a.createdAt || '')
    var right = String(b.updatedAt || b.createdAt || '')
    return left < right ? 1 : left > right ? -1 : 0
  })
}

/* 例句还不存在时只清空、不留设计稿的演示数字。 */
function blankMain(state, message) {
  var error = Boolean(state && state.status === 'error')
  var empty = Boolean(state && state.status === 'ready')
  var head = document.querySelector('.fx-wordhd')
  if (head) {
    var h2 = head.querySelector('h2')
    if (h2) h2.textContent = error ? '账本读不出来' : empty ? '账本里还没有包' : '账本还没出来'
    var ipa = head.querySelector('.mut.opt')
    if (ipa) ipa.textContent = ''
    var chip = head.querySelector('.chip')
    if (chip) chip.textContent = ''
  }
  var box = document.querySelector('.fx-info')
  if (box) {
    var plain = box.querySelectorAll(':scope > span:not(.sub):not(.sp)')
    var subs = box.querySelectorAll(':scope > span.sub')
    for (var i = 0; i < plain.length; i += 1) setB(plain[i], '—')
    for (var k = 0; k < subs.length; k += 1) setB(subs[k], '—')
  }
  var def = document.querySelector('.fx-list .fx-def')
  if (def) {
    var dt = def.querySelector('.dt')
    if (dt) dt.textContent = empty ? '先造一个包' : '等账本'
  }
  clearRows()
  insertNote(
    message ||
      (state && state.status === 'error'
        ? '账本读不出来（' + (state.error || '宿主没回话') + '），这一页先空着。'
        : '正在读账本，稍等一下。'),
  )
  setFoot('')
}

function hideExtraSenses() {
  if (!view.area) return
  var senses = view.area.querySelectorAll('.fx-sense')
  for (var i = 1; i < senses.length; i += 1) {
    senses[i].style.display = 'none'
    // 账本里只有一条释义，后面这几个义项的名字和解释都是设计稿的演示文案
    var dn = senses[i].querySelector('.dn')
    if (dn) dn.textContent = ''
    var dt = senses[i].querySelector('.dt')
    if (dt) dt.textContent = ''
    var prob = senses[i].querySelector('.prob')
    if (prob) prob.style.display = 'none'
  }
}

function insertNote(text) {
  var host = view.list || view.area
  if (!host || !text) return
  var note = document.createElement('p')
  note.className = 'mut fx-note'
  note.textContent = text
  host.appendChild(note)
}

function setFoot(text) {
  var foot = document.querySelector('.fx-foot')
  if (!foot) {
    if (text) warn('.fx-foot')
    return
  }
  foot.textContent = text
}

function callRpc(endpoint, payload) {
  var api = view.api
  if (!api || typeof api.rpc !== 'function') return Promise.reject(new Error('没有 RPC'))
  try {
    return Promise.resolve(api.rpc(endpoint, payload))
  } catch (error) {
    return Promise.reject(error)
  }
}

function secondsText(seconds) {
  var value = Number(seconds)
  if (!isFinite(value) || value <= 0) return '0s'
  return (value < 10 ? value.toFixed(1) : String(Math.round(value))) + 's'
}

function wordCount(sentence) {
  var text = String(sentence || '').trim()
  if (!text) return 0
  return text.split(/\s+/).length
}

/* 目标词加粗：整句目标整段包起来，单个词按词形开头匹配（abandoned / abandoning）。 */
function highlight(sentence, target) {
  var safe = esc(sentence)
  var word = String(target || '').trim()
  if (!word) return safe
  var escaped = esc(word)
  if (escaped.indexOf(' ') >= 0) {
    return safe.replace(new RegExp(escapeRegExp(escaped), 'gi'), function (hit) {
      return '<b>' + hit + '</b>'
    })
  }
  var lower = escaped.toLowerCase()
  var stem = lower.slice(-1) === 'e' ? lower.slice(0, -1) : lower
  return safe.replace(/[A-Za-z][A-Za-z'’-]*/g, function (token) {
    var probe = token.toLowerCase()
    if (probe.indexOf(stem) === 0) return '<b>' + token + '</b>'
    return token
  })
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function clear(node) {
  if (!node) return
  while (node.firstChild) node.removeChild(node.firstChild)
}

function warn(what) {
  try {
    console.warn('[etude/factory] 找不到锚点 ' + what + '，跳过这一段。')
  } catch (error) {
    /* console 都没有就算了 */
  }
}
