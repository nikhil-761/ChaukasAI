// Admin login (DEMO). Asli deployment me ye check backend par hona chahiye (JWT).
// .env me VITE_ADMIN_USER / VITE_ADMIN_PASS set karke credentials badal sakte ho.
import { useCallback, useState } from 'react'
import { logAudit, USE_MOCK } from './api'

const USER = import.meta.env.VITE_ADMIN_USER || 'admin'
const PASS = import.meta.env.VITE_ADMIN_PASS || 'Chaukas@2026'
const KEY = 'chaukas-admin'
const TTL = 8 * 3600 * 1000

export const DEMO_HINT = { user: USER, pass: PASS, show: !import.meta.env.VITE_ADMIN_PASS }

function read() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (s && Date.now() - s.at < TTL) return s
  } catch {}
  return null
}

export function useAdminAuth() {
  const [session, setSession] = useState(read)
  const login = useCallback(async (user, pass) => {
    let ok = user.trim() === USER && pass === PASS
    let token = ''
    if (!USE_MOCK) {
      // real backend: POST /api/admin/login {username,password} -> {token}
      try {
        const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.trim(), password: pass }) })
        ok = r.ok
        if (ok) token = (await r.json()).token || ''
      } catch { ok = false }
    }
    if (!ok) return false
    const s = { user: user.trim(), at: Date.now(), token }
    try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch {}
    setSession(s)
    logAudit({ actor: s.user, action: 'Admin login' })
    return true
  }, [])
  const logout = useCallback(() => {
    try { sessionStorage.removeItem(KEY) } catch {}
    setSession(null)
  }, [])
  return { admin: session, login, logout }
}
