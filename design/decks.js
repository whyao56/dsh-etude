/* 牌组树：无限层子牌组（Anki 命名 父::子）
   ────────────────────────────────────────────
   这一份只动卡片页的牌组表：
   · 每行补上 data-deck（完整名字）和 --dep（缩进层级）
   · 折叠/展开：点牌组名前面的三角
   · 右键任意一行 → 菜单（第一条就是「创建子牌组」）
   · 底部「创建牌组」→ 小窗里选父牌组、填名字，自动接成 A::B
   全是内存操作，刷新就回到初始那几条 —— 这是样式稿，不落库。 */
(function () {
  const boot = () => {
    const card = document.querySelector('.deckcard');
    if (!card) return;
    const tbody = card;

    const rows = () => Array.from(card.querySelectorAll('.drow'));
    const nameOf = (row) => {
      const dn = row.querySelector('.dname');
      if (!dn) return '';
      const clone = dn.cloneNode(true);
      clone.querySelectorAll('.caret,.chip,.mut,button,input').forEach((n) => n.remove());
      return (clone.textContent || '').trim();
    };

    /* 初始结构：.parent 是一级，.child 是二级。之后新建的用 --dep 记层级。 */
    const readDepth = (row) => {
      const v = row.style.getPropertyValue('--dep');
      if (v !== '') return parseInt(v, 10) || 0;
      return row.classList.contains('child') ? 1 : 0;
    };

    /* 按 DOM 顺序重算完整名字：每个行的父 = 往上找第一个层级更浅的 */
    const reindex = () => {
      const list = rows();
      list.forEach((row, i) => {
        const depth = readDepth(row);
        row.style.setProperty('--dep', String(depth));
        row.dataset.dep = String(depth);
        let parent = '';
        for (let k = i - 1; k >= 0; k--) {
          if (readDepth(list[k]) < depth) {
            parent = list[k].dataset.deck || list[k].dataset.deckHead || '';
            break;
          }
        }
        row.dataset.deckHead = cleanName(row);
        row.dataset.deck = parent ? parent + '::' + cleanName(row) : cleanName(row);
        row.title = row.dataset.deck;
      });
      paintParents();
    };

    const cleanName = (row) => {
      const dn = row.querySelector('.dname');
      if (!dn) return '';
      const clone = dn.cloneNode(true);
      clone.querySelectorAll('.caret,.chip,.mut,button,input').forEach((n) => n.remove());
      return (clone.textContent || '').trim();
    };

    /* 有子行的才显示三角；点了就收起该行下面的所有后代 */
    const paintParents = () => {
      const list = rows();
      list.forEach((row, i) => {
        const depth = readDepth(row);
        let hasKid = false;
        for (let k = i + 1; k < list.length; k++) {
          const d = readDepth(list[k]);
          if (d <= depth) break;
          hasKid = true;
          break;
        }
        const dn = row.querySelector('.dname');
        let caret = dn.querySelector('.caret');
        if (hasKid && !caret) {
          caret = document.createElement('i');
          caret.className = 'caret open';
          dn.insertBefore(caret, dn.firstChild);
        } else if (!hasKid && caret) {
          caret.remove();
        }
      });
    };

    const toggle = (row) => {
      const caret = row.querySelector('.caret');
      if (!caret) return;
      const list = rows();
      const i = list.indexOf(row);
      const depth = readDepth(row);
      const open = !caret.classList.contains('open');
      caret.classList.toggle('open', open);
      for (let k = i + 1; k < list.length; k++) {
        const d = readDepth(list[k]);
        if (d <= depth) break;
        list[k].hidden = !open;
      }
    };

    /* 造一行 */
    const makeRow = (name, depth, opts = {}) => {
      const row = document.createElement('div');
      row.className = 'drow';
      row.style.setProperty('--dep', String(depth));
      const dn = document.createElement('span');
      dn.className = 'dname';
      const label = document.createElement(opts.link ? 'a' : 'span');
      if (opts.link) label.setAttribute('href', './library.html');
      label.textContent = name;
      dn.appendChild(label);
      if (opts.note) {
        const m = document.createElement('span');
        m.className = 'mut';
        m.textContent = ' · ' + opts.note;
        dn.appendChild(m);
      }
      row.appendChild(dn);
      ['未学习', '学习中', '待复习'].forEach((_, k) => {
        const n = document.createElement('span');
        n.className = k === 1 ? 'dnum learn' : k === 2 ? 'dnum due' : 'dnum';
        n.textContent = '0';
        row.appendChild(n);
      });
      const g = document.createElement('span');
      g.className = 'dgear';
      g.innerHTML =
        '<button class="gear" type="button" title="牌组设置"><svg viewBox="0 0 18 18" width="15" height="15"><circle cx="9" cy="9" r="2.1"/><path d="M9 3.2v1.4M9 13.4v1.4M3.2 9h1.4M13.4 9h1.4M4.9 4.9l1 1M12.1 12.1l1 1M13.1 4.9l-1 1M5.9 12.1l-1 1"/></svg></button>';
      row.appendChild(g);
      return row;
    };

    /* 在某行之后插入子牌组：接在该行所有后代后面 */
    const insertChild = (parentRow, name) => {
      const list = rows();
      const i = list.indexOf(parentRow);
      const depth = readDepth(parentRow) + 1;
      let at = i + 1;
      while (at < list.length && readDepth(list[at]) > readDepth(parentRow)) at++;
      const row = makeRow(name, depth);
      if (at < list.length) card.insertBefore(row, list[at]);
      else card.appendChild(row);
      const caret = parentRow.querySelector('.caret');
      if (caret) caret.classList.add('open');
      reindex();
      return row;
    };

    const appendTop = (name) => {
      const row = makeRow(name, 0);
      card.appendChild(row);
      reindex();
      return row;
    };

    reindex();

    /* ── 小窗：创建牌组 ── */
    const modal = document.getElementById('m-newdeck');
    const selParent = document.getElementById('nd-parent');
    const inpName = document.getElementById('nd-name');
    const preview = document.getElementById('nd-preview');

    const deckList = () => rows().map((r) => ({ row: r, name: r.dataset.deck || '', dep: readDepth(r) }));

    const fillParents = (picked) => {
      if (!selParent) return;
      selParent.innerHTML = '';
      const top = document.createElement('option');
      top.value = '';
      top.textContent = '（顶层）';
      selParent.appendChild(top);
      deckList().forEach((d) => {
        const o = document.createElement('option');
        o.value = d.name;
        o.textContent = (d.dep ? '　'.repeat(d.dep) : '') + d.name;
        selParent.appendChild(o);
      });
      selParent.value = picked || '';
    };

    const paintPreview = () => {
      if (!preview) return;
      const n = (inpName && inpName.value.trim()) || '新牌组';
      const p = selParent ? selParent.value : '';
      preview.textContent = p ? p + '::' + n : n;
    };

    const openNew = (parentName) => {
      fillParents(parentName || '');
      if (inpName) inpName.value = '';
      paintPreview();
      const fake = document.createElement('button');
      fake.setAttribute('data-modal', 'm-newdeck');
      fake.hidden = true;
      document.body.appendChild(fake);
      fake.click();
      fake.remove();
      setTimeout(() => inpName && inpName.focus(), 60);
    };

    inpName && inpName.addEventListener('input', paintPreview);
    selParent && selParent.addEventListener('change', paintPreview);

    const submit = () => {
      const name = (inpName && inpName.value.trim()) || '';
      if (!name) {
        inpName && inpName.focus();
        return;
      }
      const closeBtn = modal && modal.querySelector('[data-close]');
      const finish = (row) => {
        closeBtn && closeBtn.click();
        if (!row) return;
        if (window.__deckToast) window.__deckToast('建好了「' + row.dataset.deck + '」');
        row.scrollIntoView({ block: 'nearest' });
        row.classList.add('flash');
        setTimeout(() => row.classList.remove('flash'), 900);
      };

      /* Anki 那条最好用的：名字里直接带 :: 就当路径走，缺的层级自动补齐 */
      if (name.includes('::')) {
        const segs = name.split('::').map((x) => x.trim()).filter(Boolean);
        let path = selParent ? selParent.value : '';
        let last = null;
        segs.forEach((seg) => {
          const full = path ? path + '::' + seg : seg;
          const exist = rows().find((r) => r.dataset.deck === full);
          if (exist) {
            last = exist;
          } else if (path) {
            const par = rows().find((r) => r.dataset.deck === path);
            last = par ? insertChild(par, seg) : appendTop(seg);
          } else {
            last = appendTop(seg);
          }
          path = full;
        });
        finish(last);
        return;
      }

      const pName = selParent ? selParent.value : '';
      const parent = pName ? rows().find((r) => r.dataset.deck === pName) : null;
      finish(parent ? insertChild(parent, name) : appendTop(name));
    };

    document.addEventListener('click', (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;

      if (t.closest('[data-newdeck]')) {
        e.preventDefault();
        openNew('');
        return;
      }
      if (t.closest('#nd-ok')) {
        e.preventDefault();
        submit();
        return;
      }
      const caret = t.closest('.drow .caret');
      if (caret) {
        e.preventDefault();
        toggle(caret.closest('.drow'));
        return;
      }
      const gear = t.closest('.drow .gear');
      if (gear) {
        // 齿轮走 app2.js 原来的菜单，这里不管
        return;
      }
    });

    /* 右键任意一行 → 菜单（Anki 就是这个操作） */
    card.addEventListener('contextmenu', (e) => {
      const row = e.target instanceof Element ? e.target.closest('.drow') : null;
      if (!row) return;
      e.preventDefault();
      card.querySelectorAll('.drow.ctx').forEach((r) => r.classList.remove('ctx'));
      row.classList.add('ctx');
      const menu = document.getElementById('deckmenu');
      if (!menu) return;
      // 让 app2.js 认这一行：它自己管菜单开关，这里只把位置和行号递过去
      const gear = row.querySelector('.gear');
      if (gear) {
        const ev = new MouseEvent('click', { bubbles: true, clientX: e.clientX, clientY: e.clientY });
        gear.dispatchEvent(ev);
        menu.hidden = false;
        const w = menu.offsetWidth;
        const h = menu.offsetHeight;
        const left = Math.max(12, Math.min(e.clientX, window.innerWidth - w - 12));
        const top = Math.max(12, Math.min(e.clientY, window.innerHeight - h - 12));
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.dataset.ctxRow = '';
        window.__deckCtxRow = row;
      }
    });

    /* 菜单里的「创建子牌组」 */
    document.addEventListener('click', (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      const btn = t.closest('#deckmenu button[data-act]');
      if (!btn || btn.dataset.act !== 'subdeck') return;
      const row = window.__deckCtxRow || null;
      const name = row ? row.dataset.deck : '';
      if (window.__deckToast) window.__deckToast('');
      openNew(name);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

  /* 菜单一关就清掉行高亮（app2.js 的 closeMenu 在这里够不着） */
  document.addEventListener('click', () => {
    const m = document.getElementById('deckmenu');
    if (m && m.hidden) document.querySelectorAll('.drow.ctx').forEach((r) => r.classList.remove('ctx'));
  });
