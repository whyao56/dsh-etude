/* 工厂：一个词 → 若干义项 → 每义项若干句子 → 每句五面素材。 */
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
  select,
  field,
  dotbar,
  audioRow,
  steps,
  sw,
  wave,
} from '../ui.mjs';
import { WORDS, SENTS } from '../data.mjs';

const FAS = [
  { k: '听', d: '声音 → 画面' },
  { k: '说', d: '画面 → 声音' },
  { k: '读', d: '句子 → 画面' },
  { k: '写', d: '画面 → 拼写' },
  { k: '改', d: '换一个说法' },
];

const wordRow = (w, on) => `<a class="wrow ${w.w === on ? 'on' : ''}" href="./factory.html">
  <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.w}</span>
  <span class="cnt">${w.total}</span>
  ${dotbar(w.imgs + w.aud, w.imgs, 0)}
</a>`;

const targetBar = () => `<div class="fx-target">
  <span style="color:var(--c-ink-3);display:flex">${icon('search')}</span>
  <input class="input" value="abandon" aria-label="要造的词">
  <span class="badge accent">单词</span>
  ${btn('换词', { k: 'quiet', cls: 'sm' })}
  <span class="spacer"></span>
  ${btn('批量造', { k: 'ghost', icon: 'layers' })}
  ${btn('造料', { k: 'primary', icon: 'sparkle' })}
</div>`;

const senseTabs = () => `<div class="row" style="gap:8px;flex-wrap:wrap">
  ${chip('义项 1 · 丢下不管，走了不再回来', { on: true, x: true })}
  ${chip('义项 2 · 放弃（计划、想法）')}
  <button class="chip ghost" type="button">${icon('plus')} 加一个义项</button>
  <span class="spacer"></span>
  <span class="t-xs dim2">日常 78 · 职场 45 · 四六级 35</span>
  <button class="chip ghost" type="button">+7</button>
</div>`;

const faceRow = (f, state, on) => `<div class="face-row">
  <span class="face-btn ${state === 'ok' ? 'done' : ''}" title="${f.k}">${f.k}</span>
  <span class="face-lbl">${f.d}<small>${state === 'ok' ? '素材齐' : state === 'part' ? '差 1 样' : '还没准备'}</small></span>
  ${state === 'ok' ? `<span class="badge ok"><span class="dot ok"></span>齐了</span>` : state === 'part' ? `<span class="badge warn">差 1 样</span>` : `<span class="badge">未准备</span>`}
  <span class="face-state">${sw(on, { cls: 'sm', label: f.k + ' 这一面' })}</span>
</div>`;

const sentBlock = (s, open) => `<div class="sent ${open ? 'sent-open' : ''}" data-sent>
  <div class="sent-hd">
    <span class="chev">${icon('chevR')}</span>
    <span class="sent-q">${s.q.replace(new RegExp('\\b' + s.w + '\\b', 'i'), (m) => `<b>${m}</b>`)}</span>
    <span class="dotbar"><i class="on"></i><i class="on"></i><i class="part"></i><i></i><i></i></span>
    <span class="t-xs dim2">${s.dur}s</span>
    <span class="meta"><span class="dot ok"></span>图</span>
    <span class="meta"><span class="dot ${s.audioOk ? 'ok' : 'warn'}"></span>声</span>
    <span class="badge ${s.imgOk && s.audioOk ? 'ok' : 'warn'}">${s.imgOk && s.audioOk ? '素材齐' : '差 1 样'}</span>
    ${iconbtn('more', '这一句的操作')}
  </div>
  ${
    open
      ? `<div class="sent-bd">
      <div class="g g2" style="gap:20px">
        <div>
          <p class="t-xs dim2" style="margin-bottom:6px">五维度 · 关掉就不出现在练习里</p>
          ${FAS.map((f, i) => faceRow(f, i < 2 ? 'ok' : i === 2 ? 'part' : '', i < 3)).join('')}
        </div>
        <div class="col" style="gap:12px">
          <div>
            <div class="row"><span class="t-xs dim2">图</span><span class="spacer"></span><span class="badge ok">9 张候选里挑了 1 张</span></div>
            <div class="nine mt8">
              ${['p-harbor', 'p-office', 'p-coffee', 'p-street', 'p-library', 'p-subway', 'p-dinner', 'p-harbor', 'p-office']
                .map(
                  (p, i) =>
                    `<div class="pickable ${i === 0 ? 'sel' : ''}"><img src="./assets/photos/${p}.jpg" alt="候选 ${i + 1}">${
                      i === 0 ? `<span class="ck">${icon('check')}</span>` : ''
                    }${i === 2 ? '<span class="tag bad">偏色</span>' : ''}</div>`
                )
                .join('')}
            </div>
          </div>
          <div>
            <div class="row"><span class="t-xs dim2">声</span><span class="spacer"></span><span class="t-xs dim2">Ava · +10%</span></div>
            <div class="mt8">${audioRow({ dur: s.dur, seed: 3, bars: 30 })}</div>
          </div>
        </div>
      </div>
      <div class="row">
        ${btn('换成这句', { k: 'ghost', cls: 'sm', icon: 'check' })}
        ${btn('再加一句', { k: 'quiet', cls: 'sm', icon: 'plus' })}
        <span class="spacer"></span>
        <span class="t-xs dim2">场景：${s.scene.slice(0, 20)}…</span>
      </div>
    </div>`
      : ''
  }
</div>`;

const statsBar = () => `<div class="row" style="gap:18px;font-size:12px;color:var(--c-ink-3);flex-wrap:wrap">
  <span><b style="color:var(--c-ink)">8</b> 已有句子</span>
  <span><b style="color:var(--c-warn)">2</b> 正在加工</span>
  <span><b style="color:var(--c-danger)">4</b> 未加工完</span>
  <span class="dot"></span>
  <span>en · 英语</span>
  <span class="dot"></span>
  <span><b style="color:var(--c-accent)">3</b> 已出厂</span>
  <span class="spacer"></span>
  <button class="chip ghost" type="button">${icon('info')} 怎么算做完</button>
</div>`;

const wordHead = () => `<div class="row" style="gap:10px;align-items:baseline">
  <h2 style="font-family:var(--font-serif);font-size:32px;letter-spacing:-.02em;font-weight:400">abandon</h2>
  <span class="mono dim2">/əˈbændən/</span>
  <span class="badge accent">单词</span>
  <span class="spacer"></span>
  ${btn('改释义', { k: 'quiet', cls: 'sm', icon: 'pen' })}
</div>
<p class="t-sm dim2 mt4">动词 · 及物 · 过去式 abandoned · 名词 abandonment</p>`;

function v1() {
  return shell({
    page: 'factory',
    crumb: [{ t: '工厂' }],
    body:
      pageHd({
        eyebrow: '造卡',
        title: '工厂',
        desc: '左边是词，右边是这个词的句子和素材。一句话配一张图、一条语音、一段场景。',
        actions: `${btn('全自动流水线', { k: 'ghost', icon: 'bolt' })}${iconbtn('info', '工厂怎么用')}`,
      }) +
      states({
        normal:
          targetBar() +
          `<div class="g g-1-3 mt16">
        <div class="col" style="gap:12px">
          ${card({
            hd: '词',
            sub: '5',
            r: iconbtn('plus', '加一个词'),
            pad: 'tight',
            bd: `<div class="input-ico" style="padding:6px 4px 8px">${icon('search')}<input class="input" placeholder="搜单词或释义…"></div>
              <div class="wordlist">${WORDS.map((w) => wordRow(w, 'abandon')).join('')}</div>`,
          })}
          ${card({
            hd: '进度',
            bd: `${steps(['意思', '例句', '挑一句'], 1, 'v')}<p class="f-hint mt12">一个词要先有义项，才有例句；有了句子才挑得出一句配图。</p>`,
          })}
        </div>
        <div class="col" style="gap:12px">
          <div class="card" style="padding:16px">
            ${wordHead()}
            <div class="mt12">${statsBar()}</div>
            <div class="mt12">${senseTabs()}</div>
          </div>
          <div class="row"><span class="t-sm dim">句子</span><span class="t-xs dim2">收起时只看五面进度</span><span class="spacer"></span>
            ${select([{ v: 'n', t: '按词数' }, { v: 'm', t: '按缺的多少' }], 'n', '排序')}
            ${btn('批量出厂', { k: 'ghost', cls: 'sm' })}
          </div>
          ${card({ pad: 'flush', bd: SENTS.slice(0, 5).map((s, i) => sentBlock(s, i === 0)).join('') })}
        </div>
      </div>`,
        loading: targetBar() + `<div class="g g2 mt16">${skeletonCard(160)}${skeletonCard(160)}</div>`,
        empty: targetBar() + `<div class="mt16">${empty({
          icon: 'sparkle',
          title: '还没有词',
          desc: '输入一个词、一个固定说法，或者一整句。造一次会给出 8 条不同场景的例句。',
          action: '',
        })}</div>`,
        error: targetBar() + `<div class="mt16">${errbox({
          title: '模型没答上来',
          desc: '连不上配置里的模型服务。可以先用「全自动流水线」里的离线样例看看效果。',
          code: 'llm: 401 invalid api key (model=gpt-4o-mini)',
          action: btn('去设置接口', { k: 'ghost', href: './settings.html#interface' }),
        })}</div>`,
      }),
  });
}

function v2() {
  return shell({
    page: 'factory',
    crumb: [{ t: '工厂' }],
    body:
      pageHd({
        eyebrow: '造卡',
        title: '工厂',
        desc: '一句一卡，横着摆。缺什么一眼看得出来。',
        actions: btn('造料', { k: 'primary', icon: 'sparkle' }),
      }) +
      targetBar() +
      `<div class="row mt16">${senseTabs()}</div>
      <div class="g g3 mt16">
        ${SENTS.slice(0, 6)
          .map(
            (s) => `<div class="ccard" style="padding:0">
          ${photo('./assets/photos/' + s.img + '.jpg', { ratio: 'r16-9', alt: '' })}
          <div class="ccard-bd">
            <p class="ccard-q">${s.q.replace(new RegExp('\\b' + s.w + '\\b', 'i'), (m) => `<b>${m}</b>`)}</p>
            <div class="row mt8" style="gap:4px">
              ${FAS.map((f, i) => `<span class="face-btn ${i < 3 ? 'done' : ''}" style="width:26px;height:26px;font-size:12px">${f.k}</span>`).join('')}
              <span class="spacer"></span>
              <span class="badge ${s.imgOk && s.audioOk ? 'ok' : 'warn'}">${s.imgOk && s.audioOk ? '齐了' : '差 1 样'}</span>
            </div>
          </div>
        </div>`
          )
          .join('')}
      </div>`,
  });
}

function v3() {
  const s = SENTS[0];
  return shell({
    page: 'factory',
    crumb: [{ t: '工厂' }],
    body:
      pageHd({
        eyebrow: '流水线 · 第 2 步 / 共 3 步',
        title: 'abandon · 挑一句',
        desc: '一次只做一句。配好图、听过声、点过确认，这句才算做完。',
        actions: `${btn('跳过这句', { k: 'quiet' })}${btn('下一句', { k: 'primary', icon: 'arrowR' })}`,
      }) +
      `<div class="g g-3-1">
        <div class="col" style="gap:16px">
          ${card({
            pad: 'flush',
            bd: `<div style="padding:16px 16px 0">${steps(['意思', '例句', '挑一句', '备料'], 2)}</div>
              ${photo('./assets/photos/' + s.img + '.jpg', { ratio: 'r16-9', alt: s.q })}
              <div style="padding:16px">
                <p class="stage-q" style="font-size:24px">${s.q.replace(new RegExp('\\b' + s.w + '\\b', 'i'), (m) => `<b>${m}</b>`)}</p>
                <p class="stage-scene mt8">${s.scene}</p>
                <div class="row mt12">${audioRow({ dur: s.dur, seed: 4, bars: 40, r: `<span class="badge ok">已试听</span>` })}</div>
                <div class="row mt12">${FAS.map((f, i) => `<span class="face-btn ${i < 4 ? 'done' : ''}">${f.k}</span>`).join('')}<span class="spacer"></span>${sw(true, { label: '这句放进练习' })}</div>
              </div>`,
          })}
        </div>
        <div class="rail">
          ${card({ hd: '这一句还差', bd: `<div class="col" style="gap:10px">
            <div class="row"><span class="dot ok"></span><span class="t-sm">图 · 从 9 张里挑了 1 张</span></div>
            <div class="row"><span class="dot ok"></span><span class="t-sm">声 · 3.4 秒，试听过</span></div>
            <div class="row"><span class="dot warn"></span><span class="t-sm">改 · 还没写变体</span></div>
            <p class="f-hint">「改」这一面可以先空着，练的时候也能用。</p>
          </div>` })}
          ${card({ hd: '换词', bd: `<div class="wordlist">${WORDS.slice(1, 5).map((w) => wordRow(w, 'abandon')).join('')}</div>` })}
        </div>
      </div>`,
  });
}

export const meta = { name: 'factory', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 工厂' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
