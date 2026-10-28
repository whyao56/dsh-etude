import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * 测试/自检用的配置与 ctx。
 *
 * 这些值和 `index.js` 里 `normalizeConfig()` 的输出保持同一个形状 ——
 * 库代码只认这个形状，不认 schemastery。改 `index.js` 的字段时记得同步这里，
 * 不然测试会静默地测一个不存在的配置。
 */
export function makeConfig(overrides = {}) {
  const base = {
    dataDir: '',
    language: 'en',
    examplesPerLesson: 8,
    zhVariants: 3,
    provider: '',
    model: '',
    llmBaseUrl: '',
    llmApiKeyEnv: '',
    llmModel: '',
    candidateLimit: 6,
    autoPrepareCandidates: false,
    pixelCheck: true,
    ttsEngine: 'edge',
    rate: '+10%',
    volume: '+10%',
    ttsVoiceEdge: 'en-US-AriaNeural',
    ttsBaseUrl: '',
    ttsApiKeyEnv: '',
    ttsModel: '',
    ttsVoice: '',
    exportDir: '',
  }
  const merged = { ...base, ...overrides }
  Object.defineProperty(merged, 'url', { get: () => merged.ttsBaseUrl, enumerable: false })
  return merged
}

/** 只够让库代码跑起来的 ctx：没有 llm、没有凭据。 */
export function makeCtx(overrides = {}) {
  const services = {
    credentials: { resolve: async () => '' },
    ...overrides,
  }
  return {
    get: (name) => services[name],
    logger: { debug() {}, info() {}, warn() {}, error() {} },
  }
}

/** 建一个临时数据目录，跑完记得 `cleanup()`。 */
export async function makeTempRoot(prefix = 'dsh-etude-test-') {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  return {
    root: dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}
