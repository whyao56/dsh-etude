/* 卡片工厂-测试 · 样式稿的交互层
   只做「能当场看见」的那几件：主题 / 配色 / 字体 / 字号 / 缩放 / 开关 / 快捷键 / 左导航高亮。
   没有后端，状态存 localStorage，九个屏共用一套。 */
(() => {
  const KEY = 'kf-test:look';

  const ACCENTS = {
    mist:      { d: ['#97B1F0', '#121C34', '#2E3C5F', '#D8E1F6'], l: ['#4B67B4', '#FFFFFF', '#DCE4F8', '#2A3550'] },
    daiqing:   { d: ['#8CB9D7', '#0E2230', '#24445C', '#CDE4F2'], l: ['#236185', '#FFFFFF', '#D6E9F4', '#173F55'] },
    dusk:      { d: ['#B8ABD2', '#201834', '#3E3451', '#E3DAF3'], l: ['#726291', '#FFFFFF', '#E4DEF1', '#3B3153'] },
    turquoise: { d: ['#8DBEB7', '#0D2624', '#27504C', '#CFE7E3'], l: ['#34766F', '#FFFFFF', '#D5EBE7', '#1F4A45'] },
    amber:     { d: ['#CCAC87', '#2A1C0E', '#4A3A26', '#EFE0CC'], l: ['#8D6636', '#FFFFFF', '#F0E5D6', '#4E3A20'] },
    graphite:  { d: ['#E5E8ED', '#15181D', '#3A3F48', '#E8EBEF'], l: ['#2C2E32', '#FFFFFF', '#E3E5E9', '#26282C'] },
    custom:    { d: ['#C9A7F5', '#1B1230', '#423157', '#EADFFB'], l: ['#7A5AA8', '#FFFFFF', '#EBE2F8', '#483463'] },
  };
  const SIZES = { sm: 0.94, std: 1, lg: 1.07, xl: 1.15 };
  const SYSTEM_SANS = '"MiSans","HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",system-ui,-apple-system,"Segoe UI",sans-serif';
  const FONTS = {
    system: SYSTEM_SANS,
    misans: '"MiSans","HarmonyOS Sans SC",' + SYSTEM_SANS,
    source: '"Source Han Sans SC","Noto Sans SC","PingFang SC",' + SYSTEM_SANS,
  };

  const read = () => {
    try {
      return { theme: 'dark', accent: 'mist', font: 'system', size: 'std', zoom: 100, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch (e) {
      return { theme: 'dark', accent: 'mist', font: 'system', size: 'std', zoom: 100 };
    }
  };
  /* 截图/演示用：<html data-look='{"theme":"light"}'> 可以硬压一份外观 */
  const forced = (() => {
    try { return JSON.parse(document.documentElement.dataset.look || 'null'); } catch (e) { return null; }
  })();
  let state = Object.assign(read(), forced || {});
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  };

  const alpha = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const isDark = () =>
    state.theme === 'system' ? !window.matchMedia('(prefers-color-scheme: light)').matches : state.theme === 'dark';

  function apply() {
    const root = document.documentElement;
    const dark = isDark();
    root.dataset.theme = dark ? 'dark' : 'light';
    const acc = ACCENTS[state.accent] || ACCENTS.mist;
    const v = dark ? acc.d : acc.l;
    root.style.setProperty('--accent', v[0]);
    root.style.setProperty('--on-accent', v[1]);
    root.style.setProperty('--accent-cont', v[2]);
    root.style.setProperty('--on-accent-cont', v[3]);
    root.style.setProperty('--accent-rgb', parseInt(v[0].slice(1), 16) >> 16 & 255 ? `${(parseInt(v[0].slice(1), 16) >> 16) & 255},${(parseInt(v[0].slice(1), 16) >> 8) & 255},${parseInt(v[0].slice(1), 16) & 255}` : '151,177,240');
    root.style.setProperty('--glow-1', alpha(v[0], dark ? 0.28 : 0.2));
    root.style.setProperty('--glow-2', alpha(dark ? '#514765' : '#8E7FB0', dark ? 0.24 : 0.16));
    root.style.setProperty('--read-scale', SIZES[state.size] || 1);
    root.style.setProperty('--zoom', (state.zoom || 100) / 100);
    root.style.setProperty('--sans', FONTS[state.font] || FONTS.system);
    root.dataset.font = state.font;
    try { document.dispatchEvent(new Event('lookchange')); } catch (e) {}
    document.querySelectorAll('.swatches .sw2').forEach((el) => el.classList.toggle('on', el.dataset.accent === state.accent));
    document.querySelectorAll('.seg[data-set]').forEach((seg) => {
      const cur = state[seg.dataset.set];
      seg.querySelectorAll('span[data-val]').forEach((s) => s.classList.toggle('on', s.dataset.val === cur));
    });
    document.querySelectorAll('[data-stepper="zoom"]').forEach((el) => {
      const b = el.querySelector('b');
      if (b) b.textContent = `${state.zoom}%`;
    });
  }

  function set(key, val) {
    state[key] = val;
    save();
    apply();
  }

  document.documentElement.style.setProperty('--sans-fallback', 'x');
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    apply();
    /* 分段控件 */
    document.querySelectorAll('.seg[data-set]').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const t = e.target.closest('span[data-val]');
        if (!t) return;
        if (t.classList.contains('off')) return;
        set(seg.dataset.set, t.dataset.val);
      });
    });

    /* 配色圆点 */
    document.querySelectorAll('.swatches .sw2[data-accent]').forEach((el) => {
      el.addEventListener('click', () => set('accent', el.dataset.accent));
    });

    /* 缩放 */
    document.querySelectorAll('[data-stepper="zoom"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const t = e.target.closest('i[data-step]');
        if (!t) return;
        const next = Math.min(140, Math.max(80, state.zoom + Number(t.dataset.step) * 5));
        set('zoom', next);
      });
    });

    /* 开关 */
    document.querySelectorAll('.sw').forEach((el) => {
      el.addEventListener('click', () => {
        el.classList.toggle('on');
        el.setAttribute('aria-checked', el.classList.contains('on') ? 'true' : 'false');
      });
    });

    /* 设置左导航：一次只露一个分区 */
    const links = [...document.querySelectorAll('.setnav a')];
    const secs = [...document.querySelectorAll('.setbody .group')];
    const secName = document.getElementById('secname');
    if (secs.length && links.length) {
      const show = (id, push) => {
        const target = secs.find((s) => s.id === id) || secs[0];
        secs.forEach((s) => s.classList.toggle('on', s === target));
        links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${target.id}`));
        const h = target.querySelector('.ghead h2');
        if (secName && h) secName.textContent = h.textContent;
        if (push) history.replaceState(null, '', `#${target.id}`);
      };
      links.forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          show(a.getAttribute('href').slice(1), true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
      show((location.hash || '#appearance').slice(1), false);
    }

    /* 快捷键：点键位，按下一个组合就写进去 */
    document.querySelectorAll('.krow .kb').forEach((kb) => {
      kb.addEventListener('click', () => {
        if (kb.classList.contains('capturing')) return;
        const before = kb.textContent;
        kb.classList.add('capturing');
        kb.textContent = '按新键…';
        const done = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const parts = [];
          if (e.ctrlKey) parts.push('Ctrl');
          if (e.altKey) parts.push('Alt');
          if (e.shiftKey) parts.push('Shift');
          const k = e.key;
          const named = { ' ': 'Space', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Del', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[k];
          const main = named || (k.length === 1 ? k.toUpperCase() : k);
          if (!(k === 'Escape' && parts.length === 0)) parts.push(main);
          kb.textContent = k === 'Escape' && parts.length === 0 ? before : parts.join(' ');
          kb.classList.remove('capturing');
          window.removeEventListener('keydown', done, true);
        };
        window.addEventListener('keydown', done, true);
      });
    });

    /* 恢复默认 */
    document.querySelectorAll('.btn').forEach((b) => {
      if (b.textContent.trim() !== '恢复默认') return;
      b.addEventListener('click', () => {
        document.querySelectorAll('.krow .kb').forEach((kb) => {
          if (kb.dataset.def) kb.textContent = kb.dataset.def;
        });
      });
    });
    document.querySelectorAll('.krow .kb').forEach((kb) => {
      if (!kb.dataset.def) kb.dataset.def = kb.textContent;
    });

    /* Ctrl K 打开全局搜索，Esc 关掉 */
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!location.pathname.endsWith('palette.html')) location.href = './palette.html';
      }
      if (e.key === 'Escape' && location.pathname.endsWith('palette.html')) {
        history.length > 1 ? history.back() : (location.href = './cards.html');
      }
    });

    /* 挖句台：点词切高亮，点整行切当前行 */
    document.querySelectorAll('.subline').forEach((row) => {
      row.addEventListener('click', (e) => {
        document.querySelectorAll('.subline').forEach((r) => r.classList.remove('on'));
        row.classList.add('on');
        const w = e.target.closest('.w');
        document.querySelectorAll('.w.hot').forEach((x) => x.classList.remove('hot'));
        if (w) w.classList.add('hot');
      });
    });

    /* 全局搜索：点旁边灰的地方也能关 */
    document.querySelectorAll('.palmask').forEach((m) => {
      m.addEventListener('click', (e) => {
        if (e.target === m) location.href = './cards.html';
      });
    });

    /* 启动页：点一下、按任意键都进主页面（点链接不算） */
    const splash = document.querySelector('[data-splash]');
    if (splash) {
      splash.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        location.href = './cards.html';
      });
      document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        location.href = './cards.html';
      });
    }

    /* 全局搜索：点一条就跳 */
    document.querySelectorAll('.pal-item[data-go]').forEach((it) => {
      it.addEventListener('click', () => (location.href = it.dataset.go));
    });

    /* ── 练习面：键盘快捷键 ──────────────────────────────────
       练习的五个面共用一套快捷键：
       Space = 显示答案/重播 · Tab = 展开提示 · Enter = 下一面 · Esc = 退出回卡片 */
    const isPractice = location.pathname.match(/(listen|speak|read|type|vary)\.html$/);
    if (isPractice) {
      document.addEventListener('keydown', (e) => {
        // Esc 退出练习
        if (e.key === 'Escape') {
          e.preventDefault();
          location.href = './cards.html';
          return;
        }

        // Space: 重播音频（听/说）或显示答案（读/写/改）
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
          e.preventDefault();
          const playBtn = document.querySelector('.play, .rec');
          const revealBtn = document.querySelector('.reveal > summary');
          if (playBtn) playBtn.click();
          else if (revealBtn && !revealBtn.parentElement.hasAttribute('open')) revealBtn.click();
          return;
        }

        // Tab: 展开提示/对答案
        if (e.key === 'Tab' && !e.target.matches('input')) {
          e.preventDefault();
          const reveals = document.querySelectorAll('.reveal:not([open])');
          if (reveals.length) reveals[0].querySelector('summary').click();
          return;
        }

        // Enter: 下一面（主按钮）
        if (e.key === 'Enter' && !e.target.matches('input, textarea')) {
          e.preventDefault();
          const nextBtn = document.querySelector('.actbar .btn.primary, .stage .btn.primary');
          if (nextBtn) nextBtn.click();
          return;
        }
      });
    }
  });


  /* ── 液体层：低分辨率画布 + 大模糊，靠上采样糊成流动的液面 ──
     液体为主（几团缓慢互穿的颜色），光为辅（一道很淡的白光在扫）。 */
  const startLiquid = () => {
    const cv = document.querySelector('canvas.liquid');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const W = 240;
    const H = 150;
    cv.width = W;
    cv.height = H;

    const readRgb = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
      const p = raw.split(',').map((n) => parseInt(n, 10));
      return p.length === 3 && p.every((n) => !Number.isNaN(n)) ? p : [151, 177, 240];
    };

    /* 色相旋转：把强调色分几支出来，液体才有层次 */
    const spin = (rgb, deg) => {
      let [r, g, b] = rgb.map((n) => n / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0;
      let s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      h = (h + deg / 360 + 1) % 1;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const f = (t) => {
        let x = t;
        if (x < 0) x += 1;
        if (x > 1) x -= 1;
        if (x < 1 / 6) return p + (q - p) * 6 * x;
        if (x < 1 / 2) return q;
        if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
        return p;
      };
      return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((n) => Math.round(n * 255));
    };

    const blobs = [
      { a: 0.21, b: 0.33, ph: 0.0, r: 0.62, hue: 0, al: 0.34 },
      { a: 0.17, b: 0.27, ph: 1.9, r: 0.54, hue: 38, al: 0.28 },
      { a: 0.29, b: 0.15, ph: 3.4, r: 0.46, hue: -44, al: 0.26 },
      { a: 0.13, b: 0.41, ph: 4.9, r: 0.5, hue: 20, al: 0.22 },
      { a: 0.23, b: 0.19, ph: 6.1, r: 0.4, hue: -18, al: 0.2 },
    ];

    let base = readRgb();
    let raf = 0;

    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);
      blobs.forEach((bl) => {
        const x = (0.5 + 0.4 * Math.sin(time * bl.a + bl.ph)) * W;
        const y = (0.5 + 0.34 * Math.sin(time * bl.b + bl.ph * 1.6)) * H;
        const rad = bl.r * W * (1 + 0.13 * Math.sin(time * 0.6 + bl.ph));
        const k = document.documentElement.dataset.theme === 'light' ? 1 : 0.42;
        const c = spin(base, bl.hue).map((n) => Math.round(n * k));
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${bl.al})`);
        g.addColorStop(0.52, `rgba(${c[0]},${c[1]},${c[2]},${bl.al * 0.44})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      /* 光：一道很淡的白，慢慢横着扫 */
      const a = (0.1 + 0.05 * Math.sin(time * 0.22)) * (reduce ? 0.35 : 1);
      const lg = ctx.createLinearGradient(W * (0.1 + 0.08 * Math.sin(time * 0.18)), 0, W, H);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.42, `rgba(255,255,255,${a})`);
      lg.addColorStop(0.52, `rgba(255,255,255,${a * 0.5})`);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    };

    /* 系统开了「减少动态效果」时压慢、去掉扫光，但绝不停成一张死图 —— 停掉了这个界面就没了 */
    const speed = reduce ? 0.34 : 1;
    let t0 = 0;

    const loop = (ts) => {
      if (!t0) t0 = ts;
      draw(((ts - t0) / 1000) * speed);
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('lookchange', () => {
      base = readRgb();
    });

    raf = requestAnimationFrame(loop);
    window.addEventListener('pagehide', () => raf && cancelAnimationFrame(raf));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLiquid);
  } else {
    startLiquid();
  }
  /* 跟随系统时，系统切了也跟着切 */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (state.theme === 'system') apply();
    });
  }
})();
