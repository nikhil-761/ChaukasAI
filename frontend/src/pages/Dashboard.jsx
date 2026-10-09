import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertOctagon, CheckCircle2, Timer, RefreshCw, Filter, MapPin } from 'lucide-react'
import { useComplaints, timeAgo } from '../lib/useComplaints'
import { computeStats, resetDemoData, USE_MOCK } from '../lib/api'
import { SEVERITY, CATEGORIES, CITIES } from '../lib/constants'
import StatCard from '../components/StatCard'
import MapView from '../components/MapView'
import { Reveal, Spot } from '../components/fx'
import { SeverityBadge, StatusPill, CategoryTag } from '../components/Badges'
import { useInView } from '../lib/hooks'
import { useLang } from '../lib/i18n'

const Chip = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${active ? 'border-brand-400/60 bg-brand-500 text-white ' : 'border-ink/10 bg-ink/[.05] text-mute hover:bg-ink/10'}`}>{children}</button>
)

function Bar({ rate }) {
  const [ref, on] = useInView()
  return <div ref={ref} className="h-2.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-brand-500 transition-all duration-[1400ms] ease-out" style={{ width: on ? `${rate}%` : '0%' }} /></div>
}

export default function Dashboard() {
  const { complaints, loading, refresh } = useComplaints()
  const { tr, tx, lang } = useLang()
  const [city, setCity] = useState('roorkee')
  const [sev, setSev] = useState('ALL')
  const [cat, setCat] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const inCity = useMemo(() => complaints.filter((c) => c.city === city), [complaints, city])
  const filtered = useMemo(
    () => inCity.filter((c) => (sev === 'ALL' || c.severity.level === sev) && (cat === 'ALL' || c.analysis.category === cat) && (status === 'ALL' || (status === 'open' ? c.status !== 'resolved' : c.status === 'resolved')))
      .sort((a, b) => b.severity.score - a.severity.score || new Date(b.created_at) - new Date(a.created_at)),
    [inCity, sev, cat, status]
  )
  const stats = computeStats(inCity)
  const sel = filtered.find((c) => c.complaint_id === selected)

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <span className="eyebrow"><span className="h-2 w-2 rounded-full bg-emerald-600" />{tr('Live', 'लाइव')}</span>
          <h1 className="h-display mt-3 text-3xl sm:text-5xl">{tr('City', 'शहर')} <span className="gradient-text">{tr('dashboard', 'डैशबोर्ड')}</span></h1>
          <p className="mt-2 text-sm text-mute">{tr('Priority map and accountability for', 'प्राथमिकता नक्शा और जवाबदेही:')} {tx(CITIES[city].name)}. <span className="text-dim">{tr('Demo uses seeded sample data.', 'डेमो में सैंपल डेटा है।')}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl border border-ink/10 bg-ink/[.05] p-1 text-sm font-semibold">
            {Object.entries(CITIES).map(([k, v]) => (
              <button key={k} onClick={() => { setCity(k); setSelected(null) }} className={`rounded-xl px-3.5 py-2 transition ${city === k ? 'bg-brand-500 text-white ' : 'text-mute hover:text-fg'}`}>{tx(v.name)}</button>
            ))}
          </div>
          <button className="btn-ghost !p-3" onClick={refresh} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div data-tour="dash-stats" className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Activity} label={tr('Open issues', 'खुली शिकायतें')} value={stats.open} hint={`${stats.total} ${tr('total reported', 'कुल दर्ज')}`} />
        <StatCard icon={AlertOctagon} label={tr('Critical open', 'अति गंभीर खुली')} value={stats.critical} hint={tr('Needs immediate action', 'तुरंत कार्रवाई चाहिए')} tone="red" />
        <StatCard icon={CheckCircle2} label={tr('Resolution rate', 'समाधान दर')} value={stats.rate} suffix="%" hint={`${stats.resolved} ${tr('verified fixes', 'सत्यापित समाधान')}`} tone="green" />
        <StatCard icon={Timer} label={tr('Avg closure', 'औसत समय')} value={stats.avgHours} suffix={stats.avgHours ? 'h' : ''} display={stats.avgHours ? undefined : '-'} hint={tr('Report to verified fix', 'शिकायत से सत्यापित समाधान तक')} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div data-tour="dash-filters" className="card p-3.5 sm:p-4">
            <div className="label flex items-center gap-2"><Filter size={12} /> {tr('Filters', 'फ़िल्टर')}</div>
            <div className="scroll-hide flex gap-2 overflow-x-auto pb-1">
              <Chip active={sev === 'ALL'} onClick={() => setSev('ALL')}>{tr('All severity', 'सभी गंभीरता')}</Chip>
              {Object.entries(SEVERITY).map(([k, v]) => <Chip key={k} active={sev === k} onClick={() => setSev(k)}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: v.color }} />{lang === 'hi' ? v.hi : v.label}</Chip>)}
            </div>
            <div className="scroll-hide mt-2 flex gap-2 overflow-x-auto pb-1">
              <Chip active={cat === 'ALL'} onClick={() => setCat('ALL')}>{tr('All types', 'सभी प्रकार')}</Chip>
              {Object.entries(CATEGORIES).filter(([k]) => k !== 'other').map(([k, v]) => <Chip key={k} active={cat === k} onClick={() => setCat(k)}>{lang === 'hi' ? v.hi : v.label}</Chip>)}
            </div>
            <div className="scroll-hide mt-2 flex gap-2 overflow-x-auto">
              {[['ALL', tr('Any status', 'कोई भी स्थिति')], ['open', tr('Open', 'खुली')], ['resolved', tr('Resolved', 'हल हुई')]].map(([k, l]) => <Chip key={k} active={status === k} onClick={() => setStatus(k)}>{l}</Chip>)}
            </div>
          </div>

          <div data-tour="dash-map" className="card relative p-1.5">
            <MapView complaints={filtered} center={CITIES[city].center} zoom={13} height={460} selectedId={selected} onSelect={setSelected}
              flyTo={sel ? [sel.location.lat, sel.location.lng] : CITIES[city].center} rounded="rounded-lg" />
            <div className="pointer-events-none absolute bottom-5 left-5 hidden rounded-2xl border border-ink/10 bg-canvas/80 px-3.5 py-2.5 text-[11px] font-semibold  sm:block">
              <div className="flex gap-3.5">{Object.entries(SEVERITY).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }} />{lang === 'hi' ? v.hi : v.label}</span>)}</div>
            </div>
          </div>

          <Reveal className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{tr('Department scoreboard', 'विभाग स्कोरबोर्ड')}</h2><span className="text-xs text-dim">{tr('Resolution rate', 'समाधान दर')}</span></div>
            <div className="space-y-5">
              {stats.scoreboard.map((d) => (
                <div key={d.name}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-mute">{tx(d.name)}</span><span className="font-bold">{d.rate}% <span className="font-normal text-dim">({d.resolved}/{d.total})</span></span></div>
                  <Bar rate={d.rate} />
                </div>
              ))}
              {!stats.scoreboard.length && <p className="text-sm text-dim">{tr('No data yet.', 'अभी कोई डेटा नहीं।')}</p>}
            </div>
          </Reveal>
        </div>

        <div data-tour="dash-queue" className="card flex max-h-[1060px] min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-bold">{tr('Priority queue', 'प्राथमिकता सूची')}</h2>
            <span className="text-xs text-dim">{filtered.length} {tr('issues', 'शिकायतें')}</span>
          </div>
          <ul className="divide-y divide-ink/[.07] overflow-y-auto">
            {filtered.map((c) => (
              <li key={c.complaint_id}>
                <button onClick={() => setSelected(c.complaint_id)} className={`block w-full px-5 py-4 text-left transition hover:bg-ink/[.05] ${selected === c.complaint_id ? 'bg-brand-500/10' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <SeverityBadge level={c.severity.level} score={c.severity.score} />
                    <StatusPill status={c.status} />
                  </div>
                  <div className="mt-2.5 line-clamp-1 text-sm font-semibold">{tx(c.analysis.problem)}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-dim"><MapPin size={12} />{tx(c.location.area)}<span className="mx-1">·</span>{timeAgo(c.created_at)}</div>
                  {selected === c.complaint_id && (
                    <div className="mt-2.5 flex animate-fadeIn items-center justify-between"><CategoryTag category={c.analysis.category} /><Link to={`/track/${c.complaint_id}`} className="text-xs font-bold text-brand-300">{tr('Details', 'विवरण')} →</Link></div>
                  )}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="p-10 text-center text-sm text-dim">{tr('No issues match these filters.', 'इन फ़िल्टर से कोई शिकायत नहीं मिली।')}</li>}
          </ul>
        </div>
      </div>
      {USE_MOCK && <button onClick={() => { resetDemoData(); refresh() }} className="mt-6 text-xs text-dim underline">{tr('Reset demo data', 'डेमो डेटा रीसेट करें')}</button>}
    </div>
  )
}
