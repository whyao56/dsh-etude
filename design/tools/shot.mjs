/* 截图：node tools/shot.mjs <页面名> <宽> <高> [输出名]
   产物落 design/_shots/。用 Chrome 自带的 --screenshot，不依赖 puppeteer。 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const here = import.meta.dirname;
const [, , page, w = '1440', h = '900', name] = process.argv;
if (!page) {
  console.error('用法：node tools/shot.mjs <页面名> <宽> <高> [输出名]');
  process.exit(1);
}
const outDir = path.join(here, '..', '_shots');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, (name || `${page}-${w}`) + '.png');
if (fs.existsSync(out)) fs.unlinkSync(out);

const url = 'file:///' + path.join(here, '..', page + '.html').replace(/\\/g, '/');
const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--allow-file-access-from-files',
  '--virtual-time-budget=2600',
  `--window-size=${w},${h}`,
  `--screenshot=${out}`,
  url,
];
const p = spawn(CHROME, args, { stdio: 'ignore' });
p.on('exit', (code) => {
  if (fs.existsSync(out)) {
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${out}  ${w}x${h}  ${kb}KB`);
  } else {
    console.log('没出图，chrome 退出码', code);
    process.exitCode = 1;
  }
});
