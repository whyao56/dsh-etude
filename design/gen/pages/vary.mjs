/* 改：换一个说法。同一件事，换主语、换语气、换轻重。 */
import { btn, icon, kbd, chip, badge, card } from '../ui.mjs';
import { facePage, stage } from './_face.mjs';

export const meta = { name: 'vary', pick: 1, variants: [1, 2], title: '卡片工厂 · 改' };

const refs = [
  ['口语', 'The whole crew just walked off the ship.'],
  ['书面', 'The crew evacuated the vessel shortly after.'],
  ['更重', 'The crew gave up the ship in a matter of minutes.'],
];

function v1() {
  return facePage({
    page: 'vary',
    cur: 'vary',
    body: `<div class="stage-main" style="flex:1">
      <div class="row"><span class="t-xs dim2">改 · 换一个说法</span><span class="spacer"></span>${badge('3 种写法', 'accent')}</div>
      <p class="stage-q" style="font-size:26px;margin:16px 0 6px">The crew <b>abandoned</b> ship within minutes.</p>
      <p class="stage-scene" style="margin:0 0 16px">把它换成你平时会说的话。主语可以换、语气可以换，但同一件事不许变。</p>
      <textarea class="textarea" rows="2" placeholder="用你自己的说法写一遍…">The crew got off the ship in a couple of minutes.</textarea>
      <div class="row mt12" style="gap:8px">${chip('换主语')}${chip('改口语')}${chip('说得更重')}<span class="spacer"></span>${btn('看看别人的写法', { k: 'ghost', icon: 'eye' })}</div>
      <div class="g g3 mt20">
        ${refs
          .map(
            ([t, s]) => `<div class="card"><div class="card-bd"><span class="t-xs dim2">${t}</span><p class="serif" style="font-size:14px;margin:6px 0 0">${s}</p></div></div>`
          )
          .join('')}
      </div>
    </div>`,
  });
}

function v2() {
  return facePage({
    page: 'vary',
    cur: 'vary',
    body: stage(
      `<div class="row"><span class="t-xs dim2">改 · 换一个说法</span><span class="spacer"></span><span class="chip">目标词必须还在</span></div>
      <p class="stage-q" style="font-size:28px;margin:16px 0 18px">The crew <b>abandoned</b> ship within minutes.</p>
      <div class="card" style="background:var(--c-inset);border-color:var(--c-line-2)">
        <div class="card-bd">
          <textarea class="textarea" rows="2" style="border:0;background:transparent;padding:0">The crew got off the ship in a couple of minutes.</textarea>
          <div class="row mt12"><span class="t-xs dim2">27 词 · 用了目标词</span><span class="spacer"></span>${chip('提交')}</div>
        </div>
      </div>
      <div class="mt24">
        <button class="btn ghost" data-open="#refs">看三种别人的写法 ${icon('chevD')}</button>
        <div id="refs" class="col mt12" style="gap:10px">
          ${refs.map(([t, s]) => `<div class="row" style="gap:12px;align-items:baseline"><span class="t-xs dim2" style="width:32px">${t}</span><span class="serif" style="font-size:14.5px">${s}</span></div>`).join('')}
        </div>
      </div>`
    ),
  });
}

export const build = (v) => (v === 2 ? v2() : v1());
