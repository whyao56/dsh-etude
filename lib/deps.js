/**
 * 可选依赖的解析。
 *
 * 为什么需要这个文件：插件是 `pnpm link` 进 profile 的，`node_modules/dsh-etude`
 * 是一个指回工作区的软链接。Node 的 ESM 加载器默认按 **realpath** 解析，
 * 于是 `import('sharp')` 会从 `F:\dsharness\dsh-etude` 开始往上找 ——
 * 那里没有 node_modules，直接 ERR_MODULE_NOT_FOUND。可 profile 的顶层
 * `node_modules` 里明明装着 sharp 和 ws（DSH 自己带进来的）。
 *
 * 所以先按正常方式找，找不到再拿 `DSH_PROFILE_DIR` 建一个 require
 * 从 profile 那一层找。两个都找不到就返回 null —— 调用方各自决定
 * 是降级（sharp 关掉像素体检）还是报错（ws 没有就没法走 Edge）。
 */
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 从哪几个目录试着 require。 */
export function dependencyDirs() {
  const dirs = []
  const push = (value) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (text !== '' && !dirs.includes(text)) dirs.push(text)
  }
  // 1) 插件自己的包目录：`npm install` 装过就有（开发机、或用户自己装过）
  try {
    push(fileURLToPath(new URL('..', import.meta.url)))
  } catch {
    // 理论上不会失败，失败了就跳过这一档
  }
  // 2) 当前 profile：bundle 安装时 pnpm 把依赖装在那一层
  push(process.env.DSH_PROFILE_DIR)
  const home = process.env.DSH_HOME?.trim()
  const profile = process.env.DSH_PROFILE?.trim()
  if (home && profile) push(join(home, 'profiles', profile))
  if (home) push(home)
  return dirs
}

const cache = new Map()

/**
 * 加载一个可选依赖，拿不到返回 null。
 * 返回值统一成「模块本身」：`loadOptional('sharp')` 给你 sharp 函数，
 * `loadOptional('ws')` 给你 WebSocket 类（ws 的 module.exports 就是那个类）。
 */
export function loadOptional(name) {
  if (cache.has(name)) return cache.get(name)
  let resolved = null
  try {
    // createRequire 只要求路径是绝对的，文件本身不用存在。
    for (const dir of dependencyDirs()) {
      try {
        const require = createRequire(join(dir, 'dsh-etude-deps.cjs'))
        resolved = require(name)
        break
      } catch {
        // 这个目录里没有，换下一个
      }
    }
  } catch {
    resolved = null
  }
  cache.set(name, resolved)
  return resolved
}

/** 给自检用：哪些可选依赖真的能用。 */
export function dependencyReport() {
  const sharp = loadOptional('sharp')
  const ws = loadOptional('ws')
  return {
    sharp: typeof sharp === 'function',
    ws: typeof ws === 'function' || typeof ws?.WebSocket === 'function',
    dirs: dependencyDirs(),
  }
}
