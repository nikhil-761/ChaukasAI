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
export function Spot({ as: Tag = 'div', className = '', children, ...rest }) { return <Tag className={className} {...rest}>{children}</Tag> }

/** (plain) */
export function Magnetic({ children, className = '' }) { return <span className={`inline-block ${className}`}>{children}</span> }

/** Count-up when scrolled into view */
export function CountUp({ value, duration = 1400, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const [ref, on] = useInView({ threshold: 0.3 })
  const v = useTween(on ? value : 0, duration, on)
  return <span ref={ref} className={className}>{prefix}{v.toFixed(decimals)}{suffix}</span>
}

export function Aurora() { return null }

export function Particles() { return null }

export function WordReveal({ text, className = '' }) { return <span className={className}>{text}</span> }

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

export function Tilt({ as: Tag = 'div', className = '', children, ...rest }) { return <Tag className={className} {...rest}>{children}</Tag> }
