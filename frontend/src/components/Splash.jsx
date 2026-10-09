import { useEffect, useState } from 'react'
import Logo from './Logo'

// App open hone par ek baar (per session) cinematic splash
export default function Splash() {
  const [phase, setPhase] = useState(() => {
    try { return sessionStorage.getItem('chaukas.splash') ? 'gone' : 'show' } catch { return 'gone' }
  })
  useEffect(() => {
    if (phase !== 'show') return undefined
    try { sessionStorage.setItem('chaukas.splash', '1') } catch {}
    const t1 = setTimeout(() => setPhase('out'), 1500)
    const t2 = setTimeout(() => setPhase('gone'), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])
  if (phase === 'gone') return null
  return (
    <div className={`fixed inset-0 z-[100] grid place-items-center bg-canvas transition-opacity duration-500 ${phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="absolute h-[28rem] w-[28rem] rounded-full bg-brand-600/30 blur-[120px]" />
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="absolute -inset-5 h-[calc(100%+2.5rem)] w-[calc(100%+2.5rem)] -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#sg)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="283" style={{ animation: 'splashRing 1.3s cubic-bezier(.3,.7,.2,1) both' }} />
            <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F80FF" /><stop offset="1" stopColor="#22D3EE" /></linearGradient></defs>
          </svg>
          <div className="animate-pop"><Logo className="h-20 w-20" glow /></div>
        </div>
        <div className="mt-8 animate-fadeUp text-center" style={{ animationDelay: '.35s' }}>
          <div className="font-display text-3xl font-extrabold tracking-tight">Chaukas <span className="gradient-text">AI</span></div>
          <div className="mt-1.5 text-xs font-medium tracking-[.28em] text-dim">SHIKAYAT SE SAMAADHAN TAK</div>
        </div>
      </div>
    </div>
  )
}
