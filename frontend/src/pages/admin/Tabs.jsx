import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, RotateCcw, Download, Trash2, Server, Database, ShieldCheck, FileJson, Flag, ScanSearch } from 'lucide-react'
import MapView from '../../components/MapView'
import { SeverityBadge } from '../../components/Badges'
import { useLang } from '../../lib/i18n'
import { SEVERITY, CITIES, CATEGORIES } from '../../lib/constants'
import { fetchAudit, adminHealth, resetDemoData, USE_MOCK } from '../../lib/api'
import { deptStats, isOverdue, needsReview, timeAgo, fmtDate, download, toCSV, closureHours } from './util'

const Panel = ({ title, sub, children, className = '' }) => (
  <div className={`card p-4 sm:p-6 ${className}`}>
    <div className="mb-4 flex items-baseline justify-between gap-2"><h3 className="font-display text-lg font-bold">{title}</h3>{sub && <span className="text-xs text-dim">{sub}</span>}</div>
    {children}
  </div>
)

/* ---------------- DEPARTMENTS ---------------- */
export function DepartmentsTab({ complaints, openFiltered }) {
  const { tr, tx } = useLang()
  const rows = deptStats(complaints)
  const overdue = complaints.filter(isOverdue).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return (
    <div className="space-y-5">
      <Panel title={tr('Department performance', 'विभाग का प्रदर्शन')} sub={tr('Sorted by workload', 'काम के हिसाब से')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-ink/10 text-[11px] uppercase tracking-widest text-dim">
              <th className="py-2.5 pr-3">{tr('Department', 'विभाग')}</th><th className="px-2">{tr('Total', 'कुल')}</th><th className="px-2">{tr('Open', 'खुली')}</th><th className="px-2">{tr('Critical', 'अति गंभीर')}</th><th className="px-2">{tr('Overdue', 'देरी')}</th><th className="px-2">{tr('Avg fix', 'औसत समय')}</th><th className="pl-2">{tr('Rate', 'दर')}</th>
            </tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.name} className="border-b border-ink/[.06]">
                  <td className="py-3 pr-3 font-medium">{tx(d.name)}</td><td className="px-2">{d.total}</td><td className="px-2">{d.open}</td>
                  <td className={`px-2 font-bold ${d.critical ? 'text-red-400' : ''}`}>{d.critical}</td><td className={`px-2 font-bold ${d.overdue ? 'text-amber-400' : ''}`}>{d.overdue}</td>
                  <td className="px-2 text-mute">{d.avg != null ? `${d.avg}h` : '-'}</td>
                  <td className="pl-2"><div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-brand-500" style={{ width: `${d.rate}%` }} /></div><b>{d.rate}%</b></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={tr('Overdue complaints (SLA > 7 days)', 'देरी वाली शिकायतें (SLA > 7 दिन)')} sub={`${overdue.length}`}>
        <ul className="divide-y divide-ink/[.07]">
          {overdue.slice(0, 12).map((c) => (
            <li key={c.complaint_id}><button onClick={() => openFiltered(c.complaint_id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-3 text-left hover:bg-ink/[.04]">
              <b className="w-16 text-sm">{c.complaint_id}</b><SeverityBadge level={c.severity.level} score={c.severity.score} />
              <span className="min-w-0 flex-1 basis-44 truncate text-sm text-mute">{tx(c.analysis.problem)}</span><span className="text-xs text-mute">{tx(c.department.name)}</span><span className="text-xs font-bold text-red-400">{timeAgo(c.created_at)}</span>
            </button></li>
          ))}
          {!overdue.length && <li className="py-6 text-center text-sm text-dim">{tr('Nothing overdue.', 'कोई देरी नहीं।')}</li>}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------------- AI AUDIT ---------------- */
export function AuditTab({ complaints, open, act }) {
  const { tr, tx } = useLang()
  const resolved = complaints.filter((c) => c.resolution)
  const flagged = (c) => c.resolution.confidence < 0.9 || c.resolution.gps_distance_m > 50
  const lowConf = complaints.filter((c) => c.analysis.confidence < 0.85)
  const avgDet = complaints.length ? Math.round((complaints.reduce((a, c) => a + c.analysis.confidence, 0) / complaints.length) * 100) : 0
  const avgRes = resolved.length ? Math.round((resolved.reduce((a, c) => a + c.resolution.confidence, 0) / resolved.length) * 100) : 0
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[tr('Avg detection confidence', 'औसत पहचान भरोसा'), `${avgDet}%`], [tr('Avg verification confidence', 'औसत सत्यापन भरोसा'), `${avgRes}%`], [tr('Low-confidence detections', 'कम भरोसे वाली पहचान'), lowConf.length], [tr('Verifications to double-check', 'दोबारा जाँचने लायक सत्यापन'), resolved.filter(flagged).length]].map(([k, v]) => (
          <div key={k} className="card p-4"><div className="label !mb-1">{k}</div><div className="font-display text-3xl font-bold">{v}</div></div>
        ))}
      </div>
      <Panel title={tr('Resolution verifications', 'समाधान सत्यापन')} sub={tr('Amber = confidence < 90% or GPS > 50 m from the original spot', 'पीला = भरोसा < 90% या मूल जगह से GPS > 50 मी.')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead><tr className="border-b border-ink/10 text-[11px] uppercase tracking-widest text-dim"><th className="py-2.5">ID</th><th>{tr('Verdict', 'फ़ैसला')}</th><th>{tr('AI confidence', 'AI भरोसा')}</th><th>{tr('GPS gap', 'GPS अंतर')}</th><th>{tr('Closed in', 'समय')}</th><th>{tr('Reason', 'कारण')}</th><th /></tr></thead>
            <tbody>
              {resolved.map((c) => {
                const f = flagged(c)
                return (
                  <tr key={c.complaint_id} className="border-b border-ink/[.06]">
                    <td className="py-3 font-bold"><button onClick={() => open(c.complaint_id)} className="underline-offset-2 hover:underline">{c.complaint_id}</button></td>
                    <td><span className={`chip ${c.resolution.verdict === 'resolved' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{c.resolution.verdict.replace('_', ' ')}</span></td>
                    <td className={f && c.resolution.confidence < 0.9 ? 'font-bold text-amber-400' : ''}>{Math.round(c.resolution.confidence * 100)}%</td>
                    <td className={c.resolution.gps_distance_m > 50 ? 'font-bold text-amber-400' : ''}>{c.resolution.gps_distance_m != null ? `${c.resolution.gps_distance_m} m` : '-'}</td>
                    <td className="text-mute">{Math.round(closureHours(c) || 0)}h</td>
                    <td className="max-w-[220px] truncate text-mute">{tx(c.resolution.reason)}</td>
                    <td className="text-right"><button className="btn-ghost btn-sm" onClick={() => act(c.complaint_id, { status: 'in_progress' }, 'Reopened after audit')}><RotateCcw size={13} /> {tr('Reopen', 'फिर खोलें')}</button></td>
                  </tr>
                )
              })}
              {!resolved.length && <tr><td colSpan="7" className="p-8 text-center text-dim">{tr('No verified resolutions yet.', 'अभी कोई सत्यापित समाधान नहीं।')}</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={tr('Low-confidence detections', 'कम भरोसे वाली पहचान')} sub={tr('AI confidence < 85% - worth a human look', 'AI भरोसा < 85% - इंसानी जाँच ज़रूरी')}>
        <ul className="divide-y divide-ink/[.07]">
          {lowConf.map((c) => (
            <li key={c.complaint_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
              <button onClick={() => open(c.complaint_id)} className="w-16 text-left font-bold hover:underline">{c.complaint_id}</button>
              <span className="min-w-0 flex-1 basis-44 truncate text-mute">{tx(c.analysis.problem)}</span>
              <b className="text-amber-400">{Math.round(c.analysis.confidence * 100)}%</b>
              <button className="btn-ghost btn-sm" onClick={() => act(c.complaint_id, { flagged: !c.flagged }, c.flagged ? 'Removed review flag' : 'Flagged for review')}><Flag size={13} /> {c.flagged ? tr('Unflag', 'फ़्लैग हटाएँ') : tr('Flag', 'फ़्लैग')}</button>
              <button className="btn-ghost btn-sm" onClick={() => act(c.complaint_id, { status: 'rejected' }, 'Rejected (AI doubt)')}>{tr('Reject', 'अस्वीकार')}</button>
            </li>
          ))}
          {!lowConf.length && <li className="py-6 text-center text-sm text-dim">{tr('All detections are confident.', 'सारी पहचान भरोसेमंद हैं।')}</li>}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------------- MAP ---------------- */
export function MapTab({ complaints, open }) {
  const { tr, tx, lang } = useLang()
  const [city, setCity] = useState('roorkee')
  const [sel, setSel] = useState(null)
  const list = complaints.filter((c) => c.city === city && c.status !== 'rejected')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl border border-ink/10 bg-ink/[.05] p-1 text-sm font-semibold">{Object.entries(CITIES).map(([k, v]) => <button key={k} onClick={() => setCity(k)} className={`rounded-xl px-3.5 py-2 ${city === k ? 'bg-brand-500 text-white' : 'text-mute hover:text-fg'}`}>{tx(v.name)}</button>)}</div>
        <div className="flex flex-wrap gap-3 text-xs">{Object.entries(SEVERITY).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />{lang === 'hi' ? v.hi : v.label}</span>)}</div>
        <span className="ml-auto text-xs text-dim">{list.length} {tr('pins', 'पिन')}</span>
      </div>
      <div className="card p-1.5"><MapView complaints={list} center={CITIES[city].center} zoom={13} height={560} selectedId={sel} onSelect={(id) => { setSel(id); }} flyTo={CITIES[city].center} rounded="rounded-lg" /></div>
      {sel && <div className="card flex items-center justify-between p-4"><b>{sel}</b><button className="btn-primary btn-sm" onClick={() => open(sel)}>{tr('Open details', 'विवरण खोलें')}</button></div>}
    </div>
  )
}

/* ---------------- ACTIVITY ---------------- */
export function ActivityTab({ complaints, tick }) {
  const { tr } = useLang()
  const [audit, setAudit] = useState([])
  useEffect(() => { let live = true; fetchAudit().then((a) => { if (live) setAudit(a) }); return () => { live = false } }, [tick, complaints])
  const system = complaints.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15).map((c) => ({ at: c.created_at, actor: 'citizen', action: `New complaint (${c.analysis.category})`, id: c.complaint_id }))
  const res = complaints.filter((c) => c.resolution?.resolved_at).map((c) => ({ at: c.resolution.resolved_at, actor: 'AI', action: `Verified fix (${Math.round(c.resolution.confidence * 100)}%)`, id: c.complaint_id }))
  const all = [...audit.map((a) => ({ ...a, admin: true })), ...system, ...res].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 60)
  return (
    <Panel title={tr('Activity log', 'गतिविधि लॉग')} sub={tr('Admin actions, new complaints and AI verifications', 'एडमिन कार्रवाई, नई शिकायतें और AI सत्यापन')}>
      <ul className="divide-y divide-ink/[.07]">
        {all.map((a, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
            <span className={`chip ${a.admin ? 'bg-brand-500/15 text-brand-300' : a.actor === 'AI' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-ink/10 text-mute'}`}>{a.actor}</span>
            <span className="min-w-0 flex-1 basis-44">{a.action}{a.id && <b className="ml-1.5">{a.id}</b>}</span>
            <span className="text-xs text-dim">{fmtDate(a.at)} · {timeAgo(a.at)}</span>
          </li>
        ))}
        {!all.length && <li className="py-8 text-center text-sm text-dim">-</li>}
      </ul>
    </Panel>
  )
}

/* ---------------- SYSTEM ---------------- */
export function SystemTab({ complaints, refresh }) {
  const { tr } = useLang()
  const [health, setHealth] = useState(null)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { adminHealth().then(setHealth) }, [])
  let bytes = 0
  try { for (const k of Object.keys(localStorage)) bytes += (localStorage.getItem(k) || '').length } catch {}
  const rules = [
    [tr('AI damage score (1-10, from photo)', 'AI नुकसान स्कोर (1-10, फ़ोटो से)'), 'base'], [tr('School or hospital within 200 m', '200 मी. में स्कूल/अस्पताल'), '+2'], [tr('2-3 repeat reports', '2-3 दोहराई शिकायतें'), '+1'], [tr('4 or more repeat reports', '4 या ज़्यादा दोहराई'), '+2'],
    [tr('Main road', 'मुख्य सड़क'), '+1'], [tr('Safety words in note', 'नोट में सुरक्षा शब्द'), '+1'], [tr('Open manhole / live wire', 'खुला मैनहोल / करंट वाला तार'), tr('always Critical', 'हमेशा अति गंभीर')],
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
        <Panel title={tr('System status', 'सिस्टम स्थिति')}>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><Server size={16} className="text-brand-300" /><span className="text-mute">{tr('Data mode', 'डेटा मोड')}</span><b className="ml-auto">{USE_MOCK ? tr('Demo (browser storage)', 'डेमो (ब्राउज़र स्टोरेज)') : tr('Live API', 'लाइव API')}</b></li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-brand-300" /><span className="text-mute">{tr('Backend health', 'बैकएंड हेल्थ')}</span>
              <b className={`ml-auto flex items-center gap-1.5 ${health?.ok ? 'text-emerald-400' : 'text-red-400'}`}>{health ? (health.ok ? <><CheckCircle2 size={15} />{USE_MOCK ? tr('Not needed in demo', 'डेमो में ज़रूरी नहीं') : `OK · ${health.ms} ms`}</> : <><AlertTriangle size={15} />{tr('Unreachable', 'नहीं पहुँच रहा')}</>) : '...'}</b></li>
            {!USE_MOCK && health?.db && <li className="flex items-center gap-3"><Database size={16} className="text-brand-300" /><span className="text-mute">{tr('Database', 'डेटाबेस')}</span><b className="ml-auto">{health.db.type === 'mongodb' ? 'MongoDB' : tr('Local file DB', 'लोकल फ़ाइल DB')}</b></li>}
            {!USE_MOCK && health?.ai && <li className="flex items-center gap-3"><ScanSearch size={16} className="text-brand-300" /><span className="text-mute">{tr('AI model', 'AI मॉडल')}</span><b className={`ml-auto ${health.ai.configured ? '' : 'text-red-400'}`}>{health.ai.configured ? health.ai.model : tr('API key missing', 'API key नहीं मिली')}</b></li>}
            <li className="flex items-center gap-3"><Database size={16} className="text-brand-300" /><span className="text-mute">{tr('Complaints stored', 'सेव शिकायतें')}</span><b className="ml-auto">{complaints.length}</b></li>
            {USE_MOCK && <li className="flex items-center gap-3"><Database size={16} className="text-brand-300" /><span className="text-mute">{tr('Browser storage used', 'ब्राउज़र स्टोरेज')}</span><b className="ml-auto">{(bytes / 1024).toFixed(1)} KB</b></li>}
          </ul>
        </Panel>
        <Panel title={tr('Data tools', 'डेटा टूल')}>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost btn-sm" onClick={() => download('chaukas-complaints.csv', toCSV(complaints), 'text/csv')}><Download size={14} /> CSV</button>
            <button className="btn-ghost btn-sm" onClick={() => download('chaukas-complaints.json', JSON.stringify(complaints, null, 2), 'application/json')}><FileJson size={14} /> JSON</button>
            <button className="btn-ghost btn-sm" onClick={async () => download('chaukas-audit-log.json', JSON.stringify(await fetchAudit(), null, 2), 'application/json')}><FileJson size={14} /> {tr('Audit log', 'ऑडिट लॉग')}</button>
          </div>
          <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/[.06] p-4">
            <div className="text-sm font-bold text-red-400">{tr('Danger zone', 'ख़तरे वाला हिस्सा')}</div>
            <p className="mt-1 text-xs text-mute">{tr('Reset demo data brings back the original 40 sample complaints and clears the activity log. Only for demo mode.', 'डेमो डेटा रीसेट करने पर मूल 40 सैंपल शिकायतें लौट आती हैं और गतिविधि लॉग साफ़ हो जाता है। सिर्फ़ डेमो मोड के लिए।')}</p>
            {!confirm
              ? <button className="btn-ghost btn-sm mt-3 !text-red-400" disabled={!USE_MOCK} onClick={() => setConfirm(true)}><Trash2 size={14} /> {tr('Reset demo data', 'डेमो डेटा रीसेट')}</button>
              : <div className="mt-3 flex items-center gap-2"><button className="rounded-xl bg-red-500 px-3.5 py-2 text-xs font-bold text-white" onClick={() => { resetDemoData(); refresh(); setConfirm(false) }}>{tr('Yes, reset', 'हाँ, रीसेट करें')}</button><button className="btn-ghost btn-sm" onClick={() => setConfirm(false)}>{tr('Cancel', 'रद्द')}</button></div>}
          </div>
        </Panel>
      </div>
      <Panel title={tr('Severity rules in use', 'लागू गंभीरता नियम')} sub={tr('Same rules the citizen sees', 'वही नियम जो नागरिक को दिखते हैं')}>
        <ul className="grid gap-2 sm:grid-cols-2">{rules.map(([k, v]) => <li key={k} className="flex items-center justify-between rounded-xl border border-ink/10 bg-ink/[.04] px-3.5 py-2.5 text-sm"><span className="text-mute">{k}</span><b className="text-amber-300">{v}</b></li>)}</ul>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">{Object.entries(SEVERITY).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} /><b>{v.label}</b> <span className="text-dim">{v.range}</span></span>)}</div>
      </Panel>
    </div>
  )
}
