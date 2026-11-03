/* 20 · 数据层：所有事实都从宿主那边的 /etude RPC 取
   形状照 lib/rpc.js 的 `state` 端点与 lib/packs.js 的 listPacks —— 不发明字段。
   核实过的地方标了行号，改动那边时记得回来对一眼。 */

const RPC_CHANNEL = '/etude'

/** rpc 可能是通道本身，也可能是「取通道」的函数（apply 那一刻 connection 可能还没就绪）*/
async function callRpc(rpc, endpoint, payload) {
  const bridge = typeof rpc === 'function' ? rpc() : rpc
  if (!bridge || typeof bridge.call !== 'function') {
    throw new Error('宿主连接还没就绪。刷新一下页面再试；还是空的话，去 设置 → 插件 看 dsh-etude 是不是 active。')
  }
  let timer = null
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`宿主 15 秒没回应（${endpoint}）。刷新页面重试。`)), 15000)
  })
  const body = payload === undefined || payload === null ? {} : payload
  let result
  try {
    result = await Promise.race([bridge.call(RPC_CHANNEL, endpoint, body), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
  if (!result || result.ok !== true) {
    const message = result?.error?.message ?? '接口调用失败'
    const error = new Error(message)
    error.code = result?.error?.code
    throw error
  }
  return result.value
}

/** 宿主状态：packs / jobs / settings / selfcheck / root / version */
function useFactory(rpc) {
  const [state, setState] = useState({ status: 'loading', packs: [], jobs: [] })
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const value = await callRpc(rpc, 'state')
      setState({ status: 'ready', ...value })
      setError(null)
      return value
    } catch (failure) {
      setState((prev) => ({ ...prev, status: 'error' }))
      setError(failure.message)
      return null
    }
  }, [rpc])

  useEffect(() => {
    reload()
  }, [reload])

  return { state, error, reload }
}

/* lib/packs.js 实际写的状态（第 112/157/188/258/275/791 行）：
   generating → text → media → packed → exported，任何一步失败是 failed。
   这里的中文是给人看的，键名必须跟后端一模一样，否则「到哪一步」那一列会全空。 */
const STATUS_TEXT = {
  generating: '正在造',
  text: '例句好了',
  media: '配素材',
  packed: '能出厂',
  exported: '已导出',
  failed: '上次出错',
}

/** 包 → 卡片页那一行。
    设计稿那套「未学习 / 学习中 / 待复习」是 Anki 的调度口径，插件没有调度引擎，
    所以列换成插件真有的四个数：例句 / 配图 / 语音 / 到哪一步。
    注意 progress.done 是布尔（lib/store.js:130），不是计数器 —— 别拿它加总。 */
function packRows(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  return packs.map((pack) => {
    const progress = pack?.progress ?? {}
    const total = progress.total ?? 0
    return {
      id: pack.id,
      name: pack.target || '(未命名)',
      kind: pack.kind || 'word',
      gloss: pack.gloss || '',
      examples: total,
      images: progress.images ?? 0,
      audios: progress.audios ?? 0,
      ready: progress.done === true,
      learnable: pack.learnable === true,
      status: pack.status || 'generating',
      statusText: STATUS_TEXT[pack.status] || pack.status || '未知',
      exportedAt: pack.exportedAt || null,
      lastError: pack.lastError || null,
    }
  })
}

/** 「接着练」挑哪个包：先挑还没能出厂的，全都能出厂了就挑最近改过的那个。
    注意 listPacks 不返回例句（lib/packs.js:223-238），要句子得再调一次 pack.get。 */
function nextUp(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  if (!packs.length) return null
  const pending = packs.find((one) => one?.progress?.done !== true) || packs[packs.length - 1]
  return pending
}

/** 图 / 音 只走 RPC 拿字节，不走 HTTP 路由。宿主给的是 base64，直接拼 data URL。 */
function mimeOf(file) {
  const name = String(file || '').toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  if (name.endsWith('.mp3')) return 'audio/mpeg'
  if (name.endsWith('.wav')) return 'audio/wav'
  if (name.endsWith('.ogg')) return 'audio/ogg'
  return 'image/jpeg'
}

function dataUrlOf(file, base64) {
  return `data:${mimeOf(file)};base64,${base64}`
}
