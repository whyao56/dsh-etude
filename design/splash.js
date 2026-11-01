/* 卡片工厂-测试 · 启动页
   背景：全世界主流语言的问候语当流星，从左上往右下飞。
   中间那个「开始」按钮戴一圈土星环：流星撞到环上就留住，在环上转；
   环满了，下一颗撞上来的流星会把离它最近的那颗顶掉 —— 被顶掉的那颗重新变成流星飞走。
   环上的流星可以用鼠标拖着走。
   背景里的鼠标/点击只影响背景，进主页只有「开始」这一个入口。 */
(() => {
  const back = document.querySelector('canvas.meteors');
  const front = document.querySelector('canvas.ringfront');
  if (!back || !front) return;

  const ctxB = back.getContext('2d');
  const ctxF = front.getContext('2d');
  const root = document.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const WORDS = [
    '你好', 'hello', 'こんにちは', '안녕하세요', 'bonjour', 'hola', 'hallo', 'ciao',
    'olá', 'привет', 'مرحبا', 'नमस्ते', 'merhaba', 'xin chào', 'สวัสดี', 'selamat',
    'hoi', 'hej', 'γεια σου', 'שלום', 'jambo', 'kumusta', 'नमस्कार', 'сәлем',
    'salut', 'aloha', 'sawubona', 'dobrý deň', 'здравей', 'szia', 'terve', 'moi',
    '早上好', '谢谢', 'grazie', 'obrigado', 'спасибо', 'terima kasih', '감사합니다', 'merci',
  ];

  let W = 0;
  let H = 0;
  let dpr = 1;

  const RING = { cx: 0, cy: 0, rx: 150, ry: 44, tilt: -0.33 };
  /* 标题净空区：流星进来就淡，别在字上划一道 */
  const CLEAR = { x: 0, y: 0, rx: 1, ry: 1 };
  const CAP = 6;

  const meteors = [];
  const orbiters = [];
  const flashes = [];
  const ripples = [];
  const bubbles = [];
  const mouse = { x: -9999, y: -9999, last: 0 };
  let drag = null;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let spawnAt = 0;

  const SANS = () => getComputedStyle(root).getPropertyValue('--sans') || 'system-ui, sans-serif';
  const INK = () => (root.dataset.theme === 'light' ? '22,30,48' : '255,255,255');
  const ACCENT = () => getComputedStyle(root).getPropertyValue('--accent-rgb').trim() || '151,177,240';

  const sizeCanvases = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    [back, front].forEach((cv) => {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  };

  const measureRing = () => {
    const btn = document.querySelector('[data-enter]');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    RING.cx = r.left + r.width / 2;
    RING.cy = r.top + r.height / 2;
    RING.rx = r.width / 2 + 64;
    RING.ry = Math.max(40, r.height * 1.05);
  };

  /* 环上的参数角 → 屏幕坐标；front 表示这一半在按钮前面 */
  const ringPoint = (a) => {
    const ex = Math.cos(a) * RING.rx;
    const ey = Math.sin(a) * RING.ry;
    const c = Math.cos(RING.tilt);
    const s = Math.sin(RING.tilt);
    return {
      x: RING.cx + ex * c - ey * s,
      y: RING.cy + ex * s + ey * c,
      front: ex * s + ey * c > 0,
    };
  };

  /* 屏幕点 → 环上的参数角（拖动用） */
  const ringAngleOf = (x, y) => {
    const dx = x - RING.cx;
    const dy = y - RING.cy;
    const c = Math.cos(RING.tilt);
    const s = Math.sin(RING.tilt);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    return Math.atan2(ly / RING.ry, lx / RING.rx);
  };

  const ringDist = (x, y) => {
    const dx = x - RING.cx;
    const dy = y - RING.cy;
    const c = Math.cos(RING.tilt);
    const s = Math.sin(RING.tilt);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    const nx = lx / RING.rx;
    const ny = ly / RING.ry;
    return { r: Math.hypot(nx, ny), nx, ny };
  };

  let pool = [];
  const pickWord = () => {
    if (!pool.length) {
      pool = WORDS.slice();
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const k = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[k]] = [pool[k], pool[i]];
      }
    }
    return pool.pop();
  };

  const spawnMeteor = (x, y) => {
    const ang = Math.PI / 5.2 + (Math.random() - 0.5) * 0.12;
    const sp = 300 + Math.random() * 220;
    meteors.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      text: pickWord(),
      size: 12 + Math.round(Math.random() * 6),
      al: 0.5 + Math.random() * 0.3,
      tint: Math.random() < 0.34,
      t: 0,
    });
  };

  const spawnFromEdge = () => {
    if (Math.random() < 0.62) spawnMeteor(-120 + Math.random() * W * 0.72, -60 - Math.random() * 120);
    else spawnMeteor(-140 - Math.random() * 140, -40 + Math.random() * H * 0.4);
  };

  /* 被顶掉的环上流星：变回流星，沿切线往右下飞 */
  const releaseOrbiter = (i) => {
    const o = orbiters[i];
    if (!o) return;
    orbiters.splice(i, 1);
    const p = ringPoint(o.a);
    const c = Math.cos(RING.tilt);
    const s = Math.sin(RING.tilt);
    const tx = -Math.sin(o.a) * RING.rx;
    const ty = Math.cos(o.a) * RING.ry;
    let dx = tx * c - ty * s;
    let dy = tx * s + ty * c;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    if (dx < 0.2) dx = Math.abs(dx);
    if (dy < 0.12) dy = Math.abs(dy) * 0.8 + 0.25;
    const sp = 360 + Math.random() * 140;
    meteors.push({ x: p.x, y: p.y, vx: dx * sp, vy: dy * sp, text: o.text, size: o.size, al: 0.5, t: 0 });
    flashes.push({ x: p.x, y: p.y, t0: clock });
  };

  const capture = (m, hit) => {
    if (orbiters.length >= CAP) {
      const incoming = Math.atan2(hit.ny, hit.nx);
      let best = 0;
      let bestD = Infinity;
      orbiters.forEach((o, i) => {
        const d = Math.abs(((o.a - incoming + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      releaseOrbiter(best);
    }
    /* 落在环上最空的那一段，别几颗挤在一起 */
    const TAU = Math.PI * 2;
    let spot = Math.atan2(hit.ny, hit.nx);
    if (orbiters.length) {
      const as = orbiters.map((o) => (((o.a % TAU) + TAU) % TAU)).sort((x, y) => x - y);
      let bestGap = -1;
      for (let i = 0; i < as.length; i += 1) {
        const a0 = as[i];
        const a1 = i + 1 < as.length ? as[i + 1] : as[0] + TAU;
        const gap = a1 - a0;
        if (gap > bestGap) {
          bestGap = gap;
          spot = a0 + gap / 2;
        }
      }
    }
    orbiters.push({
      a: spot,
      av: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.3),
      text: m.text,
      size: Math.max(12, m.size - 1),
    });
    flashes.push({ x: m.x, y: m.y, t0: clock });
  };

  /* 环上的浮尘：一丁点一丁点，慢慢绕着走 */
  let dust = null;
  const makeDust = () => {
    dust = [];
    for (let i = 0; i < 48; i += 1) {
      dust.push({
        a: Math.random() * Math.PI * 2,
        k: 0.9 + Math.random() * 0.12,
        sp: (Math.random() - 0.5) * 0.05,
        r: 0.55 + Math.random() * 1.05,
      });
    }
  };

  /* 背景：主色一团很淡的光 + 四角压暗，眼睛舒服，也有纵深 */
  const drawBackdrop = () => {
    const accent = ACCENT();
    const g = ctxB.createRadialGradient(RING.cx, RING.cy, 0, RING.cx, RING.cy, Math.max(W, H) * 0.66);
    g.addColorStop(0, `rgba(${accent},0.08)`);
    g.addColorStop(0.42, `rgba(${accent},0.032)`);
    g.addColorStop(1, `rgba(${accent},0)`);
    ctxB.fillStyle = g;
    ctxB.fillRect(0, 0, W, H);

    const v = ctxB.createRadialGradient(W * 0.5, H * 0.44, Math.min(W, H) * 0.2, W * 0.5, H * 0.44, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.36)');
    ctxB.fillStyle = v;
    ctxB.fillRect(0, 0, W, H);
  };

  const drawRing = (time) => {
    const seg = 150;
    const c = Math.cos(RING.tilt);
    const s = Math.sin(RING.tilt);
    const accent = ACCENT();
    const ink = INK();
    const hi = (time * 0.5) % (Math.PI * 2);
    const lk = root.dataset.theme === 'light' ? 1.8 : 1;  /* 浅色底上环要更实一点 */

    const put = (ctx, a0, a1, k, lw, al, col) => {
      const e0x = Math.cos(a0) * RING.rx;
      const e0y = Math.sin(a0) * RING.ry;
      const e1x = Math.cos(a1) * RING.rx;
      const e1y = Math.sin(a1) * RING.ry;
      ctx.strokeStyle = `rgba(${col},${Math.max(0.015, al)})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(RING.cx + e0x * k * c - e0y * k * s, RING.cy + e0x * k * s + e0y * k * c);
      ctx.lineTo(RING.cx + e1x * k * c - e1y * k * s, RING.cy + e1x * k * s + e1y * k * c);
      ctx.stroke();
    };

    for (let i = 0; i < seg; i += 1) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      const e0x = Math.cos(a0) * RING.rx;
      const e0y = Math.sin(a0) * RING.ry;
      const isFront = e0x * s + e0y * c > 0;
      const ctx = isFront ? ctxF : ctxB;

      /* 一段绕着走的亮边，环才不像一根死线 */
      const d = Math.abs(((a0 - hi + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const bump = Math.max(0, 1 - d / 0.95);
      const base = isFront ? 0.26 : 0.1;
      const glow = (base + 0.42 * bump * bump) * lk;

      /* 三圈叠出厚度：外沿亮、中段柔、内沿极淡 */
      put(ctx, a0, a1, 1, isFront ? 1.5 : 1.1, glow, ink);
      put(ctx, a0, a1, 0.972, isFront ? 1.0 : 0.8, glow * 0.5, ink);
      put(ctx, a0, a1, 0.938, 0.8, base * 0.5, ink);
      if (bump > 0.05) put(ctx, a0, a1, 1.008, 2.6, 0.05 * bump, accent);
    }

    /* 浮尘 */
    if (dust) {
      dust.forEach((p) => {
        const a = p.a + p.sp * time;
        const ex = Math.cos(a) * RING.rx * p.k;
        const ey = Math.sin(a) * RING.ry * p.k;
        const front = ex * s + ey * c > 0;
        const ctx = front ? ctxF : ctxB;
        ctx.fillStyle = `rgba(${ink},${front ? 0.22 : 0.1})`;
        ctx.beginPath();
        ctx.arc(RING.cx + ex * c - ey * s, RING.cy + ex * s + ey * c, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  const drawOrbiters = (time) => {
    const accent = ACCENT();
    const ink = INK();
    const font = SANS();
    orbiters.forEach((o) => {
      const p = ringPoint(o.a);
      const ctx = p.front ? ctxF : ctxB;
      const pulse = 0.55 + 0.25 * Math.sin(time * 1.8 + o.a);
      /* 光点 + 光晕 */
      const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 13);
      hg.addColorStop(0, `rgba(${accent},${pulse})`);
      hg.addColorStop(0.4, `rgba(${accent},${pulse * 0.34})`);
      hg.addColorStop(1, `rgba(${accent},0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${ink},${p.front ? 0.95 : 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();

      const nx = p.x - RING.cx;
      const ny = p.y - RING.cy;
      const nl = Math.hypot(nx, ny) || 1;
      ctx.font = `${o.size}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.35)';
      ctx.shadowBlur = 6;
      /* 后半圈的字放进环里，免得顶到标题 */
      const out = p.front ? 19 : -15;
      ctx.fillStyle = `rgba(${ink},${p.front ? 0.92 : 0.4})`;
      ctx.fillText(o.text, p.x + (nx / nl) * out, p.y + (ny / nl) * out);
      ctx.shadowBlur = 0;
    });
  };

  const drawMeteors = () => {
    const ink = INK();
    const accent = ACCENT();
    const font = SANS();
    ctxB.lineCap = 'round';
    meteors.forEach((m) => {
      const fade = m.t < 0.18 ? m.t / 0.18 : 1;
      const v = Math.hypot(m.vx, m.vy) || 1;
      const ux = m.vx / v;
      const uy = m.vy / v;
      const tail = 96 + v * 0.28;
      const col = m.tint ? accent : ink;
      /* 钻到标题那一块就淡下去，字上不留划痕 */
      const cdx = (m.x - CLEAR.x) / CLEAR.rx;
      const cdy = (m.y - CLEAR.y) / CLEAR.ry;
      const cdl = Math.hypot(cdx, cdy);
      const clearK = cdl >= 1 ? 1 : 0.12 + 0.88 * Math.pow(cdl, 1.6);
      const al = m.al * fade * clearK;

      /* 三层尾巴：短而亮、中段、长而淡 —— 渐细渐隐才像流星 */
      [[1, 1.7, 0.95], [0.58, 1.1, 0.42], [0.3, 0.7, 0.16]].forEach(([lenK, lw, aK]) => {
        const tx = m.x - ux * tail * lenK;
        const ty = m.y - uy * tail * lenK;
        const g = ctxB.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, `rgba(${col},${al * aK})`);
        g.addColorStop(0.65, `rgba(${col},${al * aK * 0.22})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctxB.strokeStyle = g;
        ctxB.lineWidth = lw;
        ctxB.beginPath();
        ctxB.moveTo(m.x, m.y);
        ctxB.lineTo(tx, ty);
        ctxB.stroke();
      });

      /* 头：亮核 + 光晕 */
      const hg = ctxB.createRadialGradient(m.x, m.y, 0, m.x, m.y, 10);
      hg.addColorStop(0, `rgba(${col},${Math.min(1, al * 1.15)})`);
      hg.addColorStop(0.32, `rgba(${col},${al * 0.36})`);
      hg.addColorStop(1, `rgba(${col},0)`);
      ctxB.fillStyle = hg;
      ctxB.beginPath();
      ctxB.arc(m.x, m.y, 10, 0, Math.PI * 2);
      ctxB.fill();
      ctxB.fillStyle = `rgba(${col},${Math.min(1, al * 1.2)})`;
      ctxB.beginPath();
      ctxB.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
      ctxB.fill();

      /* 词 */
      ctxB.font = `${m.size}px ${font}`;
      ctxB.textAlign = 'left';
      ctxB.textBaseline = 'middle';
      ctxB.fillStyle = `rgba(${col},${al * 0.92})`;
      ctxB.fillText(m.text, m.x + 11, m.y + 1);
    });
  };

  const drawExtras = (time) => {
    const ink = INK();
    const accent = ACCENT();

    /* 捕获/点击的闪光：一团柔光 + 一圈扩散 */
    for (let i = flashes.length - 1; i >= 0; i -= 1) {
      const f = flashes[i];
      const age = time - f.t0;
      if (age > 0.66) {
        flashes.splice(i, 1);
        continue;
      }
      const p = age / 0.66;
      const e = 1 - Math.pow(1 - p, 2.2);
      const rad = Math.max(2, 6 + e * 36);
      const g = ctxB.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
      g.addColorStop(0, `rgba(${accent},${0.2 * (1 - p)})`);
      g.addColorStop(0.55, `rgba(${ink},${0.1 * (1 - p)})`);
      g.addColorStop(1, `rgba(${ink},0)`);
      ctxB.fillStyle = g;
      ctxB.beginPath();
      ctxB.arc(f.x, f.y, rad, 0, Math.PI * 2);
      ctxB.fill();
      /* 只留柔光，不画硬圈 —— 硬圈在暗底上看着像 UI 元件，不像光 */
      const core = ctxB.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad * 0.42);
      core.addColorStop(0, `rgba(${ink},${0.15 * (1 - p)})`);
      core.addColorStop(1, `rgba(${ink},0)`);
      ctxB.fillStyle = core;
      ctxB.beginPath();
      ctxB.arc(f.x, f.y, rad * 0.42, 0, Math.PI * 2);
      ctxB.fill();
    }

    /* 涟漪：三圈按同一个缓动推开，中心再补一团柔光 */
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const r = ripples[i];
      const age = time - r.t0;
      if (age > 1.6) {
        ripples.splice(i, 1);
        continue;
      }
      const p = age / 1.6;
      const ease = 1 - Math.pow(1 - p, 2.6);
      const fade = Math.pow(1 - p, 1.9);
      const rr = 16 + ease * 150;

      const disc = ctxB.createRadialGradient(r.x, r.y, 0, r.x, r.y, rr * 0.55);
      disc.addColorStop(0, `rgba(${accent},${0.06 * fade})`);
      disc.addColorStop(0.6, `rgba(${ink},${0.035 * fade})`);
      disc.addColorStop(1, `rgba(${ink},0)`);
      ctxB.fillStyle = disc;
      ctxB.beginPath();
      ctxB.arc(r.x, r.y, rr * 0.55, 0, Math.PI * 2);
      ctxB.fill();

      [[1, 0.34, 1.5], [0.74, 0.16, 1.05], [0.5, 0.08, 0.85]].forEach(([k, aK, lw]) => {
        ctxB.strokeStyle = `rgba(${ink},${aK * fade})`;
        ctxB.lineWidth = lw;
        ctxB.beginPath();
        ctxB.arc(r.x, r.y, Math.max(1, rr * k), 0, Math.PI * 2);
        ctxB.stroke();
      });
    }

    /* 水泡：一圈亮边 + 左上角一点高光，往上飘 */
    for (let i = bubbles.length - 1; i >= 0; i -= 1) {
      const b = bubbles[i];
      const bAge = time - b.t0;
      if (bAge < 0 || bAge > b.life) continue;
      const bp = bAge / b.life;
      const rr = b.r * (0.75 + 0.55 * bp);
      const a = b.al * Math.pow(1 - bp, 1.35) * Math.min(1, bp / 0.12);
      const gg = ctxB.createRadialGradient(b.x, b.y, 0, b.x, b.y, rr);
      gg.addColorStop(0, `rgba(${ink},0)`);
      gg.addColorStop(0.62, `rgba(${ink},${a * 0.05})`);
      gg.addColorStop(1, `rgba(${ink},${a * 0.13})`);
      ctxB.fillStyle = gg;
      ctxB.beginPath();
      ctxB.arc(b.x, b.y, rr, 0, Math.PI * 2);
      ctxB.fill();
      ctxB.strokeStyle = `rgba(${ink},${a * 0.4})`;
      ctxB.lineWidth = 0.9;
      ctxB.beginPath();
      ctxB.arc(b.x, b.y, rr, 0, Math.PI * 2);
      ctxB.stroke();
      ctxB.fillStyle = `rgba(${ink},${a * 0.72})`;
      ctxB.beginPath();
      ctxB.arc(b.x - rr * 0.3, b.y - rr * 0.32, Math.max(0.7, rr * 0.19), 0, Math.PI * 2);
      ctxB.fill();
    }

    /* 鼠标周围的一圈微光 */
    if (mouse.x > -1000) {
      const g = ctxB.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 170);
      g.addColorStop(0, `rgba(${accent},0.05)`);
      g.addColorStop(1, `rgba(${accent},0)`);
      ctxB.fillStyle = g;
      ctxB.beginPath();
      ctxB.arc(mouse.x, mouse.y, 170, 0, Math.PI * 2);
      ctxB.fill();
    }
  };

  /* 系统开了「减少动态效果」：放慢、少放几颗，但不停 —— 停了这页就成一张静止图了 */
  const speed = reduce ? 0.5 : 1;
  let t0 = 0;

  const frame = (ts) => {
    if (!t0) t0 = ts;
    const t = ((ts - t0) / 1000) * speed;
    clock = t;
    /* 先预约下一帧再画：某一帧就算抛错，动画也不会就此停死 */
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, t - last) : 0.016;
    last = t;

    ctxB.clearRect(0, 0, W, H);
    ctxF.clearRect(0, 0, W, H);

    if (t > spawnAt && meteors.length < 7) {
      spawnAt = t + (reduce ? 1.1 : 0.42) + Math.random() * (reduce ? 1.4 : 0.7);
      spawnFromEdge();
    }

    for (let i = meteors.length - 1; i >= 0; i -= 1) {
      const m = meteors[i];
      m.t += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (Math.abs(m.x - RING.cx) < RING.rx * 1.7 && Math.abs(m.y - RING.cy) < RING.ry * 2.6) {
        const d = ringDist(m.x, m.y);
        if (Math.abs(d.r - 1) < 0.055) {
          capture(m, d);
          meteors.splice(i, 1);
          continue;
        }
      }
      if (m.x > W + 260 || m.y > H + 260) meteors.splice(i, 1);
    }

    orbiters.forEach((o) => {
      if (drag && drag.i === orbiters.indexOf(o)) return;
      o.a += o.av * dt;
    });

    /* 水泡：往上飘、左右微摆，慢慢涨大再破掉 */
    for (let i = bubbles.length - 1; i >= 0; i -= 1) {
      const b = bubbles[i];
      const age = t - b.t0;
      if (age > b.life) {
        bubbles.splice(i, 1);
        continue;
      }
      b.y += b.vy * dt;
      b.x += Math.sin(age * 3.4 + b.ph) * 22 * dt;
    }

    drawBackdrop(t);
    drawMeteors();
    drawExtras(t);
    drawRing(t);
    drawOrbiters(t);

  };

  /* 脚本要是没跑起来（被预览面板拦了、或被禁），至少给一行字，别让人对着死图猜 */
  setTimeout(() => {
    if (!raf) return;
    if (last > 0.05) return;
    const tip = document.createElement('div');
    tip.textContent = '动画没跑起来 —— 用 Chrome 直接打开这个文件，别在预览面板里看';
    tip.style.cssText = 'position:fixed;left:0;right:0;bottom:18px;text-align:center;font:12px/1.6 system-ui;color:rgba(255,255,255,.4);pointer-events:none';
    document.body.appendChild(tip);
  }, 1400);

  const hitOrbiter = (x, y) => {
    for (let i = 0; i < orbiters.length; i += 1) {
      const p = ringPoint(orbiters[i].a);
      if (Math.hypot(p.x - x, p.y - y) < 30) return i;
    }
    return -1;
  };

  const onDown = (e) => {
    if (e.target.closest('[data-enter]')) return;
    const i = hitOrbiter(e.clientX, e.clientY);
    if (i >= 0) {
      drag = { i };
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
  };

  const onMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const now = performance.now();
    /* 鼠标滑过只吐水泡；涟漪留给点击 */
    if (now - mouse.last > 60) {
      mouse.last = now;
      const n = Math.random() < 0.55 ? 1 : 2;
      for (let i = 0; i < n; i += 1) {
        bubbles.push({
          x: mouse.x + (Math.random() - 0.5) * 26,
          y: mouse.y + (Math.random() - 0.5) * 18,
          r: 2.6 + Math.random() * 7.2,
          vy: -(12 + Math.random() * 26),
          ph: Math.random() * Math.PI * 2,
          t0: clock,
          life: 0.9 + Math.random() * 0.9,
          al: 0.5 + Math.random() * 0.32,
        });
      }
      if (bubbles.length > 70) bubbles.splice(0, bubbles.length - 70);
    }
    if (drag) {
      const o = orbiters[drag.i];
      if (o) o.a = ringAngleOf(e.clientX, e.clientY);
      return;
    }
    const hit = hitOrbiter(e.clientX, e.clientY) >= 0;
    document.body.style.cursor = hit ? 'grab' : '';
  };

  const onUp = () => {
    drag = null;
    document.body.style.cursor = '';
  };

  const measureClear = () => {
    const h = document.querySelector('.sp2-title');
    if (!h) return;
    const r = h.getBoundingClientRect();
    CLEAR.x = r.left + r.width / 2;
    CLEAR.y = r.top + r.height / 2;
    CLEAR.rx = r.width / 2 + 46;
    CLEAR.ry = r.height / 2 + 26;
  };

  const start = () => {
    sizeCanvases();
    measureRing();
    measureClear();
    makeDust();
    window.addEventListener('resize', () => {
      sizeCanvases();
      measureRing();
      makeDust();
    });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    /* 背景点击：涟漪 + 一圈柔光 + 三颗流星；不进主页 */
    window.addEventListener('click', (e) => {
      const inBtn = e.target instanceof Element && e.target.closest('[data-enter]');
      if (inBtn) return;
      ripples.push({ x: e.clientX, y: e.clientY, t0: clock });
      if (ripples.length > 12) ripples.shift();
      for (let i = 0; i < 3; i += 1) {
        spawnMeteor(e.clientX + (Math.random() - 0.5) * 40, e.clientY + (Math.random() - 0.5) * 40);
      }
      flashes.push({ x: e.clientX, y: e.clientY, t0: clock });
    });
    /* 环上先留两颗，让人一眼看懂这个环是干什么的 */
    orbiters.push({ a: 2.62, av: 0.55, text: '你好', size: 13 });
    orbiters.push({ a: 0.55, av: -0.45, text: 'hello', size: 13 });

    /* 先摆几颗已经在画面里的，别让人第一眼看到空屏 */
    [
      [W * 0.05, H * 0.12],
      [W * 0.24, H * 0.3],
      [W * 0.44, H * 0.06],
      [W * 0.62, H * 0.36],
      [W * 0.34, H * 0.52],
    ].forEach(([px, py]) => spawnMeteor(px, py));
    raf = requestAnimationFrame(frame);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('pagehide', () => raf && cancelAnimationFrame(raf));

  /* 只有「开始」能进主界面 */
  document.querySelectorAll('[data-enter]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.body.classList.contains('leaving')) return;
      document.body.classList.add('leaving');
      setTimeout(() => {
        window.location.href = './cards.html';
      }, 420);
    });
  });
})();
