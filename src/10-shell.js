/* 10 · 外壳：Shadow DOM 容器 + 顶栏 + 页面路由
   样式全部来自 design/app.css（构建时转成 :host 形态），塞进 shadow root，
   所以不会和宿主的任何样式互相污染 —— 这是把打磨好的界面原样搬进插件的前提。 */

const { createPortal } = require('react-dom')

/** 把 children 渲染进一个 shadow root，CSP 与全局样式都碰不到里层 */
function ShadowHost({ theme = 'dark', children }) {
  const hostRef = useRef(null)
  const [mount, setMount] = useState(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !canUseDOM) return
    let root = host.shadowRoot
    if (!root) root = host.attachShadow({ mode: 'open' })
    // 只在第一次挂 style，后面重渲染不要再覆盖，否则动画会重放
    if (!root.querySelector('style[data-etude]')) {
      const style = document.createElement('style')
      style.setAttribute('data-etude', '')
      style.textContent = __CSS__
      root.appendChild(style)
    }
    let box = root.querySelector('.etude-mount')
    if (!box) {
      box = document.createElement('div')
      box.className = 'etude-mount'
      box.style.height = '100%'
      root.appendChild(box)
    }
    setMount(box)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (host) host.setAttribute('data-theme', theme)
  }, [theme])

  return h(
    'div',
    {
      ref: hostRef,
      'data-etude-host': '',
      style: { display: 'block', height: '100%', minHeight: 0, contain: 'layout style' },
    },
    mount ? createPortal(children, mount) : null,
  )
}

/** 顶栏：设计稿里那一排（插件 / 卡片·工厂·统计 / 搜索 / 设置）
    注意 design/app.css 里是 `.tabs a`（第 167 行），不是 button —— 用 button 会没样式。 */
function Topbar({ page, onPage }) {
  const tabs = [
    ['cards', '卡片'],
    ['factory', '工厂'],
    ['stats', '统计'],
  ]
  return h(
    'div',
    { className: 'topbar' },
    h(
      'div',
      { className: 'tb-left' },
      h(
        'button',
        { className: 'pill', type: 'button', title: 'dsh-etude · 卡片工厂' },
        h(Icon, { name: 'plug', size: 16 }),
        h('span', null, '插件'),
      ),
    ),
    h(
      'nav',
      { className: 'tabs', role: 'tablist' },
      tabs.map(([id, label]) =>
        h(
          'a',
          {
            key: id,
            href: '#',
            role: 'tab',
            'aria-selected': page === id ? 'true' : 'false',
            className: page === id ? 'on' : '',
            onClick: (e) => {
              e.preventDefault()
              onPage(id)
            },
          },
          label,
        ),
      ),
    ),
    h(
      'div',
      { className: 'tb-right' },
      h(
        'button',
        { className: 'icobtn', type: 'button', title: '搜索', 'aria-label': '搜索' },
        h(Icon, { name: 'search', size: 18 }),
      ),
      h(
        'button',
        {
          className: 'icobtn' + (page === 'settings' ? ' on' : ''),
          type: 'button',
          title: '设置',
          'aria-label': '设置',
          onClick: () => onPage('settings'),
        },
        h(Icon, { name: 'gear', size: 18 }),
      ),
    ),
  )
}
