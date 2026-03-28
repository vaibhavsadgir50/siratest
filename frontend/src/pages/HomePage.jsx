import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="home">
      <h1>Sira vs REST — chat test</h1>
      <p className="lead">
        Two similar chat clients backed by the same SQLite store. Pick a transport to compare: everything on the left
        goes through <strong>Sira</strong> only; everything on the right uses a conventional <strong>REST + JWT</strong>{' '}
        API.
      </p>
      <p className="lead subtle">
        Anyone on any device can join the same room if they use the same deployed site URL: open a chat, select the room,
        use <strong>Copy invite link</strong>, or share the room id or name after signing in.
      </p>
      <nav className="home-cards">
        <Link to="/chat/sira" className="home-card sira">
          <h2>Sira chat</h2>
          <p>All operations: <code>dispatch</code> over the Sira wire (encrypted WebSocket after handshake).</p>
          <span className="cta">Open →</span>
        </Link>
        <Link to="/chat/rest" className="home-card rest">
          <h2>REST chat</h2>
          <p>
            <code>/api/v1</code> JSON, Authorization Bearer JWT, bcrypt, rate-limited auth, standard security headers.
          </p>
          <span className="cta">Open →</span>
        </Link>
      </nav>
    </div>
  )
}
