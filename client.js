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
      // 窄屏：264px 的固定列表会把详情挤成一条缝（360px 时详情只剩不到 100px，
      // 中文标题会被压成一个字一行）。窄屏改成横向一溜卡片，详情拿满宽度。
      listNarrow: {
        width: '100%',
        flex: '0 0 auto',
        maxHeight: 120,
        borderRight: 'none',
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
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
      // 正在挑图时九宫格铺满整张卡：三列挤在 42% 那条里时每格只有一百来像素，
      // 照片这东西小于 150px 就看不出拍的是什么了，等于让人瞎点。
      gridWide: {
        flex: 'none',
        width: '100%',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 6,
        padding: '12px 16px 16px',
        borderTop: '1px solid var(--dsw-alias-border-l2)',
        alignContent: 'start',
      },
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
      // 顶上的任务条：一眼能看见、不占高度、跑完自动消失。
      jobBar: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '8px 16px',
        fontSize: 12,
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
        background: 'var(--dsw-alias-bg-layer-3)',
        color: 'var(--dsw-alias-label-secondary)',
      },
      // 五步流水线：横向摊开，每一步自己一句话说清「缺什么/要你做什么」。
      pipeline: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 },
      pipelineRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 6,
      },
      stage: (state) => ({
        border: `1px solid ${state === 'todo' ? 'var(--dsw-alias-border-l3)' : 'var(--dsw-alias-border-l4)'}`,
        background: state === 'gate' || state === 'ready' ? 'var(--dsw-alias-bg-layer-3)' : 'transparent',
        borderRadius: 8,
        padding: '8px 9px 9px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        minWidth: 0,
      }),
      stageHead: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
      stageNo: {
        fontSize: 10,
        color: 'var(--dsw-alias-label-tertiary)',
        fontVariantNumeric: 'tabular-nums',
      },
      stageLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
      },
      stageCount: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', fontVariantNumeric: 'tabular-nums' },
      stageHint: {
        fontSize: 11,
        lineHeight: 1.55,
        color: 'var(--dsw-alias-label-tertiary)',
        overflowWrap: 'anywhere',
      },
      pipelineNow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11.5,
        color: 'var(--dsw-alias-label-secondary)',
        padding: '6px 9px',
        borderRadius: 6,
        background: 'var(--dsw-alias-bg-layer-3)',
      },
      listNote: {
        padding: '14px 12px',
        fontSize: 11.5,
        lineHeight: 1.7,
        color: 'var(--dsw-alias-label-tertiary)',
      },
      dot: (on) => ({
        width: 7,
        height: 7,
        borderRadius: 999,
        background: on ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-border-l4)',
        flex: '0 0 auto',
      }),
      // 两个区：制卡 / 学习。做成顶栏下面一条标签，不是侧栏菜单 ——
      // 这两件事是完全不同的活儿，但看的是同一批包，来回切要一眼就到。
      tabs: {
        display: 'flex',
        gap: 4,
        padding: '7px 16px 0',
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
      },
      tab: (active) => ({
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-tertiary)',
        borderBottom: active ? '2px solid var(--dsw-alias-brand-primary)' : '2px solid transparent',
        padding: '6px 10px 7px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        marginBottom: -1,
      }),
      searchRow: {
        display: 'flex',
        gap: 6,
        padding: '8px 10px',
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
        flex: '0 0 auto',
      },
      voiceRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '7px 0 2px',
        fontSize: 12,
        color: 'var(--dsw-alias-label-tertiary)',
      },
      select: {
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--dsw-alias-border-l3)',
        background: 'var(--dsw-alias-bg-layer-3)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: 12,
        padding: '0 6px',
        maxWidth: 240,
      },
      // 学习区：一屏一张，图大、字大、没有按钮堆。这里只有一个动作 —— 听。
      studyHead: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--dsw-alias-border-l3)',
      },
      studyTarget: {
        fontSize: '1.15rem',
        fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
      },
      studyKeys: {
        fontSize: 11,
        color: 'var(--dsw-alias-label-tertiary)',
      },
      studyCount: {
        fontSize: 12,
        color: 'var(--dsw-alias-label-tertiary)',
      },
      studyAnswer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      },
      studyZh: {
        fontSize: 14,
        lineHeight: 1.6,
        textAlign: 'center',
        color: 'var(--dsw-alias-label-secondary)',
        maxWidth: 640,
      },
      studyTags: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
      },
      study: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
      studyStage: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '20px 24px',
        // 翻开之后内容变多（句子 + 中文 + 标签 + 播放键），一屏放不下时
        // 让这一块自己滚，别把底下的「上一张 / 下一张」顶出去。
        overflowY: 'auto',
      },
      studyShot: {
        width: '100%',
        maxWidth: 720,
        maxHeight: '52vh',
        minHeight: 0,
        objectFit: 'cover',
        borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-3)',
        flex: '0 0 auto',
      },
      studySentence: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '1.7rem',
        lineHeight: 1.35,
        textAlign: 'center',
        color: 'var(--dsw-alias-label-primary)',
        maxWidth: 720,
      },
      studyScene: {
        fontSize: 13,
        lineHeight: 1.7,
        textAlign: 'center',
        color: 'var(--dsw-alias-label-tertiary)',
        maxWidth: 640,
      },
      studyBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '10px 16px 14px',
        borderTop: '1px solid var(--dsw-alias-border-l3)',
      },
      empty: {
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 13,
        lineHeight: 1.9,
      },
      // 一个包都没有时的居中空态：图标先给个落脚点，标题说清现在是什么状态，
      // 底下一行说第一步做什么。三层的落差靠字号与颜色，不靠边框。
      emptyBig: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '96px 24px',
        textAlign: 'center',
        color: 'var(--dsw-alias-label-tertiary)',
      },
      emptyIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        display: 'grid',
        placeItems: 'center',
        border: '1px solid var(--dsw-alias-border-l2)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-secondary)',
        marginBottom: 2,
      },
      emptyTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
      },
      emptyHint: {
        fontSize: 13,
        lineHeight: 1.8,
        color: 'var(--dsw-alias-label-tertiary)',
        maxWidth: 380,
      },
    }

    // ── 数据 ────────────────────────────────────────────────────────────────

    // `rpc` 可能是通道本身，也可能是一个「取通道」的函数。
    // 后者是为了不在 apply 那一刻就把 connection 抓成常量 —— 那个时机
    // 万一 connection 还没就绪，抓到的就是 undefined，然后界面永久空着，
    // 用户只看见一块没有内容的区域，跟坏了没区别。
    async function callRpc(rpc, endpoint, payload) {
      const bridge = typeof rpc === 'function' ? rpc() : rpc
      if (!bridge || typeof bridge.call !== 'function') {
        throw new Error('宿主连接还没就绪。刷新一下页面再点我；还是空的话，去 设置 → 插件 看 dsh-etude 是不是 active。')
      }
      let timer = null
      const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`宿主 15 秒没回应（${endpoint}）。看一眼宿主日志，或者刷新页面重试。`)), 15000)
      })
      // payload 一定要是个对象。发 `undefined` 的时候，宿主的请求校验会
      // 直接回一句 `invalid client-request message` —— 面板上就只剩这行
      // 字，什么数据都拿不到。宁可发包空的 `{}`。
      const body = payload === undefined || payload === null ? {} : payload
      let result
      try {
        result = await Promise.race([bridge.call(RPC_CHANNEL, endpoint, body), timeout])
      } finally {
        if (timer) clearTimeout(timer)
      }
      if (!result || result.ok !== true) {
        const message = result?.error?.message ?? '接口调用失败'
        const error = new Error(
          message === 'invalid client-request message'
            ? `宿主说请求格式不对（${endpoint}）。把这句话发给我。`
            : message,
        )
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
        let tick = 0
        const timer = setInterval(async () => {
          tick += 1
          try {
            // 边做边看：任务还在跑的时候也把详情拉一遍，让已经落地的
            // 候选图/语音当场出现在卡片上，不用等整个任务结束。
            if (selected && tick % 3 === 0) {
              const live = await callRpc(rpc, 'pack.get', { id: selected }).catch(() => null)
              if (alive && live) setDetail(live)
            }
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
    // 取 RPC 通道的函数（不是通道本身）：apply 那一刻 connection 可能还没就绪，
    // 抓成常量就会永久 undefined。
    let rpcGetter = null
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
        callRpc(rpcGetter, source.endpoint, source.payload)
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

    function CandidateGrid({ example, busy, handlers, t, wide }) {
      const [picked, setPicked] = useState(null)
      const [typed, setTyped] = useState('')
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
        { style: wide ? { ...styles.grid, ...styles.gridWide } : narrow ? { ...styles.grid, ...styles.gridNarrow } : styles.grid },
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
              // 故意不随 busy 禁用：批量找图的时候人正是要边等边点。
              // 一键灰掉等于逼人干等到整批跑完才能动手。
              disabled: !picked,
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
        // 机器猜的词经常猜歪（「放弃家人」猜成咖啡座）。所以给一个输入框：
        // 自己写要搜什么，中英文都行；写中文时图库命中率会低一些，但比
        // 一遍遍点「换一批」碰运气强。
        React.createElement(
          'div',
          { style: { gridColumn: '1 / -1', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', paddingTop: 2 } },
          React.createElement('input', {
            style: { ...styles.input, height: 26, fontSize: 11.5, flex: '1 1 150px', minWidth: 120 },
            value: typed,
            placeholder: t('hint.searchImage'),
            'aria-label': t('hint.searchImage'),
            onChange: (event) => setTyped(event.target.value),
            onKeyDown: (event) => {
              if (event.key !== 'Enter') return
              const text = typed.trim()
              if (!text) return
              setTyped('')
              handlers.candidatesWith(example.ord, text)
            },
          }),
          React.createElement(
            'button',
            {
              style: { ...styles.button, height: 26, fontSize: 11, padding: '0 8px', opacity: typed.trim() ? 1 : 0.45 },
              disabled: busy || !typed.trim(),
              onClick: () => {
                const text = typed.trim()
                if (!text) return
                setTyped('')
                handlers.candidatesWith(example.ord, text)
              },
            },
            t('action.searchThis'),
          ),
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
      // 正在挑图 = 没图但有候选：这时卡片改成上下布局，九宫格铺满整张卡。
      const picking = !image && example.imageCandidates?.length > 0
      const stack = narrow || picking
      return React.createElement(
        'div',
        { style: stack ? { ...styles.card, ...styles.cardNarrow } : styles.card },
        picking ? null : React.createElement(ImageSide, { example, busy, handlers, t }),
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
        picking
          ? React.createElement(CandidateGrid, { example, busy, handlers, t, wide: !narrow })
          : null,
      )
    }

    // ── 兜底：渲染炸了也要看得见 ────────────────────────────────────────────
    // 不加这一层的话，任何一处渲染异常都会让整块面板变成空白，
    // 用户看到的就是「点了卡片工厂，里面什么都没有」—— 报不出原因，
    // 也看不出是 bug。宁可摊一句丑话，也不给一块白板。
    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failure: null }
      }

      static getDerivedStateFromError(failure) {
        return { failure }
      }

      render() {
        if (this.state.failure) {
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              { style: styles.banner('error') },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement(
                'span',
                { style: { flex: 1 } },
                `面板渲染出错：${this.state.failure?.message ?? String(this.state.failure)}`,
              ),
            ),
            React.createElement(
              'div',
              { style: { marginTop: 10, fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' } },
              '把上面这句原文发给我就行。想先自救就刷新页面。',
            ),
          )
        }
        return this.props.children
      }
    }

    // ── 流水线 ──────────────────────────────────────────────────────────────
    // 一个包从「一个词」到「一堆文件」要走五步，其中两步必须人来做。
    // 原来只看得到一句「4/8 已确认」，人根本不知道自己卡在哪一步、
    // 下一步该点哪里 —— 所以把五步摊开：每步的进度、状态、以及
    // 「这一步要你做什么」都写在一条上。

    const STAGE_ORDER = ['words', 'images', 'audio', 'pack', 'export']

    function buildStages(detail, t) {
      const total = detail.examples.length
      const withImage = detail.examples.filter((one) => one.image).length
      const withAudio = detail.examples.filter((one) => one.audio).length
      const picked = detail.examples.filter((one) => one.imageReview?.by).length
      const listened = detail.examples.filter((one) => one.audioReview?.listened === true).length
      // 有候选图但还没定图的条数 —— 这些正等着人点。
      const awaitingPick = detail.examples.filter((one) => !one.image && (one.imageCandidates?.length ?? 0) > 0).length
      const awaitingListen = detail.examples.filter((one) => one.audio && one.audioReview?.listened !== true).length
      const hasCandidates = detail.examples.some((one) => (one.imageCandidates?.length ?? 0) > 0 || one.image)
      const packed = Boolean(detail.pack?.dir)
      const exported = detail.export?.dir ?? null

      const stages = []
      stages.push({
        key: 'words',
        label: t('stage.words'),
        count: total ? `${total}` : '0',
        state: total === 0 ? 'doing' : 'done',
        hint: total === 0 ? t('stage.wordsDoing') : t('stage.wordsDone'),
      })
      stages.push({
        key: 'images',
        label: t('stage.images'),
        count: `${withImage}/${total || 0}`,
        state: total === 0 ? 'todo' : withImage === total ? 'done' : awaitingPick > 0 || hasCandidates ? 'gate' : 'todo',
        hint:
          total === 0
            ? t('stage.imagesWait')
            : withImage === total
              ? `${t('stage.imagesDone')}${picked === total ? '' : ` · ${t('stage.imagesUnreviewed').replace('{n}', String(total - picked))}`}`
              : awaitingPick > 0
                ? t('stage.imagesGate').replace('{n}', String(awaitingPick))
                : t('stage.imagesNeed'),
      })
      stages.push({
        key: 'audio',
        label: t('stage.audio'),
        count: `${withAudio}/${total || 0}`,
        state: total === 0 ? 'todo' : withAudio === total ? 'done' : awaitingListen > 0 ? 'gate' : 'todo',
        hint:
          total === 0
            ? t('stage.audioWait')
            : awaitingListen > 0
              ? t('stage.audioGate').replace('{n}', String(awaitingListen))
              : withAudio === total
                ? t('stage.audioDone')
                : t('stage.audioNeed'),
      })
      stages.push({
        key: 'pack',
        label: t('stage.pack'),
        count: packed ? '✓' : '—',
        state: packed ? 'done' : withImage === total && withAudio === total && total > 0 ? 'ready' : 'todo',
        hint: packed ? t('stage.packDone') : t('stage.packNeed'),
      })
      stages.push({
        key: 'export',
        label: t('stage.export'),
        count: exported ? '✓' : '—',
        state: exported ? 'done' : packed ? 'ready' : 'todo',
        hint: exported ? t('stage.exportDone') : packed ? t('stage.exportNeed') : t('stage.exportWait'),
      })
      return stages
    }

    function StageDot({ state }) {
      const color =
        state === 'done'
          ? 'var(--dsw-alias-state-success-primary)'
          : state === 'gate' || state === 'ready'
            ? 'var(--dsw-alias-brand-primary)'
            : state === 'doing'
              ? 'var(--dsw-alias-state-warning-primary, var(--dsw-alias-brand-primary))'
              : 'var(--dsw-alias-border-l4)'
      const ring = state === 'doing'
      return React.createElement('span', {
        style: {
          width: 8,
          height: 8,
          borderRadius: 4,
          flex: '0 0 auto',
          background: color,
          boxShadow: ring ? `0 0 0 3px ${color}22` : 'none',
        },
      })
    }

    function Pipeline({ detail, t }) {
      const stages = buildStages(detail, t)
      const current = stages.find((one) => one.state !== 'done')
      return React.createElement(
        'div',
        { style: styles.pipeline },
        React.createElement(
          'div',
          { style: styles.pipelineRow },
          stages.map((stage, index) =>
            React.createElement(
              'div',
              { key: stage.key, style: styles.stage(stage.state) },
              React.createElement(
                'div',
                { style: styles.stageHead },
                React.createElement(StageDot, { state: stage.state }),
                React.createElement('span', { style: styles.stageNo }, String(index + 1)),
                React.createElement('span', { style: styles.stageLabel }, stage.label),
                React.createElement('span', { style: styles.stageCount }, stage.count),
              ),
              React.createElement('div', { style: styles.stageHint }, stage.hint),
            ),
          ),
        ),
        current
          ? React.createElement(
              'div',
              { style: styles.pipelineNow },
              React.createElement(Icon, { name: 'warning', size: 12 }),
              React.createElement('span', null, `${t('stage.now')}：${current.label} — ${current.hint}`),
            )
          : React.createElement('div', { style: styles.pipelineNow }, `${t('stage.allDone')}`),
      )
    }

    // ── 主面板 ──────────────────────────────────────────────────────────────

    // ── 学习区 ──────────────────────────────────────────────────────────────

    /**
     * 学习区只做一件事：把卡一张一张摊开。
     *
     * 先给场景，句子藏起来 —— 想一下这个场合怎么说，再翻开对答案，
     * 这比「图片 + 译文」一起摆着让人读一遍有用得多。
     */
    function StudyPanel({ detail, t, onReopen }) {
      const [index, setIndex] = useState(0)
      const [revealed, setRevealed] = useState(false)
      const examples = detail?.examples ?? []
      const total = examples.length

      useEffect(() => {
        setIndex(0)
        setRevealed(false)
      }, [detail?.id])

      const safe = total === 0 ? 0 : Math.min(Math.max(index, 0), total - 1)
      const go = (delta) => {
        if (total === 0) return
        setIndex(Math.min(Math.max(safe + delta, 0), total - 1))
        setRevealed(false)
      }

      // 手放在键盘上练的时候不该去够鼠标：← → 换卡，空格翻开。
      useEffect(() => {
        if (total === 0 || typeof window === 'undefined') return undefined
        const onKey = (event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return
          const tag = event.target?.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            go(-1)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            go(1)
          } else if (event.key === ' ') {
            event.preventDefault()
            setRevealed(true)
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      })

      if (!detail) {
        return React.createElement('div', { style: styles.study }, React.createElement('div', { style: styles.emptyBig },
          React.createElement('div', { style: styles.emptyTitle }, t('study.noneTitle')),
          React.createElement('div', { style: styles.emptyHint }, t('study.none')),
        ))
      }

      if (total === 0) {
        return React.createElement('div', { style: styles.study }, React.createElement('div', { style: styles.emptyBig },
          React.createElement('div', { style: styles.emptyTitle }, t('study.emptyTitle')),
          React.createElement('div', { style: styles.emptyHint }, t('study.empty')),
        ))
      }

      const example = examples[safe]
      const variants = example.zhVariants ?? []
      const zh = variants.length > 0 ? variants[safe % variants.length] : ''

      return React.createElement(
        'div',
        { style: styles.study },
        React.createElement(
          'div',
          { style: styles.studyHead },
          React.createElement('span', { style: styles.studyTarget }, detail.target),
          React.createElement('span', { style: styles.tag }, t(`kind.${detail.kind}`)),
          React.createElement('div', { style: { flex: 1 } }),
          React.createElement(
            'button',
            { style: { ...styles.button, height: 26, fontSize: 12 }, onClick: onReopen, title: t('study.reopenHint') },
            t('study.reopen'),
          ),
        ),
        React.createElement(
          'div',
          { style: styles.studyStage },
          example.image
            ? React.createElement(Photo, {
                source: {
                  endpoint: 'image.bytes',
                  payload: { kind: 'images', file: example.image.file },
                  mediaType: mediaTypeOf(example.image.file),
                },
                alt: example.sentence,
                rounded: 12,
                style: styles.studyShot,
              })
            : React.createElement('div', { style: { ...styles.studyShot, height: 180 } }),
          // 场景是「提示」：翻开之前给场合，翻开之后就该让位给答案，
          // 不然跟中文说法一起摆着，同一句话读两遍。
          revealed
            ? null
            : React.createElement('div', { style: styles.studyScene }, example.sceneZh || example.sceneEn || ''),
          revealed
            ? React.createElement(
                'div',
                { style: styles.studyAnswer },
                React.createElement('div', { style: styles.studySentence }, example.sentence),
                zh ? React.createElement('div', { style: styles.studyZh }, zh) : null,
                React.createElement(
                  'div',
                  { style: styles.studyTags },
                  example.register ? React.createElement('span', { style: styles.tag }, example.register) : null,
                  example.voiceHint ? React.createElement('span', { style: styles.tag }, example.voiceHint) : null,
                ),
                React.createElement(StudyAudio, { example, t }),
              )
            : React.createElement(
                'button',
                { style: { ...styles.buttonPrimary, height: 34, fontSize: 13 }, onClick: () => setRevealed(true) },
                t('study.reveal'),
              ),
        ),
        React.createElement(
          'div',
          { style: styles.studyBar },
          React.createElement(
            'button',
            { style: { ...styles.button, height: 30 }, onClick: () => go(-1), disabled: safe === 0 },
            t('study.prev'),
          ),
          React.createElement('span', { style: styles.studyCount }, `${safe + 1} / ${total}`),
          React.createElement(
            'button',
            { style: { ...styles.button, height: 30 }, onClick: () => go(1), disabled: safe >= total - 1 },
            t('study.next'),
          ),
          React.createElement('span', { style: styles.studyKeys }, t('study.keys')),
        ),
      )
    }

    /** 学习区里的播放键：没有复核按钮，只有一个会响的按钮。 */
    function StudyAudio({ example, t }) {
      const audioRef = useRef(null)
      const [playing, setPlaying] = useState(false)
      const [failed, setFailed] = useState(false)
      const file = example.audio?.file
      const media = useMedia(file ? { endpoint: 'image.bytes', payload: { kind: 'audio', file }, mediaType: 'audio/mpeg' } : null)

      useEffect(() => {
        setPlaying(false)
        setFailed(false)
      }, [file])

      if (!file) return React.createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } }, t('label.noAudio'))

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
        { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement(
          'button',
          {
            style: { ...styles.buttonPrimary, height: 32, display: 'flex', alignItems: 'center', gap: 6 },
            onClick: media.url ? toggle : undefined,
            disabled: !media.url,
          },
          React.createElement(Icon, { name: playing ? 'stop' : 'play', size: 13 }),
          secondsText(example.audio.seconds),
        ),
        React.createElement(
          'span',
          { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
          t('study.replay'),
        ),
        failed ? React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-state-error-primary)' } }, t('error.audioUnplayable')) : null,
        React.createElement('audio', {
          ref: audioRef,
          src: media.url || undefined,
          preload: 'auto',
          style: { display: 'none' },
          onPlay: () => setPlaying(true),
          onPause: () => setPlaying(false),
          onEnded: () => setPlaying(false),
          onError: () => {
            setFailed(true)
            setPlaying(false)
          },
        }),
      )
    }

    // ── 一个包 ──────────────────────────────────────────────────────────────

    /**
     * 音色怎么挑。
     *
     * 音色表向服务要一次就有几百个，缓存住别再要；包上已经挑过就用包上的。
     * 改完不动已经合好的音频 —— 想听到新声音得自己重新合成，所以这里
     * 明确写出「改完要重新合成」。
     */
    let voiceCache = null

    function fetchVoices(handlers) {
      if (!voiceCache) {
        voiceCache = handlers
          .voiceList()
          .then((value) => value?.voices ?? [])
          .catch((error) => {
            voiceCache = null
            throw error
          })
      }
      return voiceCache
    }

    function useVoiceChoice(detail, handlers) {
      const [voices, setVoices] = useState([])
      const [current, setCurrent] = useState('')
      const [rate, setRate] = useState('+10%')
      const [saved, setSaved] = useState(false)
      const packId = detail?.id

      useEffect(() => {
        let alive = true
        fetchVoices(handlers)
          .then((list) => {
            if (alive) setVoices(list)
          })
          .catch(() => {})
        return () => {
          alive = false
        }
      }, [handlers])

      useEffect(() => {
        setCurrent(detail?.voiceChoice?.voice || detail?.voice?.voice || '')
        setRate(detail?.voiceChoice?.rate || detail?.voice?.rate || '+10%')
        setSaved(false)
      }, [packId, detail?.voiceChoice?.voice, detail?.voiceChoice?.rate, detail?.voice?.voice, detail?.voice?.rate])

      const choose = (nextVoice, nextRate) => {
        const voice = nextVoice ?? current
        const speed = nextRate ?? rate
        if (nextVoice !== null) setCurrent(nextVoice)
        if (nextRate !== null) setRate(nextRate)
        setSaved(true)
        handlers.setVoice(voice, speed)
      }

      return { voices, current, rate, saved, choose }
    }

    function PackDetail({ detail, busy, handlers, t }) {
      const voice = useVoiceChoice(detail, handlers)
      // 一个包都没有时，中间这块是用户看到的第一屏：一张居中的空态，
      // 说清楚「这里会出现什么」和「第一步做什么」。只写一行小字太像出错了。
      if (!detail) {
        return React.createElement(
          'div',
          { style: styles.emptyBig },
          React.createElement('div', { style: styles.emptyIcon }, React.createElement(Icon, { name: 'factory', size: 30 })),
          React.createElement('div', { style: styles.emptyTitle }, t('label.emptyTitle')),
          React.createElement('div', { style: styles.emptyHint }, t('label.empty')),
        )
      }
      const total = detail.examples.length
      const reviewed = detail.examples.filter((one) => one.imageReview?.by && one.audioReview?.listened).length
      // 还没图、也还没有候选的那几条 —— 只有这些需要去图库取货。
      const needsCandidates = detail.examples.filter(
        (one) => !one.image && (one.imageCandidates?.length ?? 0) === 0,
      ).length
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
        // 音色和语速摆在包头上：换一个说话的人，比在设置页里改全局更像「这一包的事」。
        React.createElement(
          'div',
          { style: styles.voiceRow },
          React.createElement('span', null, t('label.voice')),
          React.createElement(
            'select',
            {
              style: styles.select,
              value: voice.current,
              onChange: (event) => voice.choose(event.target.value, null),
              disabled: voice.voices.length === 0,
            },
            voice.voices.length === 0
              ? React.createElement('option', { value: '' }, t('label.voiceLoading'))
              : voice.voices.map((one) =>
                  React.createElement('option', { key: one.id, value: one.id }, one.label || one.id),
                ),
          ),
          React.createElement('span', null, t('label.rate')),
          React.createElement(
            'select',
            {
              style: styles.select,
              value: voice.rate,
              onChange: (event) => voice.choose(null, event.target.value),
            },
            ['+0%', '+5%', '+10%', '+15%', '+20%'].map((value) =>
              React.createElement('option', { key: value, value }, value),
            ),
          ),
          voice.saved ? React.createElement('span', { style: { fontSize: 11 } }, t('label.voiceSaved')) : null,
          React.createElement('span', { style: { fontSize: 11 } }, t('hint.voiceApply')),
        ),
        total > 0 ? React.createElement(Pipeline, { detail, t }) : null,
        detail.problems?.length
          ? React.createElement(
              'div',
              { style: { ...styles.banner('warn'), marginTop: 12 } },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement('span', null, detail.problems.join('；')),
            )
          : null,
        React.createElement('div', { style: styles.sectionTitle }, t('label.examples')),
        // 例句还没到时，这块不能就一个「例句」标题空着 —— 那看起来像坏了。
        total === 0
          ? React.createElement('div', { style: styles.empty }, t('label.generatingHint'))
          : null,
        detail.examples.map((example) =>
          React.createElement(ExampleCard, { key: example.ord, example, busy, handlers, t }),
        ),
        // 例句还一条都没有时（正在造），动作条没有意义：打包空的包只会被拒。
        // 与其摆一排点了会报错的按钮，不如让它此刻不存在。
        total > 0
          ? React.createElement(
              'div',
              { style: { display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' } },
          // 「还差几张图」得看得见：八条各点一次找候选等于开头先点八下，
          // 所以给一个批量取的按钮（只取货、不点头 —— 挑哪张还是人来）。
          needsCandidates > 0
            ? React.createElement(
                'button',
                { style: styles.button, onClick: () => handlers.candidatesAll(), disabled: busy },
                `${t('action.candidatesAll')}（${needsCandidates}）`,
              )
            : null,
          React.createElement(
            'button',
            { style: { ...styles.buttonPrimary, opacity: reviewed < total ? 0.45 : 1 }, onClick: () => handlers.pack(), disabled: reviewed < total || busy },
            t('action.pack'),
          ),
          React.createElement(
            'button',
            {
              style: styles.button,
              onClick: () => handlers.exportPack(),
              disabled: (detail.status !== 'packed' && detail.status !== 'exported') || busy,
            },
            t('action.export'),
          ),
          React.createElement(
            'button',
            { style: styles.button, onClick: () => handlers.synthesizeAll(), disabled: busy },
            t('action.synthAll'),
          ),
          React.createElement('button', { style: styles.button, onClick: () => handlers.remove() }, t('action.delete')),
            )
          : null,
        reviewed < total && total > 0
          ? React.createElement(
              'div',
              { style: { ...styles.banner('warn'), marginTop: 10 } },
              React.createElement(Icon, { name: 'warning', size: 13 }),
              React.createElement('span', null, t('hint.reviewRequired')),
            )
          : null,
        detail.pack?.dir && total > 0 ? React.createElement('div', { style: { ...styles.banner('info'), marginTop: 10 } }, `${t('label.packDir')}：${detail.pack.dir}`) : null,
        detail.export?.dir
          ? React.createElement(
              'div',
              { style: { ...styles.banner('info'), marginTop: 6 } },
              // 「复验过没有」得写在脸上：老账本里没有这个字段，那时导出是不复验的，
              // 所以只有明确的 true 才说「已复验」，其余一律当没验过。
              `${t('label.exportedTo')}：${detail.export.dir}（${detail.export.files} ${t('label.files')} · ${Math.round((detail.export.bytes || 0) / 1024)} KB · ${detail.export.verified === true ? t('label.verified') : t('label.notVerified')}${detail.export.stale === true ? ' · ' + t('label.exportStale') : ''}）`,
            )
          : null,
      )
    }

    // ── 侧栏的找法与排法 ────────────────────────────────────────────────────

    /**
     * 一个很朴素的相似度：按两个字一组切片做重合率。
     *
     * 为什么不用「包含」了事：中文检索经常差一个字，直接包含就一条都搜不到，
     * 用户会以为库里没这东西。切片重合至少能把「差不多是它」的东西顶上来。
     */
    function bigrams(text) {
      const clean = String(text ?? '')
        .toLowerCase()
        .replace(/[\s\p{P}\p{S}]+/gu, '')
      const out = new Set()
      for (let index = 0; index < clean.length - 1; index += 1) out.add(clean.slice(index, index + 2))
      if (clean.length === 1) out.add(clean)
      return out
    }

    function similarityScore(haystack, needle) {
      const hay = bigrams(haystack)
      const need = bigrams(needle)
      if (need.size === 0 || hay.size === 0) return 0
      let hit = 0
      for (const one of need) if (hay.has(one)) hit += 1
      return hit / need.size
    }

    function filterPacks(packs, query) {
      const text = String(query ?? '').trim()
      if (!text) return packs
      const scored = packs
        .map((pack) => {
          const hay = `${pack.target} ${pack.gloss ?? ''} ${pack.id}`
          const direct = hay.toLowerCase().includes(text.toLowerCase()) ? 1 : 0
          return { pack, score: direct || similarityScore(hay, text) }
        })
        .filter((one) => one.score > 0.25)
        .sort((a, b) => b.score - a.score)
      return scored.map((one) => one.pack)
    }

    const SORTS = [
      { id: 'recent', labelKey: 'sort.recent' },
      { id: 'name', labelKey: 'sort.name' },
      { id: 'todo', labelKey: 'sort.todo' },
      { id: 'progress', labelKey: 'sort.progress' },
    ]

    function sortPacks(packs, sort) {
      const list = [...packs]
      const todoOf = (pack) => pack.progress.total - Math.min(pack.progress.images, pack.progress.audios)
      const doneOf = (pack) => (pack.status === 'exported' ? 2 : pack.status === 'packed' ? 1 : 0)
      if (sort === 'name') list.sort((a, b) => a.target.localeCompare(b.target, 'zh'))
      else if (sort === 'todo') list.sort((a, b) => todoOf(b) - todoOf(a) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
      else if (sort === 'progress') list.sort((a, b) => doneOf(b) - doneOf(a) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
      else list.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
      return list
    }

    function FactoryPanel({ rpc, t, initialZone }) {
      const factory = useFactory(rpc)
      const narrow = useNarrow()
      const { state, detail, selected, setSelected, job, error, setError } = factory
      const [target, setTarget] = useState('')
      const [zone, setZone] = useState(initialZone === 'study' ? 'study' : 'factory')
      const [query, setQuery] = useState('')
      const [sort, setSort] = useState('recent')
      const busy = Boolean(job && job.status === 'running')

      // 学习区只认成品包：图齐全、音齐全、已经打过包（宿主那边算好的 `learnable`）。
      // 素材还在补的包留在制卡区 —— 拿去练，练到一半发现没声，人就不练了。
      const pool = useMemo(() => {
        const all = state.packs ?? []
        return zone === 'study' ? all.filter((one) => one.learnable === true) : all
      }, [state.packs, zone])

      const visible = useMemo(
        () => sortPacks(filterPacks(pool, query), sort),
        [pool, query, sort],
      )

      useEffect(() => {
        if (selected && pool.some((one) => one.id === selected)) return
        if (pool.length > 0) setSelected(pool[0].id)
        else if (zone === 'study') setSelected(null)
      }, [pool, selected, setSelected, zone])

      const handlers = useMemo(
        () => ({
          candidates: (ord) => factory.runJob('pack.candidates', { id: selected, ord }),
          candidatesWith: (ord, text) => factory.runJob('pack.candidates', { id: selected, ord, query: text }),
          voiceList: () => callRpc(rpc, 'pack.voice.list', {}),
          setVoice: (voice, rate) => factory.act('pack.voice', { id: selected, voice, rate }),
          candidatesAll: () => factory.runJob('pack.candidatesAll', { id: selected }),
          pick: (ord, stagedName) => factory.act('pack.pick', { id: selected, ord, stagedName }),
          unlockImage: (ord) => factory.act('pack.unlockImage', { id: selected, ord }),
          upload: (ord, payload) => factory.act('pack.upload', { id: selected, ord, ...payload }),
          synthesize: (ord) => factory.runJob('pack.audio', { id: selected, ord }),
          synthesizeAll: () => factory.runJob('pack.audioAll', { id: selected }),
          confirmAudio: (ord) => factory.act('pack.confirmAudio', { id: selected, ord }),
          unlockAudio: (ord) => factory.act('pack.unlockAudio', { id: selected, ord }),
          pack: () => factory.runJob('pack.pack', { id: selected }),
          exportPack: () => factory.runJob('pack.export', { id: selected }),
          // 打回制卡区：状态退回素材阶段，人接着改；同时把界面切回制卡区。
          reopen: async () => {
            await factory.act('pack.reopen', { id: selected })
            setZone('factory')
          },
          remove: async () => {
            const pack = state.packs?.find((one) => one.id === selected)
            if (!window.confirm(`${t('action.deleteConfirm')}\n${pack?.target ?? ''}`)) return
            await factory.act('pack.delete', { id: selected })
            setSelected(null)
          },
        }),
        [factory, selected, state.packs, t, setSelected, rpc],
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
          React.createElement(
            'span',
            { style: styles.subtitle },
            state.root ? `${state.root} · ${state.packs?.length ?? 0} 个包` : t('nav.subtitle'),
          ),
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
        // 两个区：制卡 / 学习。顶栏下面一条标签，切的是中间整块内容，
        // 左边的包列表两边共用 —— 都是同一批包，只是看它的方式不同。
        React.createElement(
          'div',
          { style: styles.tabs },
          React.createElement('button', { style: styles.tab(zone === 'factory'), onClick: () => setZone('factory') }, t('zone.factory')),
          React.createElement('button', { style: styles.tab(zone === 'study'), onClick: () => setZone('study') }, t('zone.study')),
        ),
        // 任务条必须在顶上：原来它挂在整页最底部，而一页卡片有三千像素高，
        // 站在顶上点「造一个包」的人什么都看不见，会以为按钮没反应。
        job
          ? React.createElement(
              'div',
              { style: styles.jobBar },
              React.createElement('span', { style: styles.dot(job.status !== 'running') }),
              React.createElement('span', { style: { flex: '0 0 auto', fontWeight: 600 } }, job.label),
              job.progress
                ? React.createElement(
                    'span',
                    { style: { flex: '0 0 auto', color: 'var(--dsw-alias-label-tertiary)' } },
                    `${job.progress.done}/${job.progress.total}`,
                  )
                : null,
              React.createElement(
                'span',
                { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--dsw-alias-label-secondary)' } },
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
        React.createElement(
          'div',
          { style: narrow ? { ...styles.body, flexDirection: 'column' } : styles.body },
          React.createElement(
            'div',
            { style: narrow ? { ...styles.list, ...styles.listNarrow } : styles.list },
            // 检索与排序放在列表顶上：包多了以后，翻找比造卡更花时间。
            // 检索支持中文，也接受「记不太清」—— 找不到字面命中就按相似度挑。
            React.createElement(
              'div',
              { style: styles.searchRow },
              React.createElement('input', {
                style: { ...styles.input, height: 26, fontSize: 12, flex: 1, minWidth: 0 },
                value: query,
                placeholder: t('hint.searchPacks'),
                'aria-label': t('hint.searchPacks'),
                onChange: (event) => setQuery(event.target.value),
              }),
              React.createElement(
                'select',
                {
                  style: { ...styles.select, height: 26, flex: '0 0 auto' },
                  value: sort,
                  onChange: (event) => setSort(event.target.value),
                  'aria-label': t('label.sort'),
                },
                SORTS.map((one) => React.createElement('option', { key: one.id, value: one.id }, t(one.labelKey))),
              ),
            ),
            visible.length
              ? visible.map((pack) =>
                  React.createElement(
                    'button',
                    {
                      key: pack.id,
                      style: narrow ? { ...styles.listItem(selected === pack.id), flex: '0 0 auto', width: 208 } : styles.listItem(selected === pack.id),
                      onClick: () => setSelected(pack.id),
                    },
                    React.createElement('span', { style: styles.listTarget }, pack.target),
                    React.createElement(
                      'span',
                      { style: styles.listMeta },
                      `${t(`status.${pack.status}`)} · ${pack.progress.images}/${pack.progress.total} 图 · ${pack.progress.audios}/${pack.progress.total} 音`,
                    ),
                  ),
                )
              // 有包但被检索条件筛空了：这时候必须说一句，否则用户会以为包没了。
              : pool.length > 0
                ? React.createElement('div', { style: styles.listNote }, t('label.noMatch'))
                // 学习区里一个能练的都没有：也别空着，说清这里是按什么筛的。
                : zone === 'study' && (state.packs?.length ?? 0) > 0
                  ? React.createElement('div', { style: styles.listNote }, t('label.studyPoolEmpty'))
                  // 空列表时左边保持安静 —— 指引只写在中间那一块，写两遍像两个错。
                  : state.status === 'loading'
                    ? // 正在取数据的时候必须说话。一块什么都没有的空白，
                      // 用户分不清是「真的没有包」还是「界面死了」。
                      React.createElement('div', { style: styles.listNote }, t('label.loading'))
                    : state.status === 'error'
                      ? React.createElement('div', { style: styles.listNote }, t('label.loadFailed'))
                      : null,
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
            zone === 'study'
              ? React.createElement(StudyPanel, { detail, t, onReopen: handlers.reopen })
              : React.createElement(PackDetail, { detail, busy, handlers, t }),
          ),
        ),
      )
    }

    // ── 配置卡 ──────────────────────────────────────────────────────────────

    function ConfigPage({ form, view, t }) {
      const cfg = useForm(form)
      const value = cfg.snapshot?.value ?? {}
      const disabled = !cfg.writable

      // `summary` 是插件页上那一行字，`page` 才是整张表。不分开的话，
      // 插件列表页里会硬塞进一整张表单，把下面那些行挤到看不见。
      if (view === 'summary') {
        const line = [
          value.ttsEngine || 'auto',
          value.ttsVoiceEdge || 'en-US-AriaNeural',
          value.rate || '+10%',
          t('config.summaryExamples').replace('{n}', String(value.examplesPerLesson ?? 8)),
          value.exportDir || t('config.exportDefault'),
        ]
        return React.createElement(
          'div',
          { style: { fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' } },
          line.join(' · '),
        )
      }

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
        field(t('config.candidates'), 'candidateLimit'),
        field(t('config.exportDir'), 'exportDir'),
        field(t('config.dataDir'), 'dataDir'),
        // 代理是「搜不到图」时唯一能自救的旋钮，所以必须在这一页上，
        // 而不是只写进文档 —— 写文档的东西没人会在报错当场去翻。
        field(t('config.proxy'), 'proxyUrl'),
        React.createElement('div', { style: { fontSize: 11, lineHeight: 1.7, color: 'var(--dsw-alias-label-tertiary)', marginTop: 4 } }, t('config.hintProxy')),
        React.createElement('div', { style: { fontSize: 11, lineHeight: 1.7, color: 'var(--dsw-alias-label-tertiary)', marginTop: 2 } }, t('config.hint')),
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
        'action.candidatesAll': '找全部候选图',
        'action.markListened': '我听过了',
        'action.unlockAudio': '取消确认',
        'action.unlockImage': '换一张',
        'action.lockImage': '用这张',
        'action.moreCandidates': '换一批',
        'action.moreBusy': '正在找…',
        'action.upload': '自己上传',
        'action.pack': '打包',
        'action.export': '导出成品包',
        'action.delete': '删掉这个包',
        'action.deleteConfirm': '真删掉这个卡片包？里面的图片和语音也会没。',
        'action.findImages': '找候选图',
        'status.generating': '正在造',
        'status.text': '待配素材',
        'status.media': '补素材中',
        'status.packed': '已打包',
        'status.exported': '已导出',
        'status.failed': '失败',
        'label.emptyTitle': '还没有卡片包',
        'label.empty': '在上面输入一个词、一个固定说法，或者一整句，回车就会开始造。',
        'stage.words': '例句',
        'stage.wordsDoing': '模型正在写',
        'stage.wordsDone': '例句齐了',
        'stage.images': '配图',
        'stage.imagesWait': '等着',
        'stage.imagesNeed': '还没取候选图',
        'stage.imagesGate': '{n} 条等你点头',
        'stage.imagesDone': '都定了',
        'stage.imagesUnreviewed': '{n} 条没复核',
        'stage.audio': '语音',
        'stage.audioWait': '等着',
        'stage.audioNeed': '还没合成',
        'stage.audioGate': '{n} 条等你试听',
        'stage.audioDone': '都听过了',
        'stage.pack': '打包',
        'stage.packNeed': '图音齐了才能打',
        'stage.packDone': '已打包',
        'stage.export': '导出',
        'stage.exportWait': '先打包',
        'stage.exportNeed': '打完就能导出',
        'stage.exportDone': '已导出',
        'stage.now': '现在这一步',
        'stage.allDone': '五步都做完了。想再改就点某条卡片换一张图。',
        'label.loading': '正在向宿主取数据……',
        'label.loadFailed': '取不到数据。看右边那条红字，点上面那个圆圈重试。',
        'label.noMatch': '没有对得上的包。换个说法，或者清空检索框。',
        'label.studyPoolEmpty': '还没有能练的包。打完包的会出现在这里。',
        'label.sort': '排序',
        'label.voice': '音色',
        'label.rate': '语速',
        'label.voiceLoading': '正在取音色表……',
        'label.voiceSaved': '已记住',
        'zone.factory': '制卡',
        'zone.study': '学习',
        'sort.recent': '最近动过',
        'sort.name': '按名字',
        'sort.todo': '欠得最多的在前',
        'sort.progress': '做得最全的在前',
        'hint.searchPacks': '搜目标 / 释义 / 中文',
        'hint.searchImage': '自己写要搜什么，中英文都行',
        'hint.voiceApply': '改完重新合成才会变',
        'action.searchThis': '按这个词找图',
        'study.emptyTitle': '还没有能练的包',
        'study.empty': '先去「制卡」造一个包，配好图和音，再回来练。',
        'study.noneTitle': '这里只放打完包的卡',
        'study.none': '学习区只列图、音、打包都齐了的包。还在制卡的那些在左边「制卡」里。',
        'study.reopen': '打回制卡',
        'study.reopenHint': '退回制卡区重新编辑（导出过的那份不动）',
        'study.keys': '← → 换卡 · 空格看答案',
        'study.reveal': '想好了？看答案',
        'study.replay': '再听一遍',
        'study.prev': '上一张',
        'study.next': '下一张',
        'label.examples': '例句',
        'label.generatingHint': '模型正在写例句，一般十几秒，句子多的时候一分钟。写完这一屏会自动出现卡片。',
        'label.reviewed': '已确认',
        'label.author': '作者',
        'label.credit': '出处',
        'label.packDir': '包目录',
        'label.exportedTo': '导出到',
        'label.files': '个文件',
        'label.verified': '已复验',
        'label.notVerified': '未复验',
        'label.exportStale': '这一包后来又改过',
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
        'config.exportDir': '导出目录',
        'config.exportDefault': '默认：下载\dsh-etude',
        'config.candidates': '候选图上限',
        'config.dataDir': '数据目录',
        'config.proxy': '代理地址',
        'config.hintProxy': 'Node 的 fetch 不读系统代理。搜不到候选图时先把这里填上（例如 http://127.0.0.1:7897），改完立刻生效，不用重启。',
        'config.hint': '语速和音量对 Edge 生效；OpenAI 兼容的那类接口只有语速（换成 speed），没有音量。',
        'config.summaryExamples': '每包 {n} 条例句',
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
        'action.candidatesAll': 'Find all candidates',
        'action.markListened': 'I listened',
        'action.unlockAudio': 'Undo',
        'action.unlockImage': 'Replace',
        'action.lockImage': 'Use this one',
        'action.moreCandidates': 'More',
        'action.moreBusy': 'Searching…',
        'action.upload': 'Upload',
        'action.pack': 'Build pack',
        'action.export': 'Export pack',
        'action.delete': 'Delete pack',
        'action.deleteConfirm': 'Delete this pack? Its images and audio go too.',
        'action.findImages': 'Find images',
        'status.generating': 'Generating',
        'status.text': 'Needs media',
        'status.media': 'Filling media',
        'status.packed': 'Packed',
        'status.exported': 'Exported',
        'status.failed': 'Failed',
        'label.emptyTitle': 'No packs yet',
        'label.empty': 'Type a word, a fixed phrase, or a whole sentence above and press Enter.',
        'stage.words': 'Sentences',
        'stage.wordsDoing': 'model is writing',
        'stage.wordsDone': 'all here',
        'stage.images': 'Photos',
        'stage.imagesWait': 'waiting',
        'stage.imagesNeed': 'no candidates yet',
        'stage.imagesGate': '{n} waiting for your pick',
        'stage.imagesDone': 'all chosen',
        'stage.imagesUnreviewed': '{n} unreviewed',
        'stage.audio': 'Audio',
        'stage.audioWait': 'waiting',
        'stage.audioNeed': 'not synthesised',
        'stage.audioGate': '{n} waiting for your ear',
        'stage.audioDone': 'all listened',
        'stage.pack': 'Pack',
        'stage.packNeed': 'needs photos and audio',
        'stage.packDone': 'packed',
        'stage.export': 'Export',
        'stage.exportWait': 'pack first',
        'stage.exportNeed': 'ready to export',
        'stage.exportDone': 'exported',
        'stage.now': 'Now',
        'stage.allDone': 'All five steps are done. Click any card to swap its photo.',
        'label.loading': 'Talking to the host…',
        'label.loadFailed': 'Could not load. Read the red line, then hit the round button above to retry.',
        'label.noMatch': 'No pack matches. Try another word, or clear the search box.',
        'label.studyPoolEmpty': 'Nothing to practise yet. Finished packs show up here.',
        'label.sort': 'Sort',
        'label.voice': 'Voice',
        'label.rate': 'Speed',
        'label.voiceLoading': 'Loading voices…',
        'label.voiceSaved': 'saved',
        'zone.factory': 'Make',
        'zone.study': 'Study',
        'sort.recent': 'Recently touched',
        'sort.name': 'By name',
        'sort.todo': 'Most unfinished first',
        'sort.progress': 'Most finished first',
        'hint.searchPacks': 'Target / gloss / Chinese',
        'hint.searchImage': 'Type what to search — English or Chinese',
        'hint.voiceApply': 'takes effect after re-synthesizing',
        'action.searchThis': 'Search this',
        'study.emptyTitle': 'Nothing to practise yet',
        'study.empty': 'Make a pack first, then come back here to drill it.',
        'study.noneTitle': 'Only finished packs show up here',
        'study.none': 'Practice lists only packs with every image, every audio and a built pack. Work in progress stays in Make.',
        'study.reopen': 'Send back to Make',
        'study.reopenHint': 'Reopen for editing (an exported copy stays where it is)',
        'study.keys': '← → switch · Space to reveal',
        'study.reveal': 'Ready? Show the sentence',
        'study.replay': 'play again',
        'study.prev': 'Previous',
        'study.next': 'Next',
        'label.examples': 'Examples',
        'label.generatingHint': 'The model is writing the sentences — usually ten-odd seconds, up to a minute. They appear here on their own.',
        'label.reviewed': 'confirmed',
        'label.author': 'By',
        'label.credit': 'Source',
        'label.packDir': 'Pack dir',
        'label.exportedTo': 'Exported to',
        'label.files': 'files',
        'label.verified': 'verified',
        'label.notVerified': 'not verified',
        'label.exportStale': 'changed since this export',
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
        'config.exportDir': 'Export folder',
        'config.exportDefault': 'default: Downloads/dsh-etude',
        'config.candidates': 'Candidates per example',
        'config.dataDir': 'Data folder',
        'config.proxy': 'HTTP proxy',
        'config.hintProxy': "Node's fetch ignores the system proxy. If image search fails, put it here (e.g. http://127.0.0.1:7897). Takes effect immediately.",
        'config.hint': 'Rate and volume apply to Edge. OpenAI-compatible TTS only takes speed — no volume.',
        'config.summaryExamples': '{n} examples per pack',
      },
    }

    const inject = ['slots', 'locale', 'connection']

    function apply(ctx) {
      // 每次要用的时候再取：apply 的时刻 connection 不一定已经就绪，
      // 那一刻抓成常量的话，面板会永久拿到 undefined（看不到任何卡片，
      // 也不报错 —— 用户报「点了卡片工厂看不见卡片」就是这么来的）。
      const getRpc = () => {
        try {
          return ctx.get('connection')?.rpc
        } catch {
          return undefined
        }
      }
      const rpc = getRpc
      // 媒体读取也用同一个 getter，用到的时候再取。不在这里开任何定时器 ——
      // 插件在 apply 阶段做多余的事，出错时是整个 App 一起坏，不该冒险。
      rpcGetter = getRpc

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
          React.createElement(PanelBoundary, null, React.createElement(FactoryPanel, { rpc, t, ...owner })),
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
                  // 宿主给了 owner.form 就用它（那一页自带写入动作），否则退回 configForms 那份。
                  React.createElement(ConfigPage, { form: owner?.form ?? form, view: owner?.view, t }),
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
