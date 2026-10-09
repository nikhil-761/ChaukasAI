import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Search, MapPin, Landmark, Clock } from 'lucide-react'
import { getComplaint } from '../lib/api'
import { timeAgo } from '../lib/useComplaints'
import { SeverityBadge, StatusPill, CategoryTag } from '../components/Badges'
import Timeline from '../components/Timeline'
import BeforeAfter from '../components/BeforeAfter'
import ExplainCard from '../components/ExplainCard'
import PhotoPlaceholder from '../components/PhotoPlaceholder'
import { useLang } from '../lib/i18n'

export default function Track() {
  const { id } = useParams()
  const { tr, tx } = useLang()
  const nav = useNavigate()
  const [q, setQ] = useState(id || '')
  const [c, setC] = useState(null)
  const [state, setState] = useState('idle') // idle | loading | notfound | found

  useEffect(() => {
    if (!id) { setState('idle'); setC(null); return }
    setQ(id); setState('loading')
    let live = true
    getComplaint(id).then((r) => { if (live) { setC(r); setState(r ? 'found' : 'notfound') } }).catch(() => { if (live) setState('error') })
    return () => { live = false }
  }, [id])

  const go = (e) => { e.preventDefault(); if (q.trim()) nav(`/track/${q.trim().toUpperCase()}`) }

  return (
    <div className="container-x max-w-4xl py-6 sm:py-10">
      <div className="animate-fadeUp">
        <h1 className="h-display text-3xl sm:text-5xl">{tr('Track your', 'अपनी शिकायत')} <span className="gradient-text">{tr('complaint', 'ट्रैक करें')}</span></h1>
        <p className="mt-2 text-sm text-mute sm:text-base">{tr('Enter the complaint ID you received, for example', 'आपको मिली शिकायत ID डालें, जैसे')} <b className="text-fg">CS-1002</b>.</p>
      </div>
      <form onSubmit={go} data-tour="track-search" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
          <input className="input !py-3.5 !pl-11" placeholder="CS-1002" value={q} onChange={(e) => setQ(e.target.value)} inputMode="text" autoCapitalize="characters" />
        </div>
        <button className="btn-primary !px-6">{tr('Track', 'ट्रैक')}</button>
      </form>

      {state === 'idle' && (
        <div className="card mt-8 animate-fadeUp p-8 text-center sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500/15 text-brand-300"><Search size={26} /></div>
          <h2 className="mt-4 font-display text-xl font-bold">{tr('Follow a complaint from report to fix', 'शिकायत को दर्ज होने से समाधान तक देखें')}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-mute">{tr('See AI analysis, routing, live status and the before/after verification once the department resolves it.', 'AI जाँच, विभाग को भेजना, लाइव स्टेटस और विभाग के हल करने पर पहले/बाद की फ़ोटो से सत्यापन देखें।')}</p>
        </div>
      )}
      {state === 'loading' && <div className="card mt-8 h-56 animate-pulse" />}
      {state === 'error' && (
        <div className="card mt-8 animate-pop p-10 text-center">
          <div className="text-5xl">📡</div>
          <h2 className="mt-3 text-lg font-bold">{tr('Cannot reach the server', 'सर्वर से कनेक्ट नहीं हो पा रहा')}</h2>
          <p className="mt-1 text-sm text-mute">{tr('Check your internet connection and try again.', 'इंटरनेट जाँचकर दोबारा कोशिश करें।')}</p>
          <button className="btn-primary mt-4" onClick={() => nav(0)}>{tr('Retry', 'दोबारा कोशिश')}</button>
        </div>
      )}
      {state === 'notfound' && (
        <div className="card mt-8 animate-pop p-10 text-center">
          <div className="text-5xl">🔎</div>
          <h2 className="mt-3 text-lg font-bold">{tr('No complaint found for', 'कोई शिकायत नहीं मिली:')} "{id}"</h2>
          <p className="mt-1 text-sm text-mute">{tr('Check the ID or', 'ID जाँचें या')} <Link className="font-semibold text-brand-300" to="/report">{tr('report a new issue', 'नई समस्या दर्ज करें')}</Link>.</p>
        </div>
      )}

      {state === 'found' && c && (
        <div className="mt-8 space-y-5 animate-fadeUp">
          <div className="card">
            <div className="grid sm:grid-cols-[260px_1fr]">
              {c.image_url
                ? <img src={c.image_url} alt="Reported issue" className="h-52 w-full object-cover sm:h-full" />
                : <PhotoPlaceholder category={c.analysis.category} label="Reported photo" className="h-52 sm:h-full" />}
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2"><StatusPill status={c.status} /><SeverityBadge level={c.severity.level} score={c.severity.score} /><CategoryTag category={c.analysis.category} /></div>
                <h2 className="mt-3 font-display text-2xl font-bold leading-tight">{tx(c.analysis.problem)}</h2>
                <div className="mt-4 space-y-2 text-sm text-mute">
                  <div className="flex items-center gap-2"><MapPin size={15} className="text-dim" />{tx(c.location.area)}</div>
                  <div className="flex items-center gap-2"><Landmark size={15} className="text-dim" />{tx(c.department.name)}</div>
                  <div className="flex items-center gap-2"><Clock size={15} className="text-dim" />{tr('Reported', 'दर्ज')} {timeAgo(c.created_at)} · {c.complaint_id}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
            <div className="card p-5 sm:p-6"><div className="label">{tr('Progress', 'प्रगति')}</div><Timeline c={c} /></div>
            <div>
              {c.resolution ? <BeforeAfter c={c} /> : <div className="card grid h-full min-h-40 place-items-center p-8 text-center text-sm text-mute">{tr('After-photo verification appears here once the department resolves the issue.', 'विभाग के समस्या हल करने पर यहाँ बाद की फ़ोटो का सत्यापन दिखेगा।')}</div>}
            </div>
          </div>
          <ExplainCard c={c} />
        </div>
      )}
    </div>
  )
}
