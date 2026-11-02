/* 五面演示页共用的壳：顶部一行、五面切换、卡片、评分条、快捷键条。 */
import { btn, icon, kbd, chip, pageHd, shell } from '../ui.mjs';

export const FACES = [
  ['listen', '听', '声音 → 画面'],
  ['speak', '说', '画面 → 声音'],
  ['read', '读', '句子 → 画面'],
  ['type', '写', '画面 → 拼写'],
  ['vary', '改', '换一个说法'],
];

export const top = (deck = '测试牌组') => `<div class="study-top">
  <a class="iconbtn sm" href="./cards.html" title="回卡组" data-fade>${icon('chevL')}</a>
  <span class="tgt">abandon</span>
  <span class="t-xs dim2">第 3 / 12</span>
  <span class="spacer"></span>
  <span class="t-xs dim2">${deck} · 今天还剩 9 张</span>
  <button class="iconbtn sm" title="选项">${icon('gear')}</button>
  <button class="btn sm ghost">退出</button>
</div>`;

export const facebar = (cur) => `<div class="facebar">${FACES.map(
  ([k, t, d]) =>
    `<button type="button" class="${k === cur ? 'on' : ''}" data-face="${k}">${t}<span>${d}</span></button>`
).join('')}</div>`;

export const ratebar = () =>
  ['重来,1 分钟', '困难,3 天', '良好,8 天,recommend', '简单,15 天']
    .map((s) => {
      const [label, next, cls] = s.split(',');
      return `<button class="rate ${cls || ''}" data-rate="${label}"><b>${label}</b><small>${next}</small></button>`;
    })
    .join('');

export const hintbar = () => `<div class="hintbar">
  <span class="keys"><kbd class="kbd">space</kbd>翻开</span>
  <span class="keys"><kbd class="kbd">1</kbd><kbd class="kbd">4</kbd>评分</span>
  <span class="keys"><kbd class="kbd">←</kbd><kbd class="kbd">→</kbd>换面</span>
  <span class="keys"><kbd class="kbd">J</kbd><kbd class="kbd">K</kbd>换词</span>
  <span class="spacer"></span>
  <span class="t-xs dim2">自动跳下一张 · 开</span>
</div>`;

export function facePage({ page, cur, body, extra = '' }) {
  return shell({
    page,
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '学习' }, { t: FACES.find((f) => f[0] === cur)[1] }],
    body: `<div class="study-wrap" style="display:flex;flex-direction:column;min-height:calc(100vh - 160px)">
      ${top()}
      ${facebar(cur)}
      ${extra}
      <div class="stage-card mt12" style="flex:1;display:flex;flex-direction:column">
        ${body}
        ${sessionBar()}
        <div class="ratebar">${ratebar()}</div>
      </div>
      ${hintbar()}
    </div>`,
  });
}

export const stage = (inner, pad = '') => `<div class="stage-main" style="flex:1;${pad}">${inner}</div>`;

export const sessionBar = (n = 3, total = 12) => `<div class="session-bar">
  <span>第 ${n} / ${total}</span>
  <span class="track"><i style="width:${Math.round((n / total) * 100)}%"></i></span>
  <span>还剩 ${total - n} 张</span>
</div>`;
