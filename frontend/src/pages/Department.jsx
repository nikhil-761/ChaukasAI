import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Upload, Loader2, CheckCircle2, PlayCircle } from 'lucide-react'
import { useComplaints, timeAgo } from '../lib/useComplaints'
import { updateStatus, resolveComplaint } from '../lib/api'
import { SeverityBadge, StatusPill, CategoryTag } from '../components/Badges'
import BeforeAfter from '../components/BeforeAfter'
import { Spot } from '../components/fx'
import { useLang } from '../lib/i18n'

export default function Department() {
  const { complaints, loading, refresh } = useComplaints()
  const { tr, tx } = useLang()
  const depts = useMemo(() => [...new Set(complaints.map((c) => c.department.name))], [complaints])
  const [dept, setDept] = useState('')
  const [tab, setTab] = useState('open')
  const [busyId, setBusyId] = useState(null)
  const [verified, setVerified] = useState(null)
  const fileRef = useRef(null)
  const [pendingId, setPendingId] = useState(null)

  const active = dept || depts[0]
  const list = complaints
    .filter((c) => c.department.name === active && (tab === 'open' ? c.status !== 'resolved' : c.status === 'resolved'))
    .sort((a, b) => b.severity.score - a.severity.score)

  const [err, setErr] = useState('')
  const fail = (e) => setErr(e?.status === 0 ? tr('Cannot reach the server.', 'सर्वर से कनेक्ट नहीं हो पा रहा।') : (e?.message || tr('Something went wrong.', 'कुछ गड़बड़ हुई।')))
  const start = async (id) => { setBusyId(id); setErr(''); try { await updateStatus(id, 'in_progress'); await refresh() } catch (e) { fail(e) } finally { setBusyId(null) } }
  const pickAfter = (id) => { setPendingId(id); fileRef.current?.click() }
  const onAfter = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f || !pendingId) return
    setBusyId(pendingId); setErr('')
    try {
      const r = await resolveComplaint(pendingId, f)
      await refresh(); setVerified(r)
    } catch (e) { fail(e) } finally { setBusyId(null) }
  }

  return (
    <div className="container-x py-6 sm:py-10">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onAfter} />
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fadeUp">
        <div>
          <h1 className="h-display text-3xl sm:text-5xl">{tr('Department', 'विभाग')} <span className="gradient-text">{tr('panel', 'पैनल')}</span></h1>
          <p className="mt-2 max-w-xl text-sm text-mute">{tr('Complaints routed to your department, sorted by AI priority. Close an issue by uploading an after-photo.', 'आपके विभाग को भेजी गई शिकायतें, AI प्राथमिकता के क्रम में। बाद की फ़ोटो अपलोड करके शिकायत बंद करें।')}</p>
        </div>
        <div className="relative" data-tour="dept-select">
          <Landmark size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <select className="input !pl-10 !pr-8" value={active || ''} onChange={(e) => setDept(e.target.value)}>
            {depts.map((d) => <option key={d} value={d}>{tx(d)}</option>)}
          </select>
        </div>
      </div>

      <div data-tour="dept-tabs" className="mt-6 inline-flex rounded-2xl border border-ink/10 bg-ink/[.05] p-1 text-sm font-semibold">
        {[['open', tr('Open queue', 'खुली शिकायतें')], ['done', tr('Resolved', 'हल हुई')]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 transition ${tab === k ? 'bg-brand-500 text-white shadow-[0_0_20px_-4px_rgba(47,128,255,.8)]' : 'text-mute hover:text-fg'}`}>{l}</button>)}
      </div>

      {err && <div role="alert" className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm text-red-300">{err}</div>}
      {verified && (
        <div className="mt-6 animate-fadeUp">
          <div className="mb-3 flex items-center justify-between"><div className={`flex items-center gap-2 text-sm font-bold ${verified.status === 'resolved' ? 'text-emerald-300' : 'text-amber-300'}`}><CheckCircle2 size={17} /> {verified.complaint_id} {verified.status === 'resolved' ? tr('verified and closed by AI', 'AI ने सत्यापित कर बंद किया') : tr('NOT closed - AI could not confirm the fix. Upload a clearer after-photo of the same spot.', 'बंद नहीं हुई - AI फिक्स की पुष्टि नहीं कर पाया। उसी जगह की साफ़ बाद की फ़ोटो डालें।')}</div><button className="text-xs text-dim underline" onClick={() => setVerified(null)}>{tr('Dismiss', 'हटाएँ')}</button></div>
          <BeforeAfter c={verified} />
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {list.map((c, i) => (
          <Spot key={c.complaint_id} data-tour={i === 0 ? "dept-card" : undefined} className="card animate-fadeUp p-4 sm:p-5" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><SeverityBadge level={c.severity.level} score={c.severity.score} /><CategoryTag category={c.analysis.category} /></div>
              <StatusPill status={c.status} />
            </div>
            <div className="mt-3 font-display text-lg font-bold leading-snug">{tx(c.analysis.problem)}</div>
            <div className="mt-0.5 text-sm text-dim">{tx(c.location.area)} · {timeAgo(c.created_at)} · {c.complaint_id}</div>
            <ul className="mt-3 flex flex-wrap gap-1.5">{c.severity.reasons.map((r) => <li key={r} className="rounded-lg bg-ink/[.07] px-2 py-1 text-[11px] text-mute">{tx(r)}</li>)}</ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.status === 'submitted' && <button className="btn-ghost btn-sm" onClick={() => start(c.complaint_id)} disabled={busyId === c.complaint_id}><PlayCircle size={15} /> {tr('Start work', 'काम शुरू करें')}</button>}
              {c.status !== 'resolved' && (
                <button className="btn-primary btn-sm" onClick={() => pickAfter(c.complaint_id)} disabled={busyId === c.complaint_id}>
                  {busyId === c.complaint_id ? <><Loader2 size={15} className="animate-spin" /> {tr('AI verifying...', 'AI जाँच रहा है...')}</> : <><Upload size={15} /> {tr('Upload after-photo', 'बाद की फ़ोटो डालें')}</>}
                </button>
              )}
              <Link to={`/track/${c.complaint_id}`} className="btn-ghost btn-sm">{tr('View', 'देखें')}</Link>
            </div>
          </Spot>
        ))}
        {!list.length && !loading && <div className="card col-span-full p-12 text-center text-sm text-mute">{tr('Nothing here. Great job!', 'यहाँ कुछ नहीं बचा। बहुत बढ़िया!')}</div>}
      </div>
    </div>
  )
}
