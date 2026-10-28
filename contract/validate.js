/**
 * 卡片包 v2 校验器。
 *
 * 校验器为什么要独立于「打包」：打包那个函数只负责把内存里的记录写成 JSON，
 * 它天然乐观。真正的门槛是这里 —— 它只看包本身，不看工厂内部状态，
 * 于是同一份代码能用在三个地方：
 *   1. 打包后立刻跑，不过关就不许交付；
 *   2. 界面上点「校验」，把哪里不行原样告诉用户；
 *   3. 测试里造一个坏包，证明它真的会拒收。
 *
 * 文件读取是注入的（`loadFile`），所以这套规则在浏览器里、在没有 fs 的环境里
 * 也能跑，而不用为了一点校验去起服务。
 */
import { createHash } from 'node:crypto'

export const FORMAT = 'card-pack'
export const FORMAT_VERSION = 2
/**
 * 老包兼容：最早的 v2 契约把 `format` 写成 `etude-lesson`。那时这个插件只是
 * 另一个训练器的素材工厂。现在插件自己就是全套，值改成 `card-pack`；
 * 读的时候旧值还认，这样别人手里的旧包不会一夜之间变成「不合法」。
 */
export const LEGACY_FORMATS = ['etude-lesson']
export const MAX_EXAMPLES = 40
export const MAX_SCENE_CHARS = 600
export const MAX_ZH_VARIANTS = 4
export const MIN_IMAGE_SHORT_EDGE = 640
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const SUPPORTED_LANGUAGES = ['en']

/**
 * @param {any} manifest
 * @param {object} [options]
 * @param {(relativePath: string) => Promise<Buffer | Uint8Array | null>} [options.loadFile]
 *   相对包根目录取文件字节。不传就跳过所有「文件是否存在/哈希是否一致」的检查 ——
 *   那种模式下这个函数只验结构，`mode` 会标成 `structure-only`。
 * @returns {Promise<{ ok: boolean, mode: string, errors: string[], warnings: string[] }>}
 */
export async function validateManifest(manifest, { loadFile } = {}) {
  const errors = []
  const warnings = []
  const mode = typeof loadFile === 'function' ? 'full' : 'structure-only'

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, mode, errors: ['清单不是一个 JSON 对象。'], warnings }
  }

  if (manifest.format !== FORMAT && !LEGACY_FORMATS.includes(manifest.format)) {
    errors.push(`format 必须是 "${FORMAT}"，现在是 ${JSON.stringify(manifest.format)}。`)
  } else if (manifest.format !== FORMAT) {
    warnings.push(`format 是旧值 ${JSON.stringify(manifest.format)}，还认，但新出的包应该写 "${FORMAT}"。`)
  }
  if (manifest.format_version !== FORMAT_VERSION) {
    errors.push(`format_version 必须是 ${FORMAT_VERSION}，现在是 ${JSON.stringify(manifest.format_version)}。`)
  }
  if (typeof manifest.created_at !== 'string' || !manifest.created_at) {
    errors.push('缺 created_at。')
  }

  const generator = manifest.generator
  if (!generator || typeof generator !== 'object') {
    errors.push('缺 generator。')
  } else {
    if (generator.kind !== 'dsh-plugin') errors.push('generator.kind 必须是 "dsh-plugin"。')
    if (!generator.name) errors.push('generator.name 空着。')
    if (!generator.version) errors.push('generator.version 空着。')
    if (!generator.prompt_version) warnings.push('generator.prompt_version 空着，以后没法追溯是哪版提示词造的。')
  }

  const lesson = manifest.lesson
  if (!lesson || typeof lesson !== 'object') {
    errors.push('缺 lesson。')
  } else {
    const target = typeof lesson.target === 'string' ? lesson.target.trim() : ''
    if (!target) errors.push('lesson.target 空着 —— 这个包没有目标。')
    if (!SUPPORTED_LANGUAGES.includes(lesson.language)) {
      errors.push(`语言 ${JSON.stringify(lesson.language)} 现在还不能生成（只支持 ${SUPPORTED_LANGUAGES.join('/')}）。`)
    }
    if (!['word', 'phrase', 'sentence'].includes(lesson.kind)) {
      errors.push(`lesson.kind 必须是 word/phrase/sentence，现在是 ${JSON.stringify(lesson.kind)}。`)
    }
    const voice = lesson.voice
    if (!voice || typeof voice !== 'object') {
      errors.push('缺 lesson.voice —— 不知道这些语音是谁念的。')
    } else {
      if (!voice.engine) errors.push('lesson.voice.engine 空着。')
      if (!voice.voice) errors.push('lesson.voice.voice 空着。')
    }
  }

  const examples = Array.isArray(manifest.examples) ? manifest.examples : []
  if (examples.length === 0) errors.push('一条例句都没有。')
  if (examples.length > MAX_EXAMPLES) errors.push(`例句 ${examples.length} 条，超过上限 ${MAX_EXAMPLES}。`)

  const seenSentences = new Map()
  const seenMedia = new Map()

  for (let index = 0; index < examples.length; index += 1) {
    const example = examples[index]
    const at = `第 ${index + 1} 条`
    if (!example || typeof example !== 'object') {
      errors.push(`${at}不是一个对象。`)
      continue
    }

    const sentence = typeof example.sentence === 'string' ? example.sentence.trim() : ''
    if (!sentence) errors.push(`${at}没有句子。`)
    else {
      const key = sentence.toLowerCase()
      if (seenSentences.has(key)) errors.push(`${at}的句子和第 ${seenSentences.get(key)} 条重复了。`)
      else seenSentences.set(key, index + 1)
      if (sentence.length > 400) errors.push(`${at}的句子超过 400 字，这种长度多半是模型把解释塞进来了。`)
    }

    const sceneEn = String(example.scene_en ?? '')
    const sceneZh = String(example.scene_zh ?? '')
    if (!sceneEn.trim()) errors.push(`${at}缺 scene_en —— 卡片正面就没提示了。`)
    if (!sceneZh.trim()) errors.push(`${at}缺 scene_zh。`)
    if (sceneEn.length > MAX_SCENE_CHARS) errors.push(`${at}的 scene_en 超过 ${MAX_SCENE_CHARS} 字。`)
    if (sceneZh.length > MAX_SCENE_CHARS) errors.push(`${at}的 scene_zh 超过 ${MAX_SCENE_CHARS} 字。`)

    const zhVariants = Array.isArray(example.zh_variants) ? example.zh_variants : []
    if (zhVariants.length > MAX_ZH_VARIANTS) errors.push(`${at}的中文说法 ${zhVariants.length} 种，超过 ${MAX_ZH_VARIANTS}。`)
    if (zhVariants.length < 2) errors.push(`${at}的中文说法只有 ${zhVariants.length} 种，至少两种。`)

    if (!example.review || typeof example.review !== 'object') {
      errors.push(`${at}没有复核记录 —— 没点过头的图、没听过的语音不算成品。`)
    } else {
      const imageReview = example.review.image
      if (!imageReview || !String(imageReview.by ?? '').trim()) {
        errors.push(`${at}的配图没有复核人 —— 图必须有人点过头。`)
      }
      const audioReview = example.review.audio
      if (!audioReview || !String(audioReview.by ?? '').trim()) {
        errors.push(`${at}的语音没有复核人。`)
      } else if (audioReview.listened !== true) {
        errors.push(`${at}的语音标成「没试听过」—— 试听是硬要求。`)
      }
    }

    const media = example.media ?? {}
    await checkMediaFile({
      at,
      kind: '配图',
      media: media.image,
      loadFile,
      errors,
      warnings,
      extra: (entry) => {
        const width = Number(entry.width ?? 0)
        const height = Number(entry.height ?? 0)
        const shortEdge = Math.min(width, height)
        if (!(shortEdge >= MIN_IMAGE_SHORT_EDGE)) {
          errors.push(`${at}的配图短边只有 ${shortEdge} 像素（要至少 ${MIN_IMAGE_SHORT_EDGE}）。`)
        }
        if (Number(entry.bytes ?? 0) > MAX_IMAGE_BYTES) {
          errors.push(`${at}的配图 ${Number(entry.bytes) / 1024 / 1024} MB，超过 4 MB。`)
        }
        for (const field of ['source', 'query', 'license', 'author', 'credit_url']) {
          if (!String(entry[field] ?? '').trim()) {
            warnings.push(`${at}的配图缺 ${field} —— 授权信息不全，别对外发这个包。`)
          }
        }
      },
    })

    await checkMediaFile({
      at,
      kind: '语音',
      media: media.audio,
      loadFile,
      errors,
      warnings,
      extra: (entry) => {
        if (!(Number(entry.bytes ?? 0) > 0)) errors.push(`${at}的语音是 0 字节。`)
        if (!(Number(entry.seconds ?? 0) > 0)) errors.push(`${at}的语音读不出时长 —— 那种文件点了播放什么也不会发生。`)
      },
    })

    // 同一份字节只许落一份。两个例子共用一张图不是错，但清单上重复登记
    // 等于包里有冗余副本 —— 换个客户端就可能被当成两张不同的图存。
    for (const [kind, entry] of [
      ['配图', media.image],
      ['语音', media.audio],
    ]) {
      if (!entry || typeof entry !== 'object') continue
      const file = String(entry.file ?? '')
      if (!file) continue
      if (seenMedia.has(file)) {
        errors.push(`${at}的${kind}文件和${seenMedia.get(file)}重了（${file}）。`)
      } else {
        seenMedia.set(file, at)
      }
    }
  }

  return { ok: errors.length === 0, mode, errors, warnings }
}

async function checkMediaFile({ at, kind, media, loadFile, errors, warnings, extra }) {
  if (!media || typeof media !== 'object') {
    errors.push(`${at}没有${kind}。`)
    return
  }
  const file = String(media.file ?? '').trim()
  if (!file) {
    errors.push(`${at}的${kind}没写文件名。`)
    return
  }
  if (file.includes('..') || file.startsWith('/') || /^[a-z]:/i.test(file)) {
    errors.push(`${at}的${kind}路径 ${file} 越界了，必须是包内相对路径。`)
    return
  }
  const sha = String(media.sha256 ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    errors.push(`${at}的${kind} sha256 不是 64 位十六进制。`)
  }

  if (typeof extra === 'function') extra(media)

  if (typeof loadFile !== 'function') return
  let bytes
  try {
    bytes = await loadFile(file)
  } catch (error) {
    errors.push(`${at}的${kind}读不出来（${file}）：${error.message}`)
    return
  }
  if (!bytes || bytes.length === 0) {
    errors.push(`${at}的${kind}文件不存在或者是空的：${file}`)
    return
  }
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== sha) {
    errors.push(`${at}的${kind} sha256 对不上：清单写 ${sha.slice(0, 12)}…，文件是 ${actual.slice(0, 12)}…。`)
  }
  if (Number(media.bytes ?? 0) !== bytes.length) {
    warnings.push(`${at}的${kind}登记 ${media.bytes} 字节，文件实际 ${bytes.length} 字节。`)
  }
}
