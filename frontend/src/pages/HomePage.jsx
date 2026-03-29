import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="nexus-home">
      <header className="nexus-topbar">
        <div className="nexus-topbar-left">
          <h1 className="nexus-title-gradient">Chat transport lab</h1>
          <span className="nexus-topbar-rule" aria-hidden />
          <span className="nexus-status">
            <span className="nexus-status-dot" />
            Shared store online
          </span>
        </div>
      </header>

      <div className="nexus-canvas nexus-canvas-home">
        <div className="nexus-glow" aria-hidden />

        <section className="nexus-hero nexus-hero-compact">
          <h2 className="nexus-hero-title nexus-hero-title-center">
            Pick a page <span className="nexus-hero-accent">(new tab)</span>
          </h2>
          <p className="nexus-hero-lead nexus-hero-lead-center">
            Same SQLite rooms on the server — <strong>with Sira</strong> (WebSocket dispatch) or <strong>without Sira</strong>{' '}
            (plain REST + JWT). Name your rooms, share the room name to join, and open each mode in its own tab to compare.
          </p>
        </section>

        <div className="nexus-home-cards">
          <Link
            to="/chat/sira"
            target="_blank"
            rel="noopener noreferrer"
            className="nexus-home-card glass-panel specular-edge card-sira"
          >
            <div className="nexus-bento-head">
              <span className="nexus-bento-label text-secondary">With Sira</span>
              <span className="material-symbols-outlined nexus-bento-icon text-secondary">smart_toy</span>
            </div>
            <h3 className="nexus-bento-title">Sira chat</h3>
            <p className="nexus-bento-desc">
              Everything goes through <code>dispatch</code> on the Sira wire (handshake + WebSocket).
            </p>
            <span className="nexus-bento-cta nexus-cta-sira">
              Open in new tab
              <span className="material-symbols-outlined">open_in_new</span>
            </span>
          </Link>

          <Link
            to="/chat/rest"
            target="_blank"
            rel="noopener noreferrer"
            className="nexus-home-card glass-panel specular-edge card-rest"
          >
            <div className="nexus-bento-head">
              <span className="nexus-bento-label text-primary">Without Sira</span>
              <span className="material-symbols-outlined nexus-bento-icon text-primary">hub</span>
            </div>
            <h3 className="nexus-bento-title">REST chat</h3>
            <p className="nexus-bento-desc">
              Classic <code>/api/v1</code> JSON, Bearer JWT — no Sira transport.
            </p>
            <span className="nexus-bento-cta nexus-cta-rest">
              Open in new tab
              <span className="material-symbols-outlined">open_in_new</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
