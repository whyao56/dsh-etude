/* 45 · 学习页：拿一个包的一条例句，分五个面（听 / 说 / 读 / 写 / 改）练它
   结构照 design/gen.mjs:2849-2973 —— 顶上五个面、中间七块抽屉、右边解释栏、底下四个评分键，
   类名一律用 design/app.css 里已经有的（没加一个新类）。

   跟设计稿不一样的地方，全是插件现在真没有的能力，所以换成实话而不是画假：
   · 说面要录音 —— 插件取不到麦克风，账本里也没有存录音的字段，那个按钮只能禁着，
     并且因此「说」这一面永远算不出完成度，就老实写「还没开始」；
   · 写面打出来的字不落账本，只存在于这一页的 state 里，换一张就没了；
   · 评分键没有调度引擎（账本里没有 due / interval / ease 这些字段），点了只在本页记一次，
     不排「几天后再见」，也不上报；
   · 设计稿的动图/视频链接、「英文」小窗浮层没有对应数据，换成真实的图片署名行和页内开关；
   · 五面的完成状态全部从 pack.get 回来的字段算，算不出来就是「还没开始」。

   这个分片只定义组件，不注册插槽 —— 挂到哪一页由 90-app.js 决定。 */

/** 五个面：名字、设计稿里那句提示（2884 行）、这一面默认摊开 / 点亮的抽屉 */
function STUDY_faces() {
  return [
    { id: 'listen', label: '听', hint: '声音 → 画面', open: ['audio', 'rec'], lit: ['audio', 'rec'] },
    { id: 'speak', label: '说', hint: '画面 → 声音', open: ['media', 'rec'], lit: ['media', 'rec'] },
    { id: 'read', label: '读', hint: '句子 → 画面', open: ['sent'], lit: ['sent', 'bg'] },
    { id: 'write', label: '写', hint: '画面 → 拼写', open: ['media', 'type'], lit: ['media', 'type', 'bg'] },
    { id: 'vary', label: '改', hint: '换一个说法', open: ['sent', 'vary'], lit: ['sent', 'media', 'bg'] },
  ]
}

/** 七块抽屉：key 就是设计稿的 data-drw，标题与副标题照 2880-2935 行 */
function STUDY_drawers() {
  return [
    { key: 'bg', title: '背景', mut: '这句话在什么场合说、谁在说、说完会怎样' },
    { key: 'media', title: '图 · 资源', mut: '一张挑过的照片，加它的出处' },
    { key: 'sent', title: '句子', mut: '练的那一句本身' },
    { key: 'audio', title: '声音', mut: '母语者念的这一个句子' },
    { key: 'rec', title: '录音', mut: '按住说一遍，松手结束' },
    { key: 'type', title: '打字', mut: '看着场面把句子写出来' },
    { key: 'vary', title: '换一个说法', mut: '同一个场面，换掉中间那个词' },
  ]
}

/** 挑一个包：能出厂的优先（例句、图、语音都齐了才 learnable），其次没失败的，最后随便一个 */
function STUDY_pickPack(packs) {
  const list = Array.isArray(packs) ? packs : []
  if (!list.length) return null
  return (
    list.find((one) => one && one.learnable) ||
    list.find((one) => one && one.status !== 'failed') ||
    list[0]
  )
}

function STUDY_has(list, value) {
  return Array.isArray(list) && list.indexOf(value) >= 0
}

/** 秒数：账本里 audio.seconds 是 3.288 这种小数，别直接怼给用户看 */
function STUDY_secs(seconds) {
  const value = Number(seconds)
  if (!isFinite(value) || value <= 0) return ''
  if (value >= 60) return Math.round(value / 60) + ' 分钟'
  return (Math.round(value * 10) / 10).toFixed(1) + 's'
}

function STUDY_words(sentence) {
  const text = typeof sentence === 'string' ? sentence.trim() : ''
  if (!text) return 0
  return text.split(/\s+/).length
}

/** 句子里把 target 原词包成 <b class="tgt">；找不到就原样返回，不硬凑高亮 */
function STUDY_sentenceParts(sentence, target) {
  const text = typeof sentence === 'string' ? sentence : ''
  const word = typeof target === 'string' ? target.trim() : ''
  if (!text) return []
  if (!word) return [text]
  const at = text.toLowerCase().indexOf(word.toLowerCase())
  if (at < 0) return [text]
  return [
    text.slice(0, at),
    h('b', { className: 'tgt', key: 'tgt' }, text.slice(at, at + word.length)),
    text.slice(at + word.length),
  ]
}

/** 「换一个说法」的全部材料：pack.swaps 是唯一的英文替换候选，zhVariants 是中文说法 */
function STUDY_varyRows(pack, example) {
  const swaps = Array.isArray(pack && pack.swaps) ? pack.swaps : []
  const roles = []
  swaps.forEach((swap) => {
    const candidates = Array.isArray(swap && swap.candidates)
      ? swap.candidates.filter((one) => typeof one === 'string' && one.trim())
      : []
    if (!candidates.length) return
    roles.push({
      role: typeof swap.role === 'string' ? swap.role.trim() : '',
      original: (typeof swap.original === 'string' && swap.original.trim()) || (pack && pack.target) || '',
      candidates,
    })
  })
  const zh = Array.isArray(example && example.zhVariants)
    ? example.zhVariants.filter((one) => typeof one === 'string' && one.trim())
    : []
  const total = roles.reduce((sum, one) => sum + one.candidates.length, 0)
  return { roles, zh, total }
}

/** 背景那几条：只用账本里真有的字段，缺哪条就不出哪条 */
function STUDY_bgRows(pack, example, showEn, showZh) {
  const rows = []
  if (!example) return rows
  if (showZh && example.sceneZh) rows.push(['场面（中）', example.sceneZh])
  if (showEn && example.sceneEn) rows.push(['场面（英）', example.sceneEn])
  if (example.register) rows.push(['语域', example.register])
  if (example.voiceHint) rows.push(['念的时候', example.voiceHint])
  if (pack && pack.gloss) rows.push(['释义', pack.gloss])
  if (pack && pack.ipa) rows.push(['音标', pack.ipa])
  return rows
}

/** 打字对一下原文：只比字母数字，标点大小写不算错。不判分，只给一句话 */
function STUDY_typedVerdict(typed, sentence) {
  const got = String(typed || '')
  if (!got.trim()) return ''
  const clean = (one) =>
    String(one || '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const want = clean(sentence)
  if (!want) return got.trim() === String(sentence || '').trim() ? '一样' : '还不一样'
  return clean(got) === want ? '一样' : '还不一样'
}

/** 换说法后的那一行：<s>原词</s> <b>新词</b>，原词拼不进句子就直说 */
function STUDY_swappedParts(sentence, picked) {
  const text = typeof sentence === 'string' ? sentence : ''
  if (!picked) return [text || '（这一条还没有句子）']
  const original = picked.original || ''
  const at = original ? text.toLowerCase().indexOf(original.toLowerCase()) : -1
  if (at < 0) {
    return [
      h('s', { key: 'old' }, original),
      ' ',
      h('b', { key: 'new' }, picked.candidate),
      ' —— 账本里这句没有这个词，拼不回整句，先把替换对摆在这儿。',
    ]
  }
  return [
    text.slice(0, at),
    h('s', { key: 'old' }, text.slice(at, at + original.length)),
    ' ',
    h('b', { key: 'new' }, picked.candidate),
    text.slice(at + original.length),
  ]
}

/** 五面的「有没有」：全部从账本字段算，算不出来就是「还没开始」 —— 一个数都不编 */
function STUDY_faceState(pack, example, typedText) {
  const audio = example && example.audio && example.audio.file ? example.audio : null
  const image = example && example.image && example.image.file ? example.image : null
  const vary = STUDY_varyRows(pack, example)
  const listen = Boolean(audio)
  const read = Boolean(image)
  const write = Boolean(typedText && String(typedText).trim())
  return {
    // 听：账本里这条有 audio.file（顺带把秒数说出来，那是真数据）
    listen: { ok: listen, text: listen ? (STUDY_secs(audio.seconds) ? '有语音 ' + STUDY_secs(audio.seconds) : '有语音') : '还没开始' },
    // 说：要用户录音。插件没有录音能力，账本里也没有这个字段 —— 永远「还没开始」
    speak: { ok: false, text: '还没开始' },
    // 读：账本里这条有 image.file
    read: { ok: read, text: read ? '有配图' : '还没开始' },
    // 写：这一页里真的打过字（只在本页记着，不落账本）
    write: { ok: write, text: write ? '写过一遍' : '还没开始' },
    // 改：有英文替换候选（pack.swaps）或中文说法（zhVariants）
    vary: {
      ok: vary.total > 0 || vary.zh.length > 0,
      text: vary.total ? vary.total + ' 个换法' : vary.zh.length ? vary.zh.length + ' 种中文说法' : '还没开始',
    },
  }
}

/** 抽屉里的「这块是空的」：一句人话，不装忙 */
function STUDY_note(text, key) {
  return h('p', { className: 'mut', key: key || undefined, style: { margin: 0 } }, text)
}

/** 一张说清楚的卡片：标题 + 一句人话 + 至多一个按钮 */
function STUDY_card(title, text, actionLabel, onAction) {
  const children = [h('div', { className: 'sec-title', key: 't' }, title)]
  if (text) children.push(h('p', { className: 'mut', key: 'm' }, text))
  if (actionLabel) {
    children.push(
      h(
        'button',
        { key: 'b', className: 'btn ghost', type: 'button', disabled: !onAction, onClick: onAction || undefined },
        actionLabel,
      ),
    )
  }
  return h('div', { className: 'card', style: { padding: '20px 24px', display: 'grid', gap: 12, maxWidth: 680 } }, children)
}

/** 一个面：上面是名字，下面 <i> 里是设计稿那句提示 + 这一面真实的状态 */
function StudyFace(props) {
  const classes = ['fb']
  if (props.active) classes.push('on')
  if (props.status && props.status.ok) classes.push('done')
  return h(
    'button',
    {
      className: classes.join(' '),
      type: 'button',
      'data-face': props.face.id,
      'aria-pressed': props.active ? 'true' : 'false',
      onClick: () => props.onPick(props.face.id),
    },
    props.face.label,
    h('i', null, props.face.hint + ' · ' + (props.status ? props.status.text : '还没开始')),
  )
}

/** 一块抽屉：结构照 design/study.html:127-129 —— .drw > button.drw-h + div.drw-b > div.drw-p */
function StudyDrawer(props) {
  const classes = ['drw']
  if (props.open) classes.push('open')
  if (props.lit) classes.push('lit')
  if (props.off) classes.push('off')
  return h(
    'div',
    { className: classes.join(' '), 'data-drw': props.def.key },
    h(
      'button',
      {
        className: 'drw-h',
        type: 'button',
        'data-drw': props.def.key,
        'aria-expanded': props.open ? 'true' : 'false',
        onClick: () => props.onToggle(props.def.key),
      },
      h('b', null, props.def.title),
      h('span', { className: 'mut' }, props.def.mut),
      h('span', { className: 'sp' }),
      h('span', { className: 'car' }, '▾'),
    ),
    h('div', { className: 'drw-b' }, h('div', { className: 'drw-p' }, props.children)),
  )
}

function StudyPage(props) {
  const own = useFactory(props.rpc || props.getRpc || null)
  const given = props.state !== undefined && props.state !== null
  const state = given ? props.state : own.state
  const failure = given ? props.error || null : own.error
  const reload = props.onReload || own.reload
  // rpc 塞进 ref：换一页的时候不该因为它是不是新函数而重新取一遍
  const rpcRef = useRef(props.rpc || props.getRpc || null)
  rpcRef.current = props.rpc || props.getRpc || null

  const onGoCards = props.onGo
    ? () => props.onGo('cards')
    : null

  const packs = Array.isArray(state && state.packs) ? state.packs : []
  const loading = Boolean(state && state.status === 'loading')
  const auto = STUDY_pickPack(packs)

  const [pickedId, setPickedId] = useState(null)
  const picked = pickedId ? packs.find((one) => one && one.id === pickedId) || null : null
  const chosen = picked || auto
  const chosenId = chosen && chosen.id ? chosen.id : null

  // 列表里的 pack 只有 progress，没有 examples —— 句子、图、语音都得再问一次 pack.get
  const [detail, setDetail] = useState({ id: null, status: 'idle', pack: null, error: null })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!chosenId) {
      setDetail({ id: null, status: 'idle', pack: null, error: null })
      return undefined
    }
    let alive = true
    setDetail({ id: chosenId, status: 'loading', pack: null, error: null })
    callRpc(rpcRef.current, 'pack.get', { id: chosenId })
      .then((value) => {
        if (!alive) return
        setDetail({ id: chosenId, status: 'ready', pack: value, error: null })
      })
      .catch((why) => {
        if (!alive) return
        setDetail({ id: chosenId, status: 'error', pack: null, error: (why && why.message) || '这一包没取过来' })
      })
    return () => {
      alive = false
    }
  }, [chosenId, retry])

  const pack = detail.pack && detail.pack.id === chosenId ? detail.pack : chosen
  const examples = Array.isArray(pack && pack.examples) ? pack.examples : []
  const [exIdx, setExIdx] = useState(0)
  const index = examples.length ? Math.max(0, Math.min(exIdx, examples.length - 1)) : 0
  const example = examples[index] || null

  const [face, setFace] = useState('read')
  const [toggled, setToggled] = useState({})
  const [typed, setTyped] = useState({})
  const [marks, setMarks] = useState({})
  const [pickedSwap, setPickedSwap] = useState(null)
  const [showEn, setShowEn] = useState(true)
  const [showZh, setShowZh] = useState(true)
  const [imgStage, setImgStage] = useState(0)
  const [audioBroken, setAudioBroken] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const audioRef = useRef(null)

  const stamp = chosenId && example ? chosenId + ':' + example.ord : ''
  // 换一条句子，播放/取图/换词这些一次性的东西全部归零
  useEffect(() => {
    setImgStage(0)
    setAudioBroken(false)
    setPlaying(false)
    setElapsed(0)
  }, [stamp])

  const faces = STUDY_faces()
  const drawers = STUDY_drawers()
  const active = faces.find((one) => one.id === face) || faces[0]
  const recordKey = stamp
  const typedText = recordKey ? typed[recordKey] || '' : ''
  const faceState = STUDY_faceState(pack, example, typedText)
  const vary = STUDY_varyRows(pack, example)
  const bgRows = STUDY_bgRows(pack, example, showEn, showZh)
  const mark = recordKey ? marks[recordKey] || null : null
  const packIndex = packs.findIndex((one) => one && one.id === chosenId)
  const grades = [
    { id: 'again', label: '重来' },
    { id: 'hard', label: '困难' },
    { id: 'good', label: '良好' },
    { id: 'easy', label: '简单' },
  ]

  function isOpen(key) {
    return toggled[key] === undefined ? STUDY_has(active.open, key) : Boolean(toggled[key])
  }

  function isLit(key) {
    return STUDY_has(active.lit, key)
  }

  function encouraged(key) {
    return isOpen(key) || isLit(key)
  }

  function toggleDrawer(key) {
    setToggled((prev) => {
      const now = prev[key] === undefined ? STUDY_has(active.open, key) : Boolean(prev[key])
      const next = { ...prev }
      next[key] = !now
      return next
    })
  }

  function openAll(value) {
    const next = {}
    drawers.forEach((one) => {
      next[one.key] = value
    })
    setToggled(next)
  }

  function stepExample(delta) {
    if (!examples.length) return
    setExIdx(Math.max(0, Math.min(index + delta, examples.length - 1)))
  }

  function stepPack(delta) {
    if (!packs.length || packIndex < 0) return
    const to = packIndex + delta
    if (to < 0 || to >= packs.length) return
    setPickedId(packs[to].id)
    setExIdx(0)
    setPickedSwap(null)
  }

  function stepFace(delta) {
    const list = STUDY_faces()
    const at = list.findIndex((one) => one.id === face)
    const to = ((at < 0 ? 0 : at) + delta + list.length) % list.length
    setFace(list[to].id)
  }

  function rate(gradeId) {
    if (!recordKey) return
    setMarks((prev) => {
      const before = prev[recordKey]
      const times = before && before.grade === gradeId ? before.times + 1 : 1
      const next = { ...prev }
      next[recordKey] = { grade: gradeId, times }
      return next
    })
  }

  function play() {
    const node = audioRef.current
    if (!node || typeof node.play !== 'function') {
      setAudioBroken(true)
      return
    }
    if (playing) {
      try {
        node.pause()
      } catch (ignored) {}
      setPlaying(false)
      return
    }
    setElapsed(0)
    let started = null
    try {
      started = node.play()
    } catch (ignored) {
      setAudioBroken(true)
      return
    }
    setPlaying(true)
    if (started && typeof started.catch === 'function') {
      started.catch(() => {
        setPlaying(false)
        setAudioBroken(true)
      })
    }
  }

  function replay() {
    const node = audioRef.current
    if (!node) return
    setElapsed(0)
    if (typeof node.play !== 'function') {
      setAudioBroken(true)
      return
    }
    try {
      node.currentTime = 0
      const started = node.play()
      setPlaying(true)
      if (started && typeof started.catch === 'function') {
        started.catch(() => {
          setPlaying(false)
          setAudioBroken(true)
        })
      }
    } catch (ignored) {
      setAudioBroken(true)
    }
  }

  // 1-4 评分、左右换面 —— 这两样是真做了的，所以底下那行键盘提示才敢写
  useEffect(() => {
    if (typeof window === 'undefined' || !window || typeof window.addEventListener !== 'function') return undefined
    function onKey(event) {
      const node = event.target
      const tag = node && node.tagName ? String(node.tagName).toUpperCase() : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (node && node.isContentEditable)) return
      const key = event.key || ''
      const order = ['again', 'hard', 'good', 'easy']
      if (key >= '1' && key <= '4') {
        if (event.preventDefault) event.preventDefault()
        rate(order[Number(key) - 1])
        return
      }
      if (key === 'ArrowLeft') {
        if (event.preventDefault) event.preventDefault()
        stepFace(-1)
        return
      }
      if (key === 'ArrowRight') {
        if (event.preventDefault) event.preventDefault()
        stepFace(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** 每一块抽屉里的东西：没有就写清楚没有，不拿设计稿的假数据顶 */
  function drawerBody(key) {
    if (key === 'bg') {
      if (!bgRows.length) return STUDY_note('这个包没记场面：中文场景、英文场景、语域、念法提示都是空的。')
      return h(
        'ul',
        { className: 'dlist' },
        bgRows.map((row, at) => h('li', { key: at }, h('b', null, row[0]), row[1])),
      )
    }

    if (key === 'media') {
      const image = example && example.image && example.image.file ? example.image : null
      if (!image) return STUDY_note('这一条还没有配图 —— 账本里 image 是空的。去卡片页给它挑一张候选图，挑完这里就有了。')
      const out = []
      if (imgStage < 2) {
        const src =
          imgStage === 0
            ? '/etude/media/images/' + encodeURIComponent(image.file)
            : '/etude/pack/' + encodeURIComponent((pack && pack.id) || '') + '/images/' + encodeURIComponent(image.file)
        out.push(
          h(
            'figure',
            { className: 'shot', key: 'shot' },
            h('img', {
              src,
              alt: (example && example.sentence) || '这一句的场面',
              onError: () => setImgStage((stage) => stage + 1),
            }),
            h('span', { className: 'giftag' }, '静图'),
          ),
        )
      } else {
        out.push(
          STUDY_note('图在磁盘上，但这边的两条媒体路由都取不到它（/etude/media/images 和 /etude/pack/<id>/images 都空了）。', 'noimg'),
        )
      }
      const credit = image.creditUrl || image.licenseUrl || ''
      const who = [image.author, image.license].filter(Boolean).join(' · ')
      if (credit || who) {
        out.push(
          h(
            'ul',
            { className: 'rlink', key: 'rlink' },
            h(
              'li',
              null,
              h('span', { className: 'rt post' }, '出处'),
              credit ? h('a', { href: credit, target: '_blank', rel: 'noreferrer' }, who || credit) : h('span', { className: 'mut' }, who),
            ),
          ),
        )
      }
      out.push(
        h(
          'p',
          { className: 'tnote', key: 'meta' },
          [image.width && image.height ? image.width + '×' + image.height : '', image.source || '', image.file]
            .filter(Boolean)
            .join(' · '),
        ),
      )
      return out
    }

    if (key === 'sent') {
      if (!example || !example.sentence) return STUDY_note('这一条还没有句子。')
      const out = [h('p', { className: 'big', key: 'big' }, STUDY_sentenceParts(example.sentence, pack && pack.target))]
      out.push(h('p', { className: 'tnote', key: 'meta' }, STUDY_words(example.sentence) + ' 词 · 第 ' + example.ord + ' 条'))
      return out
    }

    if (key === 'audio') {
      const audio = example && example.audio && example.audio.file ? example.audio : null
      if (!audio) return STUDY_note('这一条还没有语音 —— 账本里 audio 是空的。')
      const ratio = audio.seconds > 0 ? Math.min(1, elapsed / audio.seconds) : 0
      const bars = []
      for (let at = 0; at < 20; at += 1) {
        bars.push(h('i', { key: at, className: (at + 1) / 20 <= ratio ? 'on' : undefined }))
      }
      const out = [
        h(
          'div',
          { className: 'arow', key: 'row' },
          h(
            'button',
            { className: 'pp', type: 'button', 'aria-label': playing ? '暂停' : '播放', onClick: play },
            h('span', null, playing ? '❚❚' : '▶'),
          ),
          h('div', { className: 'wave' }, bars),
          h('span', { className: 'dur' }, STUDY_secs(audio.seconds) || '?'),
          h('button', { className: 'mini', type: 'button', onClick: replay }, '再放一遍'),
        ),
        h('audio', {
          key: 'el',
          ref: audioRef,
          src: '/etude/media/audio/' + encodeURIComponent(audio.file),
          preload: 'none',
          style: { display: 'none' },
          onTimeUpdate: (event) => setElapsed((event.currentTarget && event.currentTarget.currentTime) || 0),
          onEnded: () => {
            setPlaying(false)
            setElapsed(0)
          },
          onError: () => setAudioBroken(true),
        }),
        h(
          'p',
          { className: 'tnote', key: 'meta' },
          [audio.engine, audio.voice, audio.rate, audio.file].filter(Boolean).join(' · '),
        ),
      ]
      if (audioBroken) {
        out.push(
          STUDY_note(
            '这条音频放不出来：要么文件不在 /etude/media/audio 下，要么名字不合那条路由的规矩（得是「字母-20 位十六进制.mp3」）。上面那行是账本里记的元数据。',
            'broken',
          ),
        )
      }
      return out
    }

    if (key === 'rec') {
      return h(
        'div',
        { className: 'arow' },
        h(
          'button',
          {
            className: 'mic',
            type: 'button',
            disabled: true,
            'aria-label': '按住说话（还没接）',
            title: '插件现在取不到麦克风，也没有存录音的地方',
          },
          h('span', null, '●'),
        ),
        h(
          'div',
          { className: 'rechint' },
          h('b', null, '录音还没接'),
          h('span', { className: 'mut' }, '插件既没有取麦克风的能力，账本里也没有存录音的字段 —— 这一面现在练不了，所以「说」那一条永远显示「还没开始」。'),
        ),
      )
    }

    if (key === 'type') {
      const verdict = STUDY_typedVerdict(typedText, example && example.sentence)
      return [
        h('input', {
          key: 'tin',
          className: 'tin',
          value: typedText,
          placeholder: '听到/看到这个场面，句子是什么？',
          autoComplete: 'off',
          spellCheck: false,
          onChange: (event) => {
            const value = event.target.value
            if (!recordKey) return
            setTyped((prev) => {
              const next = { ...prev }
              next[recordKey] = value
              return next
            })
          },
        }),
        h(
          'span',
          { className: 'tnote', key: 'note' },
          verdict === '一样' ? '和账本里那句一样。' : verdict ? '和账本里那句还不太一样（可能只是标点或大小写）。' : '写不写都行',
          h('span', { className: 'fold' }, '打出来的字只留在这一页：不上报、不打分，换一张就没了。'),
        ),
      ]
    }

    if (key === 'vary') {
      const out = []
      if (vary.roles.length) {
        vary.roles.forEach((one, at) => {
          out.push(
            h('p', { className: 'mut', key: 'lb' + at, style: { margin: '0 0 6px' } }, one.role ? one.role + ' · 把 ' + one.original + ' 换掉' : '把 ' + one.original + ' 换掉'),
          )
          out.push(
            h(
              'div',
              { className: 'chips', key: 'ch' + at },
              one.candidates.map((candidate) =>
                h(
                  'span',
                  {
                    key: candidate,
                    role: 'button',
                    tabIndex: 0,
                    className:
                      'chip' +
                      (pickedSwap && pickedSwap.candidate === candidate && pickedSwap.original === one.original ? ' on' : ''),
                    onClick: () => setPickedSwap({ original: one.original, candidate }),
                  },
                  candidate,
                ),
              ),
            ),
          )
        })
        out.push(h('p', { className: 'vw', key: 'vw' }, STUDY_swappedParts(example && example.sentence, pickedSwap)))
      } else {
        out.push(STUDY_note('这个包没有英文替换候选 —— 账本里 swaps 是空的。'), )
      }
      if (vary.zh.length) {
        out.push(h('p', { className: 'mut', key: 'zhlb', style: { margin: '10px 0 6px' } }, '这句的中文说法（zhVariants，不是英文换法）：'))
        out.push(
          h(
            'ul',
            { className: 'dlist', key: 'zhl' },
            vary.zh.map((line, at) => h('li', { key: at }, h('b', null, '说法 ' + (at + 1)), line)),
          ),
        )
      }
      return out
    }

    return STUDY_note('这一块没内容。')
  }

  const allOpen = drawers.every((one) => isOpen(one.key))
  const header = h(
    'header',
    { className: 'hdr' },
    h(
      'div',
      null,
      h(
        'div',
        { className: 'st-crumb' },
        h('a', { href: '#', onClick: (event) => { event.preventDefault(); if (onGoCards) onGoCards() } }, '卡片'),
        h('span', null, '/'),
        h('span', null, pack ? pack.target || '(未命名)' : '还没有包'),
        h('span', null, '/'),
        h('span', null, examples.length ? '第 ' + (index + 1) + ' 条，共 ' + examples.length + ' 条' : '还没有例句'),
      ),
      h(
        'h1',
        { className: 'st-idx' },
        h('span', { className: 'wd' }, pack ? pack.target || '(未命名)' : '学习'),
        h(
          'span',
          { className: 'mut st-where' },
          examples.length ? index + 1 + ' / ' + examples.length + ' 条 · 这一面：' + active.label : '这个包还没有例句',
        ),
      ),
    ),
    h(
      'div',
      { className: 'act' },
      h('button', { className: 'btn ghost', type: 'button', disabled: true, title: '编辑面板还没做：这一版只能看，不能改包里的东西' }, '编辑'),
      h('button', { className: 'btn ghost', type: 'button', disabled: true, title: '这一页不排队，关掉就是暂停 —— 没有「暂停」这个动作' }, '暂停'),
      h('button', { className: 'btn ghost', type: 'button', disabled: !onGoCards, onClick: onGoCards || undefined }, '退出'),
    ),
  )

  // 四种「还练不了」的状态：加载中 / 出错 / 没有包 / 这个包还没例句
  if (failure) {
    return h(Screen, { className: 'study' }, header, STUDY_card('没取到数据', failure, '重试', reload))
  }
  if (loading) {
    return h(Screen, { className: 'study' }, header, STUDY_card('正在取账本…', '宿主那边还没回话。最多等 15 秒，超时会在这儿说出来。'))
  }
  if (!packs.length) {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card(
        '账本里还没有包',
        '这一屏要一条例句才能练，现在一个包都没有。去卡片页输一个词，点「造一个包」—— 第一个包会用示例数据造，不用你配任何东西。',
        '去卡片页造一个包',
        onGoCards,
      ),
    )
  }
  if (detail.status === 'error') {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card('这一包没取过来', (detail.error || '') + '（pack.get ' + (chosenId || '') + '）', '再取一次', () => setRetry((n) => n + 1)),
    )
  }
  if (detail.status !== 'ready') {
    return h(Screen, { className: 'study' }, header, STUDY_card('正在把这一包取过来…', '列表里只有每包的进度，句子和图得再问一次 pack.get。'))
  }
  if (!example) {
    return h(
      Screen,
      { className: 'study' },
      header,
      STUDY_card(
        '这个包还没有例句',
        '账本里这个包的 examples 是空的' + (pack && pack.progress && pack.progress.total ? '（progress.total 是 ' + pack.progress.total + '，对不上）' : '') + '。回卡片页让它先造几句，再回来练。',
        '去卡片页',
        onGoCards,
      ),
    )
  }

  const faceBar = h(
    'div',
    { className: 'fbar', id: 'fbar' },
    faces.map((one) =>
      h(StudyFace, {
        key: one.id,
        face: one,
        status: faceState[one.id],
        active: one.id === active.id,
        onPick: setFace,
      }),
    ),
    h('span', { className: 'sp' }),
  )

  const stage = h(
    'section',
    { className: 'stage2', id: 'stage' },
    drawers.map((def) =>
      h(
        StudyDrawer,
        {
          key: def.key,
          def,
          open: isOpen(def.key),
          lit: isLit(def.key),
          off: !encouraged(def.key),
          onToggle: toggleDrawer,
        },
        drawerBody(def.key),
      ),
    ),
  )

  const railRows = [
    { key: 'bg', label: '背景', num: bgRows.length ? bgRows.length + ' 条' : '没有' },
    {
      key: 'media',
      label: '图 · 资源',
      num: example.image && example.image.file ? (example.image.creditUrl || example.image.licenseUrl ? '1 图 1 出处' : '1 图') : '没有',
    },
    { key: 'sent', label: '句子', num: example.sentence ? STUDY_words(example.sentence) + ' 词' : '没有' },
    { key: 'audio', label: '声音', num: example.audio && example.audio.file ? STUDY_secs(example.audio.seconds) || '有' : '没有' },
    { key: 'rec', label: '录音', num: '没有' },
    { key: 'type', label: '打字', num: typedText ? '写过' : '还没写' },
    { key: 'vary', label: '换一个说法', num: vary.total ? vary.total + ' 个' : vary.zh.length ? vary.zh.length + ' 条中文' : '没有' },
  ]

  const rail = h(
    'aside',
    { className: 'drail' },
    h('div', { className: 'side-h' }, '解释'),
    h(
      'div',
      { className: 'exrow' },
      h(
        'button',
        { className: 'ex' + (showEn ? ' on' : ''), type: 'button', onClick: () => setShowEn((value) => !value) },
        h('span', null, '英文'),
        h('i', null, showEn ? '开' : '关'),
      ),
      h(
        'button',
        { className: 'ex' + (showZh ? ' on' : ''), type: 'button', onClick: () => setShowZh((value) => !value) },
        h('span', null, '中文'),
        h('i', null, showZh ? '开' : '关'),
      ),
    ),
    h('div', { className: 'side-h' }, '每一块都在这里'),
    railRows.map((row) =>
      h(
        'button',
        {
          key: row.key,
          className:
            'rv' + (isOpen(row.key) ? ' on' : '') + (isLit(row.key) ? ' lit' : '') + (encouraged(row.key) ? '' : ' dim'),
          type: 'button',
          onClick: () => toggleDrawer(row.key),
        },
        h('span', null, row.label),
        h('i', null, row.num),
      ),
    ),
    h('button', { className: 'mini allbtn', type: 'button', onClick: () => openAll(!allOpen) }, allOpen ? '全收起' : '全揭开'),
    h('p', { className: 'side-n fold' }, '点一下拉开，再点一下收起来。灰的是这一面不鼓励先看的，照样能拉。'),
  )

  const rateBar = h(
    'div',
    { className: 'st-rate' },
    grades.map((grade) => {
      const mine = mark && mark.grade === grade.id ? mark : null
      return h(
        'button',
        {
          key: grade.id,
          className: 'st-r',
          type: 'button',
          'aria-pressed': mine ? 'true' : 'false',
          style: mine ? { borderColor: 'var(--accent)' } : null,
          onClick: () => rate(grade.id),
        },
        h('b', null, grade.label),
        // 设计稿这里写的是「1 分钟 / 3 天 / 8 天 / 15 天」—— 没有调度引擎就没有这些数
        h('em', null, mine ? '本页 ' + mine.times + ' 次' : '未接调度'),
      )
    }),
  )

  const keysLine = h(
    'p',
    { className: 'st-keys' },
    h('span', { className: 'kbd' }, '1'),
    '–',
    h('span', { className: 'kbd' }, '4'),
    ' 评分 · ',
    h('span', { className: 'kbd' }, '←'),
    h('span', { className: 'kbd' }, '→'),
    ' 换面 · 四档现在只在这一页记一次，不排下次复习时间，也不写账本。',
  )

  const markLine = mark
    ? h(
        'p',
        { className: 'mut', style: { marginTop: 6 } },
        '这一条刚评的是「' +
          (grades.find((one) => one.id === mark.grade) || { label: mark.grade }).label +
          '」，本页第 ' +
          mark.times +
          ' 次。调度引擎还没接，所以没有「几天后再见」这回事，账本里也没写。',
      )
    : null

  const body = h(
    'div',
    { className: 'st2' },
    stage,
    rail,
  )

  return h(
    Screen,
    { className: 'study' },
    header,
    faceBar,
    body,
    h(
      'button',
      {
        className: 'wordnav prev',
        type: 'button',
        title: '上一个词（换一个包）',
        disabled: packIndex <= 0,
        onClick: () => stepPack(-1),
      },
      '‹',
    ),
    h(
      'button',
      {
        className: 'wordnav next',
        type: 'button',
        title: '下一个词（换一个包）',
        disabled: packIndex < 0 || packIndex >= packs.length - 1,
        onClick: () => stepPack(1),
      },
      '›',
    ),
    h(
      'button',
      { className: 'navstep prev', type: 'button', disabled: index <= 0, onClick: () => stepExample(-1) },
      '← 上一个',
    ),
    h(
      'button',
      {
        className: 'navstep next',
        type: 'button',
        disabled: index >= examples.length - 1,
        onClick: () => stepExample(1),
      },
      '下一个 →',
    ),
    rateBar,
    markLine,
    keysLine,
  )
}
