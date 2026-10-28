import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * 落盘位置。
 *
 * 所有路径都从同一个 root 派生，root 认 `ETUDE_DATA_DIR`，和 Etude 的约定一致；
 * 不设就用 `%LOCALAPPDATA%\Etude`。这样插件和 Etude 看的是同一棵树，
 * 导入那一步只需要把文件换个目录放，不用跨盘拷贝。
 *
 * 三个子区各有各的删除语义：
 * - `factory/`            本插件自己的账本与素材库。删掉等于「工厂失忆」，Etude 不受影响。
 * - `audio/` `images/`    Etude 自己的媒体目录。只在「导入 Etude」那一步写。
 * - `staging/<job-id>/`   打包中间态。随时可以整目录删掉。
 */
export function localAppData() {
  return process.env.LOCALAPPDATA?.trim() || join(homedir(), 'AppData', 'Local')
}

/** @param {string | undefined} configured 插件配置里的数据目录，优先于环境变量 */
export function etudeRoot(configured) {
  const explicit = String(configured ?? '').trim()
  if (explicit) return explicit
  const fromEnv = process.env.ETUDE_DATA_DIR?.trim()
  if (fromEnv) return fromEnv
  return join(localAppData(), 'Etude')
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

export function packsDir(root) {
  return join(factoryRoot(root), 'packs')
}

export function stagingDir(root, jobId) {
  return join(root, 'staging', jobId)
}

/** Etude 自己的目录，只在安装那一步用。 */
export function etudeAudioDir(root) {
  return join(root, 'audio')
}

export function etudeImagesDir(root) {
  return join(root, 'images')
}

export function etudeDbPath(root) {
  return join(root, 'etude.sqlite3')
}
