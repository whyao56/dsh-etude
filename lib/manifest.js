/**
 * 卡片包清单（`manifest.json`）。
 *
 * 这个函数刻意是纯的：不碰文件、不读配置、不联网。给它一个工厂里的卡片包
 * 记录，还它一份清单。好处是 `tests/manifest.test.js` 能直接喂假数据，
 * 不用起服务、不用真的造一张图，就能钉住「没复核不许进包」这类规则。
 *
 * 两种形态混在一起容易搞错，这里固定下来：
 * - 工厂内部（`library.json`）用 camelCase，因为它只活在 JS 里。
 * - 清单用 snake_case，因为 Etude 是 Python，那边读的就是这个。
 */

export const FORMAT = 'etude-lesson'
export const FORMAT_VERSION = 2

/**
 * @param {any} pack 工厂里的卡片包记录
 * @param {object} [options]
 * @param {string} [options.version] 插件版本
 * @param {string} [options.runId]
 * @param {Date} [options.now]
 */
export function buildManifest(pack, { version = '0.1.0', runId = '', now = new Date() } = {}) {
  const examples = Array.isArray(pack.examples) ? pack.examples : []
  const audios = examples.map((one) => one.audio).filter(Boolean)
  const firstAudio = audios[0]

  const quality = summarizeQuality(examples)

  return {
    format: FORMAT,
    format_version: FORMAT_VERSION,
    generator: {
      kind: 'dsh-plugin',
      name: 'dsh-etude',
      version,
      model: String(pack.model ?? ''),
      prompt_version: String(pack.promptVersion ?? ''),
      run_id: runId || String(pack.id ?? ''),
    },
    created_at: (now instanceof Date ? now : new Date()).toISOString(),
    lesson: {
      target: String(pack.target ?? ''),
      kind: normalizeKind(pack.kind),
      language: String(pack.language ?? 'en'),
      gloss: String(pack.gloss ?? ''),
      ipa: String(pack.ipa ?? ''),
      note: String(pack.note ?? ''),
      voice: {
        engine: String(firstAudio?.engine ?? pack.voice?.engine ?? ''),
        voice: String(firstAudio?.voice ?? pack.voice?.voice ?? ''),
        rate: String(pack.voice?.rate ?? '+10%'),
        volume: String(pack.voice?.volume ?? '+10%'),
      },
    },
    examples: examples.map((example, index) => ({
      ord: index + 1,
      sentence: String(example.sentence ?? ''),
      scene_en: String(example.sceneEn ?? ''),
      scene_zh: String(example.sceneZh ?? ''),
      zh_variants: Array.isArray(example.zhVariants) ? example.zhVariants.slice(0, 4) : [],
      register: String(example.register ?? ''),
      voice_hint: String(example.voiceHint ?? ''),
      image_query: String(example.imageQuery ?? ''),
      media: {
        image: example.image ? mediaImage(example.image) : null,
        audio: example.audio ? mediaAudio(example.audio) : null,
      },
      review: {
        image: example.imageReview
          ? {
              by: String(example.imageReview.by ?? ''),
              at: String(example.imageReview.at ?? ''),
              candidates: Number(example.imageReview.candidates ?? 0),
              picked: String(example.imageReview.picked ?? ''),
            }
          : null,
        audio: example.audioReview
          ? {
              by: String(example.audioReview.by ?? ''),
              at: String(example.audioReview.at ?? ''),
              listened: Boolean(example.audioReview.listened),
            }
          : null,
      },
    })),
    swaps: Array.isArray(pack.swaps)
      ? pack.swaps.map((swap) => ({
          role: String(swap.role ?? ''),
          original: String(swap.original ?? ''),
          candidates: Array.isArray(swap.candidates) ? swap.candidates.slice(0, 6) : [],
          samples: Array.isArray(swap.samples) ? swap.samples.slice(0, 4) : [],
        }))
      : [],
    quality,
  }
}

function mediaImage(image) {
  return {
    file: `images/${image.file}`,
    sha256: String(image.sha256 ?? ''),
    bytes: Number(image.bytes ?? 0),
    width: Number(image.width ?? 0),
    height: Number(image.height ?? 0),
    source: String(image.source ?? ''),
    query: String(image.query ?? ''),
    license: String(image.license ?? ''),
    author: String(image.author ?? ''),
    credit_url: String(image.creditUrl ?? ''),
  }
}

function mediaAudio(audio) {
  return {
    file: `audio/${audio.file}`,
    sha256: String(audio.sha256 ?? ''),
    bytes: Number(audio.bytes ?? 0),
    seconds: Number(audio.seconds ?? 0),
    engine: String(audio.engine ?? ''),
    voice: String(audio.voice ?? ''),
  }
}

function summarizeQuality(examples) {
  const images = examples.map((one) => one.image).filter(Boolean)
  const audios = examples.map((one) => one.audio).filter(Boolean)
  const shortEdges = images.map((image) => Math.min(Number(image.width ?? 0), Number(image.height ?? 0)))
  const anyFlat = images.filter((image) => image.flat === true)
  const analyzed = images.filter((image) => image.flat === true || image.flat === false)

  return {
    examples: examples.length,
    images: images.length,
    audios: audios.length,
    min_image_short_edge: shortEdges.length > 0 ? Math.min(...shortEdges) : 0,
    flat_images: anyFlat.length,
    // 这一项没做。留 null 而不是 0 —— 写 0 等于声称「查过了，一张都没有」。
    text_in_images: null,
    pixel_analysis: analyzed.length === images.length && images.length > 0 ? 'sharp' : 'none',
    reviewed_images: examples.filter((one) => one.imageReview?.by).length,
    reviewed_audios: examples.filter((one) => one.audioReview?.listened).length,
  }
}

function normalizeKind(kind) {
  const text = String(kind ?? '').trim()
  return ['word', 'phrase', 'sentence'].includes(text) ? text : 'word'
}
