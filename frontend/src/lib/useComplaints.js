import { useEffect, useState, useCallback, useRef } from 'react'
import { listComplaints, USE_MOCK } from './api'

export function useComplaints() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const alive = useRef(true)
  const refresh = useCallback(async (silent = false) => {
    const quiet = silent === true
    if (!quiet) setLoading(true)
    try { const d = await listComplaints(); if (alive.current) { setData(d); setError(null) } }
    catch (e) { if (alive.current) setError(e) }
    finally { if (alive.current && !quiet) setLoading(false) }
  }, [])
  useEffect(() => {
    alive.current = true
    refresh()
    // Real backend: live data - har 30s me chupchap refresh, aur tab wapas khulne par
    let t, onVis
    if (!USE_MOCK) {
      t = setInterval(() => refresh(true), 30000)
      onVis = () => { if (document.visibilityState === 'visible') refresh(true) }
      document.addEventListener('visibilitychange', onVis)
    }
    return () => { alive.current = false; clearInterval(t); if (onVis) document.removeEventListener('visibilitychange', onVis) }
  }, [refresh])
  return { complaints: data, loading, error, refresh }
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso)) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); return `${d}d ago`
}
