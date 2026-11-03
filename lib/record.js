import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { mediaDir, packsDir } from './paths.js'
import { findPack, snapshot, update } from './store.js'
import { BadRequest, FactoryError } from './util.js'

/**
 * 自己录的那一遍声音。
 *
 * 设计稿的「说」这一面一直是空的：没有录音，评分键也就没东西可评。
 * 这里补上最小可用的一套：拿一段浏览器录的 base64 音频，落进素材库，
 * 挂到那一条例句上，能存能读能删。
 *
 * 为什么存在素材库里而不是成品包里：成品包是「交付物」，给人用的；
 * 录音是「练习痕迹」，会反复覆盖，不该让成品包的校验去管它。
 *
 * 允许的容器只有三种，别的直接拒 —— 与其存一堆浏览器各自发明的格式，
 * 不如把不确定性挡在入口。
 */

const ALLOWED = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
}

const MAX_BYTES = 8 * 1024 * 1024

export function recordDir(root) {
  return mediaDir(root, 'record')
}

function extensionOf(mime) {
  const key = String(mime || '').split(';')[0].trim().toLowerCase()
  const ext = ALLOWED[key]
  if (!ext) {
    throw new BadRequest(
      `不认这种录音格式：${mime || '(空)'}。浏览器录出来一般是 audio/webm，Safari 是 audio/mp4 之外的 audio/ogg。`,
    )
  }
  return { ext, mime: key }
}

/**
 * 存一段录音。
 *
 * @param {string} root
 * @param {{ packId: string, ord: number|string, base64: string, mime: string, durationMs?: number }} input
 */
export async function saveRecord(root, input) {
  const packId = String(input?.packId || '').trim()
  const ord = Number(input?.ord)
  if (!packId) throw new BadRequest('录音要带 packId。')
  if (!Number.isInteger(ord) || ord < 1) throw new BadRequest('录音要带 ord（第几条例句，从 1 起）。')

  const { mime, ext } = extensionOf(input?.mime)
  const raw = String(input?.base64 || '').replace(/^data:[^,]*,/, '')
  if (!raw) throw new BadRequest('录音是空的，没东西可存。')
  let buffer
  try {
    buffer = Buffer.from(raw, 'base64')
  } catch (error) {
    throw new BadRequest(`录音不是合法的 base64：${error.message}`)
  }
  if (!buffer.length) throw new BadRequest('录音解出来是 0 字节。')
  if (buffer.length > MAX_BYTES) {
    throw new BadRequest(`录音 ${(buffer.length / 1024 / 1024).toFixed(1)}MB，超过 8MB 上限。`)
  }

  // 先确认包和例句都在，再落盘 —— 别留下一个没人引用的音频文件
  const { packs } = await snapshot(root)
  const pack = packs.find((one) => one.id === packId)
  if (!pack) throw new FactoryError(`找不到卡片包 ${packId}。`, 'pack-not-found')
  if (!pack.examples || !pack.examples[ord - 1]) {
    throw new BadRequest(`第 ${ord} 条例句不存在（这个包一共 ${pack.examples?.length ?? 0} 条）。`)
  }

  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const file = `record-${packId}-${ord}-${sha256.slice(0, 12)}.${ext}`
  const dir = recordDir(root)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, file), buffer)

  const record = {
    file,
    sha256,
    bytes: buffer.length,
    mime,
    durationMs: Number.isFinite(Number(input?.durationMs)) ? Math.round(Number(input.durationMs)) : null,
    recordedAt: Date.now(),
  }

  // 换新录音时把旧的删掉：同一句留两份没人认得出哪份是最后一遍
  const previous = pack.examples[ord - 1].record
  if (previous?.file && previous.file !== file) {
    await rm(join(dir, previous.file), { force: true }).catch(() => {})
  }

  await update(root, (library) => {
    const target = findPack(library, packId)
    const example = target.examples?.[ord - 1]
    if (!example) throw new BadRequest(`第 ${ord} 条例句不见了。`)
    example.record = record
  })

  return record
}

/** 读字节给界面播放（走 base64，不开 HTTP 路由）。 */
export async function readRecord(root, packId, ord) {
  const { packs } = await snapshot(root)
  const pack = packs.find((one) => one.id === packId)
  if (!pack) throw new FactoryError(`找不到卡片包 ${packId}。`, 'pack-not-found')
  const example = pack.examples?.[Number(ord) - 1]
  const record = example?.record
  if (!record?.file) {
    throw new FactoryError('这一句还没有录音。', 'record-missing')
  }
  let buffer
  try {
    buffer = await readFile(join(recordDir(root), record.file))
  } catch (error) {
    throw new FactoryError(`录音文件不在了：${record.file}（${error.code || error.message}）`, 'record-gone')
  }
  return { base64: buffer.toString('base64'), mime: record.mime || 'audio/webm', bytes: buffer.length }
}

/** 删掉一段录音。 */
export async function deleteRecord(root, packId, ord) {
  let removed = null
  await update(root, (library) => {
    const pack = findPack(library, packId)
    const example = pack.examples?.[Number(ord) - 1]
    if (!example?.record) return
    removed = example.record
    example.record = null
  })
  if (removed?.file) await rm(join(recordDir(root), removed.file), { force: true }).catch(() => {})
  return { deleted: Boolean(removed) }
}

/** 测试与「厂里现在有几段录音」用。 */
export async function recordStats(root) {
  const { packs } = await snapshot(root)
  let count = 0
  let bytes = 0
  for (const pack of packs) {
    for (const example of pack.examples || []) {
      if (example.record?.file) {
        count += 1
        bytes += Number(example.record.bytes) || 0
      }
    }
  }
  return { count, bytes, dir: recordDir(root) }
}

/** 成品包目录里不放录音，这里给个固定路径给测试断言用。 */
export function packDirOf(root, packId) {
  return join(packsDir(root), packId)
}
