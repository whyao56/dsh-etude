/**
 * 70-settings.js — 面板的「设置」页。
 *
 * 这个文件只做一件事：把**插件真的有**的那些配置项摆出来，改一下真的写回去。
 *
 * ── 值存在哪儿 ───────────────────────────────────────────────────────────────
 * 插件自己的 RPC（lib/rpc.js）里**没有任何配置端点**，`state` 的返回里也没有
 * settings 字段 —— 这是刻意的：配置的真源是 loader 里那条插件配置，也就是
 * index.js 里 `export const Config = z.object({...})`。客户端要改它，只能走
 * 宿主给的 `configForms` 服务（index.js:36 那句注释就是留给这里看的）：
 *
 *   const form = ctx.get('configForms').get(CONFIG_NS)   // CONFIG_NS = 'etude'
 *   form.getSnapshot()          // { status, value, writable, revision }
 *   form.subscribe(fn)          // 值变了叫一声
 *   form.mutate([{ op: 'set', path: ['rate'], value: '+5%' }])   // 真的写
 *
 * DSH 老于 0.1.6 时没有 `configForms` —— 那就只读、不改，页面上直说「这一项
 * 现在只能改 loader 里的配置」，不假装能存。
 *
 * ── 怎么把它接到面板上（给下一个改 99-register.js 的人） ────────────────────
 *   1. `inject` 里加上 'configForms'（拿不到就算了，别把面板搞挂）；
 *   2. 取一份 form：`const form = SET_configForm(ctx)`；
 *   3. 渲染：`h(SettingsPage, { rpc: getRpc(), form: form, onBack: ... })`。
 * 顶部齿轮按钮（10-shell.js 的 Topbar）现在还没有 onClick，接上它就是入口。
 *
 * 分组只留真的有配置项的：语言 / 声音 / 造卡 / 接口 / 位置 / 自检 / 关于。
 * 设计稿里的外观、智能体、快捷键、以及数据那块的危险操作（清缓存、重置账本、
 * 迁移、导入导出）全套没有对应接口，一律不画空壳。
 */

// ── 配置项真值 ────────────────────────────────────────────────────────────────
//
// 逐项照抄 index.js 的 Config 默认值。宿主没给（空配置）时用它兜底，
// 免得界面上一排空白，让人以为坏了。

function SET_defaults() {
  return {
    dataDir: '',
    exportDir: '',
    language: 'en',
    examplesPerLesson: 8,
    zhVariants: 3,
    candidateLimit: 9,
    autoPrepareCandidates: true,
    pixelCheck: true,
    ttsEngine: 'auto',
    rate: '+10%',
    volume: '+10%',
    ttsVoiceEdge: 'en-US-AriaNeural',
    ttsBaseUrl: '',
    ttsApiKeyEnv: 'OPENAI_API_KEY',
    ttsModel: 'tts-1',
    ttsVoice: 'alloy',
    llmBaseUrl: '',
    llmModel: '',
    llmApiKeyEnv: 'OPENAI_API_KEY',
    proxyUrl: '',
  }
}

/** 分组导航。glab 是设计稿里那个灰色小标题。 */
function SET_glabs() {
  return [
    { label: '语言与声音', ids: ['lang', 'voice'] },
    { label: '造卡与接口', ids: ['make', 'api'] },
    { label: '这台机器', ids: ['place', 'health', 'about'] },
  ]
}

/** 一组的标题与副题。 */
function SET_meta(id) {
  const table = {
    lang: { title: '语言', note: '学什么、界面说什么' },
    voice: { title: '声音', note: '引擎、音色、快慢' },
    make: { title: '造卡', note: '一个包造多少、给几张候选图' },
    api: { title: '接口', note: '大模型 / TTS / 代理' },
    place: { title: '位置', note: '账本和成品放哪' },
    health: { title: '自检', note: '真跑一遍，看卡在哪' },
    about: { title: '关于', note: '版本，以及还没接的东西' },
  }
  return table[id] || { title: id, note: '' }
}

/** 读配置里的一个值，宿主是 0.1.6+ 时可能是 volatile 引用，要 .get()。 */
function SET_unwrap(value) {
  if (value && typeof value === 'object' && typeof value.get === 'function') {
    try {
      return value.get()
    } catch (error) {
      return undefined
    }
  }
  return value
}

function SET_value(snapshot, key, fallback) {
  const value = snapshot && snapshot.value
  if (!value || typeof value !== 'object') return fallback
  const one = SET_unwrap(value[key])
  if (one === undefined || one === null) return fallback
  return one
}

function SET_read(snapshot, key) {
  const defaults = SET_defaults()
  return SET_value(snapshot, key, defaults[key])
}

/** 写一条配置。没有 configForms 就明确拒绝，别静默成功。 */
function SET_patch(form, key, value) {
  if (!form || typeof form.mutate !== 'function') {
    return Promise.reject(
      new Error('宿主没给配置接口（configForms）。这一项现在只能去 loader 里的配置条目改。'),
    )
  }
  try {
    return Promise.resolve(form.mutate([{ op: 'set', path: [key], value: value }]))
  } catch (error) {
    return Promise.reject(error)
  }
}

/** 从 ctx 里安全地取 configForms 的 form。取不到返回 null。 */
function SET_configForm(ctx) {
  if (!ctx || typeof ctx.get !== 'function') return null
  let configForms = null
  try {
    configForms = ctx.get('configForms')
  } catch (error) {
    return null
  }
  if (!configForms || typeof configForms.get !== 'function') return null
  try {
    return configForms.get(CONFIG_NS) || null
  } catch (error) {
    return null
  }
}

function SET_snapshot(form) {
  if (!form || typeof form.getSnapshot !== 'function') {
    return { status: 'unavailable', value: undefined, error: '' }
  }
  try {
    const one = form.getSnapshot()
    return one && typeof one === 'object' ? one : { status: 'unavailable', value: undefined, error: '' }
  } catch (error) {
    return { status: 'error', value: undefined, error: (error && error.message) || String(error) }
  }
}

// ── 取数 ──────────────────────────────────────────────────────────────────────

/**
 * 配置快照。
 *
 * 没有 form 时不能当成「空配置」——那会让人以为值被清空了。所以状态是
 * unavailable，界面上单独说一句。
 */
function SET_useConfig(form) {
  const [snapshot, setSnapshot] = useState(function () {
    return SET_snapshot(form)
  })
  useEffect(
    function () {
      if (!form || typeof form.getSnapshot !== 'function') {
        setSnapshot({ status: 'unavailable', value: undefined, error: '' })
        return undefined
      }
      setSnapshot(SET_snapshot(form))
      if (typeof form.subscribe !== 'function') return undefined
      let stop = null
      try {
        stop = form.subscribe(function () {
          setSnapshot(SET_snapshot(form))
        })
      } catch (error) {
        return undefined
      }
      return function () {
        if (typeof stop === 'function') stop()
      }
    },
    [form],
  )
  return snapshot
}

/** state 端点：root / version / exportDir / packs / jobs / selfcheck。 */
function SET_useFacts(rpc) {
  const [facts, setFacts] = useState({ status: 'loading', value: null, error: '' })
  const load = useCallback(
    function () {
      setFacts(function (prev) {
        return { status: prev.value ? 'ready' : 'loading', value: prev.value, error: '' }
      })
      callRpc(rpc, 'state', {})
        .then(function (value) {
          setFacts({ status: 'ready', value: value || null, error: '' })
        })
        .catch(function (error) {
          setFacts({ status: 'error', value: null, error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      load()
    },
    [load],
  )
  return { facts: facts, reload: load }
}

/** Edge 音色表（voice.list）。进声音那一组才去取，离线也别把人卡住。 */
function SET_useVoices(rpc, active) {
  const [voices, setVoices] = useState({ status: 'idle', list: [], error: '' })
  const load = useCallback(
    function () {
      setVoices({ status: 'loading', list: [], error: '' })
      callRpc(rpc, 'voice.list', { timeoutMs: 12000 })
        .then(function (value) {
          const list = value && Array.isArray(value.voices) ? value.voices : []
          setVoices({ status: 'ready', list: list, error: '' })
        })
        .catch(function (error) {
          setVoices({ status: 'error', list: [], error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      if (active && voices.status === 'idle') load()
    },
    [active, voices.status, load],
  )
  return { voices: voices, reload: load }
}

/** 自检（selfcheck）：node / sharp / ws / fetch / network / llm。 */
function SET_useCheck(rpc, active) {
  const [check, setCheck] = useState({ status: 'idle', value: null, error: '' })
  const load = useCallback(
    function () {
      setCheck({ status: 'loading', value: null, error: '' })
      callRpc(rpc, 'selfcheck', {})
        .then(function (value) {
          setCheck({ status: 'ready', value: value || null, error: '' })
        })
        .catch(function (error) {
          setCheck({ status: 'error', value: null, error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )
  useEffect(
    function () {
      if (active && check.status === 'idle') load()
    },
    [active, check.status, load],
  )
  return { check: check, reload: load }
}

// ── 试听 ──────────────────────────────────────────────────────────────────────
//
// 走的是真链路：sample.audio 开一个任务 → job.get 等它 → image.bytes 取字节。
// 为什么不把 `/etude/media/audio/xxx.mp3` 直接塞进 <audio src>：宿主 web 服务
// 整站要鉴权，子资源请求带不上凭据，最后就是一个不响的播放器（这是上一版踩过
// 的坑，10-shell / 旧客户端的注释里写着）。

function SET_trialText() {
  return 'Actually, I already told him the whole story.'
}

function SET_jobError(job) {
  if (!job) return '任务不见了。'
  if (job.status === 'cancelled') return '合成被取消了。'
  if (job.error) return '合成失败：' + job.error
  return '合成没成功（' + (job.status || '不知道什么状态') + '）。'
}

/** 等一个任务跑完。超时两分钟，不无限等。 */
function SET_waitJob(rpc, job) {
  const first = job && job.id ? job : null
  if (!first) return Promise.reject(new Error('宿主没给任务 id，合成没跑起来。'))
  if (first.status && first.status !== 'running') return Promise.resolve(first)
  let tries = 0
  function step() {
    return callRpc(rpc, 'job.get', { id: first.id }).then(function (now) {
      if (!now || !now.status) throw new Error('任务不见了。')
      if (now.status !== 'running') return now
      tries += 1
      if (tries >= 100) throw new Error('等了两分钟还没好，先不听了。')
      return new Promise(function (resolve) {
        setTimeout(resolve, 1200)
      }).then(step)
    })
  }
  return step()
}

function SET_blobUrl(base64, mediaType) {
  const canBlob =
    typeof atob === 'function' &&
    typeof Blob === 'function' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  if (!canBlob) throw new Error('这个界面环境不让建 blob URL，播不了音频。')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return URL.createObjectURL(new Blob([bytes], { type: mediaType }))
}

function SET_sampleMeta(one) {
  const parts = []
  if (one.engine) parts.push(one.engine === 'edge' ? 'Edge' : String(one.engine))
  if (one.voice) parts.push(one.voice)
  if (typeof one.seconds === 'number' && one.seconds > 0) parts.push(one.seconds.toFixed(2) + ' 秒')
  if (typeof one.bytes === 'number' && one.bytes > 0) parts.push(Math.round(one.bytes / 1024) + ' KB')
  if (one.fellBackFrom) parts.push('从 ' + one.fellBackFrom + ' 退回来的')
  return parts.join(' · ')
}

function SET_trialRun(rpc) {
  return callRpc(rpc, 'sample.audio', { texts: [SET_trialText()] })
    .then(function (job) {
      return SET_waitJob(rpc, job)
    })
    .then(function (job) {
      if (!job) throw new Error('任务不见了。')
      if (job.status !== 'done') throw new Error(SET_jobError(job))
      const samples = job.result && Array.isArray(job.result.samples) ? job.result.samples : []
      const one = samples[0]
      if (!one) throw new Error('合成完了，但一个样本也没给。')
      if (one.error) throw new Error('这一句合成失败：' + one.error)
      if (!one.file) throw new Error('样本没有文件名，取不到音频。')
      return callRpc(rpc, 'image.bytes', { kind: 'audio', file: one.file }).then(function (bytes) {
        const base64 = bytes && bytes.dataBase64
        if (!base64) throw new Error('音频字节是空的。')
        return { src: SET_blobUrl(base64, 'audio/mpeg'), meta: SET_sampleMeta(one) }
      })
    })
}

// ── 小控件 ────────────────────────────────────────────────────────────────────

/** 分组卡片的壳子：section.group.on > .ghead + .field… */
function SetGroup(props) {
  return h(
    'section',
    { className: 'group on' },
    h(
      'div',
      { className: 'ghead' },
      h('h2', null, props.title),
      props.note ? h('span', { className: 'mut stg-gnote' }, props.note) : null,
    ),
    props.children,
  )
}

/** 一行设置：左边标题+说明，右边控件。
 *
 * 设计稿的密度层把 `.field .desc` 全收了（只给危险行放回来）。这里跟着照做，
 * 只让 props.showDesc 那几行显示说明 —— 用在「学什么语言 / 界面语言」这种
 * 光看控件看不出后果的行上。 */
function SetRow(props) {
  return h(
    'div',
    { className: 'field' + (props.stg ? ' stg-row' : '') },
    h(
      'div',
      null,
      h('div', { className: 'lab' }, props.label),
      props.desc ? h('div', { className: 'desc' + (props.showDesc ? ' stg-desc-on' : '') }, props.desc) : null,
    ),
    h('div', { className: 'ctl' }, props.children),
  )
}

/** 分段控件。真两态、能点、键盘也能点。 */
function SET_seg(props) {
  const options = Array.isArray(props.options) ? props.options : []
  return h(
    'span',
    { className: 'seg', role: 'group', 'aria-label': props.label },
    options.map(function (option) {
      const active = option.value === props.value
      const blocked = Boolean(option.disabled)
      const frozen = blocked || Boolean(props.disabled)
      function pick() {
        if (blocked) {
          if (typeof option.onBlocked === 'function') option.onBlocked()
          return
        }
        if (props.disabled || active) return
        props.onChange(option.value)
      }
      return h(
        'span',
        {
          key: option.value,
          className: (active ? 'on' : '') + (blocked ? ' off' : ''),
          role: 'button',
          tabIndex: frozen ? -1 : 0,
          'aria-pressed': active ? 'true' : 'false',
          'aria-disabled': blocked ? 'true' : undefined,
          title: option.hint || undefined,
          onClick: pick,
          onKeyDown: function (event) {
            if (blocked || props.disabled) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              pick()
            }
          },
        },
        option.label,
      )
    }),
  )
}

/** 开关。两态，点了就翻。 */
function SET_switch(props) {
  const on = Boolean(props.on)
  return h('button', {
    type: 'button',
    className: 'sw' + (on ? ' on' : ''),
    role: 'switch',
    'aria-checked': on ? 'true' : 'false',
    'aria-label': props.label,
    disabled: Boolean(props.disabled),
    onClick: function () {
      if (props.disabled) return
      props.onChange(!on)
    },
  })
}

/** 加减器。范围外那颗按钮直接灰掉，不给点出越界值。 */
function SET_stepper(props) {
  const value = Number(props.value) || 0
  const min = Number(props.min) || 0
  const max = props.max === undefined ? Number.MAX_SAFE_INTEGER : Number(props.max)
  const unit = Number(props.step) || 1
  function move(delta) {
    if (props.disabled) return
    const next = Math.min(max, Math.max(min, value + delta))
    if (next !== value) props.onChange(next)
  }
  return h(
    'span',
    { className: 'stepper' },
    h(
      'button',
      {
        type: 'button',
        className: 'stg-step',
        'aria-label': '减 ' + unit,
        disabled: Boolean(props.disabled) || value <= min,
        onClick: function () {
          move(-unit)
        },
      },
      '−',
    ),
    h('b', null, String(value)),
    h(
      'button',
      {
        type: 'button',
        className: 'stg-step',
        'aria-label': '加 ' + unit,
        disabled: Boolean(props.disabled) || value >= max,
        onClick: function () {
          move(unit)
        },
      },
      '+',
    ),
  )
}

/**
 * 文本输入。
 *
 * 受控组件不能一边打字一边写配置（每敲一个字一个 RPC），所以本地先存草稿，
 * 回车或失焦才提交；Esc 撤回。
 */
function SET_text(props) {
  const current = props.value === undefined || props.value === null ? '' : String(props.value)
  const [draft, setDraft] = useState(current)
  const [editing, setEditing] = useState(false)
  useEffect(
    function () {
      if (!editing) setDraft(current)
    },
    [current, editing],
  )
  function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next === current) return
    props.onCommit(next)
  }
  return h('input', {
    className: 'inp' + (props.wide ? ' wide' : '') + ' stg-inp',
    type: 'text',
    value: draft,
    placeholder: props.placeholder || '',
    disabled: Boolean(props.disabled),
    spellCheck: false,
    'aria-label': props.label,
    onFocus: function () {
      setEditing(true)
    },
    onChange: function (event) {
      setDraft(event.target.value)
    },
    onBlur: commit,
    onKeyDown: function (event) {
      if (event.key === 'Enter') {
        event.preventDefault()
        commit()
      }
      if (event.key === 'Escape') {
        setDraft(current)
        setEditing(false)
      }
    },
  })
}

/** 音色下拉。当前值不在表里时也要显示得出来（离线时宿主可能给的是默认音色）。 */
function SET_voiceSelect(props) {
  const value = String(props.value === undefined || props.value === null ? '' : props.value)
  const list = Array.isArray(props.list) ? props.list : []
  const known = list.some(function (one) {
    return String(one.id) === value
  })
  const children = []
  if (value && !known) {
    children.push(h('option', { key: '__current', value: value }, value + '（不在这次取回的表里）'))
  }
  list.forEach(function (one) {
    const label = one.label && one.label !== one.id ? one.label + ' · ' + one.id : String(one.id)
    children.push(h('option', { key: String(one.id), value: String(one.id) }, label))
  })
  if (!children.length) {
    children.push(h('option', { key: '__none', value: '' }, '还没有音色表'))
  }
  return h(
    'select',
    {
      className: 'inp wide stg-inp stg-select',
      value: value,
      disabled: Boolean(props.disabled) || !list.length,
      'aria-label': props.label,
      onChange: function (event) {
        props.onChange(event.target.value)
      },
    },
    children,
  )
}

/** 写回结果那条线。三种语气：忙着、成了、坏了。 */
function SET_saveLine(save) {
  if (!save || !save.tone) return null
  if (save.tone === 'busy') {
    return h('div', { className: 'stg-msg stg-msg-busy', role: 'status' }, save.text)
  }
  if (save.tone === 'ok') {
    return h('div', { className: 'stg-msg stg-msg-ok', role: 'status' }, save.text)
  }
  return h('div', { className: 'stg-msg stg-msg-bad', role: 'alert' }, save.text)
}

function SET_banner(props) {
  return h(
    'div',
    { className: 'stg-banner stg-banner-' + props.tone },
    h('b', null, props.title),
    props.text ? h('span', null, props.text) : null,
  )
}

function SET_checkLabel(id) {
  const table = {
    node: 'Node',
    sharp: 'sharp（图片）',
    ws: 'WebSocket',
    fetch: 'fetch',
    network: '网络',
    llm: '大模型',
    storage: '数据目录可写',
  }
  return table[id] || String(id)
}

function SET_checkRow(props) {
  const one = props.one || {}
  const ok = Boolean(one.ok)
  return h(
    'div',
    { className: 'stg-check' },
    h('span', { className: 'stg-dot ' + (ok ? 'stg-dot-ok' : 'stg-dot-bad') }),
    h('b', null, SET_checkLabel(one && one.id)),
    h('span', { className: 'stg-checkv' }, (one && one.detail) || (ok ? '正常' : '没过，也没说为什么')),
  )
}

/** 「现在实际用着的是哪儿」——空配置时这一行最重要。 */
function SET_factText(facts, pick) {
  if (!facts || facts.status === 'loading') return '正在取…'
  if (facts.status === 'error') return '没取到'
  const value = facts.value
  if (!value) return '没取到'
  return pick(value) || '—'
}

// ── 各分组 ────────────────────────────────────────────────────────────────────

function SET_secLang(p) {
  return [
    h(
      SetRow,
      {
        key: 'target',
        label: '学什么语言',
        showDesc: true,
        desc:
          '造例句和卡片的目标语言。现在只有英语能生成：lib/packs.js 里 LANGUAGES = ["en"]，' +
          '换个值一造就报「现在还不能生成」。所以中文那颗是灰的，点了会在这里说明。',
      },
      h(SET_seg, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'language') : 'en'),
        label: '目标语言',
        disabled: !p.canWrite,
        options: [
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文', disabled: true, hint: '还没接：LANGUAGES 只有 en', onBlocked: p.onBlocked },
        ],
        onChange: function (next) {
          p.clearNote()
          p.commit('language', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'ui',
        label: '界面语言',
        showDesc: true,
        tone: 'bad',
        desc:
          '插件自己不存这一项：文案跟着 DSH 的 locale 走（99-register.js 里 ctx.locale.register + bind）。' +
          '要换界面语言得去宿主设置里改，面板刷新后跟上。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
      h('span', { key: 'now', className: 'inp' }, '跟宿主走'),
    ),
  ]
}

function SET_secVoice(p) {
  const voices = p.voices || { status: 'idle', list: [], error: '' }
  const engine = String(p.snapshot ? SET_read(p.snapshot, 'ttsEngine') : 'auto')
  const engineHint =
    engine === 'edge'
      ? '只用 Edge。不用任何 key，离线也能合成一部分。'
      : engine === 'openai'
        ? '主 TTS 优先，没配端点或失败还是退回 Edge。'
        : '自动：配了 OpenAI 兼容的 TTS 就先用它，Edge 永远兜底。'

  const voiceCtl = []
  if (voices.status === 'loading') {
    voiceCtl.push(h('span', { key: 'busy', className: 'mut' }, '正在取 Edge 音色表…'))
  } else if (voices.status === 'error') {
    voiceCtl.push(h('span', { key: 'bad', className: 'chip bad' }, '没取到音色表'))
    voiceCtl.push(
      h(
        'button',
        {
          key: 'retry',
          type: 'button',
          className: 'btn ghost sm',
          onClick: p.reloadVoices,
        },
        '再取一次',
      ),
    )
  } else if (voices.status === 'ready' && !voices.list.length) {
    voiceCtl.push(h('span', { key: 'empty', className: 'mut' }, 'Edge 一个音色都没返回'))
    voiceCtl.push(
      h('button', { key: 'retry', type: 'button', className: 'btn ghost sm', onClick: p.reloadVoices }, '再取一次'),
    )
  } else {
    voiceCtl.push(
      h(SET_voiceSelect, {
        key: 'sel',
        value: String(p.snapshot ? SET_read(p.snapshot, 'ttsVoiceEdge') : 'en-US-AriaNeural'),
        list: voices.list,
        label: 'Edge 音色',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('ttsVoiceEdge', next)
        },
      }),
    )
  }

  const trial = p.trial || { status: 'idle', src: '', meta: '', error: '' }
  const trialCtl = [
    h(
      'button',
      {
        key: 'go',
        type: 'button',
        className: 'btn ghost sm',
        disabled: trial.status === 'running',
        onClick: p.runTrial,
      },
      trial.status === 'running' ? '正在合成…' : '合成一句听听',
    ),
  ]
  if (trial.status === 'ready' && trial.src) {
    trialCtl.push(h('audio', { key: 'audio', className: 'stg-audio', controls: true, preload: 'none', src: trial.src }))
  }
  if (trial.status === 'ready' && trial.meta) {
    trialCtl.push(h('span', { key: 'meta', className: 'mut stg-meta' }, trial.meta))
  }
  if (trial.status === 'bad') {
    trialCtl.push(h('span', { key: 'err', className: 'stg-msg stg-msg-bad stg-inline' }, trial.error))
  }

  return [
    h(
      SetRow,
      { key: 'engine', label: '语音引擎', desc: engineHint },
      h(SET_seg, {
        value: engine,
        label: '语音引擎',
        disabled: !p.canWrite,
        options: [
          { value: 'auto', label: '自动' },
          { value: 'edge', label: '只用 Edge' },
          { value: 'openai', label: '主 TTS 优先' },
        ],
        onChange: function (next) {
          p.commit('ttsEngine', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'voice',
        label: 'Edge 音色',
        desc:
          voices.status === 'error'
            ? '音色表要联网从 Edge 取，取不到不影响用默认音色。'
            : '表是 voice.list 从 Edge 现取的，几百个；英文的都在这里。',
      },
      voiceCtl,
    ),
    h(
      SetRow,
      {
        key: 'rate',
        label: '语速',
        desc: 'Edge 写 +10% / -5% 这种；OpenAI 兼容接口会换算成 speed=1.1。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'rate') : '+10%'),
        placeholder: '+10%',
        label: '语速',
        wide: false,
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('rate', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'volume', label: '音量', desc: '只有 Edge 引擎认这个参数，OpenAI 兼容接口没有音量。' },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'volume') : '+10%'),
        placeholder: '+10%',
        label: '音量',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('volume', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'trial',
        label: '试听',
        desc: '按现在的引擎/音色真合成一句（实际走 sample.audio 任务，不是假按钮）。',
      },
      trialCtl,
    ),
  ]
}

function SET_secMake(p) {
  function num(key, min, max) {
    const value = Number(p.snapshot ? SET_read(p.snapshot, key) : SET_defaults()[key])
    return { value: Number.isFinite(value) ? value : min, min: min, max: max }
  }
  const examples = num('examplesPerLesson', 1, 40)
  const zh = num('zhVariants', 2, 4)
  const cands = num('candidateLimit', 3, 12)
  return [
    h(
      SetRow,
      { key: 'examples', label: '一个包几句', desc: '1–40，默认 8。多了模型写得久，也更容易写出重复的场景。' },
      h(SET_stepper, {
        value: examples.value,
        min: examples.min,
        max: examples.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('examplesPerLesson', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'zh', label: '中文变体', desc: '每句给几种故意不一致的中文说法，2–4。练的是「别逐字对译」。' },
      h(SET_stepper, {
        value: zh.value,
        min: zh.min,
        max: zh.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('zhVariants', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'cands', label: '候选图张数', desc: '每条给几张候选图，3–12。张数越多，找图和预检越花时间。' },
      h(SET_stepper, {
        value: cands.value,
        min: cands.min,
        max: cands.max,
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('candidateLimit', next)
        },
      }),
    ),
    h(
      SetRow,
      { key: 'auto', label: '造完顺手找候选图', desc: '关掉就只写例句，候选图等你回面板自己点。' },
      h(SET_switch, {
        on: Boolean(p.snapshot ? SET_read(p.snapshot, 'autoPrepareCandidates') : true),
        label: '造完顺手找候选图',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('autoPrepareCandidates', next)
        },
      }),
    ),
    h(
      SetRow,
      {
        key: 'pixel',
        label: '像素预检',
        desc: '用像素统计挡掉纯色块、渐变图和大色块海报 —— 这类图配上去就是个色块。',
      },
      h(SET_switch, {
        on: Boolean(p.snapshot ? SET_read(p.snapshot, 'pixelCheck') : true),
        label: '像素预检',
        disabled: !p.canWrite,
        onChange: function (next) {
          p.commit('pixelCheck', next)
        },
      }),
    ),
  ]
}

function SET_secApi(p) {
  function text(key, placeholder, desc, wide) {
    return h(
      SetRow,
      { key: key, label: SET_textLabel(key), desc: desc },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, key) : SET_defaults()[key]),
        placeholder: placeholder,
        label: SET_textLabel(key),
        wide: wide !== false,
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit(key, next)
        },
      }),
    )
  }
  return [
    text('llmBaseUrl', '留空 = 用宿主的 llm', 'OpenAI 兼容的模型端点，比如 http://127.0.0.1:18999/v1。留空就用宿主的 llm 服务 —— 这是正常情况，不填也能造。'),
    text('llmModel', '留空 = 端点自己的默认', '上面那个端点用的模型名。用宿主 llm 时这里不用填。'),
    text('llmApiKeyEnv', 'OPENAI_API_KEY', 'key 存在哪个环境变量名下。key 本身放 DSH 的凭据里，不写在这儿。', false),
    text('ttsBaseUrl', '留空 = 只用 Edge', 'OpenAI 兼容 TTS 的 base url。留空就只有 Edge 一条路。'),
    text('ttsModel', 'tts-1', 'TTS 模型名。'),
    text('ttsApiKeyEnv', 'OPENAI_API_KEY', 'TTS 的 key 存在哪个环境变量名下。', false),
    text('ttsVoice', 'alloy', 'OpenAI 兼容 TTS 的音色名（Edge 的音色在上面「声音」里）。', false),
    text(
      'proxyUrl',
      '留空 = 读 HTTPS_PROXY 和系统代理',
      'Node 的 fetch 不读系统代理。搜不到候选图时先填这里，比如 http://127.0.0.1:7897。改完立刻生效，不用重启宿主。',
    ),
  ]
}

function SET_textLabel(key) {
  const table = {
    llmBaseUrl: '大模型端点',
    llmModel: '大模型名',
    llmApiKeyEnv: 'Key 环境变量',
    ttsBaseUrl: 'TTS 端点',
    ttsModel: 'TTS 模型',
    ttsApiKeyEnv: 'TTS Key 环境变量',
    ttsVoice: 'OpenAI 音色',
    proxyUrl: '代理地址',
    dataDir: '数据目录',
    exportDir: '导出目录',
  }
  return table[key] || key
}

function SET_secPlace(p) {
  const facts = p.facts || { status: 'loading', value: null, error: '' }
  return [
    h(
      SetRow,
      {
        key: 'data',
        label: '数据目录',
        desc: '账本、素材、成品包全在这棵树里。留空就是 %LOCALAPPDATA%\\dsh-etude。改完下次造包才用新目录，老账本不会自己搬过去。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'dataDir') : ''),
        placeholder: '留空 = %LOCALAPPDATA%\\dsh-etude',
        label: '数据目录',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('dataDir', next)
        },
      }),
      SET_livePath(facts, 'root', p.reloadFacts),
    ),
    h(
      SetRow,
      {
        key: 'export',
        label: '导出目录',
        desc: '打完包导出成品时往哪儿放。留空就是 %USERPROFILE%\\Downloads\\dsh-etude。',
      },
      h(SET_text, {
        value: String(p.snapshot ? SET_read(p.snapshot, 'exportDir') : ''),
        placeholder: '留空 = Downloads\\dsh-etude',
        label: '导出目录',
        disabled: !p.canWrite,
        onCommit: function (next) {
          p.commit('exportDir', next)
        },
      }),
      SET_livePath(facts, 'exportDir', p.reloadFacts),
    ),
  ]
}

/** 「现在用着：xxx」。这一行比输入框更重要 —— 留空时它才告诉你真落在哪。 */
function SET_livePath(facts, key, onRetry) {
  if (!facts || facts.status === 'loading') {
    return h('span', { className: 'stg-live' }, '现在用着：正在取…')
  }
  if (facts.status === 'error' || !facts.value) {
    return h(
      'span',
      { className: 'stg-live' },
      '现在用着：没取到',
      h('button', { type: 'button', className: 'btn ghost sm', onClick: onRetry }, '再取一次'),
    )
  }
  const value = facts.value[key]
  return h(
    'span',
    { className: 'stg-live', title: String(value || '') },
    '现在用着：',
    h('span', { className: 'stg-code' }, String(value || '—')),
  )
}

function SET_secHealth(p) {
  const check = p.check || { status: 'idle', value: null, error: '' }
  const buttons = [
    h(
      'button',
      {
        key: 'go',
        type: 'button',
        className: 'btn ghost sm',
        disabled: check.status === 'loading',
        onClick: p.reloadCheck,
      },
      check.status === 'loading' ? '正在体检…' : check.status === 'ready' ? '重新体检' : '跑一遍体检',
    ),
  ]
  const body = []
  if (check.status === 'error') {
    body.push(h(SET_banner, { key: 'err', tone: 'bad', title: '自检没跑起来', text: check.error }))
  } else if (check.status === 'ready') {
    const value = check.value || {}
    const checks = Array.isArray(value.checks) ? value.checks : []
    if (!checks.length) {
      body.push(h('p', { key: 'empty', className: 'mut' }, '宿主没返回任何检查项。配置没坏的话，这通常意味着自检模块没装上。'))
    } else {
      body.push(
        h('div', { key: 'list', className: 'stg-list' }, checks.map(function (one) {
          return h(SET_checkRow, { key: String((one && one.id) || Math.random()), one: one })
        })),
      )
    }
    body.push(
      h(
        'div',
        { key: 'meta', className: 'stg-meta-line' },
        h('span', null, '版本 ' + String(value.version || '—')),
        h('span', null, '数据 ' + String(value.root || '—')),
        h('span', null, '代理 ' + String(value.proxy || '没设（用系统代理）')),
      ),
    )
  } else if (check.status === 'loading') {
    body.push(h('p', { key: 'busy', className: 'mut' }, '正在体检，挨个试一遍，几秒钟…'))
  } else {
    body.push(h('p', { key: 'idle', className: 'mut' }, '还没体检。点右边那颗按钮，会把 node / sharp / ws / fetch / 网络 / 大模型挨个试一遍。'))
  }

  return [
    h(
      SetRow,
      {
        key: 'run',
        label: '一键体检',
        desc: '真跑一遍，不是画勾。哪一项没过会连原因一起显示出来。',
      },
      buttons,
    ),
    h('div', { key: 'body', className: 'stg-body' }, body),
  ]
}

function SET_secAbout(p) {
  const facts = p.facts || { status: 'loading', value: null, error: '' }
  return [
    h(
      SetRow,
      { key: 'version', label: '版本', desc: '宿主那半 index.js 的 version，state 端点带回来的。' },
      h('span', { key: 'chip', className: 'chip ok' }, String(SET_factText(facts, function (value) {
        return value.version
      }))),
    ),
    h(
      SetRow,
      {
        key: 'update',
        label: '检查更新',
        tone: 'bad',
        desc: '插件没有更新端点，面板也不该自己去敲网。现在只能手动换包。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
    ),
    h(
      SetRow,
      {
        key: 'danger',
        label: '清缓存 / 重置账本',
        tone: 'bad',
        desc:
          '很想摆这两个按钮，但插件里没有对应接口：pack.delete 只能按一个包删，' +
          '没有全局清缓存、也没有重置账本。真要做只能直接删数据目录里的文件。',
      },
      h('span', { key: 'chip', className: 'chip warn' }, '这一项还没接'),
    ),
    h(
      SetRow,
      { key: 'law', label: '这套东西的规矩', desc: '配图必须有人从候选里挑一张，语音必须有人听过。两条都是打包时的硬校验，模型替不了，面板也替不了。' },
      h('span', { key: 'chip', className: 'chip accent' }, '人点头才算数'),
    ),
  ]
}

// ── 页面 ──────────────────────────────────────────────────────────────────────

/**
 * 设置页。
 *
 * props:
 *   rpc     —— connection.rpc（与其它页同一份）
 *   form    —— configForms.get(CONFIG_NS)，没有就传 null（只读）
 *   owner   —— 宿主配置卡塞进来的 owner（owner.form 是这个条目的 form）
 *   ctx     —— 宿主 ctx，给了就自己去找 configForms
 *   onBack  —— 可选，回上一页
 *
 * form 三选一：直接给的 → owner.form → 拿 ctx 现找。都没有就只读（每个开关点下去会
 * 说清楚为什么改不了，不假装存上了）。
 */
function SettingsPage(props) {
  const rpc = props.rpc
  const form =
    props.form ||
    (props.owner && props.owner.form) ||
    (props.ctx ? SET_configForm(props.ctx) : null) ||
    null

  const [group, setGroup] = useState('lang')
  const [save, setSave] = useState({ key: '', tone: '', text: '' })
  const [note, setNote] = useState('')

  const snapshot = SET_useConfig(form)
  const factsBundle = SET_useFacts(rpc)
  const voicesBundle = SET_useVoices(rpc, group === 'voice')
  const checkBundle = SET_useCheck(rpc, group === 'health')

  const aliveRef = useRef(true)
  const audioRef = useRef('')
  const [trial, setTrial] = useState({ status: 'idle', src: '', meta: '', error: '' })

  useEffect(function () {
    aliveRef.current = true
    return function () {
      aliveRef.current = false
      if (audioRef.current && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(audioRef.current)
        } catch (error) {
          /* 撤不掉就算了，别把卸载流程搞挂 */
        }
      }
    }
  }, [])

  const commit = useCallback(
    function (key, value) {
      if (!form) {
        setSave({ key: key, tone: 'bad', text: '没有配置接口（configForms），这一项改不了。' })
        return
      }
      if (snapshot && snapshot.writable === false) {
        setSave({ key: key, tone: 'bad', text: '宿主说这份配置是只读的。' })
        return
      }
      setSave({ key: key, tone: 'busy', text: '正在写回 ' + SET_textLabel(key) + '…' })
      SET_patch(form, key, value)
        .then(function () {
          setSave({ key: key, tone: 'ok', text: '已写回：' + SET_textLabel(key) + ' = ' + String(value) })
        })
        .catch(function (error) {
          setSave({ key: key, tone: 'bad', text: '写不进去：' + ((error && error.message) || String(error)) })
        })
    },
    [form, snapshot],
  )

  const runTrial = useCallback(
    function () {
      if (audioRef.current) {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          try {
            URL.revokeObjectURL(audioRef.current)
          } catch (error) {
            /* 同上 */
          }
        }
        audioRef.current = ''
      }
      setTrial({ status: 'running', src: '', meta: '', error: '' })
      SET_trialRun(rpc)
        .then(function (result) {
          if (!aliveRef.current) return
          audioRef.current = result.src
          setTrial({ status: 'ready', src: result.src, meta: result.meta, error: '' })
        })
        .catch(function (error) {
          if (!aliveRef.current) return
          setTrial({ status: 'bad', src: '', meta: '', error: (error && error.message) || String(error) })
        })
    },
    [rpc],
  )

  const canWrite = Boolean(form) && (snapshot ? snapshot.writable !== false : false)
  const facts = factsBundle.facts
  const stage = {
    snapshot: snapshot,
    facts: facts,
    canWrite: canWrite,
    commit: commit,
    voices: voicesBundle.voices,
    reloadVoices: voicesBundle.reload,
    check: checkBundle.check,
    reloadCheck: checkBundle.reload,
    reloadFacts: factsBundle.reload,
    trial: trial,
    runTrial: runTrial,
    onBlocked: function () {
      setNote('中文还没接：lib/packs.js 里 LANGUAGES 只有 "en"，选了也造不出来。')
    },
    clearNote: function () {
      setNote('')
    },
  }

  const notices = []
  if (!form) {
    notices.push(
      h(SET_banner, {
        key: 'noform',
        tone: 'warn',
        title: '这次没有配置接口',
        text:
          '宿主没给 configForms（DSH 0.1.6 以上才有）。下面这些值照常显示，但改不了 —— ' +
          '要改只能去 loader 里那条 dsh-etude 配置条目。',
      }),
    )
  } else if (snapshot && snapshot.status === 'error') {
    notices.push(h(SET_banner, { key: 'err', tone: 'bad', title: '配置没读出来', text: snapshot.error || '' }))
  } else if (!snapshot || snapshot.status !== 'ready') {
    notices.push(
      h(SET_banner, {
        key: 'wait',
        tone: 'warn',
        title: '正在等宿主把配置给过来',
        text: '下面先按默认值显示。',
      }),
    )
  } else if (snapshot.writable === false) {
    notices.push(
      h(SET_banner, {
        key: 'ro',
        tone: 'warn',
        title: '这份配置是只读的',
        text: '宿主说当前不能改（writable = false）。下面照样显示真值。',
      }),
    )
  }

  let section = null
  if (group === 'lang') section = SET_secLang(stage)
  else if (group === 'voice') section = SET_secVoice(stage)
  else if (group === 'make') section = SET_secMake(stage)
  else if (group === 'api') section = SET_secApi(stage)
  else if (group === 'place') section = SET_secPlace(stage)
  else if (group === 'health') section = SET_secHealth(stage)
  else section = SET_secAbout(stage)

  const meta = SET_meta(group)
  const subtitle = []
  subtitle.push('dsh-etude')
  subtitle.push(facts.status === 'ready' && facts.value && facts.value.version ? String(facts.value.version) : '版本待取')
  subtitle.push(facts.status === 'ready' && facts.value && facts.value.root ? String(facts.value.root) : '目录待取')
  subtitle.push(meta.title)

  return Screen({
    className: 'stg-screen',
    children: [
      h('style', { key: 'css' }, SET_css()),
      h(
        'header',
        { key: 'hdr', className: 'hdr' },
        h('div', null, h('h1', null, '设置'), h('div', { className: 'sub stg-sub' }, subtitle.join(' · '))),
        h(
          'div',
          { className: 'act' },
          h(
            'button',
            {
              type: 'button',
              className: 'btn ghost',
              onClick: function () {
                factsBundle.reload()
              },
            },
            '重取一次',
          ),
          props.onBack
            ? h('button', { type: 'button', className: 'btn ghost', onClick: props.onBack }, '回面板')
            : null,
        ),
      ),
      h(
        'div',
        { key: 'wrap', className: 'setwrap' },
        SET_nav(group, function (next) {
          setGroup(next)
          setNote('')
        }),
        h(
          'div',
          { key: 'body', className: 'setbody' },
          notices,
          SET_saveLine(save),
          note ? h('p', { key: 'note', className: 'mut stg-note' }, note) : null,
          h(SetGroup, { key: 'group', title: meta.title, note: meta.note }, section),
        ),
      ),
    ],
  })
}

function SET_nav(active, onPick) {
  return h(
    'nav',
    { className: 'setnav', 'aria-label': '设置分组' },
    SET_glabs().map(function (block) {
      return h(
        'div',
        { key: block.label, className: 'stg-navblock' },
        h('div', { className: 'glab' }, block.label),
        block.ids.map(function (id) {
          const meta = SET_meta(id)
          return h(
            'a',
            {
              key: id,
              href: '#' + id,
              className: active === id ? 'on' : '',
              'aria-current': active === id ? 'page' : undefined,
              onClick: function (event) {
                if (event && typeof event.preventDefault === 'function') event.preventDefault()
                onPick(id)
              },
            },
            meta.title,
          )
        }),
      )
    }),
  )
}

// ── 这个文件自己的样式 ────────────────────────────────────────────────────────
//
// 只加 .stg- 开头的类，量很小：一是补齐设计稿里没有的（下拉、音频、体检行），
// 二是把被覆盖层吃掉的那几个（.desc / .ghead .mut）显式打开。

function SET_css() {
  return [
    '.stg-screen{max-width:1120px}',
    '.stg-navblock{display:flex;flex-direction:column;gap:2px}',
    '.setbody .group .field .desc.stg-desc-on{display:block;margin-top:4px;font-size:12px;line-height:1.55;color:var(--fg3);max-width:60ch}',
    '.stg-gnote{display:block}',
    '.stg-sub{word-break:break-all}',
    '.stg-inp{width:100%;min-width:0;height:34px;box-sizing:border-box;font:inherit;font-size:12px;font-family:inherit}',
    '.stg-inp::placeholder{color:var(--ghost,rgba(255,255,255,.35))}',
    'select.stg-inp{appearance:auto;-webkit-appearance:auto;padding:0 10px;cursor:pointer}',
    '.stg-step{padding:0;line-height:1}',
    '.stg-step:disabled{opacity:.35;cursor:default}',
    '.stg-msg{font-size:11.5px;line-height:1.5;display:flex;align-items:center;gap:6px;margin:0 0 10px}',
    '.stg-msg-busy{color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-msg-ok{color:var(--s-green,#57c77b)}',
    '.stg-msg-bad{color:var(--danger,#e5534b)}',
    '.stg-inline{margin:0;max-width:320px;text-align:right}',
    '.stg-banner{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline;padding:11px 14px;border-radius:14px;font-size:12px;line-height:1.6}',
    '.stg-banner b{font-weight:600}',
    '.stg-banner span{color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-banner-warn{background:rgba(240,180,60,.09);border:1px solid rgba(240,180,60,.28);color:#f0b43c}',
    '.stg-banner-bad{background:rgba(229,83,75,.1);border:1px solid rgba(229,83,75,.3);color:var(--danger,#e5534b)}',
    '.stg-list{display:flex;flex-direction:column;gap:7px;margin-top:12px}',
    '.stg-check{display:grid;grid-template-columns:9px 128px minmax(0,1fr);gap:9px;align-items:baseline;font-size:12px;color:var(--fg3,rgba(255,255,255,.55))}',
    '.stg-check b{font-weight:600;color:var(--fg2,rgba(255,255,255,.8))}',
    '.stg-checkv{word-break:break-word;font-variant-numeric:tabular-nums}',
    '.stg-dot{width:7px;height:7px;border-radius:50%;display:inline-block}',
    '.stg-dot-ok{background:var(--s-green,#57c77b);box-shadow:0 0 0 2px rgba(87,199,123,.16)}',
    '.stg-dot-bad{background:var(--danger,#e5534b);box-shadow:0 0 0 2px rgba(229,83,75,.18)}',
    '.stg-meta-line{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:11.5px;color:var(--ghost,rgba(255,255,255,.35))}',
    '.stg-code{display:inline-block;max-width:290px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;font-size:11.5px;color:var(--fg2,rgba(255,255,255,.8));font-variant-numeric:tabular-nums}',
    '.stg-live{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--ghost,rgba(255,255,255,.35));white-space:nowrap}',
    '.stg-audio{height:32px;max-width:260px;filter:invert(1) hue-rotate(180deg)}',
    '.stg-meta{white-space:nowrap;font-size:11px}',
    '.stg-note{margin:0 0 10px}',
    '.stg-body{display:flex;flex-direction:column;gap:6px}',
  ].join('\n')
}
