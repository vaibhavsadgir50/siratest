import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import mime from 'mime-types'
import { fileURLToPath } from 'node:url'

function safeJoin(root, reqPath) {
  const p = normalize(join(root, reqPath)).replace(/\\/g, '/')
  const r = normalize(root).replace(/\\/g, '/')
  if (!p.startsWith(r)) return null
  return p
}

export function createStaticHandler(distDir) {
  return async function staticHandler(req, res) {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (req.method !== 'GET' && req.method !== 'HEAD') return false

    let pathname = decodeURIComponent(u.pathname)
    if (pathname === '/') pathname = '/index.html'

    const filePath = safeJoin(distDir, pathname.slice(1))
    if (!filePath) {
      res.writeHead(403)
      res.end()
      return true
    }

    try {
      const st = await stat(filePath)
      if (st.isDirectory()) return false
    } catch {
      const fallback = safeJoin(distDir, 'index.html')
      if (!fallback) return false
      try {
        await stat(fallback)
      } catch {
        return false
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      if (req.method === 'HEAD') {
        res.end()
        return true
      }
      createReadStream(fallback).pipe(res)
      return true
    }

    const type = mime.lookup(extname(filePath)) || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    if (req.method === 'HEAD') {
      res.end()
      return true
    }
    createReadStream(filePath).pipe(res)
    return true
  }
}

export function resolveClientDist() {
  const here = fileURLToPath(new URL('.', import.meta.url))
  return join(here, '../../frontend/dist')
}
