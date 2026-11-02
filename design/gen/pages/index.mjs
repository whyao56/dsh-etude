/* 启动页：星轨 + 一句主张 + 一个按钮。演示用，真插件里是首次打开的那一屏。 */
import { btn, icon, chip, photo } from '../ui.mjs';

const head = (base) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>卡片工厂 · 真正学会一门自然语言</title>
${base ? `<base href="${base}">` : ''}
<link rel="stylesheet" href="./system.css">
</head>`;

const sky = `<canvas id="sky"></canvas><div class="veil"></div>`;

function v1() {
  return `${head('')}<body class="splash-body">
  ${sky}
  <main class="splash">
    <div class="sp-in">
      <span class="sp-mark"><span class="brand-mark" style="width:34px;height:34px;font-size:15px">卡</span>卡片工厂</span>
      <h1 class="sp-h1">真正学会<br>一门自然语言</h1>
      <p class="sp-sub">造卡、挑图、试听、打包。每一张图都有人看过，每一条语音都有人听过。</p>
      <div class="sp-act"><a class="btn primary lg sp-go" href="./cards.html" data-fade>开启</a></div>
      <p class="sp-link">第一次来？<a href="./tutorial.html" data-fade>看三分钟教程</a></p>
    </div>
    <div class="sp-fan">
      ${['harbor', 'office', 'library', 'coffee']
        .map((p, i) => `<div class="c"><img src="./assets/photos/p-${p}.jpg" alt=""><span class="cap">${['港口的雾', '黄昏的工位', '旧阅览室', '窗台上的咖啡'][i]}</span></div>`)
        .join('')}
    </div>
    <div class="sp-foot"><span>dsh-etude 0.2</span><span class="sp"></span><span>数据都在本机</span></div>
  </main>
  <script src="./ui.js"></script>
</body></html>`;
}

function v2() {
  return `${head('')}<body class="splash-body">
  ${sky}
  <main class="splash" style="align-items:flex-start;text-align:left">
    <div class="sp-in" style="align-items:flex-start;text-align:left;max-width:560px;margin-top:120px">
      <span class="sp-mark"><span class="brand-mark" style="width:34px;height:34px;font-size:15px">卡</span>卡片工厂</span>
      <h1 class="sp-h1" style="text-align:left">一句一句<br>把语言装回去</h1>
      <p class="sp-sub" style="text-align:left">不是背单词。是一个词在五个场景里怎么用，配一张真图、一条真声音。</p>
      <div class="sp-act" style="margin-top:28px"><a class="btn primary lg sp-go" href="./cards.html" data-fade>开启 →</a></div>
    </div>
    <div class="sp-fan" style="right:auto;left:50%;bottom:80px">
      ${['harbor', 'office', 'library']
        .map((p) => `<div class="c"><img src="./assets/photos/p-${p}.jpg" alt=""></div>`)
        .join('')}
    </div>
    <div class="sp-foot"><span>dsh-etude 0.2 · MIT</span><span class="sp"></span><span>3 分钟教程</span></div>
  </main>
  <script src="./ui.js"></script>
</body></html>`;
}

function v3() {
  return `${head('')}<body class="splash-body">
  ${sky}
  <main class="splash">
    <div class="sp-in">
      <span class="sp-mark"><span class="brand-mark" style="width:34px;height:34px;font-size:15px">卡</span>卡片工厂</span>
      <h1 class="sp-h1">真正学会<br>一门自然语言</h1>
      <p class="sp-sub">五面练习：听、说、读、写、改。</p>
      <div class="sp-act"><a class="btn primary lg sp-go" href="./cards.html" data-fade>开启</a></div>
    </div>
    <div class="sp-foot"><span>dsh-etude 0.2</span><span class="sp"></span><span>今天还有 12 张到期</span></div>
  </main>
  <script src="./ui.js"></script>
</body></html>`;
}

export const meta = { name: 'index', pick: 1, variants: [1, 2, 3], title: '卡片工厂 · 启动' };
export const build = (v) => (v === 2 ? v2() : v === 3 ? v3() : v1());
