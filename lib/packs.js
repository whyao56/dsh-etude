import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { validateManifest } from '../contract/validate.js'
import { classifyTarget } from './classify.js'
import { emptyMediaFields, generateExamples } from './examples.js'
import {
  buildQueries,
  downloadImage,
  dropStaged,
  precheckImage,
  readStagedBytes,
  saveImageFile,
  searchCandidates,
  stageCandidateBytes,
} from './images.js'
import { buildManifest } from './manifest.js'
import { mediaDir, packsDir, stagingDir } from './paths.js'
import { idempotencyKey } from './sha.js'
import { findPack, newId, packProgress, snapshot, update } from './store.js'
import { synthesizeForPack } from './tts.js'
import { BadRequest, FactoryError, clampInt, mapLimit, normalizeSpace, throwIfAborted } from './util.js'

export const LANGUAGES = ['en']

/**
 * 工厂主流程。
 *
 * 每一步都先落账再干活，所以中途关机不会留下「半张卡片包」这种
 * 既不像生成中也无法重来的状态：状态字段一定在某个明确的值上。
 */

/**
 * 新建（或复用）一个卡片包。
 *
 * 幂等键相同就直接把老的那份还给你，不再花钱 —— 这是三条死规矩里的第三条。
 * 幂等键里包含目标、类型、语言、条数、模型、提示词版本、音色，
 * 任何一项变了都算「另一件事」，会老老实实再生成一次。
 *
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {any} options.config
 * @param {string} options.root
 * @param {string} options.target
 * @param {'word' | 'phrase' | 'sentence'} [options.kind]
 * @param {number} [options.examplesCount]
 * @param {number} [options.zhVariants]
 * @param {boolean} [options.prepareCandidates]
 * @param {(message: string) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 */
export async function createPack({
  ctx,
  config,
  root,
  target,
  kind,
  examplesCount,
  zhVariants,
  prepareCandidates,
  onProgress,
  signal,
}) {
  const cleanTarget = normalizeSpace(target)
  if (!cleanTarget) throw new BadRequest('要先给一个词、短语或者整句。')
  if (cleanTarget.length > 120) throw new BadRequest('目标太长了，最多 120 个字符。')

  const language = normalizeSpace(config.language) || 'en'
  if (!LANGUAGES.includes(language)) {
    throw new BadRequest(`语言 ${language} 现在还不能生成，只支持 ${LANGUAGES.join('/')}。`)
  }

  const resolvedKind = ['word', 'phrase', 'sentence'].includes(String(kind)) ? String(kind) : classifyTarget(cleanTarget)
  const count = clampInt(examplesCount ?? config.examplesPerLesson, 1, 40, 8)
  const variants = clampInt(zhVariants ?? config.zhVariants, 2, 4, 3)
  const voiceKey = `${config.ttsEngine ?? 'auto'}:${config.ttsVoice ?? ''}:${config.ttsVoiceEdge ?? ''}:${config.rate ?? ''}`

  const key = idempotencyKey({
    target: cleanTarget,
    kind: resolvedKind,
    language,
    examples: count,
    variants,
    model: normalizeSpace(config.model) || 'default',
    promptVersion: (await import('./prompts.js')).PROMPT_VERSION,
    voice: voiceKey,
  })

  const existing = await update(root, (library) => {
    for (const id of library.order) {
      const pack = library.packs[id]
      if (pack?.idempotencyKey === key && pack.status !== 'failed') return pack
    }
    return null
  })
  if (existing) {
    onProgress?.(`这个目标已经有一份同样的包了（${existing.id}），直接复用，不再花钱。`)
    return existing
  }

  const id = newId()
  const now = new Date().toISOString()
  await update(root, (library) => {
    library.packs[id] = {
      id,
      target: cleanTarget,
      kind: resolvedKind,
      language,
      gloss: '',
      ipa: '',
      note: '',
      status: 'generating',
      createdAt: now,
      updatedAt: now,
      idempotencyKey: key,
      model: normalizeSpace(config.model),
      promptVersion: '',
      voice: {
        engine: config.ttsEngine ?? 'auto',
        voice: config.ttsVoiceEdge || config.ttsVoice || '',
        rate: config.rate,
        volume: config.volume,
      },
      examples: [],
      swaps: [],
      problems: [],
      pack: null,
      install: null,
      lastError: null,
    }
    if (!library.order.includes(id)) library.order.unshift(id)
  })

  try {
    onProgress?.(`正在造 ${count} 条例句……`)
    const generated = await generateExamples({
      ctx,
      config,
      target: cleanTarget,
      kind: resolvedKind,
      examples: count,
      zhVariants: variants,
      signal,
    })

    const pack = await update(root, (library) => {
      const pack = findPack(library, id)
      pack.kind = generated.kind
      pack.gloss = generated.gloss
      pack.ipa = generated.ipa
      pack.note = generated.note
      pack.problems = generated.problems
      pack.model = generated.meta.model
      pack.promptVersion = generated.meta.promptVersion
      pack.examples = generated.examples.map(emptyMediaFields)
      pack.swaps = generated.swaps
      pack.status = 'text'
      pack.updatedAt = new Date().toISOString()
      return pack
    })

    const wantsCandidates = prepareCandidates ?? config.autoPrepareCandidates
    if (wantsCandidates) {
      for (const example of pack.examples) {
        throwIfAborted(signal)
        try {
          onProgress?.(`第 ${example.ord} 条：正在找候选图……`)
          await prepareCandidatesFor(root, id, example.ord, { config, signal })
        } catch (error) {
          if (signal?.aborted) throw error
          onProgress?.(`第 ${example.ord} 条找图失败（${error.message}），先跳过。`)
        }
      }
    }

    return await getPack(root, id)
  } catch (error) {
    await update(root, (library) => {
      const pack = library.packs[id]
      if (!pack) return
      pack.status = 'failed'
      pack.lastError = error instanceof Error ? error.message : String(error)
      pack.updatedAt = new Date().toISOString()
    })
    throw error
  }
}

export async function listPacks(root) {
  const { packs } = await snapshot(root)
  return packs.map((pack) => ({
    id: pack.id,
    target: pack.target,
    kind: pack.kind,
    status: pack.status,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    gloss: pack.gloss,
    progress: packProgress(pack),
    exportedAt: pack.export?.at ?? null,
    exportDir: pack.export?.dir ?? null,
    lastError: pack.lastError ?? null,
  }))
}

/**
 * 记一笔「导出到哪儿了」。导出本身在 `lib/export.js` 里做（那边只认 getPack），
 * 这里只负责落账 —— 分开是为了不让两个模块互相 import 成一团。
 */
export async function markExported(root, packId, info) {
  return update(root, (library) => {
    const pack = findPack(library, packId)
    if (!pack) throw new FactoryError(`找不到卡片包 ${packId}。`, 'pack-not-found')
    pack.export = {
      at: new Date().toISOString(),
      dir: info.dir,
      files: info.files,
      bytes: info.bytes,
    }
    if (pack.status === 'packed' || pack.status === 'media') pack.status = 'exported'
    pack.updatedAt = new Date().toISOString()
    return pack
  })
}

export async function getPack(root, id) {
  const { packs } = await snapshot(root)
  const pack = packs.find((one) => one.id === id)
  if (!pack) throw new FactoryError(`找不到卡片包 ${id}。`, 'pack-not-found')
  return { ...pack, progress: packProgress(pack) }
}

export async function deletePack(root, id) {
  const pack = await getPack(root, id)
  await update(root, (library) => {
    delete library.packs[id]
    library.order = library.order.filter((one) => one !== id)
  })
  await dropPackCandidates(root, id)
  if (pack.pack?.dir) await rm(pack.pack.dir, { recursive: true, force: true }).catch(() => {})
  return { id }
}

/**
 * 删掉某个包留下的候选暂存文件。
 *
 * 之前这里写的是 `rm(候选目录, {recursive:false})` —— 目录非空时抛 ENOTEMPTY，
 * 又被 catch 吞掉，等于什么也没删。删包不清暂存的话，攒到几十个包之后
 * 那个目录里全是没人认领的图。
 */
async function dropPackCandidates(root, packId) {
  const dir = join(root, 'factory', 'candidates')
  let names = []
  try {
    names = await readdir(dir)
  } catch {
    return
  }
  await Promise.all(
    names
      .filter((name) => name.startsWith(`${packId}-`))
      .map((name) => rm(join(dir, name), { force: true }).catch(() => {})),
  )
}

/**
 * 给某一条准备一批候选图。
 *
 * 「一批」是关键：一次只给一张，用户没得挑，最后就只能用模型给的那张，
 * 于是「人工点头」退化成走个过场。这里固定下 6–9 张，全都预检过，
 * 每张都带着自己的授权信息，九宫格里点哪张都能说清来历。
 */
export async function prepareCandidatesFor(root, packId, ord, { config, signal }) {
  const pack = await getPack(root, packId)
  const example = pack.examples.find((one) => one.ord === ord)
  if (!example) throw new BadRequest(`第 ${ord} 条不存在。`)

  const limit = clampInt(config.candidateLimit, 3, 12, 9)
  const queries = buildQueries({
    imageQuery: example.imageQuery,
    target: pack.target,
    sentence: example.sentence,
  })

  throwIfAborted(signal)
  const found = await searchCandidates({ queries, perQuery: 8, signal })
  if (found.length === 0) {
    throw new FactoryError(
      `「${queries[0]}」在图库里一张都没搜到。换一个 image_query，或者自己上传一张。`,
      'no-candidates',
    )
  }

  const prefix = `${packId}-${ord}`
  const kept = []
  const rejected = []

  /**
   * 挑「最像一张卡片图」的先试。
   *
   * 另外还要躲开这个包里别的例句已经用掉的同一张照片 —— 八句八张图是
   * 这套卡片方法的核心之一，重复的图会让整包看起来像复制粘贴。
   * 不是硬拒绝：全库只有那一张能用时，宁可重复也别留空。
   */
  const usedElsewhere = new Set(
    pack.examples.filter((one) => one.ord !== ord && one.image).map((one) => one.image.creditUrl || one.image.file),
  )
  const score = (candidate) => {
    const width = Number(candidate.width) || 0
    const height = Number(candidate.height) || 0
    if (!width || !height) return 0
    const aspect = width / height
    const aspectScore = aspect >= 1.2 && aspect <= 2.0 ? 2 : aspect >= 1.0 ? 1 : 0
    const fresh = usedElsewhere.has(candidate.creditUrl) ? -3 : 0
    return aspectScore + (Math.min(width, height) >= 640 ? 1 : -1) + fresh
  }
  const ordered = [...found].sort((a, b) => score(b) - score(a))

  /**
   * 一次下一批，够数就收。
   *
   * 为什么要分波：直接并发十几张既慢又容易撞图库限流，
   * 而第一波通常就够了。只有第一波坏的太多才继续往下拿。
   */
  let cursor = 0
  while (kept.length < limit && cursor < ordered.length) {
    const need = limit - kept.length
    const wave = ordered.slice(cursor, cursor + Math.max(need, 4))
    cursor += wave.length

    const attempts = await mapLimit(wave, 4, async (candidate) => {
      throwIfAborted(signal)
      // 先试缩略图：又小又快。Commons 的 thumburl 有 1400px，够卡片用；
      // Openverse 的 thumbnail 多半只有 512，短边不够时再回去下原图。
      const urls = []
      if (candidate.thumbUrl && candidate.thumbUrl !== candidate.url) urls.push(candidate.thumbUrl)
      if (candidate.url) urls.push(candidate.url)

      const reasons = []
      for (const url of urls) {
        const downloaded = await downloadImage(url, { signal })
        if (!downloaded.ok) {
          reasons.push(downloaded.reason)
          continue
        }
        const check = await precheckImage(downloaded.bytes, { checkPixels: config.pixelCheck !== false })
        if (!check.ok) {
          reasons.push(check.problems.map((one) => one.message).join('；'))
          continue
        }
        return { candidate, bytes: downloaded.bytes, check }
      }
      return { candidate, reason: reasons.filter(Boolean).join(' / ') || '用不上' }
    })

    for (const attempt of attempts) {
      if (kept.length >= limit) break
      if (!attempt) continue
      if (!attempt.bytes) {
        rejected.push({ ...attempt.candidate, reason: attempt.reason })
        continue
      }
      const { candidate, bytes, check } = attempt
      const extension = (check.mediaType ?? 'image/jpeg').split('/')[1].replace('jpeg', 'jpg')
      const name = `${prefix}-${kept.length + 1}.${extension}`
      await stageCandidateBytes({ root, name, bytes })
      kept.push({
        id: `${candidate.source}:${candidate.id}`,
        stagedName: name,
        source: candidate.source,
        query: candidate.query,
        width: check.width,
        height: check.height,
        bytes: check.bytes,
        aspect: check.aspect,
        license: candidate.license,
        licenseUrl: candidate.licenseUrl,
        author: candidate.author,
        creditUrl: candidate.creditUrl,
        title: candidate.title,
        flat: check.pixels?.flat === true,
      })
    }
  }

  // 旧的暂存文件先清掉，不然九宫格里会出现上一批的图。
  const previous = example.imageCandidates.map((one) => one.stagedName).filter(Boolean)
  await dropStaged({ root, names: previous.filter((name) => !kept.some((one) => one.stagedName === name)) })

  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    record.imageCandidates = kept
    record.imageRejected = rejected.slice(0, 30).map((one) => ({
      source: one.source,
      query: one.query,
      reason: one.reason,
      creditUrl: one.creditUrl,
    }))
    record.imageQuery = example.imageQuery
    target.status = target.status === 'text' ? 'media' : target.status
    target.updatedAt = new Date().toISOString()
  })

  return { kept, rejectedCount: rejected.length, queries }
}

/**
 * 锁一张候选图。这是「人点过头」那一下。
 *
 * 锁定的同时写 `imageReview` —— 打包时只看这个字段，不看图片本身。
 * 换句话说：绕过界面直接改账本才能造出一个没有复核人的包，
 * 而那种包在 `validateManifest` 那关会被拒收。
 */
export async function pickCandidate(root, packId, ord, stagedName, { by }) {
  const pack = await getPack(root, packId)
  const example = pack.examples.find((one) => one.ord === ord)
  if (!example) throw new BadRequest(`第 ${ord} 条不存在。`)
  const candidate = example.imageCandidates.find((one) => one.stagedName === stagedName)
  if (!candidate) throw new BadRequest(`这一批候选里没有 ${stagedName}。`)

  const bytes = await readStagedBytes({ root, name: stagedName })
  const check = await precheckImage(bytes)
  if (!check.ok) {
    throw new BadRequest(`这张图不过关：${check.problems.map((one) => one.message).join('；')}`)
  }
  const stored = await saveImageFile({ root, source: candidate.source, bytes, mediaType: check.mediaType })
  const at = new Date().toISOString()

  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    record.image = {
      file: stored.file,
      sha256: stored.sha256,
      bytes: stored.bytes,
      width: check.width,
      height: check.height,
      source: candidate.source,
      query: candidate.query,
      license: candidate.license,
      licenseUrl: candidate.licenseUrl,
      author: candidate.author,
      creditUrl: candidate.creditUrl,
      flat: check.pixels?.flat === true,
    }
    record.imageReview = {
      by: normalizeSpace(by) || '本机用户',
      at,
      candidates: record.imageCandidates.length,
      picked: stagedName,
    }
    target.updatedAt = at
  })

  await dropStaged({
    root,
    names: example.imageCandidates.filter((one) => one.stagedName !== stagedName).map((one) => one.stagedName),
  })
  return getPack(root, packId)
}

/**
 * 自己上传一张。
 *
 * 预检照跑 —— 上传口不是后门。真要放行一张被误判的真照片，得显式传
 * `force`，而且记录里会留下 `overridden: true`，以后有人问「这张为什么
 * 短边只有 600 还能进包」，账本上有答案。
 */
export async function uploadCandidate(root, packId, ord, { bytes, mediaType, by, force }) {
  const check = await precheckImage(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes))
  if (!check.ok && !force) {
    throw new BadRequest(
      `这张图不过关：${check.problems.map((one) => one.message).join('；')}。确认要用的话，点「仍然使用」。`,
      { problems: check.problems },
    )
  }
  if (!check.mediaType) throw new BadRequest('这不是图片文件。')

  const stored = await saveImageFile({ root, source: 'upload', bytes, mediaType: check.mediaType })
  const at = new Date().toISOString()
  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    if (!record) throw new BadRequest(`第 ${ord} 条不存在。`)
    record.image = {
      file: stored.file,
      sha256: stored.sha256,
      bytes: stored.bytes,
      width: check.width,
      height: check.height,
      source: 'upload',
      query: record.imageQuery ?? '',
      license: '自己上传（作者保留权利）',
      licenseUrl: '',
      author: normalizeSpace(by) || '本机用户',
      creditUrl: '',
      flat: check.pixels?.flat === true,
      overridden: check.ok ? false : true,
    }
    record.imageReview = {
      by: normalizeSpace(by) || '本机用户',
      at,
      candidates: 0,
      picked: stored.file,
    }
    target.updatedAt = at
  })
  return { pack: await getPack(root, packId), storage: stored.file }
}

/** 取消锁定：图和复核记录一起清掉，逼人重新点一次。 */
export async function unlockImage(root, packId, ord) {
  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    if (!record) throw new BadRequest(`第 ${ord} 条不存在。`)
    record.image = null
    record.imageReview = null
    target.updatedAt = new Date().toISOString()
  })
  return getPack(root, packId)
}

/**
 * 合成一条语音。
 *
 * 合成完不写 `audioReview` —— 「合成成功」和「听过了」是两件事，
 * Etude 把它们混成一件，于是界面上那句「已完成」永远不代表人能听见。
 */
export async function synthesizeExample({ ctx, config, root, packId, ord, signal }) {
  const pack = await getPack(root, packId)
  const example = pack.examples.find((one) => one.ord === ord)
  if (!example) throw new BadRequest(`第 ${ord} 条不存在。`)

  throwIfAborted(signal)
  const audio = await synthesizeForPack({
    ctx,
    config,
    root,
    text: example.sentence,
    voiceHint: example.voiceHint,
    signal,
  })

  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    record.audio = audio
    record.audioReview = null
    target.voice = { engine: audio.engine, voice: audio.voice, rate: config.rate, volume: config.volume }
    target.updatedAt = new Date().toISOString()
  })
  return audio
}

/** 「我听了，没问题」。 */
export async function confirmAudio(root, packId, ord, { by }) {
  const at = new Date().toISOString()
  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    if (!record?.audio) throw new BadRequest(`第 ${ord} 条还没有语音，先合成。`)
    record.audioReview = { by: normalizeSpace(by) || '本机用户', at, listened: true }
    target.updatedAt = at
  })
  return getPack(root, packId)
}

export async function unlockAudio(root, packId, ord) {
  await update(root, (library) => {
    const target = findPack(library, packId)
    const record = target.examples.find((one) => one.ord === ord)
    if (!record) throw new BadRequest(`第 ${ord} 条不存在。`)
    record.audioReview = null
    target.updatedAt = new Date().toISOString()
  })
  return getPack(root, packId)
}

/**
 * 打包：把账本里的事实落成一份磁盘上的包，然后交给校验器。
 *
 * 校验器不过关就把 staging 留着、把错误原样抛出去 —— 不删，是因为
 * 用户点「校验」看错误的时候需要那些文件还在。
 */
export async function buildPackDir({ ctx, config, root, packId, version, signal }) {
  const pack = await getPack(root, packId)
  const missing = []
  for (const example of pack.examples) {
    if (!example.image) missing.push(`第 ${example.ord} 条没有配图`)
    else if (!example.imageReview?.by) missing.push(`第 ${example.ord} 条的配图没人确认`)
    if (!example.audio) missing.push(`第 ${example.ord} 条没有语音`)
    else if (!example.audioReview?.listened) missing.push(`第 ${example.ord} 条语音还没试听`)
  }
  if (missing.length > 0) {
    throw new BadRequest(`还不能打包：${missing.slice(0, 8).join('；')}${missing.length > 8 ? `……还有 ${missing.length - 8} 处` : ''}。`, {
      missing,
    })
  }

  throwIfAborted(signal)
  const staging = stagingDir(root, packId)
  await rm(staging, { recursive: true, force: true })
  await mkdir(join(staging, 'images'), { recursive: true })
  await mkdir(join(staging, 'audio'), { recursive: true })

  const manifest = buildManifest(pack, { version, runId: packId })
  await writeFile(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  for (const example of pack.examples) {
    await copyInto(mediaDir(root, 'images'), example.image.file, join(staging, 'images'))
    await copyInto(mediaDir(root, 'audio'), example.audio.file, join(staging, 'audio'))
  }

  const verdict = await validateManifest(manifest, {
    loadFile: (relative) => readFile(join(staging, relative)),
  })

  if (!verdict.ok) {
    await update(root, (library) => {
      const target = findPack(library, packId)
      target.status = 'media'
      target.lastError = `打包校验没过：${verdict.errors[0] ?? '未知原因'}`
      target.updatedAt = new Date().toISOString()
    })
    throw new FactoryError(`打包校验没过：${verdict.errors.join('；')}`, 'pack-invalid', {
      errors: verdict.errors,
      warnings: verdict.warnings,
      staging,
    })
  }

  const finalDir = join(packsDir(root), packId)
  await rm(finalDir, { recursive: true, force: true })
  await mkdir(packsDir(root), { recursive: true })
  await cp(staging, finalDir, { recursive: true })

  await update(root, (library) => {
    const target = findPack(library, packId)
    target.status = 'packed'
    target.lastError = null
    target.pack = {
      dir: finalDir,
      manifestPath: join(finalDir, 'manifest.json'),
      builtAt: new Date().toISOString(),
      quality: manifest.quality,
      warnings: verdict.warnings,
    }
    target.updatedAt = new Date().toISOString()
  })

  return { pack: await getPack(root, packId), manifest, verdict, dir: finalDir }
}

async function copyInto(fromDir, file, toDir) {
  const bytes = await readFile(join(fromDir, file))
  await writeFile(join(toDir, file), bytes)
}

/** 只校验、不打包。给界面上的「检查一下」按钮用。 */
export async function checkPack(root, packId, version) {
  const pack = await getPack(root, packId)
  const manifest = buildManifest(pack, { version, runId: packId })
  const verdict = await validateManifest(manifest, {
    loadFile: async (relative) => {
      const [kind, name] = relative.split('/')
      if (!name) return null
      const dir = kind === 'images' ? mediaDir(root, 'images') : mediaDir(root, 'audio')
      try {
        return await readFile(join(dir, name))
      } catch {
        return null
      }
    },
  })
  const missing = []
  for (const example of pack.examples) {
    if (!example.imageReview?.by) missing.push(`第 ${example.ord} 条配图没确认`)
    if (!example.audioReview?.listened) missing.push(`第 ${example.ord} 条语音没试听`)
  }
  return { manifest, verdict, missing }
}
