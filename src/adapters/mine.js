/* adapters/mine.js · 挖句页（design/mine.html）的数据适配
 *
 * 设计稿这一页演的是「在视频里挖句」：播放器 12:41 / 22:04、九行字幕、查词面板、
 * 收进来是哪张卡。插件没有视频、没有字幕、没有逐词查 —— 这三块如实标「还没接」，
 * 剩下的（库里几个包、挖到多少句、导出了几份、数据目录、收进来那张卡长什么样）
 * 全部换成真账本。
 *
 * 契约同 cards.js：window.__ETUDE_APPLY__ = function (state, api)
 * 规矩：只改值；列表行可整批重建；锚点缺了 console.warn 跳过；幂等。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  var skin = (window.__ETUDE_MINE__ = window.__ETUDE_MINE__ || { token: 0, api: api })
  skin.api = api

  if (!state || state.status !== 'ready') {
    setSub('账本还没读出来，稍等一下。')
    return
  }

  var packs = (state.packs || []).slice()
  var sentences = 0
  var exported = 0
  for (var i = 0; i < packs.length; i += 1) {
    sentences += Number((packs[i].progress || {}).total) || 0
    if (packs[i].status === 'exported' || packs[i].exportedAt) exported += 1
  }

  // ── 抬头：包数 / 导出数 / 数据目录，都是 state 里真有的
  var root = String(state.root || '')
  setSub(
    (root ? '数据在 ' + root + ' · ' : '') + packs.length + ' 个包 · ' + exported + ' 个导出过',
  )
  var rootNode = document.querySelector('.hdr .sub')
  if (rootNode && root) rootNode.setAttribute('title', '数据目录：' + root)

  setChip('已挖 ' + sentences + ' 句')
  setChipTitle('账本里所有包的例句加起来')

  // ── 播放器：插件没有视频源，进度条和时间码都不编
  var vtime = document.querySelector('.card.player .vtime')
  if (vtime) {
    vtime.textContent = '还没有视频'
    vtime.setAttribute('title', '播放器还没接：插件只认得工厂造出来的句子')
  }
  var bar = document.querySelector('.card.player .vbar > i')
  if (bar) bar.style.width = '0%'
  var wave = document.querySelectorAll('.wave i')
  for (var w = 0; w < wave.length; w += 1) wave[w].className = ''

  // ── 这一段里的说法：换成账本里真实的包
  var chipRow = document.querySelector('.card.player .chips')
  var countMut = document.querySelector('.card.player .row .mut')
  if (chipRow) {
    var oldChips = chipRow.querySelectorAll('.chip')
    for (var c = 0; c < oldChips.length; c += 1) {
      if (oldChips[c].parentNode) oldChips[c].parentNode.removeChild(oldChips[c])
    }
    if (!packs.length) {
      var none = document.createElement('span')
      none.className = 'chip'
      none.textContent = '账本里还没有包'
      chipRow.appendChild(none)
    }
    for (var p = 0; p < packs.length; p += 1) {
      var chip = document.createElement('span')
      chip.className = 'chip'
      chip.setAttribute('data-etude', 'pack')
      chip.textContent = (packs[p].target || '(没名字)') + (packs[p].gloss ? ' · ' + packs[p].gloss : '')
      chipRow.appendChild(chip)
    }
  } else {
    console.warn('[etude/mine] 找不到「这一段里的说法」那排 chip，跳过')
  }
  if (countMut) countMut.textContent = packs.length + ' 个'

  // ── 字幕：整块没有数据来源
  var subsHint = document.querySelector('.card.subs > .row .mut')
  if (subsHint) subsHint.textContent = '还没接'
  var sublines = document.querySelector('.card.subs .sublines')
  if (sublines) {
    var oldLines = sublines.querySelectorAll('.subline')
    for (var s = 0; s < oldLines.length; s += 1) {
      if (oldLines[s].parentNode) oldLines[s].parentNode.removeChild(oldLines[s])
    }
    var line = document.createElement('div')
    line.className = 'subline'
    line.setAttribute('data-etude', 'note')
    line.style.cursor = 'default'
    line.innerHTML =
      '<span class="t">—</span>' +
      '<span class="en">挖句台还没接：插件没有视频、字幕和逐词查的数据，句库里的句子全是工厂造出来的。</span>' +
      '<span class="smark"></span>'
    sublines.appendChild(line)
  } else {
    console.warn('[etude/mine] 找不到字幕列表 .sublines，跳过')
  }

  // ── 查词面板：词和释义能填，音标和词频没有
  var first = packs[0] || null
  var pw = document.querySelector('.pop .pw')
  if (pw) pw.textContent = first ? first.target || '(没名字)' : '还没有说法'
  var ipa = document.querySelector('.pop .ipa')
  if (ipa) ipa.textContent = first && first.ipa ? String(first.ipa) : '音标没接'
  var popChip = document.querySelector('.pop .pophead .chip')
  if (popChip) popChip.textContent = '词频没接'
  var lemma = document.querySelector('.pop .poplemma')
  if (lemma) {
    lemma.innerHTML =
      '释义 <b>' +
      escapeHtml((first && first.gloss) || '账本里没有释义') +
      '</b> · ' +
      kindText(first && first.kind)
  }
  var def = document.querySelector('.pop .popdef')
  if (def) def.textContent = '英文释义还没接：账本里只存了中文释义和例句。'
  var popFoot = document.querySelector('.pop .popfoot .mut')
  if (popFoot) popFoot.textContent = '出处 · 账本没记'
  var popButtons = document.querySelectorAll('.pop .popfoot .btn')
  for (var b = 0; b < popButtons.length; b += 1) {
    popButtons[b].disabled = true
    popButtons[b].style.opacity = '.45'
    popButtons[b].style.cursor = 'default'
    popButtons[b].setAttribute('title', '还没接：查词面板没有后端')
  }

  // ── 收进来是这样：拿第一个包的第一条例句，真句子、真场景、真语音
  if (!first) {
    var front = document.querySelector('.cardprev .mini.front')
    if (front) {
      var name = front.querySelector('.minien')
      if (name) name.textContent = '账本里还没有包，去「工厂」造一个'
    }
    return
  }
  loadPreview(first, api, skin)
}

function loadPreview(pack, api, skin) {
  if (!api || !api.rpc) {
    setMinien('没有宿主连接，读不到例句')
    return
  }
  skin.token = (skin.token || 0) + 1
  var token = skin.token
  api
    .rpc('pack.get', { id: pack.id })
    .then(function (full) {
      if (!skin || token !== skin.token) return
      fillPreview(full || pack)
    })
    .catch(function (error) {
      if (!skin || token !== skin.token) return
      setMinien('例句没取到：' + String((error && error.message) || error))
    })
}

function fillPreview(pack) {
  var examples = (pack.examples || []).slice()
  var ex = null
  for (var i = 0; i < examples.length; i += 1) {
    if (examples[i].image && examples[i].image.file) {
      ex = examples[i]
      break
    }
  }
  if (!ex) ex = examples[0] || null

  var imgLine = document.querySelector('.cardprev .miniimg .mut')
  if (imgLine) {
    if (ex && ex.image && ex.image.file) {
      imgLine.textContent = '有配图 · ' + (ex.image.width || 0) + '×' + (ex.image.height || 0)
    } else {
      imgLine.textContent = '还没有配图'
    }
  }
  setMinien(ex ? ex.sentence || '' : '这个包还没有例句')

  // 有配图就真把它读出来铺在卡片预览上（image.bytes 返回 base64）。
  var shot = document.querySelector('.cardprev .miniimg')
  if (shot && ex && ex.image && ex.image.file && api && api.rpc) {
    var mime = /\.png$/i.test(ex.image.file) ? 'image/png' : 'image/jpeg'
    api
      .rpc('image.bytes', { file: ex.image.file, kind: 'images' })
      .then(function (res) {
        var b64 = res && res.dataBase64
        if (!b64) return
        shot.style.backgroundImage = 'url(data:' + mime + ';base64,' + b64 + ')'
        shot.style.backgroundSize = 'cover'
        shot.style.backgroundPosition = 'center'
        if (imgLine) imgLine.style.display = 'none'
      })
      .catch(function (error) {
        console.warn('[etude/mine] 配图没取到：', String((error && error.message) || error))
      })
  }

  var audioLine = document.querySelector('.cardprev .miniaudio .mut')
  if (audioLine) {
    if (ex && ex.audio && ex.audio.file) {
      var seconds = ex.audio.seconds ? Number(ex.audio.seconds).toFixed(1) + 's' : '—'
      audioLine.textContent = seconds + ' · ' + String(ex.audio.engine || '语音')
    } else {
      audioLine.textContent = '还没有语音'
    }
  }

  var zh = document.querySelector('.cardprev .minizh')
  if (zh) zh.textContent = (ex && (ex.sceneZh || ex.sceneEn)) || '账本没记中文场景'

  var tags = document.querySelector('.cardprev .minitags')
  if (tags) {
    var old = tags.querySelectorAll('.chip')
    for (var t = 0; t < old.length; t += 1) {
      if (old[t].parentNode) old[t].parentNode.removeChild(old[t])
    }
    var labels = [pack.target || '', pack.gloss || '', ex && ex.register ? String(ex.register) : '']
    for (var l = 0; l < labels.length; l += 1) {
      if (!labels[l]) continue
      var chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = labels[l]
      tags.appendChild(chip)
    }
  }

  var src = document.querySelector('.cardprev .minisrc')
  if (src) src.textContent = '账本没记出处（导入视频那条路还没接）'
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

function setMinien(text) {
  var node = document.querySelector('.cardprev .minien')
  if (node) node.textContent = text
  else console.warn('[etude/mine] 找不到收进来那张卡的句子 .minien，跳过')
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function kindText(kind) {
  if (kind === 'word') return '单词'
  if (kind === 'phrase') return '说法'
  if (kind === 'sentence') return '整句'
  return '还没有包'
}

function setSub(text) {
  var node = document.querySelector('.hdr .sub')
  if (node) node.textContent = text
  else console.warn('[etude/mine] 找不到 .hdr .sub，跳过')
}

function setChip(text) {
  var chip = document.querySelector('.hdr .act .chip')
  if (chip) chip.textContent = text
  else console.warn('[etude/mine] 找不到 .hdr .act .chip，跳过')
}

function setChipTitle(text) {
  var chip = document.querySelector('.hdr .act .chip')
  if (chip) chip.setAttribute('title', text)
}
