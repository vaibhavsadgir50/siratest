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
  messages,
  draft,
  onDraft,
  onSend,
  showAuth,
  extraActions,
}) {
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
              <input placeholder="Room id to join" value={joinRoomId} onChange={(e) => onJoinRoomId(e.target.value)} />
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
