/**
 * dsh-etude — Client half.
 *
 * 一个主面板（侧栏「卡片工厂」）+ 一张插件配置卡。
 *
 * 这一半只做界面，所有事实都从宿主那边取（`/etude` RPC）。它自己拥有的状态只有
 * 「现在在看哪个包」和「哪个任务在跑」。
 *
 * 界面上几条不能丢的东西（HANDOVER 的六条硬标准）：
 *   · 没图的时候不画虚线占位框 —— 直接把「挑一张」摆出来；
 *   · 文字只有三层：句子 / 场景一句 / 元信息；
 *   · 动效 180ms 以内，并且认 prefers-reduced-motion；
 *   · 360px 宽不塌：图高 240px，文字跟着堆下去；
 *   · 暗色是设计过的暗色：颜色一律取主题 token，不写字面色。
 */
window.__ModuleLoader__.load({
  id: 'dsh-etude',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const NS = 'dsh-etude'
    const RPC_CHANNEL = '/etude'
    const CONFIG_NS = 'etude'

    const EASE = '140ms ease'

    const styles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-1))',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 14,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
        flexWrap: 'wrap',
      },
      title: { fontSize: 15, fontWeight: 600, letterSpacing: '.01em' },
      subtitle: {
        fontSize: 11,
        color: 'var(--dsw-alias-label-tertiary)',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: '0 1 auto',
      },
      input: {
        flex: '1 1 240px',
        minWidth: 160,
        height: 34,
        padding: '0 12px',
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l3)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 13,
        outline: 'none',
      },
      button: {
        height: 34,
        padding: '0 14px',
        borderRadius: 8,
        border: '1px solid var(--dsw-alias-border-l3)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 13,
        cursor: 'pointer',
        transition: `background ${EASE}, border-color ${EASE}, opacity ${EASE}`,
        whiteSpace: 'nowrap',
      },
      buttonPrimary: {
        height: 34,
        padding: '0 16px',
        borderRadius: 8,
        border: '1px solid transparent',
        background: 'var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary))',
        color: 'var(--dsw-alias-label-primary-foreground, #fff)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: `opacity ${EASE}`,
        whiteSpace: 'nowrap',
      },
      body: { display: 'flex', flex: 1, minHeight: 0 },
      list: {
        width: 264,
        flex: '0 0 264px',
        borderRight: '1px solid var(--dsw-alias-border-l3)',
        overflowY: 'auto',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      },
      detail: { flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' },
      listItem: (active) => ({
        textAlign: 'left',
        padding: '9px 12px',
        borderRadius: 8,
        border: '1px solid transparent',
        background: active ? 'var(--dsw-alias-interactive-bg-hover)' : 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        transition: `background ${EASE}`,
      }),
      listTarget: {
        fontSize: 13,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      listMeta: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' },
      target: {
        fontFamily: "Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif SC', serif",
        fontSize: '1.9rem',
        lineHeight: 1.15,
        letterSpacing: '-.01em',
        margin: 0,
        wordBreak: 'break-word',
      },
      metaRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, flexWrap: 'wrap' },
      gloss: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--dsw-alias-label-secondary, var(--dsw-alias-label-tertiary))',
      },
      sectionTitle: {
        marginTop: 22,
        marginBottom: 10,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-tertiary)',
      },
      card: {
        display: 'flex',
        gap: 0,
        borderRadius: 12,
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        overflow: 'hidden',
        marginBottom: 10,
      },
      cardNarrow: { flexDirection: 'column' },
      media: { flex: '0 0 42%', minWidth: 0, position: 'relative', background: 'var(--dsw-alias-bg-layer-3)' },
      image: { width: '100%', height: 240, objectFit: 'cover', display: 'block' },
      cardText: { flex: 1, minWidth: 0, padding: '14px 16px 12px', display: 'flex', flexDirection: 'column' },
      sentence: {
        fontFamily: "Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif SC', serif",
        fontSize: '1.55rem',
        lineHeight: 1.45,
        margin: 0,
        color: 'var(--dsw-alias-label-primary)',
        wordBreak: 'break-word',
      },
      scene: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--dsw-alias-label-tertiary)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      },
      meta: {
        marginTop: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--dsw-alias-label-tertiary)',
        flexWrap: 'wrap',
      },
      tag: {
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l3)',
        color: 'var(--dsw-alias-label-tertiary)',
        whiteSpace: 'nowrap',
      },
      actions: { marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 3, padding: 3, flex: '0 0 42%', minWidth: 0, alignContent: 'start' },
      gridNarrow: { flex: '1 1 auto', width: '100%' },
      cell: (picked) => ({
        position: 'relative',
        aspectRatio: '4 / 3',
        border: picked ? '2px solid var(--dsw-alias-brand-primary)' : '2px solid transparent',
        borderRadius: 6,
        overflow: 'hidden',
        padding: 0,
        background: 'var(--dsw-alias-bg-layer-3)',
        cursor: 'pointer',
        transition: `border-color ${EASE}`,
      }),
      cellImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
      banner: (kind) => ({
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: '9px 12px',
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 12,
        lineHeight: 1.6,
        border: '1px solid var(--dsw-alias-border-l3)',
        color:
          kind === 'error'
            ? 'var(--dsw-alias-state-error-primary)'
            : 'var(--dsw-alias-label-secondary, var(--dsw-alias-label-tertiary))',
        background: 'var(--dsw-alias-bg-layer-1)',
      }),
      jobStrip: {
        borderTop: '1px solid var(--dsw-alias-border-l3)',
        padding: '7px 16px',
        fontSize: 12,
        color: 'var(--dsw-alias-label-tertiary)',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      },
      dot: (on) => ({
        width: 7,
        height: 7,
        borderRadius: 999,
        background: on ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-border-l4)',
        flex: '0 0 auto',
      }),
      empty: {
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 13,
        lineHeight: 1.9,
      },
    }

    // ── 数据 ────────────────────────────────────────────────────────────────

    async function callRpc(rpc, endpoint, payload) {
      if (!rpc) throw new Error('这个运行时没有 RPC 通道，界面拿不到数据。')
      const result = await rpc.call(RPC_CHANNEL, endpoint, payload)
      if (!result || result.ok !== true) {
        const error = new Error(result?.error?.message ?? '接口调用失败')
        error.code = result?.error?.code
        throw error
      }
      return result.value
    }

    function useFactory(rpc) {
      const [state, setState] = useState({ status: 'loading', root: '', packs: [] })
      const [error, setError] = useState(null)
      const [detail, setDetail] = useState(null)
      const [selected, setSelected] = useState(null)
      const [job, setJob] = useState(null)

      const reload = useCallback(async () => {
        try {
          const value = await callRpc(rpc, 'state')
          setState({ status: 'ready', ...value })
          setError(null)
          return value
        } catch (failure) {
          setState((prev) => ({ ...prev, status: 'error' }))
          setError(failure.message)
          return null
        }
      }, [rpc])

      const loadDetail = useCallback(
        async (packId) => {
          if (!packId) return setDetail(null)
          try {
            setDetail(await callRpc(rpc, 'pack.get', { id: packId }))
          } catch (failure) {
            setError(failure.message)
            setDetail(null)
          }
        },
        [rpc],
      )

      useEffect(() => {
        reload()
      }, [reload])

      useEffect(() => {
        if (selected) loadDetail(selected)
        else setDetail(null)
      }, [selected, loadDetail])

      // 有任务在跑才轮询。空闲的时候一次网络都不发。
      useEffect(() => {
        if (!job || job.status !== 'running') return undefined
        let alive = true
        const timer = setInterval(async () => {
          try {
            const next = await callRpc(rpc, 'job.get', { id: job.id })
            if (!alive) return
            if (next.status === 'running') {
              setJob(next)
              return
            }
            setJob(null)
            await reload()
            if (selected) await loadDetail(selected)
          } catch {
            if (alive) setJob(null)
          }
        }, 700)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [job, rpc, reload, loadDetail, selected])

      const runJob = useCallback(
        async (endpoint, payload) => {
          try {
            const started = await callRpc(rpc, endpoint, payload)
            setJob(started)
            setError(null)
            return started
          } catch (failure) {
            setError(failure.message)
            return null
          }
        },
        [rpc],
      )

      const act = useCallback(
        async (endpoint, payload) => {
          try {
            const value = await callRpc(rpc, endpoint, payload)
            setError(null)
            await reload()
            if (selected) await loadDetail(selected)
            return value
          } catch (failure) {
            setError(failure.message)
            return null
          }
        },
        [rpc, reload, loadDetail, selected],
      )

      return { state, detail, selected, setSelected, job, error, setError, reload, runJob, act }
    }

    function useForm(form) {
      const [snapshot, setSnapshot] = useState(() => (form ? form.getSnapshot() : { status: 'unavailable', value: undefined }))
      useEffect(() => {
        if (!form) return undefined
        setSnapshot(form.getSnapshot())
        return form.subscribe(() => setSnapshot(form.getSnapshot()))
      }, [form])
      const set = useCallback(
        async (key, value) => {
          if (!form) return false
          try {
            await form.mutate([{ op: 'set', path: [key], value }])
            return true
          } catch {
            return false
          }
        },
        [form],
      )
      return { snapshot, set, writable: Boolean(form) }
    }

    // ── 小组件 ──────────────────────────────────────────────────────────────

    function Icon({ name, size = 16 }) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      }
      if (name === 'factory') {
        return React.createElement(
          'svg',
          common,
          React.createElement('path', { d: 'M3 20.5h18' }),
          React.createElement('path', { d: 'M4.5 20.5V10l5.2 3V10l5.2 3V7.8l5.1 2.9v9.8' }),
          React.createElement('path', { d: 'M9 20.5v-2.6M14 20.5v-2.6M19 20.5v-2.6' }),
        )
      }
      if (name === 'play') {
        return React.createElement('svg', { ...common, fill: 'currentColor', stroke: 'none' }, React.createElement('path', { d: 'M8 5.2v13.6L19 12z' }))
      }
      if (name === 'stop') {
        return React.createElement('svg', { ...common, fill: 'currentColor', stroke: 'none' }, React.createElement('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 2 }))
      }
      if (name === 'check') return React.createElement('svg', common, React.createElement('path', { d: 'M4.5 12.5 9.5 17.5 19.5 6.5' }))
      if (name === 'refresh') {
        return React.createElement(
          'svg',
          common,
          React.createElement('path', { d: 'M20 12a8 8 0 1 1-2.6-5.9' }),
          React.createElement('path', { d: 'M20.5 4v5h-5' }),
        )
      }
      if (name === 'warning') {
        return React.createElement(
          'svg',
          common,
          React.createElement('path', { d: 'M12 4.2 2.6 20h18.8z' }),
          React.createElement('path', { d: 'M12 10v4M12 17.2h.01' }),
        )
      }
      return React.createElement('svg', common, React.createElement('circle', { cx: 12, cy: 12, r: 8 }))
    }

    function Tag({ children }) {
      return React.createElement('span', { style: styles.tag }, children)
    }

    function useNarrow(breakpoint = 760) {
      const [narrow, setNarrow] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < breakpoint))
      useEffect(() => {
        const onResize = () => setNarrow(window.innerWidth < breakpoint)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
      }, [breakpoint])
      return narrow
    }

    function secondsText(value) {
      return Number.isFinite(value) && value > 0 ? `${value.toFixed(2)}s` : '—'
    }

    // ── 媒体字节 ────────────────────────────────────────────────────────────
    //
    // 为什么不直接把 `/etude/media/...` 塞进 <img>/<audio>：
    // 宿主那层 web 服务整站要过 `dsh web` 的鉴权（没带 token 一律 401，
    // 正文就写「dsh web authentication required」），而 <img src> 这类子资源
    // 请求不会带上页面 URL 里的 token —— 于是界面上就是一片空白。
    // 而「图看不到、声听不到」正是上一版最大的毛病，所以这里一律走 RPC 拿字节、
    // 转成 blob URL：跟鉴权无关，一定显示得出来。
    let rpcRef = null
    const mediaCache = new Map()
    const MEDIA_CACHE_LIMIT = 80

    function mediaTypeOf(file) {
      const lower = String(file ?? '').toLowerCase()
      if (lower.endsWith('.png')) return 'image/png'
      if (lower.endsWith('.webp')) return 'image/webp'
      if (lower.endsWith('.gif')) return 'image/gif'
      if (lower.endsWith('.mp3')) return 'audio/mpeg'
      return 'image/jpeg'
    }

    function rememberMedia(key, url) {
      mediaCache.set(key, url)
      while (mediaCache.size > MEDIA_CACHE_LIMIT) {
        const oldest = mediaCache.keys().next().value
        const stale = mediaCache.get(oldest)
        mediaCache.delete(oldest)
        if (stale) URL.revokeObjectURL(stale)
      }
    }

    function base64ToBlob(base64, mediaType) {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      return new Blob([bytes], { type: mediaType })
    }

    /** 给一个媒体描述，还你一个能直接放进 src 的 blob URL。 */
    function useMedia(source) {
      const key = source
        ? `${source.endpoint}|${source.payload?.kind ?? ''}|${source.payload?.file ?? source.payload?.stagedName ?? ''}`
        : ''
      const [url, setUrl] = useState(() => (key ? mediaCache.get(key) ?? null : null))
      const [failed, setFailed] = useState(false)

      useEffect(() => {
        if (!key) {
          setUrl(null)
          setFailed(false)
          return undefined
        }
        const cached = mediaCache.get(key)
        if (cached) {
          setUrl(cached)
          setFailed(false)
          return undefined
        }
        let alive = true
        setUrl(null)
        setFailed(false)
        callRpc(rpcRef, source.endpoint, source.payload)
          .then((value) => {
            if (!alive) return
            const next = URL.createObjectURL(base64ToBlob(value.dataBase64, source.mediaType))
            rememberMedia(key, next)
            setUrl(next)
          })
          .catch(() => {
            if (alive) setFailed(true)
          })
        return () => {
          alive = false
        }
      }, [key])

      return { url, failed }
    }

    /**
     * 一张图。
     *
     * 单独成一个组件，是因为 hook 不能在 map 里调 —— 九宫格那边一格一个。
     * 拿不到图时不留虚线占位框（那是上一版的毛病），只留一块同色的空。
     */
    function Photo({ source, style, alt, rounded }) {
      const media = useMedia(source)
      if (media.failed) {
        return React.createElement(
          'div',
          {
            style: {
              ...style,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              textAlign: 'center',
              padding: 6,
              color: 'var(--dsw-alias-label-tertiary)',
              background: 'var(--dsw-alias-bg-layer-3)',
              borderRadius: rounded ?? 0,
            },
          },
          '图没取回来',
        )
      }
      if (!media.url) {
        return React.createElement('div', {
          style: { ...style, background: 'var(--dsw-alias-bg-layer-3)', borderRadius: rounded ?? 0 },
        })
      }
      return React.createElement('img', {
        src: media.url,
        alt: alt ?? '',
        style,
        loading: 'lazy',
      })
    }

    // ── 音频 ────────────────────────────────────────────────────────────────

    /**
     * 「试听」必须真能播才算数。
     *
     * 所以这里不写「合成成功」四个字，而是摆一个真的 <audio>：点了有声音，
     * 听过大半才让点「我听过了」。播不出来（文件没了）也照实说 ——
     * 上一版就是把「合成成功」当成了「能听」，用户点开一片安静。
     */
    function AudioBar({ example, busy, handlers, t }) {
      const audio = example.audio
      const reviewed = Boolean(example.audioReview?.listened)
      const audioRef = useRef(null)
      const [playing, setPlaying] = useState(false)
      const [heard, setHeard] = useState(reviewed)
      const [failed, setFailed] = useState(false)
      const [current, setCurrent] = useState(0)
      const file = audio?.file
      const media = useMedia(
        file ? { endpoint: 'image.bytes', payload: { kind: 'audio', file }, mediaType: 'audio/mpeg' } : null,
      )

      useEffect(() => {
        setHeard(reviewed)
        setFailed(false)
        setCurrent(0)
        setPlaying(false)
      }, [file, reviewed])

      useEffect(() => {
        if (media.failed) setFailed(true)
      }, [media.failed])

      if (!file) {
        return React.createElement(
          'div',
          { style: styles.actions },
          React.createElement(
            'button',
            { style: styles.buttonPrimary, onClick: () => handlers.synthesize(example.ord), disabled: busy },
            busy ? t('action.synthBusy') : t('action.playAudio'),
          ),
          React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, t('label.noAudio')),
        )
      }

      const toggle = async () => {
        const element = audioRef.current
        if (!element) return
        if (element.paused) {
          try {
            await element.play()
            setFailed(false)
          } catch {
            setFailed(true)
          }
        } else {
          element.pause()
        }
      }

      return React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%' } },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          React.createElement(
            'button',
            {
              style: {
                ...styles.button,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px 0 7px',
                opacity: media.url ? 1 : 0.5,
                cursor: media.url ? 'pointer' : 'progress',
              },
              onClick: media.url ? toggle : undefined,
              'aria-label': playing ? t('action.playing') : t('action.playAudio'),
            },
            React.createElement(Icon, { name: playing ? 'stop' : 'play', size: 13 }),
            secondsText(audio.seconds || current),
          ),
          React.createElement(
            'span',
            { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
            `${audio.engine ?? ''}${audio.voice ? ` · ${audio.voice}` : ''}`,
          ),
          reviewed
            ? React.createElement(
                'button',
                { style: { ...styles.button, height: 28, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }, onClick: () => handlers.unlockAudio(example.ord) },
                React.createElement(Icon, { name: 'check', size: 13 }),
                t('action.unlockAudio'),
              )
            : React.createElement(
                'button',
                {
                  style: { ...styles.buttonPrimary, height: 28, fontSize: 12, opacity: heard ? 1 : 0.45, cursor: heard ? 'pointer' : 'not-allowed' },
                  disabled: !heard,
                  onClick: heard ? () => handlers.confirmAudio(example.ord) : undefined,
                  title: heard ? t('action.markListened') : t('hint.pressPlayFirst'),
                },
                t('action.markListened'),
              ),
        ),
        React.createElement('audio', {
          ref: audioRef,
          src: media.url || undefined,
          preload: 'none',
          style: { display: 'none' },
          onTimeUpdate: (event) => {
            const element = event.currentTarget
            setCurrent(element.currentTime)
            const total = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : audio.seconds
            if (total > 0 && element.currentTime > 0.6 * total) setHeard(true)
          },
          onEnded: () => {
            setPlaying(false)
            setHeard(true)
          },
          onPlay: () => setPlaying(true),
          onPause: () => setPlaying(false),
          onError: () => {
            setFailed(true)
            setPlaying(false)
          },
        }),
        failed
          ? React.createElement(
              'div',
              { style: { ...styles.banner('error'), marginBottom: 0 } },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement('span', null, t('error.audioUnplayable')),
            )
          : null,
      )
    }

    // ── 配图 ────────────────────────────────────────────────────────────────

    function toBase64(buffer) {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      const chunk = 0x8000
      for (let index = 0; index < bytes.length; index += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk))
      }
      return btoa(binary)
    }

    function CandidateGrid({ example, busy, handlers, t }) {
      const [picked, setPicked] = useState(null)
      const fileRef = useRef(null)
      const narrow = useNarrow()

      const upload = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        handlers.upload(example.ord, { dataBase64: toBase64(await file.arrayBuffer()), mediaType: file.type })
      }

      return React.createElement(
        'div',
        { style: narrow ? { ...styles.grid, ...styles.gridNarrow } : styles.grid },
        example.imageCandidates.map((candidate) =>
          React.createElement(
            'button',
            {
              key: candidate.stagedName,
              style: styles.cell(picked === candidate.stagedName),
              onClick: () => setPicked(candidate.stagedName),
              onDoubleClick: () => handlers.pick(example.ord, candidate.stagedName),
              title: `${candidate.source} · ${candidate.width}×${candidate.height}${candidate.license ? ` · ${candidate.license}` : ''}`,
            },
            React.createElement(Photo, {
              source: {
                endpoint: 'candidate.bytes',
                payload: { stagedName: candidate.stagedName },
                mediaType: mediaTypeOf(candidate.stagedName),
              },
              alt: candidate.query || '',
              style: styles.cellImage,
            }),
          ),
        ),
        React.createElement(
          'div',
          { style: { gridColumn: '1 / -1', display: 'flex', gap: 4, paddingTop: 2, flexWrap: 'wrap' } },
          React.createElement(
            'button',
            {
              style: { ...styles.buttonPrimary, height: 26, fontSize: 11, padding: '0 8px', opacity: picked ? 1 : 0.45 },
              disabled: !picked || busy,
              onClick: () => handlers.pick(example.ord, picked),
            },
            t('action.lockImage'),
          ),
          React.createElement(
            'button',
            { style: { ...styles.button, height: 26, fontSize: 11, padding: '0 8px' }, onClick: () => handlers.candidates(example.ord), disabled: busy },
            t('action.moreCandidates'),
          ),
          React.createElement(
            'button',
            { style: { ...styles.button, height: 26, fontSize: 11, padding: '0 8px' }, onClick: () => fileRef.current?.click(), disabled: busy },
            t('action.upload'),
          ),
          React.createElement('input', {
            ref: fileRef,
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp',
            style: { display: 'none' },
            onChange: upload,
          }),
        ),
      )
    }

    function ImageSide({ example, busy, handlers, t }) {
      const narrow = useNarrow()
      const image = example.image
      if (image) {
        return React.createElement(
          'div',
          { style: narrow ? { ...styles.media, flex: '1 1 auto' } : styles.media },
          React.createElement(Photo, {
            source: {
              endpoint: 'image.bytes',
              payload: { kind: 'images', file: image.file },
              mediaType: mediaTypeOf(image.file),
            },
            alt: example.sceneZh || '',
            style: styles.image,
          }),
          React.createElement(
            'button',
            {
              style: {
                position: 'absolute',
                right: 8,
                bottom: 8,
                height: 26,
                padding: '0 10px',
                fontSize: 11,
                borderRadius: 999,
                border: '1px solid var(--dsw-alias-border-l3)',
                background: 'var(--dsw-alias-bg-layer-1)',
                color: 'var(--dsw-alias-label-primary)',
                cursor: 'pointer',
                opacity: 0.92,
              },
              onClick: () => handlers.unlockImage(example.ord),
            },
            t('action.unlockImage'),
          ),
        )
      }
      if (example.imageCandidates?.length > 0) {
        return React.createElement(CandidateGrid, { example, busy, handlers, t })
      }
      return React.createElement(
        'div',
        {
          style: narrow
            ? { flex: '1 1 auto', padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
            : {
                flex: '0 0 42%',
                padding: '12px 16px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                borderRight: '1px solid var(--dsw-alias-border-l2)',
              },
        },
        React.createElement(
          'button',
          { style: styles.button, onClick: () => handlers.candidates(example.ord), disabled: busy },
          busy ? t('action.moreBusy') : t('action.findImages'),
        ),
        React.createElement(
          'span',
          { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
          t('hint.noCandidates'),
        ),
      )
    }

    function ExampleCard({ example, busy, handlers, t }) {
      const narrow = useNarrow()
      const locked = Boolean(example.imageReview?.by)
      const image = example.image
      return React.createElement(
        'div',
        { style: narrow ? { ...styles.card, ...styles.cardNarrow } : styles.card },
        React.createElement(ImageSide, { example, busy, handlers, t }),
        React.createElement(
          'div',
          { style: styles.cardText },
          React.createElement('p', { style: styles.sentence }, example.sentence),
          React.createElement('div', { style: styles.scene }, example.sceneZh),
          React.createElement(
            'div',
            { style: styles.meta },
            example.register ? React.createElement(Tag, null, example.register) : null,
            locked ? React.createElement(Tag, null, t('label.reviewed')) : null,
            image?.author ? React.createElement('span', null, `${t('label.author')} ${image.author}`) : null,
            image?.license ? React.createElement('span', null, image.license) : null,
            image?.creditUrl
              ? React.createElement(
                  'a',
                  {
                    href: image.creditUrl,
                    target: '_blank',
                    rel: 'noreferrer noopener',
                    style: { color: 'var(--dsw-alias-brand-primary)' },
                  },
                  t('label.credit'),
                )
              : null,
          ),
          React.createElement('div', { style: styles.actions }, React.createElement(AudioBar, { example, busy, handlers, t })),
        ),
      )
    }

    // ── 主面板 ──────────────────────────────────────────────────────────────

    function PackDetail({ detail, busy, handlers, t }) {
      if (!detail) return React.createElement('div', { style: styles.empty }, t('label.empty'))
      const total = detail.examples.length
      const reviewed = detail.examples.filter((one) => one.imageReview?.by && one.audioReview?.listened).length
      return React.createElement(
        'div',
        null,
        React.createElement('h2', { style: styles.target }, detail.target),
        React.createElement(
          'div',
          { style: styles.metaRow },
          React.createElement(Tag, null, t(`kind.${detail.kind}`)),
          detail.ipa ? React.createElement(Tag, null, detail.ipa) : null,
          React.createElement(Tag, null, t(`status.${detail.status}`)),
          React.createElement(
            'span',
            { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } },
            `${reviewed}/${total} ${t('label.reviewed')}`,
          ),
        ),
        detail.gloss ? React.createElement('div', { style: styles.gloss }, detail.gloss) : null,
        detail.problems?.length
          ? React.createElement(
              'div',
              { style: { ...styles.banner('warn'), marginTop: 12 } },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement('span', null, detail.problems.join('；')),
            )
          : null,
        React.createElement('div', { style: styles.sectionTitle }, t('label.examples')),
        detail.examples.map((example) =>
          React.createElement(ExampleCard, { key: example.ord, example, busy, handlers, t }),
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' } },
          React.createElement(
            'button',
            { style: { ...styles.buttonPrimary, opacity: reviewed < total ? 0.45 : 1 }, onClick: () => handlers.pack(), disabled: reviewed < total || busy },
            t('action.pack'),
          ),
          React.createElement(
            'button',
            {
              style: styles.button,
              onClick: () => handlers.install(),
              disabled: (detail.status !== 'packed' && detail.status !== 'installed') || busy,
            },
            t('action.install'),
          ),
          React.createElement(
            'button',
            { style: styles.button, onClick: () => handlers.synthesizeAll(), disabled: busy },
            t('action.synthAll'),
          ),
          React.createElement('button', { style: styles.button, onClick: () => handlers.remove() }, t('action.delete')),
        ),
        reviewed < total
          ? React.createElement(
              'div',
              { style: { ...styles.banner('warn'), marginTop: 10 } },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement('span', null, t('hint.reviewRequired')),
            )
          : null,
        detail.pack?.dir ? React.createElement('div', { style: { ...styles.banner('info'), marginTop: 10 } }, `${t('label.packDir')}：${detail.pack.dir}`) : null,
        detail.install?.lessonId
          ? React.createElement(
              'div',
              { style: { ...styles.banner('info'), marginTop: 6 } },
              `Etude #${detail.install.lessonId} · ${detail.install.images} ${t('label.images')} · ${detail.install.audios} ${t('label.audios')}${detail.install.audioError ? ` · ${detail.install.audioError}` : ''}`,
            )
          : null,
      )
    }

    function FactoryPanel({ rpc, t }) {
      const factory = useFactory(rpc)
      const { state, detail, selected, setSelected, job, error, setError } = factory
      const [target, setTarget] = useState('')
      const busy = Boolean(job && job.status === 'running')

      useEffect(() => {
        if (!selected && state.packs?.length > 0) setSelected(state.packs[0].id)
      }, [state.packs, selected, setSelected])

      const handlers = useMemo(
        () => ({
          candidates: (ord) => factory.runJob('pack.candidates', { id: selected, ord }),
          pick: (ord, stagedName) => factory.act('pack.pick', { id: selected, ord, stagedName }),
          unlockImage: (ord) => factory.act('pack.unlockImage', { id: selected, ord }),
          upload: (ord, payload) => factory.act('pack.upload', { id: selected, ord, ...payload }),
          synthesize: (ord) => factory.runJob('pack.audio', { id: selected, ord }),
          synthesizeAll: () => factory.runJob('pack.audioAll', { id: selected }),
          confirmAudio: (ord) => factory.act('pack.confirmAudio', { id: selected, ord }),
          unlockAudio: (ord) => factory.act('pack.unlockAudio', { id: selected, ord }),
          pack: () => factory.runJob('pack.pack', { id: selected }),
          install: () => factory.runJob('pack.install', { id: selected }),
          remove: async () => {
            const pack = state.packs?.find((one) => one.id === selected)
            if (!window.confirm(`${t('action.deleteConfirm')}\n${pack?.target ?? ''}`)) return
            await factory.act('pack.delete', { id: selected })
            setSelected(null)
          },
        }),
        [factory, selected, state.packs, t, setSelected],
      )

      const create = async () => {
        const text = target.trim()
        if (!text || busy) return
        setTarget('')
        await factory.runJob('pack.create', { target: text })
      }

      return React.createElement(
        'div',
        { style: styles.root },
        React.createElement(
          'div',
          { style: styles.header },
          React.createElement(Icon, { name: 'factory', size: 17 }),
          React.createElement('span', { style: styles.title }, t('nav.title')),
          React.createElement('span', { style: styles.subtitle }, state.root || t('nav.subtitle')),
          React.createElement('input', {
            style: styles.input,
            value: target,
            placeholder: t('nav.placeholder'),
            'aria-label': t('nav.placeholder'),
            onChange: (event) => setTarget(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') create()
            },
          }),
          React.createElement(
            'button',
            { style: { ...styles.buttonPrimary, opacity: busy || !target.trim() ? 0.5 : 1 }, onClick: create, disabled: busy || !target.trim() },
            busy ? t('action.createBusy') : t('action.create'),
          ),
          React.createElement(
            'button',
            { style: styles.button, onClick: () => factory.reload(), title: t('action.refresh'), 'aria-label': t('action.refresh') },
            React.createElement(Icon, { name: 'refresh', size: 14 }),
          ),
        ),
        React.createElement(
          'div',
          { style: styles.body },
          React.createElement(
            'div',
            { style: styles.list },
            state.packs?.length
              ? state.packs.map((pack) =>
                  React.createElement(
                    'button',
                    { key: pack.id, style: styles.listItem(selected === pack.id), onClick: () => setSelected(pack.id) },
                    React.createElement('span', { style: styles.listTarget }, pack.target),
                    React.createElement(
                      'span',
                      { style: styles.listMeta },
                      `${t(`status.${pack.status}`)} · ${pack.progress.images}/${pack.progress.total} 图 · ${pack.progress.audios}/${pack.progress.total} 音`,
                    ),
                  ),
                )
              : React.createElement('div', { style: styles.empty }, t('label.empty')),
          ),
          React.createElement(
            'div',
            { style: styles.detail },
            error
              ? React.createElement(
                  'div',
                  { style: styles.banner('error') },
                  React.createElement(Icon, { name: 'warning', size: 13 }),
                  React.createElement('span', { style: { flex: 1 } }, error),
                  React.createElement(
                    'button',
                    { style: { ...styles.button, height: 22, padding: '0 8px', fontSize: 11 }, onClick: () => setError(null) },
                    '×',
                  ),
                )
              : null,
            React.createElement(PackDetail, { detail, busy, handlers, t }),
          ),
        ),
        job
          ? React.createElement(
              'div',
              { style: styles.jobStrip },
              React.createElement('span', { style: styles.dot(job.status !== 'running') }),
              React.createElement('span', { style: { flex: '0 0 auto' } }, job.label),
              job.progress ? React.createElement('span', null, `${job.progress.done}/${job.progress.total}`) : null,
              React.createElement(
                'span',
                { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                job.log?.length ? job.log[job.log.length - 1] : '',
              ),
              job.status === 'running'
                ? React.createElement(
                    'button',
                    {
                      style: { ...styles.button, height: 22, padding: '0 8px', fontSize: 11 },
                      onClick: () => callRpc(rpc, 'job.cancel', { id: job.id }).catch(() => {}),
                    },
                    t('action.cancel'),
                  )
                : null,
            )
          : null,
      )
    }

    // ── 配置卡 ──────────────────────────────────────────────────────────────

    function ConfigPage({ form, t }) {
      const cfg = useForm(form)
      const value = cfg.snapshot?.value ?? {}
      const disabled = !cfg.writable

      const field = (label, key, options) =>
        React.createElement(
          'label',
          { key, style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13 } },
          React.createElement('span', { style: { width: 92, color: 'var(--dsw-alias-label-tertiary)' } }, label),
          options
            ? React.createElement(
                'select',
                {
                  disabled,
                  value: value[key] ?? options[0].value,
                  onChange: (event) => cfg.set(key, event.target.value),
                  style: { ...styles.input, flex: '0 0 auto', width: 210, height: 30, padding: '0 8px' },
                },
                options.map((option) => React.createElement('option', { key: option.value, value: option.value }, option.label)),
              )
            : React.createElement('input', {
                disabled,
                defaultValue: value[key] ?? '',
                onBlur: (event) => cfg.set(key, event.target.value),
                style: { ...styles.input, flex: '0 0 auto', width: 210, height: 30 },
              }),
        )

      return React.createElement(
        'div',
        { style: { padding: '2px 0 8px' } },
        field(t('config.engine'), 'ttsEngine', [
          { value: 'auto', label: t('config.engineAuto') },
          { value: 'edge', label: t('config.engineEdge') },
          { value: 'openai', label: t('config.engineOpenAI') },
        ]),
        field(t('config.voice'), 'ttsVoiceEdge'),
        field(t('config.rate'), 'rate'),
        field(t('config.volume'), 'volume'),
        field(t('config.examples'), 'examplesPerLesson'),
        field(t('config.etudeUrl'), 'etudeUrl'),
        React.createElement('div', { style: { fontSize: 11, lineHeight: 1.7, color: 'var(--dsw-alias-label-tertiary)', marginTop: 4 } }, t('config.hint')),
      )
    }

    // ── 文案 ────────────────────────────────────────────────────────────────

    const LOCALE = {
      zh: {
        'nav.title': '卡片工厂',
        'nav.subtitle': '还没有账本，先造一个包',
        'nav.placeholder': '一个词、一个说法，或者一整句…',
        'action.create': '造一个包',
        'action.createBusy': '正在造…',
        'action.refresh': '刷新',
        'action.cancel': '取消',
        'action.playAudio': '合成语音',
        'action.synthBusy': '合成中…',
        'action.playing': '播放中',
        'action.synthAll': '补齐全部语音',
        'action.markListened': '我听过了',
        'action.unlockAudio': '取消确认',
        'action.unlockImage': '换一张',
        'action.lockImage': '用这张',
        'action.moreCandidates': '换一批',
        'action.moreBusy': '正在找…',
        'action.upload': '自己上传',
        'action.pack': '打包',
        'action.install': '装进 Etude',
        'action.delete': '删掉这个包',
        'action.deleteConfirm': '真删掉这个卡片包？里面的图片和语音也会没。',
        'action.findImages': '找候选图',
        'status.generating': '正在造',
        'status.text': '待配素材',
        'status.media': '补素材中',
        'status.packed': '已打包',
        'status.installed': '已安装',
        'status.failed': '失败',
        'label.empty': '左边空着。上面输入一个词，回车。',
        'label.examples': '例句',
        'label.reviewed': '已确认',
        'label.author': '作者',
        'label.credit': '出处',
        'label.packDir': '包目录',
        'label.images': '张图',
        'label.audios': '条音',
        'label.noAudio': '还没有语音',
        'kind.word': '单词',
        'kind.phrase': '短语',
        'kind.sentence': '整句',
        'hint.reviewRequired': '配图要点一张、语音要听一遍，这一步只能人来做。',
        'hint.noCandidates': '还没有候选图。',
        'hint.pressPlayFirst': '先点播放听完，再确认。',
        'error.audioUnplayable': '这个音频放不出来。可能文件没了，重新合成一次。',
        'config.engine': '语音引擎',
        'config.engineAuto': '自动（主 TTS 优先，Edge 兜底）',
        'config.engineEdge': '只用 Edge',
        'config.engineOpenAI': '主 TTS 优先',
        'config.voice': 'Edge 音色',
        'config.rate': '语速',
        'config.volume': '音量',
        'config.examples': '每包条数',
        'config.etudeUrl': 'Etude 地址',
        'config.hint': '语速和音量对 Edge 生效；OpenAI 兼容的那类接口只有语速（换成 speed），没有音量。',
      },
      en: {
        'nav.title': 'Card factory',
        'nav.subtitle': 'No ledger yet — make a pack first',
        'nav.placeholder': 'A word, a phrase, or a whole sentence…',
        'action.create': 'Create pack',
        'action.createBusy': 'Creating…',
        'action.refresh': 'Refresh',
        'action.cancel': 'Cancel',
        'action.playAudio': 'Synthesize',
        'action.synthBusy': 'Synthesizing…',
        'action.playing': 'Playing',
        'action.synthAll': 'Synthesize all',
        'action.markListened': 'I listened',
        'action.unlockAudio': 'Undo',
        'action.unlockImage': 'Replace',
        'action.lockImage': 'Use this one',
        'action.moreCandidates': 'More',
        'action.moreBusy': 'Searching…',
        'action.upload': 'Upload',
        'action.pack': 'Build pack',
        'action.install': 'Install into Etude',
        'action.delete': 'Delete pack',
        'action.deleteConfirm': 'Delete this pack? Its images and audio go too.',
        'action.findImages': 'Find images',
        'status.generating': 'Generating',
        'status.text': 'Needs media',
        'status.media': 'Filling media',
        'status.packed': 'Packed',
        'status.installed': 'Installed',
        'status.failed': 'Failed',
        'label.empty': 'Nothing here. Type a word above and press Enter.',
        'label.examples': 'Examples',
        'label.reviewed': 'confirmed',
        'label.author': 'By',
        'label.credit': 'Source',
        'label.packDir': 'Pack dir',
        'label.images': 'images',
        'label.audios': 'audio',
        'label.noAudio': 'No audio yet',
        'kind.word': 'word',
        'kind.phrase': 'phrase',
        'kind.sentence': 'sentence',
        'hint.reviewRequired': 'Someone has to pick an image and listen to each clip. That part is not automatable.',
        'hint.noCandidates': 'No candidates yet.',
        'hint.pressPlayFirst': 'Play it first, then confirm.',
        'error.audioUnplayable': 'This clip will not play. Re-synthesize it.',
        'config.engine': 'Voice engine',
        'config.engineAuto': 'Auto (main TTS first, Edge fallback)',
        'config.engineEdge': 'Edge only',
        'config.engineOpenAI': 'Prefer main TTS',
        'config.voice': 'Edge voice',
        'config.rate': 'Rate',
        'config.volume': 'Volume',
        'config.examples': 'Per pack',
        'config.etudeUrl': 'Etude URL',
        'config.hint': 'Rate and volume apply to Edge. OpenAI-compatible TTS only takes speed — no volume.',
      },
    }

    const inject = ['slots', 'locale', 'connection']

    function apply(ctx) {
      const connection = ctx.get('connection')
      const rpc = connection?.rpc
      // 组件的 media 读取走这个模块级引用（一个页面只有一条连接）。
      rpcRef = rpc ?? null

      ctx.effect(() => ctx.locale.register(NS, { zh: LOCALE.zh, en: LOCALE.en }), 'dsh-etude: copy')
      const bound = ctx.locale.bind(NS)
      const t = (key) => {
        try {
          const value = bound(key)
          if (value && value !== key) return value
        } catch {
          // 词典没注册上就用内置的
        }
        return LOCALE.zh[key] ?? LOCALE.en[key] ?? key
      }

      ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: NS, locale: NS }, (owner) =>
          React.createElement(FactoryPanel, { rpc, t, ...owner }),
        ),
      )

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          { name: 'sidebar.panellist', id: NS, order: 30, label: () => t('nav.title'), locale: NS },
          (owner) => React.createElement(Icon, { name: 'factory', size: typeof owner?.size === 'number' ? owner.size : 18 }),
        ),
      )

      // 配置卡：DSH >= 0.1.6 才有 configForms。没有就算了 —— 面板照用，
      // 只是调不了音色，属于「少一个旋钮」而不是「用不了」。
      const configForms = ctx.get('configForms')
      if (configForms && typeof configForms.get === 'function') {
        const form = configForms.get(CONFIG_NS)
        ctx.effect(
          () =>
            configForms.whileServed([CONFIG_NS], () =>
              ctx.slots.inject('plugins.bundle.config', () =>
                ctx.slots.register({ name: 'plugins.bundle.config', key: NS, locale: NS }, (owner) =>
                  React.createElement(ConfigPage, { form, t, ...owner }),
                ),
              ),
            ),
          'dsh-etude: config page',
        )
      }
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
