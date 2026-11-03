/* adapters/settings.js · 设置页的数据适配
 *
 * 设计稿有 8 组（外观 / 通用 / 接口 / 智能体 / 工具 / 快捷键 / 数据 / 关于），
 * 里面大多是「卡片工厂-测试」那份 mock 的口径：27 个快捷键、每天 12 分钟、
 * 4.2 MB 数据目录、1.2 秒的调用耗时…… 插件里这些都没有。这一版只做两件事：
 *
 *   1) 有真值的填真值：版本、数据目录、导出目录、包数、自检结果、
 *      以及 state.settings 里那几项（语言 / 例句条数 / 音色 / 候选数 …）。
 *      注意：宿主现在还没把 Config 塞进 state（lib/rpc.js 的 state() 只有
 *      root/packs/selfcheck/jobs/exportDir/version），所以 settings 这一块
 *      要么有、要么写「—」，绝不编一个数出来。
 *   2) 没有后端的，整组或整栏标灰 + 一句「还没有：为什么」。不删组、不删栏 ——
 *      东西少了比灰着更难受。
 *
 * 写入这条路这一轮不做：写 Config 要在宿主侧接 configForms，适配器里不碰。
 *
 * 契约：window.__ETUDE_APPLY__ = function (state, api)
 * 规矩：只改 textContent / className / setAttribute；锚点找不到就跳过 + warn。
 */

window.__ETUDE_APPLY__ = function (state, api) {
  ensureSkin()

  var ready = !!state && state.status === 'ready'
  var s = (state && state.settings) || {}
  var packs = (state && state.packs) || []

  paintHeader(state, packs)
  paintAppearance()
  paintGeneral(s)
  paintInterface(s, state, api)
  paintAgent(state)
  paintTools(s)
  paintShortcuts()
  paintData(state)
  paintAbout(state, packs)
  paintSheets(s, state)

  if (!ready) warn('status', '设置页：state 还不是 ready，先按读到的部分画')
}

// ── 各组的实际改动 ─────────────────────────────────────────────────────────

function paintHeader(state, packs) {
  var sub = document.querySelector('.hdr .sub')
  if (!sub) return warn('hdr', '.hdr .sub 不见了')
  var version = (state && state.version) || ''
  var head = '卡片工厂 ' + (version || '版本没读到') + ' · 本机 · 账本 ' + packs.length + ' 个包'
  // .sub 里还有一个 span.setsec（「· 外观」，跟着滚动变），只换它前面的那个文本节点
  var sec = sub.querySelector('.setsec')
  var textNode = null
  for (var i = 0; i < sub.childNodes.length; i += 1) {
    if (sub.childNodes[i].nodeType === 3 && trim(sub.childNodes[i].nodeValue)) {
      textNode = sub.childNodes[i]
      break
    }
  }
  if (textNode) textNode.nodeValue = head + ' '
  else if (sec) sub.insertBefore(document.createTextNode(head + ' '), sec)
  else sub.textContent = head
}

function paintAppearance() {
  // 外观这一组的开关是设计稿自己的脚本（app.js 写 localStorage + documentElement.dataset），
  // 在插件里真的能用，所以只把说明换成实话，不标灰。
  setMut('appearance', '只管这台机器上的样子 · 存在浏览器里，不进宿主配置')
}

function paintGeneral(s) {
  // 界面语言：设计稿自己切（app2.js 处理 [data-set="lang"] 的高亮），存在本机
  var seg = document.querySelector('#general [data-set="lang"]')
  if (seg) {
    var cur = s.uiLocale || s.language || ''
    var items = seg.querySelectorAll('[data-val]')
    var hit = false
    for (var i = 0; i < items.length; i += 1) {
      var on = items[i].getAttribute('data-val') === cur
      // 只加/去 .on，别的 class（.off 之类）保留 —— 整串覆盖会把「未做」的样式抹掉
      var rest = trim(items[i].className.replace(/(^|\s)on(\s|$)/g, ' '))
      items[i].className = on ? rest + ' on' : rest
      if (on) hit = true
    }
    if (!hit && cur) warn('lang', '语言 ' + cur + ' 没有对应的按钮')
    // 设计稿的 css 给 span.off 补了个「未做」小标签（app.css:7395），原文里又写了「（未做）」，
    // 屏幕上就成了「其他语言（未做）未做」。把原文里的括注去掉，让那枚标签自己说话。
    var off = seg.querySelector('span.off')
    if (off) off.textContent = '其他语言'
  } else {
    warn('lang', '#general [data-set="lang"] 不见了')
  }
  setDesc('general', '语言', '界面只有中英两套，记在这台机器上；造例句用哪种语言由配置 language 定，现在只有 en。')

  // 通知：插件没有通知渠道，账本里也没有到期时间（没有调度引擎）
  var notify = field('general', '通知')
  if (notify) {
    setText(notify.querySelector('.badge-ok'), '没做')
    setBadgeClass(notify.querySelector('.badge-ok'), false)
    disable(notify.querySelector('.ctl button'), '没有通知接口')
    offNode(notify)
  }
  setDesc('general', '通知', '还没有：插件不发通知 —— 账本里没有到期时间，也就没有「到点提醒」这回事。')

  // 权限：不录音、不读剪贴板；读文件走宿主的只读工具
  var perm = field('general', '权限')
  if (perm) {
    setChips(perm, ['麦克风 · 没做', '文件 · 走宿主'])
    offNode(perm.querySelector('.ctl'))
  }
  setDesc('general', '权限', '插件不录音、不读剪贴板。要读文件走宿主的只读工具；「说」这一面还没做。')

  setDesc('general', '隐私', '账本、素材、合成音频都放在本机数据目录；不上传、不训练、没有云端副本。')
}

function paintInterface(s, state, api) {
  var model = pick(s, ['model', 'llmModel'])
  var engine = s.ttsEngine
  var voice = pick(s, ['ttsVoiceEdge', 'ttsVoice'])
  var rate = s.rate

  var cards = qa('#interface .nowrow .ncard')
  if (cards.length < 3) warn('ncards', '#interface 的现在三张卡不是 3 张')
  if (cards[0]) {
    setText(cards[0].querySelector('.nv'), model || '跟随会话')
    setText(
      cards[0].querySelector('.nu'),
      model ? '造句子用它' : '造句子借当前会话的模型 · 没填 base url',
    )
    disable(cards[0].querySelector('button'), '换模型还没接')
  }
  if (cards[1]) {
    setText(cards[1].querySelector('.nv'), engine ? engine + (voice ? ' · ' + shortVoice(voice) : '') : '还没读到')
    setText(cards[1].querySelector('.nu'), 'en-US · 语速 ' + (rate || '值没接'))
    disable(cards[1].querySelector('button'), '换音色还没接')
  }
  if (cards[2]) {
    // 插件不生图：候选图是图库检索来的（lib/images.js），不是模型画
    setText(cards[2].querySelector('.nv'), '图库检索')
    setText(
      cards[2].querySelector('.nu'),
      (s.candidateLimit ? '候选 ' + s.candidateLimit + ' 张' : '候选数没接') +
        ' · 像素预检 ' +
        onOff(s.pixelCheck, '没接') +
        ' · 不是生图',
    )
    disable(cards[2].querySelector('button'), '图片来源还没接')
  }

  setSum('m-model', (model || '跟随会话') + ' · ' + (s.llmBaseUrl || '没填 base url'))
  setSum('m-voice', joinFact([engine, voice && shortVoice(voice), rate], '值还没接到宿主'))
  setSum(
    'm-image',
    joinFact(
      [s.candidateLimit ? '候选 ' + s.candidateLimit + ' 张' : '', s.pixelCheck == null ? '' : '预检 ' + onOff(s.pixelCheck)],
      '值还没接到宿主',
    ),
  )
  setSum('m-request', (s.proxyUrl || '直连') + ' · 超时和重试没有配置项')

  // 连通性：宿主不记每次调用的耗时和 token，这行只能是自检结果
  var cf = field('interface', '连通性')
  var badge = cf && cf.querySelector('.badge-ok')
  var btn = cf && cf.querySelector('.ctl button')
  var sum = readSelfcheck(state && state.selfcheck)
  if (badge) setBadge(badge, sum.text, sum.ok)
  if (cf) setText(cf.querySelector('.desc'), connectDesc(sum))

  if (btn && !btn.__etudeSelfcheck) {
    btn.__etudeSelfcheck = true
    btn.setAttribute('title', '跑一遍插件自检（只读）')
    btn.addEventListener('click', function () {
      if (!api || typeof api.rpc !== 'function') return
      btn.disabled = true
      api
        .rpc('selfcheck', {})
        .then(function (sc) {
          var r = readSelfcheck(sc)
          if (badge) setBadge(badge, r.text, r.ok)
          if (cf) setText(cf.querySelector('.desc'), connectDesc(r))
          btn.disabled = false
        })
        .catch(function () {
          if (badge) setBadge(badge, '没跑起来', false)
          if (cf) setText(cf.querySelector('.desc'), '自检没跑起来：宿主没回话。')
          btn.disabled = false
        })
    })
  }

  // 配置随手带：没有导出/导入配置的接口，Config 只能从 DSH 的插件设置里改
  var carry = field('interface', '配置随手带')
  if (carry) {
    var btns = qa('.ctl button', carry)
    for (var b = 0; b < btns.length; b += 1) disable(btns[b], '没有导出/导入配置的接口')
    offNode(carry)
  }
  setDesc('interface', '配置随手带', '还没有：宿主没有导出/导入配置的接口。要改配置得去 DSH 的插件设置。')
}

function paintAgent(state) {
  var version = (state && state.version) || '—'

  var conn = field('agent', '当前连接')
  if (conn) {
    setText(
      conn.querySelector('.desc'),
      '插件 dsh-etude ' +
        version +
        ' · RPC 通道 /etude · 工具 5 个：etude_create / status / pack / build / delete · 界面与 agent 同一套 handler',
    )
  }

  var hands = field('agent', '给它哪些手')
  if (hands) setChips(hands, ['5 项 · 一直开着'])

  var tpl = field('agent', '提示词模板')
  if (tpl) {
    setChips(tpl, ['系统 · 没接', '造句 · 没接', '场景 · 没接'])
    setText(tpl.querySelector('.desc'), '还没有：提示词写在代码里，没有版本号，也不能改。')
    disable(tpl.querySelector('.ctl button'), '没有模板编辑接口')
  }

  var look = field('agent', '让它自己看一遍')
  if (look) {
    var btns = qa('.ctl button', look)
    for (var i = 0; i < btns.length; i += 1) {
      disable(btns[i], '没有体检接口')
      if (btns[i].className.indexOf('primary') >= 0) btns[i].textContent = '还没有建议'
    }
    setText(look.querySelector('.desc'), '还没有：没有「体检」这个动作，也没有建议清单。')
  }

  var logRow = document.querySelector('#agent [data-modal="m-log"]')
  if (logRow) {
    var spans = logRow.querySelectorAll('span')
    if (spans[0]) setText(spans[0], '还没有改动记录')
    if (spans[1]) setText(spans[1], '0 条')
    disable(logRow, '没有改动日志')
  }

  offGroup('agent', '这项还没有：插件没做 agent 的开关，那 5 个工具对它是固定的')
}

function paintTools(s) {
  var pers = field('tools', '个性化')
  if (pers) {
    setChips(pers, ['时长 · 没接', '新词 · 没接', '出声 · 没接'])
    setText(pers.querySelector('.desc'), '还没有：Config 里没有「每天多少分钟 / 每天几个新说法 / 出不出声」这几个字段。')
    disable(pers.querySelector('.ctl button'), '没有这几项配置')
    offNode(pers)
  }

  var card = field('tools', '造卡默认')
  if (card) {
    setChips(card, [
      s.examplesPerLesson != null ? s.examplesPerLesson + ' 句' : '例句数 · 没接',
      s.zhVariants != null ? s.zhVariants + ' 种说法' : '说法数 · 没接',
      '配图 ' + onOff(s.autoPrepareCandidates, '没接'),
    ])
    setText(
      card.querySelector('.desc'),
      '值来自 Config：examplesPerLesson / zhVariants / autoPrepareCandidates。这一轮只显示，改不了。',
    )
    disable(card.querySelector('.ctl button'), '写回配置还没接')
  }

  var src = field('tools', '素材')
  if (src) {
    setChips(src, ['字幕 · 没接'])
    setText(src.querySelector('.desc'), '还没有：字幕导入没做，也没有「素材目录」这个接口。')
    var sb = qa('.ctl button', src)
    for (var i = 0; i < sb.length; i += 1) disable(sb[i], '没有素材导入接口')
    offNode(src)
  }

  var exp = field('tools', '实验')
  if (exp) {
    setText(exp.querySelector('.desc'), '还没有实验开关 —— 插件里没有可试的旁路。')
    disable(exp.querySelector('.ctl button'), '没有实验开关')
    offNode(exp)
  }
}

function paintShortcuts() {
  setMut('shortcuts', '设计稿写了 27 个 · 插件没绑改键接口')

  // 键位是设计稿 app.js 自己在改文字（不落盘），所以留着手感、只把 title 写实
  var kbds = qa('#shortcuts .kbd.kb')
  for (var i = 0; i < kbds.length; i += 1) {
    kbds[i].setAttribute('title', '能改，但只改这一行字，刷新就回去')
  }
  if (!kbds.length) warn('kbds', '#shortcuts 里没有 .kbd.kb')

  var hint = document.querySelector('#shortcuts .keyhint')
  if (hint) {
    setText(hint, '点键位能改，但只改这一行字、刷新就回去 —— 插件没有存键位的地方，真绑键也没接。')
    hint.classList.add('etude-mut') // 同一个「会被设计稿藏起来」的家族，一起放出来
  }

  // 搜索框和「恢复默认」是设计稿的空壳，点了什么都不会发生
  var searchField = document.querySelector('#shortcuts .field')
  if (searchField) {
    var btns = qa('.ctl button', searchField)
    for (var b = 0; b < btns.length; b += 1) disable(btns[b], '没有存键位的地方，恢复不了')
    offNode(searchField.querySelector('.ksearch'))
  }
}

function paintData(state) {
  var root = (state && state.root) || ''
  var out = (state && state.exportDir) || ''

  var backup = field('data', '数据备份与恢复')
  if (backup) {
    var bb = qa('.ctl button', backup)
    for (var i = 0; i < bb.length; i += 1) disable(bb[i], '没有备份/恢复接口')
    offNode(backup)
  }
  setDesc('data', '数据备份与恢复', '还没有：没有备份/恢复接口。账本就是一个 JSON，手动复制数据目录也行。')

  var dir = field('data', '数据目录')
  if (dir) {
    var db = qa('.ctl button', dir)
    for (var j = 0; j < db.length; j += 1) disable(db[j], '没有打开目录/改目录的接口')
    offNode(dir.querySelector('.ctl'))
  }
  setDesc('data', '数据目录', root ? root + ' · 体积还没接（要先有个量目录的接口）' : '还没读到数据目录')

  var cache = field('data', '清除缓存')
  if (cache) {
    setChips(cache, ['体积还没接'])
    disable(cache.querySelector('.ctl button'), '没有清缓存的接口')
    offNode(cache)
  }
  setDesc('data', '清除缓存', '还没有：没有单独清音频的接口，也就不知道能清多少。')

  var move = field('data', '迁移数据')
  if (move) {
    var mb = qa('.ctl button', move)
    for (var k = 0; k < mb.length; k += 1) disable(mb[k], '目录只能在 DSH 的插件设置里改')
    offNode(move)
  }
  setDesc('data', '迁移数据', '还没有：数据目录由 DSH 插件设置里的 Config.dataDir 定，这里改不了。')

  var io = field('data', '导入 / 导出')
  if (io) {
    var ib = qa('.ctl button', io)
    for (var m = 0; m < ib.length; m += 1) disable(ib[m], '没有导入/导出接口')
    offNode(io)
  }
  setDesc('data', '导入 / 导出', '还没有：账本导入导出没接口。造好的卡片包会导出到 ' + (out || '（还没读到导出目录）'))

  var reset = field('data', '重置数据')
  if (reset) {
    var rb = qa('.ctl button', reset)
    for (var n = 0; n < rb.length; n += 1) disable(rb[n], '只有单个包的删除，没有整体重置')
    offNode(reset)
  }
  setDesc('data', '重置数据', '还没有整体重置：只能一个包一个包删（etude_delete）。删了不可撤销，而备份接口也没有 —— 要留底就手动复制数据目录。')
}

function paintAbout(state, packs) {
  var version = (state && state.version) || ''
  var root = (state && state.root) || ''

  var ver = field('about', '版本')
  if (ver) {
    setChips(ver, [version ? 'v' + version : '版本没读到'])
  }
  setDesc('about', '版本', '卡片工厂 ' + (version || '—') + ' · 账本 ' + packs.length + ' 个包' + (root ? ' · 数据在 ' + root : ''))

  var check = field('about', '检查更新')
  if (check) {
    var cb = qa('.ctl button', check)
    for (var i = 0; i < cb.length; i += 1) disable(cb[i], '没有发布渠道')
  }

  var auto = field('about', '自动检查更新')
  if (auto) {
    var sw = auto.querySelector('.sw')
    if (sw) sw.className = 'sw'
    offNode(auto)
  }
  setDesc('about', '自动检查更新', '没有发布渠道，所以不发请求 —— 这个开关没有意义。')
}

function paintSheets(s, state) {
  var root = (state && state.root) || ''

  // 隐私弹层里写死的 %LOCALAPPDATA%/dsh-etude-test/ 换成真目录
  var privacy = document.getElementById('m-privacy')
  if (privacy) {
    var snote = privacy.querySelector('.snote')
    setText(snote, root ? '现在的位置：' + root : '现在的位置还没读到')
  } else {
    warn('m-privacy', '没有 #m-privacy 弹层')
  }

  // 权限弹层：按插件真实情况写，不写「已允许」
  var perm = document.getElementById('m-perm')
  if (perm) {
    var rows = qa('.srow', perm)
    var badges = ['没做', '按需', '经宿主', '没读', '按需']
    for (var i = 0; i < rows.length && i < 5; i += 1) {
      var b = rows[i].querySelector('.badge-ok')
      if (!b) continue
      setBadge(b, badges[i], i === 4 ? readSelfcheck(state && state.selfcheck).ok : false)
    }
    disable(perm.querySelector('#perm-check'), '没有权限检查接口')
  }

  // 数据目录弹层
  var dd = document.getElementById('m-datadir')
  if (dd) {
    var dRows = qa('.srow', dd)
    if (dRows[0]) {
      setText(dRows[0].querySelector('.sd'), (root || '还没读到数据目录') + ' · 体积还没接')
    }
    if (dRows[1]) {
      setText(dRows[1].querySelector('.sd'), '还没有：数据目录由 DSH 的插件设置（Config.dataDir）定，这里改不了。')
      var inp = dRows[1].querySelector('.inp')
      if (inp) inp.textContent = ''
      disable(dRows[1].querySelector('button'), '改目录还没接')
    }
    setText(dd.querySelector('.snote'), '这一轮只显示真值；写回配置要在宿主里接 configForms。')
  }

  // 四个折叠行的弹层：能对上的填真值，存不下来就明说
  var model = pick(s, ['model', 'llmModel'])
  var voice = pick(s, ['ttsVoiceEdge', 'ttsVoice'])
  setRowText('m-model', 'Base URL', s.llmBaseUrl || '没填（跟随会话）')
  setRowText('m-model', '模型', model || '—')
  setRowText('m-voice', '音色', voice || '—')
  setRowText('m-voice', '语速', s.rate || '—')
  setRowText('m-image', '每句候选数', s.candidateLimit != null ? s.candidateLimit + ' 张' : '—')
  setRowSw('m-image', '像素预检', s.pixelCheck !== false)
  setRowText('m-request', '代理', s.proxyUrl || '（空）')
  setRowText('m-request', '超时', '没有这项')
  setRowText('m-request', '重试', '没有这项')
  setRowText('m-request', '并发', '没有这项')
  setRowText('m-card', '一个说法造几句', s.examplesPerLesson != null ? s.examplesPerLesson + ' 句' : '—')
  setRowText('m-card', '每句几种中文说法', s.zhVariants != null ? s.zhVariants + ' 种' : '—')
  setRowSw('m-card', '顺手配候选图', !!s.autoPrepareCandidates)

  var locks = ['m-model', 'm-voice', 'm-image', 'm-request', 'm-card', 'm-personal', 'm-source', 'm-datadir', 'm-log']
  for (var L = 0; L < locks.length; L += 1) lockSave(locks[L])
}

// ── 小工具 ─────────────────────────────────────────────────────────────────

var warned = {}

function trim(v) {
  return String(v == null ? '' : v).replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
}

function warn(key, why) {
  if (warned[key]) return
  warned[key] = 1
  try {
    console.warn('[settings] ' + why)
  } catch (e) {}
}

function qa(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel))
}

function setText(node, value) {
  if (!node) return
  node.textContent = value
  // 设计稿在插件里把 .desc / .ghead .mut / .keyhint 整片藏了（密度策略），
  // 可「这项还没有」就写在这些行里。只要适配器往它里面说过话，就把它放出来 ——
  // 只放我们改过的节点，没碰过的照旧藏着。
  var cls = String(node.className || '')
  if (/(^|\s)desc(\s|$)/.test(cls)) node.classList.add('etude-note')
  if (/(^|\s)(mut|keyhint)(\s|$)/.test(cls)) node.classList.add('etude-mut')
}

/* 一组里按 .lab 的文字找那一栏 —— 设计稿的 .field 没有 id，只能按标题找 */
function field(sec, label) {
  var box = document.getElementById(sec)
  if (!box) {
    warn('sec:' + sec, '没有 #' + sec + ' 这一组')
    return null
  }
  var list = qa('.field', box)
  for (var i = 0; i < list.length; i += 1) {
    var lab = list[i].querySelector('.lab')
    if (lab && trim(lab.textContent) === label) return list[i]
  }
  warn('field:' + sec + ':' + label, '「' + label + '」这一栏找不到')
  return null
}

function setDesc(sec, label, text) {
  var f = field(sec, label)
  if (!f) return
  var d = f.querySelector('.desc')
  if (!d) return warn('desc:' + label, '「' + label + '」没有 .desc')
  setText(d, text) // setText 会顺带给它加 .etude-note，把设计稿藏掉的说明放回来
}

function setChips(f, texts) {
  var chips = qa('.ctl .chip', f)
  if (!chips.length) return warn('chips:' + trim(f.textContent).slice(0, 8), '这一栏没有 .chip')
  for (var i = 0; i < chips.length; i += 1) {
    chips[i].textContent = i < texts.length ? texts[i] : '—'
  }
}

function setMut(sec, text) {
  var box = document.getElementById(sec)
  if (!box) return warn('sec:' + sec, '没有 #' + sec)
  var mut = box.querySelector('.ghead .mut')
  if (!mut) return warn('mut:' + sec, '#' + sec + ' 的组标题里没有 .mut')
  setText(mut, text)
}

function offNode(node) {
  if (node) node.classList.add('etude-off')
}

function offGroup(sec, why) {
  var box = document.getElementById(sec)
  if (!box) return warn('sec:' + sec, '没有 #' + sec + ' 这一组')
  box.classList.add('etude-off')
  setMut(sec, why)
}

function disable(node, tip) {
  if (!node) return
  if (node.tagName === 'BUTTON') node.disabled = true
  else node.classList.add('etude-off')
  if (tip) node.setAttribute('title', tip)
}

function setSum(modalId, text) {
  var row = document.querySelector('[data-modal="' + modalId + '"] .fsum')
  if (!row) return warn('sum:' + modalId, '没有 ' + modalId + ' 的 .fsum')
  row.textContent = text
}

function sheetRow(modalId, label) {
  var box = document.getElementById(modalId)
  if (!box) {
    warn(modalId, '没有 #' + modalId + ' 这个弹层')
    return null
  }
  var rows = qa('.srow', box)
  for (var i = 0; i < rows.length; i += 1) {
    var sl = rows[i].querySelector('.sl')
    if (sl && trim(sl.textContent) === label) return rows[i]
  }
  warn('row:' + modalId + ':' + label, modalId + ' 里没有「' + label + '」这一行')
  return null
}

function setRowText(modalId, label, text) {
  var row = sheetRow(modalId, label)
  if (!row) return
  var target = row.querySelector('.sr .inp') || row.querySelector('.sr .chip')
  if (!target) return warn('rowtext:' + label, modalId + ' 的「' + label + '」里没有 .inp/.chip')
  target.textContent = text
}

function setRowSw(modalId, label, on) {
  var row = sheetRow(modalId, label)
  if (!row) return
  var sw = row.querySelector('.sr .sw')
  if (!sw) return warn('rowsw:' + label, modalId + ' 的「' + label + '」里没有 .sw')
  sw.className = on ? 'sw on' : 'sw'
}

function lockSave(modalId) {
  var box = document.getElementById(modalId)
  if (!box) return warn(modalId, '没有 #' + modalId + ' 这个弹层')
  var btns = qa('.sfoot .btn.primary, .sfoot #dd-go', box)
  for (var i = 0; i < btns.length; i += 1) {
    var b = btns[i]
    b.disabled = true
    b.setAttribute('title', '这一轮只显示真值，写回配置还没接（宿主侧要接 configForms）')
    var t = trim(b.textContent)
    if (t === '存下' || t === '改到这里') b.textContent = '还存不了'
  }
}

function setBadgeClass(node, ok) {
  if (!node) return
  node.className = ok ? 'badge-ok' : 'badge-ok bad'
}

function setBadge(node, text, ok) {
  if (!node) return
  node.className = ok ? 'badge-ok' : 'badge-ok bad'
  node.textContent = text
}

function pick(s, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var v = s && s[keys[i]]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function onOff(v, unknown) {
  if (v === true) return '开'
  if (v === false) return '关'
  return unknown || '—'
}

/* 几个值拼一行；一个都没有就别硬凑一串破折号，直接说实话 */
function joinFact(parts, fallback) {
  var list = []
  for (var i = 0; i < parts.length; i += 1) {
    var v = trim(parts[i])
    if (v && v !== '—' && v !== '没接') list.push(v)
  }
  return list.length ? list.join(' · ') : fallback
}

function shortVoice(v) {
  return String(v)
    .replace(/^[a-z]{2}-[A-Z]{2}-/, '')
    .replace(/Neural$/, '')
}

/* selfcheck 两种形状都认：宿主给的是 { checks:[{id,ok,detail}], ... }，
   预览脚手架给的是直接一个数组。 */
function readSelfcheck(sc) {
  var list = null
  if (sc && Object.prototype.toString.call(sc) === '[object Array]') list = sc
  else if (sc && sc.checks && sc.checks.length) list = sc.checks
  if (!list || !list.length) return { ok: false, text: '还没体检', detail: '还没跑过自检' }

  var parts = []
  var bad = []
  for (var i = 0; i < list.length; i += 1) {
    var c = list[i] || {}
    var id = c.id || '?'
    parts.push(id + (c.ok ? ' ✓' : ' ×'))
    if (!c.ok) bad.push(id)
  }
  if (!bad.length) {
    return { ok: true, text: '自检 ' + list.length + ' 项全过', detail: parts.join(' · ') }
  }
  return { ok: false, text: bad.length + ' 项没过', detail: parts.join(' · ') + '（没过的：' + bad.join('、') + '）' }
}

function connectDesc(sum) {
  return '宿主不记每次造句的耗时和 token，所以「最近一次调用」这行给不了。下面是自检：' + sum.detail + '。'
}

/* 标灰的样式只注入一次；不改设计稿的 css 文件。 */
function ensureSkin() {
  if (document.getElementById('etude-settings-skin')) return
  var style = document.createElement('style')
  style.id = 'etude-settings-skin'
  style.textContent =
    '.etude-off{opacity:.55}' +
    '.etude-off a,.etude-off button,.etude-off .seg,.etude-off .sw,.etude-off .sw2,.etude-off .kbd,.etude-off .ksearch,.etude-off input,.etude-off [contenteditable]{pointer-events:none!important}' +
    '.badge-ok.bad{color:var(--fg3)}' +
    '.badge-ok.bad::before{background:var(--ghost);box-shadow:none}' +
    '.btn:disabled,.btn.primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}' +
    // 设计稿为了密度把 .desc / .ghead .mut / .keyhint 在插件里 display:none 了。
    // 「这项还没有」全靠这几句说清楚，只把适配器写过的那些放出来，别的照旧藏。
    '.setbody .group .field .desc.etude-note{display:block}' +
    '.setbody .group .ghead .mut.etude-mut{display:inline}' +
    '.setbody .group .keyhint.etude-mut{display:block}'
  document.head.appendChild(style)
}
