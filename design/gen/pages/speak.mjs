/* 说：给画面，自己讲出来。录音、回放、和原声比。 */
import { btn, icon, kbd, chip, badge, photo, audioRow } from '../ui.mjs';
import { facePage, stage } from './_face.mjs';

export const meta = { name: 'speak', pick: 1, variants: [1, 2], title: '卡片工厂 · 说' };

const rec = (state = 'off') => `<div class="row" style="gap:12px;align-items:center">
  <button class="rec-btn ${state === 'on' ? 'on' : ''}">${icon(state === 'on' ? 'pause2' : 'mic')}</button>
  <div><div class="t-sm">${state === 'on' ? '正在录 · 0:04' : '按住说话'}</div><div class="t-xs dim2">最多 30 秒 · 只存在本机</div></div>
</div>`;

function v1() {
  return facePage({
    page: 'speak',
    cur: 'speak',
    body: `<div class="stage-main" style="flex:1;display:grid;grid-template-columns:320px 1fr;gap:32px;align-items:start">
      ${photo('./assets/photos/p-office.jpg', { ratio: 'r4-3', alt: '黄昏的办公室' })}
      <div>
        <div class="row"><span class="t-xs dim2">说 · 画面 → 声音</span><span class="spacer"></span>${badge('第 3 条', 'accent')}</div>
        <p class="stage-scene" style="margin:14px 0 18px">看着这张图，用一句英文说出来：谁走了、什么时候走的、为什么。<br>说不出来就按「看提示」，只给前三个词。</p>
        ${rec('off')}
        <div class="mt20">
          <p class="t-xs dim2" style="margin:0 0 8px">原声</p>
          ${audioRow({ dur: 3.4, seed: 7 })}
        </div>
        <div class="row mt12">${btn('看提示', { k: 'ghost', icon: 'eye' })}${btn('说完了，评分', { k: 'primary' })}</div>
      </div>
    </div>`,
  });
}

function v2() {
  return facePage({
    page: 'speak',
    cur: 'speak',
    body: stage(
      `<div style="display:flex;flex-direction:column;align-items:center;gap:20px">
        <span class="t-xs dim2">说 · 画面 → 声音</span>
        <div style="width:min(520px,100%)">${photo('./assets/photos/p-dinner.jpg', { ratio: 'r4-3', alt: '晚饭的桌子' })}</div>
        <p class="stage-scene" style="text-align:center;max-width:460px">看着图说一句。说给自己听也行，按下去就录。</p>
        ${rec('on')}
        <div class="row" style="gap:8px">${btn('回放', { k: 'ghost', icon: 'play' })}${btn('说完了', { k: 'primary' })}</div>
      </div>`
    ),
  });
}

export const build = (v) => (v === 2 ? v2() : v1());
