// 把 lib/prompts.js 里的提示词重新倒进 lib/prompts/*.txt。
//
// 这些 txt 不是为了运行时可读（运行时只用 JS 常量，零 fs 调用），
// 而是为了让「提示词长什么样」在仓库里可 diff、可审阅，
// 并且让 tests/prompts.test.js 能逐字节核对两边没有走偏。
//
// 用法：node scripts/dump-prompts.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SYSTEM, buildMessages } from '../lib/prompts.js'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'lib', 'prompts')

const files = {
  'system.en.txt': SYSTEM,
  'user.word.en.txt': buildMessages({ target: '__TARGET__', kind: 'word', examples: 8, zhVariants: 3 }).user,
  'user.phrase.en.txt': buildMessages({ target: '__TARGET__', kind: 'phrase', examples: 8, zhVariants: 3 }).user,
  'user.sentence.en.txt': buildMessages({ target: '__TARGET__', kind: 'sentence', examples: 8, zhVariants: 3 }).user,
}

await mkdir(out, { recursive: true })

for (const [name, body] of Object.entries(files)) {
  const path = join(out, name)
  let previous = ''
  try {
    previous = await readFile(path, 'utf8')
  } catch {
    previous = ''
  }
  const next = body.endsWith('\n') ? body : `${body}\n`
  if (previous === next) {
    console.log(`unchanged  ${name}`)
    continue
  }
  await writeFile(path, next, 'utf8')
  console.log(`written    ${name}  (${next.length} chars)`)
}
