import { useState } from 'react'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

export function ChatShell({
  title,
  subtitle,
  transportNote,
  authError,
  chatError,
  username,
  password,
  onUsername,
  onPassword,
  onRegister,
  onLogin,
  loggedIn,
  displayName,
  rooms,
  selectedRoomId,
  onSelectRoom,
  newRoomName,
  onNewRoomName,
  onCreateRoom,
  joinRoomId,
  onJoinRoomId,
  onJoinRoom,
  selectedRoom,
  messages,
  draft,
  onDraft,
  onSend,
  showAuth,
  extraActions,
  pendingRoomInvite,
  inviteLink,
}) {
  const [copyOk, setCopyOk] = useState(false)

  async function handleCopyInvite() {
    if (!inviteLink) return
    const ok = await copyText(inviteLink)
    if (ok) {
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    }
  }

  return (
    <div className="chat-app">
      <header className="chat-top">
        <div>
          <h1>{title}</h1>
          <p className="chat-sub">{subtitle}</p>
          <p className="chat-note">{transportNote}</p>
        </div>
        {extraActions}
      </header>

      {authError ? <div className="banner err">{authError}</div> : null}
      {chatError ? <div className="banner err">{chatError}</div> : null}
      {showAuth && pendingRoomInvite ? (
        <div className="banner info">
          You opened an invite link. After you register or log in, you will join that room on this device automatically.
        </div>
      ) : null}

      {showAuth ? (
        <section className="auth-panel">
          <h2>Account</h2>
          <div className="auth-row">
            <input placeholder="Username" value={username} onChange={(e) => onUsername(e.target.value)} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => onPassword(e.target.value)}
            />
            <button type="button" className="btn secondary" onClick={() => onRegister()}>
              Register
            </button>
            <button type="button" className="btn primary" onClick={() => onLogin()}>
              Log in
            </button>
          </div>
        </section>
      ) : null}

      {loggedIn ? (
        <div className="chat-main">
          <aside className="chat-sidebar">
            <div className="who">Signed in as <strong>{displayName}</strong></div>
            <h3>Rooms</h3>
            <ul className="room-list">
              {(rooms || []).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={r.id === selectedRoomId ? 'room active' : 'room'}
                    onClick={() => onSelectRoom(r.id)}
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
            {selectedRoom ? (
              <div className="room-invite">
                <div className="room-invite-label">Others can join with this id or the room name:</div>
                <div className="room-invite-row">
                  <code className="room-invite-id" title="Room id">
                    {selectedRoom.id}
                  </code>
                </div>
                <div className="room-invite-name">
                  Name: <strong>{selectedRoom.name}</strong>
                </div>
                {inviteLink ? (
                  <div className="room-invite-actions">
                    <button type="button" className="btn small" onClick={handleCopyInvite}>
                      {copyOk ? 'Copied' : 'Copy invite link'}
                    </button>
                    <span className="room-invite-hint">Works on any device with this same site URL.</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="room-actions">
              <input
                placeholder="New room name"
                value={newRoomName}
                onChange={(e) => onNewRoomName(e.target.value)}
              />
              <button type="button" className="btn small" onClick={onCreateRoom}>
                Create
              </button>
            </div>
            <div className="room-actions">
              <input
                placeholder="Room id or name to join"
                value={joinRoomId}
                onChange={(e) => onJoinRoomId(e.target.value)}
              />
              <button type="button" className="btn small" onClick={onJoinRoom}>
                Join
              </button>
            </div>
          </aside>
          <section className="chat-pane">
            <div className="messages">
              {(messages || []).map((m) => (
                <div key={m.id} className="msg">
                  <span className="msg-user">{m.username}</span>
                  <span className="msg-time">{new Date(m.created_at).toLocaleTimeString()}</span>
                  <div className="msg-body">{m.body}</div>
                </div>
              ))}
            </div>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault()
                onSend()
              }}
            >
              <input
                placeholder={selectedRoomId ? 'Message…' : 'Select a room'}
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                disabled={!selectedRoomId}
              />
              <button type="submit" className="btn primary" disabled={!selectedRoomId || !draft.trim()}>
                Send
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
