/**
 * 客户端半的冒烟测试：在没有浏览器的环境里把面板真渲染一遍。
 *
 * 为什么要这么干：面板要是渲染时抛一个错，界面上就是一片空白，而空白和
 * 「还没造过包」长得一模一样 —— 没人会知道是插件坏了。
 *
 * 这里带一个极小的 React 替身：函数组件 + useState/useEffect/useRef/useMemo，
 * 带「位置身份」（同一路径的组件跨渲染共用 hook 槽）和「会重渲染」的 setState，
 * 所以 useEffect 里发起的 RPC 会真的回来、真的推动界面重画。
 *
 * 它能证明「不会白屏、数据回来了能画出来」；证明不了「好不好看」。
 *
 * 用法：node tests/client-smoke.mjs
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const clientPath = join(here, '..', 'client.js')

// ── 一个刚好够用的 React 替身 ──────────────────────────────────────────────

const instances = new Map()
let currentInstance = null
let currentIndex = 0
let needRender = false
let effectQueue = []

function slotOf(create) {
  const instance = currentInstance
  const index = currentIndex++
  if (!instance.slots[index]) instance.slots[index] = { value: create(), effects: [] }
  return instance.slots[index]
}

const React = {
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
    const instance = currentInstance
    const index = currentIndex++
    const slot = instance.slots[index] ?? (instance.slots[index] = { value: undefined })
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
      effectQueue.push({ key: instance.key, index })
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

// ── 把 client.js 装进一个假的浏览器环境 ────────────────────────────────────

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
  URL: { createObjectURL: () => 'blob:fake', revokeObjectURL() {} },
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
}
sandbox.globalThis = sandbox

const source = await readFile(clientPath, 'utf8')
vm.runInContext(source, vm.createContext(sandbox), { filename: clientPath })

if (!captured || captured.id !== 'dsh-etude') {
  console.error('client.js 没有按 __ModuleLoader__ 的约定注册，id 对不上。')
  process.exit(1)
}

const moduleExports = captured.factory((name) => {
  if (name === 'react') return React
  throw new Error(`客户端半不该 require(${JSON.stringify(name)})`)
})

if (typeof moduleExports.apply !== 'function') {
  console.error('客户端半没有导出 apply。')
  process.exit(1)
}

// ── 一个会记账的 ctx ───────────────────────────────────────────────────────

const registrations = []
let rpcHandler = async () => ({ ok: true, value: {} })

const ctx = {
  effect(fn) {
    const cleanup = fn()
    return typeof cleanup === 'function' ? cleanup : () => {}
  },
  get(name) {
    if (name === 'connection') return { rpc: { call: (...args) => rpcHandler(...args) } }
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

for (const name of ['main', 'sidebar.panellist']) {
  if (!registrations.some((one) => one.declaration.name === name)) {
    console.error(`没有注册 ${name} 插槽 —— 侧栏里不会出现这个面板。`)
    process.exit(1)
  }
  console.log(`   OK   注册了 ${name}`)
}

// ── 渲染器 ────────────────────────────────────────────────────────────────

let hostNodes = 0
let depthGuard = 0

function render(node, path) {
  if (node === null || node === undefined || node === false || node === true) return
  if (typeof node === 'string' || typeof node === 'number') {
    hostNodes += 1
    return
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => render(child, `${path}.${index}`))
    return
  }
  if (!node.__el) return
  const { type, props } = node
  if (typeof type === 'function') {
    depthGuard += 1
    if (depthGuard > 400) throw new Error('渲染树太深了，可能自己调自己。')
    const key = `${path}:${type.name || 'anon'}`
    if (!instances.has(key)) {
      const instance = { key, slots: [] }
      instances.set(key, instance)
    }
    const savedInstance = currentInstance
    const savedIndex = currentIndex
    currentInstance = instances.get(key)
    currentIndex = 0
    try {
      render(type(props), key)
    } finally {
      currentInstance = savedInstance
      currentIndex = savedIndex
      depthGuard -= 1
    }
    return
  }
  hostNodes += 1
  render(props?.children, `${path}.${String(type)}`)
}

async function mount(label, component, props, minimum = 8) {
  instances.clear()
  let passes = 0
  let error = null
  for (let pass = 0; pass < 6; pass += 1) {
    hostNodes = 0
    depthGuard = 0
    needRender = false
    effectQueue = []
    try {
      render(React.createElement(component, props), 'root')
    } catch (thrown) {
      error = thrown
      break
    }
    if (effectQueue.length === 0 && !needRender) break
    // 跑这一轮排到的 effect（它们会发 RPC、会 setState）
    for (const { key, index } of effectQueue) {
      const slot = instances.get(key)?.slots?.[index]
      if (!slot || typeof slot.value !== 'function') continue
      const fn = slot.value
      slot.value = undefined
      fn()
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
    passes = pass + 1
    if (!needRender) break
  }
  if (error) {
    console.error(`   FAIL ${label} — ${error.message}`)
    process.exitCode = 1
    return
  }
  if (hostNodes < minimum) {
    console.error(`   FAIL ${label} — 只画出 ${hostNodes} 个节点，基本等于白屏`)
    process.exitCode = 1
    return
  }
  console.log(`   OK   ${label} — ${hostNodes} 个节点，${passes + 1} 次渲染`)
}

// ── 假数据 ────────────────────────────────────────────────────────────────

const fakePack = {
  id: 'abcdef0123456789',
  target: 'run out of',
  kind: 'phrase',
  language: 'en',
  gloss: 'to have no more of something',
  ipa: '',
  note: '',
  status: 'media',
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
  progress: { total: 8, images: 2, audios: 1, done: 1 },
  lastError: null,
  examples: Array.from({ length: 8 }, (unused, index) => ({
    ord: index + 1,
    sentence: `We will run out of item number ${index + 1} by Friday.`,
    sceneEn: `Scene number ${index + 1}, standing somewhere with people around.`,
    sceneZh: `第 ${index + 1} 个场景，你站在那儿跟人说话。`,
    zhVariants: ['短说法。', '长一点的说法。', '换个角度的说法。'],
    register: '日常口语',
    voiceHint: 'flat, tired, slow',
    imageQuery: 'coffee cup table',
    image:
      index < 2
        ? {
            file: 'commons-34958284bf84a30c8729.jpg',
            sha256: 'a'.repeat(64),
            bytes: 120000,
            width: 1920,
            height: 1280,
            source: 'commons',
            query: 'coffee cup table',
            license: 'CC BY 2.0',
            author: 'Someone',
            creditUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
          }
        : null,
    imageCandidates:
      index === 2
        ? [
            { stagedName: 'abcdef0123456789-3-1.jpg', bytes: 90000, width: 1600, height: 1067 },
            { stagedName: 'abcdef0123456789-3-2.jpg', bytes: 90000, width: 1600, height: 1067 },
          ]
        : [],
    imageRejected: [],
    imageReview: index < 2 ? { by: 'me', at: '2026-10-28T12:01:00.000Z', candidates: 6, picked: 'x.jpg' } : null,
    audio:
      index < 1
        ? { file: 'edge-1587b6105fb7f373b0dc.mp3', bytes: 19728, seconds: 3.288, engine: 'edge', voice: 'en-US-AriaNeural' }
        : null,
    audioReview: null,
  })),
}

const fakeState = {
  root: 'C:\\Users\\HP\\AppData\\Local\\dsh-etude',
  version: '0.1.0',
  exportDir: 'C:\\Users\\HP\\Downloads\\dsh-etude',
  packs: [fakePack],
  jobs: [],
  selfcheck: [
    { id: 'node', ok: true, detail: 'v24.19.0' },
    { id: 'sharp', ok: true, detail: '像素级预检：可用' },
    { id: 'ws', ok: true, detail: 'Edge TTS：可用' },
    { id: 'sharp2', ok: true, detail: '像素级预检：可用' },
    { id: 'network', ok: true, detail: '走代理 127.0.0.1:7897' },
  ],
}

const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

rpcHandler = async (channel, endpoint) => {
  if (channel !== '/etude') throw new Error(`渠道不对：${channel}`)
  if (endpoint === 'state') return { ok: true, value: fakeState }
  if (endpoint === 'pack.get') return { ok: true, value: fakePack }
  if (endpoint === 'image.bytes' || endpoint === 'candidate.bytes') {
    return { ok: true, value: { dataBase64: pngBase64, mediaType: 'image/png' } }
  }
  return { ok: true, value: {} }
}

const mainEntry = registrations.find((one) => one.declaration.name === 'main')
const sidebarEntry = registrations.find((one) => one.declaration.name === 'sidebar.panellist')

await mount('主面板（有包、有候选图、有语音）', mainEntry.component, { size: 18 })

rpcHandler = async () => ({ ok: true, value: { root: 'C:\\x', version: '0.1.0', packs: [], jobs: [], selfcheck: [] } })
await mount('主面板（一个新包也没有）', mainEntry.component, { size: 18 })

rpcHandler = async () => {
  throw Object.assign(new Error('socket closed'), { code: 'connection-closed' })
}
await mount('主面板（宿主连不上）', mainEntry.component, { size: 18 })

await mount('侧栏图标', sidebarEntry.component, { size: 18, active: false }, 2)

if (!process.exitCode) {
  console.log('客户端半冒烟通过：面板不会白屏，数据回来了会重画。')
}
