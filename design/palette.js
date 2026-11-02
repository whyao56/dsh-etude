// 全局搜索（命令面板）：任何页面 Ctrl+K 唤出。
// 排序 = 命中程度 + 常用/最近（frecency），不是固定清单。
(function () {
  if (window.__paletteReady) return
  window.__paletteReady = true

  var STORE_KEY = 'kf-pal:v1'
  var MAX_QUERIES = 6
  var MAX_ITEMS = 40

  var ITEMS = [
    { text: "I'm afraid I succumbed to temptation…", en: 'succumb temptation', hint: '打 · 卡 3 次', go: './library.html' },
    { text: 'We ran out of coffee again.', en: 'coffee run out', hint: '说 · 今天到期', go: './library.html' },
    { text: "Don't abandon hope yet.", en: 'abandon hope', hint: '读 · 新卡', go: './library.html' },
    { text: '卡片', en: 'cards card deck', hint: 'Ctrl 1', go: './cards.html', sec: '页面' },
    { text: '工厂 · 挖句', en: 'factory mine srt', hint: 'Ctrl 2', go: './factory.html', sec: '页面' },
    { text: '统计', en: 'stats stat chart', hint: 'Ctrl 3', go: './stats.html', sec: '页面' },
    { text: '句库 · 全部句子', en: 'library sentence', hint: 'Ctrl 4', go: './library.html', sec: '页面' },
    { text: '全局设置', en: 'settings config', hint: 'Ctrl ,', go: './settings.html', sec: '页面' },
    { text: '接口 · 大模型', en: 'api model llm key', hint: '跟随会话', go: './settings.html#s-ai', sec: '设置' },
    { text: '快捷键 · 评级 · 良好', en: 'keys hotkey rating', hint: '3', go: './settings.html#s-keys', sec: '设置' },
    { text: '教程 · 六分钟', en: 'tutorial guide video', hint: '', go: './tutorial.html', sec: '设置' }
  ]

  /* ── 记忆：每条被打开过几次、最后一次什么时候 ───────────── */
  function load () {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {} } catch (e) { return {} }
  }
  function save (s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)) } catch (e) {}
  }
  var store = load()
  store.items = store.items || {}
  store.queries = store.queries || []

  /* frecency：次数取对数，再乘一个按天衰减的权重。
     半衰期约 10 天 —— 一个月没碰过的东西自然沉下去，但不会归零。 */
  function frecency (rec, now) {
    if (!rec || !rec.n) return 0
    var days = Math.max(0, (now - (rec.t || 0)) / 86400000)
    return Math.log1p(rec.n) * Math.exp(-days / 14)
  }

  /* 命中打分：开头命中 > 词首命中 > 中间命中 > 稀疏子序列命中 */
  function hitScore (text, q) {
    if (!q) return 0
    var t = text.toLowerCase(), s = q.toLowerCase()
    var i = t.indexOf(s)
    if (i < 0) return 0
    if (i === 0) return 100
    if (/[\s·\-—_/（(]/.test(t.charAt(i - 1))) return 80
    return 60
  }

  function remember (item, query) {
    var now = Date.now()
    var key = item.go + '|' + item.text
    var rec = store.items[key] || { n: 0 }
    rec.n += 1
    rec.t = now
    store.items[key] = rec
    {
      var keys = Object.keys(store.items)
      if (keys.length > MAX_ITEMS) {
        keys.sort(function (a, b) { return (store.items[a].t || 0) - (store.items[b].t || 0) })
        keys.slice(0, keys.length - MAX_ITEMS).forEach(function (k) { delete store.items[k] })
      }
    }
    if (query) {
      store.queries = store.queries.filter(function (one) { return one.q !== query })
      store.queries.unshift({ q: query, t: now })
      store.queries = store.queries.slice(0, MAX_QUERIES)
    }
    save(store)
  }

  /* ── DOM ──────────────────────────────────────────────── */
  var mask = null, input = null, listBox = null
  var rows = [], current = 0

  function build () {
    var box = document.createElement('div')
    box.innerHTML =
      '<div class="palmask" hidden><div class="palette" role="dialog" aria-modal="true">' +
        '<div class="pal-in">' +
          '<svg viewBox="0 0 18 18" class="pi"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
          '<input class="pal-q" placeholder="搜句子、说法、设置、快捷键…" autocomplete="off" spellcheck="false" />' +
          '<span class="kbd">Esc</span>' +
        '</div>' +
        '<div class="pal-body"></div>' +
        '<div class="pal-foot">' +
          '<span><span class="kbd">↑</span><span class="kbd">↓</span> 选</span>' +
          '<span><span class="kbd">Enter</span> 打开</span>' +
          '<span><span class="kbd">Esc</span> 关</span>' +
          '<span class="mut pal-note" style="margin-left:auto"></span>' +
        '</div>' +
      '</div></div>'
    mask = box.firstChild
    document.body.appendChild(mask)
    input = mask.querySelector('.pal-q')
    listBox = mask.querySelector('.pal-body')

    input.addEventListener('input', function () { render() })
    mask.addEventListener('click', function (e) {
      if (e.target === mask) return close()
      var chip = e.target.closest('.pal-chip')
      if (chip) { input.value = chip.dataset.q; render(); input.focus(); return }
      var item = e.target.closest('.pal-item')
      if (item) go(item)
    })
  }

  function go (el) {
    var item = ITEMS.filter(function (one) { return one.go === el.dataset.go })[0]
    if (!item) return
    remember(item, input.value.trim())
    location.href = item.go
  }

  function esc (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  var SEC_ORDER = ['', '页面', '设置']

  function render () {
    var q = input.value.trim()
    var now = Date.now()
    var scored = ITEMS.map(function (it, idx) {
      return {
        it: it,
        idx: idx,
        hit: hitScore(it.text + ' ' + (it.en || '') + ' ' + it.hint + ' ' + (it.sec || ''), q),
        freq: frecency(store.items[it.go + '|' + it.text], now)
      }
    })

    listBox.innerHTML = ''
    rows = []
    current = 0

    if (!q) {
      // 没输入：先给「最近搜过」的词，再给「常用」的条目
      if (store.queries.length) {
        var chips = document.createElement('div')
        chips.className = 'pal-sec pal-sec-recent'
        chips.innerHTML = '<span>最近搜索</span><button class="pal-clear" type="button">清空</button>' +
          '<div class="pal-chips">' + store.queries.map(function (one) {
            return '<button class="pal-chip" type="button" data-q="' + esc(one.q) + '">' + esc(one.q) + '</button>'
          }).join('') + '</div>'
        listBox.appendChild(chips)
        chips.querySelector('.pal-clear').addEventListener('click', function () {
          store.queries = []
          save(store)
          render()
        })
      }
      var top = scored.filter(function (one) { return one.freq > 0 })
        .sort(function (a, b) { return b.freq - a.freq || a.idx - b.idx })
        .slice(0, 5)
      if (top.length) listBox.appendChild(section('常用', top))
      var shown = top.map(function (one) { return one.it.text })
      listBox.appendChild(section(top.length ? '全部' : '', scored.filter(function (one) {
        return shown.indexOf(one.it.text) === -1
      })))
      setNote(q)
      applySelection()
      return
    }

    var hits = scored.filter(function (one) { return one.hit > 0 })
      .sort(function (a, b) {
        return b.hit - a.hit || b.freq - a.freq || a.idx - b.idx
      })
    if (!hits.length) {
      listBox.innerHTML = '<div class="pal-empty">没有对得上的。换个词，或者清空看全部。</div>'
      setNote(q)
      return
    }
    listBox.appendChild(section('', hits))
    setNote(q)
    applySelection()
  }

  function section (title, list) {
    var frag = document.createDocumentFragment()
    if (title) {
      var h = document.createElement('div')
      h.className = 'pal-sec'
      h.innerHTML = '<span>' + esc(title) + '</span>'
      frag.appendChild(h)
    }
    list.forEach(function (one) {
      var rec = store.items[one.it.go + '|' + one.it.text]
      var el = document.createElement('div')
      el.className = 'pal-item'
      el.dataset.go = one.it.go
      var here = one.it.go.indexOf(location.pathname.split('/').pop()) !== -1
      var hint = here ? '当前页' : (rec && rec.n > 1 ? one.it.hint + ' · 用过 ' + rec.n + ' 次' : one.it.hint)
      el.innerHTML = '<span>' + esc(one.it.text) + '</span>' +
        (hint ? '<span class="mut">' + esc(hint) + '</span>' : '')
      el.addEventListener('mouseenter', function () { select(rows.indexOf(el)) })
      frag.appendChild(el)
      rows.push(el)
    })
    return frag
  }

  function setNote (q) {
    var note = mask.querySelector('.pal-note')
    if (!note) return
    note.textContent = store.queries.length
      ? (q ? '按命中 × 常用排序' : '按常用排序 · 最近搜索在前面')
      : '按命中排序'
  }

  function applySelection () {
    rows.forEach(function (el, i) { el.classList.toggle('on', i === current) })
  }

  function select (i) {
    if (!rows.length) return
    current = (i + rows.length) % rows.length
    applySelection()
    var el = rows[current]
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }

  function refresh () {
    // 每次打开都重读一次：别的标签页可能刚写过
    store = load()
    store.items = store.items || {}
    store.queries = store.queries || []
  }

  function open () {
    if (!mask) build()
    refresh()
    mask.hidden = false
    bindDrag()
    document.body.style.overflow = 'hidden'
    input.value = ''
    render()
    input.focus()
  }
  function close () {
    if (!mask) return
    mask.hidden = true
    document.body.style.overflow = ''
  }
  function toggle () { mask && !mask.hidden ? close() : open() }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('[data-pal]') : null
    if (trigger) { e.preventDefault(); toggle() }
  })

  /* 面板可以拖着走：按住空白处拖，位移只动 transform */
  function bindDrag () {
    var panel = mask && mask.querySelector('.palette')
    if (!panel) return
    // 每次打开都从中间重新开始，不带上一次的位移
    panel.style.position = ''
    panel.style.left = ''
    panel.style.top = ''
    panel.style.transform = ''
    var drag = null
    panel.addEventListener('pointerdown', function (e) {
      if (e.target.closest('input, button, a')) return
      var r = panel.getBoundingClientRect()
      drag = { x: e.clientX, y: e.clientY, ox: 0, oy: 0, p: r.left, q: r.top }
      panel.classList.add('dragging')
      try { panel.setPointerCapture(e.pointerId) } catch (err) {}
    })
    document.addEventListener('pointermove', function (e) {
      if (!drag) return
      var tx = Math.min(Math.max(8 - drag.p, e.clientX - drag.x), window.innerWidth - 120 - drag.p)
      var ty = Math.min(Math.max(8 - drag.q, e.clientY - drag.y), window.innerHeight - 80 - drag.q)
      drag.ox = tx
      drag.oy = ty
      panel.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)'
    }, { passive: true })
    function up () {
      if (!drag) return
      panel.classList.remove('dragging')
      panel.style.transform = ''
      // 松手时把位移折进 left/top，否则手一松就弹回原位
      panel.style.position = 'fixed'
      panel.style.left = (drag.p + drag.ox) + 'px'
      panel.style.top = (drag.q + drag.oy) + 'px'
      drag = null
    }
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', up)
  }

  document.addEventListener('keydown', function (e) {
    var isOpen = mask && !mask.hidden
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); toggle(); return }
    if (!isOpen) return
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); select(current + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(current - 1) }
    else if (e.key === 'Enter') {
      var el = rows[current]
      if (el) { e.preventDefault(); go(el) }
    }
  })
})()