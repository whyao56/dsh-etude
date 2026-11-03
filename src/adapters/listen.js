/* adapters/listen.js · 「听」这一面的数据适配
 *
 * design/listen.html 里写死了：目标词 succumb、第 2 句、3.2s 语音、一句
 * 「I'm afraid I succumbed to temptation…」、一张 assets/factory/c1.jpg 的图。
 * 插件里这些全得换成真账本 —— 词是包里的目标，句子是包里第 1 条例句。
 *
 * 契约与规矩见 docs/ADAPTERS.md：
 *   · 只改值，不重排结构；
 *   · 锚点对不上就 console.warn 跳过，绝不抛错把整页打空；
 *   · 媒体永远走 RPC 取字节（插件不开 HTTP 路由），不拼 /etude/media/xxx；
 *   · 算不出来的就写字说明，不留设计稿里的假数字。
 */

;(function () {
  var FACE_INDEX = 1
  var FACE_TOTAL = 5
  var FACE = '听'

  // 深链 ?w=<词>：页面跑在 iframe 的 srcdoc 里，location.search 永远是空的。
  // 宿主其实把 query 塞进了 state 消息（见 src/30-frame.js 的 kind:'state'），
  // 但帧内运行时只留下 value，query 被丢掉 —— 这里自己补听一份。
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
    markMic()
    if (!state || state.status !== 'ready') {
      setNote('账本还没读出来，稍等一下。')
      return
    }
    var pack = pickPack(state.packs)
    if (!pack) {
      setNote('账本里还没有包 —— 去「工厂」造一个，这一面才有句子听。')
      setTitle('(还没有包)')
      return
    }
    setTitle(pack.target || '(没名字)')
    setFaces(null, null)
    // 例句先按第 1 条占位，真值回来再覆盖（ord 也一起换）
    setCrumbOrd(1)
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
        fillSound(example, api)
        fillPicture(example, api)
        var cue = document.querySelector('.stage .reveal .cue')
        if (cue) cue.textContent = example.sentence || ''
        else warn('没找到 .stage .reveal .cue，句子没换上')
        linkNext(full)
      })
      .catch(function (error) {
        setNote('例句没取到（' + short(error) + '）。')
      })
  }

  // ── 麦克风：后端没录音，就别让它按下去像在录 ──────────────────────

  function markMic() {
    var btn = document.querySelector('.stage button.btn.dim')
    if (!btn) return
    btn.disabled = true
    btn.setAttribute('title', '录音还没接')
    btn.style.opacity = '0.45'
    btn.style.cursor = 'not-allowed'
  }

  // ── 音：真播出来，秒数用 audio.seconds ───────────────────────────────
  function fillSound(example, api) {
    var play = document.querySelector('.stage .play')
    var row = play ? play.closest('.row') : null
    var mut = row ? row.querySelector('.mut') : null
    var file = example.audio && example.audio.file
    if (!play) warn('没找到 .stage .play，播放键没接上')
    if (!file) {
      if (mut) mut.textContent = '这一句还没有语音'
      if (play) {
        play.disabled = true
        play.title = '这一句还没造语音'
      }
      return
    }
    if (play) {
      play.disabled = false
      play.title = '放一遍'
    }
    if (mut) mut.textContent = seconds(example.audio.seconds)
    var stage = document.querySelector('.stage')
    if (!stage) return
    var audio = audioTag(stage)
    bytesUrl(api, file, 'audio')
      .then(function (url) {
        audio.src = url
        var again = document.querySelector('.stage .btn.ghost')
        wire(play, function () {
          audio.currentTime = 0
          audio.play().catch(function () {
            if (mut) mut.textContent = '这一句的语音放不出来'
          })
        })
        wire(again, function (event) {
          if (event) event.preventDefault()
          audio.currentTime = 0
          audio.play().catch(function () {})
        })
      })
      .catch(function () {
        if (mut) mut.textContent = '语音字节没取到（宿主没回话）'
        if (play) play.disabled = true
      })
  }

  // ── 图：藏起来的答案，点「看画面」才展开 ─────────────────────────────

  function fillPicture(example, api) {
    var img = document.querySelector('.stage .reveal .shot')
    if (!img) {
      warn('没找到 .stage .reveal .shot，配图没换上')
      return
    }
    if (img.tagName !== 'IMG') {
      // 设计稿这一页把 .shot 直接挂在 <img> 上；哪天换成 figure 包裹也能用
      img = img.querySelector('img') || img
    }
    img.setAttribute('alt', example.sceneZh || '刚才那句对应的场面')
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
  }

  // ── 词条弹层：词、音标、英文释义、例句、中文说法 ────────────────────

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

  // ── 五面横条 + 面包屑 ────────────────────────────────────────────────

  function setFaces(example, full) {
    var have = {
      听: !!(example && example.audio && example.audio.file),
      说: false, // 后端没有录音，永远空着
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
    else warn('没找到 .strip .crumb，进度数字没换')
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
    // 后面那个 <i>?</i> 是词条弹层的开关，只能换前面的文字
    leadText(chip, text)
  }

  function setNote(text) {
    var mut = document.querySelector('.stage .row .mut')
    if (mut) mut.textContent = text
  }

  function linkNext(pack) {
    var a = document.querySelector('.actbar a.btn.primary')
    if (!a) return
    a.setAttribute('href', '#nav:speak?w=' + encodeURIComponent(pack.target || ''))
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
    // 预览是静态快照，?w= 是空的 —— 兜底必须给第一个包，否则截图一片假数字
    return list[0]
  }

  /** 媒体字节 → data: URL。后端只回 dataBase64，类型按扩展名自己认。 */
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
    var note = img.parentNode && img.parentNode.querySelector('[data-etude-note="pic"]')
    if (note && note.parentNode) note.parentNode.removeChild(note)
  }

  function dropImage(img, text) {
    img.removeAttribute('src')
    img.style.display = 'none'
    var parent = img.parentNode
    if (!parent) return
    var note = parent.querySelector('[data-etude-note="pic"]')
    if (!note) {
      note = document.createElement('p')
      note.className = 'mut'
      note.setAttribute('data-etude-note', 'pic')
      parent.insertBefore(note, img.nextSibling)
    }
    note.textContent = text
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
    if (typeof console !== 'undefined' && console.warn) console.warn('[etude] listen: ' + text)
  }

  function qa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector))
  }

  /** iframe 里 ./cards.html 这种相对链接是死链，改成 #nav:cards 走消息桥。 */
  function reroute() {
    var links = qa('.page a[href^="./"]')
    for (var i = 0; i < links.length; i += 1) {
      var hit = /^\.\/([a-z]+)\.html$/.exec(links[i].getAttribute('href') || '')
      if (hit) links[i].setAttribute('href', '#nav:' + hit[1])
    }
  }
})()
