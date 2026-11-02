/* 工厂 v3：五面就绪计算（2026-11-01）
   ────────────────────────────────────────────────
   hardcoded "差3个"改成真正算：每句话有图/声/变体三项，
   每项的有无决定五个面哪些算齐了。
   示例数据：c1.jpg = 有图，voice = 有声，variations = 变体数 */
(() => {
  const boot = () => {
    /* 模拟数据：每句话的资产 */
    const sentences = {
      'The crew abandoned ship within minutes.': { img: 'c1.jpg', voice: true, variations: 0 },
      'They abandoned the plan after one meeting.': { img: 'c2.jpg', voice: true, variations: 0 },
      'Someone abandoned a puppy outside our gate.': { img: 'c3.jpg', voice: false, variations: 0 },
      "Don't abandon hope yet.": { img: null, voice: null, variations: 0 },
      'He abandoned his family and moved abroad.': { img: 'c1.jpg', voice: true, variations: 0 },
      'They danced with wild abandon.': { img: null, voice: null, variations: 0 },
    };

    /* 五个面的就绪条件：
       听 = 声 + 图 · 说 = 图 · 读 = 句子本身（永远齐）· 写 = 图 · 改 = 至少3个变体 */
    const calcFace = (sent, assets) => {
      const has = assets || {};
      return {
        listen: has.img && has.voice ? 'ok' : (!has.img && !has.voice ? '都缺' : has.voice ? '缺图' : '差语音'),
        speak: has.img ? 'ok' : '缺图',
        read: 'ok',
        write: has.img ? 'ok' : '缺图',
        vary: (has.variations || 0) >= 3 ? 'ok' : `差 ${3 - (has.variations || 0)} 个`,
      };
    };

    /* 工厂页：每一句的五个面 */
    document.querySelectorAll('.wrow').forEach((row) => {
      const summary = row.querySelector('summary .ws');
      if (!summary) return;
      const text = summary.textContent.replace(/<[^>]*>/g, '').trim();
      const assets = sentences[text];
      if (!assets) return; // 页面写死的例句不在模拟数据里，跳过

      const status = calcFace(text, assets);
      const flist = row.querySelector('.flist');
      if (!flist) return;

      const lines = flist.querySelectorAll('.fline');
      lines.forEach((line, i) => {
        const chip = line.querySelector('.chip');
        if (!chip) return;
        const face = ['listen', 'speak', 'read', 'write', 'vary'][i];
        const st = status[face];
        if (st === 'ok') {
          chip.textContent = '齐了';
          chip.className = 'chip ok';
        } else {
          chip.textContent = st;
          chip.className = 'chip';
        }
      });

      // 顶行五面小点：ok→绿 · warn→黄 · 空→灰
      const f5row = row.querySelector('.wmeta .f5row');
      if (f5row) {
        const dots = f5row.querySelectorAll('.fi');
        dots.forEach((dot, i) => {
          const face = ['listen', 'speak', 'read', 'write', 'vary'][i];
          const st = status[face];
          dot.className = 'fi ' + (st === 'ok' ? 'ok' : st.includes('差') || st.includes('缺') ? 'warn' : '');
        });
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
