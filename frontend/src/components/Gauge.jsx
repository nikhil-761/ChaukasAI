import { useTween } from '../lib/hooks'
import { SEVERITY, levelFromScore } from '../lib/constants'
import { useLang } from '../lib/i18n'

// Semicircle severity gauge. score: 0-10
export default function Gauge({ score = 0, size = 220, animate = true, label = true }) {
  const { lang } = useLang()
  const v = useTween(score, 1100, animate)
  const level = levelFromScore(Math.round(v))
  const color = SEVERITY[level].color
  const L = Math.PI * 80
  const angle = -90 + (v / 10) * 180
  return (
    <div className="relative mx-auto" style={{ width: size }}>
      <svg viewBox="0 0 200 124" className="block w-full overflow-visible" style={{ height: size * 0.62 }}>
        <defs>
          <filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgb(var(--ink) / .12)" strokeWidth="14" strokeLinecap="round" />
        {/* zone ticks */}
        {[3.5, 6.5, 8.5].map((t) => {
          const a = (-180 + (t / 10) * 180) * (Math.PI / 180)
          return <line key={t} x1={100 + Math.cos(a) * 70} y1={100 + Math.sin(a) * 70} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="#05070F" strokeWidth="2.5" />
        })}
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - v / 10)} opacity=".55" filter="url(#gl)" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - v / 10)} />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
          <line x1="100" y1="100" x2="100" y2="34" stroke="rgb(var(--fg))" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="8" fill="rgb(var(--panel))" stroke="rgb(var(--fg))" strokeWidth="3" />
      </svg>
      {label && (
        <div className="-mt-1 text-center">
          <div className="font-display text-4xl font-bold leading-none tracking-tight">{Math.round(v)}<span className="text-lg font-bold text-dim">/10</span></div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[.22em]" style={{ color }}>{lang === 'hi' ? SEVERITY[level].hi : SEVERITY[level].label}</div>
        </div>
      )}
    </div>
  )
}
