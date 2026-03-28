import jwt from 'jsonwebtoken'

export function signUserToken(userId, secret) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '24h' })
}

export function verifyUserToken(token, secret) {
  try {
    const p = jwt.verify(token, secret)
    const id = p && typeof p.sub === 'string' ? p.sub : null
    return id || null
  } catch {
    return null
  }
}
