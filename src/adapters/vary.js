/* adapters/vary.js · 「改」这一面的数据适配
 *
 * design/vary.html 写死了：succumb、第 2 句、「I'm afraid I succumbed to
 * temptation…」、三个候选（gave in to / yielded to / fell for）和「改完是这样」
 * 里拼好的替换句。
 *
 * 真数据来自包上的 swaps[]：{ role, original, candidates[], samples[] }。
 * original 是句子里的那一段原文，candidates 才是能换上去的说法。
 *
 * 用户自己写的那一句走 example.vary({ packId, ord, text })，回包是
 * { text, previous, at }；之后 pack.get 会在那条例句上带回 myVariant。
 * 设计稿这一面没有输入框，只有「自己打一个」那颗胶囊 —— 写框就摆在它那一行
 * 下面，直接吃现成的 `.stage > input.writein` 样式（宽 560 / 高 44 / 圆角 14）。
 */

;(function () {
  var FACE_INDEX = 5
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
    markButtons()
    if (!state || state.status !== 'ready') {
      setNote('账本还没读出来，稍等一下。')
      return
    }
    var pack = pickPack(state.packs)
    if (!pack) {
      setNote('账本里还没有包 —— 去「工厂」造一个，这一面才有得改。')
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
        var swap = (full.swaps && full.swaps[0]) || null
        var sentence = example.sentence || ''
        var cue = document.querySelector('.stage > .cue')
        if (cue) {
          cue.innerHTML = boldIn(sentence, (swap && swap.original) || full.target || '')
        } else {
          warn('没找到 .stage > .cue，原句没换上')
        }
        fillChips(swap)
        fillDefn(full, example, swap, sentence)
        fillScope(example, full)
        fillVary(pack, example, api)
        rewriteNext(full)
      })
      .catch(function (error) {
        setNote('例句没取到（' + short(error) + '）。')
      })
  }

  // ── 候选：第一行是换法，第二行是这个词的候选说法 ───────────────────

  function fillChips(swap) {
    var rows = qa('.stage .chips')
    if (rows.length < 2) {
      warn('没找到两行 .stage .chips，候选没换上')
      return
    }
    // 第一行「换词 / 换句式」：换句式后端没有，别让它看着可选
    var modes = qa('.chip', rows[0])
    for (var i = 0; i < modes.length; i += 1) {
      if ((modes[i].textContent || '').indexOf('换句式') >= 0) {
        modes[i].className = 'chip'
        modes[i].setAttribute('title', '换句式后端还没做')
        modes[i].style.opacity = '0.5'
      }
    }
    var row = rows[1]
    var selfChip = null
    var chips = qa('.chip', row)
    for (var j = 0; j < chips.length; j += 1) {
      if ((chips[j].textContent || '').indexOf('自己打一个') >= 0) selfChip = chips[j]
      else if (chips[j].parentNode) chips[j].parentNode.removeChild(chips[j])
    }
    var marks = (swap && swap.candidates) || []
    if (!marks.length) {
      var empty = document.createElement('span')
      empty.className = 'chip'
      empty.style.opacity = '0.55'
      empty.textContent = '这个包还没换词候选'
      row.insertBefore(empty, selfChip || null)
      return
    }
    for (var k = 0; k < marks.length; k += 1) {
      var chip = document.createElement('span')
      chip.className = 'chip' + (k === 0 ? ' on' : '')
      chip.textContent = marks[k]
      chip.setAttribute('data-etude-swap', marks[k])
      row.insertBefore(chip, selfChip || null)
    }
  }

  function fillDefn(pack, example, swap, sentence) {
    var defn = document.querySelector('.stage .defn')
    if (!defn) {
      warn('没找到 .stage .defn，「改完是这样」没换上')
      return
    }
    var body = null
    var mut = null
    var kids = defn.children
    for (var i = 0; i < kids.length; i += 1) {
      if (kids[i].tagName === 'P' && !mut) {
        if (kids[i].className && kids[i].className.indexOf('mut') >= 0) mut = kids[i]
        else body = kids[i]
      } else if (kids[i].tagName === 'P') {
        mut = mut || kids[i]
      }
    }
    var candidates = (swap && swap.candidates) || []
    if (!body) return
    if (!candidates.length) {
      body.innerHTML = boldIn(sentence, pack.target || '')
      if (mut) {
        mut.textContent =
          '这个包没有换词候选 —— 句子还在，但没有别的说法可换。回工厂重造这句，或者换一条。' +
          noteUnsaved(example)
      }
      return
    }
    var original = String((swap && swap.original) || '')
    var hit = original && sentence.toLowerCase().indexOf(original.toLowerCase()) >= 0
    if (!hit) {
      // 包里没记 original，或者记的那一段在这句里找不到 —— 不硬拼一个假句子出来
      body.innerHTML = boldIn(sentence, pack.target || '')
      if (mut) {
        mut.textContent =
          (original
            ? '包里记的换法「' + original + '」在这句里没找到 —— 先按原句看。'
            : '这个包没记这段原文（swaps[].original）—— 换出来的句子拼不了。') + noteUnsaved(example)
      }
      var inert = qa('[data-etude-swap]')
      for (var n = 0; n < inert.length; n += 1) {
        inert[n].setAttribute('title', '这句对不上原文，先不能换')
        inert[n].style.opacity = '0.55'
      }
      return
    }
    var first = candidates[0]
    body.innerHTML = swapped(sentence, original, first) || boldIn(sentence, pack.target || '')
    if (mut) mut.textContent = '句子骨架没动，只换了那个说法 —— 五个面的输入输出关系一个没变。' + noteUnsaved(example)
    // 点候选就地预览：改完是这样跟着换，选中的 chip 记个 on
    var row = qa('.stage .chips')[1]
    if (!row) return
    var chips = qa('[data-etude-swap]', row)
    for (var c = 0; c < chips.length; c += 1) {
      chips[c].onclick = (function (word) {
        return function () {
          for (var m = 0; m < chips.length; m += 1) chips[m].className = 'chip'
          this.className = 'chip on'
          body.innerHTML = swapped(sentence, original, word) || boldIn(sentence, pack.target || '')
        }
      })(chips[c].getAttribute('data-etude-swap'))
    }
  }

  /** 「这条变体」那三个 chip：图/声有没有，只开哪几面是真的 */
  function fillScope(example, full) {
    var row = null
    var rows = qa('.stage .row')
    for (var i = 0; i < rows.length; i += 1) {
      if (rows[i].querySelector('.chip')) row = rows[i]
    }
    if (!row) {
      warn('没找到「这条变体」那行 chip')
      return
    }
    var chips = qa('.chip', row)
    if (chips[0]) {
      chips[0].textContent = example.image && example.image.file ? '图 沿用原句' : '图 原句也没图'
    }
    if (chips[1]) {
      chips[1].textContent = example.audio && example.audio.file ? '声 沿用原句' : '声 还没造'
    }
    // chips[2]「只开 读 / 写」是设计定的规矩，不动
  }

  // ── 改写：写框 + 底下两颗存按钮 ─────────────────────────────────────

  /** 设计稿只有「自己打一个」那颗胶囊，没有输入框。写框摆在它那一行下面，
   *  挂成 .stage 的直接子节点就能吃 `.stage > input.writein` 的现成样式。 */
  function varyBox() {
    return document.querySelector('[data-etude-vary-input]')
  }

  function ensureVaryBox() {
    var box = varyBox()
    if (box) return box
    var rows = qa('.stage .chips')
    if (rows.length < 2) {
      warn('没找到「自己打一个」那一行，写框没地方摆')
      return null
    }
    var row = rows[1]
    box = document.createElement('input')
    box.type = 'text'
    box.className = 'inp writein'
    box.setAttribute('data-etude-vary-input', '')
    box.setAttribute('placeholder', '自己打一个：整句重说，或者只换那个说法')
    box.setAttribute('autocomplete', 'off')
    box.setAttribute('maxlength', '400')
    row.parentNode.insertBefore(box, row.nextSibling)
    return box
  }

  /** 「自己打一个」那颗胶囊：点它就聚焦写框（不删不改，只是有了落点） */
  function selfChip() {
    var chips = qa('.stage .chips .chip')
    for (var i = 0; i < chips.length; i += 1) {
      if ((chips[i].textContent || '').indexOf('自己打一个') >= 0) return chips[i]
    }
    return null
  }

  /** 状态行：写框下面那一行 .mut，第一次用时才建，之后一直复用 */
  function statusLine() {
    var note = document.querySelector('[data-etude-vary-status]')
    if (note) return note
    var box = varyBox()
    if (!box || !box.parentNode) return null
    note = document.createElement('p')
    note.className = 'mut'
    note.setAttribute('data-etude-vary-status', '')
    note.setAttribute('role', 'status')
    note.style.marginTop = '6px'
    box.parentNode.insertBefore(note, box.nextSibling)
    return note
  }

  function setStatus(text) {
    var note = statusLine()
    if (!note) {
      setNote(text)
      return
    }
    note.textContent = text
  }

  /** 「改完是这样」那一句：存下自己的改写之后，这里显示的就是改写本身 */
  function showVariant(text, pack) {
    var body = document.querySelector('.stage .defn > p:not(.mut)')
    if (!body) {
      warn('没找到「改完是这样」那一句，改写只留在写框里')
      return
    }
    body.innerHTML = boldIn(text, (pack && pack.target) || '')
  }

  // 上一次填进写框的是哪一句（packId#ord）。state 会被推好几次，同一句重推时
  // 不能拿账本里的旧文本把用户正在打的字冲掉 —— 只有真换了句子才重填。
  var LAST_BOX = ''

  function fillVary(pack, example, api) {
    var box = ensureVaryBox()
    if (!box) return
    var chip = selfChip()
    if (chip) {
      chip.onclick = function () {
        box.focus()
      }
    }
    var mine = (example && example.myVariant) || null
    var key = (pack && pack.id ? pack.id : '') + '#' + ((example && example.ord) || 1)
    var fresh = key !== LAST_BOX
    LAST_BOX = key
    if (mine && mine.text) {
      if (fresh && box.value !== mine.text) box.value = mine.text
      showVariant(mine.text, pack)
      if (fresh) setStatus('上次存的：' + oneLine(mine.text) + ' · 共 ' + countChars(mine.text) + ' 字')
    } else if (fresh) {
      if (box.value !== '') box.value = ''
      setStatus('还没存过 —— 写完点底下「先只改这一条」，会存进账本。')
    }
    var buttons = qa('.actbar button.btn.ghost')
    if (!buttons.length) {
      warn('没找到底下那两颗按钮，改写存不了')
      return
    }
    buttons[0].onclick = function () {
      saveVariant(pack, example, api, 'text')
    }
    if (buttons[1]) {
      buttons[1].onclick = function () {
        saveVariant(pack, example, api, 'voice')
      }
    }
  }

  var SAVING = false

  /** 存改写：这一面唯一会写账本的地方。空的不发 RPC，失败照实说。 */
  function saveVariant(pack, example, api, mode) {
    var box = varyBox()
    if (!box) {
      warn('没有写框，改写存不了')
      return
    }
    var text = String(box.value || '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) {
      setStatus('先写一句再存。')
      box.focus()
      return
    }
    if (!pack || !pack.id) {
      setStatus('还没取到这个包，等账本回来再存。')
      return
    }
    if (!api || typeof api.rpc !== 'function') {
      setStatus('宿主没给 RPC，存不了改写。')
      return
    }
    if (SAVING) return
    SAVING = true
    setStatus('存着呢…')
    api
      .rpc('example.vary', { packId: pack.id, ord: (example && example.ord) || 1, text: text })
      .then(function (saved) {
        var mine = (saved && saved.text) || text
        if (example) {
          example.myVariant = {
            text: mine,
            previous: (saved && saved.previous) || null,
            at: (saved && saved.at) || Date.now(),
          }
        }
        if (String(box.value || '').trim() !== mine) box.value = mine
        showVariant(mine, pack)
        setStatus(
          '存进账本了 · 共 ' +
            countChars(mine) +
            ' 字' +
            (mode === 'voice' ? ' · 语音还没接：后端没有补语音这一步' : ''),
        )
      })
      .catch(function (error) {
        setStatus('没存上：' + why(error))
      })
      .then(function () {
        SAVING = false
      })
  }

  function countChars(text) {
    return String(text || '').length
  }

  function oneLine(text) {
    var clean = String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
    return clean.length > 60 ? clean.slice(0, 60) + '…' : clean
  }

  function why(error) {
    var text = String((error && error.message) || error || '宿主没说原因')
      .replace(/\s+/g, ' ')
      .trim()
    return text.length > 80 ? text.slice(0, 80) + '…' : text
  }

  function noteUnsaved(example) {
    return example && example.myVariant && example.myVariant.text
      ? '上次存的改写还在账本里 —— 再存会顶掉它。'
      : '这句改写还没存 —— 写完点底下「先只改这一条」才进账本。'
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

  /** 底下那两颗按钮：改写真能存了，去掉 disabled / 置灰 / not-allowed。
   *  真正的 onclick 由 fillVary 挂（要拿到 pack + example），这里只保证能点。 */
  function markButtons() {
    var buttons = qa('.actbar button.btn.ghost')
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].disabled = false
      buttons[i].removeAttribute('disabled')
      buttons[i].removeAttribute('aria-disabled')
      buttons[i].style.opacity = ''
      buttons[i].style.cursor = ''
      buttons[i].style.pointerEvents = ''
      buttons[i].setAttribute(
        'title',
        i === 0
          ? '把这一页写的改写存进账本'
          : '先把改写存进账本；补语音这一步后端还没有',
      )
      buttons[i].onclick = notReady
    }
  }

  /** 账本还没回来时点了保存：照实说，不装作存上了 */
  function notReady() {
    setStatus('还没取到这一句，账本回来再存。')
  }

  function rewriteNext(pack) {
    var a = document.querySelector('.actbar a.btn.primary')
    if (!a) return
    a.setAttribute('href', '#nav:cards')
  }

  // ── 句子替换 ───────────────────────────────────────────────────────

  function swapped(sentence, original, candidate) {
    var text = String(sentence || '')
    var from = String(original || '').trim()
    if (!from || !candidate) return null
    var at = text.toLowerCase().indexOf(from.toLowerCase())
    if (at < 0) return null
    return (
      escapeHtml(text.slice(0, at)) +
      '<b style="color:var(--accent)">' +
      escapeHtml(String(candidate)) +
      '</b>' +
      escapeHtml(text.slice(at + from.length))
    )
  }

  function boldIn(sentence, needle) {
    var text = String(sentence || '')
    var from = String(needle || '').trim()
    if (!from) return escapeHtml(text)
    var at = text.toLowerCase().indexOf(from.toLowerCase())
    if (at < 0) return escapeHtml(text)
    var end = at + from.length
    // 目标词在这句里常带词尾（abandon → abandoned）：词尾一起标，别把词切开
    while (end < text.length && /[a-z']/i.test(text.charAt(end))) end += 1
    return (
      escapeHtml(text.slice(0, at)) +
      '<b style="color:var(--accent)">' +
      escapeHtml(text.slice(at, end)) +
      '</b>' +
      escapeHtml(text.slice(end))
    )
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
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
    if (typeof console !== 'undefined' && console.warn) console.warn('[etude] vary: ' + text)
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
