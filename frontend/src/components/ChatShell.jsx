import { useEffect, useRef, useState } from 'react'

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
  accent = 'rest',
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
  ctfBanner = null,
}) {
  const [roomAction, setRoomAction] = useState(null)
  const [copyNameOk, setCopyNameOk] = useState(false)
  const createSubmittedRef = useRef(false)
  const joinSubmittedRef = useRef(false)

  useEffect(() => {
    if (roomAction !== 'create' || newRoomName !== '') return
    if (createSubmittedRef.current) {
      createSubmittedRef.current = false
      setRoomAction(null)
    }
  }, [newRoomName, roomAction])

  useEffect(() => {
    if (roomAction !== 'join' || joinRoomId !== '') return
    if (joinSubmittedRef.current) {
      joinSubmittedRef.current = false
      setRoomAction(null)
    }
  }, [joinRoomId, roomAction])

  async function handleCopyRoomName() {
    if (!selectedRoom?.name) return
    const ok = await copyText(selectedRoom.name)
    if (ok) {
      setCopyNameOk(true)
      setTimeout(() => setCopyNameOk(false), 2000)
    }
  }

  function openCreate() {
    if (roomAction === 'create') {
      setRoomAction(null)
      return
    }
    setRoomAction('create')
    onJoinRoomId('')
  }

  function openJoin() {
    if (roomAction === 'join') {
      setRoomAction(null)
      return
    }
    setRoomAction('join')
    onNewRoomName('')
  }

  function cancelRoomPanel() {
    setRoomAction(null)
    onNewRoomName('')
    onJoinRoomId('')
  }

  function handleCreateSubmit() {
    if (!String(newRoomName || '').trim()) return
    createSubmittedRef.current = true
    onCreateRoom()
  }

  function handleJoinSubmit() {
    if (!String(joinRoomId || '').trim()) return
    joinSubmittedRef.current = true
    onJoinRoom()
  }

  const statusLabel = loggedIn ? 'In session' : showAuth ? 'Sign in to chat' : 'Loading…'

  return (
    <div className={`nexus-chat-page nexus-chat-page--${accent}`}>
      <header className="nexus-topbar">
        <div className="nexus-topbar-left">
          <h1 className="nexus-title-gradient">{title}</h1>
          <span className="nexus-topbar-rule" aria-hidden />
          <span className="nexus-status">
            <span className="nexus-status-dot" />
            {statusLabel}
          </span>
        </div>
        <div className="nexus-topbar-actions">{extraActions}</div>
      </header>

      <div className="nexus-canvas nexus-canvas-chat">
        <div className="nexus-glow" aria-hidden />

        <div
          className={`chat-app glass-panel specular-edge${showAuth ? ' chat-app--auth' : ''}${loggedIn && !showAuth ? ' chat-app--logged' : ''}`}
        >
          <div className="chat-meta">
            <p className="chat-meta-sub">{subtitle}</p>
            <p className="chat-meta-note">{transportNote}</p>
          </div>

          {showAuth ? (
            <div className="auth-stage">
              {authError ? <div className="auth-flash auth-flash--err">{authError}</div> : null}
              {pendingRoomInvite ? (
                <div className="auth-flash auth-flash--info">
                  You opened an invite link. After you register or log in, you will join that room on this device
                  automatically.
                </div>
              ) : null}
              <section className="auth-card" aria-labelledby="auth-card-title">
                <h2 className="auth-card-title" id="auth-card-title">
                  Account
                </h2>
                <div className="auth-stack">
                  <div className="auth-field-block">
                    <label className="auth-field-label" htmlFor="auth-username">
                      Username
                    </label>
                    <input
                      id="auth-username"
                      name="username"
                      autoComplete="username"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => onUsername(e.target.value)}
                    />
                  </div>
                  <div className="auth-field-block">
                    <label className="auth-field-label" htmlFor="auth-password">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => onPassword(e.target.value)}
                    />
                  </div>
                  <div className="auth-actions">
                    <button type="button" className="btn btn-auth secondary" onClick={() => onRegister()}>
                      Register
                    </button>
                    <button type="button" className="btn btn-auth primary" onClick={() => onLogin()}>
                      Log in
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <>
              {chatError ? <div className="banner err chat-banner">{chatError}</div> : null}
              {loggedIn ? (
                <>
                  <div className="chat-discord">
                    <aside className="discord-sidebar" aria-label="Channels">
                      <div className="discord-sidebar-head">
                        <span className="discord-server-title">{title}</span>
                        <span className="discord-server-chevron" aria-hidden>
                          <span className="material-symbols-outlined">expand_more</span>
                        </span>
                      </div>
                      <div className="discord-channels-scroller">
                        <div className="discord-category">
                          <span className="material-symbols-outlined discord-category-chevron">chevron_right</span>
                          Text channels
                        </div>
                        <ul className="discord-channel-list">
                          {(rooms || []).map((r) => (
                            <li key={r.id}>
                              <button
                                type="button"
                                className={
                                  r.id === selectedRoomId ? 'discord-channel discord-channel--active' : 'discord-channel'
                                }
                                onClick={() => onSelectRoom(r.id)}
                              >
                                <span className="discord-channel-hash" aria-hidden>
                                  #
                                </span>
                                <span className="discord-channel-name">{r.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="discord-sidebar-bottom">
                        <div className="discord-sidebar-actions">
                          <button
                            type="button"
                            className={`discord-sidebar-btn${roomAction === 'create' ? ' discord-sidebar-btn--on' : ''}`}
                            onClick={openCreate}
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            className={`discord-sidebar-btn${roomAction === 'join' ? ' discord-sidebar-btn--on' : ''}`}
                            onClick={openJoin}
                          >
                            Join
                          </button>
                        </div>
                        {roomAction === 'create' ? (
                          <div className="discord-sidebar-panel">
                            <label className="visually-hidden" htmlFor="sidebar-new-room">
                              Channel name
                            </label>
                            <input
                              id="sidebar-new-room"
                              className="discord-panel-input discord-sidebar-panel-input"
                              placeholder="New channel name"
                              value={newRoomName}
                              onChange={(e) => onNewRoomName(e.target.value)}
                              autoFocus
                            />
                            <div className="discord-sidebar-panel-row">
                              <button type="button" className="btn small primary" onClick={handleCreateSubmit}>
                                Create
                              </button>
                              <button type="button" className="btn small secondary" onClick={cancelRoomPanel}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {roomAction === 'join' ? (
                          <div className="discord-sidebar-panel">
                            <label className="visually-hidden" htmlFor="sidebar-join-room">
                              Channel to join
                            </label>
                            <input
                              id="sidebar-join-room"
                              className="discord-panel-input discord-sidebar-panel-input"
                              placeholder="Name or id to join"
                              value={joinRoomId}
                              onChange={(e) => onJoinRoomId(e.target.value)}
                              autoFocus
                            />
                            <div className="discord-sidebar-panel-row">
                              <button type="button" className="btn small primary" onClick={handleJoinSubmit}>
                                Join
                              </button>
                              <button type="button" className="btn small secondary" onClick={cancelRoomPanel}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <div className="discord-userbar">
                          <div className="discord-userbar-card">
                            <div className="discord-avatar" aria-hidden>
                              {(displayName || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="discord-userbar-text">
                              <span className="discord-userbar-name">{displayName}</span>
                              <span className="discord-userbar-sub">Online</span>
                            </div>
                            <div className="discord-userbar-icons">
                              <span className="material-symbols-outlined discord-userbar-icon" title="Mute">
                                mic
                              </span>
                              <span className="material-symbols-outlined discord-userbar-icon" title="Deafen">
                                headphones
                              </span>
                              <span className="material-symbols-outlined discord-userbar-icon" title="Settings">
                                settings
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>

                    <div className="discord-main">
                      <header className="discord-top">
                        <div className="discord-top-row">
                          <div className="discord-top-title">
                            <span className="discord-top-hash" aria-hidden>
                              #
                            </span>
                            <h2 className="discord-top-channel">
                              {selectedRoom ? selectedRoom.name : 'select-a-channel'}
                            </h2>
                            {selectedRoom ? (
                              <button
                                type="button"
                                className={`discord-copy-name${copyNameOk ? ' discord-copy-name--ok' : ''}`}
                                onClick={handleCopyRoomName}
                                disabled={!selectedRoom.name}
                                title={copyNameOk ? 'Copied' : 'Copy room name'}
                                aria-label={copyNameOk ? 'Copied' : 'Copy room name'}
                              >
                                <span className="material-symbols-outlined discord-copy-name-icon">
                                  {copyNameOk ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                        {!selectedRoom ? (
                          <p className="discord-top-hint">Pick a text channel from the list to open the message view.</p>
                        ) : null}
                      </header>

                      <div className="discord-imessage-host">
                        <section className="chat-pane chat-pane-imessage">
                      <div className="messages imessage-thread">
                        {!selectedRoomId ? (
                          <div className="imessage-empty">Select a room to read messages</div>
                        ) : (messages || []).length === 0 ? (
                          <div className="imessage-empty">No messages yet — say hello.</div>
                        ) : (
                          (messages || []).map((m, i) => {
                            const list = messages || []
                            const isSelf =
                              displayName &&
                              m.username &&
                              m.username.toLowerCase() === displayName.toLowerCase()
                            const prev = i > 0 ? list[i - 1] : null
                            const stacked = prev && prev.username === m.username
                            return (
                              <div
                                key={m.id}
                                className={`imessage-row${isSelf ? ' imessage-row--self' : ' imessage-row--other'}${stacked ? ' imessage-row--stacked' : ''}`}
                              >
                                <div className="imessage-stack">
                                  {!isSelf && !stacked ? (
                                    <span className="imessage-sender">{m.username}</span>
                                  ) : null}
                                  <div
                                    className={`imessage-bubble${isSelf ? ' imessage-bubble--self' : ' imessage-bubble--other'}`}
                                  >
                                    <div className="imessage-text">{m.body}</div>
                                  </div>
                                  <time className="imessage-time" dateTime={new Date(m.created_at).toISOString()}>
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </time>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      {ctfBanner ? (
                        <div
                          className={`ctf-banner${ctfBanner.variant === 'win' ? ' ctf-banner--win' : ' ctf-banner--armed'}`}
                          role="status"
                        >
                          {ctfBanner.text}
                        </div>
                      ) : null}
                      <form
                        className="composer imessage-composer"
                        onSubmit={(e) => {
                          e.preventDefault()
                          onSend()
                        }}
                      >
                        <input
                          className="imessage-composer-field"
                          placeholder={selectedRoomId ? 'Message' : 'Select a room'}
                          value={draft}
                          onChange={(e) => onDraft(e.target.value)}
                          disabled={!selectedRoomId}
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          className="imessage-send"
                          disabled={!selectedRoomId || !draft.trim()}
                          aria-label="Send"
                        >
                          <span className="material-symbols-outlined imessage-send-icon">arrow_upward</span>
                        </button>
                      </form>
                        </section>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
