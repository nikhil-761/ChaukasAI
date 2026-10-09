import { useEffect, useState } from 'react'

let deferred = null
const listeners = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferred = e; listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()) })
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

export function usePWAInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  const install = async () => {
    if (!deferred) return false
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null; listeners.forEach((l) => l())
    return outcome === 'accepted'
  }
  return { canInstall: !!deferred && !isStandalone(), install, standalone: isStandalone(), ios: isIOS() }
}

export function registerSW() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
