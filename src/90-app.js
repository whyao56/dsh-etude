/* 90 · 组装：一个 iframe，原样跑 design/ 的页面。
 *
 * 之前这里是五页 React（卡片/学习/工厂/统计/设置），丢掉的东西太多：
 * 启动页没了、工厂 12 个弹层没了、设置 4 组没了、还有 8 个页面根本没搬。
 * 现在只做三件事：拿 state、把页面切过去、把页面里的请求转给 RPC。
 * 界面本身一行不重画 —— 它就是 design/ 里那 15 页。
 */

const ETUDE_PAGES = [
  'index',
  'cards',
  'study',
  'listen',
  'speak',
  'read',
  'type',
  'vary',
  'library',
  'factory',
  'stats',
  'settings',
  'tutorial',
  'mine',
  'detail',
]

function EtudeApp(props) {
  const rpc = props.rpc
  const [page, setPage] = useState('index')
  const [query, setQuery] = useState('')
  // 启动页点「开启」之后才进卡片页；直接进插件的人和刷新过的人，默认看卡片页。
  const [entered, setEntered] = useState(false)
  const { state, error, reload } = useFactory(rpc)

  const onNav = (next, nextQuery) => {
    if (!next || ETUDE_PAGES.indexOf(next) < 0) return
    if (next === 'index') {
      setEntered(false)
    } else {
      setEntered(true)
    }
    setPage(next)
    setQuery(nextQuery || '')
    if (next === 'index' && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('kf-test:onboarded')
      } catch (e) {}
    }
  }

  const onPageReady = (readyPage) => {
    // 启动页：点「开启」等同于进卡片页
    if (readyPage === 'index') setEntered(false)
  }

  // 深链：study?w=abandon 能把词带过去
  // 启动页要留在原地（它就是入口画面），一旦进过正片就不会再被顶回去。
  const frame = h(DesignFrame, {
    page: page === 'index' || entered ? page : 'cards',
    query,
    state: state,
    error: error,
    rpc: rpc,
    onNav,
    onPageReady,
    onError: (message) => {
      if (typeof console !== 'undefined') console.warn('[etude] 页面适配器报错：', message)
    },
  })

  return h(Wrapper, { onKey: reload }, frame)
}

/** 一层壳，只为给 iframe 一个 100% 高度；样式全在 iframe 里。 */
function Wrapper({ children }) {
  return h(
    'div',
    {
      className: 'etude-frame-wrap',
      style: {
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        overflow: 'hidden',
        background: 'var(--bg-bottom, #1B1C23)',
      },
    },
    children,
  )
}
