import { useEffect, useState } from 'react'
import { X, Save, Trash2, Flag, MapPin, StickyNote, ExternalLink, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SeverityBadge, StatusPill, CategoryTag } from '../../components/Badges'
import ExplainCard from '../../components/ExplainCard'
import BeforeAfter from '../../components/BeforeAfter'
import Timeline from '../../components/Timeline'
import MapView from '../../components/MapView'
import PhotoPlaceholder from '../../components/PhotoPlaceholder'
import { useLang } from '../../lib/i18n'
import { STATUS, SEVERITY, levelFromScore } from '../../lib/constants'
import { fmtDate, ALL_DEPTS } from './util'

export default function Drawer({ c, onClose, act, remove, actor }) {
  const { tr, tx, lang } = useLang()
  const [status, setStatus] = useState(c.status)
  const [dept, setDept] = useState(c.department.name)
  const [score, setScore] = useState(c.severity.score)
  const [note, setNote] = useState('')
  const [letter, setLetter] = useState(lang)
  const [confirmDel, setConfirmDel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setStatus(c.status); setDept(c.department.name); setScore(c.severity.score); setNote(''); setConfirmDel(false) }, [c.complaint_id]) // eslint-disable-line
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', on); document.body.style.overflow = '' }
  }, [onClose])

  const depts = [...new Set([...ALL_DEPTS, c.department.name])]
  const changed = status !== c.status || dept !== c.department.name || score !== c.severity.score || note.trim()
  const save = async () => {
    setSaving(true)
    const patch = {}
    const parts = []
    if (status !== c.status) { patch.status = status; parts.push(`status ${c.status} → ${status}`) }
    if (dept !== c.department.name) { patch.department = { name: dept }; parts.push(`dept → ${dept}`) }
    if (score !== c.severity.score) {
      patch.severity = { score, reasons: [...c.severity.reasons.filter((r) => !r.startsWith('Admin override')), `Admin override: ${c.severity.score} → ${score}`] }
      parts.push(`severity ${c.severity.score} → ${score}`)
    }
    if (note.trim()) { patch.admin_notes = [...(c.admin_notes || []), { at: new Date().toISOString(), by: actor, text: note.trim() }]; parts.push('note added') }
    if (status === 'resolved' && c.status !== 'resolved') patch.keepResolution = true
    await act(c.complaint_id, patch, parts.join(', '))
    setSaving(false); setSaved(true); setNote(''); setTimeout(() => setSaved(false), 1600)
  }
  const flag = () => act(c.complaint_id, { flagged: !c.flagged }, c.flagged ? 'Removed review flag' : 'Flagged for review')

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-label="Complaint details">
      <div className="absolute inset-0 bg-black/60 " onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl animate-fadeIn flex-col border-l border-ink/10 bg-canvas shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-6" style={{ paddingTop: 'calc(12px + var(--safe-t))' }}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-bold">{c.complaint_id}</h2><StatusPill status={c.status} /><SeverityBadge level={c.severity.level} score={c.severity.score} />{c.flagged && <span className="chip bg-amber-500/15 text-amber-300"><Flag size={12} />{tr('Flagged', 'फ़्लैग')}</span>}</div>
            <div className="mt-0.5 truncate text-xs text-dim">{fmtDate(c.created_at)} · {tx(c.location.area)}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-ink/[.06] hover:text-fg"><X size={17} /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6" style={{ paddingBottom: 'calc(24px + var(--safe-b))' }}>
          <div className="card">
            {c.image_url ? <img src={c.image_url} alt="Reported issue" className="h-56 w-full object-cover" /> : <PhotoPlaceholder category={c.analysis.category} label="Reported photo" className="h-56" />}
            <div className="flex flex-wrap items-center gap-2 p-4"><CategoryTag category={c.analysis.category} /><span className="text-sm font-semibold">{tx(c.analysis.problem)}</span></div>
          </div>

          {/* ADMIN CONTROLS */}
          <div className="card border-brand-500/30 p-4 sm:p-5">
            <div className="label !mb-3 text-brand-300">{tr('Admin controls', 'एडमिन कंट्रोल')}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="st">{tr('Status', 'स्थिति')}</label>
                <select id="st" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{lang === 'hi' ? v.hi : v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="dp">{tr('Department', 'विभाग')}</label>
                <select id="dp" className="input" value={dept} onChange={(e) => setDept(e.target.value)}>{depts.map((d) => <option key={d} value={d}>{tx(d)}</option>)}</select>
              </div>
            </div>
            <div className="mt-4">
              <label className="label flex items-center justify-between" htmlFor="sv"><span>{tr('Severity override', 'गंभीरता बदलें')}</span><b className="text-fg" style={{ color: SEVERITY[levelFromScore(score)].color }}>{score}/10 · {lang === 'hi' ? SEVERITY[levelFromScore(score)].hi : SEVERITY[levelFromScore(score)].label}</b></label>
              <input id="sv" type="range" min="0" max="10" value={score} onChange={(e) => setScore(+e.target.value)} className="w-full accent-[#2F80FF]" />
            </div>
            <div className="mt-4">
              <label className="label flex items-center gap-1.5" htmlFor="nt"><StickyNote size={12} />{tr('Add internal note', 'आंतरिक नोट जोड़ें')}</label>
              <textarea id="nt" className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr('Visible only to admins...', 'सिर्फ़ एडमिन को दिखेगा...')} />
            </div>
            {(c.admin_notes || []).length > 0 && (
              <ul className="mt-3 space-y-2">
                {c.admin_notes.slice().reverse().map((n, i) => <li key={i} className="rounded-xl border border-ink/10 bg-ink/[.04] p-2.5 text-sm"><div className="text-[11px] text-dim">{n.by} · {fmtDate(n.at)}</div>{n.text}</li>)}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button className="btn-primary btn-sm" disabled={!changed || saving} onClick={save}><Save size={14} /> {saved ? tr('Saved', 'सेव हुआ') : saving ? '...' : tr('Save changes', 'बदलाव सेव करें')}</button>
              <button className="btn-ghost btn-sm" onClick={flag}><Flag size={14} /> {c.flagged ? tr('Remove flag', 'फ़्लैग हटाएँ') : tr('Flag for review', 'जाँच के लिए फ़्लैग')}</button>
              <Link className="btn-ghost btn-sm" to={`/track/${c.complaint_id}`}><ExternalLink size={14} /> {tr('Public view', 'पब्लिक व्यू')}</Link>
              <span className="ml-auto" />
              {!confirmDel
                ? <button className="btn-ghost btn-sm !text-red-400" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> {tr('Delete', 'हटाएँ')}</button>
                : <span className="flex items-center gap-2 text-xs"><span className="text-red-400">{tr('Delete permanently?', 'हमेशा के लिए हटाएँ?')}</span><button className="btn-sm rounded-xl bg-red-500 px-3 py-2 font-bold text-white" onClick={() => remove(c.complaint_id)}>{tr('Yes, delete', 'हाँ, हटाएँ')}</button><button className="btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>{tr('Cancel', 'रद्द')}</button></span>}
            </div>
          </div>

          <ExplainCard c={c} />

          <div className="grid gap-3 sm:grid-cols-3">
            {[[tr('School within', 'स्कूल पास'), c.context?.school_within_m ? `${c.context.school_within_m} m` : '-'], [tr('Repeat reports', 'दोहराई शिकायतें'), c.context?.duplicate_count ?? 0], [tr('Road type', 'सड़क'), c.context?.road_type || '-']].map(([k, v]) => (
              <div key={k} className="card p-3.5"><div className="label !mb-1">{k}</div><div className="font-display text-lg font-bold">{v}</div></div>
            ))}
          </div>

          <div className="card p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold"><FileText size={15} className="text-brand-300" />{tr('Dispatched letter', 'भेजा गया पत्र')}</div>
              <div className="flex rounded-xl bg-ink/[.07] p-1 text-xs font-bold">{[['en', 'English'], ['hi', 'हिंदी']].map(([k, l]) => <button key={k} onClick={() => setLetter(k)} className={`rounded-lg px-3 py-1 ${letter === k ? 'bg-brand-500 text-white' : 'text-mute'}`}>{l}</button>)}</div>
            </div>
            <div className="text-sm font-semibold">{c.complaint_text?.subject}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">{c.complaint_text?.[letter]}</p>
            <div className="mt-2 text-xs text-dim">→ {c.department.contact}</div>
          </div>

          {c.resolution && <BeforeAfter c={c} />}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="card p-4 sm:p-5"><div className="label">{tr('Progress', 'प्रगति')}</div><Timeline c={c} /></div>
            <div className="card p-3">
              <div className="label flex items-center gap-1.5 px-2 pt-1"><MapPin size={12} />{c.location.lat.toFixed(5)}, {c.location.lng.toFixed(5)}</div>
              <MapView complaints={[c]} center={[c.location.lat, c.location.lng]} zoom={15} height={220} rounded="rounded-2xl" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
