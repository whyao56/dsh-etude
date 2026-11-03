/* 30 · 设计稿宿主：一个 iframe，原样跑 design/ 的页面
 *
 * 为什么是 iframe 而不是 React 重写：design 的 15 页是完整可交互的静态页，
 * app.js / app2.js / fx.js 都在操作 document。翻译成 React 会把交互一路丢
 * （第一版就丢了 12 个弹层、8 个页面、启动页）。这里改成原样搬：
 *   - 样式与脚本各只存一份（构建时内联进 __PAGES__）
 *   - 每页只存 body 片段
 *   - 切页 = 换一个 srcdoc，等于重新加载一页
 *
 * 数据仍然走宿主：页面里的 __ETUDE_ 运行时把 #nav: 链接拦成 postMessage，
 * 父窗口收到后切页或调 RPC；state 变化时父窗口 postMessage 给页面，
 * 页面自己的适配器（src/adapters/<page>.js）负责把假数字换成真数字。
 */

const FRAME_RUNTIME = `
(function () {
  // 每次重建 srcdoc 都是新的一次运行，seq 从 1 重来会跟上一帧的 pending 撞 id；
  // 加一个 nonce，旧帧的回包自然对不上任何 pending，直接丢弃。
  var nonce = Math.random().toString(36).slice(2, 8)
  var seq = 0
  var pending = {}
  var PAGE = (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.frame) || ''
  // 深链的 query 只能从宿主传进来：srcdoc 里 location.search 永远是空的。
  // 适配器优先读这个，再退到 location / hash。
  window.__ETUDE_QUERY__ = (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.query) || ''
  function post(kind, payload) {
    try {
      parent.postMessage(Object.assign({ source: 'etude-frame', page: PAGE, kind: kind }, payload || {}), '*')
    } catch (e) {}
  }
  /** design 页面里所有 location.href = './x.html' 都被构建改写成这个。
   *  参数既可能是 './cards.html?t=fade'，也可能是已经改好的 '#nav:cards'。 */
  window.__etudeGo = function (url) {
    if (typeof url !== 'string' || !url) return
    var raw = url.replace(/^#nav:/, '')
    var hit = /(?:^|\\/)([a-z]+)\\.html/i.exec(raw)
    if (!hit) return
    var cut = raw.indexOf('?')
    var query = cut < 0 ? '' : raw.slice(cut + 1).replace(/(^|&)t=fade/g, '').replace(/^&/, '')
    post('nav', { page: hit[1], query: query })
  }
  window.__ETUDE__ = {
    send: post,
    page: PAGE,
    /** 调宿主 RPC：__ETUDE__.rpc('pack.get', { id }) → Promise<value> */
    rpc: function (endpoint, payload) {
      var id = nonce + '-' + (++seq)
      return new Promise(function (resolve, reject) {
        pending[id] = { resolve: resolve, reject: reject }
        post('call', { id: id, endpoint: endpoint, payload: payload || null })
        setTimeout(function () {
          if (!pending[id]) return
          delete pending[id]
          reject(new Error('RPC 超时：' + endpoint))
        }, 20000)
      })
    },
    onMessage: null,
  }
  document.addEventListener(
    'click',
    function (event) {
      var node = event.target
      var a = node && node.closest ? node.closest('a[href^="#nav:"]') : null
      if (!a) return
      event.preventDefault()
      event.stopPropagation()
      var raw = a.getAttribute('href').replace('#nav:', '')
      var cut = raw.indexOf('?')
      var page = cut < 0 ? raw : raw.slice(0, cut)
      var query = cut < 0 ? '' : raw.slice(cut + 1)
      post('nav', { page: page, query: query })
    },
    true,
  )
  window.addEventListener('message', function (event) {
    // 只认父窗口发来的；别的窗口/页面伪造的一律不理
    if (event.source !== window.parent) return
    var data = event.data
    if (!data || data.target !== 'etude-frame') return
    if (data.kind === 'call-result') {
      var slot = pending[data.id]
      if (!slot) return
      delete pending[data.id]
      if (data.ok) slot.resolve(data.value)
      else slot.reject(new Error(data.error || 'RPC 失败'))
      return
    }
    if (data.kind === 'state') {
      window.__ETUDE_STATE__ = data.value
      if (typeof window.__ETUDE_APPLY__ === 'function') {
        try {
          window.__ETUDE_APPLY__(data.value, window.__ETUDE__)
        } catch (error) {
          post('apply-error', { message: String((error && error.message) || error) })
        }
      }
      return
    }
    if (typeof window.__ETUDE__.onMessage === 'function') window.__ETUDE__.onMessage(data)
  })
  function ready() {
    post('ready', { page: PAGE })
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(ready, 0)
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(ready, 0)
    })
  }
})();
`

/** 内联进 srcdoc 的脚本里如果出现 </script>（例句是用户内容），整页会被提前截断。 */
function scriptSafe(source) {
  return String(source == null ? '' : source).replace(/<\/script/gi, '<\\/script')
}

/** 一页的完整 srcdoc。body/js/adapter 都是构建时内联进来的字符串。 */
function frameDoc(page, opts) {
  const raw = (__PAGES__.pages && __PAGES__.pages[page]) || ''
  // pages[page] 现在是 { attrs, body }：body 上的 class 不能丢（index 的 splash-body）
  const body = typeof raw === 'string' ? raw : raw.body || ''
  const bodyAttrs = typeof raw === 'string' ? '' : raw.attrs || ''
  const adapter = (typeof __ADAPTERS__ === 'object' && __ADAPTERS__ && __ADAPTERS__[page]) || ''
  const skin = (opts && opts.skin) || ''
  // 预览截图时要跳过新手引导层，否则每张图都被那块遮罩挡住；真机上保留它。
  const guide =
    opts && opts.skipGuide
      ? "<script>try{localStorage.setItem('kf-test:onboarded','1')}catch(e){}</script>"
      : ''
  // 预览是静态快照：没有父窗口推 state，也没有 RPC。把 state 直接注进去跑一遍，
  // 顺便给一个假的 rpc，否则适配器里的 pack.get 永远挂起，截图看不到真实效果。
  const preview =
    opts && opts.previewState
      ? '<script>(function(){var S=' +
        scriptSafe(JSON.stringify(opts.previewState)) +
        ';' +
        'window.__ETUDE__.rpc=function(endpoint,payload){' +
        "if(endpoint==='pack.get'){var id=payload&&payload.id;var hit=(S.packs||[]).filter(function(p){return p.id===id})[0];return Promise.resolve(hit||null)}" +
        "if(endpoint==='state')return Promise.resolve(S);" +
        'return Promise.resolve({})};' +
        'setTimeout(function(){if(typeof window.__ETUDE_APPLY__==="function"){try{window.__ETUDE_APPLY__(S,window.__ETUDE__)}catch(e){console.error(e)}}},40)' +
        '})();</script>'
      : ''
  return (
    '<!doctype html><html lang="zh" data-frame="' +
    page +
    '" data-query="' +
    String((opts && opts.query) || '').replace(/"/g, '&quot;') +
    '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>' +
    scriptSafe(__PAGES__.css) +
    '</style>' +
    (skin ? '<style>' + scriptSafe(skin) + '</style>' : '') +
    '</head><body' +
    bodyAttrs +
    '>' +
    guide +
    body +
    // 运行时必须先于页面脚本：页面脚本一绑上就等着用 __etudeGo / __ETUDE__
    '<script>' +
    FRAME_RUNTIME +
    '</script>' +
    '<script>' +
    scriptSafe(__PAGES__.js) +
    '</script>' +
    (adapter ? '<script>' + scriptSafe(adapter) + '</script>' : '') +
    preview +
    '</body></html>'
  )
}

/**
 * 设计稿宿主。
 * props.page    current page id（index/cards/study/...）
 * props.query   ?w=abandon 这种查询串（深链用）
 * props.state   RPC state（变化时推给页面适配器）
 * props.rpc     宿主 RPC（页面里的按钮发 call 时用）
 * props.onNav   页面里点了链接 → 父窗口切页
 * props.onPageReady 页面脚本跑完
 */
function DesignFrame(props) {
  const hostRef = useRef(null)
  const [doc, setDoc] = useState(null)
  const [booted, setBooted] = useState(0)
  const page = props.page || 'cards'
  const query = props.query || ''

  // 切页 = 换 srcdoc。query 也参与，深链换词时要重建。
  useEffect(() => {
    setDoc(null)
    setBooted(0)
    const id = setTimeout(() => {
      setDoc(
        frameDoc(page, {
          query,
          skin: props.skin,
          skipGuide: props.skipGuide,
          previewState: props.previewState,
        }),
      )
    }, 0)
    return () => clearTimeout(id)
  }, [page, query])

  // 收到页面消息：ready / nav / apply-error
  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data
      if (!data || data.source !== 'etude-frame') return
      if (data.kind === 'ready') {
        setBooted((n) => n + 1)
        if (typeof props.onPageReady === 'function') props.onPageReady(page, event)
      } else if (data.kind === 'nav') {
        if (typeof props.onNav === 'function') props.onNav(data.page, data.query)
      } else if (data.kind === 'call') {
        // 页面要数据：转给宿主 RPC，再把结果递回去
        const rpc = typeof props.rpc === 'function' ? props.rpc() : props.rpc
        const win = hostRef.current && hostRef.current.contentWindow
        const reply = (ok, value) => {
          try {
            if (win) win.postMessage({ target: 'etude-frame', kind: 'call-result', id: data.id, ok, value: ok ? value : undefined, error: ok ? undefined : String((value && value.message) || value) }, '*')
          } catch {}
        }
        if (!rpc || typeof rpc.call !== 'function') {
          reply(false, '宿主没给 RPC')
          return
        }
        Promise.resolve()
          .then(() => rpc.call(RPC_CHANNEL, data.endpoint, data.payload || undefined))
          .then((value) => reply(true, value))
          .catch((error) => reply(false, error))
      } else if (data.kind === 'apply-error') {
        if (typeof props.onError === 'function') props.onError(data.message)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [page])

  // state 到手（且页面脚本已跑完）就推给它
  useEffect(() => {
    const host = hostRef.current
    if (!host || !booted) return
    const win = host.contentWindow
    if (!win) return
    try {
      win.postMessage({ target: 'etude-frame', kind: 'state', value: props.state || null, query }, '*')
    } catch {}
  }, [booted, props.state, query])

  return h('iframe', {
    ref: hostRef,
    className: 'etude-frame',
    srcDoc: doc || '',
    // allow-same-origin 让页面的 localStorage 能用（新手引导记过没过）；
    // allow-scripts 是页面自己的脚本。不给 allow-top-navigation，导航一律走消息桥。
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
    style: { width: '100%', height: '100%', border: '0', display: 'block', background: 'transparent' },
    title: 'dsh-etude · ' + page,
  })
}
