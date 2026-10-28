import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { getPack, markExported } from './packs.js'
import { defaultExportDir } from './paths.js'
import { FactoryError, normalizeSpace } from './util.js'

/**
 * 把打好的成品包搬到用户能拿去用的地方。
 *
 * 这一步**只做拷贝**：源目录是 `factory/packs/<id>/`，目标目录是
 * `exportDir/<slug>-<id>/`，两边都是同一个 v2 卡片包结构（manifest.json +
 * images/ + audio/）。拷完不删源，也不改源 —— 导出失败不会毁掉工厂里那份。
 *
 * 为什么不打包成 zip：包里本来就是照片和 mp3，压缩率极低，而 zip 之后
 * 人就没法用系统看图工具一张张验证了。这个包的卖点恰恰是「每张图都有人
 * 点过头」，让人能直接翻，比省那几个字节重要。
 */

/** `run out of` → `run-out-of`；留给目录名，别塞奇怪字符进去。 */
export function slugify(text) {
  const slug = normalizeSpace(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')
  return slug || 'pack'
}

export async function exportPack({ root, packId, exportDir, signal, onProgress } = {}) {
  const pack = await getPack(root, packId)
  if (!pack.pack?.dir) throw new FactoryError('这个包还没打包，先打包再导出。', 'not-packed')
  if (signal?.aborted) throw new FactoryError('取消了。', 'aborted')

  const target = join(normalizeSpace(exportDir) || defaultExportDir(), `${slugify(pack.lesson?.target ?? pack.target)}-${pack.id}`)
  onProgress?.(`正在拷到 ${target}`)
  await mkdir(target, { recursive: true })
  await cp(pack.pack.dir, target, { recursive: true, force: true })
  if (signal?.aborted) throw new FactoryError('取消了。', 'aborted')

  let files = 0
  let bytes = 0
  const count = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await count(path)
      else {
        files += 1
        bytes += (await stat(path)).size
      }
    }
  }
  await count(target)

  onProgress?.(`导出完成：${files} 个文件`)
  const result = {
    dir: target,
    files,
    bytes,
    // 原样留给界面：让用户能一眼看出「导出的是哪一份」
    sourceDir: pack.pack.dir,
    manifestPath: join(target, 'manifest.json'),
  }
  // 记账放在这里而不是调用方：不管是从界面、RPC 还是自检脚本导出，
  // 账本都得知道「这个包导出到哪了」，否则状态页会说它还没导出。
  await markExported(root, packId, result)
  return result
}
