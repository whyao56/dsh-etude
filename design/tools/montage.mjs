/* 把几张截图拼成一张联络表：node tools/montage.mjs out.png a.png b.png c.png d.png */
import sharp from 'sharp';
import fs from 'node:fs';

const [, , out, ...files] = process.argv;
const W = 700;
const cols = files.length > 4 ? 3 : 2;
const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
const tiles = await Promise.all(
  files.map(async (f, i) => {
    const m = metas[i];
    const h = Math.round((m.height / m.width) * W);
    const buf = await sharp(f).resize(W, h, { fit: 'cover', position: 'top' }).png().toBuffer();
    return { buf, h };
  })
);
const rowH = [];
const rows = Math.ceil(files.length / cols);
for (let r = 0; r < rows; r++) rowH[r] = Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h));
const H = rowH.reduce((a, b) => a + b, 0);
const comps = tiles.map((t, i) => {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const y = rowH.slice(0, r).reduce((a, b) => a + b, 0);
  return { input: t.buf, left: c * W, top: y };
});
await sharp({ create: { width: W * cols, height: H, channels: 3, background: '#000' } })
  .composite(comps)
  .png()
  .toFile(out);
console.log(out, `${W * cols}x${H}`, Math.round(fs.statSync(out).size / 1024) + 'KB');
