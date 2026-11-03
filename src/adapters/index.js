/* adapters/index.js · 启动页的数据适配
 *
 * 启动页（design/index.html）就三样东西：canvas 星空、「真正学会一门自然语言」、
 * 一个「开启」按钮。星空和进场动画都是设计稿自己的脚本（splash.js）在跑，这里不碰。
 *
 * 插件里要改的只有两件：
 *   1) 「开启」按钮得真的进正片。设计稿的 splash.js 在 document 上冒泡监听
 *      [data-enter]，点了会 window.kfGo('./cards.html') —— 在 iframe 里那是一条
 *      不存在的路径。宿主的导航拦截只认 a[href^="#nav:"] 的点击（src/30-frame.js），
 *      所以这里在按钮上挂一个 **capture** 监听：先挡掉设计稿的跳转，再合成一个
 *      <a href="#nav:cards"> 的点击交给宿主。
 *   2) 页面原来没有版本号，加一行小字（.etude-vnote）写 state.version 和包数。
 *
 * 契约：window.__ETUDE_APPLY__ = function (state, api)；幂等，找不到锚点只 warn。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  ensureSkin()

  var btn = bindEnter()
  paintVersion(state, btn)
}

// ── 开启按钮 → 宿主导航 ────────────────────────────────────────────────────

function bindEnter() {
  var btn = document.querySelector('.splash2 [data-enter]') || document.querySelector('.sp2-act .btn')
  if (!btn) {
    warn('enter', '启动页没找到「开启」按钮（.splash2 [data-enter]）')
    return null
  }
  // 给验证留个抓手：DOM 里能看到它现在指向哪
  btn.setAttribute('data-nav', '#nav:cards')

  if (btn.__etudeEnter) return btn
  btn.__etudeEnter = true

  // capture：比 splash.js 在 document 上的冒泡监听早一步，停在这里它就收不到
  btn.addEventListener(
    'click',
    function (e) {
      e.preventDefault()
      e.stopPropagation()
      go('#nav:cards')
    },
    true,
  )
  btn.setAttribute('title', '进卡片页')
  return btn
}

/* 宿主的拦截是 document 上 capture 阶段的 a[href^="#nav:"] 点击，
   location.hash 不会被监听 —— 所以必须真的点一个链接。 */
function go(target) {
  var a = document.createElement('a')
  a.setAttribute('href', target)
  a.style.display = 'none'
  document.body.appendChild(a)
  try {
    a.click()
  } catch (e) {
    warn('nav', '合成链接没点成：' + (e && e.message))
  }
  if (a.parentNode) a.parentNode.removeChild(a)
}

// ── 版本 / 包数 ────────────────────────────────────────────────────────────

function paintVersion(state, btn) {
  var version = (state && state.version) || ''
  var packs = (state && state.packs) || []
  var line =
    (version ? 'v' + version : '版本没读到') +
    ' · 本机 · ' +
    (packs.length ? '账本里 ' + packs.length + ' 个包' : '还没造过包')

  var note = document.querySelector('.etude-vnote')
  if (!note) {
    // 设计稿没有版本号这行，加一个（只加一行字，不动结构）
    var inner = document.querySelector('.sp2-inner')
    if (!inner) {
      warn('vnote', '.sp2-inner 不见了，版本号没地方放')
      if (btn) btn.setAttribute('data-version', version || '?')
      return
    }
    note = document.createElement('div')
    note.className = 'etude-vnote'
    var act = inner.querySelector('.sp2-act')
    if (act && act.nextSibling) inner.insertBefore(note, act.nextSibling)
    else inner.appendChild(note)
  }
  note.textContent = line
  if (btn) btn.setAttribute('data-version', version || '?')

  // 标题栏也带上版本（浏览器标签 / 预览截图里能看出来）
  if (version && document.title.indexOf(version) < 0) {
    document.title = document.title + ' · v' + version
  }
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

var warned = {}

function warn(key, why) {
  if (warned[key]) return
  warned[key] = 1
  try {
    console.warn('[index] ' + why)
  } catch (e) {}
}

function ensureSkin() {
  if (document.getElementById('etude-index-skin')) return
  var style = document.createElement('style')
  style.id = 'etude-index-skin'
  style.textContent =
    '.etude-vnote{margin-top:22px;font-size:12px;letter-spacing:.04em;color:var(--ghost);' +
    'pointer-events:none;animation:sp-rise .7s .34s cubic-bezier(.22,.61,.36,1) both}'
  document.head.appendChild(style)
}
