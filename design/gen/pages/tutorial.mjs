/* 教程：三分钟走完一条产线。左边目录，右边图文。 */
import { btn, icon, chip, kbd, card, photo, pageHd, shell, badge } from '../ui.mjs';

const TOC = [
  ['造一个词', '#step-1'],
  ['挑一张图', '#step-2'],
  ['听一遍语音', '#step-3'],
  ['打包', '#step-4'],
  ['导出', '#step-5'],
  ['开始练', '#step-6'],
];

const step = (n, id, title, body) =>
  `<section id="${id}" style="scroll-margin-top:72px">
    <div class="row" style="gap:10px;align-items:center;margin:0 0 10px">
      <span class="t-xs dim2 num" style="width:22px">${String(n).padStart(2, '0')}</span>
      <h2 style="margin:0;font-size:20px;font-weight:600">${title}</h2>
    </div>
    ${body}
  </section>`;

const fig = (name, cap) =>
  `<figure>${photo('./assets/photos/' + name + '.jpg', { ratio: 'r16-9' })}<figcaption>${cap}</figcaption></figure>`;

function v1() {
  const body = [
    step(
      1,
      'step-1',
      '造一个词',
      `<p>输入一个词、一个固定说法，或者一整句。选条数，按「造料」。造的是句子，不是翻译——每一句都要交代谁在说、在哪、说完会怎样。</p>
      <div class="note">判型规则：有句末标点、开头是 I/you/they…、或者 6 词以上，就当整句处理。</div>
      ${fig('p-harbor', '八条例句里的一条：港口，凌晨，船长下最后一道命令。')}
      <p>确定性校验会拦四种情况：没含目标词、两句重复、场景照抄句子、场景相似度超过 0.86。不过就带着问题重试一次，还不过就报错。</p>`
    ),
    step(
      2,
      'step-2',
      '挑一张图',
      `<p>搜到的候选图先过体检：短边 ≥ 640、≤ 4MB、文件头对得上、亮度标准差 ≥ 6（防纯色）、二阶差分 ≥ 1.1（防渐变）、量化色数占比 ≥ 0.02。过不了的直接丢，不进九宫格。</p>
      ${fig('p-office', '九宫格里挑一张：单击选中，双击锁定。')}
      <div class="note">没有「自动入库」这条路。每张图必须有人点过头，才写得进清单。</div>`
    ),
    step(
      3,
      'step-3',
      '听一遍语音',
      `<p>Edge TTS 零配置，装了就能用。一条一条听，听到 60% 才允许点「我听过了」——这个按钮点不下去，就导出不了。</p>
      <div class="row" style="gap:8px;margin:10px 0"><span class="kbd">R</span><span class="t-sm dim">重放</span><span class="spacer"></span><span class="badge ok">3.4 秒 · Ava</span></div>`
    ),
    step(
      4,
      'step-4',
      '打包',
      `<p>打包前跑硬校验：缺图、缺人工复核、哈希不对，都会拒绝，并说清第几条差什么。</p>
      ${fig('p-library', '校验过了才会生成 manifest 和 images/、audio/。')}`
    ),
    step(
      5,
      'step-5',
      '导出',
      `<p>默认导到 <span class="mono">Downloads\\dsh-etude\\&lt;词&gt;-&lt;id&gt;\\</span>。先清空目标目录，拷完拿副本再验一遍——两处都过了才算「已复验」。</p>`
    ),
    step(
      6,
      'step-6',
      '开始练',
      `<p>五面：听、说、读、写、改。每面给的东西不一样，灰掉不代表禁掉，是这一面不鼓励先看。</p>
      ${fig('p-coffee', '读：先给句子，想画面；翻开才给图和中文。')}
      <div class="row" style="gap:8px;margin-top:12px">${btn('去练习', { k: 'primary', icon: 'play', href: './study.html' })}${btn('回工厂', { k: 'ghost', icon: 'sparkle', href: './factory.html' })}</div>`
    ),
  ].join('');

  return shell({
    page: 'tutorial',
    crumb: [{ t: '教程' }],
    body: `<div class="tut-hero">
        <span class="ph-eyebrow">三分钟</span>
        <h1 style="font-size:28px;margin:6px 0 8px">从一句话到一张能练的卡</h1>
        <p class="dim" style="margin:0;max-width:620px">这条线只有五个动作：造例句、挑图、试听、打包、导出。每一步都有人的一票。</p>
      </div>
      <div class="tut-shell">
        <nav class="tut-toc">${TOC.map(([t, h], i) => `<a href="${h}" class="${i === 0 ? 'on' : ''}">${t}</a>`).join('')}</nav>
        <div class="prose" style="display:flex;flex-direction:column;gap:36px;max-width:700px">${body}</div>
      </div>`,
  });
}

function v2() {
  return shell({
    page: 'tutorial',
    crumb: [{ t: '教程' }],
    body: `<div class="tut-hero" style="padding:40px;border-radius:14px;background:var(--c-surf);border:1px solid var(--c-line)">
        <span class="ph-eyebrow">三分钟</span>
        <h1 style="font-size:28px;margin:6px 0 8px">一条产线，五个人工动作</h1>
        <p class="dim" style="margin:0;max-width:560px">看完这一页，你会知道为什么「没有图」不是占位框，而是根本导出不了。</p>
      </div>
      <div class="g g3 mt20">
        ${[
          ['造例句', '一个词八个场景，场景不许撞。', 'sparkle'],
          ['挑图', '先过体检，再进九宫格，点了才算。', 'image'],
          ['试听', '听到 60% 才让点确认。', 'sound'],
          ['打包', '硬校验不过就拒绝，说清第几条。', 'layers'],
          ['导出', '拷完拿副本再验一遍。', 'download'],
          ['练习', '听、说、读、写、改。', 'play'],
        ]
          .map(
            ([t, d, ic], i) => `<div class="card"><div class="card-bd">
            <div class="row" style="gap:8px;align-items:center"><span class="t-xs dim2 num">${i + 1}</span>${icon(ic)}<b style="font-size:14px">${t}</b></div>
            <p class="dim" style="font-size:12.5px;margin:8px 0 0">${d}</p>
          </div></div>`
          )
          .join('')}
      </div>
      <div class="row mt20">${btn('看我造一个', { k: 'primary', icon: 'sparkle', href: './factory.html' })}</div>`,
  });
}

function v3() {
  return shell({
    page: 'tutorial',
    crumb: [{ t: '教程' }],
    body:
      pageHd({ eyebrow: '手册', title: '教程', desc: '一页讲完。下面六段，读完就能自己造第一张卡。' }) +
      `<div class="col" style="gap:28px;max-width:720px">${[
        ['造一个词', '输入、选条数、按造料。'],
        ['挑一张图', '体检 → 九宫格 → 点一张。'],
        ['听一遍语音', '听到 60% 才能确认。'],
        ['打包', '硬校验，缺什么说什么。'],
        ['导出', '拷完再验一遍。'],
        ['开始练', '五面各给各的。'],
      ]
        .map(
          ([t, d], i) =>
            `<div class="row" style="gap:14px;align-items:flex-start"><span class="t-sm dim2 num" style="width:24px;padding-top:2px">0${i + 1}</span><div><b style="font-size:15px">${t}</b><p class="dim" style="margin:4px 0 0;font-size:13px">${d}</p></div></div>`
        )
        .join('')}</div>`,
  });
}

export const meta = { name: 'tutorial', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 教程' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
