import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatShell } from '../components/ChatShell.jsx'

const API = '/api/v1'

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  const r = await fetch(`${API}${path}`, { ...opts, headers })
  const text = await r.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: 'bad_response' }
  }
  if (!r.ok) throw Object.assign(new Error(data.error || r.status), { status: r.status, data })
  return data
}

export function RestChatPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('rest_jwt') || '')
  const [session, setSession] = useState(() => {
    const u = sessionStorage.getItem('rest_user')
    return u ? { username: u } : null
  })
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

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  )

  const loadRooms = useCallback(async () => {
    if (!token) return
    setChatError('')
    try {
      const r = await api('/rooms', { headers: authHeaders() })
      const list = r.rooms || []
      setRooms(list)
      setRoomId((cur) => {
        if (cur && list.some((x) => x.id === cur)) return cur
        return list[0]?.id ?? null
      })
    } catch (e) {
      setChatError(e.data?.error || e.message)
    }
  }, [token, authHeaders])

  useEffect(() => {
    if (session && token) loadRooms()
  }, [session, token, loadRooms])

  useEffect(() => {
    if (!session || !roomId || !token) return
    sinceRef.current = 0
    setMessages([])
    let cancelled = false

    async function pull() {
      try {
        const r = await api(`/rooms/${encodeURIComponent(roomId)}/messages?since=${sinceRef.current}`, {
          headers: authHeaders(),
        })
        if (cancelled) return
        const list = r.messages || []
        if (list.length) {
          setMessages((prev) => (sinceRef.current === 0 ? list : [...prev, ...list]))
          sinceRef.current = Math.max(sinceRef.current, ...list.map((m) => m.created_at))
        }
      } catch (e) {
        if (!cancelled) setChatError(e.data?.error || e.message)
      }
    }

    pull()
    const id = setInterval(pull, 1600)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [session, roomId, token, authHeaders])

  async function handleRegister() {
    setAuthError('')
    try {
      const r = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      sessionStorage.setItem('rest_jwt', r.token)
      sessionStorage.setItem('rest_user', r.username)
      setToken(r.token)
      setSession({ username: r.username })
    } catch (e) {
      setAuthError(e.data?.error || e.message)
    }
  }

  async function handleLogin() {
    setAuthError('')
    try {
      const r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      sessionStorage.setItem('rest_jwt', r.token)
      sessionStorage.setItem('rest_user', r.username)
      setToken(r.token)
      setSession({ username: r.username })
    } catch (e) {
      setAuthError(e.data?.error || e.message)
    }
  }

  async function handleSend() {
    if (!roomId || !draft.trim() || !token) return
    setChatError('')
    try {
      await api(`/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body: draft }),
      })
      setDraft('')
    } catch (e) {
      setChatError(e.data?.error || e.message)
    }
  }

  async function handleCreateRoom() {
    if (!newRoom.trim() || !token) return
    try {
      const r = await api('/rooms', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newRoom.trim() }),
      })
      setNewRoom('')
      await loadRooms()
      if (r.room?.id) setRoomId(r.room.id)
    } catch (e) {
      setChatError(e.data?.error || e.message)
    }
  }

  async function handleJoinRoom() {
    if (!joinId.trim() || !token) return
    try {
      await api(`/rooms/${encodeURIComponent(joinId.trim())}/join`, {
        method: 'POST',
        headers: authHeaders(),
      })
      setJoinId('')
      await loadRooms()
    } catch (e) {
      setChatError(e.data?.error || e.message)
    }
  }

  function signOut() {
    sessionStorage.removeItem('rest_jwt')
    sessionStorage.removeItem('rest_user')
    setToken('')
    setSession(null)
    setRooms([])
    setRoomId(null)
    setMessages([])
  }

  return (
    <div className="page-wrap mode-rest">
      <ChatShell
        title="Chat (REST)"
        subtitle="Same UI — HTTPS JSON API with industry-style controls."
        transportNote="REST /api/v1/* · JWT Bearer (HS256, 24h) · bcrypt passwords · rate limit on auth · security headers · no-store."
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
        extraActions={
          <div className="header-actions">
            {session ? (
              <button type="button" className="btn secondary" onClick={signOut}>
                Sign out
              </button>
            ) : null}
            <Link to="/" className="btn secondary">
              Home
            </Link>
          </div>
        }
      />
    </div>
  )
}
