/* adapters/study.js · 学习页的数据适配
 *
 * 设计稿这一屏写死的是 abandon 那张卡：那一句、六条背景、两条假链接（giphy / youtu.be）、
 * 3.3s、以及「1 分钟 / 3 天 / 8 天 / 15 天」四个复习间隔。插件里这些都得换成账本里真有的东西，
 * 账本里没有的（录音、调度引擎、外部动图视频）就写成「没有」，不留假数字。
 *
 * 契约（跟其它页一套）：
 *   window.__ETUDE_APPLY__ = function (state, api) { ... }
 *   state = { status:'ready', packs:[...], jobs, settings, root, selfcheck }
 *   api.rpc(endpoint, payload) → Promise<value>
 *   宿主每拿到一次新 state 就调一次，所以这里所有东西都得幂等。
 *
 * 这一页要用的端点：
 *   pack.get    { id }                          → 平铺的包，examples[] / swaps[] 在顶上一层
 *   image.bytes { file, kind:'images'|'audio' } → 只有 { dataBase64 }，mediaType 得自己按扩展名推
 *   插件不开 HTTP 路由，所以图/音只能走 image.bytes，绝不能去请求 /etude/media/...
 *
 * 规矩：
 *   · 只改「值」，不重排结构；
 *   · 找不到锚点就跳过 + console.warn，绝不抛错把整页打空；
 *   · 算不出来的数就写清楚为什么，不留假数字。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  var store = ensureStore()
  try {
    apply(state, api || {}, store)
  } catch (error) {
    warn('适配器自己出错了，这一页保留设计稿原样：' + ((error && error.message) || error))
  }
}

/* 五个面：设计稿里的标签和提示语原样留着，提示语后面接账本里的状态。 */
var FACE_HINTS = {
  listen: '声音 → 画面',
  speak: '画面 → 声音',
  read: '句子 → 画面',
  write: '画面 → 拼写',
  vary: '换一个说法',
}
var FACE_ORDER = ['listen', 'speak', 'read', 'write', 'vary']

var DEFAULT_RATE_NOTE = '四个评分键没有调度引擎：点了只在这一页记一次，不写账本、不排下次复习。'

/* ───────────── 状态：跨 apply 存一点东西，靠这个做到幂等 ───────────── */

function ensureStore() {
  var store = window.__ETUDE_STUDY__
  if (!store) {
    store = window.__ETUDE_STUDY__ = {
      seq: 0, // pack.get 的序号，回来晚的那份扔掉
      packId: '',
      pack: null,
      word: '',
      media: {}, // file → data URL（同一个文件不重复要字节）
      typed: {}, // '包id' → 这一页打的字
      rates: {}, // '包id:档位' → 点了几次
      faces: null,
      wired: false, // 拦跳页的监听器只装一次
    }
  }
  return store
}

function apply(state, api, store) {
  // 设计稿的按钮会真的 location.href = './study.html?...'，在 srcdoc iframe 里会把整格跳空
  guardNavigation(store)
  rewriteLinks(store)

  if (!state || !state.status || state.status === 'loading') {
    setHeader({ deckName: '账本', idx: '账本还在读', where: '等宿主把账本推过来' })
    setNote('宿主还在读账本，读出来这一页会自己填上。')
    return
  }
  if (state.status === 'error') {
    setHeader({ deckName: '账本', idx: '账本没读出来', where: '宿主那边出错了' })
    setNote('宿主读账本失败了 —— 去设置 → 插件里看 dsh-etude 的状态。')
    return
  }

  var packs = (state.packs || []).filter(function (one) {
    return one && one.id
  })
  var wanted = wordFromUrl()
  var stub = findPack(packs, wanted)
  store.word = wanted

  if (!stub) {
    paintNoPack()
    return
  }

  // 头先填。这一步不等 RPC，免得页面上一直挂着设计稿的「06:41 · 这一轮 12 张」。
  setHeader({
    deckName: kindLabel(stub.kind),
    idx: '正在读这个包…',
    where: stub.target ? '正在读「' + stub.target + '」' : '正在读这个包',
  })
  fillExplain(stub, null)

  if (typeof api.rpc !== 'function') {
    setHeader({ idx: '取不到数据', where: '宿主没给 RPC' })
    setNote('宿主没把 RPC 递过来 —— 例句、图、语音都取不到。刷新一下面板再试。')
    return
  }

  var seq = (store.seq += 1)
  Promise.resolve(api.rpc('pack.get', { id: stub.id }))
    .then(function (full) {
      if (seq !== store.seq) return // 已经换成别的包了，这份迟到的不算
      if (!full || !full.id) throw new Error('pack.get 没回包')
      store.pack = full
      store.packId = full.id
      paint(full, api, store)
    })
    .catch(function (why) {
      if (seq !== store.seq) return
      var reason = (why && why.message) || String(why)
      warn('pack.get 失败：' + reason)
      setHeader({ idx: '这个包没取到', where: 'pack.get 失败了' })
      setNote('例句没取过来：' + reason)
      paintNoExample(stub, '这个包的例句没取到（' + reason + '）')
    })
}

/* ───────────── 深链：?w= 里是词，用它挑包 ───────────── */

/* 预览是静态快照、宿主推送 state 时也会把 query 弄丢，所以分三层找，
   最后一层是「账本里的第一个包」—— 认不出来也得有东西可看。 */
function wordFromUrl() {
  var read = function (raw) {
    var hit = /[?&#]w=([^&]*)/.exec(String(raw || ''))
    if (!hit) return ''
    var value = hit[1]
    try {
      value = decodeURIComponent(value.replace(/\+/g, ' '))
    } catch (error) {
      /* 解不开就按原文用 */
    }
    return String(value || '').trim()
  }
  var found = ''
  try {
    found = read(window.location && window.location.search) || read(window.location && window.location.hash)
  } catch (error) {
    /* 有些嵌套场景读 location 会抛，跳过 */
  }
  if (!found) {
    try {
      found = read(window.parent && window.parent.location && window.parent.location.search)
    } catch (error) {
      /* 父页面跨域就读不到，正常的 */
    }
  }
  return found
}

function findPack(packs, word) {
  if (!packs.length) return null
  var want = norm(word)
  if (want) {
    for (var i = 0; i < packs.length; i += 1) {
      if (norm(packs[i].target) === want) return packs[i]
    }
    for (var j = 0; j < packs.length; j += 1) {
      if (String(packs[j].id) === word) return packs[j]
    }
    warn('账本里没有「' + word + '」这个包，先用第一个。')
  }
  return packs[0]
}

function norm(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function kindLabel(kind) {
  if (kind === 'word') return '单词包'
  if (kind === 'phrase') return '说法包'
  if (kind === 'sentence') return '整句包'
  return '包'
}

/* ───────────── 主绘制 ───────────── */

function paint(pack, api, store) {
  var examples = Array.isArray(pack.examples) ? pack.examples : []
  var example = examples[0] || null
  var total = examples.length

  setHeader({
    deckName: kindLabel(pack.kind),
    idx: total ? '第 1 条，共 ' + total + ' 条' : '这个包还没有例句',
    where: total ? '账本里第 1 条 · 这个包一共 ' + total + ' 条例句' : '这个包还没有例句',
  })
  fillExplain(pack, example)

  if (!example) {
    paintNoExample(pack, '这个包一次例句都没造过 —— 去工厂把例句造出来，这一屏才有东西练。')
    return
  }

  var typed = store.typed[pack.id] || ''
  paintSentence(example.sentence || '', pack.target || '')
  paintBg(pack, example)
  paintMedia(example, api, store)
  paintAudio(example, api, store)
  paintRecord()
  paintType(pack, store)
  paintVary(pack, example)
  paintEdit(pack, example, api, store)

  store.faces = faceState(pack, example, typed)
  paintFaces(store.faces)
  paintRail(pack, example, typed)
  paintRate()
}

function paintNoPack() {
  setHeader({ deckName: '账本', idx: '还没有包', where: '去卡片页或工厂造一个' })
  paintNoExample(null, '账本里还没有包 —— 去工厂造一个，这里才有句子。')
}

function paintNoExample(pack, reason) {
  var store = ensureStore()
  paintSentence('', '')
  paintBg(pack, null)
  paintMedia(null, {}, store)
  paintAudio(null, {}, store)
  paintRecord()
  paintType(pack, store)
  paintVary(pack, null)
  paintEdit(pack, null, {}, store)

  setNoteIn('.drw[data-drw="sent"] .drw-p', 'etude-study-sent-note', reason || '这一条还没有句子。')

  store.faces = faceState(pack, null, '')
  paintFaces(store.faces)
  paintRail(pack, null, '')
  paintRate()
}

function setHeader(parts) {
  if (parts.deckName != null) setText('#deckName', parts.deckName)
  if (parts.idx != null) setText('#deckIdx', parts.idx)
  if (parts.where != null) setText('.st-where', parts.where)
}

/* 英文/中文小窗里的字。设计稿写的是 abandon 的释义和音标，换成这个包的。 */
function fillExplain(pack, example) {
  setText('#sw', (pack && pack.target) || '(没名字)')
  setText('#enWord', (pack && pack.target) || '')
  setText('#enTag', pack ? kindLabel(pack.kind) : '包')
  setText('#phTxt', (pack && pack.ipa) || '')
  setText('#enDef', (pack && pack.gloss) || '账本里没有释义 —— 这个包的 gloss 是空的。')
  // 中文释义账本里没有单独存，这里放这句自己的中文说法，比留设计稿的释义诚实
  var zh = zhOf(example)
  setText(
    '#zhDef',
    zh.length
      ? '中文说法：' + zh.join(' · ') + '（释义账本里没有单独存）'
      : '中文释义账本里没有单独存，中文只落在每条例句的场景和说法里。'
  )
}

/* ───────────── 七块抽屉 ───────────── */

function paintSentence(sentence, target) {
  var line = document.getElementById('sentLine')
  if (!line) {
    warn('找不到句子那一行 #sentLine')
    return
  }
  if (!sentence) {
    line.textContent = '（这个包还没有例句）'
    return
  }
  line.innerHTML = sentenceHtml(sentence, target)
}

function sentenceHtml(sentence, target) {
  var raw = String(sentence || '')
  if (!raw) return ''
  var span = wordSpan(raw, target)
  if (!span) return escapeHtml(raw)
  return (
    escapeHtml(raw.slice(0, span.start)) +
    '<b class="tgt">' +
    escapeHtml(raw.slice(span.start, span.end)) +
    '</b>' +
    escapeHtml(raw.slice(span.end))
  )
}

/* 找出目标词在句子里占的那一段。
   账本里的 target 是原形（abandon），句子里是变形（abandoned），
   所以命中以后要往两边扩到单词边界 —— 不然「换一个说法」会拼成
   「The crew aband<候选>ed ship」这种东西。 */
function wordSpan(raw, word) {
  var text = String(raw || '')
  var want = String(word || '').trim()
  if (!text || !want) return null
  var at = text.toLowerCase().indexOf(want.toLowerCase())
  if (at < 0) return null
  var start = at
  var end = at + want.length
  while (start > 0 && /[A-Za-z'’-]/.test(text.charAt(start - 1))) start -= 1
  while (end < text.length && /[A-Za-z'’-]/.test(text.charAt(end))) end += 1
  return { start: start, end: end }
}

/* 背景：账本里只有 sceneZh / sceneEn / register / voiceHint 这几项，一条一行。
   页面里有两个 #bgList（抽屉里一个、背景小窗里一个），一次都填上。 */
function paintBg(pack, example) {
  var lists = document.querySelectorAll('#bgList')
  if (!lists.length) {
    warn('找不到背景列表 #bgList')
    return
  }
  var rows = bgRows(pack, example)
  var html = ''
  for (var i = 0; i < rows.length; i += 1) {
    html += '<li><b>' + escapeHtml(rows[i][0]) + '</b>' + escapeHtml(rows[i][1]) + '</li>'
  }
  for (var k = 0; k < lists.length; k += 1) lists[k].innerHTML = html
}

function bgRows(pack, example) {
  var rows = []
  if (example) {
    if (example.sceneZh) rows.push(['中文场景', example.sceneZh])
    if (example.sceneEn) rows.push(['英文场景', example.sceneEn])
    if (example.register) rows.push(['语域', example.register])
    if (example.voiceHint) rows.push(['念的时候', example.voiceHint])
  }
  if (pack && pack.gloss) rows.push(['释义', pack.gloss])
  if (pack && pack.ipa) rows.push(['音标', pack.ipa])
  if (!rows.length) rows.push(['没有', '这个包没记场面 —— sceneZh / sceneEn 都是空的。'])
  return rows
}

/* 图：只能走 image.bytes 拿字节拼 data URL。取不到就把图藏起来写原因，
   绝不把设计稿那张 ./assets/factory/c1.jpg 留在页面上冒充。 */
function paintMedia(example, api, store) {
  var figure = document.querySelector('.drw[data-drw="media"] .shot')
  var img = document.getElementById('shotImg')
  var tag = figure ? figure.querySelector('.giftag') : null
  var list = document.getElementById('rlinks')
  var panel = document.querySelector('.drw[data-drw="media"] .drw-p')
  var image = example && example.image && example.image.file ? example.image : null

  if (!figure || !img) warn('找不到图那一块 .shot / #shotImg')

  if (!image) {
    if (img) {
      img.removeAttribute('src')
      img.style.display = 'none'
      img.alt = ''
    }
    if (figure) figure.style.display = 'none'
    fillLinks(list, [{ tag: '没有', text: '这一条还没配图 —— 账本里 image 是空的。' }])
    setNoteIn(panel, 'etude-study-media-note', '')
    return
  }

  if (figure) figure.style.display = ''
  if (img) {
    img.style.display = ''
    img.alt = example.sentence || '这一句的场面'
  }
  if (tag) tag.textContent = '静图'
  setNoteIn(panel, 'etude-study-media-note', '')

  loadMedia(api, store, image.file, 'images')
    .then(function (url) {
      if (img) img.src = url
      if (tag) tag.textContent = '静图'
    })
    .catch(function (why) {
      // 图片文件在账本里，只是这份字节没拿回来 —— 图整个藏掉，把原因写在下面
      if (img) img.style.display = 'none'
      if (figure) figure.style.display = 'none'
      var reason = (why && why.message) || String(why)
      warn('取图字节失败（' + image.file + '）：' + reason)
      setNoteIn(panel, 'etude-study-media-note', '图没显示出来：宿主没回这张图的字节（' + reason + '）')
    })

  var rows = []
  var credit = [image.author, image.license]
    .filter(function (one) {
      return !!one
    })
    .join(' · ')
  if (credit || image.creditUrl) {
    rows.push({ tag: '出处', text: credit || image.creditUrl, href: image.creditUrl || '' })
  }
  if (image.source) rows.push({ tag: '来源', text: String(image.source) })
  rows.push({ tag: '文件', text: image.file })
  fillLinks(list, rows)
}

function fillLinks(list, rows) {
  if (!list) {
    warn('找不到资源列表 #rlinks')
    return
  }
  var html = ''
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i] || {}
    var body
    if (row.href) {
      body =
        '<a href="' +
        escapeHtml(row.href) +
        '" target="_blank" rel="noreferrer">' +
        escapeHtml(row.text) +
        '</a>'
    } else {
      body = '<span class="mut">' + escapeHtml(row.text) + '</span>'
    }
    html += '<li><span class="rt">' + escapeHtml(row.tag || '') + '</span>' + body + '</li>'
  }
  list.innerHTML = html
}

/* 声音：页面里本来没有 <audio>，自己建一个藏起来，接 .pp / 再放一遍。
   时长写账本里的 audio.seconds，播放进度点亮 .wave 的竖条。 */
function paintAudio(example, api, store) {
  var box = document.querySelector('.drw[data-drw="audio"]')
  if (!box) {
    warn('找不到声音抽屉')
    return
  }
  var panel = box.querySelector('.drw-p')
  var dur = box.querySelector('.dur')
  var play = box.querySelector('.pp')
  var mark = play ? play.querySelector('span') : null
  var again = box.querySelector('.mini')
  var wave = box.querySelector('.wave')
  var audio = example && example.audio && example.audio.file ? example.audio : null
  var node = audioNode(panel)

  if (!audio) {
    if (dur) dur.textContent = '没有'
    if (play) {
      play.disabled = true
      play.title = '这一条没有语音'
    }
    if (again) again.disabled = true
    if (mark) mark.textContent = '▶'
    if (node) node.removeAttribute('src')
    waveProgress(wave, 0)
    setNoteIn(box.querySelector('.drw-p'), 'etude-study-audio-note', '这一条还没有语音 —— 账本里 audio 是空的。')
    return
  }

  if (dur) dur.textContent = secs(audio.seconds) || '有'
  if (play) {
    play.disabled = false
    play.title = '播放这一句'
  }
  if (again) again.disabled = false

  var meta = [audio.voice, audio.engine, audio.file]
    .filter(function (one) {
      return !!one
    })
    .join(' · ')
  setNoteIn(box.querySelector('.drw-p'), 'etude-study-audio-note', meta || '')

  var resetWave = function () {
    if (mark) mark.textContent = '▶'
    waveProgress(wave, 0)
  }

  if (node) {
    var fail = function (why) {
      warn('放声音失败：' + ((why && why.message) || why))
      resetWave()
      setNoteIn(
        box.querySelector('.drw-p'),
        'etude-study-audio-note',
        '这段语音放不出来：字节没取到（' + ((why && why.message) || why) + '）'
      )
    }

    // 先把字节要到，点了才不至于空放一下
    loadMedia(api, store, audio.file, 'audio')
      .then(function (url) {
        if (node.getAttribute('src') !== url) node.src = url
      })
      .catch(fail)

    node.onended = resetWave
    node.onpause = function () {
      if (mark) mark.textContent = '▶'
    }
    node.ontimeupdate = function () {
      var total = Number(audio.seconds) || node.duration || 0
      waveProgress(wave, total > 0 ? Math.min(1, node.currentTime / total) : 0)
      if (mark && !node.paused) mark.textContent = '❚❚'
    }

    var toggle = function (event) {
      if (event) {
        // 别让设计稿的点击处理器把抽屉收起来
        event.preventDefault()
        event.stopPropagation()
      }
      if (!node.paused) {
        node.pause()
        return
      }
      var started = node.play()
      if (started && started.catch) started.catch(fail)
    }

    if (play) play.onclick = toggle
    if (again) {
      again.onclick = function (event) {
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }
        try {
          node.currentTime = 0
        } catch (error) {
          /* 还没加载出来就算了，从头放也一样 */
        }
        var started = node.play()
        if (started && started.catch) started.catch(fail)
      }
    }
  }
}

function audioNode(panel) {
  var node = document.getElementById('etude-study-audio')
  if (node) return node
  if (!panel) return null
  node = document.createElement('audio')
  node.id = 'etude-study-audio'
  node.preload = 'none'
  node.style.display = 'none'
  panel.appendChild(node)
  return node
}

function waveProgress(wave, ratio) {
  if (!wave) return
  var bars = wave.children
  for (var i = 0; i < bars.length; i += 1) {
    var on = (i + 1) / bars.length <= ratio + 0.0001
    bars[i].className = on ? 'on' : ''
  }
}

/* 录音：端子里既没有麦克风权限、也没有存录音的字段和端点。
   这一块就把原因写出来，别装成能按。 */
function paintRecord() {
  var box = document.querySelector('.drw[data-drw="rec"]')
  if (!box) {
    warn('找不到录音抽屉')
    return
  }
  var head = box.querySelector('.rechint b')
  var hint = box.querySelector('.rechint .mut')
  var mic = box.querySelector('.mic')
  if (head) head.textContent = '录音还没接'
  if (hint) {
    hint.textContent = '插件取不到麦克风，账本里也没有存录音的字段 —— 这一面练不了，所以「说」一直显示还没开始。'
  }
  if (mic) {
    mic.disabled = true
    mic.title = '插件取不到麦克风，账本里也没有存录音的地方'
    mic.setAttribute('aria-label', '录音还没接')
  }
}

/* 打字：设计稿这一格本来就不落盘，插件里也只留在这一页 —— 换了包或刷新就没了。 */
function paintType(pack, store) {
  var tin = document.getElementById('tin')
  if (!tin) {
    warn('找不到打字输入框 #tin')
    return
  }
  var key = (pack && pack.id) || 'pack'
  var saved = store.typed[key] || ''
  if (tin.value !== saved) tin.value = saved
  tin.title = '打出来的字只留在这一页：不写账本、不判分'

  tin.oninput = function () {
    var text = String(tin.value || '')
    if (text.trim()) store.typed[key] = text
    else delete store.typed[key]
    var filled = !!text.trim()
    if (store.faces && store.faces.write) {
      store.faces.write = {
        ok: filled,
        text: filled ? '写过' : '还没开始',
        why: filled ? '这一页打过字，但不落账本、不判分' : '这一页还没打字（打出来的字也不落账本）',
      }
      paintFaces(store.faces)
    }
    setRailValue('type', filled ? '写过' : '还没写', !filled)
  }
}

/* 换一个说法：swaps[].candidates 是账本里的真候选，句子里把原词划掉换成候选。 */
function paintVary(pack, example) {
  var box = document.querySelector('.drw[data-drw="vary"]')
  var chips = document.getElementById('vchips')
  var shown = document.getElementById('vres')
  if (!chips || !shown) {
    warn('找不到换说法那一块 #vchips / #vres')
    return
  }
  var sentence = (example && example.sentence) || ''
  var picks = swapPicks(pack)
  var zh = zhOf(example)

  chips.innerHTML = ''
  if (!picks.length) {
    var idle = document.createElement('span')
    idle.className = 'chip'
    idle.textContent = '没有换法'
    chips.appendChild(idle)
    shown.innerHTML = sentence
      ? escapeHtml(sentence)
      : '<span class="mut" style="font-size:12px">这一条还没有句子。</span>'
    setNoteIn(
      '.drw[data-drw="vary"] .drw-p',
      'etude-study-vary-note',
      '这个包没有英文替换候选 —— 账本里 swaps 是空的。'
    )
  } else {
    picks.forEach(function (pick, index) {
      var chip = document.createElement('span')
      chip.className = 'chip' + (index === 0 ? ' on' : '')
      chip.textContent = pick.candidate
      chip.title = pick.original
        ? '把「' + pick.original + '」换成「' + pick.candidate + '」'
        : '换成「' + pick.candidate + '」'
      chip.onclick = function (event) {
        event.preventDefault()
        event.stopPropagation()
        for (var i = 0; i < chips.children.length; i += 1) chips.children[i].className = 'chip'
        chip.className = 'chip on'
        shown.innerHTML = varyHtml(sentence, pick)
      }
      chips.appendChild(chip)
    })
    // 设计稿里最后那个「自己打一个」是留给用户自己写的，本来也没行为，原样留着
    var own = document.createElement('span')
    own.className = 'chip'
    own.textContent = '自己打一个'
    chips.appendChild(own)
    shown.innerHTML = varyHtml(sentence, picks[0])
    setNoteIn('.drw[data-drw="vary"] .drw-p', 'etude-study-vary-note', '')
  }

  setNoteIn(
    '.drw[data-drw="vary"] .drw-p',
    'etude-study-zh',
    zh.length ? '这句的中文说法：' + zh.join(' · ') : '这句没有中文说法 —— 账本里 zhVariants 是空的。'
  )
}

function swapPicks(pack) {
  var swaps = Array.isArray(pack && pack.swaps) ? pack.swaps : []
  var picks = []
  for (var i = 0; i < swaps.length; i += 1) {
    var swap = swaps[i] || {}
    var list = Array.isArray(swap.candidates) ? swap.candidates : []
    for (var k = 0; k < list.length; k += 1) {
      var word = typeof list[k] === 'string' ? list[k].trim() : ''
      if (!word) continue
      // original 可能缺（预览里的 swaps 就没有），那就拿包的目标词兜底
      picks.push({
        original: String(swap.original || (pack && pack.target) || '').trim(),
        candidate: word,
      })
    }
  }
  return picks
}

function varyHtml(sentence, pick) {
  var raw = String(sentence || '')
  if (!raw) return '<span class="mut" style="font-size:12px">这一条还没有句子。</span>'
  var span = wordSpan(raw, (pick && pick.original) || '')
  if (!span) {
    return (
      escapeHtml(raw) +
      ' <span class="mut" style="font-size:12px">· 换法「' +
      escapeHtml((pick && pick.candidate) || '') +
      '」</span>'
    )
  }
  return (
    escapeHtml(raw.slice(0, span.start)) +
    '<s>' +
    escapeHtml(raw.slice(span.start, span.end)) +
    '</s> <b>' +
    escapeHtml((pick && pick.candidate) || '') +
    '</b>' +
    escapeHtml(raw.slice(span.end))
  )
}

function zhOf(example) {
  var raw = Array.isArray(example && example.zhVariants) ? example.zhVariants : []
  var out = []
  for (var i = 0; i < raw.length; i += 1) {
    var one = typeof raw[i] === 'string' ? raw[i].trim() : ''
    if (one) out.push(one)
  }
  return out
}

/* 编辑小窗：设计稿里是 abandon 那一句。把真值填进去，
   顺便在「保存」上写明白这一版存不进货本。 */
function paintEdit(pack, example, api, store) {
  var sent = document.getElementById('edSent')
  if (sent && example) sent.value = example.sentence || ''
  var word = document.getElementById('edWord')
  if (word) word.value = (pack && pack.target) || ''

  var dur = document.getElementById('edDur')
  if (dur) dur.textContent = example && example.audio ? secs(example.audio.seconds) || '有' : '没有'

  var bg = document.getElementById('edBg')
  if (bg) {
    bg.value = bgRows(pack, example)
      .map(function (row) {
        return row[0] + ' ' + row[1]
      })
      .join('\n')
  }

  var vary = document.getElementById('edVar')
  if (vary) {
    var picks = swapPicks(pack)
    vary.value = picks.length
      ? picks
          .map(function (one) {
            return one.candidate
          })
          .join(' · ')
      : ''
  }

  var save = document.getElementById('edSave')
  if (save) save.title = '这一版不写账本：保存只改这一页显示的内容'

  var img = document.getElementById('edImg')
  if (img) {
    if (example && example.image && example.image.file) {
      loadMedia(api || {}, store, example.image.file, 'images')
        .then(function (url) {
          img.src = url
        })
        .catch(function () {
          img.removeAttribute('src')
        })
    } else {
      img.removeAttribute('src')
    }
  }

  // 五个面那五个小片：有料才亮
  var states = faceState(pack, example, '')
  var pills = document.querySelectorAll('#sh-edit .edf5 .chip')
  for (var i = 0; i < pills.length && i < FACE_ORDER.length; i += 1) {
    var on = !!states[FACE_ORDER[i]].ok
    pills[i].className = 'chip' + (on ? ' on' : '')
  }
}

/* ───────────── 五面 + 右栏 + 评分 ───────────── */

/* 完成度只看账本里有没有这些字段，不猜「练没练过」：
   听 = audio.file，读 = image.file，写 = 这一页打过字，
   改 = swaps 的候选或这句的中文说法，说 = 永远没有（没录音）。 */
function faceState(pack, example, typed) {
  var audio = example && example.audio && example.audio.file ? example.audio : null
  var image = example && example.image && example.image.file ? example.image : null
  var picks = swapPicks(pack)
  var zh = zhOf(example)
  var wrote = !!String(typed || '').trim()
  var time = audio ? secs(audio.seconds) || '有语音' : ''
  return {
    listen: {
      ok: !!audio,
      text: audio ? time : '还没开始',
      why: audio ? '这一条有语音（' + time + '）' : '账本里这一条没有语音文件',
    },
    speak: {
      ok: false,
      text: '还没开始',
      why: '后端既没有录音字段也没有录音端点 —— 这一面现在练不了',
    },
    read: {
      ok: !!image,
      text: image ? '有配图' : '还没开始',
      why: image ? '这一条有配图（' + image.file + '）' : '账本里这一条没配图',
    },
    write: {
      ok: wrote,
      text: wrote ? '写过' : '还没开始',
      why: wrote ? '这一页打过字，但不落账本、不判分' : '这一页还没打字（打出来的字也不落账本）',
    },
    vary: {
      ok: picks.length > 0 || zh.length > 0,
      text: picks.length ? picks.length + ' 个换法' : zh.length ? zh.length + ' 条中文说法' : '还没开始',
      why: picks.length
        ? '账本里有 ' + picks.length + ' 个候选换法（swaps）'
        : zh.length
          ? '账本里没有英文换法，有 ' + zh.length + ' 条中文说法'
          : '账本里既没有 candidates 也没有 zhVariants',
    },
  }
}

function paintFaces(states) {
  for (var i = 0; i < FACE_ORDER.length; i += 1) {
    var face = FACE_ORDER[i]
    var button = document.querySelector('.fb[data-face="' + face + '"]')
    if (!button) {
      warn('找不到面标 .fb[data-face="' + face + '"]')
      continue
    }
    var hint = button.querySelector('i')
    if (!hint) continue
    var state = states[face] || { text: '还没开始', why: '' }
    // 不碰 .on/.done：.on 是设计稿的「当前面」，.done 是「练过」，拿它冒充「有料」就是撒谎
    hint.textContent = FACE_HINTS[face] + ' · ' + state.text
    button.title = state.why || ''
  }
}

function paintRail(pack, example, typed) {
  var states = faceState(pack, example, typed)
  var image = example && example.image && example.image.file ? example.image : null
  var audio = example && example.audio && example.audio.file ? example.audio : null
  var picks = swapPicks(pack)
  var zh = zhOf(example)
  var bg = bgRows(pack, example)
  var hasBg = !(bg.length === 1 && bg[0][0] === '没有')

  setRailValue('bg', hasBg ? bg.length + ' 条' : '没有', !hasBg)
  setRailValue('media', image ? '1 图' + (image.creditUrl || image.author ? ' 1 出处' : '') : '没有', !image)
  setRailValue('sent', example && example.sentence ? words(example.sentence) + ' 词' : '没有', !(example && example.sentence))
  setRailValue('audio', audio ? secs(audio.seconds) || '有' : '没有', !audio)
  setRailValue('rec', '没接', true)
  setRailValue('type', states.write.ok ? '写过' : '还没写', !states.write.ok)
  setRailValue(
    'vary',
    picks.length ? picks.length + ' 个' : zh.length ? zh.length + ' 条中文' : '没有',
    !picks.length && !zh.length
  )
}

function setRailValue(key, value, empty) {
  var row = document.querySelector('.rv[data-drw="' + key + '"]')
  if (!row) {
    warn('找不到右栏那一行 .rv[data-drw="' + key + '"]')
    return
  }
  var slot = row.querySelector('i')
  if (slot) slot.textContent = value
  var classes = String(row.className || '')
    .split(/\s+/)
    .filter(function (one) {
      return !!one && one !== 'dim'
    })
  if (empty) classes.push('dim')
  row.className = classes.join(' ')
}

function paintRate() {
  var buttons = document.querySelectorAll('.st-rate .st-r')
  for (var i = 0; i < buttons.length; i += 1) {
    var em = buttons[i].querySelector('em')
    // 账本里没有调度：不排下次复习，也就没有「几天后再见」这个数
    if (em) em.textContent = '未接调度'
    buttons[i].title = '没有调度引擎：这一档只在这一页记一次，不排下次复习，也不写账本'
  }
  setNote(DEFAULT_RATE_NOTE)
}

/* ───────────── 媒体字节（唯一一条取图/取音的路） ───────────── */

function loadMedia(api, store, file, kind) {
  var key = kind + ':' + file
  if (store.media[key]) return Promise.resolve(store.media[key])
  if (!api || typeof api.rpc !== 'function') return Promise.reject(new Error('宿主没给 RPC'))
  return Promise.resolve(api.rpc('image.bytes', { file: file, kind: kind })).then(function (result) {
    var base64 = result && result.dataBase64
    if (!base64) throw new Error('宿主没回 dataBase64')
    var mediaType = (result && result.mediaType) || mimeOf(file, kind)
    var url = 'data:' + mediaType + ';base64,' + base64
    store.media[key] = url
    return url
  })
}

/* image.bytes 只回字节，mime 得自己按扩展名推 */
function mimeOf(file, kind) {
  var name = String(file || '').toLowerCase()
  if (/\.png$/.test(name)) return 'image/png'
  if (/\.webp$/.test(name)) return 'image/webp'
  if (/\.gif$/.test(name)) return 'image/gif'
  if (kind === 'audio') return 'audio/mpeg'
  if (/\.wav$/.test(name)) return 'audio/wav'
  if (/\.ogg$/.test(name)) return 'audio/ogg'
  return 'image/jpeg'
}

/* ───────────── 设计稿里会跳页的按钮：拦下来，别把整格跳空 ───────────── */

/* design/study.html 自己的脚本里：点评分键 → markDone 后 location.href='./study.html?w=..'，
   点 ‹ ›（[data-word]）→ 同上，[data-step] 走到首/尾面也会拐进 goWord。
   插件的页面是 srcdoc iframe，这句 location.href 会按父页面的地址去解析，整格就白了。
   所以在捕获阶段把这几类点击吃掉，改成本页的一句话。 */
function guardNavigation(store) {
  if (store.wired) return
  store.wired = true
  document.addEventListener('click', onGuardedClick, true)
}

function onGuardedClick(event) {
  var node = event.target
  if (!node || !node.closest) return
  var swallow = false
  var rate = node.closest('.st-rate .st-r')
  var wordKey = node.closest('[data-word]')
  var step = node.closest('[data-step]')

  if (rate) {
    swallow = true
    markRate(rate)
  } else if (wordKey) {
    swallow = true
    setNote('换词要回卡片页点词名，这一页靠 ?w= 深链进来 —— 没有牌组顺序可以翻。')
  } else if (step) {
    var current = document.querySelector('.fbar .fb.on')
    var at = current ? FACE_ORDER.indexOf(current.getAttribute('data-face')) : -1
    var dir = Number(step.getAttribute('data-step')) || 0
    var next = at + dir
    if (at < 0 || next < 0 || next >= FACE_ORDER.length) {
      swallow = true
      setNote('已经在最前/最后一面了 —— 设计稿的「上一张/下一张」会真跳页，插件里没有下一张。')
    }
  }

  if (swallow) {
    event.preventDefault()
    event.stopPropagation()
  }
}

function markRate(button) {
  var store = ensureStore()
  var labelNode = button.querySelector('b')
  var label = labelNode ? String(labelNode.textContent || '').trim() : '这一档'
  var key = (store.packId || 'pack') + ':' + label
  store.rates[key] = (store.rates[key] || 0) + 1
  setNote(
    '这一条刚点的是「' +
      label +
      '」，本页第 ' +
      store.rates[key] +
      ' 次。没有调度引擎：不排下次复习，也不写账本。'
  )
}

/* 设计稿里的内部链接（卡片 / 工厂 / 统计 / 库 / 设置）在 srcdoc iframe 里同样会跳空。
   统一改写成插件约定的 #nav:，中间件和帧里都已经认这个前缀。 */
function rewriteLinks(store) {
  var links = document.querySelectorAll('a[href]')
  var current = (store.pack && store.pack.target) || store.word || ''
  for (var i = 0; i < links.length; i += 1) {
    var raw = links[i].getAttribute('href') || ''
    if (!raw || raw.charAt(0) === '#' || /^[a-z]+:/i.test(raw) || raw.indexOf('//') === 0) continue
    var hit = /^\.?\/?([a-z0-9_-]+)\.html(\?.*)?$/i.exec(raw)
    if (!hit) continue
    var page = hit[1]
    var query = hit[2] ? hit[2].slice(1) : ''
    if (!query && current && (page === 'study' || page === 'factory')) {
      query = 'w=' + encodeURIComponent(current)
    }
    links[i].setAttribute('href', '#nav:' + page + (query ? '?' + query : ''))
  }
}

/* ───────────── 小工具 ───────────── */

function setText(selector, value) {
  var node = typeof selector === 'string' ? document.querySelector(selector) : selector
  if (!node) {
    warn('找不到锚点 ' + selector)
    return null
  }
  node.textContent = value == null ? '' : String(value)
  return node
}

/* 评分条下面那一条说明（插一次，之后只改字） */
function setNote(text) {
  var node = document.getElementById('etude-study-note')
  if (!node) {
    var rate = document.querySelector('.st-rate')
    if (!rate || !rate.parentNode) {
      warn('找不到评分条 .st-rate')
      return
    }
    node = document.createElement('p')
    node.id = 'etude-study-note'
    node.className = 'mut'
    node.style.margin = '7px 0 0'
    rate.parentNode.insertBefore(node, rate.nextSibling)
  }
  node.textContent = text || ''
  node.style.display = text ? '' : 'none'
}

/* 抽屉里那一行小字：传空字符串就是删掉 */
function setNoteIn(selector, id, text) {
  var box = typeof selector === 'string' ? document.querySelector(selector) : selector
  var node = document.getElementById(id)
  if (!text) {
    if (node && node.parentNode) node.parentNode.removeChild(node)
    return
  }
  if (!box) {
    warn('找不到要写说明的抽屉 ' + selector)
    return
  }
  if (!node) {
    node = document.createElement('p')
    node.id = id
    node.className = 'mut'
    node.style.margin = '6px 0 0'
    box.appendChild(node)
  }
  node.textContent = text
}

function secs(value) {
  var number = Number(value)
  if (!isFinite(number) || number <= 0) return ''
  return (Math.round(number * 10) / 10).toFixed(1) + 's'
}

function words(sentence) {
  var text = String(sentence || '').trim()
  if (!text) return 0
  return text.split(/\s+/).length
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function warn(message) {
  if (typeof console !== 'undefined' && console.warn) console.warn('[etude/study] ' + message)
}
