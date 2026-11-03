import { mkdtemp, rm, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

import { deleteRecord, readRecord, recordStats, saveRecord } from '../lib/record.js'
import { recordDir } from '../lib/record.js'
import { readLibrary, update, writeLibrary, emptyLibrary } from '../lib/store.js'

const PACK = 'p0123456789abcdef'

async function withPack(fn) {
  const root = await mkdtemp(join(tmpdir(), 'etude-record-'))
  try {
    const library = emptyLibrary()
    library.packs[PACK] = {
      id: PACK,
      target: 'abandon',
      kind: 'word',
      status: 'text',
      createdAt: 1,
      examples: [
        { ord: 1, sentence: 'The crew abandoned ship.', image: null, audio: null },
        { ord: 2, sentence: 'Do not abandon hope.', image: null, audio: null },
      ],
    }
    library.order = [PACK]
    await writeLibrary(root, library)
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const bytes = Buffer.from('RIFF0000WAVEfmt fake-but-nonempty')

test('存一段录音：落盘、挂到例句上、能读回来', async () => {
  await withPack(async (root) => {
    const saved = await saveRecord(root, {
      packId: PACK,
      ord: 1,
      base64: bytes.toString('base64'),
      mime: 'audio/webm;codecs=opus',
      durationMs: 1500,
    })
    assert.equal(saved.bytes, bytes.length)
    assert.equal(saved.mime, 'audio/webm')
    assert.equal(saved.durationMs, 1500)
    assert.ok(saved.file.endsWith('.webm'))

    const onDisk = await readFile(join(recordDir(root), saved.file))
    assert.equal(onDisk.toString(), bytes.toString())

    const library = await readLibrary(root)
    assert.deepEqual(library.packs[PACK].examples[0].record, saved)
    assert.equal(library.packs[PACK].examples[1].record, undefined)

    const back = await readRecord(root, PACK, 1)
    assert.equal(Buffer.from(back.base64, 'base64').toString(), bytes.toString())
    assert.equal(back.mime, 'audio/webm')
  })
})

test('重录会覆盖：旧的音频文件被删掉，只留最新的那份', async () => {
  await withPack(async (root) => {
    const first = await saveRecord(root, { packId: PACK, ord: 1, base64: bytes.toString('base64'), mime: 'audio/webm' })
    const second = await saveRecord(root, {
      packId: PACK,
      ord: 1,
      base64: Buffer.concat([bytes, Buffer.from('second')]).toString('base64'),
      mime: 'audio/webm',
    })
    assert.notEqual(first.file, second.file)
    let gone = false
    try {
      await access(join(recordDir(root), first.file))
    } catch {
      gone = true
    }
    assert.ok(gone, '旧文件应该被删掉')

    const library = await readLibrary(root)
    assert.equal(library.packs[PACK].examples[0].record.file, second.file)
  })
})

test('删掉录音之后读不到', async () => {
  await withPack(async (root) => {
    await saveRecord(root, { packId: PACK, ord: 2, base64: bytes.toString('base64'), mime: 'audio/wav' })
    const stats = await recordStats(root)
    assert.equal(stats.count, 1)

    const result = await deleteRecord(root, PACK, 2)
    assert.equal(result.deleted, true)
    const library = await readLibrary(root)
    assert.equal(library.packs[PACK].examples[1].record, null)
    await assert.rejects(() => readRecord(root, PACK, 2), /还没有录音/)
  })
})

test('乱七八糟的输入都被拦住', async () => {
  await withPack(async (root) => {
    await assert.rejects(
      () => saveRecord(root, { packId: PACK, ord: 1, base64: bytes.toString('base64'), mime: 'audio/mp4' }),
      /不认这种录音格式/,
    )
    await assert.rejects(() => saveRecord(root, { packId: PACK, ord: 1, base64: '', mime: 'audio/webm' }), /空的/)
    await assert.rejects(() => saveRecord(root, { packId: PACK, ord: 9, base64: bytes.toString('base64'), mime: 'audio/webm' }), /不存在/)
    await assert.rejects(() => saveRecord(root, { packId: 'nope', ord: 1, base64: bytes.toString('base64'), mime: 'audio/webm' }), /找不到卡片包/)
    await assert.rejects(() => saveRecord(root, { packId: PACK, ord: 0, base64: 'x', mime: 'audio/webm' }), /ord/)
  })
})
