/* ────────────────────────────────────────────────
   进出场：一片小方格从左往右、从上往下翻面
   depart(url)  翻过去变黑，然后跳页
   到达页自动 play-in（黑格子翻走，页面显出来）
   ──────────────────────────────────────────────── */
(function () {
  var KEY = 'kf-transit'
  var COLS = 0, ROWS = 0
  var CELL = 48

  function layer () {
    var el = document.getElementById('trwave')
    if (el) return el
    el = document.createElement('div')
    el.id = 'trwave'
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)     // 必须挂到 body：.page 上有 transform，fixed 会以它为祖先
    return el
  }

  function build (el) {
    var W = window.innerWidth, H = window.innerHeight
    COLS = Math.ceil(W / CELL) + 1
    ROWS = Math.ceil(H / CELL) + 1
    el.style.setProperty('--cw', (W / COLS) + 'px')
    el.style.setProperty('--ch', (H / ROWS) + 'px')
    el.innerHTML = ''
    var frag = document.createDocumentFragment()
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var t = document.createElement('i')
        t.style.left = (c * W / COLS) + 'px'
        t.style.top = (r * H / ROWS) + 'px'
        t.style.width = Math.ceil(W / COLS) + 1 + 'px'
        t.style.height = Math.ceil(H / ROWS) + 1 + 'px'
        // 左上先动，右下最后：斜着推过去
        t.style.animationDelay = ((c * 0.55 + r) * 9) + 'ms'
        frag.appendChild(t)
      }
    }
    el.appendChild(frag)
    return { W: W, H: H }
  }

  var TOTAL = 0
  function waveDuration () { return Math.round((COLS * 0.55 + ROWS) * 9 + 360) }

  /* ── 出发 ── */
  function depart (url, done) {
    var el = layer()
    build(el)
    el.className = 'trwave out'
    var ms = waveDuration()
    setTimeout(function () {
      try { sessionStorage.setItem(KEY, 'in') } catch (e) {}
      if (typeof done === 'function') done()
      window.location.href = url
    }, ms)
    return ms
  }

  function wake () {
    var w = document.createElement('div')
    w.className = 'trwake'
    document.body.appendChild(w)
    setTimeout(function () { w.remove() }, 1100)
  }

  /* ── 到达：黑格子翻走 + 睁眼 ── */
  function arrive () {
    wake()
    var el = layer()
    build(el)
    el.className = 'trwave in'
    var ms = waveDuration()
    setTimeout(function () { el.className = 'trwave'; el.innerHTML = '' }, ms + 80)
  }

  try {
    if (sessionStorage.getItem(KEY) === 'in') {
      sessionStorage.removeItem(KEY)
      // 先黑着，等第一帧再翻走 —— 不然会看见白闪
      var el0 = layer()
      el0.className = 'trwave hold'
      build(el0)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { arrive() })
      })
    }
  } catch (e) {}

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-depart]')
    if (!a) return
    e.preventDefault()
    depart(a.getAttribute('data-depart'))
  })

  window.TRANSIT = { depart: depart, arrive: arrive, preview: function (mode) {
    var el = layer(); build(el); el.className = 'trwave ' + (mode || 'out')
  } }
})()
