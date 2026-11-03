// 涓存椂锛氭妸閫傞厤鍣ㄦ寜 loading / error / 绌鸿处鏈悇璺戜竴閬嶏紝鐪嬩細涓嶄細鎶涢敊銆佹湁娌℃湁鐣欐紨绀烘暟鎹紙璺戝畬鍒狅級
const { spawn } = require('node:child_process')
const WebSocket = require('ws')
const path = require('node:path')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const file = path.resolve(process.argv[2])
const PORT = 9336

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + path.join(process.env.TEMP || '.', 'etude-cdp5'),
  file,
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  let list = null
  for (let i = 0; i < 40; i += 1) {
    try {
      list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())
      if (list.some((t) => t.type === 'page' && t.webSocketDebuggerUrl)) break
    } catch (e) {
      /* 杩樻病璧锋潵 */
    }
    await sleep(250)
  }
  const target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
  const ws = new WebSocket(target.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 })
  await new Promise((res, rej) => {
    ws.once('open', res)
    ws.once('error', rej)
  })
  let id = 0
  const waiters = new Map()
  const logs = []
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    if (msg.id && waiters.has(msg.id)) {
      waiters.get(msg.id)(msg)
      waiters.delete(msg.id)
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'warning') {
      logs.push(msg.params.args.map((a) => a.value || a.description).join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push('寮傚父锛? + JSON.stringify(msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description))
    }
  })
  const send = (method, params) =>
    new Promise((res) => {
      id += 1
      waiters.set(id, res)
      ws.send(JSON.stringify({ id, method, params: params || {} }))
    })
  await send('Runtime.enable')
  await sleep(1800)

  const evaluate = async (body) => {
    const expression = `(async () => {
      const iframe = document.querySelector('iframe')
      const doc = iframe && iframe.contentDocument
      if (!doc) return '娌℃湁 iframe'
      ${body}
    })()`
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (res.result && res.result.exceptionDetails) {
      const d = res.result.exceptionDetails
      return '寮傚父锛? + (d.exception ? d.exception.description : d.text)
    }
    return res.result && res.result.result ? res.result.result.value : undefined
  }

  const snapshot = `
    const img = doc.querySelector('.imgbar img')
    const dur = doc.querySelector('.vline span.mut')
    return {
      h2: doc.querySelector('.fx-wordhd h2').textContent,
      info: doc.querySelector('.fx-info').textContent.replace(/\\s+/g,' ').trim(),
      def: doc.querySelector('.fx-list .fx-def .dt') ? doc.querySelector('.fx-list .fx-def .dt').textContent : '(娌℃湁 fx-def)',
      rows: doc.querySelectorAll('.fx-row').length,
      notes: [...doc.querySelectorAll('.fx-note')].map(n => n.textContent),
      five: [...doc.querySelectorAll('.f5list .f5row em')].map(n => n.textContent),
      img: img ? img.getAttribute('src').slice(0, 24) : '(娌℃湁 imgbar)',
      dur: dur ? dur.textContent : '(娌℃湁澹板潡)',
      chips: [...doc.querySelectorAll('.chips span')].map(n => n.textContent),
      side: [...doc.querySelectorAll('.fx-words li')].length,
      sideHg: doc.querySelector('.fx-sidehd').textContent.trim(),
      foot: doc.querySelector('.fx-foot').textContent.slice(0, 24)
    }
  `

  for (const [label, state] of [
    ['loading', `{ status: 'loading' }`],
    ['error', `{ status: 'error', error: '璐︽湰鏂囦欢璇讳笉浜? }`],
    ['绌鸿处鏈?, `{ status: 'ready', packs: [], jobs: [] }`],
  ]) {
    const out = await evaluate(`
      const api = iframe.contentWindow.__ETUDE__ && iframe.contentWindow.__ETUDE__.rpc ? {rpc: iframe.contentWindow.__ETUDE__.rpc} : null
      try { iframe.contentWindow.__ETUDE_APPLY__(${state}, api) } catch (e) { return '鎶涢敊锛? + e.message }
      ${snapshot}
    `)
    console.log('--- ' + label + ' ---')
    console.log(JSON.stringify(out, null, 1))
  }
  console.log('--- 鍐嶅杺涓€浠界湡 state锛岀湅妯℃澘鑳戒笉鑳借繕鍘?---')
  console.log(
    JSON.stringify(
      await evaluate(`
        const api = { rpc: iframe.contentWindow.__ETUDE__.rpc }
        const state = await api.rpc('state')
        try { iframe.contentWindow.__ETUDE_APPLY__(state, api) } catch (e) { return '鎶涢敊锛? + e.message }
        await new Promise(r => setTimeout(r, 600))
        ${snapshot}
      `),
      null,
      1,
    ),
  )
  console.log('--- console.warn ---')
  console.log(logs.join('\n') || '锛堟病鏈夛級')
  ws.close()
}

main()
  .catch((e) => console.error('鍑洪敊', e))
  .finally(() => {
    chrome.kill()
  })

