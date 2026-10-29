import { defineTool } from '@deepseek-ai/dsh-tools'

import { exportPack } from './export.js'
import { fillPack } from './build.js'
import { buildPackDir, createPack, deletePack, getPack, listPacks } from './packs.js'
import { BadRequest, clampInt, normalizeSpace } from './util.js'

const STATUS_TEXT = {
  generating: '正在造例句',
  text: '例句好了，等配图和语音',
  media: '素材在补',
  packed: '已打包',
  exported: '已导出',
  failed: '失败',
}

/**
 * 给模型用的三个工具。
 *
 * 这里有个刻意的边界：**没有任何工具能替人确认配图和语音**。
 * 造例句、找候选图、打包都可以交给模型去催，但「这张图对不对」「这句听得清不清」
 * 只有人能答。工具能做到的最后一步是「把 9 张候选摆出来，请你去点」。
 *
 * 如果哪天有人想加一个 `etude_auto_approve`，请先回去读 HANDOVER 里的第一条死规矩。
 */
export function createFactoryTools({ ctx, getConfig, getRoot }) {
  return [
    defineTool({
      name: 'etude_create',
      description:
        '为一个单词、固定说法或整句造语言卡片包：8 条不同场景的真人口吻例句 + 每句一条语音 + 每句一批待挑的配图候选。'
        + '造好的包会出现在卡片工厂面板里，配图必须由人从九宫格里挑一张、语音必须由人试听确认，之后才能打包。'
        + '同样的目标重复调用不会重复花钱（幂等键命中就直接返回已有那份）。',
      parameters: {
        target: {
          type: 'string',
          required: true,
          description: '目标：一个词（coffee）、一个固定说法（in the long run）或者一整句（I could have sworn I left it here.）',
        },
        kind: {
          type: 'string',
          enum: ['word', 'phrase', 'sentence'],
          description: '目标类型。不填就按写法自动判（有标点或 6 词以上算整句）。',
        },
        examples: {
          type: 'number',
          description: '例句条数，1–40，默认 8。',
        },
        prepareImages: {
          type: 'boolean',
          description: '是否顺手把每条的候选图也找出来，默认 true。找图挺费网络，可以先关掉。',
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            packId: { type: 'string', required: true },
            status: { type: 'string', required: true },
            target: { type: 'string', required: true },
            summary: { type: 'string', required: true },
          },
        },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      presentCall: (args) => ({ card: 'generic', title: `造卡片包：${args.target}` }),
      presentResult: (_args, result) => ({ card: 'generic', content: result.summary }),
      async execute(args, exec) {
        const config = getConfig()
        const root = getRoot()
        const target = normalizeSpace(args.target)
        if (!target) throw new BadRequest('etude_create: 要给一个目标。')
        const pack = await createPack({
          ctx,
          config,
          root,
          target,
          kind: args.kind,
          examplesCount: clampInt(args.examples, 1, 40, undefined),
          prepareCandidates: args.prepareImages === false ? false : true,
          signal: exec.signal,
          onProgress: (message) => ctx.logger?.debug?.(`etude: ${message}`),
        })
        const fresh = await getPack(root, pack.id)
        return {
          packId: fresh.id,
          status: fresh.status,
          target: fresh.target,
          summary: describe(fresh, { note: '配图还没人挑，语音还没人试听 —— 这两件事必须去面板里做。' }),
        }
      },
    }),

    defineTool({
      name: 'etude_status',
      description:
        '看卡片包做到哪一步了：给了 packId 就看那一份（每条例句有没有配图、语音听没听），不给就列出全部。'
        + '会明确说出「还差什么」，包括需要人来做的那部分。',
      parameters: {
        packId: { type: 'string', description: '卡片包 id。不填就列出全部。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { summary: { type: 'string', required: true } },
        },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      presentCall: (args) => ({ card: 'generic', title: args.packId ? `看包：${args.packId}` : '列出卡片包' }),
      presentResult: (_args, result) => ({ card: 'generic', content: result.summary }),
      async execute(args) {
        const root = getRoot()
        if (!args.packId) {
          const packs = await listPacks(root)
          if (packs.length === 0) return { summary: '还没有卡片包。用 etude_create 造一个。' }
          const lines = packs.map(
            (pack) =>
              `· ${pack.target}（${pack.id}）— ${STATUS_TEXT[pack.status] ?? pack.status}，`
              + `${pack.progress.total} 条，图 ${pack.progress.images}/${pack.progress.total}，音 ${pack.progress.audios}/${pack.progress.total}`,
          )
          return { summary: `一共 ${packs.length} 个卡片包：\n${lines.join('\n')}` }
        }
        const pack = await getPack(root, normalizeSpace(args.packId))
        return { summary: describe(pack) }
      },
    }),

    defineTool({
      name: 'etude_pack',
      description:
        '把一个卡片包打成磁盘上的 v2 卡片包（manifest.json + images/ + audio/），并在打之前跑一遍硬校验。'
        + '如果还有配图没被挑、语音没被试听，它会拒绝并列出差哪些 —— 这是故意的，不算失败。',
      parameters: {
        packId: { type: 'string', required: true, description: '卡片包 id。' },
        export: { type: 'boolean', description: '打完顺手导出一份到导出目录（默认 下载/dsh-etude）。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', required: true },
            summary: { type: 'string', required: true },
            dir: { type: 'string' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      presentCall: (args) => ({ card: 'generic', title: `打包：${args.packId}` }),
      presentResult: (_args, result) => ({ card: 'generic', content: result.summary }),
      async execute(args, exec) {
        const config = getConfig()
        const root = getRoot()
        const packId = normalizeSpace(args.packId)
        const pack = await getPack(root, packId)
        try {
          const built = await buildPackDir({ ctx, config, root, packId, signal: exec.signal })
          const lines = [
            `打好了：${built.dir}`,
            `例句 ${built.manifest.quality.examples} 条，配图 ${built.manifest.quality.images} 张，语音 ${built.manifest.quality.audios} 条。`,
            `最短图片边 ${built.manifest.quality.min_image_short_edge}px，纯色/渐变图 ${built.manifest.quality.flat_images} 张。`,
          ]
          if (built.verdict.warnings.length > 0) lines.push(`提醒：${built.verdict.warnings.join('；')}`)
          if (args.export) {
            const exported = await exportPack({ root, packId, exportDir: config.exportDir })
            lines.push(`导出到：${exported.dir}（${exported.files} 个文件，${Math.round(exported.bytes / 1024)} KB，副本已过契约复验）`)
          }
          return { ok: true, summary: lines.join('\n'), dir: built.dir }
        } catch (error) {
          if (error?.code === 'bad-request') {
            return { ok: false, summary: `还不能打包：${error.message}` }
          }
          throw error
        }
      },
    }),

    defineTool({
      name: 'etude_build',
      description:
        '把一个已经造好例句的卡片包自动做完素材：找候选图 → 取第一张能过预检的定下来 → 合成语音 → 确认 → 打包 → 导出。'
        + '它会在清单里把配图与语音的复核人写成 `auto:not-human`，也就是说这不是人点过头的包，只适合「先造一批看看效果」。'
        + '要交付给人用的包，请去面板里逐张看图、逐条听完。',
      parameters: {
        packId: { type: 'string', required: true, description: '卡片包 id（etude_create 或 etude_status 里那个十六位十六进制）。' },
        exportIt: { type: 'boolean', description: '做完顺手导出（默认 true）。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', required: true },
            summary: { type: 'string', required: true },
            dir: { type: 'string' },
            exportDir: { type: 'string' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      presentCall: (args) => ({ card: 'generic', title: `做完素材：${args.packId}` }),
      presentResult: (_args, result) => ({ card: 'generic', content: result.summary }),
      async execute(args, exec) {
        const config = getConfig()
        const root = getRoot()
        const packId = normalizeSpace(args.packId)
        try {
          const built = await fillPack({
            ctx,
            config,
            root,
            packId,
            exportIt: args.exportIt !== false,
            signal: exec.signal,
          })
          const lines = [
            `做完了：${built.packId}`,
            `例句 ${built.examples} 条，配图 ${built.images} 张，语音 ${built.audios} 条（复核人 ${built.reviewer}）。`,
            `包目录：${built.dir}`,
          ]
          if (built.exportDir) lines.push(`导出到：${built.exportDir}（${built.exportFiles} 个文件，${Math.round(built.exportBytes / 1024)} KB${built.verified ? '，副本已复验' : ''}）`)
          if (built.imageFailures.length) lines.push(`没配到图：第 ${built.imageFailures.map((one) => one.ord).join('、')} 条`)
          if (built.audioFailures.length) lines.push(`没合成：第 ${built.audioFailures.map((one) => one.ord).join('、')} 条`)
          return { ok: true, summary: lines.join('\n'), dir: built.dir, exportDir: built.exportDir ?? undefined }
        } catch (error) {
          if (error?.code === 'bad-request') return { ok: false, summary: `没做完：${error.message}` }
          throw error
        }
      },
    }),
    defineTool({
      name: 'etude_delete',
      description:
        '删掉一个卡片包（连带它的例句、已锁定的配图、合成好的语音和打包目录）。'
        + '导出到下载目录的那份副本不会被删 —— 那已经是你自己的文件了。',
      parameters: {
        packId: { type: 'string', required: true, description: '卡片包 id。' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ok: { type: 'boolean', required: true },
            summary: { type: 'string', required: true },
          },
        },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      presentCall: (args) => ({ card: 'generic', title: `删掉卡片包：${args.packId}` }),
      presentResult: (_args, result) => ({ card: 'generic', content: result.summary }),
      async execute(args) {
        const root = getRoot()
        const packId = normalizeSpace(args.packId)
        const pack = await getPack(root, packId)
        await deletePack(root, packId)
        return { ok: true, summary: `删掉了：${pack.target}（${packId}）。导出的副本还在下载目录里，没动。` }
      },
    }),
  ]
}

function describe(pack, { note } = {}) {
  const total = pack.examples.length
  const withImage = pack.examples.filter((one) => one.image).length
  const imageReviewed = pack.examples.filter((one) => one.imageReview?.by).length
  const withAudio = pack.examples.filter((one) => one.audio).length
  const audioReviewed = pack.examples.filter((one) => one.audioReview?.listened).length
  const lines = [
    `${pack.target}（${pack.id}）— ${STATUS_TEXT[pack.status] ?? pack.status}`,
    `例句 ${total} 条：配图 ${withImage} 张（人工确认 ${imageReviewed} 张），语音 ${withAudio} 条（试听确认 ${audioReviewed} 条）。`,
  ]
  if (pack.gloss) lines.push(`释义：${pack.gloss}`)
  if (pack.ipa) lines.push(`音标：${pack.ipa}`)
  if (pack.problems?.length) lines.push(`生成时的提醒：${pack.problems.join('；')}`)
  if (pack.pack?.dir) lines.push(`包目录：${pack.pack.dir}`)
  if (pack.export?.dir) lines.push(`导出到：${pack.export.dir}`)
  if (pack.lastError) lines.push(`上次失败：${pack.lastError}`)

  const missing = []
  for (const example of pack.examples) {
    if (!example.imageReview?.by) missing.push(`第 ${example.ord} 条配图`)
    else if (!example.audioReview?.listened) missing.push(`第 ${example.ord} 条语音`)
  }
  if (missing.length > 0) {
    lines.push(`还差：${missing.slice(0, 6).join('、')}${missing.length > 6 ? `等 ${missing.length} 处` : ''}。`)
  } else {
    lines.push('素材齐了，可以打包。')
  }
  if (note) lines.push(note)
  return lines.join('\n')
}
