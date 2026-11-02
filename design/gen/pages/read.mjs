/* 读：给句子，先想画面；翻开才给图和中文。 */
import { btn, icon, kbd, chip, badge, photo } from '../ui.mjs';
import { facePage, stage } from './_face.mjs';

export const meta = { name: 'read', pick: 1, variants: [1, 2], title: '卡片工厂 · 读' };

function v1() {
  return facePage({
    page: 'read',
    cur: 'read',
    body: stage(
      `<div class="row"><span class="t-xs dim2">读 · 句子 → 画面</span><span class="spacer"></span><span class="chip">离开、丢下（人或地方）</span></div>
      <p class="stage-q">The crew <b>abandoned</b> ship within minutes.</p>
      <p class="stage-scene">先在心里把这句话变成一个具体的画面：几点、在哪、谁在下命令。<br>想好了再翻，翻开之后才看图和中文。</p>
      <div class="row">
        ${btn('翻开', { k: 'primary', lg: true, icon: 'eye' })}
        ${btn('这句跳过', { k: 'quiet' })}
        <span class="spacer"></span><span class="keys"><kbd class="kbd">space</kbd></span>
      </div>`
    ),
  });
}

function v2() {
  return facePage({
    page: 'read',
    cur: 'read',
    body: `<div class="stage-main" style="flex:1;display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:center">
      <div>
        <div class="row"><span class="t-xs dim2">读 · 句子 → 画面</span></div>
        <p class="stage-q" style="font-size:32px;margin-top:14px">The crew <b>abandoned</b> ship within minutes.</p>
        <p class="stage-scene">先想画面，再看图。</p>
        <div class="row mt12">${btn('翻开', { k: 'primary', lg: true, icon: 'eye' })}<span class="keys"><kbd class="kbd">space</kbd></span></div>
      </div>
      <div style="filter:blur(18px);opacity:.4;border-radius:14px;overflow:hidden">
        ${photo('./assets/photos/p-harbor.jpg', { ratio: 'r4-3', alt: '还没翻开' })}
      </div>
    </div>`,
  });
}

export const build = (v) => (v === 2 ? v2() : v1());
