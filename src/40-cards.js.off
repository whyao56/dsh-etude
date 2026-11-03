/* 40 · 卡片页：包列表 + 接着练
   结构照 design/gen.mjs:201-412，类名与 app.css 对齐；但列换成插件真实有的四个数
   （例句 / 配图 / 语音 / 到哪一步）—— 设计稿那套 Anki 的未学习/学习中/待复习，
   插件这边还没有调度引擎，不能画不存在的数。 */

function PackRow({ row, onOpen }) {
  return h(
    'div',
    { className: 'drow parent', onClick: onOpen, style: { cursor: 'pointer' } },
    h(
      'span',
      { className: 'dname' },
      h('i', { className: 'caret', 'aria-hidden': 'true' }),
      h('a', { href: '#', onClick: (e) => e.preventDefault(), title: row.id }, row.name),
      h('span', { className: 'chip' }, row.kind === 'sentence' ? '整句' : row.kind === 'phrase' ? '说法' : '单词'),
    ),
    h('span', { className: 'dnum' }, String(row.examples)),
    h('span', { className: 'dnum learn' }, String(row.images)),
    h('span', { className: 'dnum' }, String(row.audios)),
    h('span', { className: 'dnum due' + (row.ready ? '' : ' z') }, row.statusText),
    h('span', { className: 'dgear' }),
  )
}

function CardsPage({ rpc, state, error, onReload, onGo }) {
  const rows = packRows(state)
  const target = nextUp(state)
  const [sample, setSample] = useState(null)
  const loading = state?.status === 'loading'

  //「接着练」要一句真的句子。listPacks 不带 examples（lib/packs.js:223-238），
  //所以要单独拉一次 pack.get —— 拉不到就老老实实说拉不到。
  useEffect(() => {
    let alive = true
    if (!target) {
      setSample(null)
      return () => {}
    }
    callRpc(rpc, 'pack.get', { id: target.id })
      .then((pack) => {
        if (!alive) return
        const examples = Array.isArray(pack?.examples) ? pack.examples : []
        setSample(examples[0] || null)
      })
      .catch(() => {
        if (alive) setSample(null)
      })
    return () => {
      alive = false
    }
  }, [rpc, target?.id])

  return h(
    Screen,
    { className: 'half' },
    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '卡片'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), state?.root ? '账本已连' : '还没连上'),
      ),
    ),

    error
      ? h(
          'div',
          { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12 } },
          h('div', { className: 'sec-title' }, '没取到数据'),
          h('p', { className: 'mut' }, error),
          h('button', { className: 'btn ghost', type: 'button', onClick: onReload }, '重试'),
        )
      : null,

    h(
      'div',
      { className: 'cards2' },
      h(
        'div',
        { className: 'c-l' },
        h(
          'section',
          { className: 'card deckcard' },
          h(
            'div',
            { className: 'deckhead' },
            h('span', { className: 'dname' }, '目标'),
            h('span', { className: 'dnum' }, '例句'),
            h('span', { className: 'dnum' }, '配图'),
            h('span', { className: 'dnum' }, '语音'),
            h('span', { className: 'dnum due' }, '到哪一步'),
            h('span', { className: 'dgear' }),
          ),
          loading
            ? h('div', { className: 'drow parent' }, h('span', { className: 'mut' }, '正在取账本…'))
            : rows.length
              ? rows.map((row) =>
                  h(PackRow, { key: row.id, row, onOpen: () => onGo && onGo('factory') }),
                )
              : h(
                  'div',
                  { className: 'drow parent', style: { height: 'auto', padding: '28px 16px' } },
                  h(
                    'span',
                    { className: 'mut' },
                    '还没有任何包。去「工厂」输入一个词、一个说法或者一整句，点「造一个包」——第一个包不用你配任何东西。',
                  ),
                ),
        ),
        h(
          'p',
          { className: 'deckstat' },
          rows.length
            ? `一共 ${rows.length} 个包，${rows.reduce((sum, one) => sum + one.examples, 0)} 条例句。`
            : '这一屏是空的，因为账本里还没有包。',
        ),
      ),
      h(
        'aside',
        { className: 'c-r' },
        h(
          'section',
          { className: 'card nextup' },
          h('div', { className: 'sec-title' }, '接着练'),
          target
            ? [
                h('div', { className: 'word', key: 'w' }, target.target),
                h(
                  'p',
                  { className: 'qline', key: 'q' },
                  sample?.sentence || (sample === null ? '例句还没取到' : '这个包还没有例句'),
                ),
                h(
                  'p',
                  { className: 'mut', key: 'm' },
                  sample?.sceneZh || sample?.sceneEn || (target.lastError ? `上次出错：${target.lastError}` : ''),
                ),
              ]
            : [
                h('div', { className: 'word', key: 'w' }, '还没有包'),
                h('p', { className: 'mut', key: 'm' }, '造一个包之后，这里会挑出下一个该练的句子。'),
              ],
          h(
            'div',
            { className: 'faces' },
            ['听', '说', '读', '写', '改'].map((f, i) =>
              h(
                'span',
                { key: f, className: 'face' },
                h('i', { className: 'pip ' + (i === 2 ? 'ok' : i < 2 ? 'warn' : '') }),
                f,
              ),
            ),
          ),
          h(
            'div',
            { className: 'nextup-foot' },
            h(
              'button',
              {
                className: 'btn primary',
                type: 'button',
                disabled: !target,
                onClick: () => target && onGo && onGo('study'),
              },
              '练这一句',
            ),
          ),
        ),
      ),
    ),

    h(
      'div',
      { className: 'deckfoot' },
      h('button', { className: 'btn ghost', type: 'button', onClick: onReload }, '刷新'),
      h('button', { className: 'btn ghost', type: 'button', onClick: () => onGo && onGo('factory') }, '造一个包'),
      h('button', { className: 'btn ghost', type: 'button', onClick: () => onGo && onGo('factory') }, '看素材'),
    ),
  )
}
