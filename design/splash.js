/* ────────────────────────────────────────────────
   启动页：会慢慢转的星空 + 长按长曝光
   · 星是「光点」（预渲染径向渐变贴图），不是实心圆
   · 平时整片星空绕天极极慢地转，像真实天空的周日运动
   · 按住空白处 → 长曝光：星轨从点长成一条真圆弧，松手收回
   · 没有黑洞、没有流星、没有卫星环
   ──────────────────────────────────────────────── */
(function () {
  'use strict'

  var cvs = document.getElementById('sky')
  if (!cvs) return
  var ctx = cvs.getContext('2d')
  // 视网膜屏上 2 倍换算成 4 倍像素，星轨这种柔和的东西 1.5 倍已经看不出差别，帧率却差一截
  var DPR = Math.min(1.5, window.devicePixelRatio || 1)
  var W = 0, H = 0, cx = 0, cy = 0
  var pole = { x: 0, y: 0 }
  var TAU = Math.PI * 2
  var pt = 0, last = 0

  function rnd (a, b) { return a + Math.random() * (b - a) }

  /* ── 星点贴图 ── */
  // 白 → 冰蓝 → 金 → 玫瑰 → 紫罗兰 → 青 → 品红 → 橙
  var TINTS = [
    [255, 255, 255],
    [150, 205, 255],
    [255, 206, 110],
    [255, 130, 185],
    [176, 140, 255],
    [110, 240, 225],
    [255, 110, 200],
    [255, 152, 92]
  ]
  // 选色权重：大部分还是白/冷色，剩下的给足饱和度
  var TINT_W = [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6, 7]
  var sprites = []

  function makeSprite (rgb) {
    var S = 64, c = document.createElement('canvas')
    c.width = c.height = S
    var g = c.getContext('2d')
    var grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    grad.addColorStop(0.00, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',1)')
    grad.addColorStop(0.16, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.66)')
    grad.addColorStop(0.38, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.18)')
    grad.addColorStop(0.68, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.04)')
    grad.addColorStop(1.00, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)')
    g.fillStyle = grad
    g.fillRect(0, 0, S, S)
    return c
  }

  /* ── 星 ── */
  var stars = []
  var trailing = []
  var q3 = true
  var smoothDt = 0.016
  var holdS = 0
  var trailCap = 1
  var slowFrames = 0

  function makeStar (r, size, tier) {
    var tint = Math.random() < 0.30 ? 0 : TINT_W[(Math.random() * TINT_W.length) | 0]
    // 景深：0 = 很远很小很暗，1 = 很近很大很亮。亮暗、粗细、拖影长短全挂在这上面
    var depth = tier === 2 ? rnd(0.90, 1.0) : tier === 1 ? rnd(0.55, 0.90) : Math.pow(Math.random(), 1.45)
    return {
      depth: depth,
      r: r,
      a: Math.random() * TAU,
      // 内圈快、外圈慢：这样才像绕天极转，而不是整体平移
      // 真实星空：所有星同一个角速度绕天极转。之前按 r^-0.5 给了内圈更快，
    // 结果整片像旋涡，不像长曝光。改成常数角速度后，拖影长度 ∝ 半径，才是照片。
    w: 0.045 * rnd(0.95, 1.05),
      size: size * (0.72 + 0.55 * depth),
      tint: tint,
      // 亮度跟景深走：近的亮、远的暗，不能一片一样
      lum: (0.16 + 0.84 * depth) * rnd(0.82, 1.0),
      tw: rnd(0.6, 2.4),
      tws: rnd(0.35, 1.1),
      spike: tier === 2,
      trail: 0
    }
  }

  function seed () {
    stars.length = 0
    trailing = []
    var maxR = Math.hypot(Math.max(pole.x, W - pole.x), Math.max(pole.y, H - pole.y)) * 1.15
    // 远：多、小、几乎不动；中：一层过渡；近：少、大、亮、拖影长
    for (var i = 0; i < 760; i++) stars.push(makeStar(Math.pow(Math.random(), 0.55) * maxR, rnd(0.34, 0.86), 0))
    for (var j = 0; j < 220; j++) stars.push(makeStar(Math.pow(Math.random(), 0.70) * maxR, rnd(0.85, 1.5), 1))
    for (var k = 0; k < 10; k++) stars.push(makeStar(rnd(0.30, 1.0) * maxR, rnd(1.8, 2.6), 2))
    // 只有够亮的星才留影（暗星在长曝光里本来也拍不出来），顺带省一半拖影开销
    for (var m = 0; m < stars.length; m++) if (stars[m].lum > 0.60) trailing.push(stars[m])
  // 按亮度降序：渐入时先出现最亮的，暗的垫后，看不到「突然多出一批」的跳变
  trailing.sort(function (a, b) { return b.lum - a.lum })
  }

  /* ── 长按 ── */
  var hold = 0, holdTarget = 0, entered = false

  function onDown (e) {
    if (e.target && e.target.closest && e.target.closest('[data-enter]')) return
    holdTarget = 1
  }
  function onUp () { holdTarget = 0 }

  /* ── 尺寸 ── */
  function resize () {
    W = window.innerWidth
    H = window.innerHeight
    cvs.width = Math.round(W * DPR)
    cvs.height = Math.round(H * DPR)
    cvs.style.width = W + 'px'
    cvs.style.height = H + 'px'
    cx = W / 2; cy = H / 2
    // 天极偏左上，整片星空扫过来是斜的，比正中好看
    pole.x = W * 0.26
    pole.y = H * 0.18
    buildCache()
    seed()
  }

  /* ── 背景：底色 + 三团极淡的星云 ── */
  var NEBULA = [
    { x: 0.24, y: 0.26, r: 0.52, c: '122,66,255', a: 0.26, s: 0.030 },
    { x: 0.80, y: 0.66, r: 0.46, c: '24,178,190', a: 0.22, s: -0.024 },
    { x: 0.56, y: 0.94, r: 0.44, c: '214,58,150', a: 0.21, s: 0.019 },
    { x: 0.72, y: 0.14, r: 0.34, c: '58,116,250', a: 0.17, s: -0.031 },
    { x: 0.12, y: 0.80, r: 0.30, c: '255,138,64', a: 0.11, s: 0.026 }
  ]

  // 背景与暗角都预渲染一次：每帧重画三张全屏径向渐变太贵（软件渲染直接卡死）
  var bgCache = null
  var vigCache = null
  var trailCv = null
  var trailCtx = null
  var TR = 0.5

  function buildCache () {
    bgCache = document.createElement('canvas')
    bgCache.width = Math.max(2, Math.round(W))
    bgCache.height = Math.max(2, Math.round(H))
    var b = bgCache.getContext('2d')
    b.fillStyle = '#04060d'
    b.fillRect(0, 0, W, H)
    for (var i = 0; i < NEBULA.length; i++) {
      var n = NEBULA[i]
      var g = b.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * Math.max(W, H))
      g.addColorStop(0, 'rgba(' + n.c + ',' + n.a + ')')
      g.addColorStop(1, 'rgba(' + n.c + ',0)')
      b.fillStyle = g
      b.fillRect(0, 0, W, H)
    }

    trailCv = document.createElement('canvas')
    trailCv.width = Math.max(2, Math.round(W * TR))
    trailCv.height = Math.max(2, Math.round(H * TR))
    trailCtx = trailCv.getContext('2d')

    // 地平线：底部一层暖光（远处城市的光污染）+ 贴底压暗，纯星空才有「拍到的照片」感
    var hz = b.createLinearGradient(0, H * 0.62, 0, H)
    hz.addColorStop(0, 'rgba(255,150,80,0)')
    hz.addColorStop(0.55, 'rgba(255,150,80,0.075)')
    hz.addColorStop(1, 'rgba(255,120,60,0.16)')
    b.fillStyle = hz
    b.fillRect(0, H * 0.62, W, H * 0.38)
    var hg = b.createRadialGradient(W * 0.62, H * 1.05, 0, W * 0.62, H * 1.05, Math.max(W, H) * 0.55)
    hg.addColorStop(0, 'rgba(255,146,72,0.20)')
    hg.addColorStop(1, 'rgba(255,146,72,0)')
    b.fillStyle = hg
    b.fillRect(0, 0, W, H)
    var bt = b.createLinearGradient(0, H * 0.80, 0, H)
    bt.addColorStop(0, 'rgba(2,3,7,0)')
    bt.addColorStop(1, 'rgba(2,3,7,0.55)')
    b.fillStyle = bt
    b.fillRect(0, H * 0.80, W, H * 0.20)

    vigCache = document.createElement('canvas')
    vigCache.width = bgCache.width
    vigCache.height = bgCache.height
    var v2 = vigCache.getContext('2d')
    var vg = v2.createRadialGradient(cx, cy, Math.min(W, H) * 0.26, cx, cy, Math.max(W, H) * 0.74)
    vg.addColorStop(0, 'rgba(2,3,8,0)')
    vg.addColorStop(1, 'rgba(2,3,8,1)')
    v2.fillStyle = vg
    v2.fillRect(0, 0, W, H)
  }

  function drawBackdrop () {
    ctx.drawImage(bgCache, 0, 0, W, H)
  }

  /* ── 拖影：批量画。同色同粗细的弧攒成一个 path，一次 stroke ──
     逐颗开 path 的话，按住那一刻一帧里要 stroke 上千次，开始和结束就会抽帧。 */
  var GRP = []
  function grp (gi) {
    var g = GRP[gi]
    if (!g) g = GRP[gi] = { n: 0, xs: [], ys: [], rs: [], a0: [], a1: [] }
    return g
  }
  var WDEPTH = [0.55, 0.9, 1.3]
  for (var gi = 0; gi < 216 + 8; gi++) grp(gi)

  /* 亮的那一批：整条弧用「尾暗头亮」的线性渐变一次画完。
     分段画会有三条硬边，渐变才是真实曝光的长相。
     暗的那一批照旧批量描 —— 它们本来就看不见接缝，省下的是每帧几十次 stroke。 */
  function drawTrails (fade) {
    var i, j
    for (i = 0; i < GRP.length; i++) if (GRP[i]) { GRP[i].n = 0; GRP[i].lit = 0; GRP[i].cnt = 0 }

    var jmax = Math.ceil(trailing.length * trailCap * Math.min(1, holdS * 1.8))
    var smoothN = Math.min(jmax, Math.round(120 * trailCap))
    var len = holdS * 0.62

    for (j = 0; j < jmax; j++) {
      var s = trailing[j]
      if (len < 0.008) continue
      var head = s.a, tail = head - len
      var lit = s.lum * (0.72 + 0.28 * Math.sin(s.tw * s.tws + pt * 1.4))

      if (j < smoothN && len > 0.03) {
        var t = TINTS[s.tint]
        var tx = pole.x + Math.cos(tail) * s.r, ty = pole.y + Math.sin(tail) * s.r
        var hx = pole.x + Math.cos(head) * s.r, hy = pole.y + Math.sin(head) * s.r
        var peak = Math.min(0.95, (0.34 + 0.62 * s.lum) * fade)
        var gr = ctx.createLinearGradient(tx, ty, hx, hy)
        gr.addColorStop(0, 'rgba(' + t + ',0)')
        gr.addColorStop(0.20, 'rgba(' + t + ',' + (peak * 0.11).toFixed(3) + ')')
        gr.addColorStop(0.50, 'rgba(' + t + ',' + (peak * 0.36).toFixed(3) + ')')
        gr.addColorStop(0.78, 'rgba(' + t + ',' + (peak * 0.66).toFixed(3) + ')')
        gr.addColorStop(1, 'rgba(' + t + ',' + peak.toFixed(3) + ')')
        ctx.strokeStyle = gr
        ctx.lineWidth = Math.max(0.7, s.size * 0.78)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.arc(pole.x, pole.y, s.r, tail, head)
        ctx.stroke()
        continue
      }

      var b = s.depth < 0.5 ? 0 : (s.depth < 0.78 ? 1 : 2)
      var g = grp((s.tint * 3 + b) * 3)
      var n = g.n
      g.xs[n] = pole.x + Math.cos(tail) * s.r
      g.ys[n] = pole.y + Math.sin(tail) * s.r
      g.rs[n] = s.r
      g.a0[n] = tail
      g.a1[n] = head
      g.n = n + 1
      g.lit = (g.lit || 0) + lit * fade
      g.cnt = (g.cnt || 0) + 1
    }

    for (i = 0; i < GRP.length; i++) {
      var G = GRP[i]
      if (!G || !G.n || !G.cnt) continue
      var ti = Math.floor(i / 9), bi = Math.floor((i % 9) / 3)
      var tint = TINTS[ti]
      var alpha = (G.lit / G.cnt) * 0.42
      if (alpha < 0.006) continue
      ctx.strokeStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + alpha.toFixed(3) + ')'
      ctx.lineWidth = WDEPTH[bi] * 0.85
      ctx.beginPath()
      for (var q = 0; q < G.n; q++) {
        ctx.moveTo(G.xs[q], G.ys[q])
        ctx.arc(pole.x, pole.y, G.rs[q], G.a0[q], G.a1[q])
      }
      ctx.stroke()
    }
  }

  /* ── 星点 ── */
  function drawStar (s) {
    var x = pole.x + Math.cos(s.a) * s.r
    var y = pole.y + Math.sin(s.a) * s.r
    var d = s.size * (s.spike ? 8.4 : 5.6)
    var pad = d
    if (x < -pad || x > W + pad || y < -pad || y > H + pad) return

    var born = pt < 0.8 ? pt / 0.8 : 1     // 开场半秒里星星慢慢浮出来，第一批帧不至于一上来就满负荷
    if (born < 0.05) return
    var lit = (0.64 + 0.36 * Math.sin(s.tw * s.tws + pt * 1.4)) * s.lum
    ctx.globalAlpha = Math.min(1, (0.34 + lit * 1.15) * born)
    ctx.drawImage(sprites[s.tint], x - d / 2, y - d / 2, d, d)

    // 彩色光晕：亮星外面再糊一圈同色的光，画面才「艳」
    if (s.size > 1.0) {
      var dh = d * 2.6
      ctx.globalAlpha = 0.16 * lit
      ctx.drawImage(sprites[s.tint], x - dh / 2, y - dh / 2, dh, dh)
    }

    if (s.spike) {
      ctx.globalAlpha = 0.13 * lit
      ctx.strokeStyle = 'rgba(' + TINTS[s.tint].join(',') + ',1)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(x - d * 1.05, y); ctx.lineTo(x + d * 1.05, y)
      ctx.moveTo(x, y - d * 1.05); ctx.lineTo(x, y + d * 1.05)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  function frame (ts) {
    if (!last) last = ts
    var dt = Math.min(0.05, (ts - last) / 1000)
    last = ts
    pt += dt

    // dt 抖动会让转速跟着抖，这里对 hold 再平滑一次，转速只跟「意图」走
    hold += (holdTarget - hold) * Math.min(1, dt * 3.2)
    holdS += (hold - holdS) * Math.min(1, dt * 7)
    var speed = 1 + holdS * 5.5

    // 卡了就自动降一档：远星少画一半、拖影少一段。宁可少画，也不要一路掉帧
    smoothDt = smoothDt * 0.92 + dt * 0.08
    if (!q3) { if (smoothDt < 0.019) q3 = true }
    else if (smoothDt > 0.028) q3 = false
    // 一直慢就把拖影总量再砍一半，宁可稀一点，也不要顿
    if (smoothDt > 0.024) { if (++slowFrames > 18 && trailCap > 0.5) { trailCap = 0.5; slowFrames = 0 } }
    else slowFrames = 0

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    drawBackdrop()

    var anyTrail = false

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i]
      s.a += s.w * speed * dt
      if (s.a > TAU) s.a -= TAU
    }
    if (hold > 0.02) anyTrail = true

    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'

    if (anyTrail) drawTrails(Math.min(1, hold * 1.7))

    for (var k = 0; k < stars.length; k++) {
      if (!q3 && stars[k].depth < 0.38) continue
      drawStar(stars[k])
    }

    ctx.globalCompositeOperation = 'source-over'



    requestAnimationFrame(frame)
  }

  /* ── 进门 ── */
  function enter () {
    if (entered) return
    entered = true
    // 按下去的第一下就加速星空，遮罩盖上时它正在转，两页看起来是一个镜头
    holdTarget = 1
    document.body.classList.add('leaving')
    if (window.kfGo) return window.kfGo('./cards.html', { ms: 470 })
    var veil = document.createElement('div')
    veil.style.cssText = 'position:fixed;inset:0;z-index:99;background:#04060d;opacity:0;transition:opacity .52s ease'
    document.body.appendChild(veil)
    requestAnimationFrame(function () { veil.style.opacity = '1' })
    setTimeout(function () { window.location.href = './cards.html?t=fade' }, 540)
  }

  window.addEventListener('resize', resize)
  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })
  window.addEventListener('blur', onUp)
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.target && e.target.closest && e.target.closest('input,textarea')) return
      e.preventDefault(); enter()
    }
  })
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-enter]')) enter()
  })

  sprites = TINTS.map(makeSprite)
  resize()
  requestAnimationFrame(frame)

  // 调试：__sky.preset(1) 直接看到长曝光那一眼，preset(0) 回到纯星空
  window.__sky = {
    hold: function (v) { holdTarget = v ? 1 : 0 },
    preset: function (len) {
      holdTarget = len ? 1 : 0
      hold = len ? 1 : 0
      for (var i = 0; i < stars.length; i++) {
        stars[i].trail = len ? 2.3 : 0
        stars[i].a = Math.random() * TAU
      }
    }
  }
})()
