import { ShieldCheck, School, Repeat, Route, Siren, Brain, Landmark } from 'lucide-react'
import { SeverityBadge, CategoryTag } from './Badges'
import Gauge from './Gauge'
import { SEVERITY } from '../lib/constants'
import { useTween } from '../lib/hooks'
import { useLang } from '../lib/i18n'

const iconFor = (r) =>
  /school|hospital/i.test(r) ? School : /report|citizen/i.test(r) ? Repeat : /road/i.test(r) ? Route : /safety/i.test(r) ? Siren : Brain

// Explainable AI card: gauge + confidence + evidence + reasons
export default function ExplainCard({ c }) {
  const { tr, tx } = useLang()
  const sev = SEVERITY[c.severity.level]
  const pct = Math.round(c.analysis.confidence * 100)
  const conf = useTween(pct, 1100)
  return (
    <div className="card">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-[90px]" style={{ background: `${sev.color}33` }} />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
        <div>
          <div className="label !mb-0.5">{tr('Complaint ID', 'शिकायत ID')}</div>
          <div className="font-display text-2xl font-extrabold tracking-tight">{c.complaint_id}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2"><CategoryTag category={c.analysis.category} /><SeverityBadge level={c.severity.level} score={c.severity.score} size="lg" /></div>
      </div>

      <div className="relative grid gap-8 p-5 sm:p-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="label">{tr('What AI found', 'AI को क्या मिला')}</div>
          <p className="font-display text-lg font-bold leading-snug">{tx(c.analysis.problem)}</p>
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-ink/10 bg-ink/[.04] p-3.5">
            <div className="relative h-14 w-14 shrink-0">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3.500" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#cg)" strokeWidth="3.500" strokeLinecap="round" strokeDasharray={`${(conf / 100) * 97.4} 97.4`} />
                <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5AA2FF" /><stop offset="1" stopColor="#22D3EE" /></linearGradient></defs>
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{Math.round(conf)}%</span>
            </div>
            <div><div className="text-sm font-semibold">{tr('Detection confidence', 'पहचान का भरोसा')}</div><div className="text-xs text-dim">{tr('Vision agent · conservative mode', 'Vision एजेंट · सावधान मोड')}</div></div>
          </div>
          <div className="label mt-6">{tr('Visual evidence', 'फ़ोटो से सबूत')}</div>
          <ul className="space-y-2">
            {c.analysis.evidence.map((e, i) => (
              <li key={e} className="flex animate-fadeUp items-start gap-2.5 text-sm text-mute" style={{ animationDelay: `${i * 120 + 200}ms` }}><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />{tx(e)}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="label">{tr('Why this severity', 'यह गंभीरता क्यों')}</div>
          <Gauge score={c.severity.score} size={230} />
          <ul className="mt-6 space-y-2">
            {c.severity.reasons.map((r, i) => {
              const Icon = iconFor(r)
              return (
                <li key={r} className="flex animate-fadeUp items-center gap-3 rounded-2xl border border-ink/10 bg-ink/[.04] px-3.5 py-2.5 text-sm text-mute" style={{ animationDelay: `${i * 130 + 300}ms` }}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300"><Icon size={15} /></span>{tx(r)}
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm">
            <Landmark size={18} className="shrink-0 text-brand-300" />
            <div><span className="text-dim">{tr('Routed to', 'भेजा गया')} </span><span className="font-semibold">{tx(c.department.name)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
