import { signUserToken, verifyUserToken } from './jwt.js'
import { createAuthRateLimiter } from './authRateLimit.js'

const MAX_JSON = 48_384

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let n = 0
    req.on('data', (c) => {
      n += c.length
      if (n > MAX_JSON) {
        reject(new Error('too_large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('bad_json'))
      }
    })
    req.on('error', reject)
  })
}

function json(res, status, obj) {
  res.writeHead(status, securityHeaders)
  res.end(JSON.stringify(obj))
}

function clientIp(req) {
  return req.socket?.remoteAddress || 'unknown'
}

function bearer(req) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return null
  return h.slice(7).trim()
}

export function createRestHandler({ chat, jwtSecret }) {
  const rateLimit = createAuthRateLimiter()

  return async function restHandler(req, res) {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (!u.pathname.startsWith('/api/v1/')) return false

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.setHeader('Access-Control-Max-Age', '600')

    if (req.method === 'OPTIONS') {
      res.writeHead(204, securityHeaders)
      res.end()
      return true
    }

    const ip = clientIp(req)

    try {
      if (req.method === 'POST' && u.pathname === '/api/v1/auth/register') {
        if (!rateLimit(ip)) {
          json(res, 429, { error: 'rate_limited' })
          return true
        }
        const body = await readJsonBody(req)
        const r = chat.register(body.username, body.password)
        if (r.error) {
          const code = r.error === 'username_taken' ? 409 : 400
          json(res, code, { error: r.error })
          return true
        }
        const token = signUserToken(r.userId, jwtSecret)
        json(res, 201, { token, username: r.username })
        return true
      }

      if (req.method === 'POST' && u.pathname === '/api/v1/auth/login') {
        if (!rateLimit(ip)) {
          json(res, 429, { error: 'rate_limited' })
          return true
        }
        const body = await readJsonBody(req)
        const r = chat.login(body.username, body.password)
        if (r.error) {
          json(res, 401, { error: r.error })
          return true
        }
        const token = signUserToken(r.userId, jwtSecret)
        json(res, 200, { token, username: r.username })
        return true
      }

      const token = bearer(req)
      const userId = token ? verifyUserToken(token, jwtSecret) : null
      if (!userId) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }

      if (req.method === 'GET' && u.pathname === '/api/v1/rooms') {
        json(res, 200, { rooms: chat.listRooms(userId) })
        return true
      }

      if (req.method === 'POST' && u.pathname === '/api/v1/rooms') {
        const body = await readJsonBody(req)
        const r = chat.createRoom(userId, body.name)
        if (r.error) {
          json(res, 400, { error: r.error })
          return true
        }
        json(res, 201, r)
        return true
      }

      const joinMatch = u.pathname.match(/^\/api\/v1\/rooms\/([^/]+)\/join$/)
      if (joinMatch && req.method === 'POST') {
        const r = chat.joinRoom(userId, decodeURIComponent(joinMatch[1]))
        if (r.error) {
          json(res, r.error === 'not_found' ? 404 : 400, { error: r.error })
          return true
        }
        json(res, 200, { ok: true, roomId: r.roomId })
        return true
      }

      const msgList = u.pathname.match(/^\/api\/v1\/rooms\/([^/]+)\/messages$/)
      if (msgList && req.method === 'GET') {
        const since = u.searchParams.get('since') || '0'
        const r = chat.listMessages(msgList[1], userId, since)
        if (r.error) {
          json(res, 403, { error: r.error })
          return true
        }
        json(res, 200, { messages: r.messages })
        return true
      }

      if (msgList && req.method === 'POST') {
        const body = await readJsonBody(req)
        const r = chat.sendMessage(msgList[1], userId, body.body)
        if (r.error) {
          const st = r.error === 'forbidden' ? 403 : 400
          json(res, st, { error: r.error })
          return true
        }
        json(res, 201, r)
        return true
      }

      json(res, 404, { error: 'not_found' })
      return true
    } catch (e) {
      if (e.message === 'too_large') {
        json(res, 413, { error: 'payload_too_large' })
        return true
      }
      if (e.message === 'bad_json') {
        json(res, 400, { error: 'invalid_json' })
        return true
      }
      json(res, 500, { error: 'server_error' })
      return true
    }
  }
}
