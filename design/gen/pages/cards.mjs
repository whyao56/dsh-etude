/* 卡组首页：今天练什么。三版不同的信息重心。 */
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
  states,
  empty,
  skeletonCard,
  errbox,
  heat,
  heatLegend,
} from '../ui.mjs';
import { SENTS, DECKS, TODAY, HEAT, WORDS } from '../data.mjs';

const S = SENTS[0];

const hero = (o = {}) => `<a class="hero" href="./study.html" data-fade>
  ${photo('./assets/photos/' + S.img + '.jpg', { ratio: 'r4-3', alt: '雾里的港口，船员往救生艇走' })}
  <div class="hero-txt">
    <div class="row" style="gap:6px">
      ${chip('接着练', { on: true, cls: 'ghost' })}<span class="t-xs dim2">${S.w} · 3 条例句里的第 1 条</span>
    </div>
    <p class="hero-q">The crew <b>abandoned</b> ship within minutes.</p>
    <p class="hero-scene">${S.scene}</p>
    <div class="faces-mini">
      <span class="f on"><span class="dot on"></span>听</span>
      <span class="f on"><span class="dot on"></span>说</span>
      <span class="f on"><span class="dot" style="background:var(--c-warn)"></span>读</span>
      <span class="f"><span class="dot"></span>写</span>
      <span class="f"><span class="dot"></span>改</span>
      <span class="spacer"></span>
      <span class="t-xs dim2">3.4 秒 · Ava</span>
    </div>
    <div class="row mt8">
      ${btn('练这一句', { k: 'primary', icon: 'play' })}
      <span class="t-sm dim2">还剩 12 张</span>
      <span class="spacer"></span>
      <span class="keys"><kbd class="kbd">space</kbd> 看答案</span>
    </div>
  </div>
</a>`;

const deckRow = (d) => `<a class="deckrow" href="./library.html" data-fade>
  <span class="nm"><span class="ind">${
    d.dep ? '' : `<svg viewBox="0 0 24 24"><path d="${d.open ? 'M5 9l7 7 7-7' : 'M9 5l7 7-7 7'}"/></svg>`
  }</span><span>${d.name}</span>${
  d.sample ? `<span class="badge">样例</span>` : ''
}</span>
  <span class="c ${d.neu ? '' : 'zero'}">${d.neu || '–'}</span>
  <span class="c ${d.learn ? '' : 'zero'}">${d.learn || '–'}</span>
  <span class="c ${d.due ? 'due' : 'zero'}">${d.due || '–'}</span>
  ${iconbtn('more', d.name + ' 的操作')}
</a>`;

const deckTable = () =>
  card({
    pad: 'flush',
    hd: '卡组',
    sub: `${DECKS.length} 个 · 共 338 句`,
    r: `${btn('新建', { k: 'ghost', cls: 'sm', icon: 'plus' })}${iconbtn('sort', '排序')}`,
    bd: `<div style="padding:6px 8px 8px">
      <div class="deckrow hd"><span style="padding-left:22px">名字</span><span class="c">新</span><span class="c">学</span><span class="c">到期</span><span></span></div>
      ${DECKS.map(deckRow).join('')}
    </div>`,
    ft: `${icon('info')}<span>「测试牌组」是给你的样例，练完可以直接删。</span>`,
  });

const railToday = () => card({
  bd: `<div class="row"><span class="t-sm dim">今天</span><span class="spacer"></span><span class="t-xs dim2">${TODAY.from} 开始</span></div>
  <div class="row mt8" style="align-items:flex-end;gap:6px">
    <span class="stat-big">${TODAY.reviews}</span><span class="t-sm dim2" style="padding-bottom:5px">次复习</span>
    <span class="spacer"></span>
    <span class="t-sm dim2">${TODAY.minutes} 分钟</span>
  </div>
  <div class="bar mt12"><i style="width:${Math.round((TODAY.reviews / 60) * 100)}%"></i></div>
  <p class="t-xs dim2 mt8">目标 60 次 · 还差 ${60 - TODAY.reviews} 次，约 ${Math.round((60 - TODAY.reviews) * 0.27)} 分钟</p>`,
});

const railHeat = () => card({
  bd: `<div class="row"><span class="t-sm dim">最近 19 周</span><span class="spacer"></span>${heatLegend()}</div>
  <div class="mt12">${heat(HEAT.slice(-133), 'sm')}</div>
  <div class="meta mt12"><span>最长连续 <b style="color:var(--c-ink)">19</b> 天</span><span class="sp"></span><span>共 1 284 次</span></div>`,
});

const railTodo = () => card({
  hd: '还差一点',
  r: `<span class="badge warn">2 项</span>`,
  bd: `<a class="kv" href="./factory.html" data-fade><span class="k"><span class="dot warn"></span>2 句没配图</span><span class="v">去挑 →</span></a>
  <a class="kv" href="./factory.html" data-fade><span class="k"><span class="dot warn"></span>1 条没试听</span><span class="v">去听 →</span></a>
  <a class="kv" href="./factory.html" data-fade><span class="k"><span class="dot"></span>0 项待导出</span><span class="v dim2">—</span></a>
  <p class="t-xs dim2 mt12">没配图、没试听的卡，不算做完，也打包不出去。</p>
  <div class="mt12">${btn('回工厂', { k: 'ghost', cls: 'sm block', icon: 'sparkle' })}</div>`,
});

const railTip = () => card({
  bd: `<div class="row" style="gap:7px;color:var(--c-accent)">${icon('bolt')}<span class="t-xs" style="color:var(--c-ink)">一句提示</span></div>
  <p class="t-sm dim mt8" style="line-height:1.65">练「读」的时候先别看中文。看图把句子复述出来，比看翻译有用。</p>
  <a class="t-xs" href="./tutorial.html" data-fade style="color:var(--c-accent);display:inline-block;margin-top:8px">五分钟怎么看一张卡 →</a>`,
});

/* ---------------------------------------------------------------- v1：今天 + 牌组 */
function v1() {
  return shell({
    page: 'cards',
    crumb: [{ t: '卡组' }],
    body:
      pageHd({
        eyebrow: `周二 · 11 月 2 日 · 连续 ${TODAY.streak} 天`,
        title: '今天',
        desc: `${TODAY.due} 张到期，其中 8 张已经过了三轮。句子是主角，词只是索引。`,
        actions: `${btn('导入', { k: 'ghost', icon: 'upload' })}${btn(`练 ${TODAY.due} 张`, { k: 'primary', icon: 'play' })}`,
      }) +
      `<div class="g g-3-1 mt24">
        <div>
          ${states({
            normal: hero() + `<div class="sect">${deckTable()}</div>`,
            loading: hero() + `<div class="sect g g2">${skeletonCard(120)}${skeletonCard(120)}</div>`,
            empty: empty({
              icon: 'layers',
              title: '还没有卡组',
              desc: '这个插件不预置内容。先去工厂造一句：一个词、一个固定说法，或者一整句都行。',
              action: btn('去工厂造第一句', { k: 'primary', href: './factory.html', icon: 'sparkle' }),
            }),
            error: errbox({
              title: '连不上宿主',
              desc: '面板需要宿主进程里的插件通道。宿主重启之后刷新一次页面即可。',
              code: 'rpc /etude state → timeout after 3000ms',
              action: btn('重试', { k: 'ghost', icon: 'refresh' }),
            }),
          })}
        </div>
        <div class="rail">${railToday()}${railHeat()}${railTodo()}</div>
      </div>`,
  });
}

/* ---------------------------------------------------------------- v2：数字在前 */
function v2() {
  const kpi = (k, v, s, d) => `<div class="kpi"><span class="k">${k}</span><span class="v">${v}${s ? `<small>${s}</small>` : ''}</span><span class="d">${d}</span></div>`;
  const dcard = (d) =>
    `<a class="ccard" href="./library.html" data-fade>
      <div class="ccard-bd">
        <div class="row"><span style="font-size:13.5px;font-weight:600;color:var(--c-ink)">${d.name}</span>${
      d.sample ? `<span class="badge" style="margin-left:auto">样例</span>` : ''
    }</div>
        <div class="ccard-meta">${d.all} 句 · 到期 ${d.due}</div>
        <div class="bar mt8"><i style="width:${Math.round(((d.all - d.due) / Math.max(d.all, 1)) * 100)}%"></i></div>
        <div class="ccard-meta mt8"><span>新 ${d.neu}</span><span>学 ${d.learn}</span><span class="spacer"></span><span>到期 ${d.due}</span></div>
      </div>
    </a>`;
  return shell({
    page: 'cards',
    crumb: [{ t: '卡组' }],
    body:
      pageHd({
        eyebrow: `周二 · 11 月 2 日`,
        title: '卡组',
        desc: '六个牌组，338 句。逾期最久的排在前面。',
        actions: `${btn('导入', { k: 'ghost', icon: 'upload' })}${btn('新建牌组', { k: 'primary', icon: 'plus' })}`,
      }) +
      `<div class="g g4 mt16">
        ${kpi('今天复习', TODAY.reviews, '次', `${icon('flame')}连续 ${TODAY.streak} 天`)}
        ${kpi('到期', TODAY.due, '张', '比昨天多 3 张')}
        ${kpi('已练', '1 284', '次', '保留度 92%')}
        ${kpi('时间', TODAY.minutes, '分钟', '平均 16 秒一张')}
      </div>
      <div class="sect">
        <div class="sect-hd"><h2>接着练</h2><p>最欠的三句</p><span class="r">${btn('全部', { k: 'quiet', cls: 'sm' })}</span></div>
        ${hero()}
      </div>
      <div class="sect">
        <div class="sect-hd"><h2>牌组</h2><p>点进去看句子</p><span class="r">${btn('按到期排序', { k: 'ghost', cls: 'sm', icon: 'sort' })}</span></div>
        <div class="cgrid">${DECKS.filter((d) => !d.dep).map(dcard).join('')}</div>
      </div>
      <div class="sect">${card({ hd: '练习记录', sub: '最近 26 周', r: heatLegend(), bd: heat(HEAT) })}</div>`,
  });
}

/* ---------------------------------------------------------------- v3：清单式 */
function v3() {
  const tree = DECKS.map(
    (d) => `<a class="wrow ${d.name === '测试牌组' ? 'on' : ''}" href="./library.html" data-fade>
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${
        d.dep ? `<span class="dim2" style="margin-right:6px">└</span>` : ''
      }${d.name}</span><span class="cnt">${d.due || ''}</span></a>`
  ).join('');
  const queue = SENTS.slice(0, 4)
    .map(
      (s, i) => `<a class="srow" href="./detail.html" data-fade style="grid-template-columns:44px minmax(0,1fr) 84px">
      <span class="th">${photo('./assets/photos/' + s.img + '.jpg', { ratio: 'r4-3', alt: '' })}</span>
      <span class="q">${s.q.replace(new RegExp(s.w, 'i'), (m) => `<b>${m}</b>`)}</span>
      <span class="right" style="text-align:right;font-size:11.5px;color:var(--c-ink-3)">${i ? '明天' : '现在'}</span>
    </a>`
    )
    .join('');
  return shell({
    page: 'cards',
    crumb: [{ t: '卡组' }],
    body: `<div class="g g-2-1">
      <div class="rail" style="top:20px;position:sticky">
        ${card({
          hd: '卡组',
          sub: '338',
          r: iconbtn('plus', '新建牌组'),
          pad: 'tight',
          bd: `<div class="wordlist">${tree}</div>`,
          ft: `${icon('info')}<span>到期数写在右边</span>`,
        })}
        ${card({ pad: 'tight', bd: `${kv([
          { k: '今天', v: TODAY.reviews + ' 次' },
          { k: '连续', v: TODAY.streak + ' 天' },
          { k: '保留度', v: '92%' },
        ])}` })}
      </div>
      <div>
        ${pageHd({
          eyebrow: '继续',
          title: '接着练',
          desc: '句式已经练熟，把词换成近义的再走一遍。',
          actions: btn('开始', { k: 'primary', icon: 'play' }),
        })}
        ${hero()}
        <div class="sect">
          <div class="sect-hd"><h2>接下来</h2><p>按逾期时间排</p><span class="r">${btn('全部句子', { k: 'ghost', cls: 'sm' })}</span></div>
          <div class="card" style="padding:4px 8px">${queue}</div>
        </div>
      </div>
    </div>`,
  });
}

export const meta = { name: 'cards', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 卡组' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
