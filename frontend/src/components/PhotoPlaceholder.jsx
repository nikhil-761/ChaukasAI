import { CATEGORIES } from '../lib/constants'
import { RoadPhoto, IMG } from './Photo'
import { T } from '../lib/i18n'

// Real photo na ho to illustrated scene dikhata hai
export default function PhotoPlaceholder({ category = 'other', label, tone = 'before', className = '' }) {
  const c = CATEGORIES[category] || CATEGORIES.other
  const after = tone === 'after'
  if (category === 'road_damage') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <RoadPhoto fixed={after} pos="68% 55%" className="absolute inset-0 h-full w-full" />
        {label && <span className="absolute bottom-2 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 "><T>{label}</T></span>}
      </div>
    )
  }
  const real = { streetlight: IMG.streetlight, water_leakage: IMG.water, garbage: IMG.garbage }[category]
  if (real && !after) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={real} alt={c.label} loading="lazy" decoding="async" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
        {label && <span className="absolute bottom-2 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 "><T>{label}</T></span>}
      </div>
    )
  }
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: after ? '#1d4a3a' : '#2b3446' }}>
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,.04) 14px 15px)' }} />
      <div className="relative text-center">
        <div className="text-sm font-bold text-white/80">{c.label}</div>
        {label && <div className="mt-1 text-[11px] font-bold uppercase tracking-[.2em] text-white/70"><T>{label}</T></div>}
      </div>
    </div>
  )
}
