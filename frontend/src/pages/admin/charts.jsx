import { SEVERITY, CATEGORIES } from '../../lib/constants'
import { useLang } from '../../lib/i18n'

const BRAND = '#2F80FF'
const MINT = '#1DD3B0'
const TRACK = 'rgb(var(--fg) / .10)'
const TEXT = 'rgb(var(--dim))'

const dayKey = (d) => new Date(d).toISOString().slice(0, 10)

/** Last 14 days: reported vs resolved (grouped bars) */
export function TrendChart({ complaints }) {
  const { tr } = useLang()
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 86400000); return dayKey(d) })
  const rep = Object.fromEntries(days.map((d) => [d, 0]))
  const res = Object.fromEntries(days.map((d) => [d, 0]))
  complaints.forEach((c) => {
    const a = dayKey(c.created_at); if (a in rep) rep[a]++
    const b = c.resolution?.resolved_at && dayKey(c.resolution.resolved_at); if (b && b in res) res[b]++
  })
  const max = Math.max(3, ...days.map((d) => Math.max(rep[d], res[d])))
  const W = 560, H = 170, pb = 24, pt = 8, bw = 12, gap = (W - 14 * (bw * 2 + 4)) / 14
  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-mute">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: BRAND }} />{tr('Reported', 'दर्ज')}</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: MINT }} />{tr('Resolved', 'हल हुई')}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="14 day trend">
        {[0, 0.5, 1].map((t) => <line key={t} x1="0" x2={W} y1={pt + (H - pb - pt) * (1 - t)} y2={pt + (H - pb - pt) * (1 - t)} stroke={TRACK} strokeDasharray="3 4" />)}
        {days.map((d, i) => {
          const x = i * (bw * 2 + 4 + gap) + gap / 2
          const h1 = ((H - pb - pt) * rep[d]) / max, h2 = ((H - pb - pt) * res[d]) / max
          return (
            <g key={d}>
              <rect x={x} y={H - pb - h1} width={bw} height={Math.max(h1, 1)} rx="3" fill={BRAND}><title>{`${d}: ${rep[d]}`}</title></rect>
              <rect x={x + bw + 2} y={H - pb - h2} width={bw} height={Math.max(h2, 1)} rx="3" fill={MINT}><title>{`${d}: ${res[d]}`}</title></rect>
              {i % 2 === 0 && <text x={x + bw} y={H - 6} textAnchor="middle" fontSize="10" fill={TEXT}>{d.slice(8)}</text>}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Severity donut */
export function SeverityDonut({ complaints }) {
  const { tr, lang } = useLang()
  const keys = Object.keys(SEVERITY)
  const counts = keys.map((k) => complaints.filter((c) => c.severity.level === k).length)
  const total = counts.reduce((a, b) => a + b, 0) || 1
  const R = 52, C = 2 * Math.PI * R
  let off = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke={TRACK} strokeWidth="16" />
        {keys.map((k, i) => {
          const len = (counts[i] / total) * C
          const el = <circle key={k} cx="70" cy="70" r={R} fill="none" stroke={SEVERITY[k].color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} strokeDashoffset={-off} />
          off += len
          return el
        })}
        <text x="70" y="76" textAnchor="middle" fontSize="26" fontWeight="800" fill="rgb(var(--fg))" transform="rotate(90 70 70)">{complaints.length}</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {keys.map((k, i) => (
          <li key={k} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY[k].color }} /><span className="text-mute">{lang === 'hi' ? SEVERITY[k].hi : SEVERITY[k].label}</span><b className="ml-auto pl-4">{counts[i]}</b></li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal bars (categories / cities / depts) */
export function BarList({ rows, color = BRAND }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm"><span className="truncate pr-2 text-mute">{r.label}</span><b>{r.value}{r.suffix || ''}</b></div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: TRACK }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.color || color }} /></div>
        </li>
      ))}
      {!rows.length && <li className="text-sm text-dim">-</li>}
    </ul>
  )
}

export function categoryRows(complaints, lang) {
  return Object.entries(CATEGORIES).map(([k, v]) => ({ label: `${v.emoji} ${lang === 'hi' ? v.hi : v.label}`, value: complaints.filter((c) => c.analysis.category === k).length })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value)
}
