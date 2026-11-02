/* 统计：只看四件事——今天练了多少、接下来欠多少、记得住吗、卡在哪。 */
import {
  btn,
  iconbtn,
  icon,
  chip,
  badge,
  card,
  kv,
  pageHd,
  shell,
  states,
  empty,
  errbox,
  barChart,
  stackChart,
  lineChart,
  heat,
  heatLegend,
  donut,
  select,
  seg,
  skeletonCard,
} from '../ui.mjs';
import { TODAY, FORECAST, RETENTION, EASE, HEAT, CARD_STATE } from '../data.mjs';

const kpi = (k, v, s, d, ic) =>
  `<div class="kpi"><span class="k">${ic ? icon(ic) : ''}${k}</span><span class="v">${v}${s ? `<small>${s}</small>` : ''}</span>${d ? `<span class="d">${d}</span>` : ''}</div>`;

const hourChart = () => card({
  hd: '今天',
  sub: `${TODAY.reviews} 次 · ${TODAY.minutes} 分钟 · ${TODAY.from} → ${TODAY.to}`,
  r: `${chip('按小时', { on: true })}${chip('按牌组')}`,
  bd: barChart({
    data: TODAY.hours,
    h: 170,
    labels: ['0', '', '', '3', '', '', '6', '', '', '9', '', '', '12', '', '', '15', '', '', '18', '', '', '21', '', ''],
    tip: (v, i) => `${i}:00 · ${v} 次`,
  }) + `<p class="f-hint mt12">晚上 20–22 点是唯一认真的时段：早上只有零星几下，白天基本不来。</p>`,
});

const forecastChart = () => card({
  hd: '接下来 30 天',
  sub: '每天要还多少',
  r: `${seg(['积压', '每日上限'], '积压')}`,
  bd: stackChart({
    rows: FORECAST.map((f) => [f.neu, f.learn, f.due]),
    h: 190,
    labels: FORECAST.map((f, i) => (i % 3 === 0 ? String(f.day) : '')),
    tip: (r, i) => `第 ${i + 1} 天 · 新 ${r[0]} / 学 ${r[1]} / 到期 ${r[2]}`,
  }) + `<div class="row mt12" style="gap:16px;font-size:11.5px;color:var(--c-ink-3)">
      ${['新卡', '学习中', '到期'].map((t, i) => `<span class="row" style="gap:5px"><i style="width:9px;height:9px;border-radius:2px;background:var(--c-accent);opacity:${[1, 0.62, 0.38][i]}"></i>${t}</span>`).join('')}
      <span class="spacer"></span><span>总共 300 张 · 平均 1 天 10 张</span>
    </div>`,
});

const retentionChart = () => card({
  hd: '记忆保留度',
  sub: '真实比例，不是估计',
  r: `<span class="badge ok">92%</span>`,
  bd: lineChart({ data: RETENTION, h: 160, labels: ['30 天前', '', '', '', '20 天前', '', '', '', '10 天前', '', '', '', '今天'] }) +
    `<p class="f-hint mt12">掉到 85% 以下就该少加新卡了。现在还在往上走。</p>`,
});

const easeChart = () => card({
  hd: '卡片简易度',
  sub: '越高越容易',
  bd: barChart({
    data: EASE.map((e) => e.n),
    h: 130,
    labels: EASE.map((e) => e.v),
    tip: (v, i) => `简易度 ${EASE[i].v} · ${v} 张`,
  }),
});

const donutCard = () => card({
  hd: '卡片分布',
  sub: '240 张',
  bd: `<div class="donut-c">${donut({ parts: CARD_STATE, size: 128 })}
    <div class="donut-l" style="flex:1">
      ${CARD_STATE.map((p) => `<span class="li"><i style="width:9px;height:9px;border-radius:2px;background:${p.c}"></i>${p.t}<span class="v">${p.v}</span></span>`).join('')}
    </div></div>`,
});

const heatCard = () =>
  card({ hd: '复习量', sub: '最近 26 周', r: heatLegend(), bd: heat(HEAT), pad: '' });

function v1() {
  return shell({
    page: 'stats',
    crumb: [{ t: '统计' }],
    body:
      pageHd({
        eyebrow: '全部牌组 · 近 30 天',
        title: '统计',
        desc: '四个数字够用：今天练了多少、接下来欠多少、记得住吗、卡在哪。',
        actions: `${select([{ v: 'all', t: '全部牌组' }, { v: 'd1', t: '测试牌组' }], 'all', '牌组')}${btn('导出 PDF', { k: 'ghost', icon: 'download' })}`,
      }) +
      states({
        normal: `<div class="g g4">
          ${kpi('今天复习', TODAY.reviews, '次', `${icon('flame')}连续 ${TODAY.streak} 天`, 'clock')}
          ${kpi('到期', TODAY.due, '张', '比昨天多 3 张', 'layers')}
          ${kpi('保留度', '92', '%', '近 30 天真实比例', 'target')}
          ${kpi('平均用时', '16', '秒', '每张', 'bolt')}
        </div>
        <div class="g g-3-1 mt16">
          <div class="col" style="gap:16px">${hourChart()}${forecastChart()}${retentionChart()}</div>
          <div class="rail">${donutCard()}${easeChart()}</div>
        </div>
        <div class="sect">${heatCard()}</div>`,
        loading: `<div class="g g4">${skeletonCard(70)}${skeletonCard(70)}${skeletonCard(70)}${skeletonCard(70)}</div><div class="sect">${skeletonCard(220)}</div>`,
        empty: empty({
          icon: 'chart',
          title: '还没有可以统计的东西',
          desc: '练过一张卡之后，这里才会有数字。现在去练第一张。',
          action: btn('练 12 张', { k: 'primary', href: './study.html', icon: 'play' }),
        }),
        error: errbox({
          title: '统计读不出来',
          desc: '这一页的数字是从练习记录里现算的。记录文件损坏时会走到这里。',
          code: 'SyntaxError: Unexpected token } in JSON at position 2841 (factory/review.json)',
          action: btn('打开数据目录', { k: 'ghost', icon: 'folder' }),
        }),
      }),
  });
}

function v2() {
  return shell({
    page: 'stats',
    crumb: [{ t: '统计' }],
    body:
      pageHd({ eyebrow: '近 30 天', title: '统计', desc: '一列往下读：今天 → 未来 → 记忆。', actions: btn('导出 PDF', { k: 'ghost', icon: 'download' }) }) +
      `<div class="g g4">${kpi('今天', TODAY.reviews, '次')}${kpi('到期', TODAY.due + ' 张')}${kpi('保留度', '92%')}${kpi('连续', TODAY.streak + ' 天')}</div>
      <div class="col mt16" style="gap:16px">${hourChart()}${forecastChart()}
        <div class="g g2">${retentionChart()}${easeChart()}</div>
        ${heatCard()}
      </div>`,
  });
}

function v3() {
  return shell({
    page: 'stats',
    crumb: [{ t: '统计' }],
    body:
      pageHd({ eyebrow: '全部牌组', title: '统计', desc: '左边是结论，右边是证据。', actions: btn('导出 PDF', { k: 'ghost', icon: 'download' }) }) +
      `<div class="g g-1-3">
        <div class="rail" style="top:20px">
          ${card({ bd: `<span class="t-xs dim2">今天</span><div class="row" style="align-items:flex-end;gap:6px"><span class="stat-big">${TODAY.reviews}</span><span class="t-sm dim2" style="padding-bottom:5px">次</span></div>
            <div class="bar mt12"><i style="width:70%"></i></div><p class="f-hint mt8">目标 60 次 · ${TODAY.minutes} 分钟</p>` })}
          ${donutCard()}
          ${card({ hd: '十天里', bd: kv([{ k: '复习', v: '428 次' }, { k: '新卡', v: '42 张' }, { k: '正确率', v: '88%' }, { k: '最长连续', v: TODAY.streak + ' 天' }]) })}
        </div>
        <div class="col" style="gap:16px">${hourChart()}${forecastChart()}${retentionChart()}</div>
      </div>`,
  });
}

export const meta = { name: 'stats', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 统计' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
