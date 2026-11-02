/* 挖句：把一段现成的文字拆成句子，挑出要练的。 */
import {
  btn,
  icon,
  iconbtn,
  chip,
  badge,
  card,
  photo,
  pageHd,
  shell,
  empty,
  errbox,
  states,
  field,
  dotbar,
} from '../ui.mjs';
import { SENTS } from '../data.mjs';

const picked = new Set(['s0', 's2', 's4']);

const drop = () => `<div class="mine-drop">
  <div class="row" style="gap:8px;align-items:center">${icon('upload')}<b style="font-size:14px">把一段文字粘进来</b><span class="spacer"></span>${chip('从文件读')}</div>
  <textarea class="textarea mt12" rows="7" placeholder="粘一段文章、剧本、播客逐字稿。一句一行也行，整段粘进来也行——分隔符会自己认。">The crew abandoned ship within minutes. He abandoned the plan the moment it got hard. I&#39;m afraid I succumbed to temptation. She succumbed to the flu after a week of overtime.</textarea>
  <div class="row mt12" style="gap:8px"><span class="t-xs dim2">已认出 4 句 · 命中 2 个词</span><span class="spacer"></span>${btn('拆句', { k: 'primary', icon: 'sparkle' })}</div>
</div>`;

const pickRow = (s, i) => `<div class="picked ${picked.has('s' + i) ? 'on' : ''}" data-pick="${i}">
  <span class="ck">${icon('check')}</span>
  <span style="min-width:0;flex:1"><span style="display:block;font-size:13.5px;color:var(--c-ink)">${s.q}</span>
  <span class="t-xs dim2" style="display:block;margin-top:3px">${s.scene.slice(0, 26)}…</span></span>
  <span class="badge accent">${s.w}</span>
</div>`;

function v1() {
  return shell({
    page: 'mine',
    crumb: [{ t: '挖句' }],
    body:
      pageHd({
        eyebrow: '从现成的文字里捡',
        title: '挖句',
        desc: '不造新句子的时候，就把看过的文章拆成句，挑含目标词的留下来。',
        actions: btn('去工厂', { k: 'ghost', href: './factory.html', icon: 'sparkle' }),
      }) +
      `<div class="mine-grid">
        <div class="col" style="gap:16px">${drop()}
          ${card({ hd: '挑出来的句子', sub: '3 句', r: `${chip('全选')}${chip('清空')}`, bd: `${SENTS.slice(0, 6).map(pickRow).join('')}` })}
        </div>
        <div class="rail">
          ${card({ hd: '这一步在做什么', bd: `<p class="dim" style="font-size:12.5px;margin:0">粘进来的文字先按句末标点拆开，再和「要练的词」对一遍。含词的留下，一个词都不含的进废句。</p>` })}
          ${card({ hd: '选中的', bd: `<div class="row" style="justify-content:space-between"><span class="t-sm dim">已勾</span><span class="num" id="picked-n">3</span></div>
            <div class="bar mt8"><i style="width:42%"></i></div>
            <p class="f-hint mt8">勾够 4 句就可以造。</p>${btn('造这 3 句', { k: 'primary', block: true, icon: 'sparkle' })}` })}
        </div>
      </div>`,
  });
}

function v2() {
  return shell({
    page: 'mine',
    crumb: [{ t: '挖句' }],
    body:
      pageHd({ eyebrow: '从现成的文字里捡', title: '挖句', desc: '粘一段，勾几句，造。' }) +
      `<div style="max-width:780px">${drop()}</div>
      <div class="sect">
        <div class="sect-hd"><h2>结果</h2><span class="r"><span class="t-xs dim2">4 句里 2 句含目标词</span></span></div>
        <div class="g g2">${SENTS.slice(0, 4)
          .map(
            (s, i) => `<div class="picked ${picked.has('s' + i) ? 'on' : ''}" data-pick="${i}" style="align-items:flex-start">
            <span class="ck">${icon('check')}</span>
            <span style="min-width:0;flex:1"><span style="display:block;font-size:13.5px">${s.q}</span><span class="t-xs dim2">${s.zh}</span></span>
          </div>`
          )
          .join('')}</div>
      </div>`,
  });
}

function v3() {
  return shell({
    page: 'mine',
    crumb: [{ t: '挖句' }],
    body:
      pageHd({ eyebrow: '批量', title: '挖句', desc: '一行一句最省事：粘进去、勾出来、一次造完。', actions: btn('造这 3 句', { k: 'primary', icon: 'sparkle' }) }) +
      states({
        normal: `<div class="g g-3-1">
          <div class="col" style="gap:16px">${drop()}${card({ hd: '废句', sub: '1 句没含任何目标词', bd: `<div class="dim" style="font-size:12.5px;line-height:1.7">I&#39;m afraid I succumbed to temptation.<span class="t-xs dim2">（含 succumb，但没被勾）</span></div>` })}</div>
          <div class="rail">${card({ hd: '待造', sub: '3 句', bd: SENTS.slice(0, 3).map((s) => `<div class="row" style="gap:8px;padding:8px 0;border-top:1px solid var(--c-line)"><span class="dot on"></span><span class="t-sm" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.q}</span></div>`).join('') })}</div>
        </div>`,
        empty: empty({ icon: 'pen', title: '还没有粘任何东西', desc: '上面那个框里粘一段文字，或者拖一个 .txt 进来。' }),
        error: errbox({ title: '拆句失败', desc: '这段文字里一句都认不出来。可能是纯列表或没有标点。', code: 'no sentence boundary found in 1 842 chars' }),
      }),
  });
}

export const meta = { name: 'mine', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 挖句' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
