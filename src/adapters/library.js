/* adapters/library.js · 句库页（design/library.html）的数据适配
 *
 * 设计稿里是 6 个说法 + 6 句话，句子后面五个面（读/打/听/说/改）各点着
 * ok / warn / bad，来源写着「老友记」「日记」「字幕」。插件这边：
 *   · 左边一栏 = 账本里的包（一个包一行），点一下换右边那包句子；
 *   · 右边表格 = pack.get 拿到的 examples[]，五个面按「有没有素材」上色；
 *   · 来源这一列后端压根没记，所以如实写「没记」，不编。
 *
 * 契约（同 cards.js）：window.__ETUDE_APPLY__ = function (state, api)
 *   state = { status, packs:[...], root, ... }；api.rpc(endpoint, payload) → Promise
 *
 * 规矩：
 *   · 只改值，不重排结构；列表行（.litem / tbody tr）可以整批重建，
 *     但每次都先把上一轮插的、和设计稿那几行一起清掉，不会越堆越多；
 *   · 找不到锚点 console.warn 然后跳过，绝不抛错把整页打空；
 *   · 算不出来的数写成一句话说明，不留设计稿的假数字。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  var skin = (window.__ETUDE_LIB__ = window.__ETUDE_LIB__ || { id: null, token: 0, api: api })

  var left = document.querySelector('.split > section')
  var table = document.querySelectorAll('.split > section')[1]
  if (!left) {
    console.warn('[etude/library] 找不到左栏 .split > section，跳过')
    return
  }
  if (!table) {
    console.warn('[etude/library] 找不到右栏句子表，跳过')
    return
  }
  skin.api = api

  if (!state || state.status !== 'ready') {
    setSub('账本还没读出来，稍等一下。')
    return
  }

  var packs = (state.packs || []).slice()
  var total = 0
  var images = 0
  var audios = 0
  for (var i = 0; i < packs.length; i += 1) {
    var pr = packs[i].progress || {}
    total += Number(pr.total) || 0
    images += Number(pr.images) || 0
    audios += Number(pr.audios) || 0
  }

  setSub(total + ' 句 · ' + packs.length + ' 个包 · 按面看进度')
  setChips(total, images, audios)

  // 选中的包：上一次选的那个还在就留着，否则取第一个
  var picked = null
  for (var p = 0; p < packs.length; p += 1) {
    if (packs[p].id === skin.id) picked = packs[p]
  }
  if (!picked) picked = packs[0] || null
  skin.id = picked ? picked.id : null

  renderList(left, packs, skin.id)
  if (!picked) {
    renderTable(table, null, null)
    return
  }
  loadSentences(picked.id, table, api, skin)
}

// ── 左栏：一行一个包 ───────────────────────────────────────────────────────

function renderList(box, packs, selectedId) {
  var tail = tailRow(box)
  setListHead(box)

  // 清掉上一轮/设计稿的行（表头行和尾巴行是 .row，不会被误删）
  var olds = box.querySelectorAll('.litem')
  for (var i = 0; i < olds.length; i += 1) {
    if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i])
  }

  if (!packs.length) {
    var empty = document.createElement('div')
    empty.className = 'litem'
    empty.style.cursor = 'default'
    empty.innerHTML = '<span class="mut">账本里还没有包，去「工厂」造一个</span>'
    box.insertBefore(empty, tail)
    if (tail) tail.style.display = 'none'
    return
  }

  var gap = 0
  for (var g = 0; g < packs.length; g += 1) {
    if (!((packs[g].progress || {}).total > 0)) gap += 1
  }

  for (var n = 0; n < packs.length; n += 1) {
    var pack = packs[n]
    var progress = pack.progress || {}
    var sentences = Number(progress.total) || 0
    // 卡片数按面算：一句话派五个面，就是五张卡（统计页同口径）。
    var cards = sentences * 5
    var row = document.createElement('div')
    row.className = 'litem' + (pack.id === selectedId ? ' on' : '')
    row.setAttribute('data-etude', 'pack')
    row.setAttribute('data-id', pack.id || '')
    row.setAttribute(
      'title',
      (pack.target || '') + ' · ' + sentences + ' 句 · 每句五个面 = ' + cards + ' 张卡',
    )
    row.innerHTML =
      '<span class="en">' +
      escapeHtml(pack.target || '(没名字)') +
      '</span>' +
      '<span class="mut">' +
      escapeHtml(pack.gloss || kindText(pack.kind)) +
      '</span>' +
      '<span class="mut" style="margin-left:auto">' +
      sentences +
      ' · ' +
      cards +
      '</span>'
    row.addEventListener('click', pickPack(row, pack))
    box.insertBefore(row, tail)
  }

  if (tail) {
    if (gap > 0) {
      tail.style.display = ''
      var cells = tail.children
      if (cells[0]) cells[0].textContent = '还有 ' + gap + ' 个包没例句'
      if (cells[1]) cells[1].textContent = '0 句'
    } else {
      // 没有缺口就不显示这条尾巴
      tail.style.display = 'none'
    }
  }
}

function pickPack(row, pack) {
  return function () {
    var skin = window.__ETUDE_LIB__ || {}
    skin.id = pack.id
    var all = document.querySelectorAll('.litem[data-etude="pack"]')
    for (var i = 0; i < all.length; i += 1) {
      all[i].className = all[i] === row ? 'litem on' : 'litem'
    }
    var table = document.querySelectorAll('.split > section')[1]
    if (table) loadSentences(pack.id, table, skin.api, skin)
  }
}

function tailRow(box) {
  var skin = window.__ETUDE_LIB__ || {}
  if (skin.tail && box.contains(skin.tail)) return skin.tail
  var rows = box.querySelectorAll('.row')
  for (var i = 0; i < rows.length; i += 1) {
    if (/还有/.test(rows[i].textContent || '')) {
      skin.tail = rows[i]
      return rows[i]
    }
  }
  console.warn('[etude/library] 左栏没找到「还有 6 个」那条尾巴，缺口就不显示了')
  return null
}

/* 表头设计稿是「说法 / 句子 · 卡住」——「卡住」是调度口径，插件没有。
   改成「包 / 句子 · 卡片」，第三列的数字和第二列对得上：每句五个面 = 五张卡。 */
function setListHead(box) {
  var head = box.querySelector('.row')
  if (!head || head.querySelectorAll('.mut').length < 2) {
    console.warn('[etude/library] 左栏表头对不上，跳过')
    return
  }
  var cells = head.querySelectorAll('.mut')
  cells[0].textContent = '包'
  cells[1].textContent = '句子 · 卡片'
  cells[1].setAttribute('title', '每句话派五个面，就是五张卡')
}

// ── 右栏：一个包的句子表 ───────────────────────────────────────────────────

function loadSentences(id, table, api, skin) {
  var body = table.querySelector('tbody')
  if (!body) {
    console.warn('[etude/library] 右栏表里没有 tbody，跳过')
    return
  }
  renderNotice(body, '正在读这个包的句子…')
  if (!api || !api.rpc) {
    renderNotice(body, '没有宿主连接，读不到例句')
    return
  }
  skin.token = (skin.token || 0) + 1
  var token = skin.token
  api
    .rpc('pack.get', { id: id })
    .then(function (full) {
      if (!skin || token !== skin.token) return // 又点了别的包，这次的结果作废
      renderTable(table, full)
    })
    .catch(function (error) {
      if (!skin || token !== skin.token) return
      renderNotice(body, '例句没取到：' + String((error && error.message) || error))
    })
}

function renderTable(table, full, _unused) {
  var body = table.querySelector('tbody')
  if (!body) {
    console.warn('[etude/library] 右栏表里没有 tbody，跳过')
    return
  }
  var olds = body.querySelectorAll('tr')
  for (var i = 0; i < olds.length; i += 1) {
    if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i])
  }

  var examples = (full && full.examples) || []
  if (!full) {
    renderNotice(body, '左边还没有包')
    return
  }
  if (!examples.length) {
    renderNotice(body, '这个包还没有例句')
    return
  }

  var target = full.target || ''
  for (var n = 0; n < examples.length; n += 1) {
    var ex = examples[n] || {}
    var hasRead = !!(ex.image && ex.image.file)
    var hasListen = !!(ex.audio && ex.audio.file)
    var hasChange = !!((full.swaps && full.swaps.length) || (ex.zhVariants && ex.zhVariants.length))
    var tr = document.createElement('tr')
    tr.setAttribute('data-etude', 'sent')
    tr.innerHTML =
      '<td><div class="sent">' + markTarget(ex.sentence, target) + '</div></td>' +
      '<td>' +
      pip(hasRead) +
      '</td>' +
      '<td>' +
      pip(false) + // 打：批改/打字进度后端没有
      '</td>' +
      '<td>' +
      pip(hasListen) +
      '</td>' +
      '<td>' +
      pip(false) + // 说：录音还没接
      '</td>' +
      '<td>' +
      pip(hasChange) +
      '</td>' +
      '<td class="mut" title="账本里没有出处字段，只有一句例句">没记</td>'
    tr.className = 'clickable'
    tr.setAttribute('title', '看这句详情')
    tr.addEventListener('click', navDetail)
    body.appendChild(tr)
  }
}

/* 页面里只有 <a href="#nav:..."> 会被宿主拦成切页；行要自己造一个再点。 */
function navDetail() {
  var link = document.createElement('a')
  link.href = '#nav:detail'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(function () {
    if (link.parentNode) link.parentNode.removeChild(link)
  }, 0)
}

function renderNotice(body, text) {
  var olds = body.querySelectorAll('tr')
  for (var i = 0; i < olds.length; i += 1) {
    if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i])
  }
  var tr = document.createElement('tr')
  tr.setAttribute('data-etude', 'note')
  tr.innerHTML = '<td colspan="7" class="mut">' + escapeHtml(text) + '</td>'
  body.appendChild(tr)
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

function pip(have) {
  return '<span class="pip' + (have ? ' ok' : '') + '"></span>'
}

function markTarget(sentence, target) {
  var text = String(sentence || '')
  var needle = String(target || '')
  if (!needle) return escapeHtml(text)
  var at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return escapeHtml(text)
  return (
    escapeHtml(text.slice(0, at)) +
    '<u>' +
    escapeHtml(text.slice(at, at + needle.length)) +
    '</u>' +
    escapeHtml(text.slice(at + needle.length))
  )
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function kindText(kind) {
  if (kind === 'word') return '单词'
  if (kind === 'phrase') return '说法'
  if (kind === 'sentence') return '整句'
  return ''
}

function setSub(text) {
  var node = document.querySelector('.hdr .sub')
  if (node) node.textContent = text
  else console.warn('[etude/library] 找不到 .hdr .sub，跳过')
}

/* 设计稿四个筛选 chip 是「全部 / 卡住 4 / 没开始 9 / 过了 24」——那是调度口径，
   插件没有调度引擎。换成真能算的四个数：句子、配图、配声、还差多少样。 */
function setChips(total, images, audios) {
  var chips = document.querySelectorAll('.hdr .act .chip')
  if (!chips.length) {
    console.warn('[etude/library] 找不到 .hdr .act .chip，跳过')
    return
  }
  var labels = [
    '全部 ' + total + ' 句',
    '配图 ' + images + ' 句',
    '配声 ' + audios + ' 句',
    '还差 ' + Math.max(0, total * 2 - images - audios) + ' 样',
  ]
  for (var i = 0; i < chips.length && i < labels.length; i += 1) {
    chips[i].textContent = labels[i]
  }
  if (chips[1]) chips[1].setAttribute('title', '有配图、也复核过的句子数')
  if (chips[2]) chips[2].setAttribute('title', '有语音、也听过的句子数')
  if (chips[3]) chips[3].setAttribute('title', '每句要配图 + 配声两样都齐')
}
