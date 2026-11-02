/* 生成 15 页样式稿。唯一真源：design/gen/pages/*.mjs
   用法：cd design && node gen.mjs
   产物：design/<page>.html（定稿版）+ design/v/<page>-v1..3.html（对比版）
   注意：中文一律走这个脚本写盘，不要用 PowerShell 改文件（默认 GB2312 会把中文弄乱）。 */
import fs from 'node:fs';
import path from 'node:path';
import { setBase } from './gen/ui.mjs';

const designDir = import.meta.dirname;
const pagesDir = path.join(designDir, 'gen', 'pages');
const vDir = path.join(designDir, 'v');

fs.mkdirSync(vDir, { recursive: true });

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
const written = [];

for (const f of files) {
  const mod = await import(new URL('./gen/pages/' + f, import.meta.url).href);
  const { meta, build } = mod;
  if (!meta || !build) {
    console.error('跳过', f, '：缺少 meta 或 build');
    continue;
  }
  const variants = meta.variants || [1, 2, 3];
  for (const v of variants) {
    setBase('../');
    const html = build(v, { base: '../' });
    fs.writeFileSync(path.join(vDir, `${meta.name}-v${v}.html`), html, 'utf8');
  }
  setBase('');
  const main = build(meta.pick || 1, { base: '' });
  fs.writeFileSync(path.join(designDir, meta.name + '.html'), main, 'utf8');
  written.push({ name: meta.name, pick: meta.pick || 1, variants, title: meta.title });
}

/* 清理没有真源的旧页面 */
const keep = new Set(written.map((w) => w.name + '.html'));
for (const f of fs.readdirSync(designDir)) {
  if (f.endsWith('.html') && !keep.has(f)) {
    fs.unlinkSync(path.join(designDir, f));
    console.log('清掉旧页', f);
  }
}

/* 对比页索引：一屏看三个版本 */
const idx = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>版本对比</title>
<link rel="stylesheet" href="../system.css">
<style>
body{padding:24px 28px;font-size:14px}
.row{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:12px 0;border-bottom:1px solid var(--c-line)}
.row h3{width:140px;font-size:13px;font-weight:600;flex:none;margin:0}
a.v{border-radius:6px;padding:5px 10px;font-size:12px;box-shadow:inset 0 0 0 1px var(--c-line-2);color:var(--c-ink-2)}
a.v:hover{background:rgba(255,255,255,.06)}
a.v.p{color:var(--c-accent);background:var(--c-accent-soft);box-shadow:inset 0 0 0 1px var(--c-accent-line)}
</style></head><body>
<h1 style="font-size:20px;margin:0 0 6px">15 页 · 版本对比</h1>
<p style="font-size:12.5px;color:var(--c-ink-3);margin:0 0 16px">每页三版，蓝底是定稿那版；右边另开正式页。</p>
${written
  .map(
    (w) => `<div class="row"><h3>${w.name}</h3>${w.variants
      .map((v) => `<a class="v ${v === w.pick ? 'p' : ''}" href="./${w.name}-v${v}.html">v${v}</a>`)
      .join('')}<a class="v" href="../${w.name}.html">正式页 ↗</a></div>`
  )
  .join('\n')}
</body></html>`;
fs.writeFileSync(path.join(vDir, 'index.html'), idx, 'utf8');

console.log('写了', written.length, '页 →', designDir);
console.log(written.map((w) => `${w.name}(v${w.pick})`).join('  '));
