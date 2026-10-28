/**
 * 用代码做这个插件的教程视频。
 *
 * 做法一句话：把 `narration.mjs` 里的每段旁白拿去 Edge 合成中文语音，量出真实时长，
 * 再按这个时长逐帧画 SVG、交给 ffmpeg 编码。所以画面和声音是严丝合缝的 ——
 * 改一句稿子重新跑一遍，画面自己会跟着变长变短。
 *
 * 为什么用 SVG 画帧而不是截网页：一帧网页要开一次浏览器，五千帧没法做；
 * 而 SVG 能精确控制每一个字的位置和淡入时刻，sharp 一帧只要几十毫秒。
 *
 * 用法：
 *   node docs/video/build.mjs                    # 出完整片子
 *   node docs/video/build.mjs --still 12,40,90   # 只导出这几个时间点的静帧看排版
 *   node docs/video/build.mjs --ffmpeg <路径>    # 指定 ffmpeg
 *
 * 依赖：ffmpeg（libx264）、sharp、ws、能连 Edge 合成端点。
 */
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { once } from 'node:events'
import { createRequire } from 'node:module'

import { narration } from './narration.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..', '..')

const W = 1280
const H = 720
const FPS = 25
const VOICE = 'zh-CN-XiaoxiaoNeural'
const RATE = '+8%'
const GAP = 0.42 // 段与段之间的安静
const LEAD = 0.7
const TAIL = 1.4

const args = process.argv.slice(2)
const arg = (name, fallback = null) => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 ? args[at + 1] ?? fallback : fallback
}

/* ---------- 依赖 ---------- */

async function loadSharp() {
  const require = createRequire(join(repo, 'package.json'))
  return require('sharp')
}

function resolveFfmpeg() {
  const explicit = arg('ffmpeg') ?? process.env.FFMPEG
  if (explicit && existsSync(explicit)) return explicit
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (probe.status === 0) return 'ffmpeg'
  const local = 'F:/dsharness/probe/video/node_modules/ffmpeg-static/ffmpeg.exe'
  if (existsSync(local)) return local
  throw new Error('找不到 ffmpeg。用 --ffmpeg 指定，或者放一份在 PATH 里。')
}

/* ---------- 文字工具 ---------- */

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** 估宽：中日韩按一个字一个字宽算，ASCII 按 0.55，够排版用了。 */
function textWidth(text, size, mono = false) {
  let total = 0
  for (const char of text) {
    const code = char.codePointAt(0)
    if (code > 0x2e80) total += size * 1.0
    else if (mono) total += size * 0.6
    else if (/[ilj.,'!|:]/.test(char)) total += size * 0.3
    else total += size * 0.56
  }
  return total
}

function wrap(text, maxWidth, size, mono = false) {
  const lines = []
  let line = ''
  for (const char of String(text)) {
    if (char === '\n') {
      lines.push(line)
      line = ''
      continue
    }
    if (textWidth(line + char, size, mono) > maxWidth && line) {
      // 中文可以在任意处断，英文尽量断在空格上
      const cut = line.lastIndexOf(' ')
      if (!mono && cut > line.length * 0.5) {
        lines.push(line.slice(0, cut))
        line = line.slice(cut + 1) + char
      } else {
        lines.push(line)
        line = char
      }
    } else {
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

/* ---------- 动画 ---------- */

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const easeOut = (value) => 1 - Math.pow(1 - clamp01(value), 3)
/** 从 start 开始、用 dur 秒浮现：返回 0..1 */
const fade = (t, start, dur = 0.36) => easeOut((t - start) / dur)

const rgb = (hex) => hex
const INK = '#f3f4f7'
const INK_SOFT = '#c3c7d1'
const INK_FAINT = '#7d838f'
const BRAND = '#6f8bff'
const CARD = '#171a20'
const LINE = '#2b303a'

/* ---------- 帧内的公共零件 ---------- */

function background() {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#15181f"/>
      <stop offset="1" stop-color="#0b0c10"/>
    </linearGradient>
    <linearGradient id="captionFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`
}

function progressBar(globalT, totalT, localT) {
  const ratio = clamp01(globalT / totalT)
  const glint = clamp01(localT / 0.5)
  return `
  <rect x="0" y="0" width="${W}" height="3" fill="#ffffff" opacity="0.06"/>
  <rect x="0" y="0" width="${(W * ratio).toFixed(1)}" height="3" fill="${BRAND}" opacity="${(0.55 + 0.35 * glint).toFixed(3)}"/>`
}

function footer(t, stepText) {
  return `
  <text x="${W - 64}" y="${H - 18}" text-anchor="end" font-family="Microsoft YaHei, Segoe UI"
        font-size="13" fill="${INK_FAINT}" opacity="0.75">${esc(stepText)}</text>
  <text x="64" y="${H - 18}" font-family="Segoe UI, Microsoft YaHei" font-size="13"
        fill="${INK_FAINT}" opacity="0.75">dsh-etude · 卡片工厂</text>`
}

function caption(text, localT) {
  const size = 23
  const maxWidth = W - 128 - 18
  const lines = wrap(text, maxWidth, size).slice(0, 3)
  const x = 64
  const baseY = H - 64 - (lines.length - 1) * 30
  const appear = fade(localT, 0.05, 0.3)
  const body = lines
    .map(
      (line, index) =>
        `<text x="${x + 18}" y="${(baseY + index * 30).toFixed(1)}" font-family="Microsoft YaHei, Segoe UI"
               font-size="${size}" fill="${INK_SOFT}">${esc(line)}</text>`,
    )
    .join('\n')

  return `
  <g opacity="${appear.toFixed(3)}" transform="translate(0 ${(6 * (1 - appear)).toFixed(2)})">
    <rect x="0" y="${H - 176}" width="${W}" height="176" fill="url(#captionFade)"/>
    <rect x="${x}" y="${(baseY - 22).toFixed(1)}" width="3"
          height="${(lines.length * 30 + 4).toFixed(0)}" rx="1.5" fill="${BRAND}" opacity="0.9"/>
    ${body}
  </g>`
}

function heading(title, localT) {
  const appear = fade(localT, 0, 0.32)
  const size = 38
  const lines = wrap(title, W - 128, size).slice(0, 2)
  const body = lines
    .map(
      (line, index) =>
        `<text x="64" y="${(132 + index * 46).toFixed(1)}" font-family="Microsoft YaHei, Segoe UI"
               font-weight="600" font-size="${size}" fill="${INK}">${esc(line)}</text>`,
    )
    .join('\n')
  return `<g opacity="${appear.toFixed(3)}" transform="translate(0 ${(10 * (1 - appear)).toFixed(2)})">${body}</g>`
}

/* ---------- 各种场景 ---------- */

function titleScene(scene, localT) {
  const k = fade(localT, 0.15, 0.4)
  const t1 = fade(localT, 0.35, 0.45)
  const t2 = fade(localT, 0.6, 0.5)
  const pills = (scene.pills ?? []).map((pill, index) => {
    const appear = fade(localT, 0.95 + index * 0.14, 0.36)
    const width = textWidth(pill, 16) + 38
    const x = 64 + index * 0
    return { pill, appear, width, x }
  })
  // 三颗标签横排：先算总宽再居中
  const totalWidth = pills.reduce((sum, one) => sum + one.width + 12, -12)
  let cursor = (W - totalWidth) / 2
  const pillSvg = pills
    .map((one) => {
      const x = cursor
      cursor += one.width + 12
      return `<g opacity="${one.appear.toFixed(3)}">
        <rect x="${x.toFixed(1)}" y="474" width="${one.width.toFixed(1)}" height="38" rx="19"
              fill="#ffffff" fill-opacity="0.04" stroke="${LINE}"/>
        <text x="${(x + one.width / 2).toFixed(1)}" y="499" text-anchor="middle"
              font-family="Microsoft YaHei, Segoe UI" font-size="16" fill="${INK_SOFT}">${esc(one.pill)}</text>
      </g>`
    })
    .join('\n')

  return `
  <g opacity="${k.toFixed(3)}">
    <text x="${W / 2}" y="212" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI"
          font-size="17" letter-spacing="2" fill="${BRAND}">${esc(scene.kicker ?? '')}</text>
  </g>
  <g opacity="${t1.toFixed(3)}" transform="translate(0 ${(14 * (1 - t1)).toFixed(2)})">
    <text x="${W / 2}" y="330" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI"
          font-weight="700" font-size="82" fill="${INK}">${esc(scene.title)}</text>
  </g>
  <g opacity="${t2.toFixed(3)}" transform="translate(0 ${(10 * (1 - t2)).toFixed(2)})">
    <text x="${W / 2}" y="404" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI"
          font-size="24" fill="${INK_SOFT}">${esc(scene.subtitle ?? '')}</text>
  </g>
  ${pillSvg}`
}

function bulletsScene(scene, localT) {
  const size = 25
  const maxWidth = W - 128 - 40
  const bulletList = scene.bullets ?? []
  // 先在 170..530 这条带子里把块居中 —— 三条要点堆在顶上、下面一大片空，看着像没做完
  const blockH = bulletList.reduce((sum, bullet) => sum + wrap(bullet, maxWidth, size).length * 38 + 20, 0)
  let y = 170 + Math.max(0, (360 - blockH) / 2)
  const body = bulletList
    .map((bullet, index) => {
      const appear = fade(localT, 0.18 + index * 0.16, 0.34)
      const lines = wrap(bullet, maxWidth, size)
      const startY = y
      y += lines.length * 38 + 20
      const textSvg = lines
        .map(
          (line, spot) =>
            `<text x="104" y="${(startY + spot * 38).toFixed(1)}" font-family="Microsoft YaHei, Segoe UI"
                   font-size="${size}" fill="${INK_SOFT}">${esc(line)}</text>`,
        )
        .join('\n')
      return `<g opacity="${appear.toFixed(3)}" transform="translate(${(10 * (1 - appear)).toFixed(2)} 0)">
        <circle cx="78" cy="${(startY - 9).toFixed(1)}" r="4.5" fill="${BRAND}" opacity="0.9"/>
        ${textSvg}
      </g>`
    })
    .join('\n')
  return heading(scene.title, localT) + body
}

function codeScene(scene, localT) {
  const size = 20
  const lines = scene.lines ?? []
  const padX = 26
  const lineH = 30
  const boxTop = 200
  const boxH = Math.min(lines.length * lineH + 52, H - 200 - 190)
  const appear = fade(localT, 0.12, 0.36)
  const body = lines
    .map((line, index) => {
      const at = fade(localT, 0.24 + index * 0.09, 0.3)
      const color = line.trim().startsWith('#') ? '#7f8794' : '#dfe3ea'
      // xml:space="preserve" 不是可选的：默认会把行首空格吃掉，代码缩进就全没了
      return `<text x="${64 + padX}" y="${boxTop + 38 + index * lineH}" xml:space="preserve"
                    font-family="Consolas, Courier New, monospace"
                    font-size="${size}" fill="${color}" opacity="${at.toFixed(3)}">${esc(line)}</text>`
    })
    .join('\n')

  return `
  ${heading(scene.title, localT)}
  <g opacity="${appear.toFixed(3)}">
    <rect x="64" y="${boxTop}" width="${W - 128}" height="${boxH}" rx="14"
          fill="${CARD}" stroke="${LINE}"/>
    ${body}
  </g>`
}

function treeScene(scene, localT) {
  const size = 19
  const lines = scene.lines ?? []
  const lineH = 34
  const boxTop = 196
  const boxH = lines.length * lineH + 56
  const appear = fade(localT, 0.12, 0.36)
  const body = lines
    .map((line, index) => {
      const at = fade(localT, 0.2 + index * 0.1, 0.3)
      const isHead = index === 0
      return `<text x="92" y="${boxTop + 42 + index * lineH}" xml:space="preserve"
                    font-family="Consolas, Courier New, monospace"
                    font-size="${isHead ? size + 2 : size}" fill="${isHead ? INK : INK_SOFT}"
                    opacity="${at.toFixed(3)}">${esc(line)}</text>`
    })
    .join('\n')
  return `
  ${heading(scene.title, localT)}
  <g opacity="${appear.toFixed(3)}">
    <rect x="64" y="${boxTop}" width="${W - 128}" height="${boxH}" rx="14" fill="${CARD}" stroke="${LINE}"/>
    ${body}
  </g>`
}

function outroScene(scene, localT) {
  const t1 = fade(localT, 0.1, 0.4)
  const t2 = fade(localT, 0.45, 0.45)
  const pills = scene.pills ?? []
  let cursor = 64
  const pillSvg = pills
    .map((pill, index) => {
      const appear = fade(localT, 0.75 + index * 0.12, 0.34)
      const width = textWidth(pill, 16) + 36
      const x = cursor
      cursor += width + 10
      return `<g opacity="${appear.toFixed(3)}">
        <rect x="${x.toFixed(1)}" y="404" width="${width.toFixed(1)}" height="36" rx="18"
              fill="#ffffff" fill-opacity="0.04" stroke="${LINE}"/>
        <text x="${(x + width / 2).toFixed(1)}" y="428" text-anchor="middle"
              font-family="Microsoft YaHei, Segoe UI" font-size="15" fill="${INK_SOFT}">${esc(pill)}</text>
      </g>`
    })
    .join('\n')

  return `
  <g opacity="${t1.toFixed(3)}" transform="translate(0 ${(12 * (1 - t1)).toFixed(2)})">
    <text x="64" y="250" font-family="Microsoft YaHei, Segoe UI" font-weight="700"
          font-size="52" fill="${INK}">${esc(scene.title)}</text>
  </g>
  <g opacity="${t2.toFixed(3)}">
    <text x="64" y="330" font-family="Microsoft YaHei, Segoe UI" font-size="21"
          fill="${INK_SOFT}">${esc(scene.subtitle ?? '')}</text>
  </g>
  ${pillSvg}`
}

/* ---------- 截图卡 ---------- */

async function buildShotBase(scene, sharp) {
  const path = join(repo, 'docs', 'assets', scene.src)
  let pipeline = sharp(path)
  if (scene.crop) pipeline = pipeline.extract(scene.crop)
  const meta = await pipeline.metadata()

  const maxW = W - 144
  const maxH = 372
  // 不要把小图放大到整行宽 —— 524px 宽的裁片拉到 1136 会糊成一片。
  // 上限 1.5 倍，够填版面又不至于失真。
  let drawW = Math.min(maxW, Math.round(meta.width * 1.5))
  let drawH = Math.round((drawW * meta.height) / meta.width)
  if (drawH > maxH) {
    drawH = maxH
    drawW = Math.round((maxH * meta.width) / meta.height)
  }
  const buffer = await sharp(path)
    .extract(scene.crop ?? { left: 0, top: 0, width: meta.width, height: meta.height })
    .resize(drawW * 2, drawH * 2, { fit: 'fill', kernel: 'lanczos3' })
    .jpeg({ quality: 90 })
    .toBuffer()

  // 图和下面那行小字整体在 160..530 之间居中：短图（比如只有 58px 高的顶栏）
  // 顶在最上面会留一大片空，看着像排版出错。
  const noteSpace = scene.note ? 56 : 0
  const x = Math.round((W - drawW) / 2)
  const y = Math.round(160 + Math.max(0, (530 - 160 - drawH - noteSpace) / 2))
  const b64 = buffer.toString('base64')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${background()}
  <rect x="${x - 1}" y="${y - 1}" width="${drawW + 2}" height="${drawH + 2}" rx="13"
        fill="none" stroke="${LINE}"/>
  <clipPath id="shotClip"><rect x="${x}" y="${y}" width="${drawW}" height="${drawH}" rx="12"/></clipPath>
  <image x="${x}" y="${y}" width="${drawW}" height="${drawH}" preserveAspectRatio="none"
         clip-path="url(#shotClip)" href="data:image/jpeg;base64,${b64}"/>
  </svg>`

  const raw = await sharp(Buffer.from(svg)).ensureAlpha().toColourspace('srgb').raw().toBuffer()
  return { raw, box: { x, y, w: drawW, h: drawH } }
}

/* ---------- 组装 ---------- */

const ffmpegPath = resolveFfmpeg()
const sharp = await loadSharp()

const cacheDir = join(here, '.cache')
const audioCache = join(cacheDir, 'audio')
await mkdir(audioCache, { recursive: true })

const { synthesizeEdge } = await import(pathToFileURL(join(repo, 'lib', 'tts-edge.js')).href)

async function speechFile(text) {
  const key = createHash('sha256').update(`${VOICE}|${RATE}|${text}`).digest('hex').slice(0, 16)
  const file = join(audioCache, `${key}.mp3`)
  if (existsSync(file)) {
    const samples = await decodePcm(file)
    return { file, samples }
  }
  const bytes = await synthesizeEdge({ text, voice: VOICE, rate: RATE, volume: '+0%' })
  await writeFile(file, bytes)
  const samples = await decodePcm(file)
  return { file, samples }
}

/** 解成 24kHz 单声道 s16le，这样拼接是采样级精确的。 */
async function decodePcm(file) {
  const result = spawnSync(
    ffmpegPath,
    ['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 's16le', '-ar', '24000', '-ac', '1', '-'],
    { maxBuffer: 1 << 28 },
  )
  if (result.status !== 0) throw new Error(`解码失败：${file}\n${result.stderr}`)
  return result.stdout
}

console.log(`ffmpeg: ${ffmpegPath}`)
console.log(`合成 ${narration.length} 段旁白（有缓存的直接读）…`)

const timeline = []
let cursor = LEAD
for (let index = 0; index < narration.length; index++) {
  const segment = narration[index]
  const { samples, file } = await speechFile(segment.text)
  const seconds = samples.length / 2 / 24000
  timeline.push({
    index,
    scene: segment.scene,
    text: segment.text,
    file,
    seconds,
    start: cursor,
    duration: seconds + GAP,
  })
  cursor += seconds + GAP
  process.stdout.write(`\r  ${String(index + 1).padStart(2)}/${narration.length}  ${seconds.toFixed(2)}s  ${segment.scene.type.padEnd(7)}`)
}
console.log('')

if (arg('timeline')) {
  for (const one of timeline) {
    console.log(`${String(one.index + 1).padStart(2)}  ${one.start.toFixed(1).padStart(6)}s  +${one.seconds.toFixed(1)}s  ${one.scene.type.padEnd(7)} ${one.scene.title ?? one.scene.src ?? ''}`)
  }
  process.exit(0)
}

const totalT = cursor + TAIL
const totalFrames = Math.round(totalT * FPS)
console.log(`总时长 ${totalT.toFixed(1)}s / ${totalFrames} 帧 @ ${FPS}fps`)

/* 拼音频：一段一段接到一起，中间垫静音 */
const silence = (seconds) => Buffer.alloc(Math.round(seconds * 24000) * 2)
const chunks = [silence(LEAD)]
for (const segment of timeline) {
  chunks.push(await readFile(segment.file).then(() => decodePcm(segment.file)))
  chunks.push(silence(GAP + (TAIL * 0)))
}
chunks.push(silence(TAIL))
const pcm = Buffer.concat(chunks)
const wavHeader = Buffer.alloc(44)
wavHeader.write('RIFF', 0)
wavHeader.writeUInt32LE(36 + pcm.length, 4)
wavHeader.write('WAVE', 8)
wavHeader.write('fmt ', 12)
wavHeader.writeUInt32LE(16, 16)
wavHeader.writeUInt16LE(1, 20)
wavHeader.writeUInt16LE(1, 22)
wavHeader.writeUInt32LE(24000, 24)
wavHeader.writeUInt32LE(24000 * 2, 28)
wavHeader.writeUInt16LE(2, 32)
wavHeader.writeUInt16LE(16, 34)
wavHeader.write('data', 36)
wavHeader.writeUInt32LE(pcm.length, 40)
const wavPath = join(cacheDir, 'narration.wav')
await writeFile(wavPath, Buffer.concat([wavHeader, pcm]))
console.log(`旁白音轨 ${wavPath}（${(pcm.length / 2 / 24000).toFixed(2)}s）`)

/* 预渲染每个场景的底图（截图卡才有） */
const bases = new Map()
for (const segment of timeline) {
  if (segment.scene.type !== 'shot') continue
  const base = await buildShotBase(segment.scene, sharp)
  bases.set(segment.index, base)
  console.log(`  底图 #${segment.index + 1} ${segment.scene.src} → ${base.box.w}×${base.box.h}`)
}

/* 静帧模式：只导出几个时间点，用来检查排版（必须在底图渲染之后） */
const stillAt = arg('still')
if (stillAt) {
  const stillDir = join(here, '.preview')
  await mkdir(stillDir, { recursive: true })
  for (const stamp of stillAt.split(',').map(Number)) {
    const buffer = await frameAt(stamp)
    const name = join(stillDir, `t-${stamp.toFixed(1)}.png`)
    await sharp(buffer, { raw: { width: W, height: H, channels: 4 } }).png().toFile(name)
    console.log(`静帧 ${name}`)
  }
  process.exit(0)
}

function sceneSvg(segment, localT) {
  const scene = segment.scene
  const kind = scene.type
  let body = ''
  if (kind === 'title') body = titleScene(scene, localT)
  else if (kind === 'bullets') body = bulletsScene(scene, localT)
  else if (kind === 'code') body = codeScene(scene, localT)
  else if (kind === 'tree') body = treeScene(scene, localT)
  else if (kind === 'outro') body = outroScene(scene, localT)
  return `${body}
    ${caption(segment.text, localT)}
    ${footer(localT, `${String(segment.index + 1).padStart(2, '0')} / ${String(narration.length).padStart(2, '0')}`)}`
}

async function frameAt(globalT, forIndex = null) {
  const segment =
    forIndex != null
      ? timeline[forIndex]
      : timeline.find((one) => globalT >= one.start && globalT < one.start + one.duration) ??
        timeline[timeline.length - 1]
  const localT = Math.max(0, globalT - segment.start)
  const base = bases.get(segment.index)

  if (segment.scene.type === 'shot' && base) {
    const shotTitle = heading(segment.scene.title, localT)
    const noteY = base.box.y + base.box.h + 34
    const note = segment.scene.note
      ? `<text x="${base.box.x}" y="${noteY}" font-family="Microsoft YaHei, Segoe UI" font-size="16"
               fill="${INK_FAINT}" opacity="${fade(localT, 0.4, 0.4).toFixed(3)}">${esc(segment.scene.note)}</text>`
      : ''
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      ${shotTitle}
      ${note}
      ${caption(segment.text, localT)}
      ${footer(localT, `${String(segment.index + 1).padStart(2, '0')} / ${String(narration.length).padStart(2, '0')}`)}
      ${progressBar(globalT, totalT, localT)}
    </svg>`
    const out = await sharp(base.raw, { raw: { width: W, height: H, channels: 4 } })
      .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
      .raw()
      .toBuffer()
    return out
  }

  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    ${background()}
    ${sceneSvg(segment, localT)}
    ${progressBar(globalT, totalT, localT)}
  </svg>`
  return sharp(Buffer.from(full)).ensureAlpha().toColourspace('srgb').raw().toBuffer()
}

/* 编码 */
const outPath = resolve(repo, arg('out') ?? 'docs/video/dsh-etude-tutorial.mp4')
await mkdir(dirname(outPath), { recursive: true })

const ffmpeg = spawn(ffmpegPath, [
  '-hide_banner',
  '-loglevel', 'error',
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', `${W}x${H}`,
  '-r', String(FPS),
  '-i', '-',
  '-i', wavPath,
  '-c:v', 'libx264',
  '-preset', arg('preset') ?? 'medium',
  '-crf', arg('crf') ?? '21',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'high',
  '-movflags', '+faststart',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-shortest',
  outPath,
], { stdio: ['pipe', 'inherit', 'inherit'] })

const ffmpegDone = new Promise((resolveDone, rejectDone) => {
  ffmpeg.on('error', rejectDone)
  ffmpeg.on('close', (code) => (code === 0 ? resolveDone() : rejectDone(new Error(`ffmpeg 退出码 ${code}`))))
})

const startedAt = Date.now()
for (let frame = 0; frame < totalFrames; frame++) {
  const buffer = await frameAt(frame / FPS)
  if (buffer.length !== W * H * 4) throw new Error(`帧大小不对：${buffer.length}`)
  if (!ffmpeg.stdin.write(buffer)) await once(ffmpeg.stdin, 'drain')
  if (frame % 25 === 0) {
    const percent = ((frame / totalFrames) * 100).toFixed(0)
    const spent = (Date.now() - startedAt) / 1000
    process.stdout.write(`\r  编码 ${percent}%  ${frame}/${totalFrames}  ${spent.toFixed(0)}s`)
  }
}
ffmpeg.stdin.end()
await ffmpegDone
console.log('')

const info = await stat(outPath)
console.log(`出片 ${outPath}  ${(info.size / 1024 / 1024).toFixed(2)} MB  ${totalT.toFixed(1)}s`)
