/**
 * 给 pytest 用的探针：把「只有 JS 能做的判断」算出来，用 JSON 交给 Python。
 *
 * pytest 要能证明两件事真的成立：
 *   1. 纯色块 / 渐变的「假图」会被像素体检拒收；
 *   2. 没有复核记录的包会被契约校验拒收。
 * 第 2 条两边都能算，正好拿来对账（Python 与 JS 必须给出同一个判定）。
 * 第 1 条只在 JS 侧（sharp 在那边），所以这里把结论打出来。
 *
 * 用法：
 *   node tests/guard-probe.mjs precheck <kind>
 *     kind: pure-color | gradient | photo-like
 *   node tests/guard-probe.mjs validate <manifestPath> [--no-files]
 *   node tests/guard-probe.mjs platforms
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { precheckImage } from '../lib/images.js'
import { validateManifest } from '../contract/validate.js'

const here = dirname(fileURLToPath(import.meta.url))

function emit(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

async function makeSharpImage(kind) {
  const sharp = (await import('sharp')).default
  // 尺寸故意取合格值（短边 900、横构图），这样拒收的理由只可能是「图里没东西」，
  // 而不是顺带被尺寸挡掉 —— 测试要证明的就是那一件事。
  const width = 1280
  const height = 900

  if (kind === 'pure-color') {
    // 一张「看起来像图」的纯色块：尺寸合格、JPEG 合法，但里面什么也没有。
    // 这正是假模型爱生成、也是「一次成型直接入库」最爱漏掉的那类图。
    return sharp({
      create: { width, height, channels: 3, background: { r: 37, g: 63, b: 91 } },
    })
      .jpeg({ quality: 88 })
      .toBuffer()
  }

  if (kind === 'gradient') {
    // 线性渐变：方差可以很大（从亮到暗），但二阶差分极小 —— 只看方差会放它过去。
    const pixels = Buffer.alloc(width * height * 3)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (y * width + x) * 3
        const value = Math.round((x / (width - 1)) * 255)
        pixels[at] = value
        pixels[at + 1] = value
        pixels[at + 2] = value
      }
    }
    return sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg({ quality: 88 }).toBuffer()
  }

  if (kind === 'photo-like') {
    // 随机构图：多块不同颜色的矩形 + 噪声。它不美，但具备真图的统计特征
    // （局部有结构、颜色分布散），用来证明体检不是「一律拒收」。
    const tiles = [
      { r: 210, g: 180, b: 140 },
      { r: 40, g: 70, b: 110 },
      { r: 240, g: 240, b: 235 },
      { r: 90, g: 130, b: 90 },
      { r: 160, g: 60, b: 60 },
      { r: 25, g: 25, b: 30 },
    ]
    const pixels = Buffer.alloc(width * height * 3)
    let seed = 12345
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (y * width + x) * 3
        const tile = tiles[(Math.floor(y / 150) * 3 + Math.floor(x / 200)) % tiles.length]
        const grain = (next() - 0.5) * 46
        pixels[at] = Math.max(0, Math.min(255, Math.round(tile.r + grain)))
        pixels[at + 1] = Math.max(0, Math.min(255, Math.round(tile.g + grain)))
        pixels[at + 2] = Math.max(0, Math.min(255, Math.round(tile.b + grain)))
      }
    }
    return sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg({ quality: 88 }).toBuffer()
  }

  throw new Error(`不认识的图种类：${kind}`)
}

const [command, argument] = process.argv.slice(2)

try {
  if (command === 'precheck') {
    const bytes = await makeSharpImage(argument)
    const verdict = await precheckImage(bytes, { checkPixels: true })
    emit({
      ok: verdict.ok,
      bytes: bytes.length,
      width: verdict.width,
      height: verdict.height,
      pixels: verdict.pixels,
      problems: verdict.problems,
    })
    process.exit(0)
  }

  if (command === 'platforms') {
    const report = {}
    for (const name of ['sharp', 'ws', 'node:sqlite']) {
      try {
        await import(name)
        report[name] = true
      } catch {
        report[name] = false
      }
    }
    emit(report)
    process.exit(0)
  }

  if (command === 'validate') {
    const manifestPath = argument
    const structuralOnly = process.argv.includes('--no-files')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const packDir = dirname(manifestPath)
    const verdict = await validateManifest(
      manifest,
      structuralOnly
        ? {}
        : {
            loadFile: async (relative) => {
              try {
                return await readFile(join(packDir, relative))
              } catch {
                return null
              }
            },
          },
    )
    emit(verdict)
    process.exit(verdict.ok ? 0 : 1)
  }

  emit({ error: `不认识的命令：${command ?? '(空)'}` })
  process.exit(2)
} catch (error) {
  emit({ error: error.message, stack: error.stack })
  process.exit(3)
}
