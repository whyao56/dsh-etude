
/* ── 第二批交互：弹窗 / 取色 / 字号预览 / 切页过渡 / 语言 / 新人引导 ──
   必须在 app.js 之后加载，共用同一套 DOM 约定。 */
const boot2 = () => {
  const root = document.documentElement;
  /* 浮层必须挪到 body 下：.page 有 zoom + 动画，会把 position:fixed 关在里面 */
  document.querySelectorAll('.mask, .guide').forEach((el) => document.body.appendChild(el));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── 1. 弹窗 ── */
  let openSheet = null;
  const showSheet = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    hideSheet();
    m.hidden = false;
    openSheet = m;
    requestAnimationFrame(() => m.classList.add('in'));
    const sheet = m.querySelector('.sheet');
    if (sheet) {
      sheet.setAttribute('tabindex', '-1');
      setTimeout(() => sheet.focus({ preventScroll: true }), 40);
    }
  };
  const hideSheet = () => {
    if (!openSheet) return;
    const m = openSheet;
    m.classList.remove('in');
    setTimeout(() => {
      m.hidden = true;
    }, 160);
    openSheet = null;
  };

  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const opener = t.closest('[data-modal]');
    if (opener) {
      e.preventDefault();
      showSheet(opener.getAttribute('data-modal'));
      return;
    }
    if (t.closest('[data-close]')) {
      e.preventDefault();
      hideSheet();
      return;
    }
    /* 点遮罩空白处关掉；点面板内部不关 */
    if (openSheet && t === openSheet) hideSheet();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openSheet) {
      e.stopPropagation();
      hideSheet();
    }
  });

  /* ── 2. 自定义配色：一个色 → 深/浅两套 ── */
  const hex2rgb = (h) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mix = (c, to, k) => c.map((v, i) => Math.round(v + (to[i] - v) * k));
  const css = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  const applyCustom = (hex) => {
    const c = hex2rgb(hex);
    const light = root.getAttribute('data-theme') === 'light';
    const accent = light ? mix(c, [10, 18, 30], 0.34) : mix(c, [255, 255, 255], 0.06);
    const on = light ? [255, 255, 255] : mix(c, [8, 12, 22], 0.74);
    const cont = light ? mix(c, [255, 255, 255], 0.8) : mix(c, [16, 24, 40], 0.52);
    const onCont = light ? mix(c, [18, 26, 44], 0.5) : mix(c, [255, 255, 255], 0.72);
    root.style.setProperty('--accent', css(accent));
    root.style.setProperty('--accent-rgb', accent.join(','));
    root.style.setProperty('--on-accent', css(on));
    root.style.setProperty('--accent-cont', css(cont));
    root.style.setProperty('--on-accent-cont', css(onCont));
    root.setAttribute('data-accent-name', 'custom');
    document.dispatchEvent(new Event('lookchange'));
  };

  const swCustom = $('#sw-custom');
  const acPick = $('#ac-pick');
  const acVal = $('#ac-val');
  if (swCustom) {
    swCustom.addEventListener('input', () => {
      $$('.sw2').forEach((s) => s.classList.remove('on'));
      swCustom.classList.add('on');
      applyCustom(swCustom.value);
    });
    swCustom.addEventListener('click', (e) => e.stopPropagation());
  }
  if (acPick) {
    const paint = () => {
      if (acVal) acVal.textContent = acPick.value.toUpperCase();
      applyCustom(acPick.value);
    };
    acPick.addEventListener('input', paint);
    $$('[data-accent="custom"]').forEach((el) => {
      el.addEventListener('click', () => {
        if (acPick) acPick.value = acPick.value || '#97B1F0';
      });
    });
    const go = $('#ac-go');
    if (go) go.addEventListener('click', paint);
  }

  /* ── 3. 切页过渡 ── */
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a') : null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('http') || a.target === '_blank') return;
    if (href.endsWith('.html')) {
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => {
        window.location.href = href;
      }, 295);
    }
  });
  window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  /* ── 4. 语言：界面骨架换英文（正文还没译） ── */
  const EN = {
    卡片: 'Cards',
    工厂: 'Mine',
    统计: 'Stats',
    插件: 'Plugin',
    教程: 'Guide',
    社区: 'Community',
    导入: 'Import',
    导出: 'Export',
    帮助: 'Help',
    同步: 'Sync',
    退出: 'Quit',
    全局设置: 'Settings',
    外观: 'Appearance',
    通用: 'General',
    接口: 'API',
    智能体: 'Agent',
    工具: 'Tools',
    快捷键: 'Shortcuts',
    数据: 'Data',
    关于: 'About',
    语言: 'Language',
    通知: 'Notifications',
    权限: 'Permissions',
    隐私: 'Privacy',
    主题: 'Theme',
    主题配色: 'Accent',
    字体: 'Typeface',
    字号: 'Text size',
    缩放: 'Zoom',
    开始: 'Start',
    存下: 'Save',
    取消: 'Cancel',
    关掉: 'Close',
    知道了: 'Got it',
    设置: 'Edit',
    检查: 'Check',
    细节: 'Details',
    界面: 'Interface',
    能力: 'Capabilities',
    操作: 'Controls',
    其它: 'Others',
    打开目录: 'Open',
    换: 'Change',
    开: 'On',
    存下: 'Save',
    下一步: 'Next',
    跳过: 'Skip',
  };
  const setLang = (lang) => {
    root.setAttribute('data-lang', lang);
    $$('body *').forEach((el) => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (!t) return;
      if (lang === 'en') {
        const v = EN[t];
        if (v) {
          el.dataset.zh = t;
          el.textContent = v;
        }
      } else if (el.dataset.zh) {
        el.textContent = el.dataset.zh;
        delete el.dataset.zh;
      }
    });
    try {
      localStorage.setItem('kf-test:lang', lang);
    } catch (err) {
      /* ignore */
    }
  };
  $$('[data-set="lang"] span').forEach((s) => {
    s.addEventListener('click', () => {
      $$('[data-set="lang"] span').forEach((x) => x.classList.remove('on'));
      s.classList.add('on');
      setLang(s.getAttribute('data-val') || 'zh');
    });
  });
  try {
    const saved = localStorage.getItem('kf-test:lang');
    if (saved && saved !== 'zh') setLang(saved);
  } catch (err) {
    /* ignore */
  }

  /* ── 5. 新人引导（只在卡片页、第一次来） ── */
  const guide = $('#guide');
  if (guide) {
    const KEY = 'kf-test:onboarded';
    /* 地址栏加 ?guide=1 可以再看一遍 */
    const force = location.search.indexOf('guide=1') >= 0;
    let done = false;
    try {
      done = !force && localStorage.getItem(KEY) === '1';
    } catch (err) {
      done = false;
    }
    if (!done) {
      guide.hidden = false;
      const steps = $$('.gstep', guide);
      const bNext = $('#g-next');
      const show = (i) => {
        steps.forEach((s, k) => s.classList.toggle('on', k === i));
        $$('.gdot', guide).forEach((d, k) => d.classList.toggle('on', k === i));
        if (bNext) bNext.textContent = i === steps.length - 1 ? '开始用' : '下一步';
      };
      show(0);
      $$('.gdot', guide).forEach((d, k) => {
        d.addEventListener('click', () => show(k));
      });
      $('#g-next')?.addEventListener('click', () => {
        const cur = steps.findIndex((s) => s.classList.contains('on'));
        if (cur < steps.length - 1) show(cur + 1);
        else {
          try {
            localStorage.setItem(KEY, '1');
          } catch (err) {
            /* ignore */
          }
          guide.classList.add('out');
          setTimeout(() => {
            guide.hidden = true;
          }, 260);
        }
      });
      $('#g-skip')?.addEventListener('click', () => {
        try {
          localStorage.setItem(KEY, '1');
        } catch (err) {
          /* ignore */
        }
        guide.classList.add('out');
        setTimeout(() => {
          guide.hidden = true;
        }, 260);
      });
    }
  }

  /* ── 牌组行：齿轮菜单 / 选项小窗 / 删除 + Ctrl+Z ── */
  const dmenu = $('#deckmenu');
  if (dmenu) {
    if (dmenu.parentElement !== document.body) document.body.appendChild(dmenu);
    let curRow = null;

    const closeMenu = () => {
      dmenu.hidden = true;
      curRow = null;
    };

    const openModal = (id) => {
      const fake = document.createElement('button');
      fake.setAttribute('data-modal', id);
      fake.hidden = true;
      document.body.appendChild(fake);
      fake.click();
      fake.remove();
    };

    /* 小提示条 */
    let toastEl = null;
    let toastTimer = 0;
    const toast = (text, actionText, onAction) => {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
      }
      toastEl.innerHTML = '';
      const span = document.createElement('span');
      span.textContent = text;
      toastEl.appendChild(span);
      if (actionText) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = actionText;
        b.addEventListener('click', () => {
          onAction();
          toastEl.classList.remove('in');
        });
        toastEl.appendChild(b);
      }
      const foot = document.querySelector('.deckfoot');
      if (foot) {
        const fr = foot.getBoundingClientRect();
        toastEl.style.bottom = Math.max(24, window.innerHeight - fr.top + 12) + 'px';
      } else {
        toastEl.style.bottom = '';
      }
      toastEl.classList.add('in');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('in'), 4200);
    };
    window.__deckToast = toast;

    /* 删除记录，Ctrl+Z 撤回 */
    const removed = [];

    const doRename = (rowEl) => {
      const nameEl = rowEl.querySelector('.dname');
      const link = nameEl.querySelector('a');
      const target = link || nameEl;
      const old = link ? link.textContent : nameEl.textContent;
      const input = document.createElement('input');
      input.className = 'inp sm';
      input.value = old;
      target.replaceWith(input);
      input.focus();
      input.select();
      const commit = (ok) => {
        const v = input.value.trim() || old;
        const back = document.createElement(link ? 'a' : 'span');
        if (link) back.setAttribute('href', link.getAttribute('href'));
        back.textContent = v;
        input.replaceWith(back);
        if (ok && v !== old) toast('已重命名为「' + v + '」');
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          commit(false);
        }
      });
      input.addEventListener('blur', () => commit(true));
    };

    const doDelete = (rowEl) => {
      const dn = rowEl.querySelector('.dname');
      const name = ((dn.childNodes[0] && dn.childNodes[0].textContent) || dn.textContent || '').trim();
      const parent = rowEl.parentElement;
      const next = rowEl.nextElementSibling;
      rowEl.remove();
      removed.push({ rowEl, parent, next, name });
      toast('删了「' + name + '」', '撤回', () => {
        const rec = removed.pop();
        if (!rec) return;
        rec.parent.insertBefore(rec.rowEl, rec.next);
        toast('回来了');
      });
    };

    document.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        if (!removed.length) return;
        e.preventDefault();
        const rec = removed.pop();
        rec.parent.insertBefore(rec.rowEl, rec.next);
        toast('撤回：' + rec.name + ' 回来了');
      }
    });

    document.addEventListener('click', (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;

      const gear = t.closest('.drow .gear');
      if (gear) {
        e.preventDefault();
        const rowEl = gear.closest('.drow');
        if (curRow === rowEl && !dmenu.hidden) {
          closeMenu();
          return;
        }
        curRow = rowEl;
        dmenu.hidden = false;
        const r = gear.getBoundingClientRect();
        const w = dmenu.offsetWidth;
        const h = dmenu.offsetHeight;
        let left = r.right - w;
        left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
        let top = r.bottom + 6;
        if (top + h > window.innerHeight - 12) top = r.top - h - 6;
        dmenu.style.left = left + 'px';
        dmenu.style.top = top + 'px';
        return;
      }

      if (t.closest('#deckmenu')) {
        const btn = t.closest('button[data-act]');
        if (!btn || !curRow) return;
        const rowEl = curRow;
        const act = btn.getAttribute('data-act');
        closeMenu();
        if (act === 'rename') doRename(rowEl);
        else if (act === 'options') openModal('m-deckopt');
        else if (act === 'export') toast('导出这个牌组…（还没接）');
        else if (act === 'delete') doDelete(rowEl);
        return;
      }

      if (!dmenu.hidden && !t.closest('#deckmenu')) closeMenu();
    });
  }

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot2);
} else {
  boot2();
}
