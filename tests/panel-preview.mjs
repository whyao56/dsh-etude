/**
 * 把 client.js 真面板渲成一张静态 HTML，用来在浏览器里看它长什么样。
 *
 * 为什么要有这个：面板最终跑在宿主里，而宿主的 Web 界面要带 token 的地址才打得开，
 * headless Chrome 直接访问 127.0.0.1:7052 只会得到 "authentication required"。
 * 所以这里用和 tests/client-smoke.mjs 相同的假 React 把组件树跑一遍，
 * 再把宿主标签序列化成 HTML 落盘，双击就能看。
 *
 * 用法：node tests/panel-preview.mjs
 * 产物：design/_shots/panel-<zone>-<state>.html
 */
import fs from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const clientPath = join(here, '..', 'client.js')
const outDir = join(here, '..', 'design', '_shots')

// ── 假 React ────────────────────────────────────────────────────────────────
const instances = new Map()
let currentInstance = null
let currentIndex = 0
let needRender = false
let effectQueue = []

function slotOf(create) {
  const index = currentIndex++
  if (!currentInstance.slots[index]) currentInstance.slots[index] = { value: create(), effects: [] }
  return currentInstance.slots[index]
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
          needRender = true
        }
      },
    ]
  },
  useEffect(fn, deps) {
    const index = currentIndex++
    const slot = currentInstance.slots[index] ?? (currentInstance.slots[index] = { value: undefined })
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
    return factory()
  },
  useCallback(fn) {
    return fn
  },
  useRef(initial) {
    return slotOf(() => ({ current: initial })).value
  },
  Fragment: 'fragment',
}

// ── 装进假浏览器 ────────────────────────────────────────────────────────────
let captured = null
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(definition) {
        captured = definition
      },
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
    localStorage: { getItem: () => null, setItem() {} },
    innerWidth: 1280,
  },
  document: {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: '' }),
    head: { appendChild: () => {} },
  },
  URL: {
    createObjectURL(blob) {
      const bytes = Buffer.from(blob?.bytes ?? new Uint8Array(0))
      return `data:${blob?.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`
    },
    revokeObjectURL() {},
  },
  Blob: class Blob {
    constructor(parts, options) {
      this.bytes = parts?.[0] ?? new Uint8Array(0)
      this.type = options?.type || ''
    }
  },
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
}
sandbox.globalThis = sandbox
vm.runInContext(await readFile(clientPath, 'utf8'), vm.createContext(sandbox), { filename: clientPath })

const moduleExports = captured.factory((name) => {
  if (name === 'react') return React
  throw new Error(`客户端半不该 require(${JSON.stringify(name)})`)
})

// ── 会记账的 ctx ────────────────────────────────────────────────────────────
const CONFIG_VALUE = {
  ttsEngine: 'auto',
  ttsVoiceEdge: 'en-US-AriaNeural',
  rate: '+10%',
  volume: '+10%',
  examplesPerLesson: 8,
  candidateLimit: 9,
  exportDir: 'D:\\Downloads\\dsh-etude',
  dataDir: 'C:\\Users\\HP\\AppData\\Local\\dsh-etude',
  proxyUrl: 'http://127.0.0.1:7897',
}

const CONFIG_FORM = {
  getSnapshot: () => ({ status: 'ready', value: CONFIG_VALUE }),
  subscribe: () => () => {},
  mutate: async () => {},
}

const registrations = []
const state = { rpc: async () => ({ ok: true, value: {} }), width: 1280 }

const ctx = {
  effect(fn) {
    const cleanup = fn()
    return typeof cleanup === 'function' ? cleanup : () => {}
  },
  get(name) {
    if (name === 'connection') return { rpc: { call: (...args) => state.rpc(...args) } }
    if (name === 'configForms') {
      return {
        get: () => CONFIG_FORM,
        whileServed: (keys, fn) => {
          const dispose = fn()
          return typeof dispose === 'function' ? dispose : () => {}
        },
      }
    }
    return undefined
  },
  locale: { register: () => {}, bind: () => (key) => key },
  slots: {
    inject(name, factory) {
      const dispose = factory()
      return () => dispose?.()
    },
    register(declaration, component) {
      registrations.push({ declaration, component })
      return () => {}
    },
  },
}
moduleExports.apply(ctx)

// 词典：面板里 t('nav.title') 这类键，这里给中文，跟 locale/zh.json 对齐。
const ZH = {
  'nav.title': '卡片工厂',
  'nav.subtitle': '造卡、挑图、试听、打包',
  'nav.placeholder': '一个词、一个说法，或者一整句…',
  'zone.factory': '制卡',
  'zone.study': '学习',
  'action.create': '造一个包',
  'action.createBusy': '正在造…',
  'action.refresh': '刷新',
  'action.cancel': '取消',
  'action.pack': '打包',
  'action.export': '导出',
  'action.reopen': '打回制卡',
  'action.delete': '删掉',
  'action.candidates': '找图',
  'action.pick': '用这张',
  'action.audio': '合成语音',
  'action.confirmAudio': '我听过了',
  'hint.searchPacks': '搜索…',
  'label.sort': '排序',
  'label.noMatch': '没有匹配的包',
  'label.studyPoolEmpty': '学习区只放能练的包',
  'label.loading': '正在读数据…',
  'label.loadFailed': '读不到数据',
}

// ── 序列化 ──────────────────────────────────────────────────────────────────
let depthGuard = 0
const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link'])
const esc = (text) =>
  String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])
const kebab = (key) => key.replace(/[A-Z]/g, (ch) => '-' + ch.toLowerCase())
// 只有长度类属性才补 px —— lineHeight / fontWeight / flex 补了就废了。
const UNITLESS = new Set([
  'fontWeight',
  'lineHeight',
  'opacity',
  'zIndex',
  'flex',
  'flexGrow',
  'flexShrink',
  'order',
  'zoom',
  'aspectRatio',
])

function cssOf(style) {
  if (!style || typeof style !== 'object') return ''
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${kebab(key)}:${typeof value === 'number' && !UNITLESS.has(key) ? value + 'px' : value}`)
    .join(';')
}

function attrsOf(props) {
  const out = []
  const style = cssOf(props.style)
  if (style) out.push(`style="${esc(style)}"`)
  for (const key of [
    'placeholder',
    'value',
    'title',
    'type',
    'name',
    'href',
    'alt',
    'src',
    // 图标全是内联 svg，少了这几个属性就只剩空壳：<svg><path></path></svg>
    'd',
    'viewBox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'width',
    'height',
    'aria-hidden',
    'aria-label',
    'role',
  ]) {
    if (props[key] !== undefined && props[key] !== null) out.push(`${key}="${esc(props[key])}"`)
  }
  // React 的 defaultValue 在 HTML 里就是 value；不转一下的话，配置卡上的输入框全是空的。
  if (props.defaultValue !== undefined && props.defaultValue !== null)
    out.push(`value="${esc(props.defaultValue)}"`)
  if (props.defaultChecked) out.push('checked')
  if (props.disabled) out.push('disabled')
  return out.length ? ' ' + out.join(' ') : ''
}

function toHtml(node, path) {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string') return esc(node)
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map((child, index) => toHtml(child, `${path}.${index}`)).join('')
  if (!node.__el) return ''
  const { type, props } = node
  if (typeof type === 'function') {
    depthGuard += 1
    if (depthGuard > 400) throw new Error('渲染树太深了，可能自己调自己。')
    const key = `${path}:${type.name || 'anon'}`
    if (!instances.has(key)) instances.set(key, { key, slots: [] })
    const savedInstance = currentInstance
    const savedIndex = currentIndex
    currentInstance = instances.get(key)
    currentIndex = 0
    try {
      const isClass = type.prototype && typeof type.prototype.render === 'function'
      return toHtml(isClass ? new type(props).render() : type(props), key)
    } finally {
      currentInstance = savedInstance
      currentIndex = savedIndex
      depthGuard -= 1
    }
  }
  if (type === 'fragment' || type === React.Fragment) return toHtml(props?.children, path)
  const inner = VOID.has(type) ? '' : toHtml(props?.children, `${path}.${type}`)
  if (VOID.has(type)) return `<${type}${attrsOf(props)}>`
  return `<${type}${attrsOf(props)}>${inner}</${type}>`
}

async function renderOnce(component, props) {
  let last = ''
  instances.clear()
  for (let pass = 0; pass < 8; pass += 1) {
    depthGuard = 0
    needRender = false
    effectQueue = []
    const html = toHtml(React.createElement(component, props), 'root')
    last = html
    for (const { key, index } of effectQueue) {
      const slot = instances.get(key)?.slots?.[index]
      if (!slot || typeof slot.value !== 'function') continue
      const fn = slot.value
      slot.value = undefined
      fn()
    }
    await new Promise((resolve) => setTimeout(resolve, 20))
    if (!needRender) return html
  }
  return last
}

// ── 假数据 ──────────────────────────────────────────────────────────────────
const EXAMPLES = [
  ['The crew abandoned ship within minutes.', '凌晨四点，货轮在雾里开始进水。船长下令撤离。', 'p-harbor.jpg'],
  ['He abandoned the plan the moment it got hard.', '周三的项目例会上，他没再提那件事。', 'p-office.jpg'],
  ["I'm afraid I succumbed to temptation.", '周一上午十点，同事桌上的芝士蛋糕少了一块。', 'p-coffee.jpg'],
  ['She succumbed to the flu after a week of overtime.', '连着加班一周，周五她没来上班。', 'p-subway.jpg'],
  ['A good pair of shoes is indispensable in this city.', '朋友刚搬来，第一天走了两万步。', 'p-street.jpg'],
  ['She made herself indispensable in three months.', '季度复盘会上，主管只点了她的名字。', 'p-library.jpg'],
  ['His answer was deliberately ambiguous.', '面试结束后，你问他到底怎么想。', 'p-office.jpg'],
  ['The ending is ambiguous on purpose.', '电影散场，灯亮了，旁边的人还在争论。', 'p-dinner.jpg'],
]

const packOf = (id, target, kind) => ({
  id,
  target,
  kind,
  language: 'en',
  gloss: 'to leave someone or something behind, especially when you should stay',
  ipa: '/əˈbændən/',
  note: '',
  status: 'media',
  createdAt: '2026-11-01T09:00:00.000Z',
  updatedAt: '2026-11-02T09:00:00.000Z',
  progress: { total: 8, images: 5, audios: 3, done: 0 },
  lastError: null,
  learnable: true,
  examples: EXAMPLES.map(([sentence, sceneZh, file], index) => ({
    ord: index + 1,
    sentence,
    sceneEn: sceneZh,
    sceneZh,
    zhVariants: [sceneZh],
    register: '中性',
    voiceHint: '',
    imageQuery: 'harbor fog',
    image: index < 5 ? { file, bytes: 90000, width: 1200, height: 900, source: 'commons' } : null,
    imageCandidates:
      index < 5 || index > 6
        ? []
        : [
            { stagedName: 'commons-1201-0801.jpg', bytes: 90000, width: 1200, height: 900 },
            { stagedName: 'commons-1201-0802.jpg', bytes: 88000, width: 1200, height: 900 },
            { stagedName: 'commons-1201-0803.jpg', bytes: 91000, width: 1200, height: 900 },
          ],
    imageRejected: [],
    imageReview: index < 5 ? { by: 'me', at: '2026-11-02T09:10:00.000Z', candidates: 6, picked: file } : null,
    audio:
      index < 3
        ? { file: 'edge-1587b6105fb7f373b0dc.mp3', bytes: 19728, seconds: 3.288, engine: 'edge', voice: 'en-US-AriaNeural' }
        : null,
    audioReview: index < 2 ? { by: 'me', at: '2026-11-02T09:20:00.000Z', listened: true } : null,
  })),
})

const STATE = {
  root: 'C:\\Users\\HP\\AppData\\Local\\dsh-etude',
  version: '0.2.0',
  exportDir: 'C:\\Users\\HP\\Downloads\\dsh-etude',
  packs: [packOf('abcdef0123456789', 'abandon', 'word'), packOf('abcdef0123456790', 'succumb', 'word')],
  jobs: [],
  selfcheck: [
    { id: 'node', ok: true, detail: 'v24.19.0' },
    { id: 'sharp', ok: true, detail: '像素级预检：可用' },
    { id: 'ws', ok: true, detail: 'Edge TTS：可用' },
    { id: 'network', ok: true, detail: '走代理 127.0.0.1:7897' },
  ],
}

const PHOTO_DIR = join(here, '..', 'design', 'assets', 'photos')
const PHOTOS = new Map()
for (const name of fs.readdirSync(PHOTO_DIR)) {
  if (!name.endsWith('.jpg')) continue
  PHOTOS.set(name, fs.readFileSync(join(PHOTO_DIR, name)).toString('base64'))
}
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const photoFor = (payload) => {
  const file = String(payload?.file ?? payload?.stagedName ?? '')
  for (const [name, data] of PHOTOS) if (file.includes(name.replace('.jpg', ''))) return data
  return PHOTOS.values().next().value
}

const main = registrations.find((one) => one.declaration.name === 'main').component

const frames = [
  {
    name: 'panel-factory',
    label: '制卡区（有包）',
    props: { size: 18 },
    rpc: async (channel, endpoint, payload) => {
      if (endpoint === 'state') return { ok: true, value: STATE }
      if (endpoint === 'pack.get') return { ok: true, value: STATE.packs[0] }
      if (endpoint === 'image.bytes' || endpoint === 'candidate.bytes')
        return { ok: true, value: { dataBase64: photoFor(payload), mediaType: 'image/jpeg' } }
      return { ok: true, value: {} }
    },
  },
  {
    name: 'panel-study',
    label: '学习区（一屏一张）',
    props: { size: 18, initialZone: 'study' },
    rpc: async (channel, endpoint, payload) => {
      if (endpoint === 'state') return { ok: true, value: STATE }
      if (endpoint === 'pack.get') return { ok: true, value: STATE.packs[0] }
      if (endpoint === 'image.bytes' || endpoint === 'candidate.bytes')
        return { ok: true, value: { dataBase64: photoFor(payload), mediaType: 'image/jpeg' } }
      return { ok: true, value: {} }
    },
  },
  {
    name: 'panel-config',
    label: '配置卡（插件设置页）',
    props: { form: CONFIG_FORM, view: 'page' },
    componentName: 'plugins.bundle.config',
  },
  {
    name: 'panel-empty',
    label: '一个新包也没有',
    rpc: async () => ({
      ok: true,
      value: { root: STATE.root, version: '0.2.0', exportDir: STATE.exportDir, packs: [], jobs: [], selfcheck: [] },
    }),
  },
  {
    name: 'panel-error',
    label: '宿主连不上',
    rpc: async () => {
      throw Object.assign(new Error('socket closed'), { code: 'connection-closed' })
    },
  },
]

const CSS = `
:root {
  color-scheme: dark;
  --dsw-alias-label-primary: #e9edf4;
  --dsw-alias-label-secondary: #a6adbd;
  --dsw-alias-label-tertiary: #727a8b;
  --dsw-alias-label-primary-foreground: #0c1424;
  --dsw-alias-label-success: #7fc6a4;
  --dsw-alias-label-warning: #dcb47c;
  --dsw-alias-label-danger: #e0918c;
  --dsw-alias-border-l3: rgba(255,255,255,.065);
  --dsw-alias-border-l2: rgba(255,255,255,.105);
  --dsw-alias-bg-module-platform: #0a0d13;
  --dsw-alias-bg-layer-1: #131923;
  --dsw-alias-bg-layer-2: #19212c;
  --dsw-alias-brand-primary: #a7bdf6;
}
* { box-sizing: border-box; }
h1, h2, h3, p, figure { margin: 0; }
button { margin: 0; }
html, body { height: 100%; margin: 0; }
body {
  background: radial-gradient(900px 340px at 50% -10%, rgba(122,150,235,.10), transparent 70%), #0a0d13;
  font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #e9edf4;
  -webkit-font-smoothing: antialiased;
}
#root { height: 100%; }
button { font-family: inherit; }
input, select, textarea { font-family: inherit; }
`

await mkdir(outDir, { recursive: true })
for (const frame of frames) {
  state.rpc = frame.rpc
  const component = frame.componentName
    ? registrations.find((one) => one.declaration.name === frame.componentName)?.component
    : main
  const html = await renderOnce(component, frame.props ?? { size: 18 })
  const page = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<title>${frame.label} · 卡片工厂面板</title>
<style>${CSS}</style></head>
<body><div id="root">${html}</div></body></html>`
  await writeFile(join(outDir, frame.name + '.html'), page, 'utf8')
  console.log(`${frame.name}.html  ${html.length} 字符`)
}
console.log('\n用浏览器打开 design/_shots/panel-factory.html 看真面板。')
