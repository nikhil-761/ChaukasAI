import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MapPin, AlertTriangle } from 'lucide-react'
import PhotoPlaceholder from './PhotoPlaceholder'
import { prefersReducedMotion } from '../lib/hooks'
import { useLang } from '../lib/i18n'

// Before/After slider + AI verdict. Auto-sweeps once so people notice it is draggable.
export default function BeforeAfter({ c }) {
  const { tr, tx } = useLang()
  const [pos, setPos] = useState(50)
  const touched = useRef(false)
  const r = c.resolution
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    let raf, t0
    const tick = (t) => {
      if (touched.current) return
      t0 ??= t
      const p = (t - t0) / 2200
      if (p >= 1) { setPos(50); return }
      setPos(50 + Math.sin(p * Math.PI * 2) * 38)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [c?.complaint_id])
  if (!r) return null
  const ok = r.verdict === 'resolved'
  const before = c.image_url ? <img src={c.image_url} alt="Before" className="h-full w-full object-cover" /> : <PhotoPlaceholder category={c.analysis.category} className="h-full w-full" />
  const after = r.after_image_url ? <img src={r.after_image_url} alt="After" className="h-full w-full object-cover" /> : <PhotoPlaceholder category={c.analysis.category} tone="after" className="h-full w-full" />
  return (
    <div className="card">
      <div className="relative aspect-[16/10] select-none">
        <div className="absolute inset-0">{after}</div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{before}</div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white " style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm font-bold text-brand-700 ">⇆</span>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white ">{tr('BEFORE', 'पहले')}</span>
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white">{tr('AFTER', 'बाद में')}</span>
        <input aria-label="Compare before and after" type="range" min="0" max="100" value={pos}
          onPointerDown={() => { touched.current = true }} onChange={(e) => { touched.current = true; setPos(+e.target.value) }}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 p-4 text-sm">
        <span className={`chip ${ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
          {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {tr('AI verdict:', 'AI का फ़ैसला:')} {tr(r.verdict.replace('_', ' '), ok ? 'हल हुआ' : 'अभी ठीक नहीं')} · {Math.round(r.confidence * 100)}%
        </span>
        <span className="text-mute">{tx(r.reason)}</span>
        {r.gps_distance_m != null && <span className="inline-flex items-center gap-1 text-dim"><MapPin size={14} />{r.gps_distance_m} {tr('m from original spot', 'मी. मूल जगह से')}</span>}
      </div>
    </div>
  )
}
