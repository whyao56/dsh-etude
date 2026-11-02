/* 卡片工厂 · 交互层 v2
   只做样式稿里真会动的事：开关、下拉、分区、五面切换、图表滑到位才演、
   九宫格挑图、浮层、键盘、转场、空/载/错三态演示。没有依赖，也没有构建。 */
(function () {
  var d = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function on(t, ev, fn, o) { if (t) t.addEventListener(ev, fn, o); }
  function rnd(seed) {
    var s = seed || 1;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  function fmt(s) { return '0:' + String(Math.max(0, Math.round(s))).padStart(2, '0'); }

  /* 三态：?s=empty|loading|error */
  var state = (location.search.match(/[?&]s=([a-z]+)/) || [])[1] || 'normal';
  function applyState() {
    $$('[data-when]').forEach(function (el) { el.hidden = el.getAttribute('data-when') !== state; });
    d.setAttribute('data-state', state);
    if (state !== 'normal') $$('.sk').forEach(function (el) { el.style.animation = 'none'; });
  }

  /* 开关 */
  function bindSwitches() {
    $$('[data-sw]').forEach(function (sw) {
      sw.setAttribute('role', 'switch');
      sw.setAttribute('tabindex', '0');
      if (!sw.hasAttribute('aria-checked')) sw.setAttribute('aria-checked', 'false');
      function flip() {
        var v = sw.getAttribute('aria-checked') === 'true';
        sw.setAttribute('aria-checked', String(!v));
        sw.dispatchEvent(new CustomEvent('sw:change', { bubbles: true, detail: { on: !v } }));
      }
      on(sw, 'click', flip);
      on(sw, 'keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      });
    });
  }

  /* 分段 */
  function bindSegments() {
    $$('[data-seg]').forEach(function (seg) {
      $$('button', seg).forEach(function (b) {
        on(b, 'click', function () {
          $$('button', seg).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('on');
          b.setAttribute('aria-pressed', 'true');
        });
      });
    });
  }

  /* 自绘下拉 */
  function closeMenus() {
    $$('.sel-menu').forEach(function (m) { m.hidden = true; });
    $$('.sel-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    $$('.menu-pop').forEach(function (m) { m.hidden = true; });
  }
  function bindSelects() {
    $$('.sel').forEach(function (sel) {
      var btn = $('.sel-btn', sel);
      var menu = $('.sel-menu', sel);
      if (!btn || !menu) return;
      var val = $('.v', btn);
      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');
      on(btn, 'click', function (e) {
        e.stopPropagation();
        var open = !menu.hidden;
        closeMenus();
        if (!open) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      });
      $$('.sel-opt', menu).forEach(function (opt) {
        on(opt, 'click', function (e) {
          e.stopPropagation();
          $$('.sel-opt', menu).forEach(function (o) { o.classList.remove('on'); });
          opt.classList.add('on');
          if (val) val.textContent = opt.dataset.label || opt.textContent.trim();
          menu.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        });
      });
    });
  }
  function bindMenus() {
    $$('[data-menu]').forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute('data-menu'));
      if (!target) return;
      on(btn, 'click', function (e) {
        e.stopPropagation();
        var open = !target.hidden;
        closeMenus();
        target.hidden = open;
        if (!open) {
          var r = btn.getBoundingClientRect();
          target.style.position = 'fixed';
          target.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
          target.style.top = r.bottom + 4 + 'px';
          target.style.left = 'auto';
        }
      });
    });
  }
  on(document, 'click', closeMenus);

  /* 设置分区 */
  function bindSettings() {
    var nav = $('.set-nav');
    if (!nav) return;
    function show(id) {
      $$('.set-group').forEach(function (g) { g.classList.toggle('on', g.id === id); });
      $$('.set-nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
    }
    if (!$('.set-group.on')) show((location.hash || '#look').slice(1));
    on(window, 'hashchange', function () { show((location.hash || '#look').slice(1)); });
  }

  /* 五面切换 */
  function bindStudy() {
    var bar = $('.facebar');
    if (!bar) return;
    var panes = $$('.face-pane');
    function go(name) {
      $$('button', bar).forEach(function (b) { b.classList.toggle('on', b.dataset.face === name); });
      panes.forEach(function (p) { p.hidden = p.dataset.face !== name; });
      d.setAttribute('data-face', name);
    }
    $$('button', bar).forEach(function (b) { on(b, 'click', function () { go(b.dataset.face); }); });
    on(document, 'keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var order = $$('button', bar).map(function (b) { return b.dataset.face; });
      var cur = order.indexOf(d.getAttribute('data-face') || order[0]);
      var next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length;
      go(order[next]);
      e.preventDefault();
    });
  }

  /* 句子展开 */
  function bindSentences() {
    $$('[data-sent]').forEach(function (hd) {
      on(hd, 'click', function () {
        var p = hd.parentNode;
        p.classList.toggle('sent-open');
        var bd = $('.sent-bd', p);
        if (bd) bd.hidden = !p.classList.contains('sent-open');
      });
    });
  }

  /* 九宫格挑图 */
  function bindPicks() {
    $$('.nine .pickable').forEach(function (p) {
      on(p, 'click', function () {
        $$('.pickable', p.parentNode).forEach(function (x) { x.classList.remove('sel'); });
        p.classList.add('sel');
      });
      on(p, 'dblclick', function () {
        toast('锁定第 ' + ($$('.pickable', p.parentNode).indexOf(p) + 1) + ' 张 · 名字会存成 photo-<哈希前20位>.jpg');
      });
    });
  }

  /* 图表滑到位才演 */
  function bindCharts() {
    var plots = $$('.cv');
    if (!plots.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      plots.forEach(function (p) { p.setAttribute('data-play', '1'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= 0.92) {
          en.target.setAttribute('data-play', '1');
          io.unobserve(en.target);
        }
      });
    }, { threshold: [0.92] });
    plots.forEach(function (p) { io.observe(p); });
    setTimeout(function () {
      plots.forEach(function (p) {
        if (p.getAttribute('data-play') === '1') return;
        var r = p.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        if (r.top < vh * 0.92 && r.bottom > 0) p.setAttribute('data-play', '1');
      });
    }, 320);
  }

  /* 热力图格子 */
  function bindHeat() {
    $$('[data-heat]').forEach(function (box) {
      box.innerHTML = box.getAttribute('data-heat').split(',').map(function (v) {
        var n = parseInt(v, 10) || 0;
        return '<i data-l="' + Math.min(4, n) + '" title="' + (n ? n + ' 次' : '没有练习') + '"></i>';
      }).join('');
    });
  }

  /* 浮层 */
  function openOverlay(el) {
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add('on'); });
    var scrim = $('#scrim');
    if (scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('on'); }); }
    var f = el.querySelector('input,textarea,button');
    if (f) setTimeout(function () { f.focus(); }, 140);
  }
  function closeOverlay() {
    $$('.drawer.on,.dlg.on').forEach(function (el) {
      el.classList.remove('on');
      setTimeout(function () { el.hidden = true; }, 280);
    });
    var scrim = $('#scrim');
    if (scrim) { scrim.classList.remove('on'); setTimeout(function () { scrim.hidden = true; }, 260); }
  }
  on(document, 'click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t) { e.preventDefault(); openOverlay(document.getElementById(t.getAttribute('data-open'))); return; }
    if (e.target.closest('[data-close]') || e.target.id === 'scrim') closeOverlay();
  });
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape') closeOverlay();
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      var s = $('.searchbox');
      if (s) s.click();
    }
  });

  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="dot on"></span>' + msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('on');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2400);
  }
  window.kfToast = toast;
  $$('[data-toast]').forEach(function (b) {
    on(b, 'click', function (e) { e.preventDefault(); toast(b.getAttribute('data-toast')); });
  });

  /* 假装播放：波形按真实时长走一遍 */
  function bindAudio() {
    $$('[data-audio]').forEach(function (row) {
      var btn = $('.play-btn', row);
      var wave = $('.wave', row);
      var dur = parseFloat(row.getAttribute('data-dur') || '3.2');
      var timeEl = $('[data-time]', row);
      var confirm = $('[data-confirm-audio]', row);
      if (!btn || !wave) return;
      if (!wave.children.length) {
        var r = rnd((dur * 100) | 0);
        var n = Math.max(18, Math.min(56, Math.round(dur * 13)));
        var hs = [];
        for (var i = 0; i < n; i++) {
          var h = 4 + Math.abs(Math.sin(i * 0.7 + r() * 3)) * 26 * (0.4 + r() * 0.9);
          hs.push(Math.min(30, h).toFixed(1));
        }
        wave.innerHTML = hs.map(function (h) { return '<i style="height:' + h + 'px"></i>'; }).join('');
      }
      var bars = $$('i', wave), t0 = 0, raf = 0, playing = false, passed = false;
      function tick() {
        var p = Math.min(1, (performance.now() - t0) / (dur * 1000));
        var k = Math.floor(p * bars.length);
        bars.forEach(function (b, i) { b.classList.toggle('p', i <= k); });
        if (timeEl) timeEl.textContent = fmt(p * dur) + ' / ' + fmt(dur);
        if (p >= 0.6 && confirm && !confirm.disabled) { confirm.disabled = false; confirm.classList.remove('ghost'); }
        if (p < 1) raf = requestAnimationFrame(tick);
        else { playing = false; cancelAnimationFrame(raf); btn.classList.remove('on'); }
      }
      on(btn, 'click', function () {
        if (playing) { playing = false; cancelAnimationFrame(raf); btn.classList.remove('on'); return; }
        playing = true;
        btn.classList.add('on');
        t0 = performance.now() - (passed ? 0 : 0);
        tick();
      });
      on(btn, 'click', function () { passed = true; }, { once: true });
    });
  }

  /* 转场：方格翻面 */
  var going = false;
  function transit(href) {
    if (reduce) { location.href = href; return; }
    if (going) return;
    going = true;
    var cols = Math.ceil(innerWidth / 44), rows = Math.ceil(innerHeight / 44);
    var w = document.createElement('div');
    w.id = 'wave';
    w.style.setProperty('--cols', cols);
    w.style.setProperty('--rows', rows);
    var html = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        html += '<i style="animation:tf .44s cubic-bezier(.4,0,.85,.55) ' + ((c * 0.5 + r) * 8).toFixed(0) + 'ms both"></i>';
      }
    }
    w.innerHTML = html;
    var st = document.createElement('style');
    st.textContent = '@keyframes tf{from{opacity:0}40%{opacity:1}to{opacity:1}}';
    document.head.appendChild(st);
    document.body.appendChild(w);
    setTimeout(function () { location.href = href; }, 600);
  }
  on(document, 'click', function (e) {
    var a = e.target.closest('a[data-fade]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    transit(href);
  });

  /* 落地页：第一帧就铺满，再淡出 */
  function fadeBoot() {
    var cover = document.createElement('div');
    cover.style.cssText = 'position:fixed;inset:0;z-index:9998;background:#05070c;pointer-events:none;opacity:1;transition:opacity .5s cubic-bezier(.4,0,.85,.55)';
    d.appendChild(cover);
    if (reduce) { cover.remove(); return; }
    function out() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cover.style.opacity = '0';
          setTimeout(function () { cover.remove(); }, 560);
        });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', out);
    else out();
  }

  /* 启动页星轨 */
  function bindSplash() {
    var cv = document.getElementById('sky');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
    var stars = [], t0 = 0, holeR = 0, C = { x: 0, y: 0 };
    var IDLE = 0, COLLAPSE = 1, HOLE = 2, phase = IDLE;
    var HUE = [206, 192, 220, 268, 330, 42, 14];

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }
    function build() {
      var r = rnd(11);
      stars = [];
      C = { x: W / 2, y: H / 2 };
      var maxR = Math.max(W, H) * 0.62 + 30;
      for (var i = 0; i < 520; i++) {
        var layer = i < 360 ? 0 : i < 500 ? 1 : 2;
        stars.push({
          a: r() * Math.PI * 2,
          rad: Math.pow(r(), layer === 2 ? 0.55 : 0.72) * maxR,
          ecc: r() * 0.34,
          ph: r() * Math.PI * 2,
          w: layer === 0 ? 0.0011 + r() * 0.0012 : layer === 1 ? 0.0022 + r() * 0.002 : 0.0035 + r() * 0.004,
          s: (layer === 0 ? 0.7 : layer === 1 ? 1.1 : 1.7) * (0.7 + r() * 0.6),
          h: HUE[Math.floor(r() * HUE.length)],
          l: layer,
          trail: layer === 2 ? 0.9 + r() * 0.55 : layer === 1 ? 0.3 + r() * 0.3 : 0
        });
      }
    }
    function posOf(s, t) {
      var rad = s.rad * (1 + s.ecc * Math.cos(2 * (t * s.w + s.ph)));
      var a = s.a + t * s.w * (s.l === 2 ? 1.4 : 1);
      return { x: C.x + Math.cos(a) * rad, y: C.y + Math.sin(a) * rad * 0.62 };
    }
    function frame(now) {
      var t = now || 0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (phase === COLLAPSE) holeR = 90 * Math.min(1, (t - t0) / 900);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var p = posOf(s, t);
        var x = p.x, y = p.y;
        if (phase === COLLAPSE) {
          var kk = Math.min(1, (t - t0) / 900); kk = kk * kk;
          x += (C.x - x) * kk * 0.86;
          y += (C.y - y) * kk * 0.86;
        }
        if (phase === HOLE) {
          var ang = Math.atan2(y - C.y, x - C.x);
          x = C.x + Math.cos(ang) * Math.max(holeR * 1.06, Math.abs(x - C.x));
          y = C.y + Math.sin(ang) * Math.max(holeR * 1.06, Math.abs(y - C.y));
        }
        var alpha = s.l === 0 ? 0.5 : s.l === 1 ? 0.8 : 1;
        if (s.trail > 0.15) {
          var N = s.l === 2 ? 5 : 3;
          for (var j = N; j > 0; j--) {
            var pp = posOf(s, t - j * 26 * s.trail);
            ctx.beginPath();
            ctx.moveTo(pp.x, pp.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'hsla(' + s.h + ',68%,72%,' + ((alpha * 0.17 * (N - j + 1)) / N).toFixed(3) + ')';
            ctx.lineWidth = Math.max(0.5, s.s * 0.6);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(x, y, s.s, 0, 6.2832);
        ctx.fillStyle = 'hsla(' + s.h + ',72%,' + (s.l === 2 ? 88 : 76) + '%,' + alpha + ')';
        ctx.fill();
      }
      if (phase === HOLE) {
        var img = ctx.createRadialGradient(C.x, C.y, holeR * 0.7, C.x, C.y, holeR * 3.2);
        img.addColorStop(0, 'rgba(167,189,246,.42)');
        img.addColorStop(0.22, 'rgba(90,86,160,.22)');
        img.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(C.x, C.y, holeR * 3.2, 0, 6.2832); ctx.fillStyle = img; ctx.fill();
        ctx.beginPath(); ctx.arc(C.x, C.y, holeR, 0, 6.2832); ctx.fillStyle = '#04060b'; ctx.fill();
        ctx.beginPath(); ctx.arc(C.x, C.y, holeR * 1.011, 0, 6.2832);
        ctx.strokeStyle = 'rgba(200,215,255,.75)'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    resize();
    on(window, 'resize', resize);
    requestAnimationFrame(frame);

    var go = $('.sp-go');
    on(go, 'click', function (e) {
      e.preventDefault();
      if (reduce) { location.href = 'cards.html'; return; }
      if (phase !== IDLE) return;
      phase = COLLAPSE; t0 = performance.now();
      d.classList.add('igniting');
      setTimeout(function () { phase = HOLE; t0 = performance.now(); }, 900);
      setTimeout(function () { phase = 3; transit('cards.html'); }, 1480);
    });
  }

  /* 评分 */
  function bindRate() {
    $$('.rate').forEach(function (b) {
      on(b, 'click', function () {
        var t = $('span', b);
        toast('记下了 · ' + (t ? t.textContent : '') + ' · 下一张');
      });
    });
  }

  /* 打字练习 */
  function bindType() {
    var box = $('.typebox');
    var typed = $('.typed');
    if (!box || !typed) return;
    var want = box.getAttribute('data-want') || '';
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    on(box, 'input', function () {
      var v = box.value, html = '';
      for (var i = 0; i < want.length; i++) {
        var ch = want[i];
        if (i < v.length) html += v[i] === ch ? '<b>' + esc(ch) + '</b>' : '<span class="miss">' + esc(ch) + '</span>';
        else html += esc(ch);
      }
      typed.innerHTML = html;
      box.classList.toggle('ok', v === want);
      box.classList.toggle('bad', v.length > 0 && want.indexOf(v) !== 0);
      if (v === want) toast('拼对了 · 这一面算过');
    });
  }

  /* 挖句勾选 */
  function bindPicked() {
    $$('.picked[data-pick]').forEach(function (p) {
      on(p, 'click', function () {
        p.classList.toggle('on');
        var n = $$('.picked.on').length;
        var c = $('#picked-n');
        if (c) c.textContent = n;
        $$('[data-need-pick]').forEach(function (b) {
          b.classList.toggle('off', n === 0);
          b.setAttribute('aria-disabled', String(n === 0));
        });
      });
    });
  }

  function boot() {
    applyState();
    bindSwitches();
    bindSegments();
    bindSelects();
    bindMenus();
    bindSettings();
    bindStudy();
    bindSentences();
    bindPicks();
    bindCharts();
    bindHeat();
    bindAudio();
    bindRate();
    bindType();
    bindPicked();
    bindSplash();
    if (document.body.classList.contains('landing')) fadeBoot();
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
