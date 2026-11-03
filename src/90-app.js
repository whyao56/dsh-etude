/* 90 · 组装：一个 App，按顶栏切页。
   四屏都是可选的 —— 某个分片还没写出来时（typeof 是 'undefined'），
   这一页就退回一张说明卡，不会整片白屏。 */

function EtudeApp({ rpc, configForm }) {
  const [page, setPage] = useState('cards')
  const { state, error, reload } = useFactory(rpc)

  const pageOf = (name) => {
    if (name === 'cards') return h(CardsPage, { rpc, state, error, onReload: reload, onGo: setPage })
    if (name === 'study' && typeof StudyPage === 'function') {
      return h(StudyPage, { rpc, state, error, onReload: reload, onGo: setPage })
    }
    if (name === 'factory' && typeof FactoryPage === 'function') {
      return h(FactoryPage, { rpc, state, error, reload })
    }
    if (name === 'stats' && typeof StatsPage === 'function') {
      return h(StatsPage, { rpc, state, error, reload })
    }
    if (name === 'settings' && typeof SettingsPage === 'function') {
      // form 是宿主 configForms 的 etude 表单；没有就传 null，设置页会渲染成只读并说明原因。
      return h(SettingsPage, { rpc, state, error, reload, form: configForm || null, onBack: () => setPage('cards') })
    }
    return h(ViewStub, { title: name, note: '这一屏还没搬进插件。' })
  }

  return h(
    ShadowHost,
    { theme: 'dark' },
    h(
      'div',
      { className: 'etude-shell' },
      h(Topbar, { page, onPage: setPage, state }),
      pageOf(page),
    ),
  )
}

function ViewStub({ title, note }) {
  return h(
    Screen,
    { className: 'half' },
    h('header', { className: 'hdr' }, h('h1', null, title)),
    h('div', { className: 'card', style: { padding: '24px' } }, h('p', { className: 'mut' }, note)),
  )
}
