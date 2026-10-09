import { SEVERITY, STATUS, CATEGORIES } from '../lib/constants'
import { useLang } from '../lib/i18n'

export function SeverityBadge({ level, score, size = 'md' }) {
  const { lang } = useLang()
  const s = SEVERITY[level] || SEVERITY.LOW
  return (
    <span className={`chip ring-1 ring-inset ${s.bg} ${s.text} ${s.ring} ${size === 'lg' ? '!px-3.5 !py-1.5 text-sm' : ''}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
      {lang === 'hi' ? s.hi : s.label}{score != null && <span className="opacity-70"> · {score}/10</span>}
    </span>
  )
}

export function StatusPill({ status }) {
  const { lang } = useLang()
  const s = STATUS[status] || STATUS.submitted
  return <span className={`chip ${s.cls}`}>{lang === 'hi' ? s.hi : s.label}</span>
}

export function CategoryTag({ category }) {
  const { lang } = useLang()
  const c = CATEGORIES[category] || CATEGORIES.other
  return <span className="chip bg-panel2 text-mute">{lang === 'hi' ? c.hi : c.label}</span>
}
