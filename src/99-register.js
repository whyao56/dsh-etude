/* 99 · 注册：main 面板 + 侧栏「卡片工厂」入口 */

const LOCALE = {
  zh: {
    'nav.title': '卡片工厂',
    'nav.subtitle': '还没有账本，先造一个包',
  },
  en: {
    'nav.title': 'Card factory',
    'nav.subtitle': 'No ledger yet — make a pack first',
  },
}

const inject = ['slots', 'locale', 'connection', 'configForms']

function apply(ctx) {
  // 宿主那边的连接。注意 apply 不是 React 组件，这里不能调 hook ——
  // 面板自己的状态全在 EtudeApp 里。
  let rpcGetter = null
  const getRpc = () => {
    if (rpcGetter) return rpcGetter
    try {
      const connection = ctx.get('connection')
      if (connection && typeof connection.rpc?.call === 'function') rpcGetter = connection.rpc
    } catch {}
    return rpcGetter
  }

  // 设置页要写回宿主配置：DSH 的 configForms 是 etude 表单的唯一写入口。
  // 拿不到（旧版宿主）就传 null，设置页会渲染成只读并说明原因。
  const getForm = () => {
    try {
      const forms = ctx.get('configForms')
      if (forms && typeof forms.get === 'function') return forms.get(CONFIG_NS) || null
    } catch {}
    return null
  }

  ctx.effect(() => ctx.locale.register(NS, { zh: LOCALE.zh, en: LOCALE.en }), 'dsh-etude: copy')
  const bound = ctx.locale.bind(NS)
  const t = (key) => {
    try {
      const v = bound(key)
      if (v && v !== key) return v
    } catch {}
    return LOCALE.zh[key] ?? LOCALE.en[key] ?? key
  }

  // 主面板：侧栏点「卡片工厂」进来的那一页
  ctx.slots.inject('main', () =>
    ctx.slots.register({ name: 'main', key: NS, locale: NS }, () =>
      h(EtudeApp, { rpc: getRpc, configForm: getForm() }),
    ),
  )

  // 侧栏那一行
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      { name: 'sidebar.panellist', id: NS, order: 30, label: () => t('nav.title'), locale: NS },
      (owner) => h(Icon, { name: 'factory', size: typeof owner?.size === 'number' ? owner.size : 18 }),
    ),
  )
}

exports.apply = apply
exports.inject = inject
