import { useEffect, useRef, useState } from 'react'
import { useInView, useTween, prefersReducedMotion, isFinePointer } from '../lib/hooks'

/** Scroll reveal wrapper */
export function Reveal({ as: Tag = 'div', delay = 0, y = 24, className = '', children, ...rest }) {
  const [ref, on] = useInView({ threshold: 0.12 })
  return (
    <Tag ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms`, '--y': `${y}px` }} {...rest}>
      {children}
    </Tag>
  )
}

/** Mouse-follow spotlight card */
export function Spot({ as: Tag = 'div', className = '', children, ...rest }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return <Tag onMouseMove={onMove} className={`spot ${className}`} {...rest}>{children}</Tag>
}

/** Magnetic hover (desktop only) */
export function Magnetic({ children, strength = 0.25, className = '' }) {
  const ref = useRef(null)
  const move = (e) => {
    if (!isFinePointer() || prefersReducedMotion()) return
    const el = ref.current; const r = el.getBoundingClientRect()
    el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px)`
  }
  const leave = () => { if (ref.current) ref.current.style.transform = '' }
  return (
    <span ref={ref} onMouseMove={move} onMouseLeave={leave} className={`inline-block transition-transform duration-200 ease-out ${className}`}>{children}</span>
  )
}

/** Count-up when scrolled into view */
export function CountUp({ value, duration = 1400, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const [ref, on] = useInView({ threshold: 0.3 })
  const v = useTween(on ? value : 0, duration, on)
  return <span ref={ref} className={className}>{prefix}{v.toFixed(decimals)}{suffix}</span>
}

/** Animated aurora blobs (theme aware via CSS vars) */
export function Aurora({ className = '' }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] animate-aurora1 rounded-full bg-brand-500 blur-[130px]" style={{ opacity: 'var(--blob-a)' }} />
      <div className="absolute -right-32 top-20 h-[30rem] w-[30rem] animate-aurora2 rounded-full bg-cyan2 blur-[130px]" style={{ opacity: 'var(--blob-b)' }} />
      <div className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] animate-aurora3 rounded-full bg-mint blur-[140px]" style={{ opacity: 'var(--blob-c)' }} />
    </div>
  )
}

/** Constellation particles that react to the pointer */
export function Particles({ count = 56, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduce = prefersReducedMotion()
    let w = 0, h = 0, raf = 0, visible = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const mouse = { x: -999, y: -999 }
    let pts = []
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(count * Math.min(1, (w * h) / (1200 * 700)) + 14)
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.5 }))
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const light = document.documentElement.getAttribute('data-theme') === 'light'
      const dot = light ? 'rgba(37,99,235,.55)' : 'rgba(170,205,255,.75)'
      const lineRGB = light ? '37,99,235' : '120,170,255'
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        if (!reduce) {
          p.x += p.vx; p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy
          if (d2 < 130 * 130) { const f = (1 - Math.sqrt(d2) / 130) * 0.9; p.x += (dx / 130) * f * 2; p.y += (dy / 130) * f * 2 }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = dot; ctx.fill()
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy
          if (d < 115 * 115) { ctx.strokeStyle = `rgba(${lineRGB},${(1 - Math.sqrt(d) / 115) * 0.3})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke() }
        }
      }
    }
    const loop = () => { if (visible && !document.hidden) draw(); raf = requestAnimationFrame(loop) }
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top }
    const onLeave = () => { mouse.x = mouse.y = -999 }
    resize(); draw()
    if (!reduce) raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(resize); ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave) }
  }, [count])
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />
}

/** Headline that reveals word by word */
export function WordReveal({ text, className = '', start = 0, step = 70, gradientFrom = -1 }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="word-mask mr-[.22em]">
          <span className={gradientFrom >= 0 && i >= gradientFrom ? 'gradient-text' : ''} style={{ animationDelay: `${start + i * step}ms` }}>{w}</span>
        </span>
      ))}
    </span>
  )
}

/** Typing effect */
export function Typewriter({ text, speed = 38, active = true, className = '' }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) { setN(0); return undefined }
    if (prefersReducedMotion()) { setN(text.length); return undefined }
    setN(0)
    const id = setInterval(() => setN((x) => { if (x >= text.length) { clearInterval(id); return x } return x + 1 }), speed)
    return () => clearInterval(id)
  }, [text, speed, active])
  return <span className={className}>{text.slice(0, n)}<span className="ml-px inline-block w-[2px] animate-blink bg-current align-middle" style={{ height: '1em' }} /></span>
}

/** 3D hover tilt with glare (desktop); static on touch */
export function Tilt({ as: Tag = 'div', max = 8, className = '', children, ...rest }) {
  const ref = useRef(null)
  const move = (e) => {
    if (!isFinePointer() || prefersReducedMotion()) return
    const el = ref.current; const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max * 1.4}deg) translateZ(6px)`
    el.style.setProperty('--mx', `${px * r.width}px`); el.style.setProperty('--my', `${py * r.height}px`)
  }
  const leave = () => { if (ref.current) ref.current.style.transform = '' }
  return <Tag ref={ref} onMouseMove={move} onMouseLeave={leave} className={`spot transition-transform duration-200 ease-out will-change-transform ${className}`} {...rest}>{children}</Tag>
}
