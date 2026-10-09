import { useEffect, useRef, useState, useCallback } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** true jab element viewport mein aa jaye (ek baar) */
export function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!('IntersectionObserver' in window)) { setInView(true); return undefined }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: options.threshold ?? 0.2, rootMargin: options.rootMargin ?? '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, []) // eslint-disable-line
  return [ref, inView]
}

/** smooth number tween (ease-out) */
export function useTween(target, ms = 900, enabled = true) {
  const [val, setVal] = useState(enabled ? 0 : target)
  const from = useRef(enabled ? 0 : target)
  useEffect(() => {
    if (!enabled) { setVal(target); from.current = target; return undefined }
    if (prefersReducedMotion()) { setVal(target); from.current = target; return undefined }
    let raf
    const start = performance.now()
    const a = from.current
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (target - a) * e
      setVal(v); from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, enabled])
  return val
}

/** 0..1 progress of element crossing the viewport (start: top hits 85% vh, end: bottom hits 40% vh) */
export function useScrollProgress(onChange) {
  const ref = useRef(null)
  const cb = useRef(onChange)
  cb.current = onChange
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let raf = 0
    const calc = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = (vh * 0.85 - r.top) / (r.height + vh * 0.35)
      cb.current(Math.max(0, Math.min(1, p)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return ref
}

export function useScrolled(threshold = 12) {
  const [s, setS] = useState(false)
  useEffect(() => {
    const on = () => setS(window.scrollY > threshold)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [threshold])
  return s
}

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false)
    window.addEventListener('online', a); window.addEventListener('offline', b)
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b) }
  }, [])
  return on
}

export function useInterval(fn, ms, active = true) {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => {
    if (!active || ms == null) return undefined
    const id = setInterval(() => saved.current(), ms)
    return () => clearInterval(id)
  }, [ms, active])
}

export const useStable = (fn) => useCallback(fn, []) // eslint-disable-line
