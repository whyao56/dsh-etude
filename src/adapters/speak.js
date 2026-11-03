/* adapters/speak.js · 「说」这一面的数据适配
 *
 * design/speak.html 里写死了：succumb、第 2 句、c1.jpg、3.2s、
 * 「edge · Aria · 女声」和一句假句子。
 *
 * 这一面有一件后端完全没有的事：录音。
 * 账本里没有录音字段，rpc 里也没有录音端点，网页里也没接 MediaRecorder ——
 * 所以这里不假装能录：圆按钮置灰、写明「录音还没接」，把这一面降级成
 * 「看图说一句 + 自己听原声对」的可跳过状态。
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
    markRecorder()
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

  // ── 录音：没有这回事，就别让它看起来有 ──────────────────────────────
  function markRecorder() {
    var rec = document.querySelector('.stage .rec')
    var lab = document.querySelector('.stage .reclab')
    if (rec) {
      rec.setAttribute('aria-disabled', 'true')
      rec.setAttribute('title', '录音还没接')
      rec.style.opacity = '0.4'
      rec.style.cursor = 'not-allowed'
      rec.style.pointerEvents = 'none'
      rec.onclick = null
    } else {
      warn('没找到 .stage .rec，录音标记没打上')
    }
    if (lab) {
      lab.textContent = '录音还没接 —— 这一面先跳过：看图说一句，或者点开「听原声」跟着念'
    } else {
      warn('没找到 .stage .reclab')
    }
    // 底栏那颗「R 重录」也是录音的幌子 —— 改成实话，键位提示本身留着
    var bar = document.querySelector('.actbar')
    var spans = bar ? bar.querySelectorAll('span') : []
    for (var i = 0; i < spans.length; i += 1) {
      if (spans[i].textContent.trim() === '重录') {
        spans[i].textContent = '未接录音'
        spans[i].setAttribute('title', '后端没有录音这个端点')
      }
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
