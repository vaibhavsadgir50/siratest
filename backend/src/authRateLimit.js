const WINDOW_MS = 60_000
const MAX_AUTH = 40

export function createAuthRateLimiter() {
  const buckets = new Map()

  function prune() {
    const now = Date.now()
    for (const [k, v] of buckets) {
      if (now - v.start > WINDOW_MS) buckets.delete(k)
    }
  }

  return function allow(ip) {
    prune()
    const now = Date.now()
    let b = buckets.get(ip)
    if (!b || now - b.start > WINDOW_MS) {
      b = { start: now, n: 0 }
      buckets.set(ip, b)
    }
    b.n += 1
    return b.n <= MAX_AUTH
  }
}
