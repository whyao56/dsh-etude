import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { etudeAudioDir, etudeDbPath, etudeImagesDir } from './paths.js'
import { findPack, update } from './store.js'
import { compareKey, EtudeError, throwIfAborted } from './util.js'

export const DEFAULT_ETUDE_URL = 'http://127.0.0.1:8977'

/**
 * 和 Etude 训练器对接。
 *
 * 存在的理由是它们两边都缺一块：
 * - Etude 的 `POST /api/lessons/import` **只认文字**，`media` 字段它根本不看，
 *   所以导进去的包一定是「缺语音、没配图」的状态（源码 `routes/lessons.py:157`
 *   里 `finish_lesson(..., {}, {})` 两个媒体字典都是空的）。
 * - 本插件造好的媒体是内容寻址的，文件名规则和 Etude 自己的一模一样
 *   （`<source>-<sha256 前 20 位>.<ext>`），所以可以直接丢进它的目录里被认出。
 *
 * 于是安装 = 三步：把文件放进去 → 走官方 API 导入文字 → 把媒体名写回它库里。
 */

async function requestJson(url, init, { timeoutMs = 15000, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }
    if (!response.ok) {
      const detail = body?.detail ?? body?.error ?? text.slice(0, 300)
      throw new EtudeError(`Etude 返回 ${response.status}：${detail}`, 'etude-http', {
        status: response.status,
        detail,
      })
    }
    return body
  } catch (error) {
    if (error instanceof EtudeError) throw error
    if (error?.name === 'AbortError' && signal?.aborted) throw error
    throw new EtudeError(`连不上 Etude（${url}）：${error.message}`, 'etude-unreachable', { url })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** 探一下 Etude 在不在。不在也正常 —— 生成和打包不需要它。 */
export async function probeEtude({ url = DEFAULT_ETUDE_URL, timeoutMs = 4000, signal } = {}) {
  const base = normalizeBase(url)
  try {
    const lessons = await requestJson(`${base}/api/lessons`, { method: 'GET' }, { timeoutMs, signal })
    const list = Array.isArray(lessons) ? lessons : (lessons?.lessons ?? [])
    return { ok: true, url: base, lessons: list.length }
  } catch (error) {
    return { ok: false, url: base, error: error instanceof Error ? error.message : String(error) }
  }
}

function normalizeBase(url) {
  const text = String(url ?? '').trim() || DEFAULT_ETUDE_URL
  return text.replace(/\/+$/, '')
}

/**
 * 把一个已经打好包的卡片包装进 Etude。
 *
 * @param {object} options
 * @param {string} options.root
 * @param {string} options.packId
 * @param {string} [options.url]
 * @param {boolean} [options.writeAudioPath] 允许直写 Etude 的 sqlite（见下方注释）
 * @param {AbortSignal} [options.signal]
 * @param {(message: string) => void} [options.onProgress]
 */
export async function installPack({ root, packId, url, writeAudioPath = true, signal, onProgress }) {
  const pack = await findPackById(root, packId)
  if (!pack.pack?.dir) {
    throw new EtudeError('这个包还没打成目录，先打包再安装。', 'not-packed')
  }
  const base = normalizeBase(url)
  const imagesDir = etudeImagesDir(root)
  const audioDir = etudeAudioDir(root)

  // 先探活。这一步失败时说清楚是「Etude 没开」而不是「接口错了」，
  // 否则用户会去翻接口文档，而问题只是那个窗口没启动。
  const alive = await probeEtude({ url: base, signal })
  if (!alive.ok) {
    throw new EtudeError(
      `Etude 没在 ${base} 上运行。先打开 Etude（或者告诉我它换到别的端口了），再来点安装。`,
      'etude-unreachable',
      { url: base, reason: alive.error },
    )
  }

  await mkdir(imagesDir, { recursive: true })
  await mkdir(audioDir, { recursive: true })

  const missing = []
  for (const example of pack.examples) {
    throwIfAborted(signal)
    if (example.image?.file) {
      const copied = await copyIfMissing(join(pack.pack.dir, 'images', example.image.file), join(imagesDir, example.image.file))
      if (!copied) missing.push(`配图 ${example.image.file}`)
    }
    if (example.audio?.file) {
      const copied = await copyIfMissing(join(pack.pack.dir, 'audio', example.audio.file), join(audioDir, example.audio.file))
      if (!copied) missing.push(`语音 ${example.audio.file}`)
    }
  }
  if (missing.length > 0) {
    throw new EtudeError(`包里的媒体文件不见了：${missing.slice(0, 5).join('、')}。重新打一次包。`, 'media-missing', {
      missing,
    })
  }

  onProgress?.('媒体已放进 Etude 的数据目录，开始导入例句……')

  const manifest = JSON.parse(await readFile(join(pack.pack.dir, 'manifest.json'), 'utf8'))
  const imported = await requestJson(
    `${base}/api/lessons/import`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(manifest),
    },
    { timeoutMs: 30000, signal },
  )
  const lessonId = Number(imported?.lesson_id)
  if (!Number.isFinite(lessonId) || lessonId <= 0) {
    throw new EtudeError('Etude 没回 lesson_id，导入结果不可信，先别当成功。', 'etude-bad-response', {
      imported,
    })
  }

  onProgress?.(`Etude 建好了训练包 #${lessonId}，正在把配图挂到每一句上……`)

  const detail = await requestJson(`${base}/api/lessons/${lessonId}`, { method: 'GET' }, { timeoutMs: 15000, signal })
  const remoteExamples = Array.isArray(detail?.examples) ? detail.examples : []
  const bySentence = new Map()
  for (const row of remoteExamples) {
    bySentence.set(compareKey(String(row.sentence ?? '')), row)
  }

  const images = []
  const imageFailures = []
  for (const example of pack.examples) {
    throwIfAborted(signal)
    const row = bySentence.get(compareKey(example.sentence))
    if (!row) {
      imageFailures.push({ ord: example.ord, sentence: example.sentence, reason: 'Etude 里找不到这句（导入时被截断或去重了）' })
      continue
    }
    try {
      await requestJson(
        `${base}/api/examples/${row.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            scene_image: example.image.file,
            image_query: example.image.query || example.imageQuery || '',
          }),
        },
        { timeoutMs: 15000, signal },
      )
      images.push({ ord: example.ord, exampleId: row.id, file: example.image.file })
    } catch (error) {
      imageFailures.push({ ord: example.ord, sentence: example.sentence, reason: error.message })
    }
  }

  onProgress?.('正在把语音路径写回 Etude……')

  /**
   * 语音这里只能绕过接口。
   *
   * Etude 没有任何「把现成的音频文件挂上去」的接口：`_EXAMPLE_FIELDS`
   * （`store/lessons.py:68`）里没有 `audio_path`，`POST /api/examples/{id}/audio`
   * 是**重新合成**而不是登记。它的库开着 WAL（`store/schema.py:28`），
   * 所以从第二个进程写一行 UPDATE 是安全的 —— 这也是本插件唯一碰别人库的地方。
   * 写不进去不致命：卡片照样导入成功，只是要在 Etude 里点一次「补齐语音」。
   */
  let audioRows = 0
  let audioError = null
  if (writeAudioPath) {
    try {
      audioRows = await patchAudioPaths({ root, pack, base, lessonId, bySentence, signal })
    } catch (error) {
      audioError = error instanceof Error ? error.message : String(error)
    }
  }

  const at = new Date().toISOString()
  await update(root, (library) => {
    const target = findPack(library, packId)
    target.status = 'installed'
    target.install = {
      at,
      url: base,
      lessonId,
      images: images.length,
      audios: audioRows,
      audioError,
      imageFailures,
    }
    target.updatedAt = at
  })

  return {
    lessonId,
    url: base,
    examples: remoteExamples.length,
    images: images.length,
    audios: audioRows,
    audiosNeedRebuild: audioRows === 0,
    audioError,
    imageFailures,
  }
}

async function patchAudioPaths({ root, pack, base, lessonId, bySentence, signal }) {
  let DatabaseSync
  try {
    ;({ DatabaseSync } = await import('node:sqlite'))
  } catch (error) {
    throw new EtudeError(
      `当前运行时没有 node:sqlite，语音路径写不回去。去 Etude 里点一次「补齐语音」就行。(${error.message})`,
      'no-sqlite',
    )
  }
  const dbPath = etudeDbPath(root)
  await stat(dbPath)
  const db = new DatabaseSync(dbPath, { timeout: 5000 })
  try {
    db.exec('PRAGMA busy_timeout = 5000')
    const statement = db.prepare('UPDATE examples SET audio_path = ?, audio_voice = ? WHERE id = ? AND lesson_id = ?')
    let rows = 0
    for (const example of pack.examples) {
      throwIfAborted(signal)
      const row = bySentence.get(compareKey(example.sentence))
      if (!row) continue
      const result = statement.run(String(example.audio.file), String(example.audio.voice ?? ''), row.id, lessonId)
      rows += Number(result?.changes ?? 0)
    }
    return rows
  } finally {
    db.close()
  }
}

async function copyIfMissing(from, to) {
  try {
    await stat(to)
    return true
  } catch {
    // 不存在才复制
  }
  try {
    await copyFile(from, to)
    return true
  } catch {
    return false
  }
}

async function findPackById(root, packId) {
  const { snapshot } = await import('./store.js')
  const { packs } = await snapshot(root)
  const pack = packs.find((one) => one.id === packId)
  if (!pack) throw new EtudeError(`找不到卡片包 ${packId}。`, 'pack-not-found')
  return pack
}
