/* adapters/read.js · 「读」这一面的数据适配
 *
 * design/read.html 写死了：succumb、第 2 句、一句假句子、c1.jpg 当答案。
 * 这一面句子直接给、图藏着 —— 所以图是「对一下」的答案，只在 reveal 里出现。
 *
 * 图里那行中文（sceneZh）这一面故意不显示：设计的用意是「读的时候别想中文」，
 * 摆出来就绕回翻译了。只在 alt 上留一份，读屏和加载失败时能看到。
 */

;(function () {
  var FACE_INDEX = 3
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
    markMic()
    if (!state || state.status !== 'ready') {
      setNote('账本还没读出来，稍等一下。')
      return
    }
    var pack = pickPack(state.packs)
    if (!pack) {
      setNote('账本里还没有包 —— 去「工厂」造一个，这一面才有句子读。')
      setTitle('(还没有包)')
      return
    }
    setTitle(pack.target || '(没名字)')
    setFaces(null, null)
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
        if (example.audio && example.audio.file) muteStaleHint()
        var cue = document.querySelector('.stage > .cue')
        if (cue) cue.textContent = example.sentence || ''
        else warn('没找到 .stage > .cue，句子没换上')
        fillPicture(example, api)
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

  /** 麦克风按钮：后端没录音，就别让它按下去像在录 */
  function markMic() {
    var btn = document.querySelector('.stage button.btn.dim')
    if (!btn) return
    btn.disabled = true
    btn.setAttribute('title', '录音还没接')
    btn.style.opacity = '0.45'
    btn.style.cursor = 'not-allowed'
  }

  function fillPicture(example, api) {
    var img = document.querySelector('.stage .reveal img.shot')
    if (!img) {
      warn('没找到 .stage .reveal img.shot，答案图没换上')
      return
    }
    img.setAttribute('alt', example.sceneZh || '这一句对应的场面')
    var file = example.image && example.image.file
    if (!file) {
      dropImage(img, '这一句还没配图 —— 对不上也没关系，画面缺着')
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

  function setFaces(example, full) {
    var have = {
      听: !!(example && example.audio && example.audio.file),
      说: false,
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
    var row = document.querySelector('.stage .row')
    var mut = row ? row.querySelector('.mut') : null
    if (mut) mut.textContent = text
  }

  function linkNext(pack) {
    var a = document.querySelector('.actbar a.btn.primary')
    if (!a) return
    a.setAttribute('href', '#nav:type?w=' + encodeURIComponent(pack.target || ''))
  }

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

  function short(error) {
    var text = String((error && error.message) || error || '')
    return text.length > 40 ? text.slice(0, 40) + '…' : text
  }

  function warn(text) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[etude] read: ' + text)
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
