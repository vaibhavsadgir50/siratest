import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { createDispatchEnvelope } from '../api/dispatch.js'
import { ChatShell } from '../components/ChatShell.jsx'
import { useSira } from '../hooks/useSira.js'

export function SiraChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const pendingInvite = (searchParams.get('room') || searchParams.get('join') || '').trim()

  const { phase, error, send, refreshAuth, ready } = useSira()
  const [session, setSession] = useState(null)
  const [authError, setAuthError] = useState('')
  const [chatError, setChatError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [newRoom, setNewRoom] = useState('')
  const [joinId, setJoinId] = useState('')
  const sinceRef = useRef(0)

  const dispatch = useCallback(async (event, payload) => send(createDispatchEnvelope(event, payload)), [send])

  const loadRooms = useCallback(async () => {
    setChatError('')
    const r = await dispatch('room.list', {})
    if (r?.error) {
      setChatError(r.error)
      return
    }
    const list = r.rooms || []
    setRooms(list)
    setRoomId((cur) => {
      if (cur && list.some((x) => x.id === cur)) return cur
      return list[0]?.id ?? null
    })
  }, [dispatch])

  async function handleRegister() {
    setAuthError('')
    const r = await dispatch('auth.register', { username, password })
    if (r?.error) setAuthError(r.error)
    else setAuthError('Registered. Log in to open a Sira-authenticated session.')
  }

  async function handleLogin() {
    setAuthError('')
    const r = await dispatch('auth.login', { username, password })
    if (r?.error) {
      setAuthError(r.error)
      return
    }
    try {
      await refreshAuth(r.token)
      setSession({ username: r.username })
    } catch (err) {
      setAuthError(String(err.message || err))
    }
  }

  useEffect(() => {
    if (session) loadRooms()
  }, [session, loadRooms])

  useEffect(() => {
    if (!session || !ready || !pendingInvite) return
    let cancelled = false
    const code = pendingInvite
    ;(async () => {
      const r = await dispatch('room.join', { roomId: code })
      if (cancelled) return
      if (r?.error) {
        setChatError(r.error)
        return
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('room')
          next.delete('join')
          return next
        },
        { replace: true },
      )
      await loadRooms()
      if (r.roomId) setRoomId(r.roomId)
    })()
    return () => {
      cancelled = true
    }
  }, [session, ready, pendingInvite, dispatch, loadRooms, setSearchParams])

  useEffect(() => {
    if (!session || !roomId || !ready) return
    sinceRef.current = 0
    setMessages([])
    let cancelled = false

    async function pull() {
      const r = await dispatch('message.list', { roomId, since: sinceRef.current })
      if (cancelled || r?.error) return
      const list = r.messages || []
      if (list.length) {
        setMessages((prev) => (sinceRef.current === 0 ? list : [...prev, ...list]))
        sinceRef.current = Math.max(sinceRef.current, ...list.map((m) => m.created_at))
      }
    }

    pull()
    const id = setInterval(pull, 1600)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [session, roomId, ready, dispatch])

  async function handleSend() {
    if (!roomId || !draft.trim()) return
    setChatError('')
    const r = await dispatch('message.send', { roomId, body: draft })
    if (r?.error) setChatError(r.error)
    else setDraft('')
  }

  async function handleCreateRoom() {
    if (!newRoom.trim()) return
    const r = await dispatch('room.create', { name: newRoom.trim() })
    if (r?.error) setChatError(r.error)
    else {
      setNewRoom('')
      await loadRooms()
      if (r.room?.id) setRoomId(r.room.id)
    }
  }

  async function handleJoinRoom() {
    if (!joinId.trim()) return
    const r = await dispatch('room.join', { roomId: joinId.trim() })
    if (r?.error) setChatError(r.error)
    else {
      setJoinId('')
      await loadRooms()
      if (r.roomId) setRoomId(r.roomId)
    }
  }

  if (phase === 'connecting' || phase === 'idle') {
    return (
      <div className="page-center">
        <p>Opening Sira session…</p>
        {pendingInvite ? (
          <p className="chat-sub" style={{ maxWidth: '22rem', textAlign: 'center' }}>
            Invite loaded — after you sign in, you will join that room on this device.
          </p>
        ) : null}
        <Link to="/">Home</Link>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="page-center">
        <p className="err">Sira failed: {error}</p>
        <Link to="/">Home</Link>
      </div>
    )
  }

  const selectedRoom = roomId ? rooms.find((r) => r.id === roomId) ?? null : null
  const inviteLink =
    session && selectedRoom
      ? `${window.location.origin}${location.pathname}?room=${encodeURIComponent(selectedRoom.id)}`
      : null

  return (
    <div className="page-wrap mode-sira">
      <ChatShell
        title="Chat (Sira)"
        subtitle="Same UI as the other page — all calls go through Sira dispatch only."
        transportNote="Transport: WebSocket + fixed frames after POST /h. Identity: JWT bound via POST /r refreshAuth."
        authError={authError}
        chatError={chatError}
        username={username}
        password={password}
        onUsername={setUsername}
        onPassword={setPassword}
        onRegister={handleRegister}
        onLogin={handleLogin}
        loggedIn={Boolean(session)}
        displayName={session?.username || ''}
        rooms={rooms}
        selectedRoom={selectedRoom}
        selectedRoomId={roomId}
        onSelectRoom={setRoomId}
        newRoomName={newRoom}
        onNewRoomName={setNewRoom}
        onCreateRoom={handleCreateRoom}
        joinRoomId={joinId}
        onJoinRoomId={setJoinId}
        onJoinRoom={handleJoinRoom}
        messages={messages}
        draft={draft}
        onDraft={setDraft}
        onSend={handleSend}
        showAuth={!session}
        pendingRoomInvite={pendingInvite || null}
        inviteLink={inviteLink}
        extraActions={
          <Link to="/" className="btn secondary">
            Home
          </Link>
        }
      />
    </div>
  )
}
