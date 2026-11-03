/* 把 design/ 的页面内联成「一个 iframe 就能跑」的自包含 HTML。
 *
 * 为什么这么做：design 的 15 页是完整可交互的静态页（app.js/app2.js/fx.js… 都在
 * 操作 document），把它们逐页翻译成 React 会把交互细节一路丢掉（第一版就丢了
 * 12 个弹层、8 个页面）。改成原样搬进 iframe，交互一个不少。
 *
 * 一个页面 = app.css + 一堆 js + 这一页的 body。切换页面时重建 iframe（约 650KB
 * 字符串），比一次性内联 15 页（9MB）省得多。
 *
 * 用法：
 *   node scripts/inline-design.cjs --out <目录>           # 产出每页一个 json
 *   node scripts/inline-design.cjs --single cards --html <文件>   # 单页自包含 HTML，便于截图验
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DESIGN = path.join(ROOT, 'design')

const PAGE_NAMES = ['index', 'cards', 'study', 'listen', 'speak', 'read', 'type', 'vary', 'library', 'factory', 'stats', 'settings', 'tutorial', 'mine', 'detail']

/** design/<name>.html 里所有 <link rel=stylesheet> 与 <script src> 的本地路径 */
function assetsOf(html) {
  const out = new Set()
  const re = /<(?:link[^>]+href|script[^>]+src)="([^"]+)"/g
  let m
  while ((m = re.exec(html))) {
    const href = m[1]
    if (/^(https?:)?\/\//.test(href) || href.startsWith('#') || href.startsWith('data:')) continue
    const file = href.split('?')[0].replace(/^\.\//, '')
    if (!/\.(css|js)$/.test(file)) continue
    out.add(file)
  }
  return [...out]
}

function readDesign(file) {
  return fs.readFileSync(path.join(DESIGN, file), 'utf8')
}

/** 页面 body 内部（不含 <body> 标签），以及 <body> 上原有的属性。
 *  index.html 的 <body class="splash-body"> 一丢，app.css 里那两段星空/标题样式就全废。 */
function bodyOf(html) {
  const m = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i)
  return m ? { attrs: m[1] || '', inner: m[2] } : { attrs: '', inner: html }
}

/** 把 design 页面里指向别的页面的链接改成可拦截的锚点：
 *  ./study.html?w=x  →  #nav:study?w=x
 *  这样 iframe 里点击不会真的去导航（沙箱里没有服务器，导航就是白屏）。 */
function rewriteLinks(body) {
  return body
    .replace(/href="\.\/([a-z]+)\.html([^"]*)"/g, 'href="#nav:$1$2"')
    // 整行可点/搜索项/弹层出口都是把路径塞在 data-* 里，然后 location.href = 它
    .replace(/data-go="\.\/([a-z]+)\.html([^"]*)"/g, 'data-go="#nav:$1$2"')
    .replace(/data-fade="\.\/([a-z]+)\.html([^"]*)"/g, 'data-fade="#nav:$1$2"')
}

/** design 的脚本里到处是 `location.href = './cards.html'`（启动页「开启」、退出、
 *  菜单项、整行可点）。iframe 里这一跳就是 404 白屏 —— 全部改写成 __etudeGo(...)，
 *  由运行时翻译成一条 postMessage 交给宿主切页。 */
function patchNavigation(js) {
  const re = /(?:window\.)?location\.href\s*=(?!=)\s*/g
  let out = ''
  let last = 0
  let match
  while ((match = re.exec(js))) {
    const start = match.index + match[0].length
    // 找到这个赋值表达式的结尾：括号深度归零后的 ; ) 换行
    let depth = 0
    let i = start
    let quote = null
    for (; i < js.length; i += 1) {
      const ch = js[i]
      if (quote) {
        if (ch === quote && js[i - 1] !== '\\') quote = null
        continue
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch
        continue
      }
      if (ch === '(' || ch === '[' || ch === '{') depth += 1
      else if (ch === ')' || ch === ']' || ch === '}') {
        if (depth === 0) break
        depth -= 1
      } else if ((ch === ';' || ch === '\n') && depth === 0) break
    }
    out += js.slice(last, match.index) + '__etudeGo(' + js.slice(start, i) + ')'
    last = i
    re.lastIndex = i
  }
  return out + js.slice(last)
}

/** 一个要随页面一起注入的运行时补丁：
 *  - 把 #nav: 开头的链接拦下来，交给父窗口切页
 *  - 暴露 window.__ETUDE__ 给父窗口注入数据
 */
const RUNTIME = `
(function () {
  function post(kind, payload) {
    try { parent.postMessage(Object.assign({ source: 'etude-frame', kind: kind }, payload || {}), '*') } catch (e) {}
  }
  document.addEventListener('click', function (event) {
    var a = event.target && event.target.closest ? event.target.closest('a[href^="#nav:"]') : null
    if (!a) return
    event.preventDefault()
    event.stopPropagation()
    var raw = a.getAttribute('href').replace('#nav:', '')
    var cut = raw.indexOf('?')
    var page = cut < 0 ? raw : raw.slice(0, cut)
    var query = cut < 0 ? '' : raw.slice(cut + 1)
    post('nav', { page: page, query: query })
  }, true)
  window.__etudeGo = function (url) {
    if (typeof url !== 'string' || !url) return
    var raw = url.replace(/^#nav:/, '')
    var hit = /(?:^|\/)([a-z]+)\.html/i.exec(raw)
    if (!hit) return
    var cut = raw.indexOf('?')
    post('nav', { page: hit[1], query: cut < 0 ? '' : raw.slice(cut + 1) })
  }
  window.__ETUDE__ = {
    send: function (kind, payload) { post(kind, payload) },
    onMessage: null,
  }
  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.target !== 'etude-frame') return
    if (typeof window.__ETUDE__.onMessage === 'function') window.__ETUDE__.onMessage(data)
  })
  post('ready', { page: (location.hash || '').replace('#', '') })
})();
`

function buildSrcdoc(name, opts) {
  const html = readDesign(name + '.html')
  const files = assetsOf(html)
  const cssFiles = files.filter((f) => f.endsWith('.css'))
  const jsFiles = files.filter((f) => f.endsWith('.js'))

  const css = cssFiles.map((f) => `/* ${f} */\n` + readDesign(f)).join('\n')
  const js = patchNavigation(
    jsFiles.map((f) => `/* ${f} */\n;(function(){\n` + readDesign(f) + `\n})();`).join('\n'),
  )
  const parts = bodyOf(html)
  const body = rewriteLinks(parts.inner)

  const theme = opts && opts.theme === 'light' ? ' data-theme="light"' : ''
  return `<!doctype html><html lang="zh"${theme}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dsh-etude · ${name}</title>
<style>${css}</style>
</head><body${parts.attrs}>${body}
<script>${RUNTIME}</script>
<script>${js}</script>
</body></html>`
}

/** 全部页面共用一份 CSS / 一份 JS 的版本：体积极小（15 页各存 body 就够了）。
 *  cards 单页内联 438KB 里有 418KB 是重复的 app.css；15 页各存一份就是 6MB。
 *
 *  输出 { css, js, pages: { [name]: body } } */
function buildBundle(names) {
  const pageList = names || PAGE_NAMES
  const seen = new Set()
  const cssParts = []
  const jsParts = []
  const pages = {}
  for (const name of pageList) {
    const file = path.join(DESIGN, name + '.html')
    if (!fs.existsSync(file)) continue
    const html = readDesign(name + '.html')
    for (const one of assetsOf(html)) {
      if (seen.has(one)) continue
      seen.add(one)
      const text = readDesign(one)
      if (one.endsWith('.css')) cssParts.push(`/* ${one} */\n` + text)
      else jsParts.push(`/* ${one} */\n;(function(){\n` + text + `\n})();`)
    }
    const parts = bodyOf(html)
    pages[name] = { attrs: parts.attrs, body: rewriteLinks(parts.inner) }
  }
  return { css: cssParts.join('\n'), js: patchNavigation(jsParts.join('\n')), pages }
}

function main() {
  const args = process.argv.slice(2)
  const outAt = args.indexOf('--out')
  const singleAt = args.indexOf('--single')
  const htmlAt = args.indexOf('--html')

  if (singleAt >= 0) {
    const name = args[singleAt + 1]
    const html = buildSrcdoc(name, {})
    if (htmlAt >= 0) fs.writeFileSync(args[htmlAt + 1], html)
    else process.stdout.write(html)
    console.log('wrote', name, html.length, 'bytes')
    return
  }

  const out = outAt >= 0 ? args[outAt + 1] : path.join(ROOT, 'build')
  fs.mkdirSync(out, { recursive: true })
  const bundle = buildBundle()
  const names = Object.keys(bundle.pages)
  fs.writeFileSync(path.join(out, 'pages.json'), JSON.stringify(bundle))
  const size = fs.statSync(path.join(out, 'pages.json')).size
  console.log('ok pages', names.length, 'css', bundle.css.length, 'js', bundle.js.length, 'json', size)
}

main()
