import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { mediaDir, packsDir } from './paths.js'

const IMAGE_NAME = /^[a-z]+-[0-9a-f]{20}\.(jpg|png|webp|gif)$/
const AUDIO_NAME = /^[a-z]+-[0-9a-f]{20}\.mp3$/
const STAGED_NAME = /^[0-9a-z]+-\d+-\d+\.(jpg|png|webp|gif)$/

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const MAX_API_BODY = 12 * 1024 * 1024

/**
 * 给界面用的媒体路由。
 *
 * 为什么不开个 base64 接口：一张 1.4 MB 的候选图变成 1.9 MB 的 JSON，
 * 九张就是 17 MB 穿过 RPC。而 `<img src>` / `<audio src>` 走这里，
 * 浏览器自己缓存、自己按需拿字节、自己拖动进度条，一行都不用写。
 *
 * 音频额外支持 Range：拖动进度条时 Chrome 会发 `Range: bytes=…`，
 * 回了 206 才能任意定位；只回 200 的话，拖到最后会静音甚至播不动。
 *
 * 另外这里还挂了一条 **回环 JSON 桥** `POST /etude/api/<endpoint>`：
 * 界面走的是 connection.rpc 的 WebSocket，本机脚本（pytest、发布前自检、
 * 用户自己写的小工具）够不到它。桥只认 127.0.0.1 / ::1、只认 JSON、
 * 带 Origin 时必须同源 —— 浏览器里的第三方页面伪造不了这三条里的任何一条。
 */
export function registerMediaRoutes(webServer, { getRoot, getApiHandler }) {
  const disposers = []

  disposers.push(
    webServer.register({
      kind: 'prefix',
      path: '/etude',
      handler: async (req, res) => {
        try {
          await route(req, res)
        } catch (error) {
          if (!res.headersSent) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
            res.end(`etude: ${error instanceof Error ? error.message : String(error)}`)
          } else {
            res.end()
          }
        }
      },
    }),
  )

  async function route(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = decodeURIComponent(url.pathname)

    if (path.startsWith('/etude/api/')) {
      return handleApi(req, res, path.slice('/etude/api/'.length))
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' })
      res.end()
      return
    }

    const imageMatch = path.match(/^\/etude\/media\/images\/([^/]+)$/)
    if (imageMatch && IMAGE_NAME.test(imageMatch[1])) {
      return sendFile(req, res, join(mediaDir(getRoot(), 'images'), imageMatch[1]))
    }

    const audioMatch = path.match(/^\/etude\/media\/audio\/([^/]+)$/)
    if (audioMatch && AUDIO_NAME.test(audioMatch[1])) {
      return sendFile(req, res, join(mediaDir(getRoot(), 'audio'), audioMatch[1]), { ranged: true })
    }

    const stagedMatch = path.match(/^\/etude\/candidate\/([^/]+)$/)
    if (stagedMatch && STAGED_NAME.test(stagedMatch[1])) {
      return sendFile(req, res, join(getRoot(), 'factory', 'candidates', stagedMatch[1]))
    }

    const manifestMatch = path.match(/^\/etude\/pack\/([0-9a-f]{16})\/manifest\.json$/)
    if (manifestMatch) {
      return sendFile(req, res, join(packsDir(getRoot()), manifestMatch[1], 'manifest.json'))
    }

    const packImageMatch = path.match(/^\/etude\/pack\/([0-9a-f]{16})\/images\/([^/]+)$/)
    if (packImageMatch && IMAGE_NAME.test(packImageMatch[2])) {
      return sendFile(req, res, join(packsDir(getRoot()), packImageMatch[1], 'images', packImageMatch[2]))
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('没有这个文件。')
  }

  async function handleApi(req, res, endpoint) {
    const json = (status, body) => {
      const payload = JSON.stringify(body)
      res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': String(Buffer.byteLength(payload)),
        'cache-control': 'no-store',
      })
      res.end(payload)
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST' })
      res.end()
      return
    }
    const handler = getApiHandler?.()
    if (typeof handler !== 'function') {
      json(503, { ok: false, error: { code: 'not-ready', message: '插件还没准备好，稍等一下再试。', details: {} } })
      return
    }

    const remote = req.socket?.remoteAddress ?? ''
    if (!LOOPBACK.has(remote)) {
      json(403, { ok: false, error: { code: 'forbidden', message: '这个通道只给本机用。', details: { remote } } })
      return
    }

    const contentType = String(req.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().includes('application/json')) {
      json(415, { ok: false, error: { code: 'bad-content-type', message: '要 application/json。', details: {} } })
      return
    }

    const origin = req.headers.origin
    if (origin !== undefined) {
      const expected = `http://${req.headers.host ?? '127.0.0.1'}`
      if (String(origin) !== expected) {
        json(403, { ok: false, error: { code: 'forbidden-origin', message: '跨来源不许调。', details: { origin } } })
        return
      }
    }

    let raw
    try {
      raw = await readBody(req, MAX_API_BODY)
    } catch (error) {
      json(413, { ok: false, error: { code: 'too-large', message: error instanceof Error ? error.message : '请求太大。', details: {} } })
      return
    }

    let payload = {}
    const text = raw.toString('utf8').trim()
    if (text !== '') {
      try {
        payload = JSON.parse(text)
      } catch {
        json(400, { ok: false, error: { code: 'bad-json', message: '请求体不是合法 JSON。', details: {} } })
        return
      }
    }
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      json(400, { ok: false, error: { code: 'bad-json', message: '请求体要是一个 JSON 对象。', details: {} } })
      return
    }

    const controller = new AbortController()
    req.on('close', () => controller.abort())

    let result
    try {
      result = await handler(decodeURIComponent(endpoint), payload, controller.signal)
    } catch (error) {
      result = {
        ok: false,
        error: {
          code: 'internal',
          message: error instanceof Error ? error.message : String(error),
          details: {},
        },
      }
    }
    json(200, result)
  }

  async function sendFile(req, res, filePath, { ranged = false } = {}) {
    let info
    try {
      info = await stat(filePath)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('文件不在。可能已经重新打过分了，刷新一下。')
      return
    }
    if (!info.isFile()) {
      res.writeHead(404)
      res.end()
      return
    }

    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    const headers = {
      'content-type': contentType,
      'cache-control': 'private, max-age=3600',
      'accept-ranges': 'bytes',
    }

    if (ranged && req.headers.range) {
      const range = parseRange(String(req.headers.range), info.size)
      if (range) {
        res.writeHead(206, {
          ...headers,
          'content-range': `bytes ${range.start}-${range.end}/${info.size}`,
          'content-length': String(range.end - range.start + 1),
        })
        if (req.method === 'HEAD') return res.end()
        await pipe(createReadStream(filePath, { start: range.start, end: range.end }), res)
        return
      }
    }

    res.writeHead(200, { ...headers, 'content-length': String(info.size) })
    if (req.method === 'HEAD') return res.end()
    await pipe(createReadStream(filePath), res)
  }

  return () => {
    for (const dispose of disposers) {
      try {
        dispose?.()
      } catch {
        // 路由已经没了就算了
      }
    }
  }
}

function parseRange(header, size) {
  const match = header.match(/^bytes=(\d*)-(\d*)$/)
  if (!match) return null
  const [, rawStart, rawEnd] = match
  let start = rawStart === '' ? null : Number(rawStart)
  let end = rawEnd === '' ? null : Number(rawEnd)
  if (start === null && end === null) return null
  if (start === null) {
    start = Math.max(0, size - (end ?? 0))
    end = size - 1
  } else {
    end = end === null ? size - 1 : Math.min(end, size - 1)
  }
  if (start > end || start >= size) return null
  return { start, end }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error(`超过 ${Math.round(limit / 1024 / 1024)} MB 了，分开发。`))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function pipe(stream, res) {
  return new Promise((resolve) => {
    stream.on('error', () => {
      res.end()
      resolve()
    })
    res.on('close', () => {
      stream.destroy()
      resolve()
    })
    stream.pipe(res)
    stream.on('end', resolve)
  })
}

export async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}
