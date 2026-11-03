/* adapters/tutorial.js · 教程长文的适配
 *
 * design/tutorial.html 是纯静态长文，本来不需要数据。全页只有两处该换：
 *
 * 1. 第 145 行把账本路径写成了 `%LOCALAPPDATA%\dsh-etude-test\practice\ledger.json`，
 *    这个文件不存在。真实账本是 `state.root` 下的 `factory\library.json`
 *    （lib/paths.js 的 stateFile）。
 * 2. 页面上没有任何版本号，`state.version` 没地方落 —— 挂到标题下面那行
 *    sub 里，位置够，也不动结构。
 *
 * 正文里两处「说这一面只录音、自己回放」是设计稿的说法，插件目前没有录音，
 * 这里没动 —— 改正文是改文案，不是填数据，留给人来定。
 */

;(function () {
  var LAST_W = ''

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.target !== 'etude-frame' || data.kind !== 'state') return
    var word = readW(data.query)
    if (word === LAST_W) return
    LAST_W = word
    try {
      apply(window.__ETUDE_STATE__, window.__ETUDE__)
    } catch (error) {}
  })

  window.__ETUDE_APPLY__ = function (state, api) {
    apply(state, api)
  }

  function apply(state, api) {
    reroute()
    if (!state || state.status !== 'ready') return
    fixLedgerPath(state)
    fillVersion(state)
  }

  // ── 账本路径 ───────────────────────────────────────────────────────

  function fixLedgerPath(state) {
    var code = null
    var codes = document.querySelectorAll('article.doc code')
    for (var i = 0; i < codes.length; i += 1) {
      if ((codes[i].textContent || '').indexOf('ledger.json') >= 0) {
        code = codes[i]
        break
      }
    }
    if (!code) {
      warn('没找到写着 ledger.json 的 <code>，账本路径没换上')
      return
    }
    var root = String((state && state.root) || '').replace(/[\\/]+$/, '')
    code.textContent = root ? root + '\\factory\\library.json' : '（账本目录还没读出来）'
    code.setAttribute('title', '练习账本就是这一个文件')
  }

  // ── 版本号 ─────────────────────────────────────────────────────────

  function fillVersion(state) {
    var sub = document.querySelector('.hdr .sub')
    if (!sub) {
      warn('没找到 .hdr .sub，版本号没地方放')
      return
    }
    var version = String((state && state.version) || '').trim()
    var base = '这个插件为什么长成这样 · 读一遍大概四分钟'
    sub.textContent = version ? '这个插件为什么长成这样 · v' + version + ' · 读一遍大概四分钟' : base
    sub.setAttribute('data-etude-version', version || '')
  }

  // ── 自检小节：后端没回话就如实说 ──────────────────────────────────

  function readW(query) {
    var hit = /(?:^|&)w=([^&]*)/.exec(String(query || ''))
    if (hit) {
      try {
        return decodeURIComponent(hit[1])
      } catch (error) {
        return hit[1]
      }
    }
    return ''
  }

  function warn(text) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[etude] tutorial: ' + text)
  }

  function qa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector))
  }

  /** iframe 里 ./xxx.html 是死链；带 #锚 的（教程的菜单指向 ./tutorial.html#use）也一起收 */
  function reroute() {
    var links = qa('.page a[href^="./"]')
    for (var i = 0; i < links.length; i += 1) {
      var hit = /^\.\/([a-z]+)\.html(?:#.*)?$/.exec(links[i].getAttribute('href') || '')
      if (hit) links[i].setAttribute('href', '#nav:' + hit[1])
    }
  }
})()
