/* 设置：一次只看一个分区，改完就生效，不需要「保存」。 */
import {
  btn,
  iconbtn,
  icon,
  chip,
  badge,
  sw,
  seg,
  select,
  field,
  card,
  kv,
  pageHd,
  shell,
  states,
  empty,
  errbox,
  kbd,
  keys,
} from '../ui.mjs';
import { VOICES } from '../data.mjs';

/* ---------- 各分区的行 ---------- */
const row = (title, desc, ctl, wide) =>
  `<div class="set-row"><span class="lb"><b>${title}</b><small>${desc}</small></span><span class="ct${wide ? ' wide' : ''}">${ctl}</span></div>`;

const swatches = () =>
  `<span class="swatches">${[
    ['雾蓝', '#a7bdf6'],
    ['青灰', '#8fbfc4'],
    ['苔绿', '#9dbf9b'],
    ['沙褐', '#c4b28f'],
    ['藕紫', '#b9a6d6'],
    ['砖红', '#d6a49a'],
  ]
    .map(
      (s, i) =>
        `<span class="swatch ${i === 0 ? 'on' : ''}" style="background:${s[1]}" title="${s[0]}" role="button" tabindex="0"><span>${s[0]}</span></span>`
    )
    .join('')}</span>`;

const groups = {
  look: {
    label: '外观',
    icon: 'image',
    body:
      card({
        bd:
          row('主题', '跟着系统走，还是锁死一个', seg(['浅色', '深色', '跟随系统'], '深色')) +
          row('主色', '只换强调色，不换中性色', swatches()) +
          row('字体', '句子用衬线，界面用无衬线', seg(['系统', 'MiSans', '思源黑体'], '系统')) +
          row('字号', '只影响正文，不影响标题层级', seg(['小', '标准', '大', '特大'], '标准')) +
          row('密度', '每一行多高', seg(['松', '标准', '紧'], '标准')) +
          row('动效', '系统开了「减少动效」时自动关掉', sw(true)) +
          `<div class="mt16"><div class="preview-box">
            <span class="t-xs dim2">预览</span>
            <p class="serif" style="font-size:22px;margin:6px 0 2px">The crew abandoned ship within minutes.</p>
            <p class="dim" style="margin:0;font-size:13px">凌晨四点，货轮在雾里开始进水。船长在驾驶台下了最后一道命令。</p>
          </div></div>`,
      }),
  },
  general: {
    label: '通用',
    icon: 'sliders',
    body:
      card({
        bd:
          row('学的语言', '影响例句、场景和语音的选法', select([{ v: 'en', t: 'English' }, { v: 'ja', t: '日本語' }, { v: 'ko', t: '한국어' }], 'en', '学习语言')) +
          row('界面语言', '只换界面文字，不换内容', seg(['简体中文', 'English'], '简体中文')) +
          row('每包条数', '一次造几句。多了场景会重复', `${select([{ v: '6', t: '6 句' }, { v: '8', t: '8 句' }, { v: '10', t: '10 句' }], '8', '每包条数')}`) +
          row('候选图上限', '九宫格里最多放几张', select([{ v: '9', t: '9 张' }, { v: '6', t: '6 张' }, { v: '12', t: '12 张' }], '9', '候选图')) +
          row('造词时顺手备料', '顺手找候选图和合成语音。关掉更快', sw(true)) +
          row('评完自动跳下一张', '260 毫秒后切过去', sw(true)),
      }),
  },
  agent: {
    label: '能力',
    icon: 'sparkle',
    body: card({
      bd:
        row('模型', '造例句、判场景用它', select([{ v: 'default', t: '跟随 Harness 默认' }, { v: 'fast', t: '快模型（省）' }, { v: 'strong', t: '强模型（准）' }], 'default', '模型')) +
        row('提示词版本', '换版本会影响幂等键，等于重造', `${badge('v3')}<span class="f-hint" style="margin-left:8px">HARD RULES 7 条 + 场景去重</span>`) +
        row('场景相似度阈值', '超过就重试一次', `<span class="num">0.86</span>`) +
        row('一次最多重试', '仍不过就报错，不悄悄降级', `<span class="num">1</span> 次`),
    }),
  },
  iface: {
    label: '接口',
    icon: 'key',
    body:
      card({
        hd: '语音',
        bd:
          row('引擎', 'auto 先试 OpenAI，失败退 Edge 并记下来', seg(['自动', 'Edge', 'OpenAI 兼容'], '自动')) +
          row('音色', 'Edge 零配置，装了就能用', select(VOICES.map((v) => ({ v: v.id, t: v.name })), VOICES[0].id, '音色')) +
          row('语速', '按句子长短微调 ±18%', `${seg(['慢', '正常', '快'], '正常')}`) +
          row('音量', '只对 Edge 生效', `${seg(['小', '正常', '大'], '正常')}`),
      }) +
      card({
        hd: '接口地址',
        sub: 'key 不放这里，只填环境变量名',
        bd:
          field('OpenAI 兼容地址', '<input class="input" value="https://api.openai.com/v1">', '留空就用官方地址') +
          `<div class="mt12">${field('key 的环境变量名', '<input class="input" value="OPENAI_API_KEY">', '凭据由 Harness 保管；这里只写变量名')}</div>` +
          `<div class="mt12">${field('模型名', '<input class="input" value="tts-1">')}</div>`,
      }),
  },
  tools: {
    label: '工具',
    icon: 'bolt',
    body: card({
      hd: '给智能体用的工具',
      sub: '三个，够用了',
      bd: `<div class="tbl">
        ${[
          ['etude_create', '造一个卡片包，返回还要人做什么', '开'],
          ['etude_status', '看某个包做到哪一步、还差什么', '开'],
          ['etude_pack', '硬校验后打包，缺件就拒绝', '开'],
        ]
          .map(
            (r) =>
              `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--c-line)"><span class="mono" style="font-size:12.5px;width:130px">${r[0]}</span><span class="dim" style="flex:1;font-size:12.5px">${r[1]}</span>${chip(r[2], { on: true })}</div>`
          )
          .join('')}
      </div>
      <p class="f-hint mt12">机器跑出来的包在清单里写 <span class="mono">auto:not-human</span>，只能看效果，不算交付物。</p>`,
    }),
  },
  keys: {
    label: '快捷键',
    icon: 'keyboard',
    body: (() => {
      const G = [
        ['全局', [['Ctrl K', '搜索'], ['Ctrl N', '造新包'], ['Esc', '关掉浮层'], ['?', '看快捷键']]],
        ['页面', [['G C', '去卡组'], ['G F', '去工厂'], ['G S', '去统计'], ['G L', '去句库'], ['G T', '去教程']]],
        ['练习', [['space', '翻开'], ['1 4', '评分'], ['J K', '换词'], ['← →', '切面'], [', .', '上一张/下一张']]],
        ['音频', [['R', '重放'], ['L', '循环'], ['− +', '调音量']]],
      ];
      return G.map(
        ([t, list]) =>
          `<div class="set-sec"><header><h3>${t}</h3></header><div class="set-rows">${list
            .map(
              ([k, d]) =>
                `<div class="set-row" style="padding:9px 0"><span class="lb"><b style="font-weight:400">${d}</b></span><span class="ct"><kbd class="kbd">${k}</kbd></span></div>`
            )
            .join('')}</div></div>`
      ).join('');
    })(),
  },
  data: {
    label: '数据',
    icon: 'folder',
    body:
      card({
        hd: '放在哪',
        sub: '本机磁盘，没有云',
        bd:
          field('数据目录', '<input class="input" value="%LOCALAPPDATA%\\dsh-etude">') +
          `<div class="mt12">${field('导出目录', '<input class="input" value="Downloads\\dsh-etude">')}</div>` +
          `<p class="f-hint mt12">索引在 <span class="mono">factory/library.json</span>。写文件一律先写临时文件再改名，中途断电不会写坏。</p>`,
      }) +
      card({
        hd: '清理',
        bd: `<div class="row" style="gap:8px;flex-wrap:wrap">${btn('打开目录', { k: 'ghost', icon: 'folder' })}${btn('备份全部', { k: 'ghost', icon: 'download' })}${btn('清掉没锁定过的候选图', { k: 'danger', icon: 'trash' })}</div>
          <p class="f-hint mt12">清候选图不会动已经锁定的图，也不会动已经导出的包。</p>`,
      }),
  },
  about: {
    label: '关于',
    icon: 'info',
    body:
      card({
        bd: `<div class="row" style="gap:14px;align-items:center">
          <span class="brand-mark" style="width:44px;height:44px;font-size:19px">卡</span>
          <div><div style="font-size:15px">卡片工厂</div><div class="t-xs dim2">dsh-etude 0.2 · 契约 card-pack v2</div></div>
          <span class="spacer"></span>${btn('自检', { k: 'ghost', icon: 'refresh' })}</div>
        <div class="mt16">${kv([
          { k: '契约版本', v: 'card-pack v2（etude-lesson 只发警告）' },
          { k: '校验器', v: 'validate.js / validate.py 同源' },
          { k: '语音', v: 'Edge TTS 纯 JS · 逐字节对齐' },
          { k: '许可', v: 'MIT' },
        ])}</div>`,
      }),
  },
};

const NAV = [
  ['界面', ['look', 'general']],
  ['能力', ['agent', 'iface', 'tools']],
  ['操作', ['keys']],
  ['其它', ['data', 'about']],
];

const nav = (cur) =>
  `<nav class="set-nav">${NAV.map(
    ([g, items]) =>
      `<div class="g"><span>${g}</span>${items
        .map(
          (k) =>
            `<a href="#${k}" class="${k === cur ? 'on' : ''}" data-set="${k}">${icon(groups[k].icon)}${groups[k].label}</a>`
        )
        .join('')}</div>`
  ).join('')}</nav>`;

const section = (k) =>
  `<section class="set-group ${k === 'look' ? 'on' : ''}" data-group="${k}">${groups[k].body}</section>`;

function v1() {
  return shell({
    page: 'settings',
    crumb: [{ t: '设置' }],
    body:
      pageHd({ eyebrow: '本机 · 0.2', title: '设置', desc: '改完就生效，没有保存按钮。', actions: btn('自检', { k: 'ghost', icon: 'refresh' }) }) +
      `<div class="set-shell">${nav('look')}<div class="setbody">${Object.keys(groups).map(section).join('')}</div></div>`,
  });
}

function v2() {
  const all = Object.keys(groups)
    .map(
      (k) =>
        `<section class="set-sec" data-group="${k}"><header><h3>${groups[k].label}</h3></header>${groups[k].body}</section>`
    )
    .join('');
  return shell({
    page: 'settings',
    crumb: [{ t: '设置' }],
    body: pageHd({ eyebrow: '本机 · 0.2', title: '设置', desc: '一页往下滚，所有开关都在明处。' }) + `<div class="col" style="gap:20px;max-width:760px">${all}</div>`,
  });
}

function v3() {
  return shell({
    page: 'settings',
    crumb: [{ t: '设置' }],
    body:
      pageHd({
        eyebrow: '本机 · 0.2',
        title: '设置',
        desc: '左边选一类，右边只剩这一类。',
        actions: `<div class="row">${chip('外观', { on: true })}${chip('通用')}${chip('接口')}${chip('快捷键')}${chip('数据')}</div>`,
      }) +
      `<div class="g g-1-3"><div class="rail" style="top:20px">${card({ bd: kv([
        { k: '学的是', v: 'English' },
        { k: '界面是', v: '简体中文' },
        { k: '语音引擎', v: 'Edge' },
        { k: '数据目录', v: '%LOCALAPPDATA%' },
        { k: '版本', v: '0.2' },
      ]) })}</div><div class="col" style="gap:16px">${groups.look.body}${groups.general.body}${groups.iface.body}</div></div>`,
  });
}

export const meta = { name: 'settings', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 设置' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
