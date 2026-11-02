/* 句子详情：这一句的四份素材、两种中文说法、练习记录。 */
import {
  btn,
  iconbtn,
  icon,
  chip,
  badge,
  photo,
  card,
  kv,
  pageHd,
  shell,
  audioRow,
  empty,
  errbox,
  dotbar,
} from '../ui.mjs';
import { SENTS } from '../data.mjs';

const S = SENTS[0];

const metaRow = (s) => `<div class="meta">
  <span class="mono" style="color:var(--c-ink-2)">${s.w}</span>
  <span class="dot"></span><span>${s.sense}</span>
  <span class="dot"></span><span>${s.reg}</span>
  <span class="dot"></span><span>${s.dur}s · Ava</span>
  <span class="sp"></span><span>${s.tags.join(' · ')}</span>
</div>`;

const qBlock = (s) => `<p class="dt-q">The crew <b>${s.w}</b>ed ship within minutes.</p>
  <p class="stage-scene" style="margin-top:10px">${s.scene}</p>`;

const zhCard = () =>
  card({
    hd: '两种中文说法',
    sub: '彼此不一致才有用',
    bd: `<div class="col" style="gap:10px">
      <div class="row"><span class="badge">直译</span><span style="font-size:13px">船员几分钟内就弃船了。</span></div>
      <div class="row"><span class="badge">口语</span><span style="font-size:13px">船员们几分钟之内就全跑了。</span></div>
      <p class="f-hint">两句话说的是同一件事，但语气不一样。看中文时先猜是哪一句。</p>
    </div>`,
  });

const assetsCard = () =>
  card({
    hd: '四份素材',
    sub: '缺一样都不算做完',
    r: `<span class="badge ok"><span class="dot ok"></span>齐了</span>`,
    pad: 'flush',
    bd: `<div style="padding:4px 16px 12px">
      ${[
        { i: 'image', k: '图', v: 'harbor-dock-3f9a2c.jpg · 1200×900', d: '9 张候选里挑的', ok: true },
        { i: 'sound', k: '声', v: 'edge-3f9a2c41e0.mp3 · 3.4 秒', d: 'Ava · 语速 +10%', ok: true },
        { i: 'text', k: '句', v: 'The crew abandoned ship within minutes.', d: '12 个词 · 含目标词', ok: true },
        { i: 'layers', k: '景', v: '凌晨四点 · 货轮进水 · 船长下令', d: '谁在说、在哪、说完会怎样', ok: true },
      ]
        .map(
          (r) => `<div class="face-row"><span class="face-btn done">${icon(r.i)}</span>
          <span class="face-lbl">${r.k}<small>${r.d}</small></span>
          <span class="face-state mono" style="color:var(--c-ink-2);font-size:12px;max-width:44%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.v}</span>
          ${iconbtn('more', r.k + ' 的操作')}</div>`
        )
        .join('')}
    </div>`,
    ft: `${icon('info')}<span>改任何一样都会让这句退回「没做完」，要重新确认。</span>`,
  });

const historyCard = () =>
  card({
    hd: '练习记录',
    sub: '这句练过 6 次',
    bd: `${kv([
      { k: '听', v: '3 次' },
      { k: '读', v: '2 次' },
      { k: '写', v: '1 次' },
      { k: '下次', v: '8 天后' },
      { k: '简易度', v: '2.62' },
    ])}
    <div class="row mt12"><span class="t-xs dim2">五面进度</span><span class="spacer"></span>${dotbar(5, 3, 0)}</div>`,
  });

const actionCard = () =>
  card({
    bd: `${btn('练这一句', { k: 'primary', block: true, icon: 'play' })}
    <div class="mt8">${btn('回工厂改这一句', { k: 'ghost', block: true, icon: 'sparkle', href: './factory.html' })}</div>
    <div class="rule tight"></div>
    <div class="col" style="gap:2px">
      <button class="menu-pop-i btn quiet" style="justify-content:flex-start;width:100%">${icon('image')}换一张图</button>
      <button class="menu-pop-i btn quiet" style="justify-content:flex-start;width:100%">${icon('sound')}重做语音</button>
      <button class="menu-pop-i btn quiet" style="justify-content:flex-start;width:100%">${icon('copy')}复制句子</button>
    </div>
    <p class="f-hint mt8">换图会退回「没做完」，旧图留在候选池里。</p>`,
  });

function v1() {
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库', href: './library.html' }, { t: S.w }],
    body:
      `<div class="dt-hero">
        ${photo('./assets/photos/' + S.img + '.jpg', {
          ratio: 'r4-3',
          alt: S.q,
          act: iconbtn('refresh', '换一张') + iconbtn('eye', '看大图'),
        })}
        <div class="col" style="gap:14px;min-width:0">
          ${metaRow(S)}
          ${qBlock(S)}
          ${audioRow({ dur: S.dur, seed: 9, bars: 44, r: `<span class="badge ok"><span class="dot ok"></span>已试听</span>${iconbtn('refresh', '重做语音')}` })}
          <div class="row mt4">
            ${btn('练这一句', { k: 'primary', icon: 'play' })}
            ${btn('回工厂改', { k: 'ghost', icon: 'sparkle' })}
            <span class="spacer"></span>
            <span class="keys"><kbd class="kbd">space</kbd> 播放</span>
          </div>
        </div>
      </div>
      <div class="g g-3-1 mt24">
        <div class="col" style="gap:16px">${assetsCard()}${zhCard()}</div>
        <div class="rail">${historyCard()}${actionCard()}</div>
      </div>`,
  });
}

function v2() {
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库', href: './library.html' }, { t: S.w }],
    body: `${pageHd({
      eyebrow: 'abandon · 义项 1',
      title: '丢掉、离开一个人或地方',
      desc: '这一句的场景是弃船：不是「放弃计划」，是物理意义上的离开。',
      actions: btn('练这一句', { k: 'primary', icon: 'play' }),
    })}
    <div class="photo r16-9" style="max-height:360px">
      <img src="./assets/photos/${S.img}.jpg" alt="${S.q}">
      <span class="ph-veil"></span>
      <span class="ph-cap" style="left:20px;right:20px;bottom:16px">
        <span class="dt-q" style="font-size:22px;color:#f2f4f8">${S.q}</span>
      </span>
    </div>
    <div class="g g2 mt24">
      <div class="col" style="gap:16px">
        ${card({ hd: '场景', bd: `<p class="t-body dim">${S.scene}</p>` })}
        ${zhCard()}
      </div>
      <div class="col" style="gap:16px">
        ${card({ hd: '声音', r: `<span class="badge ok">已试听</span>`, bd: audioRow({ dur: S.dur, seed: 9, bars: 52 }) })}
        ${historyCard()}
      </div>
    </div>`,
  });
}

function v3() {
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库', href: './library.html' }, { t: S.w }],
    body: `<div class="g g-1-3">
      <div class="col" style="gap:16px">
        ${photo('./assets/photos/' + S.img + '.jpg', { ratio: 'r4-3', alt: S.q })}
        ${card({
          hd: '这一句',
          pad: 'tight',
          bd: kv([
            { k: '词', v: 'abandon' },
            { k: '读音', v: '/əˈbændən/' },
            { k: '义项', v: '1 / 2' },
            { k: '语域', v: '书面' },
            { k: '来源', v: '影视对白' },
            { k: '字数', v: '12' },
          ]),
        })}
      </div>
      <div class="col" style="gap:16px">
        ${qBlock(S)}
        ${audioRow({ dur: S.dur, seed: 9, bars: 60, r: `<span class="badge ok">已试听</span>` })}
        <div class="rule tight"></div>
        ${assetsCard()}
        ${zhCard()}
        <div class="row">${btn('练这一句', { k: 'primary', icon: 'play' })}${btn('回工厂', { k: 'ghost', href: './factory.html' })}</div>
      </div>
    </div>`,
  });
}

export const meta = { name: 'detail', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 这一句' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
