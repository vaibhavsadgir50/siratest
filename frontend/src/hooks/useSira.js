import { useCallback, useEffect, useRef, useState } from 'react'
import { Sira } from '../lib/sira.js'

export function useSira() {
  const siraRef = useRef(null)
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const sira = new Sira({
      host: window.location.host,
      secure: window.location.protocol === 'https:',
    })
    siraRef.current = sira

    ;(async () => {
      try {
        setPhase('connecting')
        await sira.open({ persistent: true })
        if (cancelled) return
        const token = localStorage.getItem('lifeCanvasToken')
        if (token) {
          try {
            await sira.refreshAuth(token)
          } catch {
            localStorage.removeItem('lifeCanvasToken')
          }
        }
        if (cancelled) return
        setPhase('ready')
        setError(null)
      } catch (e) {
        if (!cancelled) {
          setError(String(e.message || e))
          setPhase('error')
        }
      }
    })()

    return () => {
      cancelled = true
      sira.close().catch(() => {})
      siraRef.current = null
    }
  }, [])

  const send = useCallback(async (action) => {
    const s = siraRef.current
    if (!s) throw new Error('Sira not ready')
    return s.send(action)
  }, [])

  const refreshAuth = useCallback(async (token) => {
    const s = siraRef.current
    if (!s) throw new Error('Sira not ready')
    await s.refreshAuth(token)
  }, [])

  return { phase, error, send, refreshAuth, ready: phase === 'ready' }
}
