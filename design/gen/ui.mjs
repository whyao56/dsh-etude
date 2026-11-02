/* 组件层：所有页面都从这里拼，页面文件里只写「这一页有什么」。 */
import fs from 'node:fs';

/* ---------------------------------------------------------------- 图标 */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6L6 18M18 6l1.6-1.6"/>',
  sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M4.5 12.5l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevD: '<path d="M5 9l7 7 7-7"/>',
  arrowR: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowL: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  arrowUpR: '<path d="M7 17L17 7M9 7h8v8"/>',
  play: '<path d="M8 5.5l11 6.5-11 6.5z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  mic: '<path d="M12 4a3 3 0 013 3v4a3 3 0 01-6 0V7a3 3 0 013-3z"/><path d="M6 11a6 6 0 0012 0M12 17v3"/>',
  sound: '<path d="M5 9v6h3l5 4V5L8 9z"/><path d="M17 9.5a4 4 0 010 5M19.5 7a7 7 0 010 10"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M3.5 17l5-4.5 4 3.5 3-2.5 5 4"/>',
  type: '<path d="M4 6h16M12 6v13M8 19h8"/>',
  pen: '<path d="M4 20l3.5-1 10-10a2.1 2.1 0 00-3-3L4.5 16z"/>',
  layers: '<path d="M12 3l9 4.8-9 4.8L3 7.8z"/><path d="M3 12.4l9 4.8 9-4.8"/><path d="M3 16.8l9 4.8 9-4.8"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  text: '<path d="M4 5h16M4 10.5h12M4 16h16M4 21h8"/>',
  chart: '<path d="M4 20h16M7 20v-6M12 20V7M17 20v-9"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 016.5 3H19v16.5H6.5A1.5 1.5 0 005 21z"/><path d="M5 17.2h14"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  flame: '<path d="M12 3s5 4.4 5 9a5 5 0 01-10 0c0-2 1-3.4 1-3.4S9 12 10.5 12C12 12 12 9 12 3z"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.3 6.4M20 4.5V11h-6.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M9 4.5H6.5A2 2 0 004.5 6.5v11A2 2 0 006.5 19.5h11a2 2 0 002-2V15"/>',
  more: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  warn: '<path d="M12 3.8L21 19.5H3z"/><path d="M12 9.5v4.5M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>',
  folder: '<path d="M3.5 7.5A2 2 0 015.5 5.5h3.7l2 2.4h7.3a2 2 0 012 2v7.6a2 2 0 01-2 2H5.5a2 2 0 01-2-2z"/>',
  key: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H21M17 12v3.5M20 12v3"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8"/>',
  wave: '<path d="M3 12h2l2-6 3 12 3-9 2 3h6"/>',
  bolt: '<path d="M13 3L5.5 13.5H11l-1 7.5L18 10.5h-5.5z"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort: '<path d="M7 4v16M7 20l-3-3M17 20V4M17 4l3 3"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
  pause2: '<path d="M9 5v14M15 5v14"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
  send: '<path d="M4 12l16-8-6 16-3-6z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
};

export function icon(name, cls) {
  const body = P[name] || P.info;
  return `<svg viewBox="0 0 24 24" width="1em" height="1em"${
    cls ? ` class="${cls}"` : ''
  } aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------------------------------------------------------- 原子 */
export const btn = (label, o = {}) =>
  `<${o.href ? 'a' : 'button'}${o.href ? ` href="${o.href}"` : ' type="button"'} class="btn ${o.k || ''} ${o.cls || ''}"${
    o.attrs || ''
  }${o.icon && !label ? ' aria-label="' + o.title + '"' : ''}>${o.icon ? icon(o.icon) : ''}${
    label ? `<span>${label}</span>` : ''
  }</${o.href ? 'a' : 'button'}>`;

export const iconbtn = (name, label, o = {}) =>
  `<button type="button" class="iconbtn ${o.cls || ''}" aria-label="${label}" title="${label}"${o.attrs || ''}>${icon(name)}</button>`;

export const kbd = (k) => `<kbd class="kbd">${k}</kbd>`;

export const keys = (list) =>
  `<span class="keys">${list.map((k) => `<span class="k">${typeof k === 'string' && k.length <= 4 ? kbd(k) : k}</span>`).join('')}</span>`;

export const chip = (label, o = {}) =>
  `<${o.href ? 'a href="' + o.href + '"' : 'button type="button"'}${
    o.attrs ? ' ' + o.attrs : ''
  } class="chip ${o.on ? 'on' : ''} ${o.cls || ''}">${o.dot ? `<span class="dot ${o.dot}"></span>` : ''}${label}${
    o.x ? `<span class="x">${icon('x')}</span>` : ''
  }</${o.href ? 'a' : 'button'}>`;

export const badge = (label, kind = '') =>
  `<span class="badge ${kind}">${kind === 'ok' || kind === 'bad' ? `<span class="dot ${kind}"></span>` : ''}${label}</span>`;

export const sw = (on, attrs = {}) =>
  `<button type="button" class="sw ${attrs.cls || ''}" aria-checked="${!!on}" aria-label="${
    attrs.label || '开关'
  }"${attrs.attrs || ''}></button>`;

export function seg(items, cur, attrs = '') {
  const list = items.map((it) => (typeof it === 'string' ? { v: it, t: it } : it));
  return `<div class="seg ${attrs.includes('accent') ? 'accent' : ''}"${attrs
    .replace('accent', '')
    .trim()} role="group">${list
    .map(
      (it) =>
        `<button type="button" class="${it.v === cur ? 'on' : ''}" data-v="${it.v}" aria-pressed="${
          it.v === cur
        }">${it.t}</button>`
    )
    .join('')}</div>`;
}

export const select = (opts, cur, label = '选择') =>
  `<div class="sel"><button type="button" class="sel-btn" aria-label="${label}"><span class="v">${
    (opts.find((o) => o.v === cur) || opts[0]).t
  }</span>${icon('chevD', 'chev')}</button><div class="sel-menu" role="listbox" hidden>${opts
    .map(
      (o) =>
        `<button type="button" class="sel-opt ${o.v === cur ? 'on' : ''}" data-v="${o.v}" data-label="${o.t}" role="option">${o.t}${icon('check', 'ck')}</button>`
    )
    .join('')}</div></div>`;

export const field = (label, control, hint) =>
  `<div class="field"><label>${label}</label>${control}${hint ? `<p class="f-hint">${hint}</p>` : ''}</div>`;

export const card = (o = {}) =>
  `<section class="card ${o.cls || ''}"${o.id ? ` id="${o.id}"` : ''}>${
    o.hd
      ? `<header class="card-hd"><h2>${o.hd}</h2>${o.sub ? `<span class="card-sub">${o.sub}</span>` : ''}${
          o.r ? `<div class="r">${o.r}</div>` : ''
        }</header>`
      : ''
  }<div class="card-bd ${o.pad || ''}">${o.bd || ''}</div>${
    o.ft ? `<div class="card-ft">${o.ft}</div>` : ''
  }</section>`;

export const kv = (rows) =>
  rows.map((r) => `<div class="kv"><span class="k">${r.k}</span><span class="v">${r.v}</span></div>`).join('');

export const dotbar = (n, on, part = 0) =>
  `<span class="dotbar">${new Array(n)
    .fill(0)
    .map((_, i) => `<i class="${i < on ? 'on' : i < on + part ? 'part' : ''}"></i>`)
    .join('')}</span>`;

export const photo = (src, o = {}) =>
  `<div class="photo ${o.ratio || 'r4-3'} ${o.cls || ''}"${o.attrs || ''}><img src="${src}" alt="${
    o.alt || ''
  }" loading="lazy">${o.veil || o.cap ? '<span class="ph-veil"></span>' : ''}${
    o.cap ? `<span class="ph-cap">${o.cap}</span>` : ''
  }${o.act ? `<span class="ph-act">${o.act}</span>` : ''}</div>`;

export const wave = (seed = 3, n = 34, cls = '') => {
  let s = seed;
  const bars = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = s / 0x7fffffff;
    const h = 4 + Math.abs(Math.sin(i * 0.7 + r * 3)) * 26 * (0.4 + r * 0.9);
    bars.push(`<i style="height:${Math.min(30, h).toFixed(1)}px"></i>`);
  }
  return `<span class="wave ${cls}">${bars.join('')}</span>`;
};

export const audioRow = (o = {}) =>
  `<div class="audio-row" data-audio data-dur="${o.dur || 3.2}"><button type="button" class="play-btn" aria-label="播放">${icon(
    'play'
  )}</button>${wave(o.seed || 5, o.bars || 36)}<span class="mono dim2" data-time>0:00 / 0:0${Math.round(
    o.dur || 3.2
  )}</span>${o.r || ''}</div>`;

/* ---------------------------------------------------------------- 空/载/错 */
export const empty = (o) =>
  `<div class="empty"><div class="empty-icon">${icon(o.icon || 'layers')}</div><h3>${o.title}</h3><p>${
    o.desc || ''
  }</p>${o.action || ''}</div>`;

export const skeletonCard = (h = 180) =>
  `<div class="card" style="padding:16px"><div class="sk" style="height:12px;width:42%"></div><div class="sk mt12" style="height:${h}px"></div><div class="sk mt12" style="height:12px;width:66%"></div></div>`;

export const errbox = (o) =>
  `<div class="errbox"><span class="ei">${icon('warn')}</span><div><h3>${o.title}</h3><p>${o.desc || ''}</p>${
    o.code ? `<div class="mono">${esc(o.code)}</div>` : ''
  }${o.action ? `<div class="mt12">${o.action}</div>` : ''}</div></div>`;

/* ---------------------------------------------------------------- 图表 */
export function barChart(o) {
  const w = o.w || 640;
  const h = o.h || 180;
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const max = Math.max(...o.data, 1);
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = o.data.length;
  const gap = n > 24 ? 2 : n > 12 ? 6 : 14;
  const bw = Math.max(2, (iw - gap * (n - 1)) / n);
  const bars = o.data
    .map((v, i) => {
      const bh = Math.max(v ? 3 : 1, (v / max) * ih);
      const x = pad.l + i * (bw + gap);
      return `<rect class="bar-r ${o.dimAfter && i >= o.dimAfter ? 'dim' : ''}" x="${x.toFixed(
        1
      )}" y="${(pad.t + ih - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(
        1
      )}" rx="${Math.min(3, bw / 2)}"><title>${o.tip ? o.tip(v, i) : v}</title></rect>`;
    })
    .join('');
  const labels = (o.labels || [])
    .map(
      (l, i) =>
        `<text class="axis" x="${(pad.l + i * (bw + gap) + bw / 2).toFixed(1)}" y="${
          h - 5
        }" text-anchor="middle">${l}</text>`
    )
    .join('');
  const grid = [0, 0.5, 1]
    .map((t) => `<line class="gl" x1="${pad.l}" x2="${w - pad.r}" y1="${(pad.t + ih * t).toFixed(1)}" y2="${(
      pad.t +
      ih * t
    ).toFixed(1)}"/>`)
    .join('');
  return `<svg class="chart cv" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px" role="img">${grid}${bars}${labels}</svg>`;
}

export function stackChart(o) {
  const w = o.w || 640;
  const h = o.h || 200;
  const pad = { l: 8, r: 8, t: 12, b: 20 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = o.rows.length;
  const gap = n > 24 ? 2 : 6;
  const bw = Math.max(2, (iw - gap * (n - 1)) / n);
  const totals = o.rows.map((r) => r.reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 1);
  const bars = o.rows
    .map((row, i) => {
      let y = pad.t + ih;
      const x = pad.l + i * (bw + gap);
      return row
        .map((v, k) => {
          const bh = (v / max) * ih;
          y -= bh;
          if (!bh) return '';
          return `<rect class="bar-r" style="opacity:${[1, 0.62, 0.38, 0.24][k] || 0.2}" x="${x.toFixed(
            1
          )}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(
            1
          )}" rx="1.5"><title>${o.tip ? o.tip(row, i) : ''}</title></rect>`;
        })
        .join('');
    })
    .join('');
  const labels = (o.labels || [])
    .map(
      (l, i) =>
        `<text class="axis" x="${(pad.l + i * (bw + gap) + bw / 2).toFixed(1)}" y="${
          h - 4
        }" text-anchor="middle">${l}</text>`
    )
    .join('');
  const grid = `<line class="gl" x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih}" y2="${pad.t + ih}"/>`;
  return `<svg class="chart cv" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px" role="img">${grid}${bars}${labels}</svg>`;
}

export function lineChart(o) {
  const w = o.w || 640;
  const h = o.h || 180;
  const pad = { l: 8, r: 8, t: 14, b: 20 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(...o.data) * 1.12;
  const pts = o.data.map((v, i) => [
    pad.l + (i / (o.data.length - 1)) * iw,
    pad.t + ih - (v / max) * ih,
  ]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `${d} L${(pad.l + iw).toFixed(1)} ${(pad.t + ih).toFixed(1)} L${pad.l} ${(
    pad.t + ih
  ).toFixed(1)} Z`;
  const labels = (o.labels || [])
    .map(
      (l, i) =>
        `<text class="axis" x="${(pad.l + (i / (o.labels.length - 1)) * iw).toFixed(1)}" y="${
          h - 4
        }" text-anchor="middle">${l}</text>`
    )
    .join('');
  return `<svg class="chart cv" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px" role="img">
  <defs><linearGradient id="gradAccent" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#a7bdf6" stop-opacity=".28"/><stop offset="100%" stop-color="#a7bdf6" stop-opacity="0"/>
  </linearGradient></defs>
  <line class="gl" x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih}" y2="${pad.t + ih}"/>
  <path class="line-area" d="${area}"/><path class="line-p" d="${d}"/>
  ${labels}</svg>`;
}

export function donut(o) {
  const size = o.size || 132;
  const r = size / 2 - 9;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const total = o.parts.reduce((a, b) => a + b.v, 0) || 1;
  const arcs = o.parts
    .map((p, i) => {
      const len = (p.v / total) * c;
      const seg = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${p.c}" stroke-width="${
        o.wid || 9
      }" stroke-dasharray="${len.toFixed(1)} ${(c - len).toFixed(1)}" stroke-dashoffset="${(
        -acc
      ).toFixed(1)}" stroke-linecap="butt" transform="rotate(-90 ${cx} ${cx})"/>`;
      acc += len;
      return seg;
    })
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="${o.wid || 9}"/>
    ${arcs}</svg>`;
}

export const heat = (cells, cls) =>
  `<div class="heat ${cls || ''}" data-heat="${cells.join(',')}"></div>`;

export const heatLegend = () =>
  `<div class="heat-legend"><span>少</span>${[0, 1, 2, 3, 4]
    .map((l) => `<i data-l="${l}"></i>`)
    .join('')}<span>多</span></div>`;

/* ---------------------------------------------------------------- 壳 */
const NAV = [
  {
    g: '造卡',
    items: [
      { k: 'factory', t: '工厂', i: 'sparkle' },
      { k: 'mine', t: '挖句', i: 'text' },
    ],
  },
  {
    g: '卡片',
    items: [
      { k: 'cards', t: '卡组', i: 'layers' },
      { k: 'library', t: '句库', i: 'grid' },
    ],
  },
  { g: '练习', items: [{ k: 'study', t: '学习', i: 'play', tag: '12' }] },
  { g: '观察', items: [{ k: 'stats', t: '统计', i: 'chart' }] },
];

export function side(page) {
  const groups = NAV.map(
    (g) =>
      `<p class="nav-g">${g.g}</p>` +
      g.items
        .map(
          (it) =>
            `<a class="nav-i ${page === it.k ? 'on' : ''}" href="./${it.k}.html" data-fade>${icon(it.i)}<span>${
              it.t
            }</span>${it.tag ? `<span class="n-tag">${it.tag}</span>` : ''}</a>`
        )
        .join('')
  ).join('');
  return `<aside class="side">
  <a class="brand" href="./cards.html" data-fade><span class="brand-mark">卡</span><span class="brand-txt"><span class="brand-name">卡片工厂</span><span class="brand-sub">dsh-etude · 0.2</span></span></a>
  <nav class="nav">${groups}</nav>
  <div class="side-foot">
    <a class="nav-i ${page === 'tutorial' ? 'on' : ''}" href="./tutorial.html" data-fade>${icon('book')}<span>教程</span></a>
    <a class="nav-i ${page === 'settings' ? 'on' : ''}" href="./settings.html" data-fade>${icon('sliders')}<span>设置</span></a>
    <a class="side-user" href="./settings.html#about" data-fade><span class="ava">HP</span><span class="u-txt"><span style="display:block;font-size:12.5px;color:var(--c-ink)">本机</span><span style="display:block;font-size:11px;color:var(--c-ink-3)">数据在本地</span></span></a>
  </div>
</aside>`;
}

export function topbar(o = {}) {
  const crumbs = (o.crumb || []).map((c, i, a) =>
    i === a.length - 1
      ? `<span class="cur">${c.t}</span>`
      : `<a href="${c.href}" data-fade>${c.t}</a><span class="sep">/</span>`
  ).join('');
  return `<header class="topbar">
  <nav class="crumbs" aria-label="位置">${crumbs}</nav>
  <div class="topbar-r">
    <button type="button" class="searchbox" data-open="dlg-search">${icon('search')}<span style="flex:1">搜索词、句子、场景…</span>${kbd('⌘K')}</button>
    ${iconbtn('keyboard', '快捷键')}
    <a class="iconbtn ${o.page === 'settings' ? 'on' : ''}" href="./settings.html" data-fade aria-label="设置" title="设置">${icon(
      'sliders'
    )}</a>
  </div>
</header>`;
}

export const searchDlg = () => `<div class="dlg" id="dlg-search" hidden role="dialog" aria-label="搜索">
  <div class="dlg-bd" style="padding:14px">
    <div class="input-ico">${icon('search')}<input class="input lg" placeholder="一个词、一条句子、一个场景，都能搜" autofocus></div>
    <div class="mt12" style="display:flex;flex-direction:column;gap:2px">
      <a class="picked on" href="./detail.html" data-fade data-close><span class="ck">${icon(
        'arrowUpR'
      )}</span><span><b style="color:var(--c-ink);font-weight:600">abandon</b> · The crew abandoned ship within minutes.</span></a>
      <a class="picked" href="./library.html" data-fade data-close><span class="ck">${icon(
        'arrowUpR'
      )}</span><span>abandon · 丢掉、放弃 · 3 条例句</span></a>
      <a class="picked" href="./cards.html" data-fade data-close><span class="ck">${icon(
        'arrowUpR'
      )}</span><span>牌组 · 影视对白</span></a>
    </div>
  </div>
  <div class="dlg-ft"><span class="keys">${kbd('↑')}${kbd('↓')} 选 ${kbd('↵')} 打开 ${kbd('esc')} 关</span></div>
</div>`;

const VER = 'v' + Math.floor(fs.statSync(new URL('../system.css', import.meta.url)).mtimeMs).toString(36);

/* 变体页放在 design/v/ 里，靠 <base> 找回资源；生成器负责设置 */
let BASE = '';
export const setBase = (b) => {
  BASE = b;
};

export function shell(o) {
  const base = o.base ?? BASE ? `<base href="${o.base ?? BASE}">` : '';
  return `<!doctype html>
<html lang="zh-CN" data-page="${o.page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${base}<title>${o.title || '卡片工厂'}</title>
<link rel="stylesheet" href="./system.css?${VER}">
<script src="./ui.js?${VER}" defer></script>
</head>
<body class="${o.bodyClass || ''}">
${o.noShell ? o.body : `<div class="app">
${side(o.page)}
<div class="main">
${topbar({ page: o.page, crumb: o.crumb })}
<main class="page ${o.wide ? 'wide' : ''} ${o.pageCls || ''}">
${o.body}
</main>
</div>
</div>
${searchDlg()}
<div class="scrim" id="scrim" hidden></div>`}
</body>
</html>`;
}

export function pageHd(o) {
  return `<header class="ph">
  <div class="ph-l">
    ${o.eyebrow ? `<div class="ph-eyebrow">${o.eyebrow}</div>` : ''}
    <h1>${o.title}</h1>
    ${o.desc ? `<p class="ph-desc">${o.desc}</p>` : ''}
  </div>
  ${o.actions ? `<div class="ph-r">${o.actions}</div>` : ''}
</header>`;
}

/* 一页三态：?s=empty|loading|error 时切过去，默认 normal */
export const states = (o) =>
  [
    o.loading ? `<div data-when="loading">${o.loading}</div>` : '',
    o.empty ? `<div data-when="empty">${o.empty}</div>` : '',
    o.error ? `<div data-when="error">${o.error}</div>` : '',
    `<div data-when="normal">${o.normal}</div>`,
  ].join('');

export const steps = (items, cur, cls = '') =>
  `<div class="steps ${cls}" role="list">${items
    .map(
      (t, i) =>
        `<span class="st ${i < cur ? 'done' : i === cur ? 'on' : ''}" role="listitem"><span class="n">${
          i < cur ? '✓' : i + 1
        }</span>${t}</span>${i < items.length - 1 ? '<span class="ln"></span>' : ''}`
    )
    .join('')}</div>`;
