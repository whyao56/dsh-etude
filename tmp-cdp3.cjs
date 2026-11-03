// 临时：点第二个包，看页面换没换（不进产品代码，跑完删）
const { spawn } = require('node:child_process')
const WebSocket = require('ws')
const path = require('node:path')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const file = path.resolve(process.argv[2])
const PORT = 9335

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + path.join(process.env.TEMP || '.', 'etude-cdp4'),
  file,
])
chrome.on('error', (e) => {
  console.error('chrome 起不来', e.message)
  process.exit(1)
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  let list = null
  for (let i = 0; i < 40; i += 1) {
    try {
      list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())
      if (list.some((t) => t.type === 'page' && t.webSocketDebuggerUrl)) break
    } catch (e) {
      /* 还没起来 */
    }
    await sleep(250)
  }
  const target = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
  if (!target) throw new Error('没找到 page target')
  const ws = new WebSocket(target.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 })
  await new Promise((res, rej) => {
    ws.once('open', res)
    ws.once('error', rej)
  })
  let id = 0
  const waiters = new Map()
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    if (msg.id && waiters.has(msg.id)) {
      waiters.get(msg.id)(msg)
      waiters.delete(msg.id)
    }
  })
  const send = (method, params) =>
    new Promise((res) => {
      id += 1
      waiters.set(id, res)
      ws.send(JSON.stringify({ id, method, params: params || {} }))
    })

  await send('Runtime.enable')
  await sleep(1500)

  const evaluate = async (body) => {
    const expression = `(async () => {
      const iframe = document.querySelector('iframe')
      const doc = iframe && iframe.contentDocument
      if (!doc) return '没有 iframe'
      ${body}
    })()`
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (res.result && res.result.exceptionDetails) {
      const d = res.result.exceptionDetails
      return '异常：' + (d.exception ? d.exception.description : d.text)
    }
    return res.result && res.result.result ? res.result.result.value : undefined
  }

  const probe = `
    const words = [...doc.querySelectorAll('.fx-words li')].map(li => li.textContent.trim() + '|class=' + li.className)
    const info = doc.querySelector('.fx-info').textContent.replace(/\\s+/g, ' ').trim()
    const h2 = doc.querySelector('.fx-wordhd h2').textContent
    const rows = [...doc.querySelectorAll('.fx-list .fx-row .s')].map(n => n.textContent)
    const def = doc.querySelector('.fx-list .fx-def .dt') ? doc.querySelector('.fx-list .fx-def .dt').textContent : null
    return { words, h2, info, def, rows }
  `
  console.log('--- 切词前 ---')
  console.log(JSON.stringify(await evaluate(probe), null, 1))

  console.log('点第二个')
  console.log(JSON.stringify(await evaluate(`doc.querySelectorAll('.fx-words li')[1].click(); return 'ok'`)))
  await sleep(1000)

  console.log('--- 切词后 ---')
  console.log(JSON.stringify(await evaluate(probe), null, 1))
  console.log(
    JSON.stringify(
      await evaluate(`
        const five = [...doc.querySelectorAll('.f5list .f5row em')].map(n => n.className + ':' + n.textContent)
        const voices = [...doc.querySelectorAll('.vline select option')].map(o => o.textContent).slice(0, 4)
        const chips = [...doc.querySelectorAll('.chips span')].map(n => n.textContent)
        const foot = doc.querySelector('.fx-foot').textContent.slice(0, 30)
        return { five, voices, chips, foot }
      `),
      null,
      1,
    ),
  )
  const snap = `
    const img = doc.querySelector('.imgbar img')
    const dur = doc.querySelector('.vline span.mut')
    return {
      h2: doc.querySelector('.fx-wordhd h2').textContent,
      info: doc.querySelector('.fx-info').textContent.replace(/\\s+/g,' ').trim(),
      def: doc.querySelector('.fx-list .fx-def .dt') ? doc.querySelector('.fx-list .fx-def .dt').textContent : '(没有 fx-def)',
      rows: doc.querySelectorAll('.fx-row').length,
      body: doc.querySelectorAll('.fx-body').length,
      notes: [...doc.querySelectorAll('.fx-note')].map(n => n.textContent),
      five: [...doc.querySelectorAll('.f5list .f5row em')].map(n => n.textContent),
      img: img ? img.getAttribute('src').slice(0, 24) : '(没有 imgbar)',
      dur: dur ? dur.textContent : '(没有声块)',
      chips: [...doc.querySelectorAll('.chips span')].map(n => n.textContent),
      side: [...doc.querySelectorAll('.fx-words li')].length,
      sideHg: doc.querySelector('.fx-sidehd').textContent.trim(),
      foot: doc.querySelector('.fx-foot').textContent.slice(0, 24)
    }
  `

  for (const [label, state] of [
    ['loading', `{ status: 'loading' }`],
    ['error', `{ status: 'error', error: '账本文件读不了' }`],
    ['空账本', `{ status: 'ready', packs: [], jobs: [] }`],
  ]) {
    console.log('--- ' + label + ' ---')
    console.log(
      JSON.stringify(
        await evaluate(`
          const api = { rpc: iframe.contentWindow.__ETUDE__.rpc }
          try { iframe.contentWindow.__ETUDE_APPLY__(${state}, api) } catch (e) { return '抛错：' + e.message }
          ${snap}
        `),
        null,
        1,
      ),
    )
  }

  console.log('--- 再喂一份真 state，看模板能不能还原 ---')
  console.log(
    JSON.stringify(
      await evaluate(`
        const api = { rpc: iframe.contentWindow.__ETUDE__.rpc }
        const state = await api.rpc('state')
        try { iframe.contentWindow.__ETUDE_APPLY__(state, api) } catch (e) { return '抛错：' + e.message }
        await new Promise(r => setTimeout(r, 700))
        ${snap}
      `),
      null,
      1,
    ),
  )

  console.log('--- 设计稿演示数据是否还有 ---')
  console.log(
    JSON.stringify(
      await evaluate(`
        const html = doc.body.innerHTML
        const needles = ['assets/factory', 'c1.jpg', '3.1s', '已选这张', 'They danced with wild abandon', '放弃（计划、希望）']
        const where = {}
        for (const n of needles) {
          const out = []
          const walk = (node) => {
            if (node.nodeType === 3) {
              if (node.nodeValue.indexOf(n) >= 0) {
                let p = node.parentElement, chain = []
                while (p && chain.length < 4) { chain.push(p.tagName.toLowerCase() + (p.className ? '.' + String(p.className).split(' ').join('.') : '')); p = p.parentElement }
                out.push(chain.join(' < '))
              }
              return
            }
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG' && String(node.getAttribute('src')).indexOf(n) >= 0) {
                let p = node.parentElement, chain = []
                while (p && chain.length < 4) { chain.push(p.tagName.toLowerCase() + (p.className ? '.' + String(p.className).split(' ').join('.') : '')); p = p.parentElement }
                out.push('img[' + node.getAttribute('src') + '] < ' + chain.join(' < '))
              }
              for (const child of node.childNodes) walk(child)
            }
          }
          walk(doc.body)
          where[n] = out.slice(0, 3)
        }
        return {
          msheet: doc.querySelectorAll('.msheet').length,
          sensesVisible: [...doc.querySelectorAll('.fx-sense')].filter(s => s.style.display !== 'none').length,
          where,
        }
      `),
      null,
      1,
    ),
  )

  ws.close()
}

main()
  .catch((e) => console.error('出错', e))
  .finally(() => {
    chrome.kill()
  })
