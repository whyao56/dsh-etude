/* 句库：所有句子摊开，按状态筛。三版：表 / 卡 / 左筛选。 */
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
  states,
  empty,
  skeletonCard,
  errbox,
  select,
  field,
  dotbar,
} from '../ui.mjs';
import { SENTS } from '../data.mjs';

export const status = (s) => {
  const miss = [];
  if (!s.imgOk) miss.push('图');
  if (!s.audioOk) miss.push('声');
  if (!s.heard) miss.push('听');
  if (!s.imgOk || !s.audioOk || !s.heard) return `<span class="badge warn">缺${miss.join('·')}</span>`;
  return `<span class="badge ok"><span class="dot ok"></span>齐了</span>`;
};
const hl = (s) => s.q.replace(new RegExp('\\b' + s.w + '\\b', 'i'), (m) => `<b>${m}</b>`);

const filters = (cur = 'all') =>
  `<div class="filterbar">
    ${chip('全部 338', { on: cur === 'all' })}
    ${chip('缺图 3')}
    ${chip('缺声 1')}
    ${chip('没复核 2')}
    ${chip('要改 0')}
    <span class="spacer"></span>
    ${select([{ v: 'recent', t: '最近练过' }, { v: 'due', t: '最欠的在前' }, { v: 'new', t: '最新' }], 'recent', '排序')}
  </div>`;

const row = (s) => `<a class="srow" href="./detail.html" data-fade>
  <span class="th">${photo('./assets/photos/' + s.img + '.jpg', { ratio: 'r4-3', alt: '' })}</span>
  <span class="q">${hl(s)}</span>
  <span style="font-size:12px;color:var(--c-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.scene.slice(0, 14)}…</span>
  <span>${status(s)}</span>
  <span style="text-align:right;font-size:11.5px;color:var(--c-ink-3)">${s.ord <= 4 ? '现在' : s.ord + ' 天'}</span>
</a>`;

function v1() {
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库' }],
    body:
      pageHd({
        eyebrow: '全部句子',
        title: '句库',
        desc: '338 句来自 7 个词、5 个牌组。点任意一行看这一句的四份素材。',
        actions: `${btn('批量造', { k: 'ghost', icon: 'sparkle' })}${btn('导入', { k: 'ghost', icon: 'upload' })}`,
      }) +
      states({
        normal: filters() + `<div class="card" style="padding:4px 8px">${SENTS.map(row).join('')}</div>
          <div class="row mt16"><span class="t-xs dim2">显示 12 / 338</span><span class="spacer"></span>${btn('再加载 24 句', { k: 'ghost', cls: 'sm' })}</div>`,
        loading: `<div class="g g2">${skeletonCard(90)}${skeletonCard(90)}${skeletonCard(90)}${skeletonCard(90)}</div>`,
        empty: empty({
          icon: 'grid',
          title: '句库里还没有句子',
          desc: '造卡时会一次生成 8 条不同场景的句子。先去工厂造一个词。',
          action: btn('去工厂', { k: 'primary', href: './factory.html', icon: 'sparkle' }),
        }),
        error: errbox({
          title: '读不出句子',
          desc: 'factory/library.json 打不开。可能是数据目录被移动了。',
          code: 'ENOENT: %LOCALAPPDATA%\\dsh-etude\\factory\\library.json',
          action: btn('打开设置', { k: 'ghost', href: './settings.html#data', icon: 'folder' }),
        }),
      }),
  });
}

function v2() {
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库' }],
    body:
      pageHd({
        eyebrow: '全部句子',
        title: '句库',
        desc: '一屏能扫过十几句。图先出，句子后看。',
        actions: btn('导入', { k: 'ghost', icon: 'upload' }),
      }) +
      filters() +
      `<div class="cgrid">
        ${SENTS.slice(0, 9)
          .map(
            (s) => `<a class="ccard" href="./detail.html" data-fade>
          ${photo('./assets/photos/' + s.img + '.jpg', { ratio: 'r4-3', alt: s.q, cap: s.w })}
          <div class="ccard-bd">
            <p class="ccard-q">${hl(s)}</p>
            <div class="ccard-meta">${status(s)}<span class="spacer"></span><span>${s.reg}</span></div>
          </div>
        </a>`
          )
          .join('')}
      </div>
      <div class="row mt16"><span class="t-xs dim2">显示 9 / 338</span><span class="spacer"></span>${btn('再加载', { k: 'ghost', cls: 'sm' })}</div>`,
  });
}

function v3() {
  const group = (title, items) =>
    card({
      hd: title,
      pad: 'tight',
      bd: `<div class="wordlist">${items
        .map((w) => `<a class="wrow" href="./detail.html" data-fade><span>${w.n}</span><span class="cnt">${w.c}</span></a>`)
        .join('')}</div>`,
    });
  return shell({
    page: 'library',
    crumb: [{ t: '卡组', href: './cards.html' }, { t: '句库' }],
    body: `<div class="g g-2-1">
      <div class="rail" style="position:sticky;top:20px">
        ${group('按词', [
          { n: 'abandon', c: 3 },
          { n: 'succumb', c: 2 },
          { n: 'indispensable', c: 2 },
          { n: 'ambiguous', c: 2 },
          { n: 'deteriorate', c: 2 },
          { n: 'meticulous', c: 1 },
          { n: 'plausible', c: 1 },
        ])}
        ${card({
          hd: '只差一步',
          bd: `${[
            { k: '缺图', v: 3, c: 'warn' },
            { k: '缺声', v: 1, c: 'warn' },
            { k: '没试听', v: 2, c: 'warn' },
            { k: '全齐', v: 7, c: 'ok' },
          ]
            .map(
              (r) =>
                `<div class="kv"><span class="k"><span class="dot ${r.c}"></span>${r.k}</span><span class="v">${r.v} 句</span></div>`
            )
            .join('')}`,
        })}
      </div>
      <div>
        ${pageHd({
          eyebrow: '全部句子',
          title: '句库',
          desc: '左边挑一个词，右边只剩它的句子。',
          actions: btn('批量造', { k: 'primary', icon: 'sparkle' }),
        })}
        <div class="filterbar">${chip('全部', { on: true })}${chip('缺图 3')}${chip('缺声 1')}<span class="spacer"></span>${iconbtn('filter', '筛选')}</div>
        <div class="sent-list">${SENTS.map(row).join('')}</div>
      </div>
    </div>`,
  });
}

export const meta = { name: 'library', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 句库' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
