/* adapters/detail.js · 详情页（design/detail.html）的数据适配
 *
 * 这一页 = 句库页 + 右边一个抽屉。抽屉里设计稿写的是 Anki 调度：
 * 「档 4 · 4 天后」「4 天 / 偏难 / 7 次 / 10月22日」「最近七次：10月30日 打 卡住」。
 * 插件没有调度引擎 —— 这些数一条都算不出来，所以整块如实写成「没有调度记录」，
 * 一个假数字都不留。真能填的是：句子本身、说法和释义、场景、原声是谁合成的。
 *
 * 契约同 cards.js：window.__ETUDE_APPLY__ = function (state, api)
 * 规矩：只改值；列表行可整批重建；锚点缺了 console.warn 跳过；幂等。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  var skin = (window.__ETUDE_DETAIL__ = window.__ETUDE_DETAIL__ || {
    id: null,
    ord: 1,
    token: 0,
    api: api,
  })
  skin.api = api

  var left = document.querySelector('.split > section')
  var table = document.querySelectorAll('.split > section')[1]
  if (!left) {
    console.warn('[etude/detail] 找不到左栏 .split > section，跳过')
    return
  }
  if (!table) {
    console.warn('[etude/detail] 找不到右栏句子表，跳过')
    return
  }

  if (!state || state.status !== 'ready') {
    setSub('账本还没读出来，稍等一下。')
    return
  }

  var packs = (state.packs || []).slice()
  var total = 0
  for (var i = 0; i < packs.length; i += 1) total += Number((packs[i].progress || {}).total) || 0

  setSub(total + ' 句 · ' + packs.length + ' 个包 · 按面看进度')
  setChips(total, packs)

  var picked = null
  for (var p = 0; p < packs.length; p += 1) {
    if (packs[p].id === skin.id) picked = packs[p]
  }
  if (!picked) picked = packs[0] || null
  skin.id = picked ? picked.id : null

  renderList(left, packs, skin.id)
  if (!picked) {
    renderTable(table, null)
    renderEmptyDrawer()
    return
  }
  loadPack(picked.id, table, api, skin)
}

// ── 左栏：一行一个包 ───────────────────────────────────────────────────────

function renderList(box, packs, selectedId) {
  var tail = tailRow(box)
  setListHead(box)
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
    var cards = sentences * 5 // 一句话五个面 = 五张卡
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
      tail.style.display = 'none'
    }
  }
}

function pickPack(row, pack) {
  return function () {
    var skin = window.__ETUDE_DETAIL__ || {}
    skin.id = pack.id
    skin.ord = 1
    var all = document.querySelectorAll('.litem[data-etude="pack"]')
    for (var i = 0; i < all.length; i += 1) {
      all[i].className = all[i] === row ? 'litem on' : 'litem'
    }
    var table = document.querySelectorAll('.split > section')[1]
    if (table) loadPack(pack.id, table, skin.api, skin)
  }
}

function tailRow(box) {
  var skin = window.__ETUDE_DETAIL__ || {}
  if (skin.tail && box.contains(skin.tail)) return skin.tail
  var rows = box.querySelectorAll('.row')
  for (var i = 0; i < rows.length; i += 1) {
    if (/还有/.test(rows[i].textContent || '')) {
      skin.tail = rows[i]
      return rows[i]
    }
  }
  console.warn('[etude/detail] 左栏没找到「还有 6 个」那条尾巴，缺口就不显示了')
  return null
}

/* 表头「说法 / 句子 · 卡住」里的「卡住」是调度口径，插件没有。
   改成「包 / 句子 · 卡片」：每句话派五个面，五个面就是五张卡。 */
function setListHead(box) {
  var head = box.querySelector('.row')
  if (!head || head.querySelectorAll('.mut').length < 2) {
    console.warn('[etude/detail] 左栏表头对不上，跳过')
    return
  }
  var cells = head.querySelectorAll('.mut')
  cells[0].textContent = '包'
  cells[1].textContent = '句子 · 卡片'
  cells[1].setAttribute('title', '每句话派五个面，就是五张卡')
}

// ── 右栏 + 抽屉 ───────────────────────────────────────────────────────────

function loadPack(id, table, api, skin) {
  var body = table.querySelector('tbody')
  if (!body) {
    console.warn('[etude/detail] 右栏表里没有 tbody，跳过')
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
      if (!skin || token !== skin.token) return
      renderTable(table, full)
      fillDrawer(full, skin.ord)
    })
    .catch(function (error) {
      if (!skin || token !== skin.token) return
      renderNotice(body, '例句没取到：' + String((error && error.message) || error))
    })
}

function renderTable(table, full) {
  var body = table.querySelector('tbody')
  if (!body) {
    console.warn('[etude/detail] 右栏表里没有 tbody，跳过')
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
  var skin = window.__ETUDE_DETAIL__ || {}
  for (var n = 0; n < examples.length; n += 1) {
    var ex = examples[n] || {}
    var ord = n + 1
    var hasRead = !!(ex.image && ex.image.file)
    var hasListen = !!(ex.audio && ex.audio.file)
    var hasChange = !!((full.swaps && full.swaps.length) || (ex.zhVariants && ex.zhVariants.length))
    var tr = document.createElement('tr')
    tr.className = 'clickable'
    tr.setAttribute('data-etude', 'sent')
    tr.setAttribute('data-ord', String(ord))
    tr.innerHTML =
      '<td><div class="sent">' + markTarget(ex.sentence, target) + '</div></td>' +
      '<td>' +
      pip(hasRead) +
      '</td>' +
      '<td>' +
      pip(false) +
      '</td>' +
      '<td>' +
      pip(hasListen) +
      '</td>' +
      '<td>' +
      pip(false) +
      '</td>' +
      '<td>' +
      pip(hasChange) +
      '</td>' +
      '<td class="mut">没记</td>'
    tr.addEventListener('click', pickSentence(ord, full))
    body.appendChild(tr)
  }
  if (skin.ord > examples.length) skin.ord = 1
}

function pickSentence(ord, full) {
  return function () {
    var skin = window.__ETUDE_DETAIL__ || {}
    skin.ord = ord
    fillDrawer(full, ord)
  }
}

// ── 抽屉：能填的填真值，调度那几块如实写「没有调度记录」 ───────────────────

function fillDrawer(full, ord) {
  var drawer = document.querySelector('.drawer')
  if (!drawer) {
    console.warn('[etude/detail] 找不到 .drawer，抽屉跳过')
    return
  }
  var examples = (full && full.examples) || []
  var head = drawer.querySelector('.dhead')
  var dtitle = drawer.querySelector('.dtitle')
  var dsub = drawer.querySelector('.dsub')
  if (!head) console.warn('[etude/detail] 抽屉没有 .dhead')

  if (!full) {
    if (dtitle) dtitle.textContent = '还没有包'
    if (dsub) dsub.textContent = '账本里一个包都没有'
    return
  }

  var example = examples[ord - 1] || examples[0] || null
  if (dtitle) dtitle.textContent = example ? example.sentence || '' : '这个包还没有例句'
  if (dsub) {
    dsub.textContent =
      (full.target || '') +
      ' · ' +
      kindText(full.kind) +
      ' · ' +
      (examples.length || 0) +
      ' 句 · 出处账本没记'
  }

  var secs = drawer.querySelectorAll('.dsec')
  if (!secs.length) {
    console.warn('[etude/detail] 抽屉里没有 .dsec，跳过')
    return
  }

  // ① 五个面：设计稿是「已过 / 档 4 · 4 天后」。插件没有练习记录，写成「没练过」。
  var rows = secs[0].querySelectorAll('.drow')
  var faceNames = ['读', '打', '听', '说', '改']
  var hasRead = !!(example && example.image && example.image.file)
  var hasListen = !!(example && example.audio && example.audio.file)
  var hasChange = !!((full.swaps && full.swaps.length) || (example && example.zhVariants && example.zhVariants.length))
  var have = [hasRead, false, hasListen, false, hasChange]
  for (var i = 0; i < rows.length && i < faceNames.length; i += 1) {
    var pipNode = rows[i].querySelector('.pip')
    if (pipNode) pipNode.className = 'pip' + (have[i] ? ' ok' : '')
    var dst = rows[i].querySelector('.dst')
    if (dst) dst.textContent = '没练过'
    var tail = rows[i].querySelector('.mut')
    if (tail) {
      tail.textContent = '没有调度记录'
      tail.setAttribute('title', '插件没有 Anki 调度：间隔、难度、复习次数一条都没有')
    }
  }

  // ② 卡片信息：四个格子全是调度数，一个都算不出来
  var dv = drawer.querySelectorAll('.dgrid .dv')
  if (!dv.length) console.warn('[etude/detail] 卡片信息里没有 .dv，跳过')
  for (var v = 0; v < dv.length; v += 1) {
    dv[v].textContent = '没有调度记录'
    dv[v].setAttribute('title', '插件不管复习排期，这四个数都没有')
  }

  // ③ 最近七次：一条复习记录都没有
  if (secs[2]) {
    var heading = secs[2].querySelector('.dsech')
    if (heading) heading.textContent = '最近七次 · 后端没有记录'
    var past = secs[2].querySelectorAll('.drow')
    for (var k = 0; k < past.length; k += 1) {
      if (past[k].parentNode) past[k].parentNode.removeChild(past[k])
    }
    var note = document.createElement('div')
    note.className = 'drow'
    note.setAttribute('data-etude', 'note')
    note.innerHTML =
      '<span class="mut" style="width:76px">—</span>' +
      '<span class="df">—</span>' +
      '<span class="pip"></span>' +
      '<span class="mut" style="margin-left:auto">还没有复习记录</span>'
    secs[2].appendChild(note)
  } else {
    console.warn('[etude/detail] 抽屉里找不到「最近七次」那段，跳过')
  }

  // ④ 这一句：真有的是句子、原声、说法、场景；出处后端没记
  if (secs[3]) {
    var lines = secs[3].querySelectorAll('.drow')
    var audio = example && example.audio
    if (lines[0]) {
      var seconds = audio && audio.seconds ? Number(audio.seconds).toFixed(1) + 's' : '—'
      var df = lines[0].querySelector('.df')
      if (df) df.textContent = '原声 ' + seconds
      var who = lines[0].querySelector('.mut')
      if (who) {
        who.textContent = audio
          ? String(audio.engine || '语音') + ' · ' + String(audio.voice || '')
          : '还没有语音'
      }
      var kbd = lines[0].querySelector('.kbd')
      if (kbd) kbd.setAttribute('title', '点了不响：播放还没接')
    }
    if (lines[1]) {
      var m1 = lines[1].querySelector('.mut')
      if (m1) m1.textContent = (full.target || '') + ' · ' + (full.gloss || '没有释义')
    }
    if (lines[2]) {
      var m2 = lines[2].querySelector('.mut')
      if (m2) m2.textContent = (example && (example.sceneZh || example.sceneEn)) || '账本没记场景'
    }
    if (lines[3]) {
      var m3 = lines[3].querySelector('.mut')
      if (m3) m3.textContent = '账本没记出处（导入视频那条路还没接）'
    }
  } else {
    console.warn('[etude/detail] 抽屉里找不到「这一句」那段，跳过')
  }

  // ⑤ 底部三个按钮：搁置 / 重置 没有后端，如实关掉；「现在练这一句」能走。
  var footButtons = drawer.querySelectorAll('.dfoot .btn')
  for (var b = 0; b < footButtons.length; b += 1) {
    var label = (footButtons[b].textContent || '').trim()
    if (label === '搁置' || label === '重置') {
      footButtons[b].disabled = true
      footButtons[b].style.opacity = '.45'
      footButtons[b].style.cursor = 'default'
      footButtons[b].setAttribute('title', '还没接：插件里没有搁置和重置接口')
    } else {
      footButtons[b].setAttribute('title', '去学习页练这个说法')
      goStudy(footButtons[b], full.target)
    }
  }
}

/* 页面里只有 <a href="#nav:..."> 会被宿主拦成切页；按钮得自己造一个再点。 */
function goStudy(button, target) {
  if (!button || button.getAttribute('data-etude-nav')) return
  button.setAttribute('data-etude-nav', '1')
  button.addEventListener('click', function () {
    var link = document.createElement('a')
    link.href = '#nav:study?w=' + encodeURIComponent(String(target || ''))
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    setTimeout(function () {
      if (link.parentNode) link.parentNode.removeChild(link)
    }, 0)
  })
}

function renderEmptyDrawer() {
  var drawer = document.querySelector('.drawer')
  if (!drawer) return
  var dtitle = drawer.querySelector('.dtitle')
  if (dtitle) dtitle.textContent = '还没有包'
  var dsub = drawer.querySelector('.dsub')
  if (dsub) dsub.textContent = '账本里一个包都没有，去「工厂」造一个'
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

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
  return '包'
}

function setSub(text) {
  var node = document.querySelector('.hdr .sub')
  if (node) node.textContent = text
  else console.warn('[etude/detail] 找不到 .hdr .sub，跳过')
}

/* 四个 chip 设计稿写的是「卡住 / 没开始 / 过了」——调度口径，插件没有。
   换成能算的：句子数、包数、能练的包数、配图配声齐的句子数给不出，就写包。 */
function setChips(total, packs) {
  var chips = document.querySelectorAll('.hdr .act .chip')
  if (!chips.length) {
    console.warn('[etude/detail] 找不到 .hdr .act .chip，跳过')
    return
  }
  var learnable = 0
  for (var i = 0; i < packs.length; i += 1) if (packs[i].learnable) learnable += 1
  var labels = [
    '全部 ' + total + ' 句',
    '包 ' + packs.length + ' 个',
    '能练 ' + learnable + ' 个',
    '没调度的 ' + (packs.length - learnable) + ' 个',
  ]
  for (var c = 0; c < chips.length && c < labels.length; c += 1) chips[c].textContent = labels[c]
  if (chips[0]) chips[0].setAttribute('title', '账本里所有包的例句总数')
  if (chips[1]) chips[1].setAttribute('title', '左栏一行一个包')
  if (chips[2]) chips[2].setAttribute('title', '图和音齐了、已经打包的包')
  if (chips[3]) chips[3].setAttribute('title', '还没有一条复习记录')
}
