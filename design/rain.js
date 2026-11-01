/* rain.js · 玻璃雨滴背景 · 2026
   轻描淡写的水珠在玻璃上凝结 → 缓慢滑落 → 消失。
   只用 canvas，不改 DOM，不干扰内容层。 */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.querySelector('canvas.rain');
  if (!cv) return;

  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, raf = 0, last = 0;

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* 读配色 */
  const rgb = () => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-rgb').trim();
    return v ? v.split(',').map(Number) : [151, 177, 240];
  };

  /* 一颗水珠 */
  const mkDrop = () => ({
    x    : Math.random() * W,
    y    : Math.random() * H * 0.85,
    r    : 0,
    maxR : 4 + Math.random() * 14,
    vy   : 0,
    phase: 'grow',     /* grow → slide → fade */
    alpha: 0,
    trail: [],         /* 滑落轨迹点 */
  });

  let drops = [];
  const MAX = 18;

  const spawn = () => {
    if (drops.length < MAX) drops.push(mkDrop());
  };

  let spawnTimer = 0;

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(now - last, 64);
    last = now;
    spawnTimer += dt;

    /* 随机生成新水珠 */
    if (spawnTimer > 600 + Math.random() * 1200) {
      spawn();
      spawnTimer = 0;
    }

    ctx.clearRect(0, 0, W, H);

    const [ar, ag, ab] = rgb();

    drops = drops.filter((d) => {
      if (d.phase === 'grow') {
        d.r     += dt * 0.018;
        d.alpha += dt * 0.0012;
        if (d.r >= d.maxR) {
          d.r    = d.maxR;
          d.vy   = 0.008 + Math.random() * 0.025;
          d.phase = 'slide';
        }
      } else if (d.phase === 'slide') {
        d.vy   += dt * 0.0003;         /* 重力加速 */
        const dy = d.vy * dt;
        d.trail.push({ x: d.x, y: d.y, r: d.r * 0.25 });
        if (d.trail.length > 12) d.trail.shift();
        d.y    += dy;
        d.r    *= 0.9992;              /* 滑时稍微变小 */
        if (d.y > H + 40) { d.phase = 'fade'; }
      } else {
        d.alpha -= dt * 0.003;
        if (d.alpha <= 0) return false;
      }

      /* 绘轨迹（细细的线） */
      if (d.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(d.trail[0].x, d.trail[0].y);
        d.trail.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${d.alpha * 0.08})`;
        ctx.lineWidth   = d.r * 0.35;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      /* 绘水珠主体 */
      const a = Math.min(d.alpha, 0.18);
      if (a <= 0 || d.r < 0.5) return true;

      /* 主体 */
      const g = ctx.createRadialGradient(
        d.x - d.r * 0.28, d.y - d.r * 0.32, d.r * 0.05,
        d.x, d.y, d.r,
      );
      g.addColorStop(0,   `rgba(${ar},${ag},${ab},${a * 0.55})`);
      g.addColorStop(0.55, `rgba(${ar},${ag},${ab},${a * 0.22})`);
      g.addColorStop(1,   `rgba(${ar},${ag},${ab},${a * 0.06})`);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      /* 高光弧（顶部 45 度弧） */
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.18, d.y - d.r * 0.22, d.r * 0.52, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = `rgba(255,255,255,${a * 1.4})`;
      ctx.lineWidth   = d.r * 0.14;
      ctx.lineCap     = 'round';
      ctx.stroke();

      /* 边缘细圈 */
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${a * 0.5})`;
      ctx.lineWidth   = 0.6;
      ctx.stroke();

      return true;
    });
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });
  raf = requestAnimationFrame((t) => { last = t; tick(t); });
})();
