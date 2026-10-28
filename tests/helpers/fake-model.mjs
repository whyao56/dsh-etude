import { createServer } from 'node:http'

/**
 * 一个假的 OpenAI 兼容模型，只服务于自检和测试。
 *
 * 为什么要有它：真正的模型只在宿主进程里（`ctx.get('llm')`），本机脚本拿不到。
 * 而「造例句 → 校验 → 找图 → 合成 → 打包」这条链上，除了模型本身，
 * 别的每一步都值得跑一遍。所以这里用一个 HTTP 端点把模型位置占住，
 * 让整条链路能离线跑通。
 *
 * 它返回的内容是模板拼出来的，**语言质量不代表真实效果** ——
 * 它只保证格式、字段、场景互不相同这些结构要求，好让下游校验器有东西可验。
 */
const SCENES = [
  ['Office, Monday morning, before the standup begins.', '周一早上，站会开始前，同事在茶水间碰见你。'],
  ['A rainy afternoon, standing in a doorway waiting it out.', '下雨的午后，你站在门口等雨停。'],
  ['A friend comes over and looks around your messy kitchen.', '朋友来家里，看见你厨房有点乱。'],
  ['Late at night, the last bus, everyone half asleep.', '深夜末班车上，一车人都快睡着了。'],
  ['A job interview, two minutes before you sit down.', '面试开始前两分钟，你在门口等着。'],
  ['Walking the dog in the park, meeting the same neighbour again.', '遛狗时在公园又遇见同一位邻居。'],
  ['A family dinner where someone brings up an old story.', '家庭聚餐上，有人翻出一件旧事。'],
  ['A queue at the pharmacy, the person behind you sighs.', '药店排队，后面的人叹了口气。'],
  ['On the phone with a friend who just moved to another city.', '跟刚搬到另一座城市的朋友通电话。'],
  ['The gym at seven in the evening, every machine taken.', '晚上七点的健身房，器械全被占了。'],
  ['A quiet library, someone whispers your name.', '安静的图书馆，有人小声叫你。'],
  ['Packing a suitcase the night before a flight.', '起飞前一晚在收拾行李箱。'],
]

const SENTENCE_TEMPLATES = [
  'I really need my {t} before this meeting.',
  'Do you know where the {t} went?',
  'There is never enough {t} in this house.',
  'I keep forgetting to buy {t} on the way home.',
  'She said the {t} would be ready by noon.',
  'We ran out of {t} again last night.',
  'Honestly, {t} is the only reason I came.',
  'Give me five minutes and I will bring the {t}.',
  'Nobody told me you had {t} here already.',
  'I would trade my whole weekend for {t} right now.',
  'The {t} tastes different when someone else makes it.',
  'He laughed and said {t} fixes everything.',
]

const REGISTERS = ['日常口语', '日常口语', '日常口语', '正式', '书面', '俚语']

function payloadFor(target, count) {
  const t = String(target ?? 'coffee').trim() || 'coffee'
  const examples = []
  for (let i = 0; i < count; i += 1) {
    const template = SENTENCE_TEMPLATES[i % SENTENCE_TEMPLATES.length]
    const [sceneEn, sceneZh] = SCENES[i % SCENES.length]
    // 第 i 条换成第 (i+1) 条模板的措辞，避免句句一个样
    const sentence = template.replace(/\{t\}/g, t)
    examples.push({
      sentence,
      scene_en: sceneEn,
      scene_zh: sceneZh,
      zh_variants: [
        `就这一句，场合是：${sceneZh.slice(0, 18)}`,
        `这句话出现在这种时候 —— ${sceneZh.slice(0, 24)}`,
        `说这句的场合：${sceneZh.slice(0, 14)}`,
      ],
      register: REGISTERS[i % REGISTERS.length],
      voice_hint: i % 3 === 0 ? 'flat, tired, slow' : i % 3 === 1 ? 'warm and quick' : 'excited, sharp',
      image_query: photoQuery(t),
    })
  }
  return {
    kind: t.includes(' ') && !/[.!?]$/.test(t) ? 'phrase' : 'word',
    ipa: `/${t.toLowerCase().replace(/[^a-z ]/g, '')}/`,
    gloss: 'A stand-in gloss written in plain English for the self-test.',
    note: '假模型生成，只用来跑通链路。',
    examples,
    swaps: [
      { role: 'subject', original: 'I', candidates: ['she', 'they'], samples: ['I need it.', 'She needs it.'] },
      { role: 'object', original: t, candidates: [`the ${t}`], samples: [`I brought ${t}.`] },
    ],
  }
}

function photoQuery(target) {
  const map = {
    coffee: 'coffee cup table',
    tea: 'tea cup',
    umbrella: 'umbrella street rain',
    wallet: 'wallet pocket',
  }
  return map[String(target).toLowerCase()] ?? `${String(target).split(/\s+/)[0]} object table`
}

/**
 * @param {{ port?: number, faults?: boolean }} options
 * @returns {Promise<{ url: string, port: number, close: () => Promise<void> }>}
 */
export async function startFakeModel({ port = 0, faults = true } = {}) {
  const server = createServer((req, res) => {
    const send = (status, body) => {
      const text = typeof body === 'string' ? body : JSON.stringify(body)
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
      res.end(text)
    }

    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true })
    if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) {
      return send(404, { error: { message: 'not found' } })
    }

    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      let body
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      } catch {
        return send(400, { error: { message: 'bad json' } })
      }

      const model = String(body.model ?? '')
      const messages = Array.isArray(body.messages) ? body.messages : []
      const system = messages.find((one) => one.role === 'system')?.content ?? ''
      const user = messages.find((one) => one.role === 'user')?.content ?? ''
      const text = typeof user === 'string' ? user : JSON.stringify(user)

      if (faults) {
        if (model.includes('fault-401')) return send(401, { error: { message: 'invalid api key' } })
        if (model.includes('fault-429')) return send(429, { error: { message: 'rate limited' } })
        if (model.includes('fault-500')) return send(500, { error: { message: 'upstream boom' } })
        if (model.includes('fault-empty')) {
          return send(200, { choices: [{ message: { content: '' } }] })
        }
        if (model.includes('fault-notjson')) {
          return send(200, { choices: [{ message: { content: '好的，但我不打算给 JSON。' } }] })
        }
      }

      const target = extractTarget(text)
      const count = extractCount(text) ?? 8
      const payload = payloadFor(target, count)
      const content = model.includes('fault-fenced')
        ? '好的，这是结果：\n```json\n' + JSON.stringify(payload, null, 0) + '\n```\n希望有帮助！'
        : JSON.stringify(payload, null, 0)
      send(200, { choices: [{ message: { content } }] })
    })
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  const actualPort = server.address().port
  return {
    port: actualPort,
    url: `http://127.0.0.1:${actualPort}/v1`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

function extractTarget(text) {
  const marked = text.match(/TARGET (?:WORD|PHRASE|SENTENCE):\s*(.+)/i)
  if (marked) return marked[1].trim().replace(/^[「"'“]|[」"'”]$/g, '')
  const quoted = text.match(/[「"“]([^」"”]{2,60})[」"”]/)
  if (quoted) return quoted[1].trim()
  return 'coffee'
}

function extractCount(text) {
  const match = text.match(/exactly (\d+) examples/i) ?? text.match(/(\d+) (?:条)?examples/i)
  if (!match) return null
  const value = Number.parseInt(match[1], 10)
  return Number.isFinite(value) ? Math.min(40, Math.max(1, value)) : null
}
