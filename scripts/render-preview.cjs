/**
 * 把插件界面渲染成一份独立 HTML，用来截图目检。
 *
 * 为什么要这个：宿主里的面板我拍不到，`vision_html_screenshot` 只认本地文件。
 * 而「冒烟通过」只证明不白屏，证明不了好不好看。这个脚本用同一个 React 替身
 * （见 tests/client-smoke.mjs）把每一屏画成 DOM 树，配上构建时那份 CSS，
 * 落成一张普通网页 —— 深浅、间距、字号全都跟插件里一样。
 *
 * 用法：
 *   node scripts/render-preview.cjs <输出目录>
 * 产物：<输出目录>/plugin-<page>.html
 */
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')

const repo = join(__dirname, '..')
const outDir = process.argv[2] || join(repo, 'preview')
mkdirSync(outDir, { recursive: true })

const source = readFileSync(join(repo, 'client.js'), 'utf8')
const withComponents = source.replace(
  'return module.exports\n  },',
  `Object.assign(module.exports, { __components: { EtudeApp, DesignFrame }, __pages: __PAGES__ })
  return module.exports
  },`,
)
if (withComponents === source) throw new Error('抠不出内部组件：构建产物末尾的形状变了。')

// ── React 替身（跟 client-smoke 同款，删掉了断言部分） ──────────────────────
const instances = new Map()
let currentInstance = null
let currentIndex = 0
let effectQueue = []

function slotOf(create) {
  const index = currentIndex++
  const instance = currentInstance
  if (!instance.slots[index]) instance.slots[index] = { value: create(), effects: [] }
  return instance.slots[index]
}

const React = {
  Component: class Component {
    constructor(props) {
      this.props = props
    }
  },
  createElement(type, props, ...children) {
    const flat = children.length === 0 ? undefined : children.length === 1 ? children[0] : children
    return { __el: true, type, props: { ...(props ?? {}), children: flat } }
  },
  useState(initial) {
    const slot = slotOf(() => (typeof initial === 'function' ? initial() : initial))
    return [
      slot.value,
      (next) => {
        const value = typeof next === 'function' ? next(slot.value) : next
        if (!Object.is(value, slot.value)) {
          slot.value = value
          rerender = true
        }
      },
    ]
  },
  useEffect(fn, deps) {
    const index = currentIndex++
    const slot = (currentInstance.slots[index] = currentInstance.slots[index] || { value: undefined })
    const previous = slot.deps
    const changed =
      previous === undefined ||
      !Array.isArray(deps) ||
      !Array.isArray(previous) ||
      deps.length !== previous.length ||
      deps.some((one, at) => !Object.is(one, previous[at]))
    if (changed) {
      slot.deps = deps
      slot.value = fn
      effectQueue.push({ key: currentInstance.key, index })
    }
  },
  useMemo(factory) {
    return slotOf(factory).value
  },
  useCallback(fn) {
    const slot = slotOf(() => ({ fn }))
    slot.fn = fn
    return (...args) => slot.fn(...args)
  },
  useRef(initial) {
    return slotOf(() => ({ current: initial })).value
  },
  useLayoutEffect(fn, deps) {
    React.useEffect(fn, deps)
  },
}
let rerender = false

// ── 宿主替身 ───────────────────────────────────────────────────────────────
let captured = null
const sandbox = {
  window: {},
  document: {
    documentElement: { dataset: {}, style: {} },
    body: { dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} },
    createElement(tag) {
      return {
        tag,
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        children: [],
        className: '',
        textContent: '',
        setAttribute() {},
        appendChild(child) {
          this.children.push(child)
          return child
        },
        querySelector: () => null,
        addEventListener() {},
        removeEventListener() {},
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    head: { appendChild() {} },
  },
  URL: { createObjectURL: () => 'blob:fake', revokeObjectURL() {} },
  addEventListener() {},
  removeEventListener() {},
  postMessage() {},
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  Blob: class {},
  atob: (text) => Buffer.from(text, 'base64').toString('binary'),
  btoa: (text) => Buffer.from(text, 'binary').toString('base64'),
  console,
  setTimeout,
  clearTimeout,
  setInterval: () => 0,
  clearInterval: () => {},
  queueMicrotask,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  __ModuleLoader__: {
    load(descriptor) {
      captured = descriptor
    },
  },
}
sandbox.window = sandbox
sandbox.globalThis = sandbox
vm.runInContext(withComponents, vm.createContext(sandbox), { filename: 'client.js' })

const moduleExports = captured.factory((name) => {
  if (name === 'react') return React
  if (name === 'react-dom') return { createPortal: (children) => children }
  throw new Error(`不该 require(${name})`)
})

// ── 假数据（照 lib/packs.js 真实的形状） ───────────────────────────────────
const example = (ord, withMedia) => ({
  ord,
  sentence: ['The crew abandoned ship within minutes.', 'We ran out of coffee again.', 'He simply abandoned the plan.'][ord - 1] || `Example line number ${ord}.`,
  sceneEn: 'A late evening on deck, the lifeboat just lowered.',
  sceneZh: ['傍晚，救生艇刚解开缆绳，船长的最后一道命令就是这个。', '早上，茶水间的咖啡又没了。', '会议室里，他把那份计划推到一边。'][ord - 1] || '一个场景。',
  zhVariants: ['短说法。', '长一点的说法。', '换个角度。'],
  register: '日常口语',
  image: withMedia
    ? { file: 'commons-34958284bf84a30c8729.jpg', width: 1920, height: 1280, license: 'CC BY 2.0', author: 'Someone', creditUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' }
    : null,
  imageReview: withMedia ? { by: 'me', at: '2026-11-03T10:00:00.000Z' } : null,
  audio: withMedia ? { file: 'edge-1587b6105fb7f373b0dc.mp3', seconds: 3.288, engine: 'edge', voice: 'en-US-AriaNeural' } : null,
  audioReview: withMedia ? { by: 'me', at: '2026-11-03T10:01:00.000Z', listened: true } : null,
})

const pack = {
  id: 'abcdef0123456789',
  target: 'abandon',
  kind: 'word',
  language: 'en',
  gloss: '离开、扔下不管',
  status: 'media',
  progress: { total: 8, images: 5, audios: 2, done: false },
  learnable: false,
  exportedAt: null,
  lastError: null,
  swaps: [{ candidates: ['gave in to', 'yielded to', 'fell for', 'let go of'] }],
  examples: [example(1, true), example(2, true), example(3, false), example(4, false)],
}

const state = {
  root: 'C:\\Users\\HP\\AppData\\Local\\dsh-etude',
  version: require('./../package.json').version,
  exportDir: 'C:\\Users\\HP\\Downloads\\dsh-etude',
  packs: [pack, { ...pack, id: 'ffeeddccbbaa9988', target: 'run out of', kind: 'phrase', status: 'packed', progress: { total: 4, images: 4, audios: 4, done: true }, learnable: true }],
  jobs: [],
  selfcheck: [
    { id: 'node', ok: true, detail: 'v24.19.0' },
    { id: 'sharp', ok: true, detail: '像素级预检：可用' },
    { id: 'ws', ok: true, detail: 'Edge TTS：可用' },
    { id: 'network', ok: true, detail: '直连' },
  ],
  settings: { language: 'en', uiLocale: 'zh', examples: 8, voice: 'en-US-AriaNeural' },
}

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

async function rpcHandler(channel, endpoint) {
  if (endpoint === 'state') return { ok: true, value: state }
  if (endpoint === 'pack.get') return { ok: true, value: pack }
  if (endpoint === 'pack.voice.list') return { ok: true, value: { voices: [{ id: 'en-US-AriaNeural', label: 'Aria · 女声' }] } }
  if (endpoint === 'pack.check') return { ok: true, value: { manifest: {}, verdict: 'ok', missing: [] } }
  if (endpoint === 'image.bytes' || endpoint === 'candidate.bytes') {
    return { ok: true, value: { dataBase64: pngBase64, mediaType: 'image/png' } }
  }
  return { ok: true, value: {} }
}

// ── 渲染成一棵树 ───────────────────────────────────────────────────────────
const VOID = new Set(['img', 'input', 'br', 'hr', 'source', 'track', 'meta', 'link'])

function build(node, path, out) {
  if (node === null || node === undefined || node === false || node === true) return
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node).replace(/&/g, '&amp;').replace(/</g, '&lt;'))
    return
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => build(child, `${path}.${index}`, out))
    return
  }
  if (!node.__el) return
  const { type, props } = node
  if (typeof type === 'function') {
    const key = `${path}:${type.name || 'anon'}`
    if (!instances.has(key)) instances.set(key, { key, slots: [] })
    const saved = [currentInstance, currentIndex]
    currentInstance = instances.get(key)
    currentIndex = 0
    try {
      const isClass = type.prototype && typeof type.prototype.render === 'function'
      build(isClass ? new type(props).render() : type(props), key, out)
    } finally {
      ;[currentInstance, currentIndex] = saved
    }
    return
  }
  // 宿主元素
  const tag = String(type)
  const attrs = []
  if (props?.className) attrs.push(`class="${String(props.className).replace(/"/g, '&quot;')}"`)
  if (props?.href) attrs.push(`href="#"`)
  if (props?.style && typeof props.style === 'object') {
    const css = Object.entries(props.style)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
      .join(';')
    if (css) attrs.push(`style="${css.replace(/"/g, '&quot;')}"`)
  }
  if (props?.role) attrs.push(`role="${props.role}"`)
  if (props?.title) attrs.push(`title="${String(props.title).replace(/"/g, '&quot;')}"`)
  // SVG 与其余属性：React 会原样落到 DOM 上，这里也得落 —— 否则 <rect> 没有
  // x/y/width/height，柱状图与环图在预览里就是一片空白（真机不受影响）。
  const SKIP = new Set([
    'children', 'className', 'href', 'style', 'role', 'title', 'ref', 'key',
    'dangerouslySetInnerHTML', 'onClick', 'onChange', 'onInput', 'onKeyDown', 'onBlur', 'onFocus',
  ])
  Object.keys(props || {}).forEach((name) => {
    if (SKIP.has(name) || name.startsWith('on')) return
    const value = props[name]
    if (value === undefined || value === null || value === false) return
    if (typeof value === 'object' || typeof value === 'function') return
    // HTML 属性大小写：iframe 的 srcDoc 必须落成 srcdoc，否则浏览器不认
    const ALIAS = { srcDoc: 'srcdoc', readOnly: 'readonly', autoFocus: 'autofocus', tabIndex: 'tabindex' }
    const css = ALIAS[name] || (/[A-Z]/.test(name) ? name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) : name)
    attrs.push(`${css}="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
  })
  if (typeof props?.ref === 'function' || (props?.ref && typeof props.ref === 'object')) {
    // 挂在 shadow root 上的那个宿主 div：把门给它一个真的容器
    const children = []
    const shadow = {
      children,
      querySelector: (selector) =>
        selector === '.etude-mount' ? children.find((one) => one.className === 'etude-mount') : children.find((one) => one.tag === 'style') || null,
      appendChild(child) {
        children.push(child)
        return child
      },
    }
    const el = {
      shadowRoot: null,
      style: {},
      setAttribute() {},
      attachShadow() {
        this.shadowRoot = shadow
        return shadow
      },
    }
    if (typeof props.ref === 'function') props.ref(el)
    else props.ref.current = el
  }
  out.push(`<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`)
  build(props?.children, path, out)
  if (!VOID.has(tag)) out.push(`</${tag}>`)
  return
}

async function renderPage(component, props) {
  instances.clear()
  for (let pass = 0; pass < 8; pass += 1) {
    rerender = false
    effectQueue = []
    const out = []
    build(React.createElement(component, props), 'root', out)
    // 把这一轮排到的 effect 跑掉（会发 RPC、会 setState）
    for (const { key, index } of effectQueue) {
      const slot = instances.get(key)?.slots?.[index]
      if (!slot || typeof slot.value !== 'function') continue
      const fn = slot.value
      slot.value = undefined
      fn()
    }
    if (effectQueue.length === 0 && !rerender) return out.join('')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  const out = []
  build(React.createElement(component, props), 'root', out)
  return out.join('')
}

// CSS：从构建产物里抠出来，再把 :host 换回普通页面能用的形态
const cssMatch = /const __CSS__ = ("(?:[^"\\]|\\.)*")/.exec(source)
if (!cssMatch) throw new Error('构建产物里找不到 __CSS__')
const css = JSON.parse(cssMatch[1])
  .replace(/:host\(\[data-theme="light"\]\)/g, '[data-theme="light"]')
  .replace(/:host/g, 'html')

// 预览页是普通网页，没有 shadow —— 把 :host 上那几条搬到 html/body 上，
// 否则字体会掉回浏览器默认的衬线体，宽度也会被内容挤扁（真机里由 :host 负责）。
const previewCss = `
html{display:block;height:100%;overflow:auto;background:linear-gradient(180deg,var(--bg-top),var(--bg-bottom));color:var(--fg);font-family:var(--sans);-webkit-font-smoothing:antialiased}
body{margin:0;min-height:100%;font-family:var(--sans);color:var(--fg)}
.etude-shell{width:100%;min-height:100%;box-sizing:border-box;max-width:1160px;margin:0 auto}
.etude-shell>.screen{width:100%;box-sizing:border-box}
.page{max-width:100%}
/* 预览是静态快照：把入场动画压掉，直接看终态。否则柱子/环图停在 transform:scaleY(0)
   与 stroke-dasharray(0) 的起始帧，看起来像"画不出来"。
   注意不能只写 * 选择器 —— app.css 里的 .cv-js .bar 带 !important、特异度 (0,2,0)
   会赢。加 html body 前缀把它压过去。 */
html body .chart *,
html body .chart,
html body .cv-js .bar,
html body .cv-play .bar{animation:none!important;transition:none!important}
html body .chart .bar,html body .chart .dc{transform:none!important;opacity:1!important;stroke-dashoffset:0!important}
`

const pages = moduleExports.__components

// 界面是 iframe：每页预览 = 直接把 DesignFrame 渲染出来，等于插件里那一格。
// body 外面那圈只负责给它一个 100vh 的盒子。
const jobs = [
  ['index', '启动'],
  ['cards', '卡片'],
  ['study', '学习'],
  ['listen', '听'],
  ['speak', '说'],
  ['read', '读'],
  ['type', '写'],
  ['vary', '改'],
  ['factory', '工厂'],
  ['stats', '统计'],
  ['settings', '设置'],
  ['library', '句库'],
  ['detail', '详情'],
  ['mine', '挖句'],
  ['tutorial', '教程'],
]

const frameProps = (page) => ({
  page,
  query: '',
  state: { status: 'ready', ...state },
  skipGuide: true,
  // 静态预览没有父窗口，把 state 注入 iframe 里跑一遍适配器，截图才看得到真数据
  previewState: { status: 'ready', ...state },
})

async function main() {
  for (const [slug, label] of jobs) {
    const body = await renderPage(pages.DesignFrame, frameProps(slug))
    const html = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><title>dsh-etude · ${label}</title>
<style>html,body{margin:0;height:100%;background:#1B1C23;overflow:hidden}</style>
</head><body><div style="height:100vh">${body}</div></body></html>`
    writeFileSync(join(outDir, `plugin-${slug}.html`), html)
    console.log(`ok ${slug} → ${join(outDir, `plugin-${slug}.html`)}（${html.length} 字节）`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
