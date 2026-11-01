/* ───────── 把原生 <select> 换成能看的下拉 ─────────
   原生 select 的弹出层是操作系统的，深色主题下就是「白底浅灰字」，
   看不清也没法改（截图里那个 Aria · 女声 就是这样）。
   做法：保留 select 本体（表单语义、值、change 事件都不变），
   在它后面放一个按钮 + 面板，选了就把值写回去并触发 change。
   这样 11 处原生 select 一行模板都不用改，动态生成的那些也能自动接上。 */
(() => {
  const cfg = () => getComputedStyle(document.documentElement);

  const optionText = (o) => (o.textContent || '').trim();

  function build(select) {
    if (select.dataset.picked === '1' || select.multiple) return;
    select.dataset.picked = '1';

    const wrap = document.createElement('span');
    wrap.className = 'pick';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pickbtn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const txt = document.createElement('span');
    txt.className = 'picktxt';
    const caret = document.createElement('i');
    caret.className = 'caret';
    btn.append(txt, caret);

    const menu = document.createElement('div');
    menu.className = 'pickmenu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    select.parentNode.insertBefore(wrap, select);
    wrap.append(select, btn, menu);
    select.classList.add('picknative');

    const sync = () => {
      const cur = select.options[select.selectedIndex];
      txt.textContent = cur ? optionText(cur) : '';
      btn.classList.toggle('empty', !cur);
      menu.innerHTML = '';
      Array.from(select.options).forEach((opt, i) => {
        const item = document.createElement('div');
        item.className = 'pickitem' + (i === select.selectedIndex ? ' on' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(i === select.selectedIndex));
        item.dataset.index = String(i);
        item.textContent = optionText(opt);
        item.title = optionText(opt);
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          choose(i);
        });
        menu.append(item);
      });
    };

    function close() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('open');
    }

    function open() {
      // 别的地方开着的先关掉
      document.querySelectorAll('.pick.open').forEach((one) => {
        if (one !== wrap) {
          one.classList.remove('open');
          const m = one.querySelector('.pickmenu');
          if (m) m.hidden = true;
        }
      });
      sync();
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      wrap.classList.add('open');
      // 下方空间不够就往上翻（按菜单自己的高度算，别用一个拍脑袋的 200）
      menu.classList.remove('up');
      const box = btn.getBoundingClientRect();
      const need = Math.min(menu.scrollHeight, 260) + 12;
      const below = window.innerHeight - box.bottom;
      menu.classList.toggle('up', below < need && box.top > below);
      const on = menu.querySelector('.pickitem.on');
      if (on) on.scrollIntoView({ block: 'nearest' });
    }

    function choose(index) {
      select.selectedIndex = index;
      sync();
      close();
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (menu.hidden) open();
      else close();
    });

    btn.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown') {
        event.preventDefault();
        if (menu.hidden) open();
        else if (key === 'ArrowDown') move(1);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        if (menu.hidden) open();
        else move(-1);
      } else if (key === 'Escape') {
        close();
      }
    });

    function move(step) {
      const items = Array.from(menu.querySelectorAll('.pickitem'));
      if (!items.length) return;
      const at = items.findIndex((one) => one.classList.contains('focus'));
      let next = at < 0 ? items.findIndex((one) => one.classList.contains('on')) : at;
      next = Math.min(items.length - 1, Math.max(0, next + step));
      items.forEach((one, i) => one.classList.toggle('focus', i === next));
      items[next].scrollIntoView({ block: 'nearest' });
    }

    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });

    document.addEventListener('click', close);
    select.addEventListener('change', sync);
    sync();
  }

  function scan(root = document) {
    root.querySelectorAll('select').forEach((one) => {
      if (one.closest('.pick')) return;
      build(one);
    });
  }

  const boot = () => {
    scan();
    // 有些 select 是后生成的（牌组下拉、设置项），补一遍
    const mo = new MutationObserver((list) => {
      for (const entry of list) {
        for (const node of entry.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'SELECT') build(node);
          else if (node.querySelectorAll) scan(node);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // 外面改了 select.value（比如脚本回填），按钮上的字也要跟上
    document.addEventListener('picksync', () => scan());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
