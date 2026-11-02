/* 写：给画面和中文，拼出来。逐字符给反馈。 */
import { btn, icon, kbd, chip, badge, photo, audioRow } from '../ui.mjs';
import { facePage, stage } from './_face.mjs';

export const meta = { name: 'type', pick: 1, variants: [1, 2], title: '卡片工厂 · 写' };

const want = 'The crew abandoned ship within minutes.';

function v1() {
  return facePage({
    page: 'type',
    cur: 'type',
    body: `<div class="stage-main" style="flex:1;display:grid;grid-template-columns:300px 1fr;gap:32px;align-items:start">
      ${photo('./assets/photos/p-harbor.jpg', { ratio: 'r4-3', alt: '雾里的港口' })}
      <div>
        <div class="row"><span class="t-xs dim2">写 · 画面 → 拼写</span><span class="spacer"></span>${badge('12 个词', 'accent')}</div>
        <p class="stage-scene" style="margin:14px 0 4px">凌晨四点，货轮在雾里开始进水，船长下了最后一道命令。</p>
        <p class="f-hint" style="margin:0 0 14px">目标词：<b class="mono" style="color:var(--c-accent)">abandoned</b></p>
        <div class="typebox" data-want="${want}" tabindex="0">
          <span class="typed">The crew aband<em class="caret"></em></span>
        </div>
        <div class="row mt12" style="gap:8px">
          ${chip('看首字母')}${chip('听一遍')}${chip('我放弃了 → 看答案')}
          <span class="spacer"></span><span class="keys"><kbd class="kbd">enter</kbd>提交</span>
        </div>
        <div class="mt20">
          <p class="t-xs dim2" style="margin:0 0 8px">原声（拼不出来就听）</p>
          ${audioRow({ dur: 3.4, seed: 11 })}
        </div>
      </div>
    </div>`,
  });
}

function v2() {
  return facePage({
    page: 'type',
    cur: 'type',
    body: stage(
      `<div style="display:flex;flex-direction:column;align-items:center;gap:16px">
        <span class="t-xs dim2">写 · 画面 → 拼写</span>
        <div style="width:min(460px,100%)">${photo('./assets/photos/p-coffee.jpg', { ratio: 'r16-9', alt: '窗台上的咖啡' })}</div>
        <p class="stage-scene" style="text-align:center;max-width:520px">周一上午十点，同事桌上的芝士蛋糕被你拿了一块。</p>
        <div class="typebox" data-want="${want}" style="width:min(560px,100%)" tabindex="0"><span class="typed">I&#39;m afraid I succumbed<em class="caret"></em></span></div>
        <div class="row" style="gap:8px">${chip('看首字母')}${chip('听一遍')}<span class="keys"><kbd class="kbd">enter</kbd></span></div>
      </div>`
    ),
  });
}

export const build = (v) => (v === 2 ? v2() : v1());
