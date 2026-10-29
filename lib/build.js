/**
 * 把一包做到能交付：找候选图 → 定图 → 合成语音 → 试听确认 → 打包 → 导出。
 *
 * 为什么单独放一个模块：界面里这六步是六次点击，人点当然应该人点。
 * 但「先造二十张看看效果」这种批量演示，如果也只能一下一下点，就没人愿意看效果了。
 *
 * 这里的定图与「试听确认」是**机器代做**的，所以 review.by 一律写 `auto:not-human`，
 * 清单里能一眼看出来这不是人点过头的。要交付真包，还是去面板里逐张看过。
 */

import { exportPack } from './export.js'
import { buildPackDir, confirmAudio, getPack, pickCandidate, prepareCandidatesFor, synthesizeExample } from './packs.js'
import { throwIfAborted } from './util.js'

export const AUTO_REVIEWER = 'auto:not-human'

/**
 * @param {object} options
 * @param {object} options.ctx
 * @param {object} options.config
 * @param {string} options.root
 * @param {string} options.packId
 * @param {boolean} [options.exportIt]  打完顺手导出
 * @param {number} [options.candidateLimit] 每条最多留几张候选
 * @param {(message: string) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 */
export async function fillPack({ ctx, config, root, packId, exportIt = true, onProgress, signal }) {
  const started = await getPack(root, packId)
  const total = started.examples.length
  throwIfAborted(signal)

  // 一、找候选图。已有图的条目跳过 —— 人挑过的不要冲掉。
  const needCandidates = started.examples.filter((one) => !one.image && (one.imageCandidates?.length ?? 0) === 0)
  const avoid = new Set(started.examples.map((one) => one.image?.sha256).filter(Boolean))
  let done = 0
  for (const example of needCandidates) {
    throwIfAborted(signal)
    onProgress?.(`找候选图 ${done + 1}/${needCandidates.length}（第 ${example.ord} 条）……`)
    try {
      await prepareCandidatesFor(root, packId, example.ord, { config, signal, avoid })
    } catch (error) {
      if (signal?.aborted) throw error
      onProgress?.(`第 ${example.ord} 条找图失败：${error.message}`)
    }
    done += 1
  }

  // 二、定图。按候选顺序取第一张能过预检的。
  const afterCandidates = await getPack(root, packId)
  const imageFailures = []
  let picked = 0
  for (const example of afterCandidates.examples) {
    throwIfAborted(signal)
    if (example.image) continue
    const list = example.imageCandidates ?? []
    if (list.length === 0) {
      imageFailures.push({ ord: example.ord, reason: '一个候选都没有' })
      continue
    }
    let chosen = null
    for (const candidate of list) {
      try {
        await pickCandidate(root, packId, example.ord, candidate.stagedName, { by: AUTO_REVIEWER })
        chosen = candidate.stagedName
        break
      } catch (error) {
        if (signal?.aborted) throw error
        onProgress?.(`第 ${example.ord} 条这张不能用（${error.message}），换下一张。`)
      }
    }
    if (chosen) {
      picked += 1
      onProgress?.(`定图 ${picked}/${total}（第 ${example.ord} 条）`)
    } else {
      imageFailures.push({ ord: example.ord, reason: '候选全都过不了预检' })
    }
  }

  // 三、合成语音并确认。合成成功不等于能听，但这里没人能听 —— 所以标注 auto。
  const afterImages = await getPack(root, packId)
  const audioFailures = []
  let voiced = 0
  for (const example of afterImages.examples) {
    throwIfAborted(signal)
    if (!example.audio) {
      try {
        await synthesizeExample({ ctx, config, root, packId, ord: example.ord, signal })
      } catch (error) {
        if (signal?.aborted) throw error
        audioFailures.push({ ord: example.ord, reason: error.message })
        onProgress?.(`第 ${example.ord} 条合成失败：${error.message}`)
        continue
      }
    }
    try {
      await confirmAudio(root, packId, example.ord, { by: AUTO_REVIEWER })
      voiced += 1
      onProgress?.(`合成语音 ${voiced}/${total}（第 ${example.ord} 条）`)
    } catch (error) {
      if (signal?.aborted) throw error
      audioFailures.push({ ord: example.ord, reason: error.message })
    }
  }

  // 四、打包（会自己查缺件、自己复验清单）。
  onProgress?.('打包……')
  const packed = await buildPackDir({ ctx, config, root, packId, signal })

  // 五、导出（拷贝 + 副本复验）。
  let exported = null
  if (exportIt) {
    onProgress?.('导出……')
    exported = await exportPack({ root, packId, exportDir: config.exportDir, signal, onProgress })
  }

  const pack = await getPack(root, packId)
  return {
    packId,
    examples: pack.examples.length,
    images: pack.examples.filter((one) => one.image).length,
    audios: pack.examples.filter((one) => one.audio && one.audioReview?.listened).length,
    dir: packed.dir,
    exportDir: exported?.dir ?? null,
    exportFiles: exported?.files ?? 0,
    exportBytes: exported?.bytes ?? 0,
    verified: exported?.verified === true,
    reviewer: AUTO_REVIEWER,
    imageFailures,
    audioFailures,
  }
}
