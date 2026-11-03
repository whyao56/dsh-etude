/* 00 · 底座：一个小工具 + 图标 + 从宿主取主题 */
const h = React.createElement

const canUseDOM = typeof document !== 'undefined'

/** 把 design 里那套 svg path 收在一起，面板里到处要用 */
const ICON = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-1-8h2l.4 2.3 1.6.7 2-1.2 1.4 1.4-1.2 2 .7 1.6L20 12v2l-2.3.4-.7 1.6 1.2 2-1.4 1.4-2-1.2-1.6.7L11 20H9l-.4-2.3-1.6-.7-2 1.2L3.6 16.8l1.2-2-.7-1.6L2 12V10l2.3-.4.7-1.6-1.2-2L4.9 4.4l2 1.2 1.6-.7L9 2Z',
  plug: 'M9 2v5h2V2h2v5h1a3 3 0 0 1 3 3v3a6 6 0 0 1-5 5.9V22h-2v-3.1A6 6 0 0 1 5 13V10a3 3 0 0 1 3-3h1V2Z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  play: 'M8 5v14l11-7L8 5Z',
  factory:
    'M4 20V9l4 2V9l4 2V9l4 2V6h4v14H4Zm2-2h12v-8.2l-4-2V10l-4-2v2.2L6 8.4V18Z',
}

function Icon({ name, size = 18 }) {
  const d = ICON[name]
  if (!d) return null
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      'aria-hidden': 'true',
      style: { display: 'block', flex: '0 0 auto' },
    },
    h('path', { d }),
  )
}

/** design 的页面外壳：.page > main.screen */
function Screen({ className, children }) {
  return h('div', { className: 'page' }, h('main', { className: 'screen ' + (className || '') }, children))
}
