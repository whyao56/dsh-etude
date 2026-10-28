import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * 落盘位置。
 *
 * 所有路径都从同一个 root 派生。root 认插件配置里的 `dataDir`，不设就用
 * `%LOCALAPPDATA%\dsh-etude`。**这个插件不认识任何别的应用**：账本、素材、
 * 暂存、成品包全在自己这棵树里，删掉整棵树就等于把它恢复出厂。
 *
 * 四个子区各有各的删除语义：
 * - `factory/library.json`  账本。删掉等于「工厂失忆」，成品包还在磁盘上。
 * - `factory/media/`        内容寻址的素材库（`<source>-<sha20>.<ext>`）。
 *                            被包引用的不要手删，否则成品包校验会对不上哈希。
 * - `factory/candidates/`   候选图暂存。随时整目录删掉，只是还没点选的那批。
 * - `factory/packs/<id>/`   打好的成品包。这是唯一的交付物，可以整个搬走。
 * - `staging/<job-id>/`     打包中间态。随时可以整目录删掉。
 */
export function localAppData() {
  return process.env.LOCALAPPDATA?.trim() || join(homedir(), 'AppData', 'Local')
}

/** @param {string | undefined} configured 插件配置里的数据目录，优先于默认位置 */
export function dataRoot(configured) {
  const explicit = String(configured ?? '').trim()
  if (explicit) return explicit
  return join(localAppData(), 'dsh-etude')
}

/** 导出成品包时默认往这儿放。 */
export function defaultExportDir() {
  return join(homedir(), 'Downloads', 'dsh-etude')
}

export function factoryRoot(root) {
  return join(root, 'factory')
}

export function stateFile(root) {
  return join(factoryRoot(root), 'library.json')
}

/** @param {'images' | 'audio'} kind */
export function mediaDir(root, kind) {
  return join(factoryRoot(root), 'media', kind)
}

export function candidatesDir(root) {
  return join(factoryRoot(root), 'candidates')
}

export function packsDir(root) {
  return join(factoryRoot(root), 'packs')
}

export function stagingDir(root, jobId) {
  return join(root, 'staging', jobId)
}
