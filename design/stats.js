/* 统计页交互：周期切换、悬停明细、牌组选择、导出 PDF */
const boot3 = () => {
  const root = document.documentElement;
  let tip = document.getElementById('tip');
  /* .page 上有动画产生的包含块，浮层得搬到 body 底下才是真正的 fixed */
  if (tip && tip.parentElement !== document.body) document.body.appendChild(tip);
  let box = null;

  /* 周期切换：只切 class，动画交给 CSS */
  document.querySelectorAll('[data-rng]').forEach((group) => {
    const id = group.dataset.rng;
    group.addEventListener('change', () => {
      const val = group.querySelector('input:checked')?.value;
      const cbox = document.querySelector(`.chartbox[data-chart="${id}"]`);
      if (!cbox || !val) return;
      cbox.querySelectorAll('.cvv').forEach((v) => v.classList.toggle('on', v.dataset.p === val));
      /* 让柱子重播一次长出来的动画 */
      const on = cbox.querySelector('.cvv.on');
      if (on) {
        on.querySelectorAll('.bar').forEach((b) => {
          b.style.animation = 'none';
          void b.offsetWidth;
          b.style.animation = '';
        });
      }
    });
  });

  /* 悬停明细 */
  if (tip) {
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t) {
        tip.hidden = true;
        return;
      }
      const r = t.getBoundingClientRect();
      tip.textContent = t.dataset.tip;
      tip.hidden = false;
      const x = Math.min(Math.max(r.left + r.width / 2, 60), window.innerWidth - 60);
      const y = Math.max(r.top, 44);
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest('[data-tip]')) tip.hidden = true;
    });
    window.addEventListener('scroll', () => {
      tip.hidden = true;
    }, { passive: true });
  }

  /* 牌组选择：改副标题，让人看得出切了 */
  const deck = document.getElementById('deck');
  if (deck) {
    deck.addEventListener('change', () => {
      const sub = document.querySelector('.hdr .sub');
      if (!sub) return;
      sub.textContent = deck.value === '全部牌组'
        ? '37 句 · 12 个说法 · 账本里最早一条是 10 月 12 日'
        : `只看「${deck.value}」· 样本变少，曲线会更抖`;
      document.querySelectorAll('.card.stat').forEach((c) => {
        c.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      });
    });
  }

  /* 导出 PDF：交给浏览器的打印，打印样式已经单独写过 */
  document.getElementById('exp')?.addEventListener('click', () => {
    root.classList.add('printing');
    setTimeout(() => {
      window.print();
      root.classList.remove('printing');
    }, 60);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot3);
} else {
  boot3();
}
