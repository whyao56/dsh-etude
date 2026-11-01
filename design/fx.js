/* 工厂 v5 用的小零件。
   只做三件事：开面板、关面板、同化下拉的开关。
   面板本身是静态 HTML，这个文件不生成任何内容。 */
(function () {
  'use strict';

  function panelOf(btn) {
    var id = btn.getAttribute('data-sheet');
    return id ? document.getElementById(id) : null;
  }

  function close(sheet) {
    if (!sheet) return;
    sheet.hidden = true;
    document.documentElement.classList.remove('sheet-open');
  }

  function open(sheet) {
    if (!sheet) return;
    sheet.hidden = false;
    document.documentElement.classList.add('sheet-open');
    var first = sheet.querySelector('.mcard');
    if (first) first.scrollTop = 0;
  }

  // 面板必须挂在 body 上：.page 上有 transform，会让 position:fixed 以它为准
  function reparent () {
    var sheets = document.querySelectorAll('.msheet')
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].parentNode !== document.body) document.body.appendChild(sheets[i])
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reparent)
  } else {
    reparent()
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-sheet]');
    if (opener) {
      event.preventDefault();
      // 面板里再开面板：先把同层的关掉，避免叠三层
      var sheet = panelOf(opener);
      var inner = opener.closest('.msheet');
      if (inner && inner !== sheet) close(inner);
      open(sheet);
      return;
    }

    if (event.target.closest('[data-close]')) {
      event.preventDefault();
      close(event.target.closest('.msheet'));
      return;
    }

    // 点遮罩（不是点卡片本体）也关
    if (event.target.classList && event.target.classList.contains('msheet')) {
      close(event.target);
      return;
    }

    var face = event.target.closest('[data-face]')
    if (face) {
      var pick = face.getAttribute('data-face')
      var card = face.closest('.mbody')
      var btns = card.querySelectorAll('[data-face]')
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i] === face)
      var boxes = card.querySelectorAll('[data-face-box]')
      for (var j = 0; j < boxes.length; j++) {
        boxes[j].hidden = boxes[j].getAttribute('data-face-box') !== pick
      }
      return
    }

    // 加义项小窗里的两个页签（自己写 / 让模型补）
    var f2 = event.target.closest('[data-face2]')
    if (f2) {
      var pick2 = f2.getAttribute('data-face2')
      var wrap = f2.closest('.mbody')
      var all = wrap.querySelectorAll('[data-face2]')
      for (var a = 0; a < all.length; a++) all[a].classList.toggle('on', all[a] === f2)
      var boxes2 = wrap.querySelectorAll('[data-face2-box]')
      for (var b2 = 0; b2 < boxes2.length; b2++) {
        boxes2[b2].hidden = boxes2[b2].getAttribute('data-face2-box') !== pick2
      }
      return
    }
    var tgl = event.target.closest('#tgl-same');
    if (tgl) {
      var box = document.getElementById('same-box');
      if (box) {
        box.hidden = !box.hidden;
        tgl.textContent = box.hidden ? '同化到其他维度 ▾' : '同化到其他维度 ▴';
      }
    }
  });

  // 指针在卡片上扫过：把光斑位置写进 CSS 变量。
  // 两件事让它在低配机上也不掉帧：
  //   1) 一帧只处理一次（rAF 合并 pointermove）
  //   2) 位移不到 3px 就跳过；「压下」的类名只在跨过阈值时才切换
  var hoverEl = null
  var pendingX = 0
  var pendingY = 0
  var rafId = 0
  var pressed = false

  function flush () {
    rafId = 0
    var el = hoverEl
    if (!el) return
    var rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', (pendingX - rect.left) + 'px')
    el.style.setProperty('--my', (pendingY - rect.top) + 'px')
    if (el.classList.contains('fx-blk')) {
      var near = (pendingX - rect.left) < rect.width * 0.18
      if (near !== pressed) {
        pressed = near
        el.classList.toggle('press-l', near)
      }
    }
  }

  function schedule () {
    if (rafId) return
    rafId = requestAnimationFrame(flush)
  }

  document.addEventListener('pointermove', function (event) {
    var card = event.target.closest('.fx-blk, .fx-row > summary')
    if (!card) return
    if (card !== hoverEl) {
      hoverEl = card
      pressed = false
      var r0 = card.getBoundingClientRect()
      card.style.setProperty('--mx', (event.clientX - r0.left) + 'px')
      card.style.setProperty('--my', (event.clientY - r0.top) + 'px')
      return
    }
    var dx = Math.abs(event.clientX - pendingX)
    var dy = Math.abs(event.clientY - pendingY)
    pendingX = event.clientX
    pendingY = event.clientY
    if (dx < 3 && dy < 3) return
    schedule()
  }, { passive: true })

  document.addEventListener('pointerleave', function (event) {
    var card = event.target.closest('.fx-blk, .fx-row > summary')
    if (!card) return
    if (card === hoverEl) hoverEl = null
    if (card.classList.contains('fx-blk')) card.classList.remove('press-l')
    pressed = false
  }, true)

  // ── 义项工具条：加一句 / 删句子 / 勾选 ──
  function senseOf (el) { return el.closest('.fx-sense') }

  function refreshDel (sense) {
    var picks = sense.querySelectorAll('.pick')
    var cnt = 0
    for (var i = 0; i < picks.length; i++) if (picks[i].checked) cnt++
    var go = sense.querySelector('[data-delgo]')
    if (go) {
      go.disabled = cnt === 0
      go.textContent = '删除 ' + cnt + ' 句'
    }
  }

  function enterDel (sense, on) {
    sense.classList.toggle('del', on)
    if (!on) {
      var picks = sense.querySelectorAll('.pick')
      for (var i = 0; i < picks.length; i++) picks[i].checked = false
    }
    refreshDel(sense)
  }

  function renumber (sense) {
    var rows = sense.querySelectorAll('.fx-row')
    for (var i = 0; i < rows.length; i++) {
      var n = rows[i].querySelector('.n')
      if (n) n.textContent = String(i + 1)
    }
  }

  document.addEventListener('click', function (event) {
    var addBtn = event.target.closest('[data-add]')
    if (addBtn) {
      var sense = senseOf(addBtn)
      if (!sense) return
      var rows = sense.querySelectorAll('.fx-row')
      var count = rows.length + 1
      var fresh = document.createElement('details')
      fresh.className = 'fx-row is-new'
      fresh.innerHTML =
        '<summary>' +
        '<span class="pickbox"><input type="checkbox" class="pick" /></span>' +
        '<span class="n">' + count + '</span>' +
        '<span class="s">（新加的一句，按顺序排在这一义项最后）</span>' +
        '<span class="pips"><i></i><i></i><i></i><i></i><i></i></span>' +
        '<span class="wc">0 词</span>' +
        '<span class="ix" title="播放">▶</span>' +
        '<button class="mini xs" type="button" data-sheet="sh-bg">背景</button>' +
        '<button class="mini xs go" type="button">出厂</button>' +
        '<span class="more">⋯</span>' +
        '</summary>'
      var last = rows.length ? rows[rows.length - 1] : null
      if (last && last.nextSibling) sense.insertBefore(fresh, last.nextSibling)
      else sense.appendChild(fresh)
      refreshDel(sense)
      return
    }

    var delBtn = event.target.closest('[data-del]')
    if (delBtn) {
      var s2 = senseOf(delBtn)
      if (s2) enterDel(s2, !s2.classList.contains('del'))
      return
    }

    var cancel = event.target.closest('[data-delcancel]')
    if (cancel) {
      var s3 = senseOf(cancel)
      if (s3) enterDel(s3, false)
      return
    }

    var goBtn = event.target.closest('[data-delgo]')
    if (goBtn) {
      var s4 = senseOf(goBtn)
      if (!s4) return
      var picks = s4.querySelectorAll('.pick')
      for (var j = 0; j < picks.length; j++) {
        if (!picks[j].checked) continue
        var row = picks[j].closest('.fx-row')
        if (row) row.parentNode.removeChild(row)
      }
      enterDel(s4, false)
      renumber(s4)
      return
    }

    // 勾选框不能触发展开 / 收起；点在小方框外面（padding 上）也要能勾
    var box = event.target.closest('.pickbox')
    if (box) {
      event.preventDefault()
      event.stopPropagation()
      // 自己转：preventDefault 挡掉浏览器默认勾选，stopPropagation 挡掉 summary 展开
      var input = box.querySelector('.pick')
      if (input) {
        input.checked = !input.checked
        var s5 = senseOf(box)
        if (s5) refreshDel(s5)
      }
    }
  }, true)

  document.addEventListener('change', function (event) {
    if (!event.target.classList || !event.target.classList.contains('pick')) return
    var sense = senseOf(event.target)
    if (sense) refreshDel(sense)
  })

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var opened = document.querySelector('.msheet:not([hidden])');
    if (opened) {
      close(opened);
      event.stopPropagation();
    }
  });
})();
