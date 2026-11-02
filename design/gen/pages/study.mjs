/* 学习：一屏一张。五个面是五种练法，不是五块内容。 */
import {
  btn,
  iconbtn,
  icon,
  chip,
  badge,
  photo,
  card,
  pageHd,
  shell,
  audioRow,
  wave,
  keys,
  kbd,
} from '../ui.mjs';
import { SENTS } from '../data.mjs';

const S = SENTS[0];

const FACES = [
  { k: '听', d: '声音 → 画面', on: true },
  { k: '说', d: '画面 → 声音', on: true },
  { k: '读', d: '句子 → 画面', on: true },
  { k: '写', d: '画面 → 拼写' },
  { k: '改', d: '换一个说法' },
];

const facebar = (cur) => `<div class="facebar">
  ${FACES.map(
    (f) => `<button type="button" class="${f.k === cur ? 'on' : ''}">${f.k}<span>${
      f.on ? (f.k === cur ? '正在练' : '练过') : '没开始'
    }</span></button>`
  ).join('')}
</div>`;

const ratebar = () => `<div class="ratebar">
  <button class="rate" type="button">重来<small>1 分钟</small></button>
  <button class="rate" type="button">困难<small>3 天</small></button>
  <button class="rate recommend" type="button">良好<small>8 天</small></button>
  <button class="rate" type="button">简单<small>15 天</small></button>
</div>`;

const hintbar = () =>
  `<div class="hintbar">
    <span><kbd class="kbd">space</kbd> 翻开</span>
    <span><kbd class="kbd">1</kbd>–<kbd class="kbd">4</kbd> 评分</span>
    <span><kbd class="kbd">←</kbd><kbd class="kbd">→</kbd> 换面</span>
    <span><kbd class="kbd">J</kbd><kbd class="kbd">K</kbd> 换词</span>
    <span class="sp">  </span>
    <span>自动跳下一张 · 开</span>
  </div>`;

const top = () =>
  `<div class="study-top">
    <a class="btn quiet sm" href="./cards.html" data-fade>${icon('chevL')}卡组</a>
    <span class="tgt">abandon</span>
    <span class="badge">第 3 / 12</span>
    <span class="spacer"></span>
    <span class="t-xs dim2">测试牌组 · 今天还剩 9 张</span>
    ${iconbtn('gear', '这一张的设置')}
    ${btn('退出', { k: 'ghost', cls: 'sm' })}
  </div>`;

function v1() {
  return shell({
    page: 'study',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '学习' }],
    body: `<div class="study-wrap" style="display:flex;flex-direction:column;min-height:calc(100vh - 160px)">
      ${top()}
      ${facebar('读')}
      <div class="stage-card mt12" style="flex:1;display:flex;flex-direction:column">
        <div class="stage-main" style="flex:1;justify-content:center">
          <div class="row"><span class="t-xs dim2">读 · 句子 → 画面</span><span class="spacer"></span><span class="chip">${S.sense}</span></div>
          <p class="stage-q" style="font-size:34px">The crew <b>abandoned</b> ship within minutes.</p>
          <p class="stage-scene" style="font-size:14px">先在心里把这句话变成一个具体的画面：几点、在哪、谁在下命令。<br>想好了再翻，翻开之后才看图和中文。</p>
          <div class="row mt8">
            ${btn('翻开', { k: 'primary', lg: true, icon: 'eye' })}
            ${btn('这句跳过', { k: 'quiet' })}
            <span class="spacer"></span>
            <span class="keys"><kbd class="kbd">space</kbd></span>
          </div>
        </div>
        <div class="session-bar"><span>第 3 / 12</span><span class="track"><i style="width:25%"></i></span><span>还剩 9 张</span></div>
        ${ratebar()}
      </div>
      ${hintbar()}
    </div>`,
  });
}

function v2() {
  return shell({
    page: 'study',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '学习' }],
    body: `<div class="study-wrap">
      ${top()}
      ${facebar('读')}
      <div class="stage-card mt12">
        <div class="g g2" style="gap:0;align-items:stretch">
          <div style="padding:20px">
            ${photo('./assets/photos/' + S.img + '.jpg', { ratio: 'r4-3', alt: '雾里的港口', cap: '凌晨四点 · 货轮开始进水' })}
          </div>
          <div class="col" style="padding:20px 20px 20px 4px;justify-content:center;gap:12px">
            <p class="stage-q" style="font-size:24px">The crew <b>abandoned</b> ship within minutes.</p>
            <p class="stage-scene">${S.scene}</p>
            <div class="row">${chip('中文', { on: true })}${chip('英释')}${chip('再放一遍')}</div>
            <p class="t-sm dim">船员几分钟内就弃船了。</p>
          </div>
        </div>
        ${ratebar()}
      </div>
      ${hintbar()}
    </div>`,
  });
}

function v3() {
  return shell({
    page: 'study',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '学习' }],
    body: `<div class="g g-1-3" style="gap:24px">
      <div class="rail" style="top:72px">
        ${card({ hd: '牌组', pad: 'tight', bd: `<div class="wordlist">
          ${SENTS.slice(0, 6).map((s, i) => `<a class="wrow ${i === 2 ? 'on' : ''}" href="#" data-fade><span>${s.w}</span><span class="cnt">${i + 1}/12</span></a>`).join('')}
        </div>` })}
        ${card({ hd: '这张卡', bd: `<div class="col" style="gap:8px"><span class="t-sm dim">第 3 张 · 12 张里</span><div class="bar"><i style="width:25%"></i></div><span class="t-xs dim2">今天已练 42 次 · 11 分钟</span></div>` })}
      </div>
      <div>
        ${facebar('听')}
        <div class="stage-card mt12">
          <div class="stage-main" style="align-items:center;text-align:center;min-height:340px">
            <span class="t-xs dim2">听 · 声音 → 画面</span>
            <div class="mt12" style="width:100%;max-width:420px">${wave(7, 56, 'tall')}</div>
            <div class="row"><button class="play-btn" style="width:44px;height:44px" aria-label="再放一遍">${icon('play')}</button>
              <span class="t-sm dim2">3.4 秒 · Ava</span></div>
            <p class="t-sm dim2">只放声音。听完先想画面，再翻开对。</p>
            <div class="row">${btn('翻开', { k: 'primary', lg: true })}${btn('再放一遍', { k: 'ghost' })}</div>
          </div>
          ${ratebar()}
        </div>
        ${hintbar()}
      </div>
    </div>`,
  });
}

export const meta = { name: 'study', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 学习' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
