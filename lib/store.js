import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'

import { stateFile } from './paths.js'
import { FactoryError } from './util.js'

/**
 * 工厂的账本。
 *
 * 一个 JSON 文件，不是 sqlite。理由很简单：这份数据是「一台机器上的工厂」，
 * 记录量级是几十个卡片包，任何时刻都能整份读进内存、整份写回；
 * 用 sqlite 换来的是迁移、锁、并发写入的麻烦，一点好处都没有。
 *
 * 真正重要的不是存储方式，是**写盘不能半截**：写到临时文件再 rename，
 * 断电最多丢最后一次改动，不会留下一个解析不了的 JSON 把整个插件卡死。
 *
 * 所有改动都走 `update()`，它串行化了读-改-写，避免两个人同时点按钮
 * 一个覆盖掉另一个。
 */

/** @type {Map<string, Promise<unknown>>} */
const chains = new Map()

export function emptyLibrary() {
  return { version: 1, packs: {}, order: [] }
}

export function newId() {
  return randomUUID().replace(/-/g, '').slice(0, 16)
}

/**
 * @param {string} root
 * @returns {Promise<{ version: number, packs: Record<string, any>, order: string[] }>}
 */
export async function readLibrary(root) {
  const path = stateFile(root)
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyLibrary()
    throw new FactoryError(`读不了工厂账本：${error.message}`, 'store-unreadable', { path })
  }
  try {
    return migrate(JSON.parse(raw))
  } catch (error) {
    throw new FactoryError(
      `工厂账本坏了（${path}）。把它改名备份一下，插件会重新建一份空的。原始错误：${error.message}`,
      'store-corrupt',
      { path },
    )
  }
}

function migrate(parsed) {
  const library = emptyLibrary()
  if (!parsed || typeof parsed !== 'object') return library
  if (parsed.packs && typeof parsed.packs === 'object') library.packs = parsed.packs
  if (Array.isArray(parsed.order)) library.order = parsed.order.filter((id) => typeof id === 'string')
  // 补齐 order：老账本可能只有 packs，没有显式顺序。
  for (const id of Object.keys(library.packs)) {
    if (!library.order.includes(id)) library.order.push(id)
  }
  library.order = library.order.filter((id) => library.packs[id])
  return library
}

/** 原子写。先落到同目录的临时文件，再 rename 顶替。 */
export async function writeLibrary(root, library) {
  const path = stateFile(root)
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  const body = `${JSON.stringify(library, null, 2)}\n`
  await writeFile(tmp, body, 'utf8')
  await rename(tmp, path)
}

/**
 * 串行的读-改-写。
 *
 * `mutator` 直接改传进来的 library，返回值会原样透出。它抛出异常时
 * 不写盘 —— 这样一次失败的生成不会在账本里留下半截卡片包。
 *
 * @template T
 * @param {string} root
 * @param {(library: any) => T | Promise<T>} mutator
 * @returns {Promise<T>}
 */
export function update(root, mutator) {
  const key = root
  const previous = chains.get(key) ?? Promise.resolve()
  const next = previous.then(async () => {
    const library = await readLibrary(root)
    const result = await mutator(library)
    await writeLibrary(root, library)
    return result
  })
  // 链条上只留「是否结束」，不把错误往下传，否则一次失败会让后续全部短路。
  chains.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  )
  return next
}

/** 只读一次的快照，给列表页用。 */
export async function snapshot(root) {
  const library = await readLibrary(root)
  return {
    packs: library.order.map((id) => library.packs[id]).filter(Boolean),
  }
}

export function findPack(library, id) {
  const pack = library.packs[id]
  if (!pack) throw new FactoryError(`找不到卡片包 ${id}。`, 'pack-not-found')
  return pack
}

/** 卡片包的进度，界面上那个进度条就是按它算的。 */
export function packProgress(pack) {
  const total = pack.examples?.length ?? 0
  const images = pack.examples?.filter((one) => one.image && one.imageReview).length ?? 0
  const audios = pack.examples?.filter((one) => one.audio && one.audioReview?.listened).length ?? 0
  return { total, images, audios, done: total > 0 && images === total && audios === total }
}
