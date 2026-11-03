/* adapters/cards.js · 卡片页的数据适配
 *
 * 这一页在 design 里写死了 4 个牌组、12 张待复习、以及「abandon / The crew abandoned
 * ship within minutes.」那张「接着练」卡。插件里这些都得换成真账本。
 *
 * 契约（其它页的适配器也是这套）：
 *   window.__ETUDE_APPLY__ = function (state, api) { ... }
 *   state = { status:'ready', packs:[...], jobs:[...], settings, root, selfcheck }
 *   api.rpc(endpoint, payload) → Promise<value>
 *
 * 规矩：
 *   · 只改「值」，不重排结构 —— 结构是设计稿的，重排等于重画；
 *   · 找不到锚点就跳过，宁可少改也不要抛错把整页打空；
 *   · 数据算不出来就写清楚「为什么没有」，不留假数字。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  ensureSkin()
  if (!state || state.status !== 'ready') {
    setDeckStat('账本还没读出来，稍等一下。')
    return
  }
  var packs = state.packs || []

  // ── 牌组表：设计稿是「Anki 调度」口径，插件没有调度引擎。
  // 换成「例句 / 配图 / 语音 / 到哪一步」，一行一个包。
  var table = document.querySelector('.deckcard')
  if (table) {
    var head = table.querySelector('.deckhead')
    if (head) {
      // 设计稿表头是「牌组 + 三个数字 + 齿轮」= 5 格；插件多一列，所以仍然 5 格：
      // 牌组 / 例句 / 配图 / 语音 / 到哪一步。齿轮那格不要了（没有包选项弹层）。
      var labels = ['例句', '配图', '语音', '到哪一步']
      var nums = head.querySelectorAll('.dnum')
      for (var i = 0; i < nums.length; i += 1) {
        nums[i].textContent = labels[i] || ''
        nums[i].className = 'dnum'
      }
      var gearHead = head.querySelector('.dgear')
      if (gearHead && gearHead.parentNode) gearHead.parentNode.removeChild(gearHead)
      if (nums.length < 4) {
        for (var k = nums.length; k < 4; k += 1) {
          var cell = document.createElement('span')
          cell.className = 'dnum'
          cell.textContent = labels[k] || ''
          head.appendChild(cell)
        }
      }
    }

    // 清掉设计稿的 4 行（表头下方全部 .drow）
    var rows = table.querySelectorAll('.drow')
    for (var r = 0; r < rows.length; r += 1) {
      if (rows[r].parentNode) rows[r].parentNode.removeChild(rows[r])
    }

    if (!packs.length) {
      var empty = document.createElement('div')
      empty.className = 'drow'
      empty.innerHTML =
        '<span class="dname"><span class="mut">账本里还没有包 —— 去「工厂」造一个</span></span>' +
        '<span class="dnum"></span><span class="dnum"></span><span class="dnum"></span><span class="dnum"></span>'
      table.appendChild(empty)
      setDeckStat('随包是空的。造一个词、一个说法或一整句，素材齐了就能出厂。')
      setNextUp(null)
      return
    }

    packs.forEach(function (pack) {
      var progress = pack.progress || {}
      var row = document.createElement('div')
      row.className = 'drow' + (pack.kind === 'word' ? '' : ' child')
      var step = stepText(pack)
      var due = step.cls === 'due'
      // 5 格：目标 / 例句 / 配图 / 语音 / 到哪一步（齿轮那格去掉了）
      row.innerHTML =
        '<span class="dname"><a href="#nav:study?w=' +
        encodeURIComponent(pack.target || '') +
        '">' +
        escapeHtml(pack.target || '(没名字)') +
        '</a><span class="chip">' +
        (pack.kind === 'word' ? '单词' : pack.kind === 'phrase' ? '说法' : '整句') +
        '</span></span>' +
        '<span class="dnum">' +
        (progress.total || 0) +
        '</span>' +
        '<span class="dnum">' +
        (progress.images || 0) +
        '</span>' +
        '<span class="dnum">' +
        (progress.audios || 0) +
        '</span>' +
        '<span class="dnum' +
        (due ? ' due' : '') +
        '">' +
        step.text +
        '</span>'
      table.appendChild(row)
    })

    var totalExamples = packs.reduce(function (n, p) {
      return n + ((p.progress && p.progress.total) || 0)
    }, 0)
    setDeckStat(
      '一共 ' + packs.length + ' 个包 · ' + totalExamples + ' 条例句。每句都要配图和语音，两样齐了才算能出厂。',
    )
  }

  // ── 接着练：挑一个还没出厂的包，把它的第一条例句拉出来
  var pick = null
  for (var q = 0; q < packs.length; q += 1) {
    if (!packs[q].learnable || packs[q].status !== 'exported') {
      pick = packs[q]
      break
    }
  }
  if (!pick) pick = packs[0]
  setNextUp(pick, api)
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

/* 设计稿的牌组表是 5 格：名称 + 三个数字 + 齿轮（36）。插件把齿轮那格换成
   「到哪一步」这样的四个字，36px 放不下，所以重排列宽。只在卡片页注入一次。 */
function ensureSkin() {
  if (document.getElementById('etude-cards-skin')) return
  var style = document.createElement('style')
  style.id = 'etude-cards-skin'
  style.textContent =
    '.deckhead,.drow{grid-template-columns:minmax(0,1fr) 64px 64px 64px 96px}' +
    '.deckhead>.dnum,.drow>.dnum{text-align:right}' +
    '.deckhead>.dnum:last-child,.drow>.dnum:last-child{text-align:right;justify-self:end}' +
    // 接一句「还没练过」的说明；设计稿没有这一行，用最轻的字号放在按钮下面
    '.etude-note{margin:12px 0 0;font-size:12px;line-height:1.6;color:var(--fg3)}'
  document.head.appendChild(style)
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stepText(pack) {
  var status = pack.status
  if (status === 'generating') return { text: '正在造', cls: '' }
  if (status === 'text') return { text: '造例句', cls: '' }
  if (status === 'media') return { text: '配素材', cls: '' }
  if (status === 'packed') return { text: '能出厂', cls: 'due' }
  if (status === 'exported') return { text: '已导出', cls: '' }
  if (status === 'failed') return { text: '上次出错', cls: 'due' }
  return { text: status || '刚建好', cls: '' }
}

function setDeckStat(text) {
  var node = document.querySelector('.deckstat')
  if (node) node.textContent = text
}

function setNextUp(pack, api) {
  var card = document.querySelector('.nextup')
  if (!card) return
  if (!pack) {
    card.style.display = 'none'
    return
  }
  card.style.display = ''
  var word = card.querySelector('.word')
  if (word) word.textContent = pack.target || ''
  var qline = card.querySelector('.qline')
  var mut = card.querySelector('.mut')
  if (qline) qline.textContent = '正在读这个包…'
  if (mut) mut.textContent = ''

  if (!api || !api.rpc) return
  api
    .rpc('pack.get', { id: pack.id })
    .then(function (full) {
      var example = (full && full.examples && full.examples[0]) || null
      if (!example) {
        if (qline) qline.textContent = '这个包还没有例句'
        return
      }
      if (qline) qline.textContent = example.sentence || ''
      if (mut) mut.textContent = example.sceneZh || example.sceneEn || ''
      // 五个面的圆点：设计稿里 .pip.ok 的意思是「这一面已经过了」，
      // 但账本里根本没有作答记录（没有 reviews / 没有逐面进度），
      // 所以五格一律灰着，再补一句说明——不能拿「有没有配图/语音」冒充成绩。
      var faces = card.querySelectorAll('.face .pip')
      for (var i = 0; i < faces.length; i += 1) faces[i].className = 'pip warn'

      var note = card.querySelector('.etude-note')
      if (!note) {
        note = document.createElement('p')
        note.className = 'etude-note'
        var foot = card.querySelector('.nextup-foot') || card.querySelector('.faces')
        if (foot && foot.parentNode) foot.parentNode.insertBefore(note, foot.nextSibling)
        else card.appendChild(note)
      }
      note.textContent = '这一句还没练过 —— 账本里没有作答记录，点开才开始记。'
      var btn = card.querySelector('.nextup-foot .btn')
      if (btn) {
        btn.setAttribute('href', '#nav:study?w=' + encodeURIComponent(pack.target || ''))
      }
    })
    .catch(function () {
      if (qline) qline.textContent = '例句没取到（宿主没回话）'
    })
}
