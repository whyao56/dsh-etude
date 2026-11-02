/* 卡片工厂-测试 · 弹出小窗（2026-11-01）
   页面上所有解释性小字都收进「?」和词胶囊里。点一下贴在按钮旁边，点别处就收。
   内容留在页面里的 <div class="pop" id="...">，这里只负责搬和定位 ——
   这样一处文案改动不用碰 JS，截图也能对得上。 */
(() => {
  let box = null;
  let owner = null;

  const ensure = () => {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'popbox';
    box.hidden = true;
    document.body.appendChild(box);
    return box;
  };

  const place = (btn) => {
    const b = ensure();
    const rect = btn.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    b.style.width = width + 'px';
    b.hidden = false;
    const height = b.offsetHeight;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 8);
    b.style.left = left + 'px';
    b.style.top = top + 'px';
  };

  const close = () => {
    if (owner) owner.classList.remove('on');
    owner = null;
    if (box) {
      box.hidden = true;
      box.innerHTML = '';
    }
  };

  const open = (btn) => {
    const source = btn.dataset.pop ? document.getElementById(btn.dataset.pop) : null;
    if (!source) return;
    const b = ensure();
    b.innerHTML = source.innerHTML;
    b.hidden = false;
    owner = btn;
    btn.classList.add('on');
    place(btn);
    requestAnimationFrame(() => place(btn));
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-pop]');
    if (btn) {
      event.preventDefault();
      if (owner === btn) close();
      else {
        close();
        open(btn);
      }
      return;
    }
    if (box && box.contains(event.target)) return; // 点气泡里面不关，好让人看链接
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, true);
})();
