import fs from 'node:fs';
import path from 'node:path';

const VER = 'v' + Math.floor(fs.statSync(new URL('./app.css', import.meta.url)).mtimeMs).toString(36)
const DIR = 'F:/dsharness/etude-test/mock';

const CHART_ANIM = '<script>(function(){' +
  'var d=document.documentElement;d.classList.add("cv-js");' +
  'var C=".card.stat";var done=new WeakSet();' +
  'function play(el,first){if(!first){el.classList.remove("cv-play");el.classList.add("cv-reset");void el.offsetWidth;el.classList.remove("cv-reset");}else{el.classList.remove("cv-reset");}el.classList.add("cv-play");}' +
  'function seen(en){var r=en.boundingClientRect,vh=window.innerHeight||d.clientHeight||800;var v=Math.min(r.bottom,vh)-Math.max(r.top,0);if(v<=0)return false;var need=Math.min(r.height||1,vh);if(v/need>=0.7)return true;return r.top<vh*0.35&&r.bottom>vh*0.35;}' +
  'function boot(){' +
  'var cards=[].slice.call(document.querySelectorAll(C));if(!cards.length)return;' +
  'cards.forEach(function(el){el.classList.remove("cv-play")});' +
  'var armed=new WeakMap();' +
  'if("IntersectionObserver" in window){' +
  'var io=new IntersectionObserver(function(entries){entries.forEach(function(en){var el=en.target;' +
  'if(seen(en)){if(!armed.get(el)){armed.set(el,true);play(el,!done.has(el));done.add(el);}}' +
  'else if(en.boundingClientRect.top>0){armed.set(el,false);}});' +
  '},{threshold:[0,0.25,0.5,0.75,0.9,0.96,1]});' +
  'cards.forEach(function(el){io.observe(el)});' +
  '}else{cards.forEach(function(el){el.classList.add("cv-play")});}' +
  'setTimeout(function(){cards.forEach(function(el){if(armed.get(el))return;var r=el.getBoundingClientRect(),vh=window.innerHeight||800;' +
  'if(r.top<vh*0.92&&r.bottom>0){armed.set(el,true);play(el,!done.has(el));done.add(el);}});},260);' +
  '}' +
  'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();' +
  'function badge(){' +
  'var b=document.createElement("button");b.id="animToggle";b.type="button";' +
  'b.textContent="动画 · "+(localStorage.getItem("kf-anim")==="off"?"关":"开");' +
  'b.style.cssText="position:fixed;right:16px;top:12px;z-index:9000;font:12px/1 ui-sans-serif,system-ui;color:var(--fg2);background:rgba(20,22,28,.86);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:8px 12px;cursor:pointer;backdrop-filter:blur(8px)";' +
  'if(localStorage.getItem("kf-anim")==="off")d.classList.add("cv-off");' +
  'b.onclick=function(){var off=d.classList.toggle("cv-off");localStorage.setItem("kf-anim",off?"off":"on");b.textContent="动画 · "+(off?"关":"开");' +
  'if(!off){[].forEach.call(document.querySelectorAll(C),function(el){play(el,!done.has(el));done.add(el)});}};' +
  'document.body.appendChild(b);' +
  '}' +
  'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",badge);else badge();' +
  '})();</script>'

const ICON = {
  plug: '<rect x="3" y="3" width="5" height="5" rx="1.4"/><rect x="10" y="3" width="5" height="5" rx="1.4"/><rect x="3" y="10" width="5" height="5" rx="1.4"/><rect x="10" y="10" width="5" height="5" rx="1.4"/>',
  gear: '<circle cx="9" cy="9" r="2.6"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M13.8 4.2l-1.4 1.4M5.6 12.4l-1.4 1.4"/>',
  play: '<path d="M6.5 4l8 5-8 5z"/>',
  mic: '<path d="M9 2.1a2.7 2.7 0 00-2.7 2.7v4.3a2.7 2.7 0 005.4 0V4.8A2.7 2.7 0 009 2.1z"/><path d="M4.6 8.8h1.5a2.9 2.9 0 005.8 0h1.5A4.45 4.45 0 019.7 13.2v1.9H8.3v-1.9A4.45 4.45 0 014.6 8.8z"/>',
  search: '<circle cx="8" cy="8" r="4.8"/><path d="M11.6 11.6L15.4 15.4"/>',
  bolt: '<path d="M10 2L4.5 10h3.2l-1 6L13 8h-3.2z"/>',
};

/* 菜单：教程 / 社区 ─ 导入 / 导出 ─ 帮助▸ / 同步
   划线位置按用户说的：社区与导入之间、导出与帮助之间。 */
const pluginMenu = () => `<details class="menu" id="plugin">
  <summary class="tbtn"><svg viewBox="0 0 18 18">${ICON.plug}</svg>插件</summary>
  <div class="menu-list">
    <a class="mi" href="./tutorial.html">教程</a>
    <a class="mi" href="https://github.com/" target="_blank" rel="noreferrer">社区<span class="sp"></span><span class="ext">↗</span></a>
    <div class="msep"></div>
    <a class="mi" href="#import">导入…<span class="sp"></span><span class="ext">.srt .txt</span></a>
    <a class="mi" href="#export">导出…<span class="sp"></span><span class="ext">.json</span></a>
    <div class="msep"></div>
    <details class="sub" id="help">
      <summary class="mi">帮助<span class="chev">›</span></summary>
      <div class="menu-list">
        <a class="mi" href="./tutorial.html#use">使用指南</a>
        <a class="mi" href="https://github.com/whyao56/dsh-etude/issues" target="_blank" rel="noreferrer">报告问题<span class="ext" style="margin-left:auto">↗</span></a>
        <a class="mi" href="#feedback">意见反馈</a>
        <a class="mi" href="#diag">诊断<span class="sp"></span><span class="ext">看状态</span></a>
      </div>
    </details>
    <a class="mi" href="#sync">同步…<span class="sp"></span><span class="ext">未接</span></a>
    <div class="msep"></div>
    <a class="mi" href="./index.html" data-fade="./index.html">退出<span class="sp"></span><span class="ext">回启动页</span></a>
  </div>
</details>`;

const topbar = (active) => {
  const tabs = [['cards', '卡片', 'cards.html'], ['factory', '工厂', 'factory.html'], ['stats', '统计', 'stats.html']];
  return `<div class="topbar">
  <div class="tb-left">${pluginMenu()}</div>
  <nav class="tabs">${tabs.map(([k, t, f]) => `<a class="${k === active ? 'on' : ''}" href="./${f}">${t}</a>`).join('')}</nav>
  <div class="tb-right"><button class="iconbtn" type="button" data-pal title="搜索 · Ctrl K"><svg viewBox="0 0 18 18">${ICON.search}</svg></button><a class="iconbtn${active === 'gear' ? ' on' : ''}" href="./settings.html" title="全局设置 · Ctrl Alt ,"><svg viewBox="0 0 18 18">${ICON.gear}</svg></a></div>
</div>`;
};

/* 菜单展开态的脚本：地址栏加 #plugin 就能直接看到（方便评审和截图），
   平时点「插件」也是原生 details 展开。样式稿不做业务，只为看得见。 */
const MENUS = `<script>
(function(){
  var h = location.hash.replace('#','');
  if (!h) return;
  var el = document.getElementById(h);
  if (el && el.tagName === 'DETAILS') el.open = true;
  if (h === 'plugin') { var help = document.getElementById('help'); if (help) help.open = true; }
})();
</script>`;

const shell = (file, active, body, opts = {}) => {
  const name = path.basename(file, '.html');
  return `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<script>(function(){if(!/[?&]t=fade/.test(location.search))return;var d=document.createElement("div");d.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#04060d;opacity:1;pointer-events:none;transition:opacity .58s cubic-bezier(.22,.61,.36,1)";document.documentElement.appendChild(d);document.documentElement.classList.add("kf-in");function out(){document.documentElement.classList.add("kf-go");requestAnimationFrame(function(){requestAnimationFrame(function(){d.style.opacity="0";setTimeout(function(){d.remove()},700)})})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",out);else out()})();</script><title>卡片工厂-测试 · ${name}</title>
<link rel="stylesheet" href="./app.css?v=${VER}">
<script src="./app.js?v=${VER}"></script><script src="./app2.js?v=${VER}"></script><script src="./stats.js?v=${VER}"></script>${CHART_ANIM}<script src="./transit.js?v=${VER}"></script><script src="./smooth.js?v=${VER}"></script><script src="./decks.js?v=${VER}"></script><script src="./help.js?v=${VER}"></script><script src="./pick.js?v=${VER}"></script><script src="./palette.js?v=${VER}"></script><script src="./factory.js?v=${VER}"></script><script src="./fx.js?v=${VER}"></script><script src="./rows.js?v=${VER}"></script><script src="./bgrows.js?v=${VER}"></script><script>
/* 说明性小字一律收成一个 ?：页面里只留符号，原文塞进 .pop 里给 help.js 用 */
(function () {
  var n = 0
  function run() {
  var list = document.querySelectorAll('.fold')
  for (var i = 0; i < list.length; i++) {
    var p = list[i]
    var text = (p.textContent || '').trim()
    if (!text) { p.remove(); continue }
    // 找这块的标题行：有就挂上去，标题行已经有一个 ? 就把文字并进去，别多长一个
    var blk = p.closest('.fx-blk, .blk, .mcard, .card, .st-side')
    var head = null
    if (blk) {
      var heads = blk.querySelectorAll('.fx-bh, .tl, .pw-hd, .side-h')
      for (var h = 0; h < heads.length; h++) {
        // 取「在它前面、离它最近」的那个标题行
        if (heads[h].compareDocumentPosition(p) & 4) head = heads[h]
      }
    }
    var footBlock = p.classList.contains('fx-foot')
    if (footBlock) {
      var defs = document.querySelectorAll('.fx-def')
      head = defs.length ? defs[defs.length - 1] : null
    }
    var existing = head ? head.querySelector('.q[data-pop]') : null
    if (existing) {
      var pv = document.getElementById(existing.getAttribute('data-pop'))
      if (pv) {
        var add = document.createElement('p')
        add.style.margin = '7px 0 0'
        add.textContent = text
        pv.appendChild(add)
        p.remove()
        continue
      }
    }
    var id = 'fd' + (n++)
    var pop = document.createElement('div')
    pop.className = 'pop'
    pop.id = id
    pop.textContent = text
    document.body.appendChild(pop)
    var q = document.createElement('button')
    q.type = 'button'
    q.className = 'q'
    q.setAttribute('data-pop', id)
    q.textContent = '?'
    if (head && (p.parentElement === blk || footBlock)) {
      q.classList.add('hq')
      head.appendChild(q)
      p.remove()
    } else {
      p.replaceWith(q)
    }
  }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
  else run()
})()
</script><script src="./rain.js?v=${VER}"></script>
</head><body>
<canvas class="liquid" aria-hidden="true"></canvas>
<canvas class="rain" aria-hidden="true"></canvas>
<div class="glow" aria-hidden="true"><i></i><i></i></div>
<div class="page">
${topbar(active)}
${body}
</div>${opts.menus === false ? '' : MENUS}</body></html>`;
};

const pips = (states) => states.map((s) => `<span class="pip ${s}"></span>`).join('');

const faces = (states, now = -1) => {
  const labels = ['听', '说', '读', '写', '改'];
  return `<div class="faces">${labels
    .map((l, i) => `<div class="face"><span class="pip ${i === now ? 'now' : states[i] || ''}"></span><span>${l}</span></div>`)
    .join('')}</div>`;
};

/* 练的每一面共用的顶条：词只看成一个胶囊（点开才展开解释），
   五个面的顺序固定 听 → 说 → 读 → 写 → 改，当前那一面亮着。 */
const faceOrder = ['听', '说', '读', '写', '改'];
const practiceHeader = (word, sentIdx, face, step, total, wordPop = '') => `<div class="strip">
  <button class="wchip" data-pop="wp-word" type="button">${word} <i>?</i></button>
  <div class="crumb"><span>第 ${sentIdx} 句</span><span>·</span><span>${face}</span></div>
  <div class="f5row">${faceOrder
    .map((one) => `<span class="fi ${one === face ? 'now' : ''}"><i class="pd"></i>${one}</span>`)
    .join('')}</div>
  <div class="track"><i style="width:${Math.round((step / total) * 100)}%"></i></div>
  <div class="crumb">${step} / ${total}</div>
</div>
<div class="pop" id="wp-word">${wordPop}</div>`;

const faceCell = (state) => `<span class="pip ${state}"></span>`;

const screens = {};

/* ───────── 卡片（今天） ───────── */
screens.cards = shell('cards.html', 'cards', `
<main class="screen half">
  <header class="hdr">
    <div><h1>卡片</h1></div>
    <div class="act">
      <span class="chip live"><i></i>Anki 已连 · 8765</span>
    </div>
  </header>

  <div class="cards2">
  <div class="c-l">
  <section class="card deckcard">
    <div class="deckhead">
      <span class="dname">牌组</span>
      <span class="dnum">未学习</span>
      <span class="dnum">学习中</span>
      <span class="dnum due">待复习</span>
      <span class="dgear"></span>
    </div>

        <div class="drow parent" data-go="./study.html?deck=testing" tabindex="0">
      <span class="dname"><i class="caret open"></i>测试牌组<span class="chip">样例</span></span>
      <span class="dnum">4</span>
      <span class="dnum learn">2</span>
      <span class="dnum due">12</span>
      <span class="dgear"><button class="gear" type="button" title="牌组设置">${`<svg viewBox="0 0 18 18" width="15" height="15">${ICON.gear}</svg>`}</button></span>
    </div>
    <div class="drow child" data-go="./study.html?w=abandon" tabindex="0">
      <span class="dname"><a href="./study.html?w=abandon">abandon</a></span>
      <span class="dnum">3</span>
      <span class="dnum learn">1</span>
      <span class="dnum due">8</span>
      <span class="dgear"><button class="gear" type="button">${`<svg viewBox="0 0 18 18" width="15" height="15">${ICON.gear}</svg>`}</button></span>
    </div>
    <div class="drow child" data-go="./study.html?w=succumb" tabindex="0">
      <span class="dname"><a href="./study.html?w=succumb">succumb</a></span>
      <span class="dnum">1</span>
      <span class="dnum learn">1</span>
      <span class="dnum due">4</span>
      <span class="dgear"><button class="gear" type="button">${`<svg viewBox="0 0 18 18" width="15" height="15">${ICON.gear}</svg>`}</button></span>
    </div>
    <div class="drow parent">
      <span class="dname"><i class="caret"></i>还没归类的</span>
      <span class="dnum">0</span>
      <span class="dnum learn">0</span>
      <span class="dnum due">0</span>
      <span class="dgear"><button class="gear" type="button">${`<svg viewBox="0 0 18 18" width="15" height="15">${ICON.gear}</svg>`}</button></span>
    </div>

  </section>

  <p class="deckstat">随包是空的。这个「测试牌组」是给你试手的样例（2 个词 · 6 句），练完可以直接删。</p>

  </div>

  <aside class="c-r">
    <section class="card nextup">
      <div class="row"><span class="sec-title">接着练</span></div>
      <div class="word">abandon</div>
      <p class="qline">The crew abandoned ship within minutes.</p>
      <p class="mut">傍晚，救生艇刚解开缆绳，船长的最后一道命令就是这个。</p>
      <div class="nextup-foot">
        <span class="nextup-face">${faces(['ok', 'warn', '', '', ''], 3)}</span>
        <a class="btn primary" href="./study.html">练这一句</a>
      </div>
    </section>
  </aside>
</div>

  <div class="deckfoot">
    <a class="btn ghost" href="https://ankiweb.net/shared/decks" target="_blank" rel="noreferrer">获取牌组</a>
    <button class="btn ghost" type="button" data-newdeck>创建牌组</button>
    <button class="btn ghost" type="button">导入牌组</button>
  </div>

  <div class="guide" id="guide" hidden>
    <div class="gcard">
      <div class="geyebrow">欢迎 · 三步</div>

      <div class="gbody">
        <div class="gstep on">
          <div class="gtitle">先选你学的语言</div>
          <div class="gdesc">只影响怎么给例句、场景和语音；后面随时能改。</div>
          <div class="gfield" style="margin-top:16px"><span class="glab2">要学的语言</span></div>
          <div class="gpick">
            <span class="chip accent">English</span><span class="chip">简体中文</span><span class="chip">日本語</span><span class="chip">한국어</span>
            <span class="chip">Español</span><span class="chip">Français</span><span class="chip">Deutsch</span>
          </div>
          <div class="gfield" style="margin-top:14px"><span class="glab2">界面语言</span></div>
          <div class="gpick">
            <span class="chip accent">简体中文</span><span class="chip">English</span>
          </div>
        </div>
        <div class="gstep">
          <div class="gtitle">再挑个样子</div>
          <div class="gdesc">点一下整页就换，跟着变的是底色和光晕，不是贴一张图。</div>
          <div class="gpick" style="margin-top:16px">
            <span class="chip accent">深色 · 雾蓝</span><span class="chip">浅色 · 雾蓝</span><span class="chip">深色 · 暮紫</span>
            <span class="chip">深色 · 松石</span><span class="chip">深色 · 琥珀</span>
          </div>
        </div>
        <div class="gstep">
          <div class="gtitle">东西放哪儿</div>
          <div class="gdesc">默认就放本机应用数据里；想换地方，点「选择…」挑个目录。</div>
          <div class="gfield" style="margin-top:16px"><span class="glab2">存放位置</span></div>
          <div class="gpath">
            <span class="inp wide" contenteditable="true">%LOCALAPPDATA%/dsh-etude-test/</span>
            <button class="btn ghost" type="button" id="g-pick">选择…</button>
            <button class="btn ghost" type="button" id="g-reset">默认</button>
          </div>
          <span class="mut" style="font-size:11.5px;display:block;margin-top:8px">换位置会把账本、素材、音频一起搬过去。不建议放网盘同步目录 —— 会被同步工具改坏。</span>
        </div>
      </div>
      <div class="gfoot">
        <button class="btn ghost" id="g-skip" type="button">跳过，直接进</button>
        <div class="gdots"><i class="gdot on"></i><i class="gdot"></i><i class="gdot"></i></div>
        <button class="btn primary" id="g-next" type="button">下一步</button>
      </div>
    </div>
  </div>

  <div class="deckmenu" id="deckmenu" hidden>
    <button type="button" data-act="subdeck">创建子牌组</button>
    <button type="button" data-act="rename">重命名</button>
    <button type="button" data-act="options">选项</button>
    <button type="button" data-act="export">导出</button>
    <button type="button" data-act="delete" class="danger">删除</button>
  </div>

<div class="mask" id="m-newdeck" hidden>
  <div class="sheet" role="dialog" aria-label="新建牌组">
    <div class="shead">
      <div><h2>新建牌组</h2><div class="mut">Anki 的命名规则：父牌组::子牌组，层级不限</div></div>
      <button class="x" type="button" data-close aria-label="关闭">✕</button>
    </div>
    <div class="sbody">
      <div class="srow">
        <div><div class="sl">放哪儿</div><div class="sd">选「顶层」就是一级牌组；选一个牌组，就建成它的子牌组。</div></div>
        <div class="sr"><select class="inp wide" id="nd-parent"></select></div>
      </div>
      <div class="srow">
        <div><div class="sl">名称</div><div class="sd">只写这一段，前面那一串自动接上。</div></div>
        <div class="sr"><input class="inp wide" id="nd-name" type="text" placeholder="老友记 S02E03" autocomplete="off"></div>
      </div>
      <div class="srow">
        <div><div class="sl">完整名字</div><div class="sd">以后在 Anki 里、在导出文件里，都是这个名字。</div></div>
        <div class="sr"><span class="nd-preview" id="nd-preview">老友记 S02E03</span></div>
      </div>
    </div>
    <div class="sfoot">
      <button class="btn ghost" type="button" data-close>取消</button>
      <button class="btn primary" type="button" id="nd-ok">创建</button>
    </div>
  </div>
</div>

<div class="mask" id="m-deckopt" hidden>
  <div class="sheet lg" role="dialog" aria-label="牌组选项">
    <div class="shead">
      <div><h2>牌组选项</h2><div class="mut">卡片工厂 · 只影响这个牌组</div></div>
      <button class="x" type="button" data-close aria-label="关闭">×</button>
    </div>
    <div class="sbody deckopt">
      <section class="oset">
        <h3>每日上限</h3>
        <div class="srow"><div class="sl">每日新卡片上限（张/天）</div><div class="sd"><input class="inp sm" value="20"></div></div>
        <div class="srow"><div class="sl">每日复习上限（次/天）</div><div class="sd"><input class="inp sm" value="200"></div></div>
        <div class="srow"><div class="sl">新卡片不受复习上限影响</div><div class="sd"><span class="sw"><i></i></span></div></div>
        <div class="srow"><div class="sl">使用顶层牌组的上限</div><div class="sd"><span class="sw"><i></i></span></div></div>
      </section>
      <section class="oset">
        <h3>新卡片</h3>
        <div class="srow"><div class="sl">初学间隔</div><div class="sd"><input class="inp sm" value="1m 10m"></div></div>
        <div class="srow"><div class="sl">「毕业」卡片再现间隔</div><div class="sd"><input class="inp sm" value="1"></div></div>
        <div class="srow"><div class="sl">「简单」卡片再现间隔</div><div class="sd"><input class="inp sm" value="4"></div></div>
        <div class="srow"><div class="sl">插入位置</div><div class="sd"><select class="sel sm"><option>顺序插入（旧卡片在前）</option><option>随机插入</option><option>插在最前</option></select></div></div>
      </section>
      <section class="oset">
        <h3>遗忘</h3>
        <div class="srow"><div class="sl">重学间隔</div><div class="sd"><input class="inp sm" value="10m"></div></div>
        <div class="srow"><div class="sl">最小间隔</div><div class="sd"><input class="inp sm" value="1"></div></div>
        <div class="srow"><div class="sl">记忆难点（leech）阈值</div><div class="sd"><input class="inp sm" value="8"></div></div>
        <div class="srow"><div class="sl">记忆难点（leech）处理</div><div class="sd"><select class="sel sm"><option>仅加标签</option><option>暂停这张卡</option><option>降低难度重排</option></select></div></div>
      </section>
      <section class="oset">
        <h3>展示顺序</h3>
        <div class="srow"><div class="sl">新卡片抽取顺序</div><div class="sd"><select class="sel sm"><option>按牌组顺序</option><option>随机</option><option>按加入时间</option></select></div></div>
        <div class="srow"><div class="sl">新卡片排列顺序</div><div class="sd"><select class="sel sm"><option>先按卡片模板，再按抽取顺序</option><option>完全随机</option><option>难的多排前面</option></select></div></div>
        <div class="srow"><div class="sl">学新/复习的先后顺序</div><div class="sd"><select class="sel sm"><option>学新与复习混合</option><option>先学新卡</option><option>先复习到期</option></select></div></div>
        <div class="srow"><div class="sl">跨日卡片展示顺序</div><div class="sd"><select class="sel sm"><option>按到期时间排</option><option>先做今天的，昨天的往后放</option><option>不分日期混在一起</option></select></div></div>
        <div class="srow"><div class="sl">复习卡片排列顺序</div><div class="sd"><select class="sel sm"><option>先按到期日期排序，再随机排序</option><option>按到期日期</option><option>随机</option><option>按上次的评分</option></select></div></div>
      </section>
      <section class="oset">
        <h3>高级</h3>
        <div class="srow"><div class="sl">复习卡片的最大间隔（天）</div><div class="sd"><input class="inp sm" value="36500"></div></div>
        <div class="srow"><div class="sl">初始简易度</div><div class="sd"><input class="inp sm" value="2.50"></div></div>
        <div class="srow"><div class="sl">「简单」复习间隔乘数</div><div class="sd"><input class="inp sm" value="1.30"></div></div>
        <div class="srow"><div class="sl">全局间隔乘数</div><div class="sd"><input class="inp sm" value="1.00"></div></div>
        <div class="srow"><div class="sl">「困难」复习间隔乘数</div><div class="sd"><input class="inp sm" value="1.20"></div></div>
        <div class="srow"><div class="sl">「重来」复习间隔乘数</div><div class="sd"><input class="inp sm" value="0.00"></div></div>
        <div class="srow"><div class="sl">FSRS（按记忆稳定性排期）</div><div class="sd"><span class="sw"><i></i></span></div></div>
      </section>
    </div>
    <div class="sfoot">
      <button class="btn ghost" type="button" data-close>取消</button>
      <button class="btn primary" type="button" data-close>保存</button>
    </div>
  </div>
</div>


</main>`);
/* ───────── 词的说明（练的每一面共用同一颗胶囊）─────────
   学英文就只给英文解释；母语默认藏着，点开才有。 */
const WORDNOTE = `<b>succumb</b>
<div style="font-family:var(--mono);font-size:11px;color:var(--accent);margin-bottom:7px">/səˈkʌm/ · 动词 · 第 2 句用的这个意思</div>
<p style="margin:0">to yield to something you have been trying to fight off — temptation, pressure, illness, or an attack.</p>
<p style="margin:8px 0 0;color:var(--ghost)">If you succumb to cancer, it means you die of it.</p>
<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--ghost);font-size:11.5px">看母语（默认藏着）</summary>
<p style="margin:7px 0 0">屈服于；抵挡不住（诱惑、压力、疾病）。</p></details>`;

/* 提示条：一句「这一面在练什么」，右边的问号才展开规则 */
const faceBar = (face, line, helpId) => `<div class="row" style="gap:8px;align-items:center">
  <span class="tag">${face}</span>
  <span class="mut">${line}</span>
  <button class="q" type="button" data-pop="${helpId}">?</button>
</div>`;

const mic = (dim) => `<button class="btn ${dim ? 'dim' : 'ghost'}" type="button"><svg viewBox="0 0 18 18" style="width:15px;height:15px;fill:currentColor">${ICON.mic}</svg>${dim ? '说一遍（先不要求）' : '按住说'}</button>`;

const writeIn = (dim, placeholder) => `<input class="inp writein ${dim ? 'dim' : ''}" placeholder="${placeholder}" />`;

/* ───────── 练 · 听 ─────────
   默认：没有句子、没有图片；写框灰但能写；麦克风灰但能说。
   句子和图片都是「答案」，而且**先给画面、再给句子**。 */
screens.listen = shell('listen.html', 'cards', `
<main class="screen">
  ${practiceHeader('succumb', 2, '听', 1, 5, WORDNOTE)}
  <div class="stage">
    ${faceBar('听', '听到声音，脑子里先出画面', 'q-listen')}
    <div class="pop" id="q-listen">
      <b>听这一面，默认藏起来什么</b>
      <ul class="pl">
        <li>句子、图片都先不给 —— 听到声音就要出画面，看着字听等于没练</li>
        <li>下面两个框是灰的，但随时能写、能说。灰只是提醒你「这一面不要求」</li>
        <li>答案分两步：先看画面，再看句子核对</li>
      </ul>
    </div>

    <div class="row" style="gap:18px;align-items:center">
      <button class="play" type="button"><svg viewBox="0 0 18 18">${ICON.play}</svg></button>
      <div class="wave">${Array.from({ length: 34 }, (_, i) => `<i class="${i < 19 ? 'on' : ''}" style="height:${10 + ((i * 37) % 34)}px"></i>`).join('')}</div>
      <span class="mut">3.2s</span>
      <button class="btn ghost" type="button">再放一遍</button>
    </div>

    <div class="row" style="gap:10px">
      ${writeIn(true, '听到什么场面？写一句，写不出也行')}
      ${mic(true)}
    </div>

    <details class="reveal">
      <summary class="btn ghost">看画面（答案）</summary>
      <div style="margin-top:12px">
        <img class="shot" src="./assets/factory/c1.jpg" alt="刚才那句对应的场面" />
        <p class="cue" style="margin-top:10px;font-size:19px">I'm afraid I succumbed to temptation and had a piece of cheesecake.</p>
        <p class="mut">句子是拿来核对的，不是拿来读的 —— 先有画面，再看它。</p>
      </div>
    </details>
  </div>
  <div class="actbar">
    <span class="kbd">Space</span><span>重播</span><span class="kbd">Tab</span><span>看画面</span>
    <span class="sp"></span>
    <a class="btn primary" href="./speak.html">下一面 · 说</a>
  </div>
</main>`);

/* ───────── 练 · 说 ─────────
   默认：麦克风亮、图片在；没有句子、没有语音；写框灰。 */
screens.speak = shell('speak.html', 'cards', `
<main class="screen">
  ${practiceHeader('succumb', 2, '说', 2, 5, WORDNOTE)}
  <div class="stage">
    ${faceBar('说', '看到场面，把它说出来', 'q-speak')}
    <div class="pop" id="q-speak">
      <b>说这一面，默认给什么</b>
      <ul class="pl">
        <li>图片直接给 —— 你要做的是「看到这个场面，说出那句话」</li>
        <li>句子和原声都藏着，说完再点开对</li>
        <li>不打分。机器判发音只会让你学会躲着说</li>
      </ul>
    </div>

    <img class="shot" src="./assets/factory/c1.jpg" alt="这个场面你会怎么讲" />

    <div class="rec"><svg viewBox="0 0 18 18">${ICON.mic}</svg></div>
    <div class="reclab">按住说话 · 松手结束 · 别先默念</div>

    <div class="row" style="gap:10px">
      <details class="reveal"><summary class="btn ghost">听原声</summary>
        <div style="margin-top:10px" class="row"><span class="kbd">▶</span><span>3.2s</span><span class="mut">edge · Aria · 女声</span></div>
      </details>
      <details class="reveal"><summary class="btn ghost">看句子</summary>
        <p class="cue" style="margin-top:10px;font-size:19px">I'm afraid I succumbed to temptation and had a piece of cheesecake.</p>
      </details>
      ${writeIn(true, '想写也可以写下来')}
    </div>
  </div>
  <div class="actbar">
    <span class="kbd">R</span><span>重录</span><span class="kbd">Tab</span><span>听原声</span>
    <span class="sp"></span>
    <a class="btn primary" href="./read.html">下一面 · 读</a>
  </div>
</main>`);

/* ───────── 练 · 读 ─────────
   默认：句子在；没有图片、没有语音；写框灰、麦克风灰。 */
screens.read = shell('read.html', 'cards', `
<main class="screen">
  ${practiceHeader('succumb', 2, '读', 3, 5, WORDNOTE)}
  <div class="stage">
    ${faceBar('读', '看到句子，脑子里要有那个场面', 'q-read')}
    <div class="pop" id="q-read">
      <b>读这一面，默认给什么</b>
      <ul class="pl">
        <li>句子直接给，图片藏着 —— 读的时候要让字变成画面</li>
        <li>不想中文。想中文就绕回翻译了，这一面就白练</li>
        <li>写框和麦克风都是灰的，想写想说随时能用</li>
      </ul>
    </div>

    <p class="cue" style="font-size:26px;line-height:1.5;max-width:820px">I'm afraid I succumbed to temptation and had a piece of cheesecake.</p>

    <div class="row" style="gap:10px">
      ${writeIn(true, '这句子让你想到什么场面？')}
      ${mic(true)}
    </div>

    <details class="reveal">
      <summary class="btn ghost">看画面（对一下）</summary>
      <div style="margin-top:12px">
        <img class="shot" src="./assets/factory/c1.jpg" alt="这一句对应的场面" />
        <p class="mut">对上就过。对不上说明这个词的用法还没进脑子，回头再听两遍。</p>
      </div>
    </details>
  </div>
  <div class="actbar">
    <span class="kbd">Enter</span><span>过了</span><span class="kbd">Tab</span><span>看画面</span>
    <span class="sp"></span>
    <a class="btn primary" href="./type.html">下一面 · 写</a>
  </div>
</main>`);

/* ───────── 练 · 写 ─────────
   默认：图片在、写框亮；没有语音；麦克风灰。写完和参考答案对。 */
screens.type = shell('type.html', 'cards', `
<main class="screen">
  ${practiceHeader('succumb', 2, '写', 4, 5, WORDNOTE)}
  <div class="stage">
    ${faceBar('写', '看到场面，把它写成一句英文', 'q-write')}
    <div class="pop" id="q-write">
      <b>写这一面，默认给什么</b>
      <ul class="pl">
        <li>图片给，写框亮着 —— 这一面就是要你动手</li>
        <li>语音不给，麦克风是灰的（想读出声也能按）</li>
        <li>提交之后才对参考答案，中途别看</li>
      </ul>
    </div>

    <img class="shot" src="./assets/factory/c1.jpg" alt="把这个场面写成英文" />

    <input class="inp writein" placeholder="把这个场面写成一句英文" autofocus />

    <div class="row" style="gap:8px;color:var(--ghost);font-size:12px">
      <span>目标说法</span><span class="chip accent">succumb to</span>
    </div>

    <details class="reveal">
      <summary class="btn ghost">对答案</summary>
      <div style="margin-top:12px">
        <p class="cue" style="font-size:19px">I'm afraid I succumbed to temptation and had a piece of cheesecake.</p>
        <p class="mut">只比你写的多出几个词，就不用重来 —— 意思对上了就算过。</p>
      </div>
    </details>
  </div>
  <div class="actbar">
    <span class="kbd">Enter</span><span>提交</span><span class="kbd">Tab</span><span>对答案</span>
    <span class="sp"></span>
    <a class="btn primary" href="./vary.html">下一面 · 改</a>
  </div>
</main>`);

/* ───────── 练 · 改 ─────────
   这一面要回答一个问题：改出来的句子，难道还要再配图配音？那改的句子要不要再改？
   这里的答案是「只做一层」：变体不产新卡，只开读和写两个便宜面。 */
screens.vary = shell('vary.html', 'cards', `
<main class="screen">
  ${practiceHeader('succumb', 2, '改', 5, 5, WORDNOTE)}
  <div class="stage">
    ${faceBar('改', '换掉一个词，同一张卡再走一遍', 'q-vary')}
    <div class="pop" id="q-vary">
      <b>为什么「改」只做一层</b>
      <ul class="pl">
        <li>改出来的句子不变成新卡 —— 它只是这张卡的另一轮练习，记在同一句名下</li>
        <li>变体只开 <u>读</u> 和 <u>写</u> 两面；听、说标成可选。全开就等于套娃，而且每层都要重新备料</li>
        <li>图沿用原句那张（同一个场面，换的只是词），语音想补再补</li>
        <li>变体不再派生变体。要换别的用法，回工厂挑另一条句子</li>
      </ul>
    </div>

    <p class="cue" style="font-size:22px">I'm afraid I <b style="color:var(--accent)">succumbed</b> to temptation and had a piece of cheesecake.</p>

    <div class="chips">
      <span class="chip on">换词</span><span class="chip">换句式</span>
      <span class="mut" style="margin-left:6px">换完先自己读一遍，再交给它</span>
    </div>

    <div class="chips">
      <span class="chip on">gave in to</span><span class="chip">yielded to</span><span class="chip">fell for</span>
      <span class="chip">自己打一个</span>
    </div>

    <div class="defn" style="max-width:820px">
      <span class="lab">改完是这样</span>
      <p style="font-size:19px;color:var(--fg)">I'm afraid I <b style="color:var(--accent)">gave in to</b> temptation and had a piece of cheesecake.</p>
      <p class="mut" style="margin-top:6px">句子骨架没动，只换了那个说法 —— 五个面的输入输出关系一个没变。</p>
    </div>

    <div class="row" style="gap:10px;align-items:center">
      <span class="mut">这条变体：</span>
      <span class="chip">图 沿用原句</span>
      <span class="chip">声 可选</span>
      <span class="chip accent">只开 读 / 写</span>
    </div>
  </div>
  <div class="actbar">
    <button class="btn ghost" type="button">先只改这一条</button>
    <button class="btn ghost" type="button">连语音一起补</button>
    <span class="sp"></span>
    <a class="btn primary" href="./cards.html">回卡片</a>
  </div>
</main>`);

/* ───────── 句库 ───────── */
screens.library = shell('library.html', 'cards', `
<main class="screen">
  <header class="hdr">
    <div><h1>句库</h1><div class="sub">37 句 · 12 个说法 · 按面看进度</div></div>
    <div class="act">
      <span class="chip on">全部</span><span class="chip">卡住 4</span><span class="chip">没开始 9</span><span class="chip">过了 24</span>
      <a class="btn" href="./detail.html">看这句详情</a>
      <a class="btn" href="./factory.html">导入素材</a>
    </div>
  </header>

  <div class="split">
    <section class="card" style="padding:10px">
      <div class="row" style="padding:6px 8px 10px"><span class="mut">说法</span><span class="mut" style="margin-left:auto">句子 · 卡住</span></div>
      <div class="litem on"><span class="en">succumb</span><span class="mut">屈服、扛不住</span><span class="mut" style="margin-left:auto">4 · 2</span></div>
      <div class="litem"><span class="en">run out of</span><span class="mut">用完、没了</span><span class="mut" style="margin-left:auto">3 · 1</span></div>
      <div class="litem"><span class="en">put off</span><span class="mut">往后拖</span><span class="mut" style="margin-left:auto">3 · 0</span></div>
      <div class="litem"><span class="en">make it up to</span><span class="mut">补偿</span><span class="mut" style="margin-left:auto">2 · 1</span></div>
      <div class="litem"><span class="en">show up</span><span class="mut">露面、到场</span><span class="mut" style="margin-left:auto">3 · 0</span></div>
      <div class="litem"><span class="en">figure out</span><span class="mut">弄明白</span><span class="mut" style="margin-left:auto">4 · 0</span></div>
      <div class="row" style="padding:12px 8px 4px;border-top:1px solid rgba(52,56,65,.7);margin-top:6px"><span class="mut">还有 6 个</span><span class="mut" style="margin-left:auto">31 句</span></div>
    </section>

    <section class="card" style="padding:6px 8px 8px">
      <table>
        <thead><tr><th style="width:54%">句子</th><th>读</th><th>打</th><th>听</th><th>说</th><th>改</th><th>来源</th></tr></thead>
        <tbody>
          <tr class="clickable" onclick="location.href='./detail.html'"><td><div class="sent">I'm afraid I <u>succumbed to</u> temptation and had a piece of cheesecake.</div></td><td>${faceCell('ok')}</td><td>${faceCell('warn')}</td><td>${faceCell('ok')}</td><td>${faceCell('bad')}</td><td>${faceCell('')}</td><td class="mut">视频</td></tr>
          <tr><td><div class="sent">We <u>ran out of</u> coffee again.</div></td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('')}</td><td>${faceCell('')}</td><td class="mut">老友记</td></tr>
          <tr><td><div class="sent">I can't <u>put it off</u> any longer.</div></td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('')}</td><td>${faceCell('')}</td><td>${faceCell('')}</td><td class="mut">日记</td></tr>
          <tr><td><div class="sent">Let me <u>make it up to</u> you.</div></td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('warn')}</td><td>${faceCell('')}</td><td class="mut">字幕</td></tr>
          <tr><td><div class="sent">He didn't <u>show up</u> at all.</div></td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('')}</td><td class="mut">老友记</td></tr>
          <tr><td><div class="sent">I finally <u>figured out</u> what she meant.</div></td><td>${faceCell('ok')}</td><td>${faceCell('ok')}</td><td>${faceCell('')}</td><td>${faceCell('')}</td><td>${faceCell('')}</td><td class="mut">模型</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</main>`);

/* ───────── 工厂 v4：收起来干净，打开来给足旋钮 ─────────
   用户的要求（原话）：「图片的要素最全，但是拥挤，排版很烂」「没打开前简洁舒畅，
   有很多小按钮，可以自定义，自由度要高」。
   所以：收起态只留「序号 + 句子 + 一条五格进度 + 词数 + 两个小按钮」，
   五个面的字、图、声、变体全部搬进展开态；展开态是 2×2 四块面板，
   每块自己带一排小按钮（开关 / 换 / 再生成 / 钉住）。 */
screens.factory = shell('factory.html', 'factory', `
<main class="screen">
  <header class="hdr">
    <div><h1>工厂</h1><div class="sub">左边是词，右边是这个词的句子与素材</div></div>
    <div class="act">
      <button class="btn" type="button" data-sheet="sh-flow">全自动流水线</button>
      <button class="q lg" type="button" data-pop="q-flow">?</button>
    </div>
  </header>
  <div class="pop" id="q-flow">
    <b>全自动流水线做什么</b>
    <ul class="pl">
      <li>给它语言 + 你的目标 + 数量 + 场景</li>
      <li>它去找词、造句、配图、配音，一次给你几百上千句</li>
      <li>出来的句子默认「待你过目」，不点出厂不会进学习牌组</li>
    </ul>
  </div>

  <div class="fx-src">
    <input class="inp" value="abandon" placeholder="一个词、一个说法，或者一整句" />
    <button class="btn primary" type="button">造料</button>
    <button class="btn batch" type="button" data-sheet="sh-batch">批量造</button>
    <button class="q" type="button" data-pop="q-batch">?</button>
  </div>
  <div class="pop" id="q-batch">
    <b>批量造</b>
    <ul class="pl">
      <li>把一串词直接粘进去，一次全交给模型</li>
      <li>分隔符随便：换行、逗号、斜杠、顿号、制表符都认</li>
      <li>同名同参数的词不会重复花钱（命中上次结果直接复用）</li>
    </ul>
  </div>

  <div class="fx-grid">
    <aside class="fx-side">
      <div class="fx-sidehd">单词 <span class="mut">5</span></div>
      <input class="inp sm" placeholder="搜单词或释义…" />
      <div class="fx-mini"><button class="mini on">按最近</button><button class="mini">按欠的</button></div>
      <ul class="fx-words">
        <li class="on"><b>abandon</b><i class="fdot ok"></i></li>
        <li><b>succumb</b><i class="fdot half"></i></li>
        <li><b>ambiguous</b><i class="fdot half"></i></li>
        <li><b>deteriorate</b><i class="fdot none"></i></li>
        <li><b>indispensable</b><i class="fdot none"></i></li>
      </ul>
    </aside>

    <section class="fx-main">
      <div class="fx-wordhd">
        <h2>abandon</h2>
        <span class="mut opt">/əˈbændən/</span>
        <span class="chip">单词</span>
        <span class="sp"></span>
        <button class="mini" type="button">改释义</button>
      </div>

      <div class="fx-info">
        <span><b>8</b> 已有句子</span>
        <span><b>2</b> 正在加工</span>
        <span><b>4</b> 未加工完</span>
        <span><b>en</b> 英语</span>
        <span><b>3</b> 已出厂</span>
        <span class="sp"></span>
        <button class="q" type="button" data-pop="q-info">?</button>
      </div>
      <div class="pop" id="q-info">
        <b>这五个数从哪来</b>
        <ul class="pl">
          <li><u>已有句子</u>：句库里属于这个词的句子总数，没有就是 0</li>
          <li><u>正在加工</u>：还在补图 / 补声的</li>
          <li><u>未加工完</u>：五维度没齐，但不急着的</li>
          <li><u>已出厂</u>：已经进了学习牌组</li>
        </ul>
      </div>

      <div class="fx-tools">
        <input class="inp sm" placeholder="搜句子…" />
        <button class="mini" type="button">缺图</button>
        <button class="mini" type="button">缺声</button>
        <button class="mini on" type="button">全部</button>
        <span class="sp"></span>
        <span class="mtag">排序</span>
        <button class="mini" type="button">按词数</button>
        <button class="mini" type="button">按缺的多少</button>
        <button class="btn sm primary" type="button" data-sheet="sh-out">批量出厂</button>
      </div>

            <div class="fx-list">
        <div class="fx-sense">
        <div class="fx-def">
          <span class="dn">义项 1</span>
          <span class="dt">丢下不管，走了不再回来</span>
          <span class="prob"><i title="日常">日常 <b>78</b></i><i title="职场">职场 <b>45</b></i><i title="四六级">四六级 <b>35</b></i><button class="morep" type="button" data-sheet="sh-prob">+7</button></span>
          <button class="q" type="button" data-pop="q-prob">?</button>
          <span class="sp"></span>
          <span class="defops">
            <button class="mini xs ic" type="button" data-add title="按顺序往下加一句">+</button>
            <button class="mini xs ic" type="button" data-del title="勾选后删句子">−</button>
            <button class="mini xs" type="button" data-sheet="sh-sense">设置</button>
          </span>
        </div>
        <div class="delbar">
          <span class="mut">勾一条要删的句子</span>
          <span class="sp"></span>
          <button class="mini xs" type="button" data-delcancel>取消</button>
          <button class="mini xs danger" type="button" data-delgo disabled>删除 0 句</button>
        </div>
        <details class="fx-row" open>
          <summary>
            <span class="pickbox"><input type="checkbox" class="pick" /></span>
            <span class="s">The crew <b>abandoned</b> ship within minutes.</span>
            <span class="pips"><i class="ok"></i><i class="ok"></i><i class="ok"></i><i class="ok"></i><i class="warn"></i></span>
            <span class="wc">6 词</span>
            <span class="ix" title="播放">▶</span>
            <button class="mini xs" type="button" data-sheet="sh-bg">背景</button>
            <button class="mini xs go" type="button">出厂</button>
            <span class="more">⋯</span>
          </summary>

          <div class="fx-body">
              <div class="fx-blk b5">
                <div class="fx-bh">
                  <span>五维度</span>
                  <button class="q" type="button" data-pop="q-f5">?</button>
                  <span class="sp"></span>
                  <button class="mini" type="button">全开</button>
                  <button class="mini" type="button">只看缺的</button>
                </div>
                <div class="f5list">
                  <div class="f5row"><button class="f5name" type="button" data-sheet="sh-dim" title="点开「听」这一面的正反面"><b>听</b><i class="cor">↗</i></button><em class="ok">齐了</em><span class="sp"></span><span class="d">声音 → 画面</span><button class="sw on" type="button"></button></div>
                  <div class="f5row"><button class="f5name" type="button" data-sheet="sh-dim" title="点开「说」这一面的正反面"><b>说</b><i class="cor">↗</i></button><em class="ok">齐了</em><span class="sp"></span><span class="d">画面 → 声音</span><button class="sw on" type="button"></button></div>
                  <div class="f5row"><button class="f5name" type="button" data-sheet="sh-dim" title="点开「读」这一面的正反面"><b>读</b><i class="cor">↗</i></button><em class="ok">齐了</em><span class="sp"></span><span class="d">句子 → 画面</span><button class="sw on" type="button"></button></div>
                  <div class="f5row"><button class="f5name" type="button" data-sheet="sh-dim" title="点开「写」这一面的正反面"><b>写</b><i class="cor">↗</i></button><em class="ok">齐了</em><span class="sp"></span><span class="d">画面 → 拼写</span><button class="sw on" type="button"></button></div>
                  <div class="f5row"><button class="f5name" type="button" data-sheet="sh-dim" title="点开「改」这一面的正反面"><b>改</b><i class="cor">↗</i></button><em class="warn">差 3 个</em><span class="sp"></span><span class="d">换一个说法</span><button class="sw on" type="button"></button></div>
                </div>
                <div class="f5note">
                  五个维度现在<b>共用</b>同一张图、同一条语音
                  <button class="mini xs" type="button" data-sheet="sh-dim">看差异</button>
                </div>
              </div>
              <div class="pop" id="q-f5">
                <b>五维度各要什么</b>
                <ul class="pl">
                  <li><u>听</u>：给声音，想画面</li>
                  <li><u>说</u>：给画面，说出来</li>
                  <li><u>读</u>：给句子，想画面</li>
                  <li><u>写</u>：给画面，写出来</li>
                  <li><u>改</u>：换一个说法，其余四维不变</li>
                </ul>
              </div>
                            <div class="fx-blk">
                <div class="fx-bh"><span>图</span><button class="q" type="button" data-pop="q-img">?</button><span class="sp"></span><button class="mini" type="button">钉住这张</button></div>
                <div class="imgbar">
                  <img src="./assets/factory/c1.jpg" alt="" data-sheet="sh-find" title="点开换图" />
                  <span class="giftag">静图</span>
                  <div class="im">
                    <b>已选这张</b>
                    <span class="mut">commons · CC BY-SA 4.0 · 1920×1280</span>
                  </div>
                  <button class="mini" type="button" data-sheet="sh-find">换图</button>
                </div>
                <div class="src4">
                  <button class="mini c-blue" type="button" data-sheet="sh-find">网上找</button>
                  <button class="mini c-violet" type="button" data-sheet="sh-gen">生图</button>
                  <button class="mini c-amber" type="button" data-sheet="sh-eggs">免费鸡蛋</button>
                  <button class="mini c-teal" type="button" data-sheet="sh-up">自己上传</button>
                </div>
              </div>
              <div class="pop" id="q-img">
                <b>四个来路</b>
                <ul class="pl">
                  <li><u>网上找</u>：按句子自己搜，回图片地址 + 出处</li>
                  <li><u>生图</u>：本机免费模型或付费 API，设置里选</li>
                  <li><u>免费鸡蛋</u>：各家的免费额度，给公式化提示词 + 跳转链接</li>
                  <li><u>自己上传</u>：选文件或直接粘</li>
                </ul>
              </div>

              <div class="fx-blk">
                <div class="fx-bh"><span>声</span><button class="q" type="button" data-pop="q-voice">?</button><span class="sp"></span><button class="mini c-teal" type="button" data-sheet="sh-voiceup">自己上传</button><button class="mini" type="button">试听</button><button class="mini" type="button">重合成</button></div>
                <div class="vline">
                  <select class="sel sm"><option>Aria · 女声 · 清楚的美国音</option><option>Guy · 男声 · 播报腔</option><option>Jenny · 女声 · 温和</option></select>
                  <span class="mut">3.1s</span>
                </div>
                <div class="vopts"><button class="mini" type="button">语速 +10%</button><button class="mini" type="button">音量 +0%</button><button class="mini" type="button">重音标一下</button></div>
              </div>
              <div class="pop" id="q-voice">
                <b>声音这一块</b>
                <ul class="pl">
                  <li>音色在设置里配：系统 TTS / 自己的 / 训练的</li>
                  <li>语速、音量只对支持这两个参数的引擎生效</li>
                  <li>一条语音默认五个维度共用</li>
                </ul>
              </div>

              <div class="fx-blk">
                <div class="fx-bh"><span>变体</span><button class="q" type="button" data-pop="q-vary">?</button><span class="sp"></span><button class="mini" type="button">生成 3 个</button><button class="mini batch" type="button" data-sheet="sh-varybatch">批量变</button></div>
                <div class="chips"><span class="chip on">gave in to</span><span class="chip">yielded to</span><span class="chip">fell for</span></div>
                <button class="mini own" type="button">自己打一个</button>
                <p class="mut note fold">只做一层：换词之后不再派生。默认不加图不加声，因为一句一变体，图和声的成本翻倍。</p>
              </div>
              <div class="pop" id="q-vary">
                <b>为什么只做一层</b>
                <ul class="pl">
                  <li>变体只换「改」这一个维度，其余四维沿用原句</li>
                  <li>再往下派生就是无限套娃，成本会失控</li>
                </ul>
              </div>

            <div class="fx-blk">
              <div class="fx-bh"><span>资源</span><button class="q" type="button" data-pop="q-res">?</button><span class="sp"></span><button class="mini" type="button" data-sheet="sh-res">＋ 填一条</button><button class="mini batch" type="button" data-sheet="sh-res">让模型找</button></div>
              <ul class="resl">
                <li>
                  <span class="rt gif">动图</span>
                  <a href="#">seagull stealing chips · giphy.com</a>
                  <button class="x" type="button" title="删掉">✕</button>
                </li>
                <li>
                  <span class="rt vid">视频</span>
                  <a href="#">Lifeboat launch, training run · youtu.be/9K2x…</a>
                  <button class="x" type="button" title="删掉">✕</button>
                </li>
                <li>
                  <span class="rt post">帖子</span>
                  <a href="#">「abandon ship」到底怎么用 · 知乎</a>
                  <button class="x" type="button" title="删掉">✕</button>
                </li>
              </ul>
              <p class="mut note fold">填链接就行，不用把文件搬进来。动图、视频、帖子都算一条；练「说」「写」时它会跟图一起摆出来。</p>
              <div class="pop" id="q-res">
                <b>这块是给什么留的</b>
                <ul class="pl">
                  <li>机器搜回来的图经常不对味，你刷到的动图、视频、帖子才是真的对味</li>
                  <li>大模型也搬不动整段视频，但它可以把链接填进来</li>
                  <li>练「说」和「写」的时候，图和链接是外面唯一给的东西</li>
                </ul>
              </div>
            </div>

            <div class="fx-blk bbg">
                <div class="fx-bh"><span>背景</span><button class="q" type="button" data-pop="q-bg">?</button><span class="sp"></span><button class="mini" type="button" data-sheet="sh-bg">补全 6 条</button></div>
                <ul class="bgl" id="bglList">
                  <li><b>谁</b><span>船长 · 通过广播对甲板</span><span class="bops"><button type="button" data-bgedit title="编辑">✎</button><button type="button" data-bgdel title="删掉">−</button></span></li>
                  <li><b>何时</b><span>傍晚，救生艇已放下海</span><span class="bops"><button type="button" data-bgedit title="编辑">✎</button><button type="button" data-bgdel title="删掉">−</button></span></li>
                  <li><b>何处</b><span>倾斜的货轮甲板，风雨很大</span><span class="bops"><button type="button" data-bgedit title="编辑">✎</button><button type="button" data-bgdel title="删掉">−</button></span></li>
                  <li><b>语气</b><span>短促、命令式、不解释</span><span class="bops"><button type="button" data-bgedit title="编辑">✎</button><button type="button" data-bgdel title="删掉">−</button></span></li>
                </ul>
                <button class="bgadd" type="button" data-bgadd>＋ 加一条</button>
                <p class="mut note fold">学的时候想不起这句什么时候说，就看这里；生图时这几条会拼进提示词。</p>
              </div>
              <div class="pop" id="q-bg">
                <b>背景是干什么的</b>
                <ul class="pl">
                  <li>学：想不起这句什么时候用，点开看看</li>
                  <li>加工：提示词生图会带上它，图更贴</li>
                </ul>
              </div>          </div>
        </div>
        <details class="fx-row">
          <summary>
            <span class="pickbox"><input type="checkbox" class="pick" /></span>
            <span class="s">They <b>abandoned</b> the plan after one meeting.</span>
            <span class="pips"><i class="ok"></i><i class="ok"></i><i></i><i></i><i></i></span>
            <span class="wc">7 词</span>
            <span class="ix" title="播放">▶</span>
            <button class="mini xs" type="button" data-sheet="sh-bg">背景</button>
            <button class="mini xs go" type="button">出厂</button>
            <span class="more">⋯</span>
          </summary>
        </details>
        </div>
        <div class="fx-sense">
        <div class="fx-def">
          <span class="dn">义项 2</span>
          <span class="dt">放弃（计划、希望）</span>
          <span class="prob"><i title="书面">书面 <b>62</b></i><i title="新闻">新闻 <b>55</b></i><i title="考研">考研 <b>48</b></i><button class="morep" type="button" data-sheet="sh-prob">+6</button></span>
          <button class="q" type="button" data-pop="q-prob">?</button>
          <span class="sp"></span>
          <span class="defops">
            <button class="mini xs ic" type="button" data-add title="按顺序往下加一句">+</button>
            <button class="mini xs ic" type="button" data-del title="勾选后删句子">−</button>
            <button class="mini xs" type="button" data-sheet="sh-sense">设置</button>
          </span>
        </div>
        <div class="delbar">
          <span class="mut">勾一条要删的句子</span>
          <span class="sp"></span>
          <button class="mini xs" type="button" data-delcancel>取消</button>
          <button class="mini xs danger" type="button" data-delgo disabled>删除 0 句</button>
        </div>
        <details class="fx-row">
          <summary>
            <span class="pickbox"><input type="checkbox" class="pick" /></span>
            <span class="s">Don't <b>abandon</b> hope yet.</span>
            <span class="pips"><i></i><i></i><i></i><i></i><i></i></span>
            <span class="wc">4 词</span>
            <span class="ix" title="播放">▶</span>
            <button class="mini xs" type="button" data-sheet="sh-bg">背景</button>
            <button class="mini xs go" type="button">出厂</button>
            <span class="more">⋯</span>
          </summary>
        </details>
        </div>
        <div class="fx-sense">
        <div class="fx-def">
          <span class="dn">义项 3</span>
          <span class="dt">放纵（with abandon）</span>
          <span class="prob"><i title="文学">文学 <b>70</b></i><i title="影视">影视 <b>44</b></i><i title="俚语">俚语 <b>30</b></i><button class="morep" type="button" data-sheet="sh-prob">+5</button></span>
          <button class="q" type="button" data-pop="q-prob">?</button>
          <span class="sp"></span>
          <span class="defops">
            <button class="mini xs ic" type="button" data-add title="按顺序往下加一句">+</button>
            <button class="mini xs ic" type="button" data-del title="勾选后删句子">−</button>
            <button class="mini xs" type="button" data-sheet="sh-sense">设置</button>
          </span>
        </div>
        <div class="delbar">
          <span class="mut">勾一条要删的句子</span>
          <span class="sp"></span>
          <button class="mini xs" type="button" data-delcancel>取消</button>
          <button class="mini xs danger" type="button" data-delgo disabled>删除 0 句</button>
        </div>
        <details class="fx-row">
          <summary>
            <span class="pickbox"><input type="checkbox" class="pick" /></span>
            <span class="s">They danced with wild <b>abandon</b>.</span>
            <span class="pips"><i class="ok"></i><i></i><i></i><i></i><i></i></span>
            <span class="wc">5 词</span>
            <span class="ix" title="播放">▶</span>
            <button class="mini xs" type="button" data-sheet="sh-bg">背景</button>
            <button class="mini xs go" type="button">出厂</button>
            <span class="more">⋯</span>
          </summary>
        </details>
        </div>
        <div class="addsense">
          <button class="as-main" type="button" data-sheet="sh-senseadd"><b>+</b><span>加一个义项</span></button>
          <span class="as-alt">
            <button class="mini xs" type="button" data-sheet="sh-senseadd">自己写</button>
            <button class="mini xs" type="button" data-sheet="sh-senseadd">让模型补</button>
          </span>
        </div>
        <p class="mut fx-foot fold">默认一个义项配一句；想多配几句到「设置 → 造料 → 每个义项几句」改。句子自动保存，退出不丢。</p>
      </div>
      <div class="pop" id="q-prob">
        <b>这个百分比是什么</b>
        <ul class="pl">
          <li>「情境画像」：四组标签——场景 / 语域 / 考试 / 语料出处，每个 0–100 的权重</li>
          <li>标签不够用可以自己加；也可以让大模型按语料估一遍</li>
          <li>它只影响「先练哪个义项」，不影响句子本身</li>
        </ul>
      </div>
</section>
  </div>
</main>

<!-- ── 批量造 ───────────────────────────────────────── -->
<div class="msheet" id="sh-batch" hidden>
  <div class="mcard">
    <div class="mhd"><b>批量造</b><span class="mut">一次粘一串词</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <textarea class="mta" rows="7">commute
awkward
in the long run
call it a day
get along with someone</textarea>
      <div class="mrow">
        <span class="mtag">分隔符</span>
        <button class="mini on" type="button">自动认</button>
        <button class="mini" type="button">换行</button>
        <button class="mini" type="button">逗号</button>
        <button class="mini" type="button">斜杠 /</button>
        <button class="mini" type="button">顿号 、</button>
      </div>
      <p class="mut">自动认：换行、逗号、顿号、分号、斜杠、制表符都当分隔符，混着用也行。识别到 <b>5</b> 个词，其中 2 个已经造过。</p>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button">开始造 5 个词</button></div>
    </div>
  </div>
</div>

<!-- ── 全自动流水线 ──────────────────────────────────── -->
<div class="msheet" id="sh-flow" hidden>
  <div class="mcard">
    <div class="mhd"><b>全自动流水线</b><span class="mut">一次给你一批成品</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><span class="mtag">语言</span><select class="sel sm"><option>英语</option><option>日语</option><option>法语</option><option>韩语</option></select><span class="mtag">母语</span><select class="sel sm"><option>中文</option><option>英语</option></select></div>
      <div class="mrow"><span class="mtag">我的想法</span><input class="inp" value="我想考过英语六级，重点在听力和阅读里的高频词" /></div>
      <div class="mrow"><span class="mtag">数量</span><input class="inp sm tiny" value="500" /><span class="mut">句</span><span class="mtag">场景</span><input class="inp sm" value="校园、实习面试、租房、旅行" /></div>
      <div class="mest">
        <div><span class="mut">预估时间</span><b>约 3 小时 20 分</b></div>
        <div><span class="mut">预估花费</span><b>约 ¥18（含图与声）</b></div>
        <div><span class="mut">会先跑</span><b>20 句试样，你点头再继续</b></div>
      </div>
      <p class="mut">默认不自动出厂：跑完停在「待你过目」，图与声按五维度自动补齐，缺的会列出来。</p>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>再想想</button><button class="btn sm primary" type="button">提交给 DeepSeek Harness</button></div>
    </div>
  </div>
</div>

<!-- ── 网上找图 ──────────────────────────────────────── -->
<div class="msheet" id="sh-find" hidden>
  <div class="mcard">
    <div class="mhd"><b>网上找</b><span class="mut">按句子搜，回地址与出处</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><input class="inp" value="lifeboat abandoned at sea" /><button class="mini" type="button">按这个找</button><button class="mini" type="button">换一批</button></div>
      <p class="mut">默认用句子 + 背景一起拼查询，搜完自动过体检：短边 ≥ 640、非纯色、非渐变、文件头是真图片。</p>
      <div class="mgrid">
        <div class="mtile on"><img src="./assets/factory/c1.jpg" alt="" /><span>commons · CC BY-SA 4.0</span></div>
        <div class="mtile"><img src="./assets/factory/c2.jpg" alt="" /><span>commons · CC BY 2.0</span></div>
        <div class="mtile"><img src="./assets/factory/c3.jpg" alt="" /><span>commons · public domain</span></div>
        <div class="mtile gifshot"><img src="./assets/factory/c3.jpg" alt="" /><span>giphy · 动图 2.4 MB</span><i class="giftag">动图</i></div>
      </div>
      <p class="mut" style="margin-top:-4px">也收动图（gif / webp）：动图带角标，练「说」「写」的时候会自己播。</p>
      <div class="mrow"><button class="mini" type="button">看大图</button><button class="mini" type="button">看这张的出处</button><button class="mini" type="button">裁成横幅</button><button class="mini" type="button">加背景（可关）</button><span class="sp"></span><button class="btn sm primary" type="button" data-close>就用这张</button></div>
      <div class="dgal">
        <div class="dg-h"><b>这一句现在用的</b><span class="mut">五个维度共用这一张，换掉等于五面一起换</span></div>
        <div class="dg-grid">
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>听</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>说</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>读</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>写</em></div>
          <div class="dg none"><span>缺</span><em>改</em></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ── 生图 ──────────────────────────────────────────── -->
<div class="msheet" id="sh-gen" hidden>
  <div class="mcard">
    <div class="mhd"><b>生图</b><span class="mut">本机免费模型或付费 API</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><span class="mtag">引擎</span><select class="sel sm"><option>本机 · 免费（慢，效果一般）</option><option>付费 API（快，效果稳）</option></select></div>
      <textarea class="mta" rows="4">a rescue lifeboat abandoned in grey sea, worn orange hull, overcast light, documentary photo, no text, 3:2</textarea>
      <p class="mut">提示词是「句子 + 背景 + 风格」三段拼出来的，背景那一段来自「背景采集」。</p>
      <div class="mgrid">
        <div class="mtile on"><img src="./assets/factory/c1.jpg" alt="" /><span>刚生成 · 3.2s</span></div>
        <div class="mtile"><img src="./assets/factory/c2.jpg" alt="" /><span>上一张</span></div>
      </div>
      <div class="mrow"><button class="mini" type="button">重新生成</button><button class="mini" type="button">裁成 16:9</button><button class="mini" type="button">加背景（可关）</button><span class="sp"></span><button class="btn sm primary" type="button" data-close>用这张</button></div>
    </div>
  </div>
</div>

<!-- ── 上传自己的录音 ────────────────────────────────── -->
      <div class="msheet" id="sh-voiceup" hidden>
        <div class="mcard">
          <div class="mhd"><b>上传自己的录音</b><span class="mut">读这一句，或者让别人替你读</span><button class="mx" type="button" data-close>×</button></div>
          <div class="mbody">
            <div class="drop" style="margin-bottom:14px">
              <b>把音频拖进来</b>
              <p class="mut">wav / mp3 / m4a / ogg 都行，建议 44.1kHz，别做降噪别加混响 —— 学的时候要听得出语气。</p>
              <button class="mini c-teal" type="button">选文件</button>
            </div>
            <div class="mrow"><span class="mtag">整句 / 只读词</span>
              <span class="chip on">整句</span><span class="chip">只读那个词</span>
            </div>
            <div class="mrow"><span class="mtag">用在哪几面</span>
              <span class="chip on">听</span><span class="chip on">说</span><span class="chip">读</span><span class="chip on">写</span><span class="chip">改</span>
            </div>
            <p class="mut">自己的声音有个好处：练「听」的时候不会因为陌生音色分心。上传之后默认只在本机，不同步到别处。</p>
            <div class="mrow"><span class="sp"></span><button class="btn ghost sm" type="button" data-close>取消</button><button class="btn sm" type="button" data-close>用它</button></div>
          </div>
        </div>
      </div>

      <!-- ── 免费鸡蛋 ──────────────────────────────────────── -->
<div class="msheet" id="sh-eggs" hidden>
  <div class="mcard">
    <div class="mhd"><b>免费鸡蛋</b><span class="mut">各家的免费额度，拿去换图</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <p class="mut">两种用法：<b>抄提示词</b>去对应网站生图再回来粘贴；或者<b>接通页面</b>直接回传（有的厂商会反代，可能连不上）。</p>
      <div class="eggs">
        <div class="egg"><b>豆包网页生图</b><span class="mut">每天免费几次，中文提示词友好</span><span class="sp"></span><button class="mini" type="button">复制提示词</button><button class="mini" type="button">打开</button></div>
        <div class="egg"><b>WorkBuddy</b><span class="mut">注册送积分，够跑几十张</span><span class="sp"></span><button class="mini" type="button">复制提示词</button><button class="mini" type="button">打开</button></div>
        <div class="egg"><b>通义万相</b><span class="mut">新账号有免费额度</span><span class="sp"></span><button class="mini" type="button">复制提示词</button><button class="mini" type="button">打开</button></div>
      </div>
      <textarea class="mta" rows="3">a rescue lifeboat abandoned in grey sea, worn orange hull, overcast light, documentary photo, no text, 3:2</textarea>
      <div class="mrow"><button class="mini" type="button">复制这段提示词</button><button class="mini" type="button">打开文件夹选图</button><button class="mini" type="button">从剪贴板粘贴</button></div>
    </div>
  </div>
</div>

<!-- ── 自己上传 ──────────────────────────────────────── -->
<div class="msheet" id="sh-up" hidden>
  <div class="mcard">
    <div class="mhd"><b>自己上传</b><span class="mut">选文件，或者直接粘</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="drop">把图片拖到这里，或者<button class="mini" type="button">打开文件夹</button><button class="mini" type="button">从剪贴板粘贴</button></div>
      <p class="mut">上传后会先过一遍体检；不过关会告诉你原因（太小 / 纯色 / 像截图），你可以坚持用。</p>
      <div class="mrow"><button class="mini" type="button">加背景（可关）</button><span class="sp"></span><button class="btn sm primary" type="button" data-close>用这张</button></div>
    </div>
  </div>
</div>

<!-- ── 背景采集 ──────────────────────────────────────── -->
<div class="msheet" id="sh-bg" hidden>
  <div class="mcard">
    <div class="mhd"><b>背景采集</b><span class="mut">给这条句子补上下文</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <p class="mut">它是「完善信息」用的：学的时候想不起这句什么时候说，点开看看；加工的时候，提示词生图会把这几条一起带上。</p>
      <ol class="ords">
        <li><b>谁在说</b><span>船长对甲板上的船员，通过广播</span></li>
        <li><b>什么时候</b><span>傍晚，救生艇已经放下海</span></li>
        <li><b>在哪儿</b><span>倾斜的货轮甲板，风雨声很大</span></li>
        <li><b>语气</b><span>短促、命令式、不解释</span></li>
        <li><b>说完会怎样</b><span>所有人停下手里的事，往救生艇那边跑</span></li>
        <li><b>容易误会的地方</b><span>不是「放弃」那种消极，是「撤离」这个动作</span></li>
      </ol>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button" data-close>存进这条句子</button></div>
    </div>
  </div>
</div>

<!-- ── 维度卡片设计 ──────────────────────────────────── -->
<div class="msheet" id="sh-dim" hidden>
  <div class="mcard mc-wide">
    <div class="mhd"><b>「听」这一面长什么样</b><span class="mut">正面 / 反面 · 素材 · 同化</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><button class="mini on" type="button" data-face="front">正面</button><button class="mini" type="button" data-face="back">反面</button><span class="mut">正面是学习者进来看到的那一面，反面是答案</span></div>
      <div class="dface">
        <div class="dcard">
          <div class="dimg" data-face-box="front"><img src="./assets/factory/c1.jpg" alt="" /></div>
          <div class="dfront" data-face-box="back" hidden>
            <p class="dsent">The crew <b>abandoned</b> ship within minutes.</p>
            <p class="mut">傍晚，救生艇刚解开缆绳，船长的最后一道命令。</p>
          </div>
          <div class="dops">
            <button class="mini xs" type="button" data-sheet="sh-find">换图</button>
            <button class="mini xs" type="button" data-sheet="sh-gen">生成</button>
            <button class="mini xs" type="button">加背景</button>
          </div>
          <div class="daudio"><button class="mini" type="button">▶ 播放</button><span class="mut">3.1s</span><button class="mini" type="button" data-sheet="sh-gen">换声</button></div>
        </div>
        <div class="dnote">
          <p><b>听</b>：进来的是声音，出去的是画面。所以正面只有播放键，图与句子都在反面。</p>
          <div class="dmini">
            <span class="mut">反面</span>
            <p class="dsent">The crew <b>abandoned</b> ship within minutes.</p>
            <p class="mut">傍晚，救生艇刚解开缆绳，船长的最后一道命令。</p>
          </div>
          <p class="mut">缺什么直接点左边那几个按钮 —— 这就是外面图 / 声面板的全部功能，只是缩小摆在这里。</p>
        </div>
      </div>
      <div class="mrow"><span class="mtag">同化</span><button class="mini" type="button" id="tgl-same">同化到其他维度 ▾</button><span class="mut">把这一份图与声推到别的维度，省得一个个设</span></div>
      <div class="mbody-in same" id="same-box" hidden>
        <label><input type="checkbox" checked /> 听</label>
        <label><input type="checkbox" /> 说</label>
        <label><input type="checkbox" /> 读</label>
        <label><input type="checkbox" /> 写</label>
        <label><input type="checkbox" /> 改</label>
        <span class="mut">至少要留一个勾；勾着的维度会跟这一面用同一份素材</span>
      </div>
      <div class="mest">
        <div><span class="mut">图</span><b>听 · 说 · 读 · 写 相同</b></div>
        <div><span class="mut">声</span><b>五个维度相同</b></div>
        <div><span class="mut">改</span><b>没有图与声（只换说法）</b></div>
      </div>
      <div class="dgal">
        <div class="dg-h"><b>这一面已有的图</b><span class="mut">点一张放大看；写着「缺」的是还没配</span></div>
        <div class="dg-grid">
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>听</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>说</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>读</em></div>
          <div class="dg on"><img src="./assets/factory/c1.jpg" alt="" /><em>写</em></div>
          <div class="dg none"><span>缺</span><em>改</em></div>
        </div>
      </div>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>关闭</button><button class="btn sm primary" type="button" data-close>保存</button></div>
    </div>
  </div>
</div>

<!-- ── 义项设置 ──────────────────────────────────────── -->
<div class="msheet" id="sh-sense" hidden>
  <div class="mcard mc-wide">
    <div class="mhd"><b>义项 1 的设置</b><span class="mut">名字 · 场合概率 · 句子顺序</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><span class="mtag">名字</span><input class="inp" value="丢下不管，走了不再回来" /></div>
      <div class="mrow"><span class="mtag">顺序</span><span class="mut">第 1 个义项（用 ↑ ↓ 调整在词里的次序）</span><span class="sp"></span><button class="mini xs" type="button">↑</button><button class="mini xs" type="button">↓</button></div>
      <p class="mut">这四条是 0–100 的相对高低，不是绝对频率；它们只决定「先练哪个义项」，不影响句子本身。</p>
      <div class="prbow">
        <div class="prow"><span class="pl">生活口语</span><span class="pbar"><i style="width:62%"></i></span><b>62</b></div>
        <div class="prow"><span class="pl">四六级</span><span class="pbar"><i style="width:40%"></i></span><b>40</b></div>
        <div class="prow"><span class="pl">考研</span><span class="pbar"><i style="width:35%"></i></span><b>35</b></div>
        <div class="prow"><span class="pl">雅思</span><span class="pbar"><i style="width:30%"></i></span><b>30</b></div>
      </div>
      <div class="mrow">
        <button class="mini" type="button">让大模型按语料估一遍</button>
        <button class="mini" type="button">全部清零重填</button>
        <span class="sp"></span>
        <button class="mini" type="button" data-close>取消</button>
        <button class="btn sm primary" type="button" data-close>保存</button>
      </div>
    </div>
  </div>
</div>

<!-- ── 情境画像 ──────────────────────────────────────── -->
<div class="msheet" id="sh-prob" hidden>
  <div class="mcard mc-wide">
    <div class="mhd"><b>义项 1 · 情境画像</b><span class="mut">这个词义在哪些场合出现，权重 0–100</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <p class="mut">不是绝对频率，是相对高低。用来看「这个词义到底活在哪儿」：决定先练哪个义项、生图往哪个场景靠、例句该像什么口气。</p>

      <div class="tggroup">
        <div class="tg-h"><b>场景</b><span class="mut">这句话会在什么地方被说出口</span></div>
        <div class="tg">
          <span class="t on">日常生活 <b>78</b></span><span class="t on">工作职场 <b>45</b></span><span class="t">校园学习 <b>12</b></span>
          <span class="t">旅行外出 <b>8</b></span><span class="t">餐饮点单 <b>4</b></span><span class="t">购物逛街 <b>6</b></span>
          <span class="t">医疗看病 <b>2</b></span><span class="t">租房搬家 <b>3</b></span><span class="t on">社交寒暄 <b>26</b></span>
          <span class="t">家庭日常 <b>18</b></span>
        </div>
      </div>

      <div class="tggroup">
        <div class="tg-h"><b>语域</b><span class="mut">口气有多正式</span></div>
        <div class="tg">
          <span class="t on">口语 <b>82</b></span><span class="t">书面 <b>20</b></span><span class="t">正式 <b>16</b></span>
          <span class="t">俚语 <b>9</b></span><span class="t">粗俗 <b>2</b></span>
        </div>
      </div>

      <div class="tggroup">
        <div class="tg-h"><b>考试</b><span class="mut">哪几份卷子里见过它</span></div>
        <div class="tg">
          <span class="t on">四六级 <b>35</b></span><span class="t">考研 <b>30</b></span><span class="t">雅思 <b>22</b></span>
          <span class="t">托福 <b>18</b></span><span class="t">GRE <b>6</b></span><span class="t">商务 BEC <b>12</b></span>
        </div>
      </div>

      <div class="tggroup">
        <div class="tg-h"><b>语料出处</b><span class="mut">这个词在什么样的材料里出现过</span></div>
        <div class="tg">
          <span class="t on">影视对白 <b>64</b></span><span class="t on">播客 <b>38</b></span><span class="t">新闻 <b>21</b></span>
          <span class="t">小说 <b>14</b></span><span class="t">演讲访谈 <b>9</b></span><span class="t">技术文档 <b>3</b></span>
        </div>
      </div>

      <div class="tggroup">
        <div class="tg-h"><b>自定义</b><span class="mut">这套标签不够用时自己加</span></div>
        <div class="mrow"><input class="inp sm" placeholder="比如「医院陪护」「游戏语音」" style="max-width:260px" /><button class="mini xs" type="button">加一个</button><span class="mut">加进去之后，别处也能选</span></div>
      </div>

      <div class="mrow">
        <button class="mini" type="button">让大模型按语料估一遍</button>
        <button class="mini" type="button">按我的目标重排（我在准备雅思）</button>
        <button class="mini" type="button">全部清零重填</button>
        <span class="sp"></span>
        <button class="mini" type="button" data-close>取消</button>
        <button class="btn sm primary" type="button" data-close>保存</button>
      </div>
    </div>
  </div>
</div>

<!-- ── 加义项 ────────────────────────────────────────── -->
<div class="msheet" id="sh-senseadd" hidden>
  <div class="mcard mc-wide">
    <div class="mhd"><b>加一个义项</b><span class="mut">自己写，或让模型补</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow">
        <button class="mini on" type="button" data-face2="me">自己写</button>
        <button class="mini" type="button" data-face2="ai">让模型补</button>
        <span class="mut">两种都会先给你看，再决定加不加</span>
      </div>

      <div data-face2-box="me">
        <div class="mrow"><span class="mtag">释义</span><input class="inp" placeholder="一句中文，比如「放弃（计划、希望）」" /></div>
        <div class="mrow"><span class="mtag">顺序</span><span class="mut">加在第 4 个义项的位置，之后可以用 ↑ ↓ 挪</span></div>
        <div class="mrow"><span class="mtag">情境</span><span class="mut">默认沿用这个词的整体画像，加完可以再调</span></div>
        <div class="row"><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button" data-close>添加这个义项</button></div>
      </div>

      <div data-face2-box="ai" hidden>
        <p class="mut">模型会先看这个词的语料，按「常用度」补几个义项 —— 不只补考试那几种，也包括口语里常见、但词典常漏掉的那种（比如 with abandon 这种固定搭配里意思变了的）。</p>
        <div class="mrow">
          <span class="mtag">补几个</span><input class="inp sm tiny" value="3" />
          <span class="mtag">偏向</span>
          <select class="sel sm"><option>均衡（口语 / 书面 / 考试都看）</option><option>偏口语</option><option>偏考试</option><option>偏文学</option></select>
        </div>
        <div class="mest">
          <div><span class="mut">会给</span><b>释义 + 情境画像 + 各一条例句</b></div>
          <div><span class="mut">例句</span><b>先不配图不配声</b></div>
          <div><span class="mut">花费</span><b>约 ¥0.2</b></div>
        </div>
        <div class="mrow"><span class="mut">补出来的先停在「待你过目」，你点头才进这个词。</span><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button" data-close>先补 3 个看看</button></div>
      </div>
    </div>
  </div>
</div>

<!-- ── 批量变 ────────────────────────────────────────── -->
<div class="msheet" id="sh-varybatch" hidden>
  <div class="mcard">
    <div class="mhd"><b>批量变</b><span class="mut">一个词的所有句子一次换说法</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><span class="mtag">交给</span><select class="sel sm"><option>DeepSeek Harness（当前会话）</option><option>本地模型</option></select></div>
      <div class="mrow"><span class="mtag">变几个</span><input class="inp sm tiny" value="1" /><span class="mut">每个句子几个变体</span></div>
      <div class="mest">
        <div><span class="mut">会变</span><b>3 句</b></div>
        <div><span class="mut">预估花费</span><b>约 ¥0.1</b></div>
        <div><span class="mut">图与声</span><b>沿用原句，不重新生成</b></div>
      </div>
      <ol class="ords">
        <li><b>只换说法</b>句子骨架不动，把目标词换成等价说法</li>
        <li><b>不改其余四维</b>变体只打开「改」这一面</li>
        <li><b>不派生</b>变体不再继续生出变体</li>
      </ol>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button" data-close>开始变</button></div>
    </div>
  </div>
</div>

<!-- ── 批量出厂 ──────────────────────────────────────── -->
<div class="msheet" id="sh-out" hidden>
  <div class="mcard">
    <div class="mhd"><b>批量出厂</b><span class="mut">挑几句进学习牌组</span><button class="mx" type="button" data-close>×</button></div>
    <div class="mbody">
      <div class="mrow"><label class="pick"><input type="checkbox" checked /> 全选</label><span class="mut">已选 4 句 · 其中 1 句还缺图</span><span class="sp"></span><button class="mini" type="button">只看齐了的</button></div>
      <div class="olist">
        <label><input type="checkbox" checked /><span class="s">The crew <b>abandoned</b> ship within minutes.</span><em class="ok">五维齐</em></label>
        <label><input type="checkbox" checked /><span class="s">They <b>abandoned</b> the plan after one meeting.</span><em class="ok">五维齐</em></label>
        <label><input type="checkbox" checked /><span class="s">Someone <b>abandoned</b> a puppy outside our gate.</span><em class="warn">缺 2 面</em></label>
        <label><input type="checkbox" checked /><span class="s">The match was <b>abandoned</b> because of rain.</span><em class="ok">五维齐</em></label>
        <label><input type="checkbox" /><span class="s">Don't <b>abandon</b> hope yet.</span><em class="bad">没图没声</em></label>
      </div>
      <p class="mut">没齐的也能出厂，只是练到那一面会跳过。出厂后想改必须「返工」回工厂。</p>
      <div class="mrow"><span class="sp"></span><button class="mini" type="button" data-close>取消</button><button class="btn sm primary" type="button" data-close>出厂这 4 句</button></div>
    </div>
  </div>
</div>
`);

/* ── 统计用的画图小工具 ────────────────────────────
   （原来是散在工厂那段里的，被重排时带掉了，这里补回来。
     只出 SVG，样式靠 app.css 里的 .bar/.c1-.c7/.chart。） */
const SP = [
  ['1m', '1 个月'],
  ['3m', '3 个月'],
  ['1y', '1 年'],
  ['all', '全部'],
];

/* 造点看起来有规律的数字，别让演示图抖成噪声 */
const pick = (i, mod, add = 0, mul = 1) => (i * mul + add) % mod;

const check = (id, label, on) =>
  `<label class="ck"><input type="checkbox" id="ck-${id}"${on ? ' checked' : ''}><span>${label}</span></label>`;

const rng = (id, value) =>
  `<select class="sel" id="sel-${id}">${SP.map(([k, l]) => `<option value="${k}"${k === value ? ' selected' : ''}>${l}</option>`).join('')}</select>`;

/* 统计卡头：标题 + 副标题 + 控件，一行排好，副标题和控件都可选 */
const head = (title, mut, ctls = '') =>
  `<div class="shead2"><span class="stitle">${title}</span>${mut ? `<span class="smut">${mut}</span>` : ''}${ctls ? `<div class="sctls">${ctls}</div>` : ''}</div>`;

const chartText = (x, y, text, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" class="tx">${text}</text>`;

/* 横向参考线：在 y=25%/50%/75% 处画三条极淡的虚线 */
/* 横向参考线 + 右侧刻度：面积图和柱图共用一套坐标 */
const gridLines = (w, h, { pad = 16, base = 22, plotW = w, yMax = 0, steps = [0.25, 0.5, 0.75] } = {}) => {
  const top = pad;
  const bottom = h - base;
  const out = [`<line x1="0" y1="${bottom}" x2="${plotW}" y2="${bottom}" class="gbase"/>`];
  steps.forEach((f) => {
    const y = Math.round(bottom - (bottom - top) * f);
    out.push(`<line x1="0" y1="${y}" x2="${plotW}" y2="${y}" class="gl"/>`);
  });
  if (yMax > 0) {
    [1, 0.5, 0].forEach((f) => {
      const y = Math.round(bottom - (bottom - top) * f);
      const label = f === 0.5 ? (yMax / 2).toFixed(yMax % 2 === 0 ? 0 : 1) : String(Math.round(yMax * f));
      out.push(`<text x="${plotW + 9}" y="${y + 3.5}" text-anchor="start" class="tx ty">${label}</text>`);
    });
  }
  return out.join('');
};

/* 只有上面两个角是圆的柱子（rect 的 rx 会把四个角都磨圆，柱子看着像药丸） */
const barPath = (x, y, bw, bh, r = 4) => {
  const rr = Math.max(0, Math.min(r, bw / 2, bh));
  return `M${x} ${y + bh} L${x} ${y + rr} Q${x} ${y} ${x + rr} ${y} `
    + `L${x + bw - rr} ${y} Q${x + bw} ${y} ${x + bw} ${y + rr} L${x + bw} ${y + bh} Z`;
};

/* 折线打滑：Catmull-Rom 转三次贝塞尔，控制点夹在上下边界里，免得拱过头 */
const smoothPath = (pts, top, bottom) => {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]} ${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const clamp = (v) => Math.max(top, Math.min(bottom, v));
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = clamp(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = clamp(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const BAR_GRAD = (id, from, to) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`
  + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;

const barChart = (items, { w = 620, h = 170, labels = [], base = 22, grad = ['--s-blue', '--s-blue2'], gid = 'bg1' } = {}) => {
  const count = Math.max(1, items.length);
  const slot = w / count;
  const barW = Math.max(3, Math.min(22, slot * 0.46));
  const max = Math.max(1, ...items.map((one) => one.v));
  const areaH = h - base - 14;
  const body = items
    .map((one, i) => {
      if (!(one.v > 0)) return labels[i] ? chartText(3 + i * slot + slot / 2, h - 6, labels[i]) : '';
      const bh = Math.max(2, (one.v / max) * areaH);
      const x = 3 + i * slot + (slot - barW) / 2;
      const y = h - base - bh;
      const label = labels[i] ? chartText(3 + i * slot + slot / 2, h - 6, labels[i]) : '';
      const tip = one.tip || `${one.v} 次`;
      return `<path class="bar ${one.c || ''}" d="${barPath(x, y, barW, bh, 4)}" style="fill:url(#${gid});--d:${i * 16}ms" data-tip="${tip}"><title>${tip}</title></path>${label}`;
    })
    .join('');
  const defs = `<defs>${BAR_GRAD(gid, `var(${grad[0]})`, `var(${grad[1]})`)}</defs>`;
  return `<svg class="chart bars" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img">${defs}${gridLines(w, h, { base })}${body}</svg>`;
};

const stackChart = (items, { w = 620, h = 170, labels = [], base = 22 } = {}) => {
  const count = Math.max(1, items.length);
  const slot = w / count;
  const barW = Math.max(3, Math.min(20, slot * 0.46));
  const max = Math.max(1, ...items.map((one) => (one.a || 0) + (one.b || 0)));
  const areaH = h - base - 14;
  const body = items
    .map((one, i) => {
      const total = (one.a || 0) + (one.b || 0);
      if (total <= 0) return one.l || labels[i] ? chartText(3 + i * slot + slot / 2, h - 6, one.l || labels[i]) : '';
      const full = Math.max(1.5, (total / max) * areaH);
      const darkH = total > 0 ? Math.round((full * (one.a || 0)) / total) : 0;
      const x = 3 + i * slot + (slot - barW) / 2;
      const y = h - base - full;
      const label = one.l || labels[i] ? chartText(3 + i * slot + slot / 2, h - 6, one.l || labels[i]) : '';
      const tip = one.tip || '';
      const topPart = full - darkH;
      return `<g class="stk" data-tip="${tip}"><title>${tip}</title>`
        + (darkH > 0 ? `<path class="bar c1" style="--d:${i * 16}ms" d="${barPath(x, y, barW, darkH, topPart > 0.5 ? 0 : 4)}"/>` : '')
        + (topPart > 0 ? `<path class="bar c5" style="--d:${i * 16}ms" d="${barPath(x, y + darkH, barW, topPart, 4)}"/>` : '')
        + `</g>${label}`;
    })
    .join('');
  return `<svg class="chart bars" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img">${gridLines(w, h, { base })}${body}</svg>`;
};/* 一个卡片里可以换范围的那种块：默认画第一组，其余塞进 data-sets 让 stats.js 换 */
const box = (id, range, sets) => {
  const keys = Object.keys(sets);
  const current = sets[range] ?? sets[keys[0]] ?? '';
  return `<div class="box" id="box-${id}" data-range="${range}" data-sets="${encodeURIComponent(JSON.stringify(sets))}">${current}</div>`;
};


/* 热力图 / 环图 / 面积图 —— 和上面三个一样，只出 SVG */
const heat = (weekCount = 52) => {
  const cell = 11;
  const gap = 2;
  const w = weekCount * (cell + gap);
  const h = 7 * (cell + gap);
  let cells = '';
  for (let week = 0; week < weekCount; week += 1) {
    // 一列一个 <g>：动画按列播，52 个而不是 364 个，掉帧就是这么省下来的
    let col = '';
    for (let day = 0; day < 7; day += 1) {
      const level = pick(week * 7 + day, 9, 0, 5);
      const count = level * 3; // 模拟实际练习次数
      const fill = level === 0 ? 'rgba(var(--w),.05)' : level < 3 ? 'rgba(var(--accent-rgb),.28)' : level < 6 ? 'rgba(var(--accent-rgb),.55)' : 'rgba(var(--accent-rgb),.85)';
      const dayName = '一二三四五六日'[day];
      const tip = count > 0 ? `第 ${week + 1} 周周${dayName} · ${count} 次` : `第 ${week + 1} 周周${dayName} · 未练习`;
      col += `<rect x="${week * (cell + gap)}" y="${day * (cell + gap)}" width="${cell}" height="${cell}" rx="2" style="fill:${fill}" data-tip="${tip}"><title>${tip}</title></rect>`;
    }
    cells += `<g class="hcol" style="--d:${week * 14}ms">${col}</g>`;
  }
  return `<svg class="chart heat" viewBox="0 0 ${w} ${h}" width="100%" height="120" role="img">${cells}</svg>`;
};

const donut = (parts, { size = 200, thick = 18, gap = 2.4 } = {}) => {
  const total = Math.max(1, parts.reduce((sum, one) => sum + (one.v || 0), 0));
  const r = size / 2 - thick / 2 - 6;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;
  const drawn = parts.filter((one) => (one.v || 0) > 0);
  const arcs = drawn
    .map((one) => {
      const raw = ((one.v || 0) / total) * c;
      const len = Math.max(0.0001, raw - (drawn.length > 1 ? gap : 0));
      const percent = Math.round(((one.v || 0) / total) * 100);
      const tip = `${one.name || ''} · ${one.v} 张 (${percent}%)`;
      const segDelay = Math.round((offset / c) * 620) + 120;
      const dash = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${thick}" stroke-linecap="butt" class="dc ${one.c || 'c1'}" style="--d:${segDelay}ms" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})" data-tip="${tip}"><title>${tip}</title></circle>`;
      offset += raw;
      return dash;
    })
    .join('');
  const digits = String(total).length;
  const big = digits >= 4 ? size * 0.16 : size * 0.19;
  const center = `<text x="${cx}" y="${cx + big * 0.24}" text-anchor="middle" class="donut-big" style="font-size:${big.toFixed(1)}px">${total}</text>`
    + `<text x="${cx}" y="${cx + big * 0.24 + 19}" text-anchor="middle" class="donut-label">张 · 全部卡面</text>`;
  const track = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${thick}" class="dtrack"/>`;
  return `<svg class="chart donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><g class="dspin">${track}${arcs}</g>${center}</svg>`;
};

const areaChart = (values, { w = 620, h = 170, labels = [], base = 22, yAxis = true, gid = 'ag1' } = {}) => {
  const count = Math.max(1, values.length);
  const max = Math.max(1, ...values);
  const axisW = yAxis ? 36 : 0;
  const plotW = w - axisW;
  const step = count > 1 ? plotW / (count - 1) : plotW;
  const top = 14;
  const bottom = h - base;
  const pts = values.map((v, i) => [i * step, bottom - (v / max) * (bottom - top)]);
  const line = smoothPath(pts, top, bottom);
  const area = `${line} L${(plotW).toFixed(1)} ${bottom} L0 ${bottom} Z`;
  const dotGroup = pts.map(([x, y], i) => {
    const tip = labels[i] ? `${labels[i]} · ${values[i]}` : `${values[i]}`;
    const isLast = i === pts.length - 1;
    const dotDelay = Math.round((i / Math.max(1, pts.length - 1)) * 900) + 120;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isLast ? 3.6 : 2.4}" class="adot${isLast ? ' adot-last' : ''}" style="--d:${dotDelay}ms"/>`
      + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent" class="ahit" data-tip="${tip}"><title>${tip}</title></circle>`;
  }).join('');
  const xLabels = labels.map((l, i) => l
    ? `<text x="${(i * step).toFixed(1)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}" class="tx">${l}</text>`
    : '').join('');
  const defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="var(--s-blue2)" stop-opacity=".34"/>`
    + `<stop offset="1" stop-color="var(--s-blue2)" stop-opacity="0"/></linearGradient></defs>`;
  return `<svg class="chart area" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img">${defs}`
    + `${gridLines(w, h, { base, plotW, yMax: max, steps: [0.28, 0.56, 0.84] })}`
    + `<path d="${area}" fill="url(#${gid})" class="area2"/>`
    + `<path d="${line}" class="line2" pathLength="1"/>${dotGroup}${xLabels}</svg>`;
};/* ── 各块的数据 ─────────────────────────────── */

const HOURS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
const todayVals = [0, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 0, 0, 6, 11, 14, 15, 7, 0];

const forecastSets = {
  '1m': [24, 18, 9, 6, 12, 3, 2, 5, 8, 21, 14, 7, 4, 2, 3, 6, 9, 12, 8, 5, 3, 2, 4, 7, 11, 6, 3, 2, 1, 2],
  '3m': [22, 16, 10, 7, 13, 5, 3, 6, 9, 19, 15, 8, 5, 3, 4, 7, 10, 13, 9, 6, 4, 3, 5, 8, 12, 7, 4, 3, 2, 3],
  '1y': [18, 14, 9, 6, 11, 4, 3, 5, 8, 17, 13, 7, 4, 3, 3, 6, 9, 12, 8, 5, 3, 2, 4, 7, 10, 6, 3, 2, 2, 2],
  all: [15, 12, 8, 5, 10, 4, 3, 5, 7, 15, 12, 6, 4, 3, 3, 5, 8, 11, 7, 5, 3, 2, 4, 6, 9, 5, 3, 2, 2, 2],
};

const revSets = {
  '1m': [1, 3, 5, 2, 0, 4, 7, 3, 1, 2, 6, 9, 4, 2, 3, 8, 12, 6, 3, 2, 5, 9, 14, 7, 4, 3, 6, 10, 5, 3],
  '3m': [14, 18, 12, 16, 21, 13, 9, 15, 19, 24, 17, 11, 16, 20],
  '1y': [42, 51, 47, 58, 63, 49, 55, 61, 44, 52, 58, 47],
  all: [38, 45, 41, 52, 57, 44, 49, 55, 40, 47, 52, 43],
};

const intervalSets = {
  '1m': [8, 11, 1, 17, 20, 30, 46, 30, 31, 30, 5],
  '3m': [12, 15, 3, 21, 24, 36, 52, 34, 36, 34, 7],
  '1y': [14, 18, 4, 25, 28, 42, 58, 38, 40, 38, 9],
  all: [10, 13, 2, 19, 23, 34, 50, 33, 34, 33, 6],
};
const intervalLabels = ['1', '', '4', '', '8', '', '12', '', '16', '', '30+'];

const easeSets = {
  '1m': [3, 8, 14, 22, 31, 44, 61, 12, 2],
  '3m': [4, 10, 17, 26, 36, 50, 68, 15, 3],
  '1y': [5, 12, 20, 30, 41, 55, 74, 17, 4],
  all: [4, 10, 16, 24, 33, 46, 62, 14, 3],
};
const easeLabels = ['1.3', '', '1.7', '', '2.1', '', '2.5', '', '2.9'];

const buttonSets = {
  '1m': [
    ['重来', 26, 'c4'],
    ['困难', 31, 'c3'],
    ['良好', 118, 'c6'],
    ['简单', 39, 'c2'],
  ],
  '3m': [
    ['重来', 74, 'c4'],
    ['困难', 92, 'c3'],
    ['良好', 342, 'c6'],
    ['简单', 118, 'c2'],
  ],
  '1y': [
    ['重来', 212, 'c4'],
    ['困难', 268, 'c3'],
    ['良好', 961, 'c6'],
    ['简单', 331, 'c2'],
  ],
  all: [
    ['重来', 190, 'c4'],
    ['困难', 240, 'c3'],
    ['良好', 880, 'c6'],
    ['简单', 302, 'c2'],
  ],
};

const addedSets = {
  '1m': [0, 2, 1, 0, 3, 5, 2, 1, 0, 2, 4, 3, 1, 0, 2, 2, 1, 0, 1, 3, 2, 1, 0, 1, 2, 1, 0, 0, 1, 0],
  '3m': [6, 9, 5, 8, 12, 7, 10, 6, 9, 11, 7, 5, 8],
  '1y': [22, 28, 19, 24, 31, 26, 18, 23, 29, 20, 25, 27],
  all: [18, 23, 16, 20, 26, 22, 15, 19, 24, 17, 21, 22],
};

const weeks = { '1m': 13, '3m': 26, '1y': 52, all: 52 };

const statCards = [];
const push = (s) => statCards.push(s);

/* 今天 */
push(`
    <section class="card stat" id="s-today">
      ${head('今天', '42 次 · 11 分钟 · 08:40 → 21:50')}
      <div class="chartbox">${barChart(
        todayVals.map((v, i) => ({ v, c: 'c1', tip: `${HOURS[i]}:00 · ${v} 次` })),
        { w: 1080, h: 180, labels: HOURS.map((x, i) => (i % 3 === 0 ? x : '')) },
      )}</div>
      <p class="takeaway">晚上 20–22 点是唯一认真练的时段；早上只有零星几下，白天基本不来。</p>
    </section>`);

/* 预测 */
push(`
    <section class="card stat" id="s-forecast">
      ${head('预测', '将来到期的复习的数目', `${check('backlog', '积压', true)}${rng('forecast', '1m')}`)}
      <div class="chartbox">${box(
        'forecast',
        '1m',
        Object.fromEntries(
          SP.map(([p]) => [
            p,
            stackChart(
              forecastSets[p].map((a, i) => ({
                a: Math.round(a * 0.62),
                b: Math.round(a * 0.38) + (i % 7 === 0 ? 6 : 0),
                l: `${i + 1}`,
                tip: `第 ${i + 1} 天`,
              })),
            ),
          ]),
        ),
      )}</div>
      <div class="sums">
        <div><span class="mut">总计</span><b>300</b></div>
        <div><span class="mut">平均</span><b>1/天</b></div>
        <div><span class="mut">明天到期</span><b>0</b></div>
        <div><span class="mut">每日工作量</span><b>43/天</b></div>
      </div>
      <p class="takeaway">三天后堆了 24 次 —— 那两天新练得偏多。要不把新句上限降到 1 就先看这张图。</p>
    </section>`);

/* 日程表 */
push(`
    <section class="card stat" id="s-heat">
      ${head('日程表', '最近半年 · 颜色越深练得越多', `<button class="btn ghost sm" type="button">‹</button><span class="year">2026</span><button class="btn ghost sm" type="button">›</button>${rng('heat', '1y')}`)}
      <div class="chartbox">${box('heat', '1y', Object.fromEntries(SP.map(([p]) => [p, heat(weeks[p])])))}</div>
      <p class="takeaway">中间断了两周没练三天，都卡在周末。</p>
    </section>`);

const counts = [
  ['未学习', 24, 'c1'],
  ['学习中', 12, 'c3'],
  ['重学中', 8, 'c4'],
  ['欠熟练', 129, 'c6'],
  ['已熟练', 12, 'c7'],
  ['已暂停', 0, 'c2'],
  ['已搁置', 0, 'c8'],
];
const countsTotal = counts.reduce((sum, one) => sum + one[1], 0);

/* 卡片数量 */
push(`
    <section class="card stat" id="s-counts">
      ${head('卡片数量', `按面算 · ${countsTotal} 张`, check('split', '分开统计暂停 / 搁置', true))}
      <div class="donutwrap">
        <div class="donut-center">
          ${donut(counts.map(([name, v, c]) => ({ name, v, c })))}
        </div>
        <ul class="legend">
          ${counts
            .map(
              ([name, v, c]) =>
                `<li><i class="${c}"></i><span>${name}</span><b>${v}</b><span class="mut">${Math.round((v / countsTotal) * 100)}%</span></li>`,
            )
            .join('')}
          <li class="tot"><span class="mut">总计</span><b>${countsTotal}</b><span class="mut">100%</span></li>
        </ul>
      </div>
      <p class="takeaway">新卡只占 13%，基本吃老本：想让分数上去得多放新句。</p>
    </section>`);

/* 复习 */
push(`
    <section class="card stat" id="s-reviews">
      ${head('复习', '已经回答的问题的数量', `${check('time', '用时', false)}${rng('reviews', '1m')}`)}
      <div class="chartbox">${box('reviews', '1m', Object.fromEntries(SP.map(([p]) => {
        const vals = revSets[p];
        const labels = p === '1m' ? vals.map((_, i) => i % 5 === 0 ? `${i + 1}日` : '') :
                       p === '3m' ? vals.map((_, i) => `第${i + 1}周`) :
                       vals.map((_, i) => ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][i] || '');
        return [p, areaChart(vals, { w: 620, h: 170, labels })];
      })))}</div>
      <p class="takeaway">平均每天 11.4 次；最后那根是今天，还没练完。</p>
    </section>`);

/* 复习间隔 */
push(`
    <section class="card stat" id="s-intervals">
      ${head('复习间隔', '复习卡再次出现前的间隔', rng('intervals', '1m'))}
      <div class="chartbox">${box(
        'intervals',
        '1m',
        Object.fromEntries(
          SP.map(([p]) => [
            p,
            barChart(
              intervalSets[p].map((v, i) => ({ v, c: 'c1', tip: `${intervalLabels[i] || ''} 天 · ${v} 张` })),
              { w: 620, labels: intervalLabels },
            ),
          ]),
        ),
      )}</div>
      <p class="takeaway">间隔中位数：10 天。一大半还挤在 8 天以内 —— 阶梯确实在走，只是早期那几档卡得多。</p>
    </section>`);

/* 卡片简易度 */
push(`
    <section class="card stat" id="s-ease">
      ${head('卡片简易度', '越低越难')}
      <div class="chartbox">${box(
        'ease',
        '1m',
        Object.fromEntries(
          SP.map(([p]) => [
            p,
            barChart(
              easeSets[p].map((v, i) => ({ v, c: 'c7', tip: `简易度 ${easeLabels[i] || ''} · ${v} 张` })),
              { w: 620, labels: easeLabels },
            ),
          ]),
        ),
      )}</div>
      <p class="takeaway">简易度中位数 250%。中段偏瘦、两端都薄，说明难度分层是清楚的，没有一堆「永远记不住」。</p>
    </section>`);

/* 记忆保留率 */
const retention = [
  ['今天', '-', '-', '-', 0],
  ['昨天', '-', '-', '-', 0],
  ['上周', '100%', '-', '100%', 14],
  ['上个月', '96.2%', '-', '96.2%', 158],
  ['近一年', '95.3%', '-', '95.3%', 618],
];
push(`
    <section class="card stat" id="s-retention">
      ${head('记忆保留率', '间隔大于 1 天的卡片的通过率', `<span class="seg small"><span data-val="a" class="on">欠熟练</span><span data-val="b">已熟练</span><span data-val="c">所有</span></span>`)}
      <table class="rt">
        <thead><tr><th></th><th class="g">欠熟练</th><th class="b">已熟练</th><th>总计</th><th>总数</th></tr></thead>
        <tbody>${retention
          .map(([when, a, b, t, n]) => `<tr><th>${when}</th><td class="g">${a}</td><td class="b">${b}</td><td>${t}</td><td>${n}</td></tr>`)
          .join('')}</tbody>
      </table>
      <p class="takeaway">间隔越长掉得越多，是正常的；32 天一档掉到 74% 说明这一档该缩短。</p>
    </section>`);

/* 逐小时分析 */
const hourAcc = [null, null, null, null, null, null, null, 74, 81, 88, 92, null, 86, 90, null, null, 93, 90, 88, 86, 84, 82, 78, null];
push(`
    <section class="card stat" id="s-hourly">
      ${head('逐小时分析', '柱=次数 · 线=正确率', rng('hourly', '1m'))}
      <div class="chartbox">${box(
        'hourly',
        '1m',
        Object.fromEntries(
          SP.map(([p]) => [
            p,
            barChart(
              todayVals.map((v, i) => ({ v: Math.round(v * (p === '1m' ? 1 : p === '3m' ? 2.2 : 4.4)), c: 'c1', tip: `${HOURS[i]}:00 · ${v} 次` })),
              { w: 620, labels: HOURS.map((x, i) => (i % 3 === 0 ? x : '')), line: hourAcc },
            ),
          ]),
        ),
      )}</div>
      <p class="takeaway">21 点那一个小时练得最多，也最准；深夜基本没有记录。</p>
    </section>`);

/* 回答按钮 */
push(`
    <section class="card stat" id="s-buttons">
      ${head('回答按钮', '214 次里各选了什么', rng('buttons', '1m'))}
      <div class="chartbox">${box(
        'buttons',
        '1m',
        Object.fromEntries(
          SP.map(([p]) => [
            p,
            barChart(
              buttonSets[p].map(([n, v, c]) => ({ v, c, tip: `${n} · ${v} 次` })),
              { w: 620, cap: 34, labels: buttonSets[p].map(([n]) => n) },
            ),
          ]),
        ),
      )}</div>
      <p class="takeaway">「良好」占了 55%，说明难度调得差不多；「简单」偏多，可以少给点。</p>
    </section>`);

/* 新增 */
push(`
    <section class="card stat" id="s-added">
      ${head('新增', '每周进了多少句', `${check('c1', '用时', false)}${rng('added', '1m')}`)}
      <div class="chartbox">${box('added', '1m', Object.fromEntries(SP.map(([p]) => {
        const vals = addedSets[p];
        const labels = p === '1m' ? vals.map((_, i) => i % 5 === 0 ? `${i + 1}日` : '') :
                       p === '3m' ? vals.map((_, i) => `第${i + 1}周`) :
                       vals.map((_, i) => ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'][i] || '');
        return [p, areaChart(vals, { w: 620, h: 170, labels })];
      })))}</div>
      <p class="takeaway">平均每周 6 句；上周只进了 2 句，是素材没跟上的那周。</p>
    </section>`);

screens.stats = shell(
  'stats.html',
  'stats',
  `
<main class="screen">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <!-- 面积图渐变 -->
      <linearGradient id="ac2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--s-purple)" stop-opacity=".5"/>
        <stop offset=".55" stop-color="var(--s-blue)" stop-opacity=".26"/>
        <stop offset="1" stop-color="var(--s-cyan)" stop-opacity="0"/>
      </linearGradient>
      <!-- 柱状图渐变 -->
      <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6B9DF3" stop-opacity="1"/>
        <stop offset="100%" stop-color="#4E7FE5" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-teal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#45D4B0" stop-opacity="1"/>
        <stop offset="100%" stop-color="#2FB898" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F4B84D" stop-opacity="1"/>
        <stop offset="100%" stop-color="#E89F2E" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ED766F" stop-opacity="1"/>
        <stop offset="100%" stop-color="#E04F47" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#66D489" stop-opacity="1"/>
        <stop offset="100%" stop-color="#4ABF6E" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5AD5F0" stop-opacity="1"/>
        <stop offset="100%" stop-color="#38BFE0" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="grad-blue-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4E7FE5" stop-opacity="1"/>
        <stop offset="100%" stop-color="#3B67C8" stop-opacity="1"/>
      </linearGradient>
    </defs>
  </svg>
  <header class="hdr">
    <div><h1>统计</h1></div>
    <div class="hdr-act">
      <span class="deck">
        <select class="sel" id="deck">
          <option>全部牌组</option>
          <option>卡片工厂 · 全部</option>
          <option>succumb</option>
          <option>run out of</option>
          <option>put off</option>
        </select>
      </span>
      <button class="btn ghost" id="exp" type="button">导出 PDF</button>
    </div>
  </header>

  <div class="sgrid">${statCards.join('')}</div>
  <div class="tip" id="tip" hidden></div>
</main>`,
  { menus: false },
);
/* 设置左导航：分组 + 当前项高亮 */
const setNav = (active) =>
  `<nav class="setnav">
        <div class="glab">界面</div>
        ${[
          ['appearance', '外观'],
          ['general', '通用'],
        ]
          .map(([id, name]) => `<a href="#${id}" data-sec="${id}" class="${id === active ? 'on' : ''}">${name}</a>`)
          .join('')}
        <div class="glab">能力</div>
        ${[
          ['interface', '接口'],
          ['agent', '智能体'],
          ['tools', '工具'],
        ]
          .map(([id, name]) => `<a href="#${id}" data-sec="${id}" class="${id === active ? 'on' : ''}">${name}</a>`)
          .join('')}
        <div class="glab">操作</div>
        <a href="#shortcuts" data-sec="shortcuts" class="${active === 'shortcuts' ? 'on' : ''}">快捷键</a>
        <div class="glab">其它</div>
        ${[
          ['data', '数据'],
          ['about', '关于'],
        ]
          .map(([id, name]) => `<a href="#${id}" data-sec="${id}" class="${id === active ? 'on' : ''}">${name}</a>`)
          .join('')}
      </nav>`;

const KEYS_GROUPS = [
  [
    '全局',
    [
      ['打开全局搜索', 'Ctrl K'],
      ['打开全局设置', 'Ctrl Alt ,'],
      ['打开当前页设置', 'Ctrl ,'],
      ['退出当前流程', 'Esc'],
    ],
  ],
  [
    '页面',
    [
      ['打开「卡片」', 'Ctrl 1'],
      ['打开「工厂」', 'Ctrl 2'],
      ['当前页搜索', 'Ctrl F'],
      ['关闭当前标签页', 'Ctrl W'],
      ['下一个标签页', 'Ctrl Tab'],
    ],
  ],
  [
    '练习',
    [
      ['显示答案', 'Space'],
      ['语音录制开关', 'Ctrl R'],
      ['搁置（今天不再出现，明天自动回来）', 'Shift S'],
      ['暂停（无限期，必须手动解除）', 'Shift P'],
      ['重置（进度清零）', 'Shift R'],
      ['信息（模板·历史·当前间隔·难度）', 'I'],
    ],
  ],
  [
    '评级',
    [
      ['重来', '1'],
      ['困难', '2'],
      ['良好', '3'],
      ['简单', '4'],
      ['撤销上一次评分', 'Ctrl Z'],
    ],
  ],
  [
    '音频',
    [
      ['重播音频', 'Ctrl Space'],
      ['暂停音频', 'Ctrl .'],
      ['录制自己的声音', 'Ctrl Shift R'],
      ['重播自己的声音', 'Ctrl Shift P'],
    ],
  ],
  [
    '编辑',
    [
      ['加粗', 'Ctrl B'],
      ['标记', 'Ctrl M'],
      ['删除', 'Del'],
    ],
  ],
];

screens.settings = shell('settings.html', 'gear', `
<main class="screen">
  <header class="hdr">
    <div><h1>全局设置</h1><div class="sub">卡片工厂-测试 · 0.1.0 · 本机<span class="setsec">· <span id="secname">外观</span></span></div></div>
  </header>

  <div class="setwrap">
    ${setNav('appearance')}
    <div class="setbody">

      <section class="group on" id="appearance">
        <div class="ghead"><h2>外观</h2><span class="mut">只管这台机器上的样子</span></div>

        <div class="field">
          <div><div class="lab">主题</div><div class="desc">深色按雾蓝玻璃做；浅色是晨雾蓝，同一套，不另画。</div></div>
          <div class="ctl"><span class="seg" data-set="theme"><span data-val="light">浅色</span><span class="on" data-val="dark">深色</span><span data-val="system">跟随系统</span></span></div>
        </div>

        <div class="field">
          <div><div class="lab">主题配色</div><div class="desc">只换强调色和光晕，中性面不动 —— 换配色不该把整个界面染一遍。</div></div>
          <div class="ctl">
            <div class="swatches">
              <div class="sw2 on" data-accent="mist"><i style="background:#97B1F0"></i><span>雾蓝</span></div>
              <div class="sw2" data-accent="daiqing"><i style="background:#8CB9D7"></i><span>黛青</span></div>
              <div class="sw2" data-accent="dusk"><i style="background:#B8ABD2"></i><span>暮紫</span></div>
              <div class="sw2" data-accent="turquoise"><i style="background:#8DBEB7"></i><span>松石</span></div>
              <div class="sw2" data-accent="amber"><i style="background:#CCAC87"></i><span>琥珀</span></div>
              <div class="sw2" data-accent="graphite"><i style="background:#E5E8ED"></i><span>石墨</span></div>
              <label class="sw2" data-accent="custom"><i style="background:linear-gradient(135deg,#97B1F0 50%,#BEAEDE 50%)"></i><input type="color" id="sw-custom" value="#97B1F0" title="挑一个颜色"><span>自定义</span></label>
            </div>
          </div>
        </div>

        <div class="field">
          <div><div class="lab">字体</div><div class="desc">正文一律系统无衬线；英文句子也不换衬线 —— 混排会变成拼盘。</div></div>
          <div class="ctl"><span class="seg" data-set="font"><span class="on" data-val="system">系统默认</span><span data-val="misans">MiSans</span><span data-val="source">思源黑体</span></span></div>
        </div>

        <div class="field">
          <div><div class="lab">字号</div><div class="desc">只缩放正文与句子，标题跟着按比例走。</div></div>
          <div class="ctl"><span class="seg" data-set="size"><span data-val="sm">小</span><span class="on" data-val="std">标准</span><span data-val="lg">大</span><span data-val="xl">特大</span></span></div>
          <div class="fprev">
            <div class="f1">I'm afraid I succumbed to temptation.</div>
            <div class="f2">周一早上十点，同事桌上的芝士蛋糕被你拿了一块。</div>
          </div>
        </div>

        <div class="field">
          <div><div class="lab">缩放</div><div class="desc">整块界面等比缩放，不改变排版比例。</div></div>
          <div class="ctl"><span class="stepper" data-stepper="zoom"><i data-step="-1">−</i><b>100%</b><i data-step="1">+</i></span></div>
        </div>
      </section>

      <section class="group" id="general">
        <div class="ghead"><h2>通用</h2></div>

        <div class="field">
          <div><div class="lab">语言</div><div class="desc">界面语言。英文之外的语言先占位。</div></div>
          <div class="ctl"><span class="seg" data-set="lang"><span class="on" data-val="zh">简体中文</span><span data-val="en">English</span><span class="off">其他语言（未做）</span></span></div>
        </div>

        <div class="field">
          <div><div class="lab">练完自动跳下一张</div><div class="desc">评完分就换下一句；关掉就留在这一句，自己按右下角「下一个」。</div></div>
          <div class="ctl"><button class="sw on" type="button" id="sw-autonext"></button></div>
        </div>

        <div class="field">
          <div><div class="lab">通知</div><div class="desc">到点提醒今天该练了；只在有到期卡片时才提醒。</div></div>
          <div class="ctl"><span class="badge-ok"><i></i>开着</span><button class="btn ghost" data-modal="m-notify" type="button">设置</button></div>
        </div>

        <div class="field">
          <div><div class="lab">权限</div><div class="desc">麦克风（说这一面要录音）、读文件（导入字幕）。</div></div>
          <div class="ctl"><span class="chip">麦克风 · 已允许</span><span class="chip">文件 · 已允许</span><button class="btn ghost" data-modal="m-perm" type="button">检查</button></div>
        </div>

        <div class="field">
          <div><div class="lab">隐私</div><div class="desc">录音只留在本机；不上传、不训练。账本就是一个 JSON。</div></div>
          <div class="ctl"><button class="btn ghost" data-modal="m-privacy" type="button">细节</button></div>
        </div>
      </section>

      <script>
      (function () {
        var b = document.getElementById('sw-autonext')
        if (!b) return
        var on = localStorage.getItem('kf-study:autonext') !== '0'
        b.classList.toggle('on', on)
        b.addEventListener('click', function () {
          var v = !b.classList.contains('on')
          b.classList.toggle('on', v)
          try { localStorage.setItem('kf-study:autonext', v ? '1' : '0') } catch (e) {}
        })
      })()
      </script>

      <section class="group" id="interface">
        <div class="ghead"><h2>接口</h2><span class="mut">常用的摆外面，细节折起来</span></div>

        <div class="nowrow">
          <div class="ncard">
            <div class="nt">大模型</div>
            <div class="nv">deepseek-chat</div>
            <div class="nu">跟随会话 · 温度 0.7</div>
            <button class="btn ghost">换</button>
          </div>
          <div class="ncard">
            <div class="nt">语音</div>
            <div class="nv">edge · Aria</div>
            <div class="nu">en-US · 语速 +0%</div>
            <button class="btn ghost">换</button>
          </div>
          <div class="ncard">
            <div class="nt">图片</div>
            <div class="nv">关</div>
            <div class="nu">练习不用图，造卡也不配</div>
            <button class="btn ghost">开</button>
          </div>
        </div>

        <button class="foldrow" type="button" data-modal="m-model"><span>大模型</span><span class="fsum">跟随会话 · 不填 key 也能用</span><span class="chev">›</span></button>

        <button class="foldrow" type="button" data-modal="m-voice"><span>语音</span><span class="fsum">edge · en-US-AriaNeural · +0%</span><span class="chev">›</span></button>

        <button class="foldrow" type="button" data-modal="m-image"><span>图片</span><span class="fsum">关 · 练习不用图</span><span class="chev">›</span></button>

        <button class="foldrow" type="button" data-modal="m-request"><span>请求</span><span class="fsum">直连 · 超时 60s · 重试 2 次</span><span class="chev">›</span></button>

        <div class="field">
          <div><div class="lab">连通性</div><div class="desc">最近一次：造句子调用成功 · 1.2 秒 · 用了 386 tokens。失败就直说原因，不糊。</div></div>
          <div class="ctl"><span class="badge-ok"><i></i>正常 · 1.2s</span><button class="btn ghost">全部测一遍</button></div>
        </div>

        <div class="field">
          <div><div class="lab">配置随手带</div><div class="desc">把这一页的设置（不含 key）导出成一份 JSON，换机器导入回去。</div></div>
          <div class="ctl"><button class="btn ghost">导出配置</button><button class="btn ghost">导入配置</button></div>
        </div>
      </section>

      <section class="group" id="agent">
        <div class="ghead"><h2>智能体</h2><span class="mut">让 DSH 直接读这个插件、改它、再接着迭代</span></div>

        <div class="field">
          <div><div class="lab">接入哪个 DSH</div><div class="desc">「跟随会话」就是此刻正在跟你说话的这个 —— 不用填地址、不用 token，插件把能力挂到已经开着的连接上。换机器或跑后台任务才用本机端口。</div></div>
          <div class="ctl"><span class="seg"><span class="on">跟随会话</span><span>本机端口</span><span>手动</span></span><span class="badge-ok"><i></i>已连</span></div>
        </div>

        <div class="field">
          <div><div class="lab">当前连接</div><div class="desc">会话 c14fed2f-df3a · 插件 dsh-etude-test 0.1.0 · RPC 通道 <b style="color:var(--fg2)">/etude-test</b> · 界面与 Agent 用同一套 handler</div></div>
          <div class="ctl"><span class="chip">只读先开</span><span class="chip">写操作要确认</span></div>
        </div>

        <div class="field" style="padding-bottom:4px">
          <div><div class="lab">给它哪些手</div><div class="desc">勾上的才出现在它的工具表里；关掉的动作它连名字都看不到，不是调了被拒。</div></div>
          <div class="ctl"><span class="chip accent">默认 6 项</span></div>
        </div>

        <div class="perms">
          ${[
            ['读练习账本 · practice.summary', true],
            ['改设置 · settings.patch', true],
            ['改提示词模板 · prompt.write', true],
            ['跑造卡任务 · factory.build', true],
            ['导入字幕挖句 · source.import', true],
            ['导出报告 · report.export', true],
            ['改代码并重载 · plugin.patch', false],
            ['删数据 · data.reset', false],
          ]
            .map(
              ([t, on]) => `<div class="perm"><span>${t}</span><span class="sw${on ? ' on' : ''}"><i></i></span></div>`,
            )
            .join('')}
        </div>

        <div class="field">
          <div><div class="lab">提示词模板</div><div class="desc">造句子、补中文场景、写英英释义各一份。它改完要保存成新版本，旧的留着能回滚。</div></div>
          <div class="ctl"><span class="chip">system v3</span><span class="chip">造句 v5</span><span class="chip">场景 v2</span><button class="btn ghost">编辑</button></div>
        </div>

        <div class="field">
          <div><div class="lab">让它自己看一遍</div><div class="desc">跑一遍体检：账本有没有坏句子、模板有没有自相矛盾、哪些面一直卡住。产出的是清单，不直接动手改。</div></div>
          <div class="ctl"><button class="btn ghost">开始体检</button><button class="btn primary">看上次的 3 条建议</button></div>
        </div>

        <div class="field">
          <div><div class="lab">按建议改</div><div class="desc">打开后它可以直接改配置和模板，改之前自动存一份；代码改动一律要你点头。</div></div>
          <div class="ctl"><span class="chip">改配置 · 自动存</span><span class="chip">改代码 · 要确认</span><span class="sw on"><i></i></span></div>
        </div>

        <div class="field" style="display:block">
          <div class="lab" style="margin-bottom:6px">最近动过什么</div>
          <button class="foldrow" type="button" data-modal="m-log"><span>23:41 改模板 · 22:06 改配置 · 21:58 体检</span><span class="fsum">4 条</span><span class="chev">›</span></button>
        </div>

        <div class="field">
          <div><div class="lab">安全</div><div class="desc">只认本机回环；写操作逐次确认；每次改动前自动备份，出问题一键回到上一版。</div></div>
          <div class="ctl"><span class="chip">仅本机</span><span class="chip">改前备份</span><button class="btn ghost">回到上一版</button></div>
        </div>

        <div class="field">
          <div><div class="lab">给它的说明书</div><div class="desc">一份契约文件，写清每个动作的入参出参和边界。它读这个就知道能做什么、不能做什么。</div></div>
          <div class="ctl"><button class="btn ghost">打开工具表</button><button class="btn ghost">导出契约</button><button class="btn ghost">复制提示词</button></div>
        </div>
      </section>

      <section class="group" id="tools">
        <div class="ghead"><h2>工具</h2></div>

        <div class="field">
          <div><div class="lab">个性化</div><div class="desc">每天多少分钟、每天放几个新说法、练的时候出不出声、说这一面要不要计时。</div></div>
          <div class="ctl"><span class="chip">12 分钟</span><span class="chip">2 个说法</span><span class="chip">出声</span><button class="btn ghost" data-modal="m-personal" type="button">调整</button></div>
        </div>

        <div class="field">
          <div><div class="lab">造卡默认</div><div class="desc">一个说法造几句、每句几种中文说法、要不要顺手把候选图配齐。</div></div>
          <div class="ctl"><span class="chip">4 句</span><span class="chip">3 种说法</span><span class="chip">配图 关</span><button class="btn ghost" data-modal="m-card" type="button">调整</button></div>
        </div>

        <div class="field">
          <div><div class="lab">素材</div><div class="desc">导入的字幕放哪、挖出来的句子是先进草稿还是直接进句库。</div></div>
          <div class="ctl"><span class="chip">先进草稿</span><button class="btn ghost" data-modal="m-source" type="button">调整</button><button class="btn ghost">打开目录</button></div>
        </div>

        <div class="field">
          <div><div class="lab">实验</div><div class="desc">还没做完的开关放这里，默认全关；开了出问题不用报，直接关掉。</div></div>
          <div class="ctl"><button class="btn ghost" data-modal="m-exp" type="button">看看有哪些</button></div>
        </div>
      </section>

      <section class="group" id="shortcuts">
        <div class="ghead"><h2>快捷键</h2><span class="mut">27 个动作 · 分 6 组 · 全部可改</span></div>

        <div class="field" style="padding:12px 0 6px">
          <div class="ksearch"><svg viewBox="0 0 18 18">${ICON.search}</svg><span>搜动作或键位…</span><span class="kbd" style="margin-left:auto">Ctrl F</span></div>
          <div class="ctl"><button class="btn ghost">恢复默认</button></div>
        </div>

        <div class="kgroups">
          ${KEYS_GROUPS.map(
            ([g, rows]) => `<div class="kgrp">
            <div class="kgh"><span>${g}</span><span class="mut">${rows.length}</span></div>
            ${rows
              .map(
                ([label, key]) => `<div class="krow"><span>${label}</span><span class="kbd kb" title="点一下就能改">${key}</span></div>`,
              )
              .join('')}
          </div>`,
          ).join('')}
        </div>
        <div class="keyhint">点键位直接按新键，Esc 取消；撞车会当场标红让你二选一。</div>
        <button class="foldrow" type="button" data-modal="m-shortcut"><span>没有你想要的快捷键？</span><span class="fsum">去 DSH 加一个</span><span class="plus">＋</span></button>
      </section>

      <section class="group" id="data">
        <div class="ghead"><h2>数据</h2><span class="mut">账本 · 素材 · 音频</span></div>

        <div class="field">
          <div><div class="lab">数据备份与恢复</div><div class="desc">导出一份账本 + 素材清单；换机器时导入回去。</div></div>
          <div class="ctl"><button class="btn ghost">备份</button><button class="btn ghost">恢复</button></div>
        </div>

        <div class="field">
          <div><div class="lab">数据目录</div><div class="desc">%LOCALAPPDATA%\\dsh-etude-test\\ · 当前 4.2 MB</div></div>
          <div class="ctl"><button class="btn ghost">打开目录</button><button class="btn ghost" data-modal="m-datadir" type="button">更改存放位置</button></div>
        </div>

        <div class="field">
          <div><div class="lab">清除缓存</div><div class="desc">只清合成的音频，账本和句子不动；清完还能重新合成。</div></div>
          <div class="ctl"><span class="chip">可清 1.8 MB</span><button class="btn ghost">清除</button></div>
        </div>

        <div class="field">
          <div><div class="lab">迁移数据</div><div class="desc">把整个数据目录搬到别处，路径记住，下次还从这个位置读。</div></div>
          <div class="ctl"><button class="btn ghost" data-modal="m-datadir" type="button">改到这里</button></div>
        </div>

        <div class="field">
          <div><div class="lab">导入 / 导出</div><div class="desc">导入字幕或别人的账本；导出成 JSON 或一份可读的清单。</div></div>
          <div class="ctl"><button class="btn ghost">导入</button><button class="btn ghost">导出</button></div>
        </div>

        <div class="field">
          <div><div class="lab danger">重置数据</div><div class="desc">进度清零，句子、素材、音频全部删掉。删除不可撤销 —— 先做一次备份。</div></div>
          <div class="ctl"><button class="btn ghost danger">重置…</button></div>
        </div>
      </section>

      <section class="group" id="about">
        <div class="ghead"><h2>关于</h2></div>

        <div class="field">
          <div><div class="lab">版本</div><div class="desc">卡片工厂-测试 0.1.0 · 后端账本已跑通，界面还没接</div></div>
          <div class="ctl"><span class="chip">0.1.0</span></div>
        </div>

        <div class="field">
          <div><div class="lab">检查更新</div><div class="desc">目前是本地插件，没有发布渠道，检查更新先留位。</div></div>
          <div class="ctl"><button class="btn ghost">检查</button></div>
        </div>

        <div class="field">
          <div><div class="lab">自动检查更新</div><div class="desc">每次启动查一次；没有渠道时不发请求。</div></div>
          <div class="ctl"><span class="sw"><i></i></span></div>
        </div>

        <div class="field">
          <div><div class="lab">项目地址</div><div class="desc">github.com/whyao56/dsh-etude</div></div>
          <div class="ctl"><a class="btn ghost" href="https://github.com/whyao56/dsh-etude" target="_blank" rel="noreferrer">打开</a></div>
        </div>
      </section>

    </div>
  </div>

      <!-- ── 设置里的弹窗（一）── -->
      <div class="mask" id="m-notify" hidden><div class="sheet sm">
        <div class="shead"><h3>通知</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">到点提醒</div><div class="sd">每天 21:00 提醒一次；今天已经练过就不响。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">只在有到期卡片时提醒</div><div class="sd">没有到期的面就安静，不为了刷存在感发通知。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">连续 3 天没练再催</div><div class="sd">断一天不算断，第三天开始每天一次。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">声音</div><div class="sd">系统提示音；关掉就只剩一条角标。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
          <div class="snote">通知由操作系统发出，这里只负责到点。系统那边关掉了这里也不报错。</div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">关掉</button><button class="btn primary" data-close type="button">知道了</button></div>
      </div></div>

      <div class="mask" id="m-perm" hidden><div class="sheet">
        <div class="shead"><h3>权限</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">麦克风</div><div class="sd">只在「说」这一面录音；松手就停，不后台录。</div></div><div class="sr"><span class="badge-ok"><i></i>已允许</span></div></div>
          <div class="srow"><div><div class="sl">读文件</div><div class="sd">导入字幕、读素材目录；只读你选中的，不扫盘。</div></div><div class="sr"><span class="badge-ok"><i></i>已允许</span></div></div>
          <div class="srow"><div><div class="sl">写文件</div><div class="sd">写数据目录、导出卡片包到下载目录。</div></div><div class="sr"><span class="badge-ok"><i></i>已允许</span></div></div>
          <div class="srow"><div><div class="sl">剪贴板</div><div class="sd">「复制提示词」用；不读剪贴板里的内容。</div></div><div class="sr"><span class="chip">按需请求</span></div></div>
          <div class="srow"><div><div class="sl">网络</div><div class="sd">造句子、合成语音、找图；走你填的代理。</div></div><div class="sr"><span class="badge-ok"><i></i>已允许</span></div></div>
          <div class="srow"><div><div class="sl">开机自启</div><div class="sd">关着。插件不该自己开机。</div></div><div class="sr"><span class="chip">关</span></div></div>
          <div class="snote">权限是系统的事，这里只把「拿它做什么」讲清楚。</div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">关掉</button><button class="btn primary" id="perm-check" type="button">重新检查</button></div>
      </div></div>

      <div class="mask" id="m-privacy" hidden><div class="sheet">
        <div class="shead"><h3>隐私</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">存在本机的</div><div class="sd">练习账本（一个 JSON）、导入的字幕原文、合成出来的音频、你自己录的音。</div></div></div>
          <div class="srow"><div><div class="sl">不做的</div><div class="sd">不上传账本、不拿你的句子训练、不做使用统计。接口页填的 key 只写在本机配置里。</div></div></div>
          <div class="srow"><div><div class="sl">会出网的只有</div><div class="sd">造句子（发目标词和提示词）、合成语音（发句子文本）、找图（发关键词）。都不带练习记录。</div></div></div>
          <div class="srow"><div><div class="sl">删起来多干净</div><div class="sd">删数据目录就是全没了；没有云端副本，也没有埋在别处的回收站。</div></div></div>
          <div class="snote">现在的位置：<b>%LOCALAPPDATA%/dsh-etude-test/</b></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">关掉</button><button class="btn primary" data-close type="button">知道了</button></div>
      </div></div>

      <div class="mask" id="m-model" hidden><div class="sheet">
        <div class="shead"><h3>大模型</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">服务商</div><div class="sd">留「跟随会话」就借当前对话的模型，不额外填 key。</div></div><div class="sr"><span class="seg"><span class="on">跟随会话</span><span>DeepSeek</span><span>OpenAI 兼容</span><span>自定义</span></span></div></div>
          <div class="srow"><div><div class="sl">Base URL</div><div class="sd">OpenAI 兼容格式，带不带 /v1 都认。</div></div><div class="sr"><span class="inp wide">api.deepseek.com/v1</span></div></div>
          <div class="srow"><div><div class="sl">API Key</div><div class="sd">只存本机；显示时打码到后四位。</div></div><div class="sr"><span class="inp">sk-••••••4f2c</span><button class="btn ghost" type="button">显示</button></div></div>
          <div class="srow"><div><div class="sl">模型</div><div class="sd">造句子用便宜的就够；补场景和英英释义建议强一点。</div></div><div class="sr"><span class="inp">deepseek-chat</span><span class="chip">温度 0.7</span></div></div>
          <div class="srow"><div><div class="sl">深度思考</div><div class="sd">开着更准也更慢；批量造卡建议关。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn ghost" data-close type="button">测一下</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-voice" hidden><div class="sheet sm">
        <div class="shead"><h3>语音</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">引擎</div><div class="sd">Edge 不要 key；OpenAI 兼容要 base + key。</div></div><div class="sr"><span class="seg"><span class="on">Edge</span><span>OpenAI</span><span>本地</span></span></div></div>
          <div class="srow"><div><div class="sl">音色</div><div class="sd">en-US · Aria，女声，最像真人。</div></div><div class="sr"><span class="inp">en-US-AriaNeural</span></div></div>
          <div class="srow"><div><div class="sl">语速</div><div class="sd">按引擎换算：Edge 用 rate，OpenAI 用 speed。</div></div><div class="sr"><span class="chip">+0%</span></div></div>
          <div class="srow"><div><div class="sl">优先原声</div><div class="sd">字幕能抠出原声就用原声，抠不出来才合成。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn ghost" data-close type="button">试听</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-image" hidden><div class="sheet sm">
        <div class="shead"><h3>图片</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">来源</div><div class="sd">练习不用图；造卡时用图库检索，不是生图。</div></div><div class="sr"><span class="seg"><span class="on">关</span><span>图库</span><span>自定义</span></span></div></div>
          <div class="srow"><div><div class="sl">像素预检</div><div class="sd">48×48 上算方差、二阶差分、唯一色占比，糊图不进候选。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">每句候选数</div><div class="sd">挑图时一次给几张。</div></div><div class="sr"><span class="chip">9 张</span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-request" hidden><div class="sheet sm">
        <div class="shead"><h3>请求</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">代理</div><div class="sd">不走就留空；走就填 http://127.0.0.1:7897。</div></div><div class="sr"><span class="inp">（空）</span></div></div>
          <div class="srow"><div><div class="sl">超时</div><div class="sd">到点就断，不无限等。</div></div><div class="sr"><span class="chip">60s</span></div></div>
          <div class="srow"><div><div class="sl">重试</div><div class="sd">只重试网络层失败，不重试「答得不好」。</div></div><div class="sr"><span class="chip">2 次</span></div></div>
          <div class="srow"><div><div class="sl">并发</div><div class="sd">同时发几个请求；网络差就降到 1。</div></div><div class="sr"><span class="chip">2</span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <!-- ── 设置里的弹窗（二）── -->
      <div class="mask" id="m-log" hidden><div class="sheet">
        <div class="shead"><h3>最近动过什么</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">23:41 · 改模板</div><div class="sd">把「造句」模板的「一条一句」换成「一条一个场景」。旧版本留着，能回滚。</div></div><div class="sr"><span class="chip">模板 v5</span></div></div>
          <div class="srow"><div><div class="sl">22:06 · 改配置</div><div class="sd">每天新句上限 3 → 2，理由写在建议里：「连续三天练不完，先降量」。</div></div><div class="sr"><span class="chip">配置</span></div></div>
          <div class="srow"><div><div class="sl">21:58 · 体检</div><div class="sd">37 句里有 2 句场景是编的，标了待换；没有直接改。</div></div><div class="sr"><span class="chip">只报告</span></div></div>
          <div class="srow"><div><div class="sl">21:40 · 你说的话</div><div class="sd">「别把读这一面变成精读」—— 已记进提示词模板的偏好段。</div></div><div class="sr"><span class="chip">偏好</span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">关掉</button><button class="btn primary" data-close type="button">回到上一版</button></div>
      </div></div>

      <div class="mask" id="m-personal" hidden><div class="sheet sm">
        <div class="shead"><h3>个性化</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">每天练多久</div><div class="sd">到点提醒，练不完就顺延。</div></div><div class="sr"><span class="chip">12 分钟</span></div></div>
          <div class="srow"><div><div class="sl">每天放几个新说法</div><div class="sd">超了当天不再给新词。</div></div><div class="sr"><span class="chip">2 个</span></div></div>
          <div class="srow"><div><div class="sl">练的时候出声</div><div class="sd">关掉就只做读、打、听。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">说这一面计时</div><div class="sd">只记时长，不判分。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-card" hidden><div class="sheet sm">
        <div class="shead"><h3>造卡默认</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">一个说法造几句</div><div class="sd">少于 3 句场景不够用。</div></div><div class="sr"><span class="chip">4 句</span></div></div>
          <div class="srow"><div><div class="sl">每句几种中文说法</div><div class="sd">听这一面要用它做干扰项。</div></div><div class="sr"><span class="chip">3 种</span></div></div>
          <div class="srow"><div><div class="sl">顺手配候选图</div><div class="sd">练习不用图，只在导出卡片包时才需要。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">造完自动合成语音</div><div class="sd">还没配语音的句子一起补上。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-source" hidden><div class="sheet sm">
        <div class="shead"><h3>素材</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">导入的字幕放哪</div><div class="sd">跟数据目录一起走，默认在 sources/。</div></div><div class="sr"><button class="btn ghost" type="button">打开目录</button></div></div>
          <div class="srow"><div><div class="sl">挖出来的句子</div><div class="sd">先进草稿，你点头才进句库。</div></div><div class="sr"><span class="seg"><span class="on">先进草稿</span><span>直接进句库</span></span></div></div>
          <div class="srow"><div><div class="sl">同一个说法不重复收</div><div class="sd">再遇到就算这张卡的一个新场景。</div></div><div class="sr"><span class="sw on"><i></i></span></div></div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" data-close type="button">存下</button></div>
      </div></div>

      <div class="mask" id="m-exp" hidden><div class="sheet sm">
        <div class="shead"><h3>实验</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">影子跟读</div><div class="sd">原句播一遍，你跟着念；不判分，只记录。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">阶梯改成 1.3 倍</div><div class="sd">1/2/4/8/16/32 换成更陡的一档试试。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="srow"><div><div class="sl">读这一面加计时</div><div class="sd">超过 8 秒算没想清楚。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="snote">开了出问题不用报，直接关掉。</div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">关掉</button></div>
      </div></div>

      <div class="mask" id="m-datadir" hidden><div class="sheet">
        <div class="shead"><h3>改数据存放位置</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">现在的位置</div><div class="sd">%LOCALAPPDATA%/dsh-etude-test/ · 当前 4.2 MB</div></div></div>
          <div class="srow"><div><div class="sl">新的位置</div><div class="sd">换了之后账本、素材、音频一起搬过去。</div></div>
            <div class="sr"><span class="inp wide" contenteditable="true">D:/卡片工厂数据</span><button class="btn ghost" type="button">选择…</button></div></div>
          <div class="srow"><div><div class="sl">搬完删掉旧目录</div><div class="sd">确认新位置能读能写再删；不确认不删。</div></div><div class="sr"><span class="sw"><i></i></span></div></div>
          <div class="snote">路径会记住；下次启动直接从新位置读。</div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" id="dd-go" type="button">改到这里</button></div>
      </div></div>

      <div class="mask" id="m-shortcut" hidden><div class="sheet">
        <div class="shead"><h3>没有你想要的快捷键？</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="snote" style="padding-top:0">下面这段是给 DeepSeek Harness 的提示词。点「去 DSH 说」会开一个新会话，提示词已经带过去。</div>
          <pre class="prompt" id="sc-prompt">我想给「卡片工厂」加一个快捷键动作。

- 插件：dsh-etude-test（F:/dsharness/dsh-etude-test）
- 界面：mock/ 下的静态稿；按键绑定在 app.js，页面由 gen.mjs 生成
- 要加的动作：「____」（写清楚在哪一页生效、按下去做什么）
- 键位：留空就你自己挑，避开已经用掉的 Ctrl K / Ctrl F / Space / 1–4 / Esc
- 改完要：① 加进 KEYS_GROUPS 对应分组 ② 真正绑上事件 ③ 在快捷键页能看到
- 别动其它东西；改完告我改了哪几行

先读 gen.mjs 和 app.js，再动手。</pre>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn ghost" id="sc-copy" type="button">复制提示词</button><a class="btn primary" href="http://127.0.0.1:13129/" target="_blank" rel="noreferrer">去 DSH 说</a></div>
      </div></div>

      <div class="mask" id="m-custom" hidden><div class="sheet sm">
        <div class="shead"><h3>自定义配色</h3><button class="x" data-close type="button">✕</button></div>
        <div class="sbody">
          <div class="srow"><div><div class="sl">强调色</div><div class="sd">你只挑一个色，深色版和浅色版自动调出来，不用配四份。</div></div>
            <div class="sr picker"><input type="color" id="ac-pick" value="#97B1F0"><span class="chip" id="ac-val">#97B1F0</span></div></div>
          <div class="srow"><div><div class="sl">预览</div><div class="sd">主按钮、选中项、进度环都用这一个色。</div></div>
            <div class="sr"><button class="btn primary" type="button" style="pointer-events:none">开始 · 12 分钟</button></div></div>
          <div class="snote">中性面（背景、卡片、文字）永远不动 —— 换配色不该把整个界面染一遍。</div>
        </div>
        <div class="sfoot"><button class="btn ghost" data-close type="button">取消</button><button class="btn primary" id="ac-go" type="button">用这个色</button></div>
      </div></div>

</main>`, { menus: false });

/* ───────── 教程（独立页） ───────── */
screens.tutorial = shell('tutorial.html', '', `
<main class="screen">
  <header class="hdr">
    <div><h1>教程</h1><div class="sub">这个插件为什么长成这样 · 读一遍大概四分钟</div></div>
    <div class="act"><a class="btn ghost" href="./cards.html">回卡片</a></div>
  </header>

  <div class="docwrap">
    <nav class="docnav">
      <a href="#why">为什么是句子</a>
      <a href="#face">五个面</a>
      <a href="#day">一天怎么过</a>
      <a href="#use">使用指南</a>
      <a href="#privacy">隐私</a>
      <a href="#faq">常见问题</a>
    </nav>

    <article class="doc">
      <h2 id="why">为什么不是「一个词八张卡」</h2>
      <p>《学习观 07》把学一门外语拆成了八步。老插件只做到第 4 步的一半：给一个词造 8 条例句、配图、配语音，然后打包。第 5 步（打字）和第 7 步（说话）根本没有 —— 而把声音和意思连起来，恰恰发生在那两步。</p>
      <p class="quote">学习原则：1. 明确任务的输入输出 2. 用例子重塑大脑连接</p>
      <p>所以这里换了起点：<b>不是给一个词造八张卡，是给一句话派五个任务</b>。一句话配一个真实场景，五个面各自把「输入是什么、输出是什么」说清楚。读是英文进、画面出；打是意思进、拼写出；听是声音进、意思出；说是意思进、声音出；改是原句进、换词后的句子出。</p>

      <h2 id="face">五个面，各有一条时间线</h2>
      <ul>
        <li><b>读</b> · 输入英文，输出画面。自评：想清楚了 / 没想清楚。别读出声。</li>
        <li><b>打</b> · 给中文场景，打英文。逐词比对，错在哪标哪。</li>
        <li><b>听</b> · 放语音，选意思是哪一个。没听懂可以再放，但别看字。</li>
        <li><b>说</b> · 给中文场景，说出来。只录音、自己回放，<b>不判分</b> —— 判分只会让你想着躲开这一面。</li>
        <li><b>改</b> · 给原句和换词要求，改完看意思变了没有。</li>
      </ul>
      <p>为什么五个面不合成一个「熟练度」：这句话我读得懂、但说不出来，是一个真实状态。合成一个数就看不见了。</p>

      <h2 id="day">一天怎么过</h2>
      <p>打开先看「卡片」：今天该练哪些面，是按每条线各自的到期日算出来的，不是随机的。等到期的先来，卡过次数多的往前排，新句子最后。一天十几分钟，练不完就顺延，不用补。</p>
      <p>判定只有四种：过了升一档（1 → 2 → 4 → 8 → 16 → 32 天），想不起来但认得就留在原地，没过归零，跳过只推到明天。</p>

      <h2 id="use">使用指南</h2>
      <ul>
        <li>句子从你看过的东西里挖：字幕、视频、贴一段文本。<b>别让模型编</b> —— 编出来的句子语法对、语域不对。</li>
        <li>「收进来」之后它才进句库；素材文件删了也不影响练习记录。</li>
        <li>快捷键可以在「全局设置 → 快捷键」里全改一遍。</li>
        <li>停在某一面超过两秒会记「卡」；卡住次数只用来排序，不惩罚。</li>
      </ul>

      <h2 id="privacy">隐私</h2>
      <p>练习账本就是一个 JSON 文件，在 <code>%LOCALAPPDATA%\\dsh-etude-test\\practice\\ledger.json</code>。录音留在本机，不上传，不拿去训练。想搬走就整个目录拷过去。</p>

      <h2 id="faq">常见问题</h2>
      <ul>
        <li><b>能不能只练一个面？</b> 能。句库里点某个面单独练，队列会按那个面排。</li>
        <li><b>为什么说这一面没有分？</b> 因为自动打分不准，而人对着分练会变形。自己回放听得出来就行。</li>
        <li><b>造卡那一块呢？</b> 这一版先做样子，模型那半还没接。</li>
      </ul>
    </article>
  </div>
</main>`);

/* ───────── 全局搜索（叠在卡片页上的那一层） ───────── */
const PALETTE = `<div class="palmask">
<div class="palette">
  <div class="pal-in"><svg viewBox="0 0 18 18" class="pi">${ICON.search}</svg><span class="ph">搜句子、说法、设置、快捷键…</span><span class="kbd">Esc</span></div>
  <div class="pal-body">
    <div class="pal-sec"><span>句子</span></div>
    <div class="pal-item on" data-go="./library.html"><span class="en">I'm afraid I succumbed to temptation…</span><span class="mut">打 · 卡 3 次</span></div>
    <div class="pal-item"><span class="en">We ran out of coffee again.</span><span class="mut">说 · 今天到期</span></div>
    <div class="pal-sec"><span>页面</span></div>
    <div class="pal-item"><span>工厂 · 挖句</span><span class="mut">Ctrl 2</span></div>
    <div class="pal-item"><span>统计</span><span class="mut">Ctrl 3</span></div>
    <div class="pal-sec"><span>设置</span></div>
    <div class="pal-item"><span>接口 · 大模型</span><span class="mut">跟随会话</span></div>
    <div class="pal-item"><span>快捷键 · 评级 · 良好</span><span class="mut">3</span></div>
  </div>
  <div class="pal-foot"><span><span class="kbd">↑</span><span class="kbd">↓</span> 选</span><span><span class="kbd">Enter</span> 打开</span><span class="closable"><span class="kbd">Esc</span> 关 · 点旁边也行</span><span class="mut" style="margin-left:auto">还有 4 条，接着打</span></div>
</div>
</div>
<style>body{overflow:hidden}</style>`;

/* palette 不再是独立页面：改成 palette.js 注入到每一页（Ctrl+K） */


/* ───────── 挖句台（借 Migaku / VocabSieve：视频 + 逐词字幕 + 点词查） ───────── */
const SUBS = [
  ['12:38', "We're completely out of coffee.", true],
  ['12:41', "I'll make it up to you, I promise.", false],
  ['12:46', "You always put things off until it's too late.", false],
  ['12:52', "Nobody even showed up.", true],
  ['12:57', "So we just sat there and said nothing.", false],
  ['13:04', "That's not the point, and you know it.", false],
  ['13:09', "Fine. I'll take care of it tomorrow.", true],
  ['13:15', "You said that last week too.", false],
  ['13:21', "Okay, okay. Let's drop it.", false],
];

const words = (text, mined) =>
  text
    .split(' ')
    .map((w) => {
      const clean = w.replace(/[^A-Za-z']/g, '').toLowerCase();
      const hit = mined.includes(clean);
      const hot = clean === 'put';
      return `<span class="w${hit ? ' mined' : ''}${hot ? ' hot' : ''}">${w}</span>`;
    })
    .join(' ');

screens.mine = shell('mine.html', 'factory', `
<main class="screen">
  <header class="hdr">
    <div><h1>挖句</h1><div class="sub">老友记 S02E03 · 12:38 — 13:24 · 原声已对齐，逐词可点</div></div>
    <div class="act">
      <span class="chip">已挖 12 句</span>
      <a class="btn ghost" href="./factory.html">回工厂</a>
      <a class="btn primary" href="./library.html">进句库</a>
    </div>
  </header>

  <div class="minewrap">
    <section class="card player">
      <div class="vid">
        <div class="vframe"><span class="vplay"><svg viewBox="0 0 18 18">${ICON.play}</svg></span></div>
        <div class="vtime">12:41 / 22:04</div>
      </div>
      <div class="vbar"><i style="width:31%"></i></div>
      <div class="vctl">
        <span class="kbd">Space</span><span class="hint">播放</span>
        <span class="kbd">←</span><span class="kbd">→</span><span class="hint">上一句 / 下一句</span>
        <span class="kbd">Enter</span><span class="hint">收这一句</span>
      </div>
      <div class="divider"></div>
      <div class="vtrack"><span class="mut">音轨</span><span class="wave">${Array.from({ length: 46 }, (_, i) => `<i class="${i < 16 ? 'on' : ''}" style="height:${8 + ((i * 7) % 15)}px"></i>`).join('')}</span></div>


    
      <div class="divider"></div>
      <div class="row"><span class="sec-title">这一段里的说法</span><span class="mut" style="margin-left:auto">4 个</span></div>
      <div class="chips">
        <span class="chip accent">put off · 往后拖</span><span class="chip">show up · 露面</span><span class="chip">take care of · 处理</span><span class="chip">drop it · 别说了</span>
      </div>
      <p class="mut" style="font-size:11px;line-height:1.7;margin:0">同一个说法在别处再出现，只会算成这张卡的一个新场景，不会重复收。</p></section>

    <section class="card subs">
      <div class="row"><span class="sec-title">字幕</span><span class="mut" style="margin-left:auto">点词查 · 点整行收</span></div>
      <div class="sublines">
        ${SUBS.map(
          ([t, en, done], i) => `<div class="subline${i === 2 ? ' on' : ''}${done ? ' done' : ''}">
            <span class="t">${t}</span>
            <span class="en">${words(en, ['out', 'coffee', 'make', 'put', 'things', 'off', 'late'])}</span>
            <span class="smark">${done ? '已收' : i === 2 ? '收这句' : ''}</span>
          </div>`,
        ).join('')}
      </div>

      <div class="pop">
        <div class="pophead"><span class="pw">put off</span><span class="ipa">/pʊt ɒf/</span><span class="chip">词频 3,410</span></div>
        <div class="poplemma">原形 <b>put off</b> · 动词短语 · 可拆分（put it off）</div>
        <div class="popdef">to delay doing something until later, especially because you do not want to do it.</div>
        <div class="popfoot"><span class="mut">点自 12:46 · 老友记 S02E03</span><span class="sp"></span><button class="btn ghost">换一句</button><button class="btn primary">收这句</button></div>
      </div>
    </section>
  </div>

  <section class="card">
    <div class="row"><span class="sec-title">收进来是这样</span><span class="mut" style="margin-left:auto">正面 · 背面</span></div>
    <div class="cardprev">
      <div class="mini front">
        <div class="miniimg"><span class="mut">12:41 的画面</span></div>
        <div class="minien">I'm afraid I succumbed to temptation and had a piece of cheesecake.</div>
        <div class="miniaudio"><span class="kbd">▶</span><span class="mut">3.2s · 原声</span></div>
      </div>
      <div class="mini back">
        <div class="minizh">周一早上十点，同事桌上的芝士蛋糕，你没忍住拿了一块。</div>
        <div class="minitags"><span class="chip">succumb</span><span class="chip">屈服 · 扛不住</span><span class="chip">B1</span></div>
        <div class="minisrc">老友记 S02E03 · 12:41</div>
      </div>
    </div>
  </section>
</main>`);

/* ───────── 句子详情（借 twenty 的记录抽屉 + Anki 的卡片信息） ───────── */
screens.detail = shell('detail.html', 'cards', `
<main class="screen">
  ${(() => {
    const lib = screens.library;
    return lib.slice(lib.indexOf('<main class="screen">'), lib.indexOf('</main>') + 7);
  })()}
  <div class="dmask"></div>
  <aside class="drawer">
    <div class="dhead">
      <div>
        <div class="dtitle">I'm afraid I succumbed to temptation and had a piece of cheesecake.</div>
        <div class="dsub">succumb · 说法 · 老友记 S02E03 · 12:41</div>
      </div>
      <span class="iconbtn"><svg viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14"/></svg></span>
    </div>

    <div class="dsec">
      <div class="dsech">五个面</div>
      ${[
        ['读', '已过', '档 4 · 4 天后', 'ok'],
        ['打', '卡住', '档 1 · 明天 · 卡 3 次', 'warn'],
        ['听', '已过', '档 3 · 2 天后', 'ok'],
        ['说', '没开始', '—', ''],
        ['改', '没开始', '—', ''],
      ]
        .map(
          ([f, st, note, cls]) => `<div class="drow"><span class="pip ${cls}"></span><span class="df">${f}</span><span class="dst">${st}</span><span class="mut" style="margin-left:auto">${note}</span></div>`,
        )
        .join('')}
    </div>

    <div class="dsec">
      <div class="dsech">卡片信息</div>
      <div class="dgrid">
        <div><div class="mut">当前间隔</div><div class="dv">4 天</div></div>
        <div><div class="mut">难度</div><div class="dv">偏难</div></div>
        <div><div class="mut">复习次数</div><div class="dv">7 次</div></div>
        <div><div class="mut">首次</div><div class="dv">10月22日</div></div>
      </div>
    </div>

    <div class="dsec">
      <div class="dsech">最近七次</div>
      ${[
        ['10月30日', '打', '卡住', 'warn'],
        ['10月29日', '打', '卡住', 'warn'],
        ['10月27日', '打', '过了', 'ok'],
        ['10月26日', '听', '过了', 'ok'],
        ['10月24日', '读', '过了', 'ok'],
      ]
        .map(
          ([d, f, v, cls]) => `<div class="drow"><span class="mut" style="width:76px">${d}</span><span class="df">${f}</span><span class="pip ${cls}"></span><span class="mut" style="margin-left:auto">${v}</span></div>`,
        )
        .join('')}
    </div>

    <div class="dsec">
      <div class="dsech">这一句</div>
      <div class="drow"><span class="kbd">▶</span><span class="df" style="width:auto">原声 3.2s</span><span class="mut" style="margin-left:auto">edge · Aria</span></div>
      <div class="drow"><span class="df" style="width:auto">说法</span><span class="mut" style="margin-left:auto">succumb · 屈服、扛不住</span></div>
      <div class="drow"><span class="df" style="width:auto">场景</span><span class="mut" style="margin-left:auto;text-align:right;max-width:250px">周一早上十点，同事桌上的芝士蛋糕</span></div>
      <div class="drow"><span class="df" style="width:auto">出处</span><span class="mut" style="margin-left:auto">老友记 S02E03 · 12:41 · 在挖句台打开</span></div>
    </div>
    <div class="dfoot">
      <button class="btn ghost">搁置</button>
      <button class="btn ghost">重置</button>
      <span class="sp"></span>
      <button class="btn primary">现在练这一句</button>
    </div>
  </aside>
</main>`);


/* ── 启动页：不套 shell，一张整屏的宣传页 ── */
screens.index = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<script>(function(){if(!/[?&]t=fade/.test(location.search))return;var d=document.createElement("div");d.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#04060d;opacity:1;pointer-events:none;transition:opacity .58s cubic-bezier(.22,.61,.36,1)";document.documentElement.appendChild(d);document.documentElement.classList.add("kf-in");function out(){document.documentElement.classList.add("kf-go");requestAnimationFrame(function(){requestAnimationFrame(function(){d.style.opacity="0";setTimeout(function(){d.remove()},700)})})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",out);else out()})();</script><title>卡片工厂 · 真正学会一门自然语言</title>
<link rel="stylesheet" href="./app.css?v=${VER}">
<script src="./app.js?v=${VER}"></script><script src="./app2.js?v=${VER}"></script><script src="./stats.js?v=${VER}"></script><script src="./decks.js?v=${VER}"></script><script src="./help.js?v=${VER}"></script>
</head><body class="splash-body">
<canvas id="sky" aria-hidden="true"></canvas>
<div class="sky-veil" aria-hidden="true"></div>
<main class="splash2">
  <div class="sp2-inner">
    <div class="sp2-wordmark">
      <span class="sp2-logo">卡</span>
      <span class="sp2-brand">卡片工厂</span>
    </div>
    <h1 class="sp2-title">真正学会<br>一门自然语言</h1>
    <div class="sp2-act">
      <button class="btn primary lg" type="button" data-enter>开启</button>
    </div>
  </div>
</main>
<script src="./transit.js?v=${VER}"></script><script src="./splash.js?v=${VER}"></script><script src="./smooth.js?v=${VER}"></script>
</body></html>`;
screens.study = shell('study.html', 'cards', `
<main class="screen study">
  <header class="hdr">
    <div>
      <div class="st-crumb"><a href="./cards.html">卡片</a><span>/</span><span id="deckName">测试牌组</span><span>/</span><span id="deckIdx">第 3 张，共 12 张</span></div>
      <h1 class="st-idx">
        <button class="wd" type="button" data-en="1" title="点开：英文解释" id="sw">abandon</button>
        <span class="mut st-where">06:41 · 这一轮 12 张</span>
      </h1>
    </div>
    <div class="act">
      <button class="btn ghost" type="button" data-sheet="sh-edit">编辑</button>
      <button class="btn ghost" type="button">暂停</button>
      <a class="btn ghost" href="./cards.html">退出</a>
    </div>
  </header>

  <div class="fbar" id="fbar">
    <button class="fb" type="button" data-face="listen">听<i>声音 → 画面</i></button>
    <button class="fb" type="button" data-face="speak">说<i>画面 → 声音</i></button>
    <button class="fb on" type="button" data-face="read">读<i>句子 → 画面</i></button>
    <button class="fb" type="button" data-face="write">写<i>画面 → 拼写</i></button>
    <button class="fb" type="button" data-face="vary">改<i>换一个说法</i></button>
    <span class="sp"></span>
  </div>

  <div class="st2">
    <section class="stage2" id="stage">
      <div class="drw" data-drw="bg">
        <button class="drw-h" type="button" data-drw="bg"><b>背景</b><span class="mut">这句话在什么场合说、谁在说、说完会怎样</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p"><ul class="dlist" id="bgList"></ul></div></div>
      </div>

      <div class="drw" data-drw="media">
        <button class="drw-h" type="button" data-drw="media"><b>图 · 资源</b><span class="mut">一张挑过的照片，加几条外部链接</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p">
          <figure class="shot">
            <img id="shotImg" src="./assets/factory/c1.jpg" alt="这一句的场面" />
            <span class="giftag">静图</span>
          </figure>
          <ul class="rlink" id="rlinks">
            <li><span class="rt gif">动图</span><a href="#">救生艇刚下水 · giphy.com</a></li>
            <li><span class="rt vid">视频</span><a href="#">RNLI 训练下水 · youtu.be/9K2x…</a></li>
          </ul>
        </div></div>
      </div>

      <div class="drw" data-drw="sent">
        <button class="drw-h" type="button" data-drw="sent"><b>句子</b><span class="mut">练的那一句本身</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p"><p class="big" id="sentLine">The crew <b class="tgt">abandoned</b> ship within minutes.</p></div></div>
      </div>

      <div class="drw" data-drw="audio">
        <button class="drw-h" type="button" data-drw="audio"><b>声音</b><span class="mut">母语者念的这一个句子</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p">
          <div class="arow">
            <button class="pp" type="button" aria-label="播放"><span>▶</span></button>
            <div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <span class="dur" id="durTxt">3.3s</span>
            <button class="mini" type="button">再放一遍</button>
          </div>
        </div></div>
      </div>

      <div class="drw" data-drw="rec">
        <button class="drw-h" type="button" data-drw="rec"><b>录音</b><span class="mut">按住说一遍，松手结束</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p">
          <div class="arow">
            <button class="mic" type="button" aria-label="按住说话"><span>●</span></button>
            <div class="rechint"><b>按住说话</b><span class="mut">松手结束 —— 先别在心里默念一遍</span></div>
          </div>
        </div></div>
      </div>

      <div class="drw" data-drw="type">
        <button class="drw-h" type="button" data-drw="type"><b>打字</b><span class="mut">看着场面把句子写出来</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p">
          <input class="tin" id="tin" placeholder="听到/看到这个场面，句子是什么？" autocomplete="off" />
          <span class="tnote">写不写都行<span class="fold">写得出来，说明这句已经是你的了。写不出来也不扣分，接着下一张就行。</span></span>
        </div></div>
      </div>

      <div class="drw" data-drw="vary">
        <button class="drw-h" type="button" data-drw="vary"><b>换一个说法</b><span class="mut">同一个场面，换掉中间那个词</span><span class="sp"></span><span class="car">▾</span></button>
        <div class="drw-b"><div class="drw-p">
          <div class="chips" id="vchips"><span class="chip on">got off</span><span class="chip">left</span><span class="chip">evacuated</span><span class="chip">自己打一个</span></div>
          <p class="vw" id="vres">The crew <s>abandoned</s> <b>got off</b> the ship within minutes.</p>
        </div></div>
      </div>
    </section>

    <aside class="drail">
      <div class="side-h">解释</div>
      <div class="exrow">
        <button class="ex" type="button" data-en="1"><span>英文</span><i>小窗</i></button>
        <button class="ex" type="button" data-en="1" data-zh="1"><span>中文</span><i>小窗</i></button>
      </div>

      <div class="side-h">每一块都在这里</div>
      <button class="rv" type="button" data-drw="bg"><span>背景</span><i>6 条</i></button>
      <button class="rv" type="button" data-drw="media"><span>图 · 资源</span><i>1 图 2 链</i></button>
      <button class="rv" type="button" data-drw="sent"><span>句子</span><i>6 词</i></button>
      <button class="rv" type="button" data-drw="audio"><span>声音</span><i>3.3s</i></button>
      <button class="rv" type="button" data-drw="rec"><span>录音</span><i>跟着读</i></button>
      <button class="rv" type="button" data-drw="type"><span>打字</span><i>写一遍</i></button>
    <button class="mini allbtn" type="button" data-all="1">全揭开</button>
      <p class="side-n fold">点一下拉开，再点一下收起来。灰的是这一面不鼓励先看的，照样能拉。</p>
    </aside>
  </div>

  <button class="wordnav prev" type="button" data-word="-1" title="上一个单词">‹</button>
  <button class="wordnav next" type="button" data-word="1" title="下一个单词">›</button>

  <button class="navstep prev" type="button" data-step="-1">← 上一个</button>
  <button class="navstep next" type="button" data-step="1">下一个 →</button>

  <div class="st-rate">
    <button class="st-r" type="button"><b>重来</b><em>1 分钟</em></button>
    <button class="st-r" type="button"><b>困难</b><em>3 天</em></button>
    <button class="st-r good" type="button"><b>良好</b><em>8 天</em></button>
    <button class="st-r" type="button"><b>简单</b><em>15 天</em></button>
  </div>

  <p class="st-keys"><span class="kbd">1</span>–<span class="kbd">4</span> 评分 · <span class="kbd">←</span><span class="kbd">→</span> 换面 · <span class="kbd">A</span> 声音 <span class="kbd">M</span> 图 <span class="kbd">T</span> 句子 · <span class="kbd">E</span> 英文解释 · <span class="kbd">B</span> 背景</p>

  <div class="popwin" id="sh-en" hidden>
    <div class="pw-hd" id="enDrag">
      <b id="enWord">abandon</b>
      <span class="tag" id="enTag">动词</span>
      <span class="ph" id="phTxt">/əˈbændən/</span>
      <span class="sp"></span>
      <button class="pin" type="button" data-pin title="钉住现在的位置，下次还开在这里">钉</button>
      <button class="mx" type="button" data-close>×</button>
    </div>
    <div class="pw-bd">
      <div class="pw-list" id="pwList">
        <div class="pw-blk" data-pw="en">
          <div class="pw-blk-h"><b>英文解释</b><span class="sp"></span><button type="button" data-pwedit title="编辑">✎</button><button type="button" data-pwdel title="删掉这条">−</button></div>
          <div class="pw-blk-b" id="enDef">to leave a place or a person for good — or to stop doing something you had already planned to finish.</div>
        </div>
        <div class="pw-blk" id="zhbox" hidden>
          <div class="pw-blk-h"><b>中文</b><span class="sp"></span><button type="button" data-pwedit title="编辑">✎</button><button type="button" data-pwdel title="删掉这条">−</button></div>
          <div class="pw-blk-b" id="zhDef">丢下不管，走了不再回来；也可以指「放弃一个已经开始的计划」。</div>
        </div>
      </div>
      <div class="pw-add"><button type="button" data-pwadd>＋ 加一条</button></div>
      <div class="pw-ft">
        <button class="mini" type="button" data-zh-btn>看中文</button>
        <span class="sp"></span>
        <span class="pwtip">按住标题可拖 · 右下角可拉</span>
        <button class="mini" type="button" data-close>知道了</button>
      </div>
    </div>
  </div>

  <div class="msheet" id="sh-edit" hidden>
    <div class="mcard mc-wide">
      <div class="mhd"><b>改这一句</b><span class="mut">只动这一句</span><button class="mx" type="button" data-close>×</button></div>
      <div class="mbody">
        <p class="edwarn">手改这一句：句子、目标词、图、声、五维度、背景、变体。<b>批量造 / 批量变 / 全自动流水线不在这里</b> —— 要用大模型批量，按左下角「返工回工厂」。</p>

        <div class="mrow"><span class="mtag">句子</span><textarea class="inp edtxt" id="edSent" rows="2">The crew abandoned ship within minutes.</textarea></div>
        <div class="mrow"><span class="mtag">目标词</span><input class="inp sm" id="edWord" value="abandoned" style="max-width:180px" /><span class="mut">练的是这一段</span></div>

        <div class="mrow"><span class="mtag">图</span>
          <span class="edimg"><img id="edImg" src="./assets/factory/c1.jpg" alt="" /><span class="mut">静图 · commons CC BY-SA 4.0 · 1920×1280</span></span>
          <button class="mini" type="button">换图</button><button class="mini" type="button">裁成横幅</button>
        </div>

        <div class="mrow"><span class="mtag">声</span>
          <select class="inp sm" data-pick style="max-width:240px"><option>Aria · 女声 · 清楚的美国音</option><option>Guy · 男声 · 播报腔</option><option>老张 · 男声 · 慢</option></select>
          <span class="mut" id="edDur">3.3s</span>
          <button class="mini" type="button">试听</button><button class="mini" type="button">重合成</button>
        </div>

        <div class="mrow"><span class="mtag">五维度</span>
          <span class="edf5">
            <button class="chip on" type="button">听</button><button class="chip on" type="button">说</button><button class="chip on" type="button">读</button><button class="chip on" type="button">写</button><button class="chip" type="button">改</button>
          </span>
          <span class="mut">点亮哪一面就算这一面有料</span>
        </div>

        <div class="mrow"><span class="mtag">背景</span><textarea class="inp edbg" id="edBg" rows="4">谁 船长，通过广播对甲板上的船员
何时 傍晚，救生艇已经放下海
何处 倾斜的货轮甲板，风雨声很大
语气 短促、命令式、不解释</textarea></div>

        <div class="mrow"><span class="mtag">变体</span><input class="inp" id="edVar" value="got off · left · evacuated" /></div>

        <div class="mrow">
          <button class="btn ghost" type="button" data-rework>返工回工厂</button>
          <span class="sp"></span>
          <button class="btn ghost" type="button" data-close>取消</button>
          <button class="btn primary" type="button" id="edSave">保存这一句</button>
        </div>
      </div>
    </div>
  </div>

  <div class="msheet" id="sh-bg2" hidden>
    <div class="mcard">
      <div class="mhd"><b>背景</b><span class="mut">这句话发生的场合</span><button class="mx" type="button" data-close>×</button></div>
      <div class="mbody">
        <ul class="ordl" id="bgList">
          <li><b>谁</b>船长，通过广播对甲板上的船员</li>
          <li><b>何时</b>傍晚，救生艇已经放下海</li>
          <li><b>何处</b>倾斜的货轮甲板，风雨声很大</li>
          <li><b>语气</b>短促、命令式、不解释</li>
          <li><b>说完会怎样</b>所有人停下手里的事，往救生艇那边跑</li>
          <li><b>容易误会的地方</b>不是「放弃」，是「撤离」这个动作</li>
        </ul>
        <p class="mut fold">学的时候想不起这句话什么时候说，就看这里；练「说」「写」时这几条会拼进提示词。</p>
      </div>
    </div>
  </div>
</main>

<script>
(function () {
  var stage = document.getElementById('stage')
  // 每一面：show = 直接给；lit = 发光（这一面该用的东西）
  var rules = {
    listen: { open: ['audio', 'rec'], lit: ['audio', 'rec'] },
    speak:  { open: ['media', 'rec'], lit: ['media', 'rec'] },
    read:   { open: ['sent'], lit: ['sent', 'bg'] },
    write:  { open: ['media', 'type'], lit: ['media', 'bg', 'type'] },
    vary:   { open: ['sent', 'vary'], lit: ['sent', 'media', 'bg'] }
  }
  var CARDS = {
    abandon: {
      word: 'abandon', tag: '动词', ph: '/əˈbændən/',
      en: 'to leave a place or a person for good — or to stop doing something you had already planned to finish.',
      zh: '丢下不管，走了不再回来；也可以指「放弃一个已经开始的计划」。',
      sent: 'The crew <b class="tgt">abandoned</b> ship within minutes.',
      wc: '6', dur: '3.3s', img: './assets/factory/c1.jpg', idx: '第 3 张，共 12 张',
      links: [['动图', 'gif', '救生艇刚下水 · giphy.com'], ['视频', 'vid', 'RNLI 训练下水 · youtu.be/9K2x…']],
      chips: ['got off', 'left', 'evacuated'],
      res: 'The crew <s>abandoned</s> <b>got off</b> the ship within minutes.',
      bg: [['谁', '船长，通过广播对甲板上的船员'], ['何时', '傍晚，救生艇已经放下海'], ['何处', '倾斜的货轮甲板，风雨声很大'],
           ['语气', '短促、命令式、不解释'], ['说完会怎样', '所有人停下手里的事，往救生艇那边跑'], ['容易误会的地方', '不是「放弃」，是「撤离」这个动作']]
    },
    succumb: {
      word: 'succumb', tag: '动词', ph: '/səˈkʌm/',
      en: 'to stop resisting something — an illness, a temptation or pressure finally gets you.',
      zh: '扛不住、屈服；通常是被病、诱惑或者压力压过去了。',
      sent: 'I&#39;m afraid I <b class="tgt">succumbed</b> to temptation and had a piece of cheesecake.',
      wc: '11', dur: '2.9s', img: './assets/factory/c2.jpg', idx: '第 4 张，共 12 张',
      links: [['动图', 'gif', '蛋糕被推到手边 · giphy.com'], ['视频', 'vid', '同事在茶水间分蛋糕 · youtu.be/4mQ1…']],
      chips: ['gave in', 'yielded', 'caved'],
      res: 'I&#39;m afraid I <s>succumbed</s> <b>gave in</b> to temptation and had a piece of cheesecake.',
      bg: [['谁', '同事，把蛋糕推到你面前'], ['何时', '周一上午十点，刚开完站会'], ['何处', '茶水间，桌上还有半盒蛋挞'],
           ['语气', '自嘲、带点无奈'], ['说完会怎样', '对方笑一下，把盒子推得更近'], ['容易误会的地方', '不是「投降」，是「没扛住」这个动作']]
    }
  }

  function applyCard(id) {
    var c = CARDS[id] || CARDS.abandon
    var set = function (el, v) { if (el) el.textContent = v }
    var html = function (el, v) { if (el) el.innerHTML = v }
    var byId = function (x) { return document.getElementById(x) }
    set(byId('sw'), c.word)
    set(byId('enWord'), c.word)
    set(byId('enTag'), c.tag)
    set(byId('phTxt'), c.ph)
    set(byId('enDef'), c.en)
    set(byId('zhDef'), c.zh)
    html(byId('sentLine'), c.sent)
    var img = byId('shotImg')
    if (img) img.src = c.img
    set(byId('durTxt'), c.dur)
    set(byId('deckIdx'), c.idx)
    var rl = byId('rlinks')
    if (rl) {
      var out = ''
      for (var i = 0; i < c.links.length; i++) {
        out += '<li><span class="rt ' + c.links[i][1] + '">' + c.links[i][0] + '</span><a href="#">' + c.links[i][2] + '</a></li>'
      }
      rl.innerHTML = out
    }
    var vc = byId('vchips')
    if (vc) {
      var cs = ''
      for (var j = 0; j < c.chips.length; j++) {
        cs += '<span class="chip' + (j === 0 ? ' on' : '') + '">' + c.chips[j] + '</span>'
      }
      vc.innerHTML = cs + '<span class="chip">自己打一个</span>'
    }
    html(byId('vres'), c.res)
    var bl = byId('bgList')
    if (bl) {
      var bs = ''
      for (var k = 0; k < c.bg.length; k++) bs += '<li><b>' + c.bg[k][0] + '</b>' + c.bg[k][1] + '</li>'
      bl.innerHTML = bs
    }
    var db = document.querySelectorAll('.rv[data-drw]')
    for (var q = 0; q < db.length; q++) {
      var kk = db[q].getAttribute('data-drw')
      var it = db[q].querySelector('i')
      if (!it) continue
      if (kk === 'sent') it.textContent = c.wc + ' 词'
      else if (kk === 'audio') it.textContent = c.dur
      else if (kk === 'bg') it.textContent = c.bg.length + ' 条'
      else if (kk === 'media') it.textContent = '1 图 ' + c.links.length + ' 链'
    }
  }

  var qs = new URLSearchParams(location.search)
  applyCard(qs.get('w'))
  if (qs.get('deck')) {
    var dn = document.getElementById('deckName')
    if (dn) dn.textContent = (qs.get('deck') === 'testing' ? '测试牌组' : qs.get('deck'))
  }

  /* 浮动小窗：按住标题拖，右下角拉，Esc 或 × 关 */
  var PIN_KEY = 'kf-enpop:rect'
  function readPin() {
    try { return JSON.parse(localStorage.getItem(PIN_KEY) || 'null') } catch (e) { return null }
  }
  function writePin(r) {
    try { localStorage.setItem(PIN_KEY, JSON.stringify(r)) } catch (e) {}
  }

  function openWin(el, anchor) {
    // .page 上有 transform —— 固定定位会以它为祖先，left/top 与 getBoundingClientRect 差一个页面偏移。
    // 挪到 body 之后才是真正的视口坐标，拖动才对得上手。
    if (el.parentNode !== document.body) document.body.appendChild(el)
    if (!el) return
    var pin = readPin()
    if (pin && pin.w) {
      el.style.left = pin.l + 'px'
      el.style.top = pin.t + 'px'
      el.style.width = pin.w + 'px'
      el.style.height = pin.h + 'px'
    } else if (anchor) {
      var rr = anchor.getBoundingClientRect()
      var ww = el.offsetWidth || 320
      var left = rr.left - ww - 14
      if (left < 12) left = Math.min(rr.right + 14, window.innerWidth - ww - 12)
      el.style.left = Math.round(left) + 'px'
      el.style.top = Math.max(12, Math.round(rr.top - 8)) + 'px'
      el.style.width = ''
      el.style.height = ''
    } else {
      el.style.left = Math.max(16, Math.round(window.innerWidth * 0.56)) + 'px'
      el.style.top = '150px'
      el.style.width = ''
      el.style.height = ''
    }
    var pinBtn = el.querySelector('[data-pin]')
    if (pinBtn) pinBtn.classList.toggle('on', !!pin)
    el.hidden = false
  }

  function closeWin(el) {
    if (el) el.hidden = true
  }

  /* 拖动：只动 transform（合成器干活），rAF 合并；拖的时候把 backdrop-filter 关掉，
     否则每帧重算模糊，又卡又跟手不齐 */
  /* 拖动：只写 left/top，按住时关掉模糊（否则每帧重算 backdrop-filter）；
     不玩 transform 反馈，指针在哪窗口就在哪，松手即落定 */
  var drag = null
  document.addEventListener('pointerdown', function (e) {
    var bar = e.target.closest('.pw-hd')
    if (!bar || e.target.closest('button')) return
    var win = bar.closest('.popwin')
    if (!win) return
    var r = win.getBoundingClientRect()
    drag = { win: win, bar: bar, x0: e.clientX, y0: e.clientY, l0: r.left, t0: r.top, w: r.width, h: r.height, id: e.pointerId }
    win.classList.add('dragging')
    try { bar.setPointerCapture(e.pointerId) } catch (err) {}
    e.preventDefault()
  })

  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return
    var maxL = window.innerWidth - drag.w - 6
    var maxT = window.innerHeight - 40
    var l = Math.min(Math.max(6, drag.l0 + (e.clientX - drag.x0)), Math.max(6, maxL))
    var t = Math.min(Math.max(6, drag.t0 + (e.clientY - drag.y0)), Math.max(6, maxT))
    drag.win.style.left = l + 'px'
    drag.win.style.top = t + 'px'
    drag.l = l
    drag.t = t
  })

  function endDrag() {
    if (!drag) return
    var win = drag.win
    win.classList.remove('dragging')
    if (win.querySelector('[data-pin].on')) {
      var r = win.getBoundingClientRect()
      writePin({ l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) })
    }
    drag = null
  }
  document.addEventListener('pointerup', endDrag)
  document.addEventListener('pointercancel', endDrag)

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    var w = document.querySelector('.popwin:not([hidden])')
    if (w) { w.hidden = true }
  })

  /* 编辑面板：保存回当前这一句 */
  var edSave = document.getElementById('edSave')
  if (edSave) {
    edSave.addEventListener('click', function () {
      var sent = document.getElementById('edSent')
      var line = document.getElementById('sentLine')
      if (sent && line) {
        var word = (document.getElementById('edWord') || {}).value || ''
        var html = sent.value.trim().replace(/</g, '&lt;')
        if (word) html = html.split(word).join('<b class="tgt">' + word + '</b>')
        line.innerHTML = html
      }
      var bg = document.getElementById('edBg')
      var list = document.getElementById('bgList')
      if (bg && list) {
        var out = ''
        var rows = bg.value.split(String.fromCharCode(10))
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i].trim()
          if (!r) continue
          var sp = r.indexOf(' ')
          if (sp > 0) out += '<li><b>' + r.slice(0, sp) + '</b>' + r.slice(sp + 1).trim() + '</li>'
          else out += '<li><b>·</b>' + r + '</li>'
        }
        list.innerHTML = out
      }
      var v = document.getElementById('edVar')
      var vc = document.getElementById('vchips')
      if (v && vc) {
        var arr = v.value.split('·')
        var cs = ''
        for (var j = 0; j < arr.length; j++) {
          var t = arr[j].trim()
          if (!t) continue
          cs += '<span class="chip' + (j === 0 ? ' on' : '') + '">' + t + '</span>'
        }
        vc.innerHTML = cs + '<span class="chip">自己打一个</span>'
      }
      var lv = document.querySelector('.blk.b-vary p.vw')
      var vres = document.getElementById('vres')
      if (vres && sent) vres.textContent = sent.value.trim()
      closeWin(document.getElementById('sh-edit'))
    })
  }

  /* 返工：回工厂 */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-rework]')) {
      location.href = './factory.html?w=' + (qs.get('w') || 'abandon')
      return
    }
    var pw = e.target.closest('.popwin')
    if (pw && e.target.closest('[data-close]')) { pw.hidden = true; return }
  })

  var faces = ['listen', 'speak', 'read', 'write', 'vary']
  var face = 'read'
  var opened = {}
  var closed = {}
  var allOpen = false
  var doneSet = {}
  var autoNext = true

  try { autoNext = localStorage.getItem('kf-study:autonext') !== '0' } catch (e) {}
  try {
    var rawDone = localStorage.getItem('kf-study:done')
    if (rawDone) doneSet = JSON.parse(rawDone) || {}
  } catch (e) {}

  function wordNow() { return qs.get('w') || 'abandon' }

  function markDone(f) {
    doneSet[wordNow() + '|' + f] = 1
    try { localStorage.setItem('kf-study:done', JSON.stringify(doneSet)) } catch (e) {}
  }

  function goWord(dir) {
    var keys = Object.keys(CARDS)
    var at = keys.indexOf(wordNow())
    if (at < 0) at = 0
    var nx = keys[(at + dir + keys.length) % keys.length]
    var url = './study.html?w=' + nx
    if (qs.get('deck')) url += '&deck=' + qs.get('deck')
    location.href = url
  }

  function goFace(dir) {
    var at = faces.indexOf(face)
    var nx = at + dir
    if (nx < 0) { goWord(-1); return }
    if (nx >= faces.length) { goWord(1); return }
    face = faces[nx]
    opened = {}
    closed = {}
    allOpen = false
    render()
  }

  function render() {
    var r = rules[face]
    var drws = stage.querySelectorAll('.drw')
    for (var i = 0; i < drws.length; i++) {
      var k = drws[i].getAttribute('data-drw')
      var lit = r.lit.indexOf(k) >= 0
      var isClosed = !!closed[k]
      var want
      if (allOpen) want = !isClosed
      else if (r.open.indexOf(k) >= 0) want = !isClosed
      else want = !!opened[k] && !isClosed
      drws[i].classList.toggle('open', k === 'vary' ? face === 'vary' : want)
      drws[i].classList.toggle('lit', lit)
      drws[i].classList.toggle('off', isClosed && lit)
      if (k === 'vary') drws[i].hidden = face !== 'vary'
    }

    var dbs = document.querySelectorAll('.rv[data-drw]')
    for (var j = 0; j < dbs.length; j++) {
      var dk = dbs[j].getAttribute('data-drw')
      var dLit = r.lit.indexOf(dk) >= 0
      var cur = stage.querySelector('.drw[data-drw="' + dk + '"]')
      var isOpen = !!(cur && cur.classList.contains('open'))
      dbs[j].classList.toggle('open', isOpen)
      dbs[j].classList.toggle('lit', dLit && !isOpen)
      dbs[j].classList.toggle('on', isOpen)
    }

    var fbs = document.querySelectorAll('.fb')
    for (var n = 0; n < fbs.length; n++) {
      var fname = fbs[n].getAttribute('data-face')
      fbs[n].classList.toggle('on', fname === face)
      fbs[n].classList.toggle('done', !!doneSet[wordNow() + '|' + fname])
    }

    var allBtn = document.querySelector('[data-all]')
    if (allBtn) {
      allBtn.classList.toggle('on', allOpen)
      allBtn.textContent = allOpen ? '收起' : '全揭开'
    }
  }

  document.addEventListener('click', function (e) {
    // 解释小窗：逐条编辑 / 增 / 删
    var pwEdit = e.target.closest('[data-pwedit]')
    if (pwEdit) {
      var pblk = pwEdit.closest('.pw-blk')
      var pbody = pblk.querySelector('.pw-blk-b')
      var editing = pbody.getAttribute('contenteditable') !== 'true'
      pbody.setAttribute('contenteditable', editing ? 'true' : 'false')
      pblk.classList.toggle('editing', editing)
      pwEdit.textContent = editing ? '✓' : '✎'
      if (editing) pbody.focus()
      return
    }
    if (e.target.closest('[data-pwdel]')) {
      var dblk = e.target.closest('.pw-blk')
      var dlist = dblk.parentElement
      if (dlist.children.length > 1) dblk.remove()
      return
    }
    if (e.target.closest('[data-pwadd]')) {
      var nlist = document.getElementById('pwList')
      nlist.insertAdjacentHTML('beforeend',
        '<div class="pw-blk"><div class="pw-blk-h"><b>补充</b><span class="sp"></span>' +
        '<button type="button" data-pwedit title="编辑">✓</button>' +
        '<button type="button" data-pwdel title="删掉这条">−</button></div>' +
        '<div class="pw-blk-b" contenteditable="true">写点什么…</div></div>')
      var nb = nlist.lastElementChild.querySelector('.pw-blk-b')
      if (nb) { nb.focus(); document.execCommand && document.execCommand('selectAll', false, null) }
      return
    }

    var f = e.target.closest('[data-face]')
    if (f) {
      face = f.getAttribute('data-face')
      opened = {}
      closed = {}
      allOpen = false
      render()
      return
    }

    if (e.target.closest('[data-all]')) {
      allOpen = !allOpen
      opened = {}
      closed = {}
      render()
      return
    }

    var drwBtn = e.target.closest('[data-drw]')
    if (drwBtn) {
      var dk = drwBtn.getAttribute('data-drw')
      var box = stage.querySelector('.drw[data-drw="' + dk + '"]')
      var isOpen = box && box.classList.contains('open')
      if (isOpen) { closed[dk] = true; opened[dk] = 0 }
      else { closed[dk] = false; opened[dk] = 1 }
      render()
      // 拉开时给一条从下往上扫过去的亮边，像布被拉下来
      var openedBox = stage.querySelector('.drw[data-drw="' + dk + '"]')
      if (openedBox && !isOpen) {
        openedBox.classList.add('opening')
        setTimeout(function () { openedBox.classList.remove('opening') }, 620)
      }
      return
    }

    var step = e.target.closest('[data-step]')
    if (step) { goFace(parseInt(step.getAttribute('data-step'), 10)); return }

    var wd = e.target.closest('[data-word]')
    if (wd) { goWord(parseInt(wd.getAttribute('data-word'), 10)); return }

    var rate = e.target.closest('.st-r')
    if (rate) {
      markDone(face)
      render()
      if (autoNext) setTimeout(function () { goWord(1) }, 260)
      return
    }

    var pinBtn = e.target.closest('[data-pin]')
    if (pinBtn) {
      var pw0 = pinBtn.closest('.popwin')
      var on = !pinBtn.classList.contains('on')
      pinBtn.classList.toggle('on', on)
      if (on && pw0) {
        var r0 = pw0.getBoundingClientRect()
        writePin({ l: Math.round(r0.left), t: Math.round(r0.top), w: Math.round(r0.width), h: Math.round(r0.height) })
        pinBtn.title = '位置已钉住，点一下解开'
      } else {
        try { localStorage.removeItem(PIN_KEY) } catch (err) {}
        pinBtn.title = '钉住现在的位置，下次还开在这里'
      }
      return
    }

    var en = e.target.closest('[data-en]')
    if (en) {
      var sheet = document.getElementById('sh-en')
      var zb = document.getElementById('zhbox')
      if (zb) zb.hidden = !en.hasAttribute('data-zh')
      var exs = document.querySelectorAll('.ex')
      for (var x = 0; x < exs.length; x++) exs[x].classList.toggle('on', exs[x] === en)
      var wasOpen = sheet && !sheet.hidden
      var sameOne = en.classList.contains('on')
      var exs2 = document.querySelectorAll('.ex')
      for (var x2 = 0; x2 < exs2.length; x2++) exs2[x2].classList.remove('on')
      if (wasOpen && sameOne) { sheet.hidden = true; return }   // 再点一下就关
      en.classList.add('on')
      openWin(sheet, en)
      return
    }

    if (e.target.closest('[data-zh-btn]')) {
      var z = document.getElementById('zhbox')
      if (z) z.hidden = !z.hidden
      return
    }

    var sh = e.target.closest('[data-sheet]')
    if (sh) {
      var s2 = document.getElementById(sh.getAttribute('data-sheet'))
      if (s2) { s2.hidden = false; document.documentElement.classList.add('sheet-open') }
    }
  })

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    if (e.key === 'ArrowLeft') { goFace(-1); e.preventDefault() }
    if (e.key === 'ArrowRight') { goFace(1); e.preventDefault() }
    // A 声音 / M 图 / T 句子 / R 录音 / B 背景 / E 英文解释
    var kmap = { a: 'audio', m: 'media', t: 'sent', r: 'rec', b: 'bg' }
    var kk = kmap[(e.key || '').toLowerCase()]
    if (kk) {
      var box = stage.querySelector('.drw[data-drw="' + kk + '"]')
      if (box) {
        var open = box.classList.contains('open')
        if (open) { closed[kk] = true; opened[kk] = 0 } else { closed[kk] = false; opened[kk] = 1 }
        render()
      }
      e.preventDefault()
    }
  })

  // 四个导航是 fixed，但 .page 上有 transform，会被当成定位祖先 —— 挪到 body 才是真的贴视口
  ;['.wordnav', '.navstep'].forEach(function (sel) {
    var list = document.querySelectorAll(sel)
    for (var i = 0; i < list.length; i++) document.body.appendChild(list[i])
  })

  render()
})()
</script>
`);

for (const [name, html] of Object.entries(screens)) {
  fs.writeFileSync(path.join(DIR, name + '.html'), html, 'utf8');
}
for (const stale of ['today.html', 'source.html', 'pack.html']) {
  const target = path.join(DIR, stale);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}
console.log('wrote', Object.keys(screens).length, 'screens');
