import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import { getPack, markExported } from './packs.js'
import { defaultExportDir } from './paths.js'
import { FactoryError, normalizeSpace } from './util.js'
import { validateManifest } from '../contract/validate.js'

/**
 * 把打好的成品包搬到用户能拿去用的地方。
 *
 * 这一步**只做拷贝**：源目录是 `factory/packs/<id>/`，目标目录是
 * `exportDir/<slug>-<id>/`，两边都是同一个 v2 卡片包结构（manifest.json +
 * images/ + audio/）。拷完不删源，也不改源 —— 导出失败不会毁掉工厂里那份。
 *
 * 为什么不打包成 zip：包里本来就是照片和 mp3，压缩率极低，而 zip 之后
 * 人就没法用系统看图工具一张张验证了。这个包的卖点恰恰是「每张图都有人
 * 点过头」，让人能直接翻，比省那几个字节重要。
 */

/** `run out of` → `run-out-of`；留给目录名，别塞奇怪字符进去。 */
export function slugify(text) {
  const slug = normalizeSpace(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')
  return slug || 'pack'
}

const escapeHtml = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * 写一个不依赖任何东西的 `cards.html`。
 *
 * 这个包的成品是给「人」看的：一句真话、一张有人挑过的照片、一条听过
 * 的语音。如果它只以 `manifest.json` + 二十位哈希命名的文件存在，那看
 * 的人第一步就得先装个工具 —— 那就等于没做给人看。
 *
 * 不用 JS 框架、不内联 base64：媒体就在同目录 `images/`、`audio/` 里，
 * 相对路径直接取。整个文件也就十几 KB。
 */
async function writeCardsHtml(dir, manifest) {
  const lesson = manifest.lesson ?? {}
  const examples = manifest.examples ?? []
  const tag = (text) => (text ? `<span class="tag">${escapeHtml(text)}</span>` : '')
  const cards = examples
    .map((one) => {
      const image = one.media?.image
      const audio = one.media?.audio
      const zhVariants = (one.zh_variants ?? []).map((text) => escapeHtml(text)).join(' ／ ')
      const credit = image
        ? [image.author, image.license, image.source].filter(Boolean).map(escapeHtml).join(' · ')
        : ''
      return `
    <article class="card">
      ${
        image
          ? `<a class="shot" href="${escapeHtml(image.file)}" target="_blank" rel="noreferrer">
        <img src="${escapeHtml(image.file)}" alt="" loading="lazy" width="${image.width}" height="${image.height}">
      </a>`
          : '<div class="shot shot-missing">这条没有配图</div>'
      }
      <div class="side">
        <h2>${escapeHtml(one.sentence)}</h2>
        ${one.scene_en ? `<p class="scene-en">${escapeHtml(one.scene_en)}</p>` : ''}
        ${one.scene_zh ? `<p class="scene-zh">${escapeHtml(one.scene_zh)}</p>` : ''}
        <div class="tags">${tag(one.register)}${tag(one.voice_hint)}</div>
        ${
          audio
            ? `<div class="audio">
          <audio controls preload="none" src="${escapeHtml(audio.file)}"></audio>
          <span class="meta">${audio.seconds ? `${Number(audio.seconds).toFixed(2)} 秒` : ''}${
            audio.engine ? ` · ${escapeHtml(audio.engine)}` : ''
          }${audio.voice ? ` · ${escapeHtml(audio.voice)}` : ''}</span>
        </div>`
            : ''
        }
        ${credit ? `<p class="credit">${credit}</p>` : ''}
      </div>
    </article>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(lesson.target)} · 卡片</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #15171c;
    --surface: #1d2027;
    --border: #2c313b;
    --ink: #f0f0f0;
    --ink-2: #a9adb6;
    --ink-3: #7b8089;
    --brand: #6f8bff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 15px/1.6 "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  }
  header {
    padding: 28px 24px 18px;
    border-bottom: 1px solid var(--border);
    max-width: 1080px;
    margin: 0 auto;
  }
  h1 { font-size: 34px; margin: 0 0 6px; letter-spacing: -0.01em; }
  .gloss { color: var(--ink-2); margin: 0 0 10px; }
  .tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 0; }
  .tag {
    font-size: 11px; padding: 2px 7px; border-radius: 6px;
    border: 1px solid var(--border); color: var(--ink-2);
  }
  main { max-width: 1080px; margin: 0 auto; padding: 18px 24px 60px; }
  .card {
    display: flex; gap: 0; border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden; background: var(--surface); margin: 0 0 14px;
  }
  .shot { flex: 0 0 42%; display: block; background: #0e1014; }
  .shot img { display: block; width: 100%; height: 240px; object-fit: cover; }
  .shot-missing {
    display: flex; align-items: center; justify-content: center;
    color: var(--ink-3); font-size: 12px; min-height: 240px;
  }
  .side { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
  .side h2 {
    margin: 0; font-size: 24px; line-height: 1.35; letter-spacing: -0.005em;
    font-family: Georgia, "Songti SC", serif; font-weight: 600;
  }
  .scene-en { margin: 2px 0 0; color: var(--ink-2); font-size: 13px; }
  .scene-zh { margin: 0; color: var(--ink-2); font-size: 13px; }
  .audio { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
  .audio audio { height: 32px; }
  .meta { font-size: 11px; color: var(--ink-3); }
  .credit { margin: 4px 0 0; font-size: 11px; color: var(--ink-3); }
  footer {
    max-width: 1080px; margin: 0 auto; padding: 0 24px 40px;
    color: var(--ink-3); font-size: 12px;
  }
  footer code { color: var(--ink-2); }
  @media (max-width: 760px) {
    .card { flex-direction: column; }
    .shot { flex: none; }
    .shot img { height: 220px; }
    .side h2 { font-size: 20px; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .card { transition: border-color 140ms ease; }
    .card:hover { border-color: #3a4150; }
  }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(lesson.target)}</h1>
  ${lesson.gloss ? `<p class="gloss">${escapeHtml(lesson.gloss)}</p>` : ''}
  <div class="tags">
    ${tag(lesson.kind)}${tag(lesson.language)}${tag(lesson.ipa)}
    ${tag(lesson.voice?.engine ? `语音 ${lesson.voice.engine}` : '')}
    ${tag(`${examples.length} 条`)}
  </div>
</header>
<main>${cards}</main>
<footer>
  这个文件是导出时顺手生成的，图片和音频就在同目录里，整个文件夹拷走也能看。<br>
  清单文件：<code>manifest.json</code>（格式 ${escapeHtml(manifest.format)} v${escapeHtml(manifest.format_version)}）
  · 生成于 ${escapeHtml(manifest.created_at)}
</footer>
</body>
</html>
`
  await writeFile(join(dir, 'cards.html'), html, 'utf8')
}

export async function exportPack({ root, packId, exportDir, signal, onProgress } = {}) {
  const pack = await getPack(root, packId)
  if (!pack.pack?.dir) throw new FactoryError('这个包还没打包，先打包再导出。', 'not-packed')
  if (signal?.aborted) throw new FactoryError('取消了。', 'aborted')

  const base = resolve(normalizeSpace(exportDir) || defaultExportDir())
  const target = join(base, `${slugify(pack.lesson?.target ?? pack.target)}-${pack.id}`)

  // 只许清掉「自己的」那一份：目标目录必须落在导出根之下，且名字以 -<packId>
  // 结尾。否则宁可不删 —— 一个手滑的 rm -rf 比多留几个旧文件糟得多。
  const inside = relative(base, resolve(target))
  if (!inside || inside.startsWith('..') || !inside.endsWith(pack.id)) {
    throw new FactoryError(`导出目录不对：${target}`, 'bad-export-dir')
  }

  onProgress?.(`正在拷到 ${target}`)
  await mkdir(base, { recursive: true })
  // 先清空再加：同一个包重导时（换了图、改了例句条数）旧文件不能留着，
  // 否则目录里会躺着 manifest 里根本没提过的图片，人一看就觉得包是坏的。
  await rm(target, { recursive: true, force: true })
  await cp(pack.pack.dir, target, { recursive: true, force: true })
  if (signal?.aborted) throw new FactoryError('取消了。', 'aborted')

  let files = 0
  let bytes = 0
  const count = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await count(path)
      else {
        files += 1
        bytes += (await stat(path)).size
      }
    }
  }
  await count(target)

  // 拷完立刻拿**导出那份**过一遍契约：哈希对不上、文件少一张、图太矮，
  // 都在这里拦。源目录好的不代表副本好的（拷一半断电就是这么坏的）。
  onProgress?.('正在复验导出副本')
  const manifest = JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8'))
  const verdict = await validateManifest(manifest, {
    loadFile: (rel) => readFile(join(target, rel)),
  })
  if (!verdict.ok) {
    throw new FactoryError(
      `导出副本没过校验，源包还在，先别删：${verdict.errors.map((e) => e.message).join('；')}`,
      'export-invalid',
      { errors: verdict.errors, target },
    )
  }

  // 顺手写一个能双击打开的 cards.html：包是给「人」看的，不该只有
  // 一个 manifest.json 和一堆哈希命名的文件。不依赖任何服务、不联网，
  // 图片音频都从同目录相对路径取，所以拷到哪都能开。
  onProgress?.('正在生成 cards.html')
  await writeCardsHtml(target, manifest)
  files += 1
  bytes += (await stat(join(target, 'cards.html'))).size

  onProgress?.(`导出完成：${files} 个文件`)
  const result = {
    dir: target,
    files,
    bytes,
    verified: true,
    // 原样留给界面：让用户能一眼看出「导出的是哪一份」
    sourceDir: pack.pack.dir,
    manifestPath: join(target, 'manifest.json'),
  }
  // 记账放在这里而不是调用方：不管是从界面、RPC 还是自检脚本导出，
  // 账本都得知道「这个包导出到哪了」，否则状态页会说它还没导出。
  await markExported(root, packId, result)
  return result
}
