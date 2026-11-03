// 临时调试：用 CDP 进 iframe 里看适配器跑完后的真实 DOM
const { spawn } = require('child_process')
const http = require('http')
const WebSocket = require('ws')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PAGE = process.argv[2]
const PORT = 9333

function getJson(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path }, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', reject)
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const child = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + require('os').tmpdir() + '\\etude-cdp-profile',
    'about:blank',
  ])
  child.stderr.on('data', () => {})
  let targets = []
  for (let i = 0; i < 40; i += 1) {
    try {
      targets = await getJson('/json/list')
      if (targets && targets.length) break
    } catch (error) {}
    await sleep(250)
  }
  const page = targets.find((one) => one.type === 'page')
  if (!page) throw new Error('没有 page target')
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id = 0
  const pending = new Map()
  const contexts = []
  const logs = []
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
      return
    }
    if (msg.method === 'Runtime.executionContextCreated') {
      const ctx = msg.params.context
      contexts.push({ id: ctx.id, name: ctx.name, origin: ctx.origin, aux: ctx.auxData })
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(
        msg.params.type + ': ' + msg.params.args.map((a) => (a.value !== undefined ? a.value : a.description)).join(' '),
      )
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text))
    }
  })
  const send = (method, params) =>
    new Promise((resolve) => {
      const mid = (id += 1)
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  await new Promise((resolve) => ws.on('open', resolve))
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: 'file:///' + PAGE.replace(/\\/g, '/') })
  await sleep(2500)
  const childContexts = contexts.filter((one) => one.aux && one.aux.isDefault && one.aux.frameId !== page.id)
  console.log('contexts:', contexts.map((c) => c.id + ':' + c.name + ':' + (c.origin || '')).join(' | '))
  const expression = `(function(){
    var list = document.querySelector('.fx-list');
    var senses = list ? list.querySelectorAll('.fx-sense') : [];
    return JSON.stringify({
      hasList: !!list,
      senses: senses.length,
      displays: Array.prototype.map.call(senses, function(s){ return s.style.display || '(unset)' }),
      dts: Array.prototype.map.call(senses, function(s){ var d = s.querySelector('.dt'); return d ? d.textContent : null }),
      rows: list ? list.querySelectorAll('.fx-row').length : -1,
      words: document.querySelectorAll('.fx-words li').length,
      wordsHtml: (document.querySelector('.fx-words')||{}).innerHTML ? document.querySelector('.fx-words').innerHTML.slice(0,200) : null,
      state: !!window.__ETUDE_STATE__,
      applyFn: typeof window.__ETUDE_APPLY__
    })
  })()`
  for (const ctx of childContexts) {
    const res = await send('Runtime.evaluate', { expression, contextId: ctx.id, returnByValue: true })
    console.log('--- ctx', ctx.id, ctx.name, '---')
    console.log(res.result?.result?.value || JSON.stringify(res.result))
  }
  console.log('--- logs ---')
  console.log(logs.slice(0, 40).join('\n'))
  ws.close()
  child.kill()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
