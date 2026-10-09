import { Activity, AlertOctagon, CheckCircle2, Timer, Inbox, Clock3, ScanSearch, CalendarClock, ArrowRight } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { SeverityBadge, StatusPill } from '../../components/Badges'
import { TrendChart, SeverityDonut, BarList, categoryRows } from './charts'
import { useLang } from '../../lib/i18n'
import { computeStats } from '../../lib/api'
import { CITIES } from '../../lib/constants'
import { isOverdue, needsReview, timeAgo, ageDays, deptStats } from './util'

const Panel = ({ title, sub, children, className = '' }) => (
  <div className={`card p-5 sm:p-6 ${className}`}>
    <div className="mb-4 flex items-baseline justify-between gap-2"><h3 className="font-display text-lg font-extrabold">{title}</h3>{sub && <span className="text-xs text-dim">{sub}</span>}</div>
    {children}
  </div>
)

export default function Overview({ complaints, go, open }) {
  const { tr, tx, lang } = useLang()
  const s = computeStats(complaints)
  const today = complaints.filter((c) => ageDays(c.created_at) < 1).length
  const overdue = complaints.filter(isOverdue)
  const review = complaints.filter(needsReview)
  const urgent = complaints.filter((c) => c.status !== 'resolved' && c.severity.level === 'CRITICAL').sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(0, 5)
  const depts = deptStats(complaints)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Inbox} label={tr('Total complaints', 'कुल शिकायतें')} value={s.total} hint={`${today} ${tr('in last 24h', 'पिछले 24 घंटे में')}`} />
        <StatCard icon={Activity} label={tr('Open', 'खुली')} value={s.open} hint={`${s.resolved} ${tr('resolved', 'हल')}`} tone="brand" />
        <StatCard icon={AlertOctagon} label={tr('Critical open', 'अति गंभीर खुली')} value={s.critical} hint={tr('Needs immediate action', 'तुरंत कार्रवाई चाहिए')} tone="red" />
        <StatCard icon={CheckCircle2} label={tr('Resolution rate', 'समाधान दर')} value={s.rate} suffix="%" hint={tr('Verified fixes only', 'सिर्फ़ सत्यापित')} tone="green" />
        <StatCard icon={Timer} label={tr('Avg closure', 'औसत समय')} value={s.avgHours} suffix={s.avgHours ? 'h' : ''} display={s.avgHours ? undefined : '-'} hint={tr('Report to verified fix', 'शिकायत से समाधान तक')} tone="amber" />
        <StatCard icon={CalendarClock} label={tr('Overdue (> 7 days)', 'देरी (> 7 दिन)')} value={overdue.length} hint={tr('Open for over a week', 'एक हफ़्ते से ज़्यादा खुली')} tone="red" />
        <StatCard icon={ScanSearch} label={tr('Needs AI review', 'AI जाँच ज़रूरी')} value={review.length} hint={tr('Low confidence or flagged', 'कम भरोसा या फ़्लैग')} tone="amber" />
        <StatCard icon={Clock3} label={tr('Departments', 'विभाग')} value={depts.length} hint={tr('Receiving complaints', 'शिकायतें पा रहे')} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title={tr('Last 14 days', 'पिछले 14 दिन')} sub={tr('Reported vs resolved', 'दर्ज बनाम हल')}><TrendChart complaints={complaints} /></Panel>
        <Panel title={tr('Severity mix', 'गंभीरता का मिश्रण')}><SeverityDonut complaints={complaints} /></Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-3">
        <Panel title={tr('By problem type', 'समस्या के प्रकार')}><BarList rows={categoryRows(complaints, lang)} /></Panel>
        <Panel title={tr('By city', 'शहर के अनुसार')}><BarList color="#1DD3B0" rows={Object.entries(CITIES).map(([k, v]) => ({ label: tx(v.name), value: complaints.filter((c) => c.city === k).length }))} /></Panel>
        <Panel title={tr('Department resolution rate', 'विभाग की समाधान दर')} sub="%"><BarList color="#F59E0B" rows={depts.slice(0, 6).map((d) => ({ label: tx(d.name), value: d.rate, suffix: '%' }))} /></Panel>
      </div>

      <Panel title={tr('Critical issues waiting longest', 'सबसे ज़्यादा इंतज़ार वाली अति गंभीर शिकायतें')} sub={<button className="inline-flex items-center gap-1 font-semibold text-brand-300" onClick={() => go('complaints')}>{tr('Open complaints', 'सभी शिकायतें')} <ArrowRight size={13} /></button>}>
        <ul className="divide-y divide-ink/[.07]">
          {urgent.map((c) => (
            <li key={c.complaint_id}>
              <button onClick={() => open(c.complaint_id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-3 text-left transition hover:bg-ink/[.04]">
                <b className="w-16 shrink-0 text-sm">{c.complaint_id}</b>
                <SeverityBadge level={c.severity.level} score={c.severity.score} />
                <span className="min-w-0 flex-1 basis-48 truncate text-sm text-mute">{tx(c.analysis.problem)} · {tx(c.location.area)}</span>
                <StatusPill status={c.status} />
                <span className="text-xs text-dim">{timeAgo(c.created_at)}</span>
              </button>
            </li>
          ))}
          {!urgent.length && <li className="py-6 text-center text-sm text-dim">{tr('No critical issue is open. Great!', 'कोई अति गंभीर शिकायत खुली नहीं है। बढ़िया!')}</li>}
        </ul>
      </Panel>
    </div>
  )
}
