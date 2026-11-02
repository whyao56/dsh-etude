/* 把生成出来的方图裁成 4:3 卡片图（顺手裁掉右下角的水印）。
   用法：node tools/photos.mjs  <源图> <目标名>
   生成物：design/assets/photos/<目标名>.jpg  1200×900 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [, , src, name] = process.argv;
if (!src || !name) {
  console.error('用法：node tools/photos.mjs <源图> <目标名>');
  process.exit(1);
}
const out = path.join(import.meta.dirname, '..', 'assets', 'photos', name + '.jpg');
fs.mkdirSync(path.dirname(out), { recursive: true });

const img = sharp(src);
const m = await img.metadata();
const w = m.width;
const h = m.height;
const keep = Math.round(h * 0.915); // 底部 8.5% 是水印
const ratio = 4 / 3;
let cw = Math.min(w, Math.round(keep * ratio));
let ch = Math.round(cw / ratio);
const left = Math.round((w - cw) / 2);
const top = Math.round((keep - ch) / 2);

await img
  .extract({ left, top, width: cw, height: ch })
  .resize(1200, 900, { fit: 'cover' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(out);

const st = fs.statSync(out);
console.log(out, '1200x900', Math.round(st.size / 1024) + 'KB');
