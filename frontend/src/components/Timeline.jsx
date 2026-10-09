import { Check, Circle } from 'lucide-react'
import { timeAgo } from '../lib/useComplaints'
import { useLang } from '../lib/i18n'

export function buildTimeline(c, tr = (e) => e, tx = (s) => s) {
  const t0 = new Date(c.created_at).getTime()
  return [
    { title: tr('Complaint submitted', 'शिकायत दर्ज हुई'), at: c.created_at, done: true },
    { title: tr('AI analysis and severity scoring', 'AI जाँच और गंभीरता स्कोर'), at: new Date(t0 + 20000).toISOString(), done: true },
    { title: `${tr('Routed to', 'भेजा गया')} ${tx(c.department.name)}`, at: new Date(t0 + 40000).toISOString(), done: true },
    { title: tr('Work in progress', 'काम जारी है'), at: null, done: c.status === 'in_progress' || c.status === 'resolved' },
    { title: tr('Resolved and verified by AI', 'हल हुआ और AI ने सत्यापित किया'), at: c.resolution?.resolved_at, done: c.status === 'resolved' },
  ]
}

export default function Timeline({ c }) {
  const { tr, tx } = useLang()
  const steps = buildTimeline(c, tr, tx)
  return (
    <ol className="relative space-y-6">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex animate-fadeUp gap-3.5" style={{ animationDelay: `${i * 110}ms` }}>
          {i < steps.length - 1 && <span className={`absolute left-[13px] top-8 h-[calc(100%-6px)] w-0.5 rounded ${s.done && steps[i + 1].done ? 'bg-brand-500' : 'bg-ink/10'}`} />}
          <span className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ${s.done ? 'bg-brand-500 text-white ' : 'border border-ink/15 bg-canvas text-dim'}`}>
            {s.done ? <Check size={14} strokeWidth={3} /> : <Circle size={7} />}
          </span>
          <div className="pb-1">
            <div className={`text-sm font-semibold ${s.done ? 'text-fg' : 'text-dim'}`}>{s.title}</div>
            {s.at && s.done && <div className="text-xs text-dim">{timeAgo(s.at)}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
