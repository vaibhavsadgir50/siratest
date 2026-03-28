import { Pipeline } from 'sira-node'
import { signUserToken } from './jwt.js'

function requireUser(userId) {
  if (!userId) return { error: 'auth_required', message: 'Log in via Sira (auth.login then refreshAuth with token).' }
  return null
}

export class SiraChatPipeline extends Pipeline {
  constructor(chat, jwtSecret) {
    super()
    this.chat = chat
    this.jwtSecret = jwtSecret
  }

  async process(action, { userId }) {
    const a = action && typeof action === 'object' ? action : {}
    if (a.type !== 'dispatch') {
      return { error: 'use_dispatch', hint: '{ type: "dispatch", event, payload }' }
    }
    const event = typeof a.event === 'string' ? a.event : ''
    const p = a.payload && typeof a.payload === 'object' ? a.payload : {}

    switch (event) {
      case 'auth.register': {
        const r = this.chat.register(p.username, p.password)
        if (r.error) return { error: r.error }
        return { ok: true, username: r.username }
      }
      case 'auth.login': {
        const r = this.chat.login(p.username, p.password)
        if (r.error) return { error: r.error }
        const token = signUserToken(r.userId, this.jwtSecret)
        return { ok: true, token, username: r.username }
      }
      case 'room.list': {
        const err = requireUser(userId)
        if (err) return err
        return { rooms: this.chat.listRooms(userId) }
      }
      case 'room.create': {
        const err = requireUser(userId)
        if (err) return err
        const r = this.chat.createRoom(userId, p.name)
        if (r.error) return { error: r.error }
        return { room: r.room }
      }
      case 'room.join': {
        const err = requireUser(userId)
        if (err) return err
        const r = this.chat.joinRoom(userId, p.roomId)
        if (r.error) return { error: r.error }
        return { ok: true, roomId: r.roomId }
      }
      case 'message.list': {
        const err = requireUser(userId)
        if (err) return err
        const r = this.chat.listMessages(p.roomId, userId, p.since)
        if (r.error) return { error: r.error }
        return { messages: r.messages }
      }
      case 'message.send': {
        const err = requireUser(userId)
        if (err) return err
        const r = this.chat.sendMessage(p.roomId, userId, p.body)
        if (r.error) return { error: r.error }
        return { message: r.message }
      }
      default:
        return { error: 'unknown_event', event }
    }
  }
}
