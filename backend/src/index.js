import { config as loadEnv } from 'dotenv'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __root = join(dirname(fileURLToPath(import.meta.url)), '../..')
loadEnv({ path: join(__root, '.env') })
loadEnv()
import { SiraServer } from 'sira-node'
import { verifyUserToken } from './jwt.js'
import { openDb } from './db.js'
import { createChatService } from './chatService.js'
import { SiraChatPipeline } from './siraChatPipeline.js'
import { createRestHandler } from './restApi.js'
import { createStaticHandler, resolveClientDist } from './static.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

const hex = process.env.SIRA_MASTER_SECRET
if (!hex || Buffer.from(hex, 'hex').length !== 32) {
  console.error('Set SIRA_MASTER_SECRET to 64 hex chars (openssl rand -hex 32).')
  process.exit(1)
}
const masterSecret = Buffer.from(hex, 'hex')

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 16) {
  console.error('Set JWT_SECRET (min 16 chars) for REST + Sira session binding.')
  process.exit(1)
}

const dbPath = process.env.DATABASE_PATH || join(__root, 'data/chat.db')
const db = openDb(dbPath)
const chat = createChatService(db)
chat.ensureLobby()

const pipeline = new SiraChatPipeline(chat, jwtSecret)
const restHandler = createRestHandler({ chat, jwtSecret })

const dist = resolveClientDist()
const staticHandler = createStaticHandler(dist)

async function httpFallback(req, res) {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'GET' && u.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('ok')
    return true
  }

  const restHandled = await restHandler(req, res)
  if (restHandled) return true

  if (existsSync(join(dist, 'index.html'))) {
    return staticHandler(req, res)
  }

  return false
}

const server = new SiraServer({
  masterSecret,
  pipeline,
  host: HOST,
  port: PORT,
  refreshAuth: {
    async authenticateAppToken(token) {
      return verifyUserToken(String(token || ''), jwtSecret)
    },
  },
  httpFallback,
})

server.listen(PORT)
console.log(
  `[siratest] Sira: /h /r /w  |  REST: /api/v1/* (JWT Bearer)  |  static: ${existsSync(join(dist, 'index.html')) ? 'yes' : 'build frontend first'}`,
)
