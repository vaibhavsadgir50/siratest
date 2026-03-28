import bcrypt from 'bcryptjs'
import { uid } from './db.js'

const BCRYPT_ROUNDS = 10
const MAX_BODY = 4000
const MAX_USERNAME = 32
const MAX_ROOM_NAME = 64

function getOrCreateLobby(db) {
  const row = db.prepare('SELECT id FROM rooms WHERE name = ?').get('general')
  if (row) return row.id
  const id = uid()
  const t = Date.now()
  db.prepare('INSERT INTO rooms (id, name, created_by, created_at) VALUES (?, ?, NULL, ?)').run(
    id,
    'general',
    t,
  )
  return id
}

export function createChatService(db) {
  function register(username, password) {
    const u = String(username || '').trim().toLowerCase()
    const p = String(password || '')
    if (u.length < 2 || u.length > MAX_USERNAME) return { error: 'invalid_username' }
    if (p.length < 4) return { error: 'invalid_password' }
    const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(u)
    if (exists) return { error: 'username_taken' }
    const id = uid()
    const hash = bcrypt.hashSync(p, BCRYPT_ROUNDS)
    const t = Date.now()
    db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      u,
      hash,
      t,
    )
    const lobbyId = getOrCreateLobby(db)
    db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(
      lobbyId,
      id,
      t,
    )
    return { userId: id, username: u }
  }

  function login(username, password) {
    const u = String(username || '').trim().toLowerCase()
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(u)
    if (!row || !bcrypt.compareSync(String(password || ''), row.password_hash)) {
      return { error: 'invalid_credentials' }
    }
    const lobbyId = getOrCreateLobby(db)
    const t = Date.now()
    db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(
      lobbyId,
      row.id,
      t,
    )
    return { userId: row.id, username: row.username }
  }

  function listRooms(userId) {
    return db
      .prepare(
        `SELECT r.id, r.name, r.created_at
         FROM rooms r
         INNER JOIN room_members m ON m.room_id = r.id AND m.user_id = ?
         ORDER BY r.name`,
      )
      .all(userId)
  }

  function createRoom(userId, name) {
    const n = String(name || '').trim().slice(0, MAX_ROOM_NAME)
    if (!n) return { error: 'invalid_name' }
    const id = uid()
    const t = Date.now()
    db.prepare('INSERT INTO rooms (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      n,
      userId,
      t,
    )
    db.prepare('INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(id, userId, t)
    return { room: { id, name: n, created_at: t } }
  }

  function resolveRoomId(roomIdOrName) {
    const raw = String(roomIdOrName || '').trim()
    if (!raw) return null
    const byId = db.prepare('SELECT id FROM rooms WHERE id = ?').get(raw)
    if (byId) return byId.id
    const byName = db
      .prepare('SELECT id FROM rooms WHERE name = ? COLLATE NOCASE ORDER BY created_at ASC LIMIT 1')
      .get(raw)
    return byName?.id ?? null
  }

  function joinRoom(userId, roomIdOrName) {
    const id = resolveRoomId(roomIdOrName)
    if (!id) return { error: 'not_found' }
    const t = Date.now()
    db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(
      id,
      userId,
      t,
    )
    return { ok: true, roomId: id }
  }

  function listMessages(roomId, userId, since = 0) {
    const member = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId)
    if (!member) return { error: 'forbidden' }
    const rows = db
      .prepare(
        `SELECT id, room_id, user_id, username, body, created_at FROM messages
         WHERE room_id = ? AND created_at > ?
         ORDER BY created_at ASC LIMIT 200`,
      )
      .all(roomId, Number(since) || 0)
    return { messages: rows }
  }

  function sendMessage(roomId, userId, body) {
    const text = String(body || '').trim().slice(0, MAX_BODY)
    if (!text) return { error: 'empty' }
    const member = db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId)
    if (!member) return { error: 'forbidden' }
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId)
    if (!user) return { error: 'no_user' }
    const id = uid()
    const t = Date.now()
    db.prepare(
      'INSERT INTO messages (id, room_id, user_id, username, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, roomId, userId, user.username, text, t)
    return { message: { id, room_id: roomId, user_id: userId, username: user.username, body: text, created_at: t } }
  }

  return {
    register,
    login,
    listRooms,
    createRoom,
    joinRoom,
    listMessages,
    sendMessage,
    ensureLobby: () => getOrCreateLobby(db),
  }
}
