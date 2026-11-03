// 临时调试 2：看 .fx-list 的真实子节点与 .fx-sense 的父节点
const { spawn } = require('child_process')
const http = require('http')
const WebSocket = require('ws')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PAGE = process.argv[2]
const PORT = 9334

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const child = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + require('os').tmpdir() + '\\etude-cdp-profile2',
    'about:blank',
  ])
  child.stderr.on('data', () => {})
  let targets = []
  for (let i = 0; i < 40; i += 1) {
    try {
      targets = await getJson('/json/list')
      if (targets && targets.length) break
    } catch (e) {}
    await sleep(250)
  }
  const page = targets.find((one) => one.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false })
  let id = 0
  const pending = new Map()
  const contexts = []
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
      return
    }
    if (msg.method === 'Runtime.executionContextCreated') {
      contexts.push({ id: msg.params.context.id, aux: msg.params.context.auxData })
    }
  })
  const send = (method, params) =>
    new Promise((resolve) => {
      const mid = (id += 1)
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  await new Promise((r) => ws.on('open', r))
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: 'file:///' + PAGE.replace(/\\/g, '/') })
  await sleep(2500)

  const expression = `(function(){
    function path(node){ var out=[]; while(node && node.nodeType===1){ out.unshift(node.tagName.toLowerCase()+(node.className? '.'+String(node.className).split(' ').join('.'):'')); node=node.parentNode } return out.join(' > ') }
    var list = document.querySelector('.fx-list');
    var kids = list ? Array.prototype.map.call(list.children, function(c){ return c.tagName.toLowerCase()+'.'+String(c.className) }) : null;
    var senses = document.querySelectorAll('.fx-sense');
    return JSON.stringify({
      listChildren: kids,
      senseCount: senses.length,
      senseWhere: Array.prototype.map.call(senses, function(s){ return { cls: s.className, parent: s.parentNode ? s.parentNode.className : null, displayed: getComputedStyle(s).display, dt: s.querySelector('.dt') ? s.querySelector('.dt').textContent : null } }),
      listText: list ? list.innerText.slice(0, 400) : null
    }, null, 1)
  })()`
  const ctx = contexts.filter((c) => c.aux && c.aux.isDefault).pop()
  const res = await send('Runtime.evaluate', { expression, contextId: ctx.id, returnByValue: true })
  console.log(res.result?.result?.value || JSON.stringify(res.result))
  ws.close()
  child.kill()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
