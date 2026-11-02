/* 听：只给声音。波形、时长、再放一遍。画面藏在后面。 */
import { btn, icon, kbd, chip, badge } from '../ui.mjs';
import { facePage, stage } from './_face.mjs';

export const meta = { name: 'listen', pick: 1, variants: [1, 2], title: '卡片工厂 · 听' };

const wave = (n = 64) =>
  `<div class="wave tall" data-audio data-dur="3.4">${Array.from({ length: n }, (_, i) => {
    const h = 12 + Math.round(52 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.42)) + ((i * 37) % 17));
    return `<i style="height:${Math.min(100, h)}%"></i>`;
  }).join('')}</div>`;

const controls = () =>
  `<div class="row" style="gap:10px;align-items:center">
    <button class="play-btn" data-audio-play>${icon('play')}</button>
    <span class="t-sm dim num">0:00 / 0:03</span>
    <span class="spacer"></span>
    ${chip('再放一遍 R')}
    ${chip('慢速 0.8×')}
    ${chip('循环')}
  </div>`;

function v1() {
  return facePage({
    page: 'listen',
    cur: 'listen',
    body: stage(
      `<div class="row"><span class="t-xs dim2">听 · 声音 → 画面</span><span class="spacer"></span><span class="chip">${badge('3.4 秒 · Ava', 'ok')}</span></div>
      <p class="stage-scene" style="margin:20px 0 6px">先只听。听到能跟着念出来，再翻。</p>
      <div style="margin:22px 0 18px">${wave()}</div>
      ${controls()}
      <div class="row mt24">
        ${btn('翻开了', { k: 'primary', lg: true, icon: 'eye' })}
        ${btn('这一句太快', { k: 'quiet' })}
        <span class="spacer"></span><span class="keys"><kbd class="kbd">space</kbd></span>
      </div>`
    ),
  });
}

function v2() {
  return facePage({
    page: 'listen',
    cur: 'listen',
    body: stage(
      `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center">
        <span class="t-xs dim2">听 · 第 3 条</span>
        <div style="width:min(560px,100%)">${wave(48)}</div>
        <div class="row" style="gap:12px;align-items:center">
          <button class="play-btn ghost" data-audio-play>${icon('pause2')}</button>
          <span class="t-sm dim num">0:01 / 0:03</span>
        </div>
        <p class="stage-scene" style="max-width:420px">听三遍。哪一遍都跟不上，就按「这句太快」——下次会放慢一点。</p>
        ${btn('翻开了', { k: 'primary', icon: 'eye' })}
      </div>`
    ),
  });
}

export const build = (v) => (v === 2 ? v2() : v1());
