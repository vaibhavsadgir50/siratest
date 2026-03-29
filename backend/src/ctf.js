import { randomInt } from 'node:crypto'

const WORDS = [
  'amber', 'beacon', 'cipher', 'delta', 'ember', 'frost', 'glyph', 'harbor', 'ivory', 'jade',
  'kernel', 'lumen', 'matrix', 'nexus', 'orbit', 'prism', 'quartz', 'ridge', 'signal', 'trace',
  'vector', 'winter', 'zenith', 'anchor', 'bridge', 'coral', 'drift', 'echo', 'flint', 'gravity',
  'haven', 'index', 'jupiter', 'keystone', 'lattice', 'meridian', 'nova', 'oasis', 'pulse', 'quiver',
  'radius', 'summit', 'tangent', 'umbra', 'vessel', 'willow', 'xylem', 'yield', 'zephyr', 'atlas',
  'binary', 'chrome', 'daemon',
]

function pickPhrase() {
  const parts = []
  const used = new Set()
  while (parts.length < 5) {
    const w = WORDS[randomInt(WORDS.length)]
    if (!used.has(w)) {
      used.add(w)
      parts.push(w)
    }
  }
  return parts.join(' ')
}

export function createCtfStore(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ctf_challenge (
      user_id TEXT PRIMARY KEY,
      phrase TEXT NOT NULL,
      armed_at INTEGER NOT NULL
    );
  `)

  const upsert = db.prepare(`
    INSERT INTO ctf_challenge (user_id, phrase, armed_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET phrase = excluded.phrase, armed_at = excluded.armed_at
  `)
  const getPhrase = db.prepare('SELECT phrase FROM ctf_challenge WHERE user_id = ?')

  function arm(userId) {
    const phrase = pickPhrase()
    upsert.run(userId, phrase, Date.now())
    console.log('[ctf] test started', { userId })
    return { phrase }
  }

  function matches(userId, body) {
    const row = getPhrase.get(userId)
    if (!row?.phrase) return false
    return String(body || '').trim().toLowerCase() === row.phrase.toLowerCase()
  }

  return { arm, matches }
}
