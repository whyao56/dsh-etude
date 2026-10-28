/**
 * dsh-etude — Host half.
 *
 * 卡片工厂：目标 → 8 条场景例句 → 每句一张要人点头的配图 + 一条要人试听的语音
 * → v2 卡片包（落在自己的目录里，可以整个搬走）。
 *
 * 三件事都不在模型手里，写在这里提醒后来的人别把它们做丢了：
 *   1. 配图必须有人从候选里挑一张（`imageReview.by` 是硬校验项）；
 *   2. 语音必须有人按下试听并且听到（`audioReview.listened` 是硬校验项）；
 *   3. 同样的目标不重复花钱（幂等键命中就复用账本里那份）。
 *
 * 宿主这半只做四件事：注册工具、开一条 loopback RPC 给界面、给 `webServer`
 * 挂媒体路由（图/音频走 <img>/<audio>，不走 base64）、往系统提示词里加一段说明。
 *
 * **这个插件不依赖任何外部应用。** 账本、素材、成品包全在 `dataDir` 那棵树里，
 * 成品包是标准的 v2 卡片包目录，谁想读都能读。
 */
import z from '@deepseek-ai/schemastery'

import { registerMediaRoutes } from './lib/http-server.js'
import { createJobRunner } from './lib/jobs.js'
import { setProxyUrl } from './lib/net.js'
import { dataRoot } from './lib/paths.js'
import { createRpcHandler } from './lib/rpc.js'
import { createFactoryTools } from './lib/tools.js'
import { clampInt, normalizeSpace } from './lib/util.js'

export const name = 'dsh-etude'

export const inject = ['tools']

export const version = '0.1.0'

export const RPC_CHANNEL = '/etude'

/** 插件配置在 loader 里的条目 id，客户端要拿它去找 configForms。 */
export const CONFIG_NS = 'etude'

const maybeVolatile = (schema) => (schema && typeof schema.volatile === 'function' ? schema.volatile() : schema)

/**
 * DSH >= 0.1.6 把 volatile 字段热提交成引用，读的时候要 `.get()`。
 * 老运行时里它就是普通值 —— 两种都得认，否则升级一次插件就哑了。
 */
function unwrapVolatile(value) {
  if (value && typeof value === 'object' && typeof value.get === 'function') {
    try {
      return value.get()
    } catch {
      return undefined
    }
  }
  return value
}

export const Config = z.object({
  dataDir: maybeVolatile(z.string().default('')).description('数据目录。留空就是 %LOCALAPPDATA%\\dsh-etude。账本、素材、成品包都在这里。'),
  exportDir: maybeVolatile(z.string().default('')).description('导出成品包时往哪儿放。留空就是 %USERPROFILE%\\Downloads\\dsh-etude。'),
  language: maybeVolatile(z.string().default('en')).description('目标语言。目前只有 en 能生成。'),
  examplesPerLesson: maybeVolatile(z.number().default(8)).description('一个包几句，1–40。'),
  zhVariants: maybeVolatile(z.number().default(3)).description('每句给几种故意不一致的中文说法，2–4。'),
  provider: maybeVolatile(z.string().default('')).description('造例句用的 provider。留空就跟着当前会话的默认模型。'),
  model: maybeVolatile(z.string().default('')).description('造例句用的模型。留空就跟着当前会话的默认模型。'),
  llmBaseUrl: maybeVolatile(z.string().default('')).description('可选：OpenAI 兼容的模型端点（比如 http://127.0.0.1:18999/v1）。留空就用宿主的 llm 服务，这是正常情况。'),
  llmApiKeyEnv: maybeVolatile(z.string().default('OPENAI_API_KEY').role('credential-ref')).description('上面那个端点用的 key 存在哪个环境变量名下。'),
  llmModel: maybeVolatile(z.string().default('')).description('上面那个端点用的模型名。'),
  candidateLimit: maybeVolatile(z.number().default(9)).description('每条给几张候选图，3–12。'),
  autoPrepareCandidates: maybeVolatile(z.boolean().default(true)).description('造完例句顺手找候选图。'),
  pixelCheck: maybeVolatile(z.boolean().default(true)).description('用像素统计挡纯色块、渐变图和大色块海报。'),
  ttsEngine: maybeVolatile(z.string().default('auto')).description('auto / edge / openai。auto 表示有 OpenAI 兼容 TTS 就先用它，Edge 永远兜底。'),
  rate: maybeVolatile(z.string().default('+10%')).description('语速。Edge 用 +10% 这种写法，OpenAI 兼容接口会换成 speed=1.1。'),
  volume: maybeVolatile(z.string().default('+10%')).description('音量。只有 Edge 引擎支持，OpenAI 兼容接口没有这个参数。'),
  ttsVoiceEdge: maybeVolatile(z.string().default('en-US-AriaNeural')).description('Edge 音色短名。面板里有一份完整的音色表。'),
  ttsBaseUrl: maybeVolatile(z.string().default('')).description('OpenAI 兼容 TTS 的 base url，比如 http://127.0.0.1:8000/v1。留空就只用 Edge。'),
  ttsApiKeyEnv: maybeVolatile(z.string().default('OPENAI_API_KEY').role('credential-ref')).description('存 API key 的环境变量名。key 本身放在 DSH 的凭据里。'),
  ttsModel: maybeVolatile(z.string().default('tts-1')).description('TTS 模型名。'),
  ttsVoice: maybeVolatile(z.string().default('alloy')).description('OpenAI 兼容 TTS 的音色名。'),
  proxyUrl: maybeVolatile(z.string().default('')).description('联网用的代理，比如 http://127.0.0.1:7897。留空会自动读 HTTPS_PROXY 和系统代理设置。搜不到候选图时先看这里。'),
})

function normalizeConfig(raw) {
  const base = raw && typeof raw === 'object' ? raw : {}
  const pick = (key) => unwrapVolatile(base[key])
  const text = (key, fallback) => normalizeSpace(pick(key)) || fallback
  return {
    dataDir: normalizeSpace(pick('dataDir')),
    exportDir: normalizeSpace(pick('exportDir')),
    language: text('language', 'en'),
    examplesPerLesson: clampInt(pick('examplesPerLesson'), 1, 40, 8),
    zhVariants: clampInt(pick('zhVariants'), 2, 4, 3),
    provider: normalizeSpace(pick('provider')),
    model: normalizeSpace(pick('model')),
    llmBaseUrl: normalizeSpace(pick('llmBaseUrl')),
    llmApiKeyEnv: text('llmApiKeyEnv', 'OPENAI_API_KEY'),
    llmModel: normalizeSpace(pick('llmModel')),
    candidateLimit: clampInt(pick('candidateLimit'), 3, 12, 9),
    autoPrepareCandidates: pick('autoPrepareCandidates') !== false,
    pixelCheck: pick('pixelCheck') !== false,
    ttsEngine: text('ttsEngine', 'auto'),
    rate: text('rate', '+10%'),
    volume: text('volume', '+10%'),
    ttsVoiceEdge: text('ttsVoiceEdge', 'en-US-AriaNeural'),
    ttsBaseUrl: text('ttsBaseUrl', ''),
    ttsApiKeyEnv: text('ttsApiKeyEnv', 'OPENAI_API_KEY'),
    ttsModel: text('ttsModel', 'tts-1'),
    ttsVoice: text('ttsVoice', 'alloy'),
    /**
     * `url` 是 `tts-openai.js` 认的名字，`ttsBaseUrl` 是配置里的名字。
     * 两个都放上，是因为那两处代码是分别写的，谁也不该为对方改名。
     */
    get url() {
      return this.ttsBaseUrl
    },
    proxyUrl: normalizeSpace(pick('proxyUrl')),
  }
}

const SYSTEM_HINT = [
  '本机装了 dsh-etude 卡片工厂，可以给一个词/固定说法/整句造语言训练卡（例句 + 配图 + 语音 + 打包 + 导出）。',
  '相关工具：etude_create 造包、etude_status 看进度、etude_pack 打包/导出。',
  '重要：配图必须由人从候选里挑一张、语音必须由人试听确认，模型替不了这一步。',
  '所以「造好了」不等于「能用了」—— 用户还需要去卡片工厂面板里点图和听音频。汇报时要把这个说清楚，不要替用户宣布完成。',
].join('\n')

export function apply(ctx, config) {
  /**
   * 每次读配置都顺手同步一次代理设置（模块级状态）。
   * 好处是用户在面板里改完 `proxyUrl` 立刻生效，不用重启宿主。
   */
  const getConfig = () => {
    const value = normalizeConfig(config)
    setProxyUrl(value.proxyUrl)
    return value
  }
  const getRoot = () => dataRoot(getConfig().dataDir)
  const jobs = createJobRunner()

  getConfig()

  const handle = createRpcHandler({ ctx, getConfig, getRoot, jobs, version })

  ctx.inject(['connection'], (scoped) => {
    const connection = scoped.get('connection')
    if (connection?.rpc === undefined) return
    scoped.effect(
      () => connection.rpc.handle(RPC_CHANNEL, (endpoint, payload, signal) => handle(endpoint, payload, signal), {
        authority: 'loopback',
      }),
      'dsh-etude: /etude rpc channel',
    )
  })

  ctx.inject(['webServer'], (scoped) => {
    const webServer = scoped.get('webServer')
    if (webServer === undefined) return
    scoped.effect(() => registerMediaRoutes(webServer, { getRoot, getApiHandler: () => handle }), 'dsh-etude: media routes')
  })

  for (const tool of createFactoryTools({ ctx, getConfig, getRoot })) {
    ctx.effect(() => ctx.tools.register(tool), `dsh-etude: tool ${tool.name}`)
  }

  ctx.inject(['systemPrompt'], (promptCtx) => {
    const section = promptCtx.systemPrompt?.section?.({ name: 'tool:etude', order: 122, text: SYSTEM_HINT })
    if (typeof section === 'function') promptCtx.effect(section, 'dsh-etude: prompt section')
  })

  ctx.logger?.debug?.('dsh-etude: 工厂已启动')
}
