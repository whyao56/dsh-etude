/**
 * 带代理的 fetch。
 *
 * 为什么需要这个东西：这台机器（以及很多国内用户的机器）外网只能走系统代理，
 * 而 Node 的 `fetch` **完全不看** Windows 的「Internet 选项」和 `HTTPS_PROXY`。
 * 实测：直连 `api.openverse.org` 连接超时；走 `127.0.0.1:7897` 立刻 200。
 * 如果不管这件事，插件在装好之后会表现为「一条候选图都搜不到」，
 * 而错误信息只有一句 connect timeout，用户根本猜不到是代理。
 *
 * 解析顺序（先赢）：
 *   1. 插件配置里的 `proxyUrl`
 *   2. 环境变量 `HTTPS_PROXY` / `ALL_PROXY` / `HTTP_PROXY`
 *   3. Windows 注册表 HKCU\...\Internet Settings 的 ProxyServer
 *   4. 直连
 *
 * 有代理时用 HTTP CONNECT 开隧道，再在隧道上跑 TLS；没有代理时直接交给
 * 全局 `fetch`，一点额外开销都不加。
 */
import { execFile } from 'node:child_process'
import http from 'node:http'
import https from 'node:https'
import tls from 'node:tls'
import { promisify } from 'node:util'

const run = promisify(execFile)

const DEFAULT_MAX_BYTES = 16 * 1024 * 1024

let explicitProxy = ''
let systemProxyCache

/** 插件配置里显式指定的代理，优先于一切。 */
export function setProxyUrl(value) {
  explicitProxy = String(value ?? '').trim()
}

function envProxy() {
  for (const name of ['HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy', 'HTTP_PROXY', 'http_proxy']) {
    const value = process.env[name]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return ''
}

async function windowsProxy() {
  if (process.platform !== 'win32') return ''
  if (systemProxyCache !== undefined) return systemProxyCache
  systemProxyCache = ''
  try {
    const { stdout } = await run('reg', [
      'query',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      '/v',
      'ProxyServer',
    ])
    const match = stdout.match(/ProxyServer\s+REG_SZ\s+(\S+)/)
    if (match) {
      // 可能是 "http=127.0.0.1:7897;https=127.0.0.1:7897" 这种按协议分开写的
      const raw = match[1].trim()
      const parts = raw.split(';').filter((one) => one.includes('='))
      if (parts.length > 0) {
        const httpsPart = parts.find((one) => one.startsWith('https='))
        const httpPart = parts.find((one) => one.startsWith('http='))
        systemProxyCache = (httpsPart ?? httpPart ?? parts[0]).split('=')[1]?.trim() ?? ''
      } else {
        systemProxyCache = raw
      }
    }
  } catch {
    systemProxyCache = ''
  }
  return systemProxyCache
}

/** 当前生效的代理地址（空串表示直连）。给自检用。 */
export async function resolveProxy() {
  if (explicitProxy) return explicitProxy
  const fromEnv = envProxy()
  if (fromEnv) return fromEnv
  return windowsProxy()
}

function withScheme(value) {
  if (!value) return ''
  return /^[a-z]+:\/\//i.test(value) ? value : `http://${value}`
}

const agentCache = new Map()

function proxyAgent(proxyUrl, targetHost, targetPort, secure) {
  const key = `${proxyUrl}|${targetHost}|${targetPort}|${secure ? 's' : 'p'}`
  const cached = agentCache.get(key)
  if (cached) return cached

  const proxy = new URL(withScheme(proxyUrl))
  const AgentClass = secure ? https.Agent : http.Agent
  const agent = new AgentClass({ keepAlive: false })
  agent.createConnection = (_options, callback) => {
    const connectRequest = http.request({
      host: proxy.hostname,
      port: proxy.port || 80,
      method: 'CONNECT',
      path: `${targetHost}:${targetPort}`,
      headers: { host: `${targetHost}:${targetPort}` },
      timeout: 20000,
    })
    connectRequest.once('connect', (response, socket) => {
      if (response.statusCode !== 200) {
        socket.destroy()
        callback(new Error(`代理拒绝了 CONNECT：${response.statusCode}`))
        return
      }
      if (!secure) {
        callback(null, socket)
        return
      }
      const secured = tls.connect({ socket, servername: targetHost })
      secured.once('secureConnect', () => callback(null, secured))
      secured.once('error', (error) => callback(error))
    })
    connectRequest.once('timeout', () => {
      connectRequest.destroy()
      callback(new Error('代理连接超时'))
    })
    connectRequest.once('error', (error) => callback(error))
    connectRequest.end()
  }
  agentCache.set(key, agent)
  return agent
}

function headerRecord(headers) {
  if (!headers) return {}
  if (typeof headers.forEach === 'function' && !Array.isArray(headers)) {
    const out = {}
    headers.forEach((value, name) => {
      out[name] = value
    })
    return out
  }
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  return { ...headers }
}

function makeResponse(status, rawHeaders, buffer) {
  const headers = new Headers()
  for (let i = 0; i < rawHeaders.length; i += 2) {
    try {
      headers.append(rawHeaders[i], rawHeaders[i + 1])
    } catch {
      // 个别头部不规范，忽略就行，别把整个响应搞崩
    }
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers,
    async text() {
      return buffer.toString('utf8')
    },
    async json() {
      return JSON.parse(buffer.toString('utf8'))
    },
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    },
    async bytes() {
      return new Uint8Array(buffer)
    },
  }
}

function viaTunnel(target, init, proxyUrl) {
  const url = new URL(target)
  const secure = url.protocol === 'https:'
  const port = Number(url.port || (secure ? 443 : 80))
  const lib = secure ? https : http
  const headers = headerRecord(init.headers)
  let body = init.body
  if (body !== undefined && body !== null && typeof body !== 'string' && !Buffer.isBuffer(body) && !(body instanceof Uint8Array)) {
    body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  if (body !== undefined && body !== null) {
    headers['content-length'] = String(Buffer.byteLength(body))
  }

  return new Promise((resolve, reject) => {
    const request = lib.request(
      {
        host: url.hostname,
        port,
        path: `${url.pathname}${url.search}`,
        method: String(init.method ?? 'GET').toUpperCase(),
        headers,
        agent: proxyAgent(proxyUrl, url.hostname, port, secure),
        signal: init.signal,
      },
      (response) => {
        const chunks = []
        let size = 0
        const limit = Number(init.maxBytes) > 0 ? Number(init.maxBytes) : DEFAULT_MAX_BYTES
        response.on('data', (chunk) => {
          size += chunk.length
          if (size > limit) {
            response.destroy(new Error(`响应超过 ${Math.round(limit / 1024 / 1024)} MB`))
            return
          }
          chunks.push(chunk)
        })
        response.on('end', () => resolve(makeResponse(response.statusCode ?? 0, response.rawHeaders, Buffer.concat(chunks))))
        response.on('error', reject)
      },
    )
    request.on('error', reject)
    if (body !== undefined && body !== null) request.write(body)
    request.end()
  })
}

/**
 * 和 `fetch` 一样的调用方式，但会走代理。
 * 没有代理时直接转给全局 `fetch` —— 那条路更省事也更快。
 */
export async function httpFetch(url, init = {}) {
  const proxy = await resolveProxy()
  if (!proxy) return fetch(url, init)
  return viaTunnel(String(url), init, proxy)
}

/** 给自检看的：现在到底走不走代理。 */
export async function describeNetwork() {
  const proxy = await resolveProxy()
  return proxy ? `走代理 ${withScheme(proxy)}` : '直连（没有找到代理）'
}
