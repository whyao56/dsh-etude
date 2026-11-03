/* 50 · 工厂页 —— 造料 → 挑图 → 声音 → 出厂
   结构照 design/gen.mjs 的 screens.factory（左词表 / 中义项 / 右素材），类名照
   design/app.css 的 .fx-*。但每一格只画插件真有的东西，三处照实改了：

   1) 设计稿的「五维度（听说读写改）+ 权重开关」是 Anki 那种调度模型里的东西，
      插件里根本没有这个数据。这里换成这条例句真实的五件事：图 / 声 / 变体 /
      背景 / 复核，**只读**，不画假开关（画了开关就得有地方存）。
   2) 设计稿的「义项 N」按释义分组，一个包在 lib/packs.js 里只有一个 gloss，
      所以永远只有一组；界面上直接说清楚，不假装还有第二条。
   3) 「资源（动图 / 视频 / 帖子）」插件没有存储位、也没有对应端点：空态一句话，
      不画加号，免得点下去一片安静。

   三条死规矩在 lib 里，界面负责别把它们藏起来：
   · 图要人点过：只有 pack.pick / pack.upload 会写 imageReview.by，界面上
     「这张图点过没有」是从账本读的，不是点一下就在前端自己记一笔。
   · 声要真听过：勾「听过」的按钮在播放到六成之前是 disabled，点了也发不出去。
   · 重复造不重复花钱：pack.create 幂等命中时日志里会有一句「直接复用，不再花钱」，
     界面把宿主那句原话端出来，而不是自己编一句「已复用」。 */

// ────────────────────────────── 小工具 ──────────────────────────────

/** 扩展名 → mime。包里的文件名只有三种：语音 .mp3，图 .jpg/.png/.webp/.gif */
function FX_mimeOf(name) {
  const lower = String(name || '').toLowerCase()
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

/** 字节 → data URL。图和声都不走 HTTP 媒体路由（那条路由整站要鉴权，
    子资源请求带不上凭据，最后就是一片空格子），所以字节从 RPC 拿回来自己拼。 */
function FX_dataUrl(name, base64) {
  if (!base64) return null
  return 'data:' + FX_mimeOf(name) + ';base64,' + String(base64)
}

function FX_humanBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return Math.round(n / 1024) + ' KB'
}

function FX_humanSeconds(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  return n.toFixed(2) + ' 秒'
}

function FX_at(value) {
  if (!value) return ''
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate()) + ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes())
}

function FX_wordCount(sentence) {
  const text = String(sentence || '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

/** 句子 → [前, 目标词, 后]，中间那段在界面上用 <b> 包起来 */
function FX_sentenceParts(sentence, target) {
  const text = String(sentence || '')
  const needle = String(target || '').trim()
  if (!needle) return [text]
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return [text]
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)]
}

function FX_statusText(status) {
  const real = {
    generating: '在造例句',
    text: '例句好了',
    media: '在找素材',
    packed: '已打包',
    exported: '已导出',
    failed: '上次失败了',
  }
  return real[status] || STATUS_TEXT[status] || status || '刚建好'
}

function FX_kindText(kind) {
  if (kind === 'sentence') return '整句'
  if (kind === 'phrase') return '说法'
  if (kind === 'word') return '单词'
  return kind || '没标类型'
}

/** 账本里的包 → 左边词表那一行。设计稿的「未学习 / 待复习」是 Anki 的口径，
    这里换成插件真有的四个数：例句、有图、有语音、到哪一步。 */
function FX_rowsOf(state) {
  const packs = Array.isArray(state?.packs) ? state.packs : []
  return packs.map((pack) => {
    const total = pack?.progress?.total ?? (Array.isArray(pack?.examples) ? pack.examples.length : 0)
    const images = pack?.progress?.images ?? 0
    const audios = pack?.progress?.audios ?? 0
    return {
      id: pack.id,
      name: pack.target || '(未命名)',
      kind: pack.kind || 'word',
      status: pack.status || 'draft',
      createdAt: Date.parse(pack.createdAt || '') || 0,
      total,
      images,
      audios,
      done: pack?.progress?.done === true,
      missingImages: Math.max(0, total - images),
      missingAudios: Math.max(0, total - audios),
      lastError: pack.lastError || null,
    }
  })
}

/** 词表圆点：全齐 / 差一半 / 一条都没有 */
function FX_dotOf(row) {
  if (row.done) return 'ok'
  if (row.images > 0 || row.audios > 0 || row.total > 0) return 'half'
  return 'none'
}

function FX_sortedRows(rows, mode) {
  const list = rows.slice()
  if (mode === 'behind') {
    list.sort((a, b) => (b.missingImages + b.missingAudios) - (a.missingImages + a.missingAudios))
    return list
  }
  list.sort((a, b) => b.createdAt - a.createdAt)
  return list
}

/** 一条例句的四个真实维度，画成 summary 上那排小豆子 */
function FX_pipStates(example) {
  const image = example?.image
  const reviewed = Boolean(example?.imageReview?.by)
  const audio = example?.audio
  const listened = example?.audioReview?.listened === true
  const variants = Array.isArray(example?.zhVariants) ? example.zhVariants.length : 0
  return [
    { key: 'image', state: image && reviewed ? 'ok' : image ? 'warn' : 'none' },
    { key: 'audio', state: audio && listened ? 'ok' : audio ? 'warn' : 'none' },
    { key: 'variant', state: variants >= 2 ? 'ok' : variants ? 'warn' : 'none' },
    { key: 'scene', state: example?.sceneZh ? 'ok' : 'none' },
  ]
}

/** 幂等命中的那句原话（lib/packs.js 里 createPack 打的） */
function FX_reusedLine(job) {
  const lines = Array.isArray(job?.log) ? job.log : []
  return lines.find((one) => String(one).includes('不再花钱') || String(one).includes('直接复用')) || null
}

function FX_jobStatusText(status) {
  if (status === 'running') return '在跑'
  if (status === 'done') return '完了'
  if (status === 'failed') return '砸了'
  if (status === 'cancelled') return '撤了'
  return status || '不知道'
}

// ────────────────────────────── 样式（新增的类都叫 .fx-*，样式写在这里） ──────────────────────────────

function FX_noticeStyle(tone) {
  const table = {
    ok: { background: 'rgba(87,199,123,.10)', border: '1px solid rgba(87,199,123,.30)' },
    warn: { background: 'rgba(255,196,120,.10)', border: '1px solid rgba(255,196,120,.32)' },
    bad: { background: 'rgba(255,120,120,.10)', border: '1px solid rgba(255,120,120,.32)' },
    info: { background: 'rgba(138,169,255,.08)', border: '1px solid rgba(138,169,255,.22)' },
  }
  const picked = table[tone] || table.info
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    borderRadius: 11,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: 'var(--fg2)',
    background: picked.background,
    border: picked.border,
  }
}

function FX_blockStyle() {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--glass-line)',
    background: 'rgba(var(--w),.022)',
  }
}

function FX_logStyle() {
  return {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--fg3)',
    wordBreak: 'break-word',
  }
}

function FX_gapPx() {
  return { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }
}

// ────────────────────────────── 字节 → <img> / <audio> ──────────────────────────────

/** 一张图。spec 要么 {file}（已锁定的图），要么 {candidate:true, stagedName}（候选图）。
    两条端点的返回都是 {dataBase64}，这里拼成 data URL 塞给 <img src>。 */
function FX_Picture({ rpc, spec, alt, className, style }) {
  const [media, setMedia] = useState({ status: 'idle', url: null, error: null })
  const name = spec ? (spec.candidate ? spec.stagedName : spec.file) : ''
  const key = spec ? (spec.candidate ? 'candidate:' : 'image:') + name : ''

  useEffect(() => {
    if (!key) {
      setMedia({ status: 'idle', url: null, error: null })
      return undefined
    }
    let alive = true
    setMedia({ status: 'loading', url: null, error: null })
    const endpoint = spec.candidate ? 'candidate.bytes' : 'image.bytes'
    const payload = spec.candidate ? { stagedName: spec.stagedName } : { kind: 'images', file: spec.file }
    callRpc(rpc, endpoint, payload)
      .then((value) => {
        if (!alive) return
        const url = FX_dataUrl(name, value?.dataBase64)
        if (url) setMedia({ status: 'ready', url, error: null })
        else setMedia({ status: 'error', url: null, error: '宿主没给图片内容。' })
      })
      .catch((failure) => {
        if (!alive) return
        setMedia({ status: 'error', url: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [key, rpc])

  if (!spec) return null
  if (media.status === 'ready') return h('img', { className, style, src: media.url, alt: alt || '', loading: 'lazy' })
  return h(
    'div',
    {
      className: 'fx-miss ' + (className || ''),
      style: Object.assign(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 10.5,
          lineHeight: 1.4,
          color: 'var(--fg3)',
          background: 'rgba(var(--w),.05)',
          borderRadius: 9,
          padding: 4,
        },
        style || {},
      ),
      title: media.error || '正在取图片字节…',
    },
    media.status === 'error' ? '图取不到' : '取图…',
  )
}

// ────────────────────────────── 词表（左） ──────────────────────────────

function FactoryWords({ rows, selected, filter, sortMode, onFilter, onSort, onSelect }) {
  return h(
    'aside',
    { className: 'fx-side' },
    h(
      'div',
      { className: 'fx-sidehd' },
      '词表 ',
      h('span', { className: 'mut' }, rows.length + ' 个包'),
    ),
    h('input', {
      className: 'inp sm',
      type: 'search',
      value: filter,
      placeholder: '筛一下…',
      onChange: (event) => onFilter(event.target.value),
    }),
    h(
      'div',
      { className: 'fx-mini' },
      h(
        'button',
        {
          className: 'mini' + (sortMode === 'recent' ? ' on' : ''),
          type: 'button',
          onClick: () => onSort('recent'),
          title: '按造出来的时间倒着排',
        },
        '最近',
      ),
      h(
        'button',
        {
          className: 'mini' + (sortMode === 'behind' ? ' on' : ''),
          type: 'button',
          onClick: () => onSort('behind'),
          title: '欠得最多的排前面（缺图 + 缺声）',
        },
        '按欠的',
      ),
    ),
    h(
      'ul',
      { className: 'fx-words' },
      rows.length === 0
        ? h(
            'li',
            { style: { cursor: 'default' } },
            h('b', { className: 'mut' }, filter ? '没有配得上的' : '账本里还没有包'),
          )
        : rows.map((row) =>
            h(
              'li',
              {
                key: row.id,
                className: row.id === selected ? 'on' : '',
                onClick: () => onSelect(row.id),
                title: row.lastError ? '上次失败：' + row.lastError : FX_statusText(row.status),
              },
              h('b', null, row.name),
              h('i', { className: 'fdot ' + FX_dotOf(row) }),
            ),
          ),
    ),
  )
}

// ────────────────────────────── 素材：图（右） ──────────────────────────────

function FactoryMedia({ rpc, pack, example, busy, acts }) {
  const image = example.image
  const review = example.imageReview
  const candidates = Array.isArray(example.imageCandidates) ? example.imageCandidates : []
  const rejected = Array.isArray(example.imageRejected) ? example.imageRejected : []
  const pickedName = image?.candidateName || image?.stagedName || ''

  return h(
    'div',
    { className: 'fx-blk' },
    h(
      'div',
      { className: 'fx-bh' },
      '配图',
      h('span', { className: 'sp' }),
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.findCandidates(example.ord, example.imageQuery),
          title: '按这条例句的 image_query 去图库检索一批候选',
        },
        busy === 'candidates:' + example.ord ? '在找…' : '找候选图',
      ),
    ),

    h(
      'div',
      { className: 'imgbar fx-img' },
      image
        ? h(FX_Picture, {
            rpc,
            spec: { file: image.file },
            alt: '第 ' + example.ord + ' 条的配图',
            style: { width: 104, height: 72, borderRadius: 10 },
          })
        : h('div', {
            className: 'fx-miss',
            style: {
              width: 104,
              height: 72,
              borderRadius: 10,
              border: '1px dashed rgba(var(--w),.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              color: 'var(--ghost)',
              flex: '0 0 auto',
            },
          }, '没图'),
      h(
        'div',
        { className: 'im' },
        h('b', null, image ? '这张定了' : '还没有配图'),
        h(
          'span',
          { className: 'mut' },
          image
            ? [image.source || '来路没记', image.width && image.height ? image.width + '×' + image.height : '', FX_humanBytes(image.bytes), image.license || '许可没记']
                .filter(Boolean)
                .join(' · ')
            : '找一批候选，点一张才算数。',
        ),
        review
          ? h('span', { className: 'mut' }, '复核人：' + (review.by || '?') + ' · ' + FX_at(review.at))
          : image
            ? h('span', { className: 'mut', style: { color: 'var(--warn)' } }, '这张还没人点过头，打包会被挡。')
            : null,
      ),
    ),

    h(
      'div',
      { className: 'shots' },
      candidates.map((one) =>
        h(
          'div',
          {
            key: one.stagedName,
            className: 's' + (one.stagedName === pickedName ? ' on' : ''),
            onClick: () => acts.pick(example.ord, one),
            title: [one.source, one.query, one.license].filter(Boolean).join(' · ') || one.stagedName,
          },
          h(FX_Picture, { rpc, spec: { candidate: true, stagedName: one.stagedName }, alt: one.stagedName }),
          h('em', null, one.source || '候选'),
        ),
      ),
    ),

    candidates.length === 0
      ? h('p', { className: 'note mut' }, '这批还没有候选图。点上面的「找候选图」，本机去图库现找一批。')
      : null,

    h(
      'div',
      { className: 'vopts' },
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.pickCandidatesAll(),
          title: '把这个包里所有还没图的条目一起找一遍（已经定图 / 已有候选的会跳过）',
        },
        '全部找一遍',
      ),
      image
        ? h(
            'button',
            {
              className: 'mini',
              type: 'button',
              disabled: Boolean(busy),
              onClick: () => acts.unlockImage(example.ord),
              title: '把这张图取消掉，回去重新挑',
            },
            '不锁了',
          )
        : null,
      h(
        'label',
        {
          className: 'mini',
          style: { cursor: 'pointer' },
          title: '自己上传一张图；上传也算你点过头',
        },
        '自己传一张',
        h('input', {
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: (event) => {
            const file = event.target?.files?.[0]
            event.target.value = ''
            if (file) acts.upload(example.ord, file)
          },
        }),
      ),
    ),

    rejected.length
      ? h(
          'p',
          { className: 'note mut' },
          '挡掉了 ' + rejected.length + ' 张：' + rejected.slice(0, 3).map((one) => one.reason || one.source || '').filter(Boolean).join('；'),
        )
      : null,
  )
}

// ────────────────────────────── 素材：声音（右） ──────────────────────────────

function FactoryAudio({ rpc, pack, example, voices, busy, acts }) {
  const audio = example.audio
  const review = example.audioReview
  const listened = review?.listened === true
  const [media, setMedia] = useState({ status: 'idle', url: null, error: null })
  const [ratio, setRatio] = useState(0)
  const [playing, setPlaying] = useState(false)
  const node = useRef(null)
  const played = useRef(0)
  const fileName = audio?.file || ''

  // 合成过一次不算听过：换文件就从头算播放进度（synthesizeExample 也会把
  // audioReview 置空，两边口径一致）。
  useEffect(() => {
    played.current = 0
    setRatio(0)
    setPlaying(false)
  }, [fileName])

  useEffect(() => {
    if (!fileName) {
      setMedia({ status: 'idle', url: null, error: null })
      return undefined
    }
    let alive = true
    setMedia({ status: 'loading', url: null, error: null })
    callRpc(rpc, 'image.bytes', { kind: 'audio', file: fileName })
      .then((value) => {
        if (!alive) return
        const url = FX_dataUrl(fileName, value?.dataBase64)
        if (url) setMedia({ status: 'ready', url, error: null })
        else setMedia({ status: 'error', url: null, error: '宿主没给语音内容。' })
      })
      .catch((failure) => {
        if (!alive) return
        setMedia({ status: 'error', url: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [fileName, rpc])

  function toggle() {
    const element = node.current
    if (!element || typeof element.play !== 'function') return
    if (element.paused) {
      try {
        const started = element.play()
        if (started && typeof started.catch === 'function') started.catch(() => setPlaying(false))
      } catch (failure) {
        setMedia({ status: 'error', url: null, error: '放不出来：' + (failure?.message || String(failure)) })
      }
    } else {
      element.pause()
    }
  }

  function onTimeUpdate(event) {
    const element = event.currentTarget
    const duration = Number(element?.duration)
    if (!Number.isFinite(duration) || duration <= 0) return
    const now = Number(element.currentTime) || 0
    if (now > played.current) played.current = now
    const next = Math.min(1, played.current / duration)
    setRatio((prev) => (next > prev ? next : prev))
  }

  const needMore = Math.max(0, 0.6 - ratio)
  const gateOpen = Boolean(audio) && ratio >= 0.6
  const seconds = Number(audio?.seconds) || 0
  const remain = seconds > 0 && !gateOpen ? Math.ceil(needMore * seconds) : 0
  const currentVoice = pack?.voiceChoice?.voice || voices?.defaultVoice || ''

  return h(
    'div',
    { className: 'fx-blk' },
    h(
      'div',
      { className: 'fx-bh' },
      '语音',
      h('span', { className: 'sp' }),
      audio ? h('span', { className: 'mut' }, FX_humanSeconds(audio.seconds)) : h('span', { className: 'mut' }, '还没合成'),
    ),

    h(
      'div',
      { className: 'vline' },
      h(
        'select',
        {
          className: 'sel sm',
          value: currentVoice,
          disabled: Boolean(busy) || !voices?.list?.length,
          onChange: (event) => acts.setVoice(event.target.value),
          title: '换音色之后，已有语音要重新合成才算数',
        },
        (voices?.list || []).map((one) =>
          h('option', { key: one.id, value: one.id }, one.label + (one.locale ? ' · ' + one.locale : '')),
        ),
      ),
      h('span', { className: 'mut' }, voices?.error ? '音色表没取到，这几个是兜底的' : voices?.engine === 'openai' ? 'openai' : 'edge'),
    ),

    audio
      ? h(
          'div',
          { className: 'vline' },
          h(
            'button',
            {
              className: 'mini',
              type: 'button',
              onClick: toggle,
              disabled: media.status !== 'ready',
              title: media.status === 'error' ? media.error : '放一遍',
            },
            playing ? '暂停' : h(Icon, { name: 'play', size: 11 }),
          ),
          h(
            'div',
            {
              className: 'fx-miss',
              style: {
                flex: '1 1 auto',
                height: 5,
                borderRadius: 99,
                background: 'rgba(var(--w),.12)',
                overflow: 'hidden',
                padding: 0,
              },
              title: '听了 ' + Math.round(ratio * 100) + '%',
            },
            h('i', {
              style: {
                display: 'block',
                height: '100%',
                width: Math.round(ratio * 100) + '%',
                background: ratio >= 0.6 ? 'var(--ok)' : 'var(--accent)',
                transition: 'width .2s linear',
              },
            }),
          ),
          h('span', { className: 'mut' }, Math.round(ratio * 100) + '%'),
          h('audio', {
            ref: node,
            src: media.url || undefined,
            preload: 'auto',
            style: { display: 'none' },
            onTimeUpdate,
            onPlaying: () => setPlaying(true),
            onPause: () => setPlaying(false),
            onEnded: () => {
              setPlaying(false)
              setRatio(1)
            },
          }),
        )
      : null,

    h(
      'div',
      { className: 'vopts' },
      h(
        'button',
        {
          className: 'mini' + (audio ? '' : ' go'),
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.synthesize(example.ord),
          title: '合成本条例句的语音',
        },
        busy === 'audio:' + example.ord ? '在合成…' : audio ? '重合成' : '合成语音',
      ),
      audio
        ? h(
            'button',
            {
              className: 'mini go',
              type: 'button',
              disabled: !gateOpen || listened || Boolean(busy),
              onClick: () => acts.confirmAudio(example.ord),
              title: gateOpen
                ? '这句你真听到了六成，记一笔'
                : '还没听到六成，先放着听一遍（还差 ' + remain + ' 秒）',
            },
            listened ? '已经听过了' : gateOpen ? '听过' : '还要听 ' + remain + ' 秒',
          )
        : null,
      listened
        ? h(
            'button',
            {
              className: 'mini xs',
              type: 'button',
              disabled: Boolean(busy),
              onClick: () => acts.unlockAudio(example.ord),
              title: '把「听过」这笔撤掉',
            },
            '撤销',
          )
        : null,
      h(
        'button',
        {
          className: 'mini',
          type: 'button',
          disabled: Boolean(busy),
          onClick: () => acts.synthesizeAll(),
          title: '整个包每条都合成一遍（已有语音也会重来）',
        },
        '全部合成',
      ),
    ),

    h(
      'p',
      { className: 'note mut' },
      audio
        ? (audio.engine || '引擎没记') + ' / ' + (audio.voice || '音色没记') + (audio.fellBackFrom ? '（' + audio.fellBackFrom + ' 不可用，降级来的）' : '')
        : '还没合成。合成不等于听过 —— 合成完了要真放一遍才算数。',
    ),

    listened
      ? h('p', { className: 'note', style: { color: 'var(--ok)' } }, '复核人：' + (review.by || '?') + ' · ' + FX_at(review.at))
      : null,
  )
}

// ────────────────────────────── 一条例句（中间，展开态） ──────────────────────────────

function FactoryExampleRow({ rpc, pack, example, open, onToggle, voices, busy, acts }) {
  const target = pack.target
  const parts = FX_sentenceParts(example.sentence, target)
  const pips = FX_pipStates(example)
  const variants = Array.isArray(example.zhVariants) ? example.zhVariants : []

  const dims = [
    {
      key: 'image',
      name: '图',
      ok: Boolean(example.image) && Boolean(example.imageReview?.by),
      text: example.image ? (example.imageReview?.by ? '定了，也点过' : '有图，但没人点过') : '还没配图',
    },
    {
      key: 'audio',
      name: '声',
      ok: Boolean(example.audio) && example.audioReview?.listened === true,
      text: example.audio ? (example.audioReview?.listened ? '听过了' : '有语音，没听过') : '还没合成',
    },
    {
      key: 'variant',
      name: '变',
      ok: variants.length >= 2,
      text: variants.length ? '中文说法 ' + variants.length + ' 条' : '没有中文变体',
    },
    {
      key: 'scene',
      name: '景',
      ok: Boolean(example.sceneZh),
      text: example.register || (example.sceneZh ? '有场景' : '没写场景'),
    },
    {
      key: 'review',
      name: '核',
      ok: Boolean(example.imageReview?.by) && example.audioReview?.listened === true,
      text:
        example.imageReview?.by && example.audioReview?.listened
          ? '图和声都复核过'
          : '还差' + [example.imageReview?.by ? '' : '点图', example.audioReview?.listened ? '' : '听声'].filter(Boolean).join(' / '),
    },
  ]

  return h(
    'details',
    { className: 'fx-row', open: open ? true : undefined },
    h(
      'summary',
      {
        onClick: (event) => {
          event.preventDefault()
          onToggle(open ? null : example.ord)
        },
      },
      h('span', { className: 'n' }, String(example.ord)),
      h(
        'span',
        { className: 's' },
        parts.length === 3
          ? [parts[0], h('b', { key: 'mid' }, parts[1]), parts[2]]
          : h('span', null, parts[0]),
      ),
      h(
        'span',
        { className: 'pips' },
        pips.map((pip) =>
          h('i', {
            key: pip.key,
            className: pip.state === 'ok' ? 'ok' : pip.state === 'warn' ? 'warn' : '',
          }),
        ),
      ),
      h('span', { className: 'wc' }, FX_wordCount(example.sentence) + ' 词'),
      h('span', { className: 'ix' }, example.audio ? '♪' : '—'),
      h(
        'button',
        {
          className: 'mini xs',
          type: 'button',
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggle(open ? null : example.ord)
          },
        },
        open ? '收起' : '展开',
      ),
    ),

    open
      ? h(
          'div',
          { className: 'fx-body' },

          // 五件事：只读。设计稿那五个开关背后是调度权重，插件里没有这个东西。
          h(
            'div',
            { className: 'fx-blk b5' },
            h('div', { className: 'fx-bh' }, '这条的五件事', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '只读')),
            h(
              'div',
              { className: 'f5list' },
              dims.map((dim) =>
                h(
                  'div',
                  { className: 'f5row', key: dim.key },
                  h('b', null, dim.name),
                  h('em', { className: dim.ok ? 'ok' : 'warn' }, dim.ok ? '齐了' : '差着'),
                  h('span', { className: 'sp' }),
                  h('span', { className: 'd' }, dim.text),
                ),
              ),
            ),
            h(
              'p',
              { className: 'note mut' },
              '设计稿这里是「听/说/读/写/改」五个权重开关 —— 插件没有调度引擎，画了也没地方存。换成这五件能查证的事。',
            ),
          ),

          h(FactoryMedia, { rpc, pack, example, busy, acts }),
          h(FactoryAudio, { rpc, pack, example, voices, busy, acts }),

          h(
            'div',
            { className: 'fx-blk' },
            h('div', { className: 'fx-bh' }, '中文变体', h('span', { className: 'sp' }), h('span', { className: 'mut' }, variants.length + ' 条')),
            variants.length
              ? h(
                  'div',
                  { className: 'chips' },
                  variants.map((one, index) => h('span', { key: index, className: 'chip on' }, one)),
                )
              : h('p', { className: 'note mut' }, '模型没给中文变体。'),
            h('p', { className: 'note mut' }, '这些是造例句时模型一起给的，插件里没有改它的端点，所以只读。'),
          ),

          h(
            'div',
            { className: 'fx-blk' },
            h('div', { className: 'fx-bh' }, '资源', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '0 条')),
            h(
              'p',
              { className: 'note mut' },
              '动图 / 视频 / 帖子这类外部资源，插件还没有存它们的字段，也没有对应端点 —— 所以这一格是空的，不是没加载出来。',
            ),
          ),

          h(
            'div',
            { className: 'fx-blk bbg' },
            h('div', { className: 'fx-bh' }, '背景', h('span', { className: 'sp' }), h('span', { className: 'mut' }, '造料时定的')),
            h(
              'ul',
              { className: 'bgl' },
              h('li', null, h('b', null, '场景'), h('span', null, example.sceneEn || '没写英文场景')),
              h('li', null, h('b', null, '中文'), h('span', null, example.sceneZh || '没写中文场景')),
              h('li', null, h('b', null, '语域'), h('span', null, example.register || '没标')),
              h('li', null, h('b', null, '语气'), h('span', null, example.voiceHint || '没给')),
              h('li', null, h('b', null, '找图词'), h('span', null, example.imageQuery || '没给')),
            ),
          ),
        )
      : null,
  )
}

// ────────────────────────────── 义项（中间） ──────────────────────────────

function FactorySense({ rpc, pack, examples, openOrd, onOpen, voices, busy, acts }) {
  const total = Array.isArray(pack.examples) ? pack.examples.length : 0
  return h(
    'div',
    { className: 'fx-sense' },
    h(
      'div',
      { className: 'fx-def' },
      h('span', { className: 'dn' }, '义项 1'),
      h('span', { className: 'dt' }, pack.gloss || pack.note || '(模型没给释义)'),
      h(
        'span',
        { className: 'prob' },
        h('i', null, '例句 ', h('b', null, String(total))),
        pack.ipa ? h('i', null, '音标 ', h('b', null, pack.ipa)) : null,
      ),
      h('span', { className: 'sp' }),
      h('span', { className: 'mut' }, '一个包只有一条释义，变体那栏是中文说法，不是义项'),
    ),
    examples.length === 0
      ? h(
          'p',
          { className: 'note mut' },
          total === 0
            ? '这个包的例句还没造出来。上面「造料」跑完之后，这里会一条一条列出来。'
            : '筛出来的这几条都不在：换个筛法，或者点「全部」。',
        )
      : examples.map((example) =>
          h(FactoryExampleRow, {
            key: example.ord,
            rpc,
            pack,
            example,
            open: openOrd === example.ord,
            onToggle: onOpen,
            voices,
            busy,
            acts,
          }),
        ),
  )
}

// ────────────────────────────── 整页 ──────────────────────────────

function FactoryPage({ rpc, state, error, reload }) {
  const ready = state?.status === 'ready'
  const rows = FX_rowsOf(state)

  const [draft, setDraft] = useState('')
  const [count, setCount] = useState('8')
  const [autoImages, setAutoImages] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortMode, setSortMode] = useState('recent')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState({ status: 'idle', pack: null, error: null })
  const [nonce, setNonce] = useState(0)
  const [job, setJob] = useState(null)
  const [flash, setFlash] = useState(null)
  const [check, setCheck] = useState(null)
  const [busy, setBusy] = useState('')
  const [seg, setSeg] = useState('all')
  const [sentenceFilter, setSentenceFilter] = useState('')
  const [openOrd, setOpenOrd] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [voices, setVoices] = useState({ list: [], defaultVoice: '', engine: '', error: null })

  const pack = detail.pack
  const detailId = pack?.id || null

  // 进了页面先挑一个包：优先挑还没做完的，全做完了就挑最近那个
  useEffect(() => {
    if (selected) return
    if (!rows.length) return
    const behind = rows.filter((row) => !row.done).sort((a, b) => b.createdAt - a.createdAt)
    setSelected((behind[0] || rows[0]).id)
  }, [rows, selected])

  // 选中变了就去账本取整包（列表里只有 progress，没有例句和素材）
  useEffect(() => {
    if (!selected) {
      setDetail({ status: 'idle', pack: null, error: null })
      return undefined
    }
    let alive = true
    setDetail((prev) => (prev.pack && prev.pack.id === selected ? prev : { status: 'loading', pack: null, error: null }))
    callRpc(rpc, 'pack.get', { id: selected })
      .then((value) => {
        if (alive) setDetail({ status: 'ready', pack: value, error: null })
      })
      .catch((failure) => {
        if (alive) setDetail({ status: 'error', pack: null, error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [selected, nonce, rpc])

  // 音色表：取一次就够，拿不到就用兜底表（pack.voice.list 自己会兜底）
  useEffect(() => {
    let alive = true
    callRpc(rpc, 'pack.voice.list', {})
      .then((value) => {
        if (!alive) return
        setVoices({
          list: Array.isArray(value?.voices) ? value.voices : [],
          defaultVoice: value?.defaultVoice || '',
          engine: value?.engine || '',
          error: value?.error || null,
        })
      })
      .catch((failure) => {
        if (!alive) return
        setVoices({ list: [], defaultVoice: '', engine: '', error: failure?.message || String(failure) })
      })
    return () => {
      alive = false
    }
  }, [rpc])

  // 任务轮询：起任务只拿得到任务号，日志和结果得自己接着问
  useEffect(() => {
    if (!job || job.status !== 'running') return undefined
    let alive = true
    const timer = setTimeout(() => {
      callRpc(rpc, 'job.get', { id: job.id })
        .then((next) => {
          if (!alive) return
          setJob(next)
          if (next.status !== 'running') finishJob(next)
        })
        .catch((failure) => {
          if (!alive) return
          setJob(Object.assign({}, job, { status: 'failed', error: failure?.message || String(failure) }))
          setFlash({ tone: 'bad', text: '任务状态取不到了：' + (failure?.message || String(failure)) })
        })
    }, 900)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [job, rpc])

  /** 发一条同步端点，失败一律落成提示条，不抛 */
  async function send(endpoint, payload, key) {
    setBusy(key)
    try {
      return await callRpc(rpc, endpoint, payload)
    } catch (failure) {
      setFlash({ tone: 'bad', text: '没成：' + (failure?.message || String(failure)) })
      return null
    } finally {
      setBusy('')
    }
  }

  /** 起一个后台任务：立刻拿到任务号，剩下的交给轮询 */
  async function startJob(endpoint, payload, key, hint) {
    setBusy(key)
    try {
      const started = await callRpc(rpc, endpoint, payload)
      setJob(started)
      setFlash({ tone: 'info', text: hint || '开了个任务：' + (started.label || started.kind) + '。下面能看到它跑到哪儿。' })
      return started
    } catch (failure) {
      setFlash({ tone: 'bad', text: '没成：' + (failure?.message || String(failure)) })
      return null
    } finally {
      setBusy('')
    }
  }

  async function refreshPack(packId) {
    const id = packId || selected
    if (!id) return null
    try {
      const value = await callRpc(rpc, 'pack.get', { id })
      setDetail({ status: 'ready', pack: value, error: null })
      return value
    } catch (failure) {
      setDetail({ status: 'error', pack: null, error: failure?.message || String(failure) })
      return null
    }
  }

  function finishJob(finished) {
    const kind = finished.kind
    if (finished.status === 'failed') {
      setFlash({ tone: 'bad', text: '任务砸了（' + FX_jobStatusText(finished.status) + '）：' + (finished.error || '没有说明') })
      refreshPack()
      if (reload) reload()
      return
    }
    if (finished.status === 'cancelled') {
      setFlash({ tone: 'warn', text: '任务被你撤了，账本没动。' })
      return
    }
    const reused = FX_reusedLine(finished)
    if (kind === 'create') {
      const packId = finished.result?.packId
      if (reused) {
        // 幂等命中：宿主那边一句钱都没花，界面把它的原话端出来
        setFlash({ tone: 'warn', text: '这是上次造的，没再花钱。' + (packId ? '（' + packId + '）' : '') })
      } else {
        setFlash({ tone: 'ok', text: '造好了' + (packId ? '：' + packId : '') + '。下一步挑图。' })
      }
      if (packId) setSelected(packId)
    } else if (kind === 'candidates') {
      const kept = finished.result?.kept ?? 0
      const rejected = finished.result?.rejected ?? 0
      setFlash({ tone: 'ok', text: '候选图留了 ' + kept + ' 张，挡掉 ' + rejected + ' 张。点一张才算数。' })
    } else if (kind === 'candidates-all') {
      const done = finished.result?.done ?? 0
      const total = finished.result?.total ?? 0
      const failed = (finished.result?.failures || []).length
      setFlash({ tone: failed ? 'warn' : 'ok', text: '候选图找完了：' + total + ' 条，成了 ' + done + ' 条' + (failed ? '，' + failed + ' 条没成' : '') + '。' })
    } else if (kind === 'audio') {
      setFlash({ tone: 'ok', text: '语音合好了。放一遍听到六成，「听过」才点得动。' })
    } else if (kind === 'audio-all') {
      const done = finished.result?.done ?? 0
      const total = finished.result?.total ?? 0
      const failed = (finished.result?.failures || []).length
      setFlash({ tone: failed ? 'warn' : 'ok', text: '语音合完了：' + total + ' 条，成了 ' + done + ' 条' + (failed ? '，' + failed + ' 条没成' : '') + '。每条听完才算数。' })
    } else if (kind === 'pack') {
      const errors = finished.result?.errors || []
      const dir = finished.result?.dir
      setFlash({ tone: errors.length ? 'warn' : 'ok', text: (dir ? '打好了：' + dir : '打包完成。') + (errors.length ? '（但还有 ' + errors.length + ' 个错）' : '') })
    } else if (kind === 'export') {
      const value = finished.result || {}
      setFlash({ tone: 'ok', text: value.dir ? '导出到 ' + value.dir + '（' + (value.files ?? 0) + ' 个文件，' + (FX_humanBytes(value.bytes) || '体积没算') + '）。' : '导出完成。' })
    } else {
      setFlash({ tone: 'ok', text: (finished.label || kind) + ' 完成了。' })
    }
    if (reload) reload()
    refreshPack()
  }

  async function doCreate() {
    const target = draft.trim()
    if (!target) {
      setFlash({ tone: 'warn', text: '先在上面写一个词、一个说法或者一整句。' })
      return
    }
    const payload = { target, examples: Number(count) || 8 }
    if (autoImages) payload.prepareCandidates = true
    const started = await startJob('pack.create', payload, 'create', '正在造料：' + target + '（同样的目标再点一次不会重复扣钱，宿主会认幂等键）')
    if (started) setDraft('')
  }

  async function cancelJob(id) {
    const value = await send('job.cancel', { id }, 'cancel')
    if (value) setJob(value)
  }

  async function pickImage(ord, candidate) {
    const value = await send('pack.pick', { id: detailId, ord, stagedName: candidate.stagedName }, 'pick:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条锁了这张 —— 这一下就是你点过头的凭据，账本里记了复核人。' })
    if (reload) reload()
  }

  async function unlockImage(ord) {
    const value = await send('pack.unlockImage', { id: detailId, ord }, 'unlockImage:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条的图放开了，回去重新挑。' })
    if (reload) reload()
  }

  async function uploadImage(ord, file) {
    if (typeof FileReader === 'undefined') {
      setFlash({ tone: 'bad', text: '这个环境读不了本地文件。' })
      return
    }
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result || '')
        const comma = text.indexOf(',')
        resolve(comma >= 0 ? text.slice(comma + 1) : text)
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
    if (!base64) {
      setFlash({ tone: 'bad', text: '这张图读不出来。' })
      return
    }
    const value = await send('pack.upload', { id: detailId, ord, dataBase64: base64, mediaType: file.type || '' }, 'upload:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value.pack || value, error: null })
    setFlash({ tone: 'ok', text: '传上去了，第 ' + ord + ' 条用这张。' })
    if (reload) reload()
  }

  async function confirmAudio(ord) {
    const value = await send('pack.confirmAudio', { id: detailId, ord }, 'confirmAudio:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    setFlash({ tone: 'ok', text: '第 ' + ord + ' 条记成听过了。' })
    if (reload) reload()
  }

  async function unlockAudio(ord) {
    const value = await send('pack.unlockAudio', { id: detailId, ord }, 'unlockAudio:' + ord)
    if (!value) return
    setDetail({ status: 'ready', pack: value, error: null })
    if (reload) reload()
  }

  async function setVoice(voice) {
    const value = await send('pack.voice', { id: detailId, voice }, 'voice')
    if (!value) return
    setFlash({ tone: 'ok', text: '音色换成 ' + voice + '。已有语音要重新合成才算数。' })
    await refreshPack()
  }

  async function doCheck() {
    setBusy('check')
    try {
      const value = await callRpc(rpc, 'pack.check', { id: detailId })
      setCheck({ status: 'ready', value })
    } catch (failure) {
      setCheck({ status: 'error', message: failure?.message || String(failure) })
    } finally {
      setBusy('')
    }
  }

  async function doReopen() {
    const value = await send('pack.reopen', { id: detailId }, 'reopen')
    if (!value) return
    setFlash({ tone: 'ok', text: '打回去了：现在是「' + FX_statusText(value.status) + '」' + (value.hadExport ? '，之前导出过的那份还在。' : '') })
    await refreshPack()
    if (reload) reload()
  }

  async function doDelete() {
    const value = await send('pack.delete', { id: detailId }, 'delete')
    if (!value) return
    setConfirmDelete(false)
    setSelected(null)
    setDetail({ status: 'idle', pack: null, error: null })
    setFlash({ tone: 'warn', text: '包删了。导出到下载目录的那份是磁盘上的文件，这边不动它。' })
    if (reload) reload()
  }

  // ── 交给下面几块的动作用一份打包好的，省得每个组件都接七八个 props ──
  const acts = {
    pick: pickImage,
    unlockImage,
    upload: uploadImage,
    synthesize: (ord) => startJob('pack.audio', { id: detailId, ord }, 'audio:' + ord, '开始合成第 ' + ord + ' 条的语音。'),
    synthesizeAll: () => startJob('pack.audioAll', { id: detailId }, 'audioAll', '开始把整个包的语音都合成一遍。'),
    confirmAudio,
    unlockAudio,
    setVoice,
    findCandidates: (ord, query) =>
      startJob('pack.candidates', { id: detailId, ord, query: query || undefined }, 'candidates:' + ord, '去找第 ' + ord + ' 条的候选图。'),
    pickCandidatesAll: () => startJob('pack.candidatesAll', { id: detailId }, 'candidatesAll', '把这个包里还没图的条目一起找一遍。'),
  }

  // ── 中间那些句子按「全部 / 缺图 / 缺声」和一句话筛选 ──
  const examples = Array.isArray(pack?.examples) ? pack.examples : []
  const filtered = examples.filter((example) => {
    if (seg === 'noimg' && example.image) return false
    if (seg === 'noaudio' && example.audio) return false
    const needle = sentenceFilter.trim().toLowerCase()
    if (needle && !String(example.sentence || '').toLowerCase().includes(needle)) return false
    return true
  })

  const rowsShown = FX_sortedRows(
    rows.filter((row) => {
      const needle = filter.trim().toLowerCase()
      if (!needle) return true
      return row.name.toLowerCase().includes(needle)
    }),
    sortMode,
  )

  const reuseLine = job ? FX_reusedLine(job) : null
  const verdict = check?.value?.verdict || null

  return h(
    Screen,
    null,

    h(
      'header',
      { className: 'hdr' },
      h('h1', null, '工厂'),
      h('div', { className: 'sub' }, '造料 → 挑图 → 声音 → 出厂。每一步都要人点头，点完才写进账本。'),
      h(
        'div',
        { className: 'act' },
        h('span', { className: 'chip live' }, h('i'), ready ? '账本已连' : state?.status === 'loading' ? '在取账本' : '账本没连上'),
        h('button', { className: 'btn ghost', type: 'button', onClick: reload }, '重新取账本'),
      ),
    ),

    // 造料条：不管有没有包都得在，不然第一个包造不出来
    h(
      'div',
      { className: 'fx-src' },
      h('input', {
        className: 'inp',
        type: 'text',
        value: draft,
        placeholder: '一个词 / 一个说法 / 一整句，比如 run out of',
        onChange: (event) => setDraft(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') doCreate()
        },
      }),
      h(
        'select',
        { className: 'sel sm', value: count, onChange: (event) => setCount(event.target.value), title: '造几条例句' },
        ['4', '6', '8', '10', '12'].map((n) => h('option', { key: n, value: n }, n + ' 条')),
      ),
      h(
        'button',
        {
          className: 'sw' + (autoImages ? ' on' : ''),
          type: 'button',
          role: 'switch',
          'aria-checked': autoImages,
          onClick: () => setAutoImages(!autoImages),
          title: '造完例句顺手去图库找一批候选图（不点图，只是先备着）',
        },
        h('i'),
      ),
      h('span', { className: 'mut', style: { fontSize: 11 } }, autoImages ? '顺手找图' : '先只造例句'),
      h(
        'button',
        {
          className: 'btn primary',
          type: 'button',
          disabled: busy === 'create' || !draft.trim(),
          onClick: doCreate,
        },
        busy === 'create' ? '在问模型…' : '造料',
      ),
      h(
        'button',
        {
          className: 'btn ghost',
          type: 'button',
          disabled: !selected,
          onClick: () => refreshPack(),
          title: '重新取一次这个包的细节',
        },
        '刷新',
      ),
    ),

    flash ? h('div', { className: 'fx-notice ' + (flash.tone || 'info'), style: FX_noticeStyle(flash.tone) }, h('span', null, flash.text)) : null,

    // 任务条：后台在干什么、跑到哪儿、日志最后几行、幂等命中的原话
    job
      ? h(
          'div',
          { className: 'fx-job', style: FX_blockStyle() },
          h(
            'div',
            { className: 'fx-bh' },
            h('b', null, job.label || job.kind),
            h('span', { className: 'chip' + (job.status === 'running' ? ' live' : '') }, FX_jobStatusText(job.status)),
            job.progress && job.progress.total ? h('span', { className: 'mut' }, job.progress.done + '/' + job.progress.total) : null,
            h('span', { className: 'sp' }),
            job.status === 'running' ? h('button', { className: 'mini xs', type: 'button', onClick: () => cancelJob(job.id) }, '撤了') : null,
            h('button', { className: 'mini xs', type: 'button', onClick: () => setJob(null) }, '收起'),
          ),
          job.error ? h('div', { className: 'mut' }, job.error) : null,
          reuseLine
            ? h(
                'div',
                {
                  className: 'fx-reuse',
                  style: {
                    fontSize: 12,
                    padding: '6px 9px',
                    borderRadius: 9,
                    color: 'var(--fg)',
                    background: 'rgba(255,196,120,.12)',
                    border: '1px solid rgba(255,196,120,.28)',
                  },
                },
                '这是上次造的，没再花钱 —— 宿主原话：' + reuseLine,
              )
            : null,
          Array.isArray(job.log) && job.log.length
            ? h(
                'ul',
                { className: 'fx-joblog', style: FX_logStyle() },
                job.log.slice(-6).map((line, index) => h('li', { key: index }, line)),
              )
            : null,
        )
      : null,

    // 后台还有别的任务在跑（刷新之后接不回来的那种）
    !job && Array.isArray(state?.jobs) && state.jobs.length
      ? h(
          'div',
          { className: 'fx-notice info', style: FX_noticeStyle('info') },
          h('span', null, '后台还有 ' + state.jobs.length + ' 个任务在跑：' + state.jobs.map((one) => one.label || one.kind).join('、')),
          h(
            'button',
            { className: 'mini xs', type: 'button', onClick: () => setJob(state.jobs[0]) },
            '接上来看',
          ),
        )
      : null,

    error
      ? h(
          'div',
          { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12 } },
          h('div', { className: 'sec-title' }, '账本没取到'),
          h('p', { className: 'mut' }, error),
          h('button', { className: 'btn ghost', type: 'button', onClick: reload }, '重试'),
        )
      : null,

    h(
      'div',
      { className: 'fx-grid' },
      h(FactoryWords, {
        rows: rowsShown,
        selected,
        filter,
        sortMode,
        onFilter: setFilter,
        onSort: setSortMode,
        onSelect: (id) => {
          setSelected(id)
          setOpenOrd(null)
          setCheck(null)
          setConfirmDelete(false)
        },
      }),

      h(
        'section',
        { className: 'fx-main' },

        detail.status === 'idle'
          ? h(
              'div',
              { style: { display: 'grid', gap: 8 } },
              h('div', { className: 'fx-wordhd' }, h('h2', null, '还没挑包')),
              h('p', { className: 'mut' }, rows.length ? '左边点一个包，这里就会摊开它的例句和素材。' : '账本里还没有包。在上面写一个词，点「造料」—— 第一个包不用你配任何东西。'),
            )
          : null,

        detail.status === 'loading'
          ? h(
              'div',
              { style: { display: 'grid', gap: 8 } },
              h('div', { className: 'fx-wordhd' }, h('h2', null, '取包里…')),
              h('p', { className: 'mut' }, '正在从账本把这个包的例句和素材取回来。'),
            )
          : null,

        detail.status === 'error'
          ? h(
              'div',
              { className: 'card', style: { padding: '18px 20px', display: 'grid', gap: 10 } },
              h('div', { className: 'sec-title' }, '这个包取不到'),
              h('p', { className: 'mut' }, detail.error),
              h('button', { className: 'btn ghost', type: 'button', onClick: () => refreshPack() }, '再试一次'),
            )
          : null,

        detail.status === 'ready' && pack
          ? h(
              'div',
              { style: { display: 'contents' } },
              h(
                'div',
                { className: 'fx-wordhd' },
                h('h2', null, pack.target || '(未命名)'),
                pack.ipa ? h('span', { className: 'mut opt' }, '[' + pack.ipa + ']') : null,
                h('span', { className: 'chip' }, FX_kindText(pack.kind)),
                h('span', { className: 'chip' }, FX_statusText(pack.status)),
                h('span', { className: 'sp' }),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: doCheck }, busy === 'check' ? '在查…' : '校验'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: () => startJob('pack.pack', { id: pack.id }, 'pack', '开始打包（缺图或没试听过的会被挡住）。') }, '打包'),
                h('button', { className: 'mini go', type: 'button', disabled: Boolean(busy), onClick: () => startJob('pack.export', { id: pack.id }, 'export', '开始导出成品包。') }, '导出'),
                h('button', { className: 'mini xs', type: 'button', disabled: Boolean(busy) || !(pack.status === 'packed' || pack.status === 'exported'), onClick: doReopen, title: '把已打包的包退回素材阶段接着改' }, '打回'),
              ),

              h(
                'div',
                { className: 'fx-info' },
                h('span', null, h('b', null, String(pack.progress?.total ?? examples.length)), '条例句'),
                h('span', null, h('b', null, String(pack.progress?.images ?? 0)), '条有图'),
                h('span', null, h('b', null, String(pack.progress?.audios ?? 0)), '条听过了'),
                h('span', null, h('b', null, String(pack.examples?.length ? pack.examples.filter((one) => one.imageCandidates?.length).length : 0)), '条备了候选'),
                h('span', { className: 'sub' }, pack.pack?.dir ? '包目录：' + pack.pack.dir : '还没打包'),
                pack.export?.dir ? h('span', { className: 'sub' }, '导出去过：' + pack.export.dir) : null,
              ),

              check
                ? h(
                    'div',
                    { className: 'fx-bill', style: FX_blockStyle() },
                    h(
                      'div',
                      { className: 'fx-bh' },
                      h('b', null, '校验'),
                      h('span', { className: 'chip' }, check.status === 'ready' ? (verdict && (verdict.errors || []).length === 0 ? '过得去' : '过不去') : '没查成'),
                      h('span', { className: 'sp' }),
                      h('button', { className: 'mini xs', type: 'button', onClick: () => setCheck(null) }, '收起'),
                    ),
                    check.status === 'error'
                      ? h('p', { className: 'note mut' }, check.message)
                      : h(
                          'ul',
                          { style: FX_logStyle() },
                          (verdict?.errors || [])
                            .slice(0, 5)
                            .map((one, index) => h('li', { key: 'e' + index }, '错：' + (one.message || one)))
                            .concat(
                              (verdict?.warnings || [])
                                .slice(0, 3)
                                .map((one, index) => h('li', { key: 'w' + index }, '提醒：' + (one.message || one))),
                            ),
                        ),
                    check.status === 'ready' && !verdict
                      ? h('p', { className: 'note mut' }, '宿主没给 verdict，只有清单。')
                      : null,
                  )
                : null,

              h(
                'div',
                { className: 'fx-tools' },
                h('input', {
                  className: 'inp sm',
                  type: 'search',
                  value: sentenceFilter,
                  placeholder: '筛句子…',
                  onChange: (event) => setSentenceFilter(event.target.value),
                }),
                h('button', { className: 'mini' + (seg === 'all' ? ' on' : ''), type: 'button', onClick: () => setSeg('all') }, '全部'),
                h('button', { className: 'mini' + (seg === 'noimg' ? ' on' : ''), type: 'button', onClick: () => setSeg('noimg') }, '缺图'),
                h('button', { className: 'mini' + (seg === 'noaudio' ? ' on' : ''), type: 'button', onClick: () => setSeg('noaudio') }, '缺声'),
                h('span', { className: 'sp' }),
                h('span', { className: 'mtag' }, filtered.length + ' 条'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: acts.pickCandidatesAll }, '批量找图'),
                h('button', { className: 'mini', type: 'button', disabled: Boolean(busy), onClick: acts.synthesizeAll }, '批量造声'),
                h(
                  'button',
                  {
                    className: 'btn sm primary',
                    type: 'button',
                    disabled: Boolean(busy),
                    onClick: () => startJob('pack.pack', { id: pack.id }, 'pack', '开始打包。缺图、没试听过的会被挡住，这是故意的。'),
                  },
                  '批量出厂',
                ),
              ),

              h(
                'div',
                { className: 'fx-list' },
                h(FactorySense, {
                  rpc,
                  pack,
                  examples: filtered,
                  openOrd,
                  onOpen: setOpenOrd,
                  voices,
                  busy,
                  acts,
                }),
              ),

              h(
                'p',
                { className: 'fx-foot' },
                '这些是绕不过去的：每条都要有图、每张图都要你点过头、每条语音都要听到六成才算听过 —— 三条差一条，打包就会挡住并告诉你差第几条。删包的按钮在右边：',
                ' ',
                confirmDelete
                  ? h(
                      'button',
                      { className: 'mini xs danger', type: 'button', disabled: Boolean(busy), onClick: doDelete },
                      '真的删（磁盘上导出过的那份不动）',
                    )
                  : h(
                      'button',
                      { className: 'mini xs danger', type: 'button', onClick: () => setConfirmDelete(true), title: '删之前要再点一次' },
                      '删掉这个包',
                    ),
                confirmDelete
                  ? h(
                      'button',
                      { className: 'mini xs', type: 'button', onClick: () => setConfirmDelete(false) },
                      '算了',
                    )
                  : null,
                h('br'),
                '导出目录：' + (state?.exportDir || '宿主没给') + '。',
              ),
            )
          : null,
      ),
    ),
  )
}
