/* adapters/speak.js · 「说」这一面的数据适配
 *
 * design/speak.html 里写死了：succumb、第 2 句、c1.jpg、3.2s、
 * 「edge · Aria · 女声」和一句假句子。
 *
 * 这一面还有一件设计稿没做的事：自己录一遍。后端现在有录音存储了
 * （example.record / example.record.bytes / example.record.delete），圆钮是真能录的：
 *   点一下 → getUserMedia + MediaRecorder → 再点一下停 → 读成 base64 →
 *   example.record 存进账本 → 「听自己这一遍」走 example.record.bytes 回放。
 * 没有麦克风 / 用户拒绝 / 浏览器不支持 MediaRecorder 时只改文案，不抛错、不弹窗。
 */

;(function () {
  var FACE_INDEX = 2
  var FACE_TOTAL = 5
  var LAST_W = ''

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.target !== 'etude-frame' || data.kind !== 'state') return
    var word = readW(data.query)
    if (word === LAST_W) return
    LAST_W = word
    try {
      apply(window.__ETUDE_STATE__, window.__ETUDE__)
    } catch (error) {}
  })

  window.__ETUDE_APPLY__ = function (state, api) {
    apply(state, api)
  }

  function apply(state, api) {
    reroute()
    if (!state || state.status !== 'ready') {
      setNote('账本还没读出来，稍等一下。')
      return
    }
    var pack = pickPack(state.packs)
    if (!pack) {
      setNote('账本里还没有包 —— 去「工厂」造一个，这一面才有东西说。')
      setTitle('(还没有包)')
      return
    }
    setTitle(pack.target || '(没名字)')
    setFaces(null, null)
    setCrumbOrd(1)
    markRecorder(pack, api)
    if (!api || typeof api.rpc !== 'function') {
      setNote('宿主没给 RPC，取不到这一句。')
      return
    }
    api
      .rpc('pack.get', { id: pack.id })
      .then(function (full) {
        var example = (full && full.examples && full.examples[0]) || null
        if (!full) {
          setNote('这个包没取到（宿主回了个空）。')
          return
        }
        setTitle(full.target || pack.target || '(没名字)')
        fillPop(full, example)
        setFaces(example, full)
        if (!example) {
          setNote('这个包还没有例句 —— 先回工厂把例句造出来。')
          return
        }
        setCrumbOrd(example.ord || 1)
        if (example.audio && example.audio.file) muteStaleHint()
        fillPicture(example, api)
        fillVoice(example, api)
        bindRecord(example)
        var cue = document.querySelector('.stage .reveal .cue')
        if (cue) cue.textContent = example.sentence || ''
        else warn('没找到 .stage .reveal .cue，句子没换上')
        linkNext(full)
      })
      .catch(function (error) {
        setNote('例句没取到（' + short(error) + '）。')
      })
  }

  /* app.css 里 `.stage:not(:has(.play))::after` 会顶一句「这一句还没有语音，
     点右上生成语音」—— 那是给真的没语音的句子留的。这句明明有语音，就别让
     页面顶着假话。（这一面本来就不放播放键，所以这条规则天然会命中。） */
  function muteStaleHint() {
    if (document.querySelector('style[data-etude-hint]')) return
    var style = document.createElement('style')
    style.setAttribute('data-etude-hint', '')
    style.textContent = '.stage:not(:has(.play))::after{content:none!important}'
    document.head.appendChild(style)
  }

  // ── 录音：真录、真传、真回放 ────────────────────────────────────────
  //
  // 状态挂在这个闭包里。一页只有一个「说」的圆钮，同一时刻也只录一条；
  // 重新 apply（换词、state 刷新）不能把正在录的那一遍弄丢，所以
  // session 每开录 +1，回来晚的 onstop 认不出自己就直接丢掉。
  var REC = {
    api: null,
    packId: '',
    example: null,
    ord: 0,
    ready: false, // 浏览器有能力（getUserMedia + MediaRecorder）；不代表用户允许
    why: '', // 不能录时写进 .reclab 的实话
    recorder: null,
    stream: null,
    chunks: [],
    startedAt: 0,
    timer: 0,
    session: 0,
    uploading: false,
    playing: null,
  }

  /** 圆钮从「还没接」改成可点；能力判断先做完，再决定文案 */
  function markRecorder(pack, api) {
    REC.api = api || null
    REC.packId = (pack && pack.id) || ''
    var sup = recorderSupport()
    REC.ready = sup.ok
    REC.why = sup.ok ? '' : '这个浏览器不支持录音 —— ' + sup.reason
    dropPlaying()
    var rec = document.querySelector('.stage .rec')
    if (!rec) {
      warn('没找到 .stage .rec，录音没接上')
    } else {
      rec.removeAttribute('aria-disabled')
      rec.setAttribute('role', 'button')
      rec.setAttribute('tabindex', '0')
      rec.setAttribute('aria-label', '录音')
      rec.setAttribute('aria-pressed', isRecording() ? 'true' : 'false')
      rec.setAttribute('title', REC.ready ? '点一下开始录，再点一下停' : REC.why)
      rec.style.opacity = ''
      rec.style.cursor = 'pointer'
      rec.style.pointerEvents = ''
      if (!isRecording()) rec.classList.remove('on')
      rec.onclick = function () {
        toggleRecord()
      }
      rec.onkeydown = function (event) {
        var key = String((event && event.key) || '')
        if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return
        event.preventDefault()
        toggleRecord()
      }
    }
    recStyle()
    wireRecordKey()
    restoreBar()
    if (isRecording()) return
    var lab = document.querySelector('.stage .reclab')
    if (!lab) {
      warn('没找到 .stage .reclab')
    } else if (REC.ready) {
      lab.textContent = '点一下开始录 · 再点一下停'
    } else {
      lab.textContent = REC.why
    }
    hidePlay()
  }

  /** pack.get 回来之后：认下这一句的 ord，把「上次录的那一遍」亮出来 */
  function bindRecord(example) {
    if (!example) return
    var ord = Number(example.ord) || 1
    if (isRecording() && REC.ord !== ord) abortRecording()
    REC.example = example
    REC.ord = ord
    if (isRecording() || REC.uploading) return
    var record = example.record
    if (!record || !record.file) {
      hidePlay()
      return
    }
    setRecLab('上次录的那一遍 · ' + sayMs(record.durationMs))
    showPlay('听自己这一遍')
  }

  /** 点圆钮：开录 / 停录 / 什么都不能做时说句实话 */
  function toggleRecord() {
    if (REC.uploading) {
      setRecLab('上一遍还在存，等它存完')
      return
    }
    if (isRecording()) {
      stopRecording()
      return
    }
    if (REC.recorder) return // 已经在收尾
    if (!REC.api || typeof REC.api.rpc !== 'function') {
      setRecLab('宿主没给 RPC，录了也没地方存')
      return
    }
    if (!REC.ready) {
      setRecLab(REC.why)
      return
    }
    if (!REC.example) {
      setRecLab('例句还没取到，等一下再录')
      return
    }
    startRecording()
  }

  function startRecording() {
    REC.session += 1
    var session = REC.session
    var rec = document.querySelector('.stage .rec')
    if (rec) {
      rec.classList.add('on')
      rec.setAttribute('aria-pressed', 'true')
    }
    setRecLab('等浏览器给麦克风…')
    var nav = typeof navigator !== 'undefined' ? navigator : null
    var media = nav && nav.mediaDevices
    var ask
    try {
      ask = media.getUserMedia({ audio: true })
    } catch (error) {
      micFailed(error)
      return
    }
    Promise.resolve(ask)
      .then(function (stream) {
        if (session !== REC.session) {
          stopStream(stream)
          return
        }
        REC.stream = stream
        var recorder = null
        var mime = pickMime()
        try {
          recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
        } catch (error) {
          recorder = null
        }
        if (!recorder) {
          stopStream(stream)
          REC.stream = null
          clearRecordingPaint()
          setRecLab('麦克风能开，但这个浏览器起不了 MediaRecorder，这一面先跳过')
          return
        }
        REC.recorder = recorder
        REC.chunks = []
        REC.startedAt = Date.now()
        recorder.ondataavailable = function (event) {
          if (event && event.data && event.data.size) REC.chunks.push(event.data)
        }
        recorder.onerror = function (event) {
          var error = (event && event.error) || new Error('录音中断')
          REC.session += 1 // 让随后那次 onstop 作废
          stopTicker()
          clearRecordingPaint()
          try {
            if (recorder.state !== 'inactive') recorder.stop()
          } catch (ignored) {}
          stopStream(stream)
          REC.stream = null
          REC.recorder = null
          setRecLab('录音断了（' + short(error) + '），再点一下重录')
        }
        recorder.onstop = function () {
          finishRecording(session, recorder)
        }
        try {
          recorder.start(250)
        } catch (error) {
          REC.recorder = null
          stopStream(stream)
          REC.stream = null
          clearRecordingPaint()
          setRecLab('录音起不来（' + short(error) + '），再点一下试试')
          return
        }
        startTicker()
        paintRecording()
      })
      .catch(function (error) {
        if (session === REC.session) micFailed(error)
      })
  }

  function stopRecording() {
    var recorder = REC.recorder
    if (!recorder) return
    setRecLab('这就停…')
    try {
      if (recorder.state !== 'inactive') recorder.stop()
    } catch (error) {
      finishRecording(REC.session, recorder)
    }
  }

  /** 换词/换句时把没录完的这段扔掉：不停止上传，只释放麦克风 */
  function abortRecording() {
    REC.session += 1
    stopTicker()
    var recorder = REC.recorder
    REC.recorder = null
    if (recorder) {
      try {
        if (recorder.state !== 'inactive') recorder.stop()
      } catch (error) {}
    }
    stopStream(REC.stream)
    REC.stream = null
    REC.chunks = []
    REC.startedAt = 0
    clearRecordingPaint()
  }

  function finishRecording(session, recorder) {
    stopTicker()
    var stream = REC.stream
    REC.stream = null
    REC.recorder = null
    stopStream(stream)
    clearRecordingPaint()
    var chunks = REC.chunks
    REC.chunks = []
    if (!recorder) return
    var blob
    try {
      blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
    } catch (error) {
      setRecLab('这一遍拼不起来（' + short(error) + '），再点一下重录')
      return
    }
    var durationMs = REC.startedAt ? Date.now() - REC.startedAt : 0
    REC.startedAt = 0
    if (session !== REC.session) return
    if (!blob.size) {
      setRecLab('这一遍是空的（麦克风没给声音），再点一下重录')
      return
    }
    var mime = String(recorder.mimeType || blob.type || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    if (!/^audio\/(webm|ogg|wav|mpeg)$/.test(mime)) {
      setRecLab('这个浏览器录出来是 ' + (mime || '未知格式') + '，后端不认，换 Chrome 试试')
      return
    }
    if (blob.size > 8 * 1024 * 1024) {
      setRecLab('这一遍 ' + (blob.size / 1024 / 1024).toFixed(1) + 'MB，超了后端 8MB 上限，录短一点')
      return
    }
    upload(blob, mime, durationMs, session)
  }

  function upload(blob, mime, durationMs, session) {
    var api = REC.api
    var packId = REC.packId
    var ord = REC.ord
    REC.uploading = true
    setRecLab('正在存进账本…（' + sayMs(durationMs) + '）')
    blobToBase64(blob)
      .then(function (base64) {
        if (!base64) throw new Error('读出来是空的')
        return api.rpc('example.record', {
          packId: packId,
          ord: ord,
          base64: base64,
          mime: mime,
          durationMs: durationMs,
        })
      })
      .then(function (saved) {
        REC.uploading = false
        if (session !== REC.session) return
        var kept = saved || {}
        if (REC.example && Number(REC.example.ord) === ord) REC.example.record = kept
        var ms = Number(kept.durationMs)
        setRecLab('刚录完 · ' + sayMs(Number.isFinite(ms) && ms > 0 ? ms : durationMs) + ' · 已存进账本')
        showPlay('听自己这一遍')
      })
      .catch(function (error) {
        REC.uploading = false
        setRecLab('没存上（' + short(error) + '）· 再点一下重录')
      })
  }

  function playOwn() {
    if (REC.playing) {
      dropPlaying()
      showPlay('听自己这一遍')
      return
    }
    var api = REC.api
    var packId = REC.packId
    var ord = REC.ord
    if (!api || typeof api.rpc !== 'function') {
      setRecLab('宿主没给 RPC，回放取不到')
      return
    }
    if (!ord) {
      setRecLab('还没有录过这一句')
      return
    }
    showPlay('正在取那一遍…')
    api
      .rpc('example.record.bytes', { packId: packId, ord: ord })
      .then(function (res) {
        if (!res || !res.base64) throw new Error('没有字节')
        var audio = makeAudio('data:' + (res.mime || 'audio/webm') + ';base64,' + res.base64)
        if (!audio) throw new Error('浏览器放不了音频')
        REC.playing = audio
        audio.onended = function () {
          dropPlaying()
          showPlay('听自己这一遍')
        }
        audio.onerror = function () {
          dropPlaying()
          showPlay('听自己这一遍')
          setRecLab('这一遍放不出来（字节不完整？）')
        }
        showPlay('正在放…')
        return audio.play().catch(function (error) {
          dropPlaying()
          showPlay('听自己这一遍')
          setRecLab('放不出来（' + short(error) + '）· 再点一下试试')
        })
      })
      .catch(function (error) {
        showPlay('听自己这一遍')
        setRecLab('回放没取到（' + short(error) + '）· 再点一下试试')
      })
  }

  function makeAudio(url) {
    if (typeof Audio !== 'function') return null
    try {
      return new Audio(url)
    } catch (error) {
      return null
    }
  }

  function dropPlaying() {
    var audio = REC.playing
    REC.playing = null
    if (!audio) return
    try {
      audio.onended = null
      audio.onerror = null
      audio.pause()
    } catch (error) {}
  }

  /** 「听自己这一遍」按钮：设计稿这一面没有按钮位，只能生成一个 .mini（唯一新增节点） */
  function playButton() {
    var stage = document.querySelector('.stage')
    if (!stage) {
      warn('没找到 .stage，回放按钮没处放')
      return null
    }
    var button = stage.querySelector('button[data-etude-play]')
    if (button) return button
    var lab = stage.querySelector('.reclab')
    button = document.createElement('button')
    button.type = 'button'
    button.className = 'mini'
    button.setAttribute('data-etude-play', '')
    button.style.marginTop = '-14px'
    button.textContent = '听自己这一遍'
    button.onclick = function (event) {
      if (event) event.preventDefault()
      playOwn()
    }
    if (lab && lab.parentNode === stage) stage.insertBefore(button, lab.nextSibling)
    else stage.appendChild(button)
    return button
  }

  function showPlay(text) {
    var button = playButton()
    if (!button) return
    button.textContent = text
    button.style.display = ''
  }

  function hidePlay() {
    var stage = document.querySelector('.stage')
    var button = stage ? stage.querySelector('button[data-etude-play]') : null
    if (!button) return
    button.textContent = '听自己这一遍'
    button.style.display = 'none'
  }

  function setRecLab(text) {
    var lab = document.querySelector('.stage .reclab')
    if (lab) lab.textContent = text
    else warn('没找到 .stage .reclab，录音文案没处写')
  }

  function startTicker() {
    stopTicker()
    REC.timer = setInterval(paintRecording, 200)
  }

  function stopTicker() {
    if (!REC.timer) return
    clearInterval(REC.timer)
    REC.timer = 0
  }

  function paintRecording() {
    var rec = document.querySelector('.stage .rec')
    if (rec) {
      rec.classList.add('on')
      rec.setAttribute('aria-pressed', 'true')
    }
    // 这里不能走 sayMs：刚开录那一下差 0 毫秒，会被当成「时长没记」
    var ms = REC.startedAt ? Date.now() - REC.startedAt : 0
    setRecLab('正在录 · ' + (ms / 1000).toFixed(1) + ' 秒 · 再点一下停')
  }

  function clearRecordingPaint() {
    var rec = document.querySelector('.stage .rec')
    if (!rec) return
    rec.classList.remove('on')
    rec.setAttribute('aria-pressed', 'false')
  }

  /** 录制态的样式：设计稿只给了 .rec 的静态样子，.on 得自己补一条（只加 class，不改结构） */
  function recStyle() {
    if (typeof document === 'undefined' || !document.head) return
    if (document.querySelector('style[data-etude-rec]')) return
    var style = document.createElement('style')
    style.setAttribute('data-etude-rec', '')
    style.textContent =
      '.stage .rec.on{background:rgba(var(--accent-rgb),.34);border-color:rgba(var(--accent-rgb),.9);' +
      'box-shadow:0 0 0 8px rgba(var(--accent-rgb),.16);animation:etude-rec-pulse 1s ease-in-out infinite}' +
      '@keyframes etude-rec-pulse{50%{box-shadow:0 0 0 16px rgba(var(--accent-rgb),.04)}}'
    document.head.appendChild(style)
  }

  function recorderSupport() {
    var nav = typeof navigator !== 'undefined' ? navigator : null
    var media = nav && nav.mediaDevices
    if (!media || typeof media.getUserMedia !== 'function') {
      return { ok: false, reason: '这个浏览器没有 getUserMedia' }
    }
    if (typeof window === 'undefined' || typeof window.MediaRecorder !== 'function') {
      return { ok: false, reason: '这个浏览器没有 MediaRecorder' }
    }
    return { ok: true, reason: '' }
  }

  function pickMime() {
    if (typeof MediaRecorder.isTypeSupported !== 'function') return ''
    var list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
    for (var i = 0; i < list.length; i += 1) {
      if (MediaRecorder.isTypeSupported(list[i])) return list[i]
    }
    return ''
  }

  function isRecording() {
    return !!(REC.recorder && REC.recorder.state === 'recording')
  }

  function stopStream(stream) {
    if (!stream || typeof stream.getTracks !== 'function') return
    var tracks = stream.getTracks() || []
    for (var i = 0; i < tracks.length; i += 1) {
      try {
        tracks[i].stop()
      } catch (error) {}
    }
  }

  function micFailed(error) {
    REC.session += 1 // 晚回来的 then/onstop 一律作废
    stopTicker()
    clearRecordingPaint()
    stopStream(REC.stream)
    REC.stream = null
    REC.recorder = null
    setRecLab('浏览器不让用麦克风（' + micReason(error) + '），这一面先跳过')
  }

  function micReason(error) {
    var name = String((error && error.name) || '')
    if (name === 'SecurityError') return '这个地址不算安全，得是 https 或 localhost'
    if (/NotAllowed|PermissionDenied/i.test(name)) return '权限被拦了，去地址栏那儿允许一下'
    if (/NotFound|DevicesNotFound/i.test(name)) return '这台机器上没找到麦克风'
    if (/NotReadable|TrackStart/i.test(name)) return '麦克风被别的程序占着'
    if (name === 'OverconstrainedError') return '这台麦克风不满足要求'
    return short(error) || '浏览器没给原因'
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      if (typeof FileReader === 'function') {
        var reader = new FileReader()
        reader.onerror = function () {
          reject(new Error('读不出这段录音'))
        }
        reader.onload = function () {
          var text = String(reader.result || '')
          var cut = text.indexOf(',')
          resolve(cut < 0 ? '' : text.slice(cut + 1))
        }
        reader.readAsDataURL(blob)
        return
      }
      if (typeof blob.arrayBuffer === 'function' && typeof btoa === 'function') {
        blob
          .arrayBuffer()
          .then(function (buffer) {
            var bytes = new Uint8Array(buffer)
            var text = ''
            for (var i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i])
            resolve(btoa(text))
          })
          .catch(reject)
        return
      }
      reject(new Error('浏览器读不出这段 audio blob'))
    })
  }

  function sayMs(ms) {
    var n = Number(ms)
    if (!Number.isFinite(n) || n <= 0) return '时长没记'
    return (n / 1000).toFixed(1) + ' 秒'
  }

  /** 底栏那颗「R 重录」现在是真的了 —— 把键位绑上，文案还原 */
  function wireRecordKey() {
    if (typeof window === 'undefined' || window.__etudeRecordKeys) return
    window.__etudeRecordKeys = true
    document.addEventListener('keydown', function (event) {
      if (!event || event.ctrlKey || event.metaKey || event.altKey) return
      if (!/^r$/i.test(String(event.key || ''))) return
      var node = event.target
      if (node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable)) return
      if (!REC.example || !REC.api) return
      event.preventDefault()
      toggleRecord()
    })
  }

  function restoreBar() {
    var bar = document.querySelector('.actbar')
    if (!bar) return
    var spans = bar.querySelectorAll('span')
    for (var i = 0; i < spans.length; i += 1) {
      var text = spans[i].textContent.trim()
      if (text !== '重录' && text !== '未接录音') continue
      spans[i].textContent = '重录'
      spans[i].setAttribute('title', '按 R 开始/停止录音（就是上面那个圆钮）')
    }
  }

  // ── 图：这一面直接给画面（不看句子） ────────────────────────────────

  function fillPicture(example, api) {
    var img = document.querySelector('.stage img.shot')
    if (!img) {
      warn('没找到 .stage img.shot，配图没换上')
      return
    }
    img.setAttribute('alt', example.sceneZh || '这个场面你会怎么讲')
    var file = example.image && example.image.file
    if (!file) {
      dropImage(img, '这一句还没配图 —— 去工厂给它挑一张真实场景的图')
      return
    }
    keepImage(img)
    bytesUrl(api, file, 'images')
      .then(function (url) {
        img.setAttribute('src', url)
      })
      .catch(function () {
        dropImage(img, '配图字节没取到（宿主没回话）')
      })
    // 说这一面只有一张图，中文场景没有别的地方落 —— 图下面补一行真场景
    noteAfter(img, example.sceneZh || '', 'scene')
  }

  // ── 原声：▶ 真能放，秒数和嗓音用 audio 里的真字段 ───────────────────

  function fillVoice(example, api) {
    var row = document.querySelector('.stage .reveal .row')
    if (!row) {
      warn('没找到 .stage .reveal .row，原声那行没换')
      return
    }
    var spans = row.querySelectorAll('span')
    var secondsEl = spans.length > 1 ? spans[1] : null
    var voiceEl = spans.length > 2 ? spans[2] : null
    var file = example.audio && example.audio.file
    if (!file) {
      if (secondsEl) secondsEl.textContent = '还没造语音'
      if (voiceEl) voiceEl.textContent = '这一句还没有原声'
      return
    }
    if (secondsEl) secondsEl.textContent = seconds(example.audio.seconds)
    if (voiceEl) {
      var bits = []
      if (example.audio.engine) bits.push(example.audio.engine)
      if (example.audio.voice) bits.push(example.audio.voice)
      voiceEl.textContent = bits.length ? bits.join(' · ') : '账本里没记嗓音'
    }
    var stage = document.querySelector('.stage')
    if (!stage) return
    var audio = audioTag(stage)
    bytesUrl(api, file, 'audio')
      .then(function (url) {
        audio.src = url
        var trigger = spans.length ? spans[0] : null
        wire(trigger, function (event) {
          if (event) event.preventDefault()
          audio.currentTime = 0
          audio.play().catch(function () {
            if (voiceEl) voiceEl.textContent = '这一句的原声放不出来'
          })
        })
        if (trigger) trigger.setAttribute('title', '放一遍原声')
      })
      .catch(function () {
        if (voiceEl) voiceEl.textContent = '原声字节没取到（宿主没回话）'
      })
  }

  // ── 词条弹层 ────────────────────────────────────────────────────────

  function fillPop(pack, example) {
    var pop = document.querySelector('#wp-word')
    if (!pop) {
      warn('没找到 #wp-word，词条弹层没换')
      return
    }
    var head = pop.querySelector('b')
    if (head) head.textContent = pack.target || ''
    var meta = pop.querySelector('div')
    if (meta) {
      var bits = []
      if (pack.ipa) bits.push(pack.ipa)
      bits.push(kindLabel(pack.kind))
      if (example) bits.push('第 ' + (example.ord || 1) + ' 句用的这个意思')
      meta.textContent = bits.join(' · ')
    }
    var paras = []
    for (var i = 0; i < pop.children.length; i += 1) {
      if (pop.children[i].tagName === 'P') paras.push(pop.children[i])
    }
    if (paras[0]) paras[0].textContent = pack.gloss || '这个包还没有英文释义'
    if (paras[1]) {
      if (pack.note) {
        paras[1].textContent = pack.note
        paras[1].style.display = ''
      } else {
        paras[1].textContent = ''
        paras[1].style.display = 'none'
      }
    }
    var det = pop.querySelector('details p')
    if (det) {
      var variants = (example && example.zhVariants) || []
      det.textContent = variants.length
        ? variants.join(' / ')
        : '这个包还没这一句的中文说法'
    }
  }

  // ── 五面横条 + 面包屑 ───────────────────────────────────────────────

  function setFaces(example, full) {
    var have = {
      听: !!(example && example.audio && example.audio.file),
      说: false, // 录音没接，这一格永远是黄的
      读: !!(example && example.image && example.image.file),
      写: !!(example && example.image && example.image.file),
      改: !!(full && full.swaps && full.swaps.length),
    }
    var pips = qa('.f5row .fi')
    if (!pips.length) {
      warn('没找到 .f5row .fi，五面横条没换')
      return
    }
    for (var i = 0; i < pips.length; i += 1) {
      if (i + 1 === FACE_INDEX) {
        pips[i].className = 'fi now'
        continue
      }
      var name = (pips[i].textContent || '').replace(/\s/g, '')
      pips[i].className = 'fi ' + (have[name] ? 'ok' : 'warn')
    }
    var bar = document.querySelector('.strip .track i')
    if (bar) bar.style.width = Math.round((FACE_INDEX / FACE_TOTAL) * 100) + '%'
    var crumbs = qa('.strip .crumb')
    var last = crumbs[crumbs.length - 1]
    if (last) last.textContent = FACE_INDEX + ' / ' + FACE_TOTAL
  }

  function setCrumbOrd(ord) {
    var crumb = document.querySelector('.strip .crumb')
    if (!crumb) return
    var first = crumb.querySelector('span')
    if (first) first.textContent = '第 ' + ord + ' 句'
  }

  function setTitle(text) {
    var chip = document.querySelector('.strip .wchip')
    if (!chip) {
      warn('没找到 .strip .wchip，目标词没换上')
      return
    }
    leadText(chip, text)
  }

  function setNote(text) {
    var mut = document.querySelector('.stage .row .mut')
    if (mut) mut.textContent = text
  }

  function linkNext(pack) {
    var a = document.querySelector('.actbar a.btn.primary')
    if (!a) return
    a.setAttribute('href', '#nav:read?w=' + encodeURIComponent(pack.target || ''))
  }

  // ── 小工具 ─────────────────────────────────────────────────────────

  function readW(query) {
    var hit = /(?:^|&)w=([^&]*)/.exec(String(query || ''))
    if (hit) {
      try {
        return decodeURIComponent(hit[1])
      } catch (error) {
        return hit[1]
      }
    }
    if (typeof location !== 'undefined' && location.search) {
      hit = /[?&]w=([^&]*)/.exec(location.search)
      if (hit) {
        try {
          return decodeURIComponent(hit[1])
        } catch (error) {
          return hit[1]
        }
      }
    }
    return ''
  }

  function pickPack(packs) {
    var list = packs || []
    if (!list.length) return null
    var want = LAST_W
    if (want) {
      for (var i = 0; i < list.length; i += 1) {
        if (String(list[i].target || '').toLowerCase() === want.toLowerCase()) return list[i]
        if (list[i].id === want) return list[i]
      }
    }
    return list[0]
  }

  function bytesUrl(api, file, kind) {
    return api.rpc('image.bytes', { file: file, kind: kind || 'images' }).then(function (res) {
      if (!res || !res.dataBase64) throw new Error('没有字节')
      return 'data:' + (res.mediaType || mediaType(file, kind)) + ';base64,' + res.dataBase64
    })
  }

  function mediaType(file, kind) {
    var ext = String(file || '').toLowerCase().replace(/^.*\./, '')
    if (ext === 'mp3') return 'audio/mpeg'
    if (ext === 'png') return 'image/png'
    if (ext === 'webp') return 'image/webp'
    if (ext === 'gif') return 'image/gif'
    return kind === 'audio' ? 'audio/mpeg' : 'image/jpeg'
  }

  function audioTag(host) {
    var el = host.querySelector('audio[data-etude]')
    if (!el) {
      el = document.createElement('audio')
      el.setAttribute('data-etude', '')
      el.style.display = 'none'
      host.appendChild(el)
    }
    return el
  }

  function keepImage(img) {
    img.style.display = ''
    clearNote(img, 'pic')
  }

  function dropImage(img, text) {
    img.removeAttribute('src')
    img.style.display = 'none'
    noteAfter(img, text, 'pic')
  }

  /** 在某个节点后面挂一条 .mut 说明（幂等：先删自己上一轮那条） */
  function noteAfter(anchor, text, key) {
    var parent = anchor.parentNode
    if (!parent) return
    var note = parent.querySelector('[data-etude-note="' + key + '"]')
    if (!note) {
      note = document.createElement('p')
      note.className = 'mut'
      note.setAttribute('data-etude-note', key)
      parent.insertBefore(note, anchor.nextSibling)
    }
    note.textContent = text
    note.style.display = text ? '' : 'none'
  }

  function clearNote(anchor, key) {
    var parent = anchor.parentNode
    if (!parent) return
    var note = parent.querySelector('[data-etude-note="' + key + '"]')
    if (note && note.parentNode) note.parentNode.removeChild(note)
  }

  function leadText(el, text) {
    for (var i = 0; i < el.childNodes.length; i += 1) {
      if (el.childNodes[i].nodeType === 3) {
        el.childNodes[i].nodeValue = text + ' '
        return
      }
    }
    el.insertBefore(document.createTextNode(text + ' '), el.firstChild)
  }

  function kindLabel(kind) {
    if (kind === 'word') return '单词'
    if (kind === 'phrase') return '说法'
    if (kind === 'sentence') return '整句'
    return '词条'
  }

  function seconds(value) {
    var n = Number(value)
    return n > 0 ? n.toFixed(1) + 's' : '语音秒数没记'
  }

  function short(error) {
    var text = String((error && error.message) || error || '')
    return text.length > 40 ? text.slice(0, 40) + '…' : text
  }

  function wire(el, handler) {
    if (el) el.onclick = handler
  }

  function warn(text) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[etude] speak: ' + text)
  }

  function qa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector))
  }

  function reroute() {
    var links = qa('.page a[href^="./"]')
    for (var i = 0; i < links.length; i += 1) {
      var hit = /^\.\/([a-z]+)\.html$/.exec(links[i].getAttribute('href') || '')
      if (hit) links[i].setAttribute('href', '#nav:' + hit[1])
    }
  }
})()
