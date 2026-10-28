import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { loadOptional } from './deps.js'
import { httpFetch } from './net.js'
import { mediaDir } from './paths.js'
import { sha256Hex, shortDigest } from './sha.js'
import { FactoryError, compareKey, normalizeSpace, truncate } from './util.js'

/**
 * 配图。
 *
 * 这一块是本插件存在的理由，所以它比 Etude 那版多做了三件事：
 *
 * 1. **一次给一批。** Etude 每次只取一张、直接写库，用户连「换一张」的余地都没有。
 *    这里每次都下 6–9 张、都做预检、都留着字节，让九宫格能立刻显示。
 * 2. **预检要挡住假照片。** 纯色块、渐变、太小、太大、扩展名骗人的 HTML，
 *    一律在候选阶段就标成「不行」，并且写清原因。挡不住的（比如文字很多的图）
 *    只降权，不假装能挡住。
 * 3. **合规信息一起存。** license / author / credit_url 三个字段少一个就不算数。
 *    这不是可选装饰：把一张 CC-BY 的图拷进卡片包却不写出处，是在侵权。
 */

const USER_AGENT = 'dsh-etude/0.1 (+https://github.com/whyao56/dsh-etude)'
const MAX_BYTES = 4 * 1024 * 1024
const MIN_SHORT_EDGE = 640
const PREFERRED_ASPECT = [1.2, 2.0]

/** @returns {'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null} */
export function sniffImageMediaType(bytes) {
  if (!bytes || bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'
  return null
}

export function extensionFor(mediaType) {
  if (mediaType === 'image/jpeg') return 'jpg'
  if (mediaType === 'image/png') return 'png'
  if (mediaType === 'image/webp') return 'webp'
  if (mediaType === 'image/gif') return 'gif'
  return 'jpg'
}

/**
 * 只读文件头拿尺寸。不依赖 sharp —— 缺 sharp 时也要能挡住「短边只有 200」的图。
 *
 * @returns {{ width: number, height: number } | null}
 */
export function imageSize(bytes, mediaType = sniffImageMediaType(bytes)) {
  if (!bytes) return null
  try {
    if (mediaType === 'image/png') {
      return { width: readU32BE(bytes, 16), height: readU32BE(bytes, 20) }
    }
    if (mediaType === 'image/gif') {
      return { width: bytes[6] | (bytes[7] << 8), height: bytes[8] | (bytes[9] << 8) }
    }
    if (mediaType === 'image/webp') {
      const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15])
      if (chunk === 'VP8X') {
        return {
          width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
          height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
        }
      }
      if (chunk === 'VP8 ') {
        return {
          width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
          height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
        }
      }
      if (chunk === 'VP8L') {
        const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
        return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
      }
      return null
    }
    if (mediaType === 'image/jpeg') {
      let offset = 2
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset += 1
          continue
        }
        const marker = bytes[offset + 1]
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
          offset += 2
          continue
        }
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
        const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
        if (isSof) {
          return {
            height: (bytes[offset + 5] << 8) | bytes[offset + 6],
            width: (bytes[offset + 7] << 8) | bytes[offset + 8],
          }
        }
        offset += 2 + length
      }
    }
  } catch {
    return null
  }
  return null
}

function readU32BE(bytes, offset) {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]
}

let sharpModule

function loadSharp() {
  if (sharpModule !== undefined) return sharpModule
  const loaded = loadOptional('sharp')
  sharpModule = typeof loaded === 'function' ? loaded : null
  return sharpModule
}

/**
 * 像素级体检：这张图是不是「一坨颜色」。
 *
 * 三个指标各自负责一类假照片：
 * - `stdev` 小 → 纯色块。
 * - `secondDiff` 小 → 亮度是线性斜坡，也就是渐变（渐变的方差其实不小，
 *   光看方差挡不住，必须看二阶差分：线性函数的二阶差分等于零）。
 * - `uniqueRatio` 小 → 大色块构成的海报，颜色总数少得不像照片。
 *
 * 这是个粗糙的筛子，挡得住程序生成的占位图，挡不住「真照片但不可用」。
 * 后者归人，不归它。
 */
export async function analyzePixels(bytes) {
  const sharp = loadSharp()
  if (!sharp) return { available: false, flat: false, reason: 'no-sharp' }
  try {
    const { data, info } = await sharp(bytes)
      .resize(48, 48, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const channels = info.channels
    const pixels = 48 * 48
    const luminance = new Float32Array(pixels)
    const colors = new Set()

    for (let i = 0; i < pixels; i += 1) {
      const r = data[i * channels]
      const g = data[i * channels + 1]
      const b = data[i * channels + 2]
      luminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
      // 5 位量化：真照片有成千上万种颜色，纯色块只有个位数。
      colors.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3))
    }

    const mean = luminance.reduce((sum, value) => sum + value, 0) / pixels
    const variance = luminance.reduce((sum, value) => sum + (value - mean) ** 2, 0) / pixels
    const stdev = Math.sqrt(variance)

    let secondTotal = 0
    let secondCount = 0
    for (let y = 0; y < 48; y += 1) {
      for (let x = 1; x < 47; x += 1) {
        const index = y * 48 + x
        secondTotal += Math.abs(luminance[index + 1] - 2 * luminance[index] + luminance[index - 1])
        secondCount += 1
      }
    }
    const secondDiff = secondCount > 0 ? secondTotal / secondCount : 0
    const uniqueRatio = colors.size / pixels

    let flat = false
    let reason = ''
    if (stdev < 6) {
      flat = true
      reason = `几乎是一个颜色（亮度标准差 ${stdev.toFixed(1)}）`
    } else if (secondDiff < 1.1) {
      flat = true
      reason = `像渐变或者被抹平了（二阶差分 ${secondDiff.toFixed(2)}）`
    } else if (uniqueRatio < 0.02) {
      flat = true
      reason = `颜色种类太少（${colors.size} 种 / ${pixels} 像素）`
    }

    return {
      available: true,
      flat,
      reason,
      stdev: round2(stdev),
      secondDiff: round2(secondDiff),
      uniqueRatio: round4(uniqueRatio),
      uniqueColors: colors.size,
    }
  } catch (error) {
    return { available: false, flat: false, reason: `sharp 解析失败：${error.message}` }
  }
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function round4(value) {
  return Math.round(value * 10000) / 10000
}

/**
 * 一张图能不能进候选池。返回 `ok: false` 时 `problems` 里有拒绝原因。
 *
 * @param {Buffer} bytes
 * @param {object} [options]
 * @param {boolean} [options.checkPixels] 是否做像素体检（默认做）
 */
export async function precheckImage(bytes, { checkPixels = true } = {}) {
  const problems = []
  const mediaType = sniffImageMediaType(bytes)
  if (!mediaType) {
    return {
      ok: false,
      mediaType: null,
      problems: [{ code: 'not-image', message: '这不是图片文件（文件头对不上）。' }],
    }
  }

  const size = imageSize(bytes, mediaType)
  if (!size || !(size.width > 0) || !(size.height > 0)) {
    problems.push({ code: 'no-size', message: '读不出宽高。' })
  } else {
    const shortEdge = Math.min(size.width, size.height)
    if (shortEdge < MIN_SHORT_EDGE) {
      problems.push({
        code: 'too-small',
        message: `短边只有 ${shortEdge} 像素（要至少 ${MIN_SHORT_EDGE}）。`,
      })
    }
    const aspect = Math.max(size.width, size.height) / Math.min(size.width, size.height)
    if (aspect > 2.6) {
      problems.push({ code: 'aspect', message: `长宽比 ${aspect.toFixed(2)}，太扁了。` })
    }
  }

  if (bytes.length > MAX_BYTES) {
    problems.push({
      code: 'too-big',
      message: `文件 ${(bytes.length / 1024 / 1024).toFixed(1)} MB，超过 4 MB 上限。`,
    })
  }

  const pixels = checkPixels ? await analyzePixels(bytes) : { available: false, flat: false }
  if (pixels.available && pixels.flat) {
    problems.push({ code: 'flat', message: pixels.reason || '不像真照片。' })
  }

  const aspect =
    size && size.width > 0 && size.height > 0
      ? Math.max(size.width, size.height) / Math.min(size.width, size.height)
      : 0

  return {
    ok: problems.length === 0,
    mediaType,
    width: size?.width ?? 0,
    height: size?.height ?? 0,
    bytes: bytes.length,
    aspect: round2(aspect),
    preferredAspect: aspect >= PREFERRED_ASPECT[0] && aspect <= PREFERRED_ASPECT[1],
    pixels,
    problems,
  }
}

/**
 * 检索候选。返回的只是「元数据」，字节还没下。
 *
 * 每个 query 都问两个库：Commons（快、量大、很多题材只有它有）和
 * Openverse（元数据规整、授权字段全）。两个库的返回形状完全不同，所以这里
 * 统一成同一个 `candidate` 形状，后面的代码不用关心来源。
 *
 * 一个库挂了绝不能拖垮整批 —— 实测 Openverse 会连着几十秒不回话最后 504，
 * 所以它带 8 秒超时；连续失败三次就在本次会话里先把它关掉，别每次都白等。
 */
const sourceHealth = new Map()

/**
 * 检索结果的小缓存。
 *
 * 一个包里八条例句的场景不同，但模型给的 `image_query` 常常高度重复，
 * 于是八个 query 有一半是同一个字符串。每个都去问一次图库既慢又不礼貌，
 * 而且实测第二条之后每次多花十几秒。缓存两分钟，够一整包用。
 */
const searchCache = new Map()
const SEARCH_CACHE_TTL_MS = 120000

export async function searchCandidates({ queries, perQuery = 8, signal }) {
  const list = []
  const seen = new Set()

  for (const query of queries) {
    const text = normalizeSpace(query)
    if (!text) continue
    const cacheKey = `${perQuery}|${text}`
    const cached = searchCache.get(cacheKey)
    let gathered
    if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) {
      gathered = cached.items
    } else {
      const settled = await Promise.allSettled([
        searchCommons(text, perQuery, signal),
        openverseEnabled() ? searchOpenverse(text, perQuery, signal) : Promise.resolve([]),
      ])
      gathered = []
      for (const outcome of settled) {
        if (outcome.status !== 'fulfilled') continue
        gathered.push(...outcome.value)
      }
      searchCache.set(cacheKey, { at: Date.now(), items: gathered })
    }

    for (const candidate of gathered) {
      const key = candidate.creditUrl || candidate.url
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push(candidate)
    }
  }
  return list
}

/** 某个图库最近是不是老出错。连错三次就歇到进程重启。 */
function noteSourceFailure(source) {
  const next = (sourceHealth.get(source) ?? 0) + 1
  sourceHealth.set(source, next)
  return next
}

function noteSourceSuccess(source) {
  sourceHealth.set(source, 0)
}

function openverseEnabled() {
  return (sourceHealth.get('openverse') ?? 0) < 3
}

/** 自检/界面可以看：哪个库现在被临时关掉了。 */
export function sourceStatus() {
  return {
    openverse: { enabled: openverseEnabled(), failures: sourceHealth.get('openverse') ?? 0 },
    commons: { enabled: true, failures: sourceHealth.get('commons') ?? 0 },
  }
}

/**
 * 给一次请求套上超时，但保留外部的取消。
 * `AbortSignal.any` 要 Node 20+，这个运行时是 24，可以用。
 */
function withTimeout(signal, ms) {
  const timer = AbortSignal.timeout(ms)
  return signal ? AbortSignal.any([signal, timer]) : timer
}

const OPENVERSE_TIMEOUT_MS = 8000
const COMMONS_TIMEOUT_MS = 15000

async function searchOpenverse(query, perQuery, signal) {
  // 注意：别加 `license_type`。实测带这个参数时 Openverse 会 504（服务端超时），
  // 不带就 200。许可信息在结果里本来就有，客户端自己筛就行。
  const params = new URLSearchParams({
    q: query,
    page_size: String(Math.min(20, perQuery)),
    mature: 'false',
  })
  try {
    const response = await httpFetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: withTimeout(signal, OPENVERSE_TIMEOUT_MS),
      maxBytes: 4 * 1024 * 1024,
    })
    if (!response.ok) throw new Error(`Openverse HTTP ${response.status}`)
    const body = await response.json()
    const results = Array.isArray(body?.results) ? body.results : []
    noteSourceSuccess('openverse')
    return results
      .map((item) => ({
        id: `openverse:${item.id}`,
        source: 'openverse',
        query,
        url: String(item.url ?? ''),
        thumbUrl: String(item.thumbnail ?? item.url ?? ''),
        width: Number(item.width ?? 0) || 0,
        height: Number(item.height ?? 0) || 0,
        license: normalizeSpace(`${item.license ?? ''} ${item.license_version ?? ''}`).toUpperCase() || 'UNKNOWN',
        licenseUrl: String(item.license_url ?? ''),
        author: truncate(normalizeSpace(item.creator ?? ''), 120) || '未知作者',
        creditUrl: String(item.foreign_landing_url ?? ''),
        title: truncate(normalizeSpace(item.title ?? ''), 120),
      }))
      .filter((item) => item.url)
  } catch (error) {
    if (signal?.aborted) throw error
    const failures = noteSourceFailure('openverse')
    throw new Error(`Openverse ${failures >= 3 ? '连着出错，本次先不用它了' : '出错了'}：${error.message}`)
  }
}

async function searchCommons(query, perQuery, signal) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(20, perQuery)),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1400',
  })
  const response = await httpFetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: withTimeout(signal, COMMONS_TIMEOUT_MS),
    maxBytes: 8 * 1024 * 1024,
  })
  if (!response.ok) {
    noteSourceFailure('commons')
    throw new Error(`Commons HTTP ${response.status}`)
  }
  const body = await response.json()
  if (body?.error?.code === 'cirrussearch-too-busy-error') {
    // 搜索后端忙是真的会发生，别把它当成「搜不到」——报出来，让上游重试。
    noteSourceFailure('commons')
    throw new Error('Commons 搜索后端太忙，稍后再试。')
  }
  noteSourceSuccess('commons')
  const pages = Array.isArray(body?.query?.pages) ? body.query.pages : []
  return pages
    .map((page) => {
      const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null
      if (!info) return null
      const meta = info.extmetadata ?? {}
      const strip = (value) => truncate(normalizeSpace(String(value ?? '').replace(/<[^>]*>/g, '')), 160)
      return {
        id: `commons:${page.pageid}`,
        source: 'commons',
        query,
        url: String(info.url || info.thumburl || ''),
        thumbUrl: String(info.thumburl || info.url || ''),
        width: Number(info.thumbwidth ?? info.width ?? 0) || 0,
        height: Number(info.thumbheight ?? info.height ?? 0) || 0,
        license: strip(meta.LicenseShortName?.value) || 'UNKNOWN',
        licenseUrl: strip(meta.LicenseUrl?.value),
        author: strip(meta.Artist?.value) || '未知作者',
        creditUrl: String(info.descriptionurl || ''),
        title: truncate(normalizeSpace(page.title ?? ''), 120),
      }
    })
    .filter(Boolean)
    .filter((item) => item.url)
}

/**
 * 下载一张候选图。
 *
 * 上限卡在 4MB：图库经常给出 20MB 的原图，那种图就算能用，进卡片包也太重。
 * 下载失败不抛异常，返回 `{ ok: false, reason }`，因为「六张里坏一张」是常态，
 * 不该让整批候选一起失败。
 */
export async function downloadImage(url, { signal, maxBytes = MAX_BYTES, timeoutMs = 30000 } = {}) {
  if (!url) return { ok: false, reason: '没有下载地址' }
  // 单个文件也必须有超时：图库偶尔会挂一个连接不给数据，
  // 没有超时的话整批候选就停在那儿了（用户看到的是「一直转圈」）。
  const timer = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timer]) : timer
  try {
    const response = await httpFetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
      signal: combined,
      maxBytes: maxBytes + 1024,
    })
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` }

    const declared = Number(response.headers.get('content-length') ?? 0)
    if (declared > maxBytes) return { ok: false, reason: `声明大小 ${(declared / 1024 / 1024).toFixed(1)} MB，太大` }

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0) return { ok: false, reason: '空响应' }
    if (bytes.length > maxBytes) return { ok: false, reason: `实际 ${(bytes.length / 1024 / 1024).toFixed(1)} MB，太大` }
    if (!sniffImageMediaType(bytes)) return { ok: false, reason: '不是图片（可能是 HTML 错误页）' }
    return { ok: true, bytes }
  } catch (error) {
    if (signal?.aborted) throw new FactoryError('下载已取消。', 'aborted')
    const reason = error?.name === 'TimeoutError' ? `超过 ${Math.round(timeoutMs / 1000)} 秒没下完` : `下载失败：${error.message}`
    return { ok: false, reason }
  }
}

/** 候选字节落一份到暂存区，九宫格直接读它。 */
export async function stageCandidateBytes({ root, name, bytes }) {
  const dir = join(root, 'factory', 'candidates')
  await mkdir(dir, { recursive: true })
  const path = join(dir, name)
  await writeFile(path, bytes)
  return path
}

export async function readStagedBytes({ root, name }) {
  const path = join(root, 'factory', 'candidates', name)
  try {
    return await readFile(path)
  } catch (error) {
    throw new FactoryError(`候选图暂存没了（${name}）：${error.message}`, 'candidate-missing')
  }
}

export async function dropStaged({ root, names }) {
  for (const name of names) {
    try {
      await unlink(join(root, 'factory', 'candidates', name))
    } catch {
      // 已经不在了，正好。
    }
  }
}

/**
 * 把选定的字节存进素材库，文件名 = `<source>-<sha256 前 20 位>.<ext>`。
 *
 * 名字只由字节内容与来源决定，所以：
 * - 同一张图被两个包用到，磁盘上只存一份；
 * - 谁拿起包都能靠名字里的哈希对账（清单里也存了完整 sha256）；
 * - `source` 只留小写字母，避免大小写/空格/中文在跨文件系统时出岔子。
 */
export async function saveImageFile({ root, source, bytes, mediaType }) {
  const clean = String(source ?? 'upload').toLowerCase().replace(/[^a-z]/g, '') || 'upload'
  const media = mediaType ?? sniffImageMediaType(bytes)
  if (!media) throw new FactoryError('不是图片文件，存不了。', 'not-image')
  const ext = extensionFor(media)
  const digest = shortDigest(bytes)
  const file = `${clean}-${digest}.${ext}`
  const dir = mediaDir(root, 'images')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, file), bytes)
  return { file, sha256: sha256Hex(bytes), bytes: bytes.length, mediaType: media }
}

/**
 * 检索用的 2–3 个 query。
 *
 * 模型给的 `image_query` 是主句；剩下的是变体 —— 加上目标词、加上
 * 「日常生活」这类泛化词。三个 query 搜出来的东西差别很大，九宫格才有得挑；
 * 一个 query 出来的九张图基本是同一个场景的九个角度。
 */
export function buildQueries({ imageQuery, target, sentence }) {
  const base = normalizeSpace(imageQuery)
  const queries = []
  if (base) queries.push(base)

  /**
   * 第二个 query 要**更宽**，不能更窄。
   *
   * 一开始这里写的是 `${base} everyday`，结果搜出来一堆「日常」相关的杂物 ——
   * 图库不是语义检索，多一个抽象词只会把结果带偏。改成取前两个词，
   * 命中率立刻上来了。
   */
  const baseWords = base.split(/\s+/).filter(Boolean)
  if (baseWords.length > 2) queries.push(baseWords.slice(0, 2).join(' '))

  const targetText = normalizeSpace(target)
  const targetWords = compareKey(targetText)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3)
  if (targetWords.length > 0 && !compareKey(base).includes(targetWords[0])) {
    queries.push(targetWords.slice(0, 2).join(' '))
  }

  if (queries.length === 0) {
    const words = compareKey(sentence)
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 4)
    queries.push(words.slice(0, 2).join(' ') || compareKey(targetText) || 'everyday scene')
  }
  return [...new Set(queries)].slice(0, 3)
}
