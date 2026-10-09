import { useMemo, useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Flag, CheckSquare } from 'lucide-react'
import { SeverityBadge, StatusPill, CategoryTag } from '../../components/Badges'
import { useLang } from '../../lib/i18n'
import { STATUS, SEVERITY, CATEGORIES, CITIES } from '../../lib/constants'
import { timeAgo, isOverdue, needsReview, toCSV, download, ALL_DEPTS } from './util'

const PER = 12

export default function ComplaintsTab({ complaints, open, bulk, preset }) {
  const { tr, tx, lang } = useLang()
  const [q, setQ] = useState('')
  const [f, setF] = useState({ status: 'ALL', sev: 'ALL', cat: 'ALL', city: 'ALL', dept: 'ALL', special: preset || 'ALL' })
  const [sort, setSort] = useState('priority')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState(new Set())
  const set = (k, v) => { setF({ ...f, [k]: v }); setPage(1) }

  const depts = useMemo(() => [...new Set([...ALL_DEPTS, ...complaints.map((c) => c.department.name)])], [complaints])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return complaints.filter((c) =>
      (!s || [c.complaint_id, c.location.area, c.analysis.problem, c.department.name].join(' ').toLowerCase().includes(s)) &&
      (f.status === 'ALL' || c.status === f.status) && (f.sev === 'ALL' || c.severity.level === f.sev) && (f.cat === 'ALL' || c.analysis.category === f.cat) &&
      (f.city === 'ALL' || c.city === f.city) && (f.dept === 'ALL' || c.department.name === f.dept) &&
      (f.special === 'ALL' || (f.special === 'overdue' && isOverdue(c)) || (f.special === 'review' && needsReview(c)) || (f.special === 'flagged' && c.flagged))
    ).sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at) : b.severity.score - a.severity.score || new Date(a.created_at) - new Date(b.created_at))
  }, [complaints, q, f, sort])
  const pages = Math.max(1, Math.ceil(list.length / PER))
  const cur = Math.min(page, pages)
  const rows = list.slice((cur - 1) * PER, cur * PER)
  const allOnPage = rows.length > 0 && rows.every((c) => sel.has(c.complaint_id))
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n) }
  const togglePage = () => { const n = new Set(sel); rows.forEach((c) => (allOnPage ? n.delete(c.complaint_id) : n.add(c.complaint_id))); setSel(n) }
  const Sel = ({ k, children, className = '' }) => <select className={`input !w-auto !py-2 !text-xs ${className}`} value={f[k]} onChange={(e) => set(k, e.target.value)}>{children}</select>

  return (
    <div className="space-y-4">
      <div className="card p-3.5 sm:p-4">
        <div className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" /><input className="input !pl-11" placeholder={tr('Search by ID, area, problem or department...', 'ID, इलाका, समस्या या विभाग से खोजें...')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} /></div>
        <div className="scroll-hide mt-3 flex gap-2 overflow-x-auto pb-1">
          <Sel k="status"><option value="ALL">{tr('Any status', 'कोई भी स्थिति')}</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{lang === 'hi' ? v.hi : v.label}</option>)}</Sel>
          <Sel k="sev"><option value="ALL">{tr('Any severity', 'कोई भी गंभीरता')}</option>{Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{lang === 'hi' ? v.hi : v.label}</option>)}</Sel>
          <Sel k="cat"><option value="ALL">{tr('Any type', 'कोई भी प्रकार')}</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{lang === 'hi' ? v.hi : v.label}</option>)}</Sel>
          <Sel k="city"><option value="ALL">{tr('Any city', 'कोई भी शहर')}</option>{Object.entries(CITIES).map(([k, v]) => <option key={k} value={k}>{tx(v.name)}</option>)}</Sel>
          <Sel k="dept" className="max-w-[210px]"><option value="ALL">{tr('Any department', 'कोई भी विभाग')}</option>{depts.map((d) => <option key={d} value={d}>{tx(d)}</option>)}</Sel>
          <Sel k="special"><option value="ALL">{tr('All cases', 'सभी केस')}</option><option value="overdue">{tr('Overdue only', 'सिर्फ़ देरी वाली')}</option><option value="review">{tr('Needs AI review', 'AI जाँच ज़रूरी')}</option><option value="flagged">{tr('Flagged', 'फ़्लैग की गई')}</option></Sel>
          <select className="input !w-auto !py-2 !text-xs" value={sort} onChange={(e) => setSort(e.target.value)}><option value="priority">{tr('Sort: priority', 'क्रम: प्राथमिकता')}</option><option value="newest">{tr('Sort: newest', 'क्रम: नई पहले')}</option><option value="oldest">{tr('Sort: oldest', 'क्रम: पुरानी पहले')}</option></select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-dim">{list.length} {tr('complaints', 'शिकायतें')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {sel.size > 0 && (
            <>
              <span className="chip bg-brand-500/15 text-brand-300"><CheckSquare size={13} />{sel.size} {tr('selected', 'चुनी')}</span>
              {['in_progress', 'resolved', 'rejected'].map((s) => <button key={s} className="btn-ghost btn-sm" onClick={async () => { await bulk([...sel], s); setSel(new Set()) }}>→ {lang === 'hi' ? STATUS[s].hi : STATUS[s].label}</button>)}
              <button className="btn-ghost btn-sm" onClick={() => setSel(new Set())}>{tr('Clear', 'साफ़')}</button>
            </>
          )}
          <button className="btn-ghost btn-sm" onClick={() => download('chaukas-complaints.csv', toCSV(sel.size ? complaints.filter((c) => sel.has(c.complaint_id)) : list), 'text/csv')}><Download size={14} /> CSV</button>
        </div>
      </div>

      {/* desktop table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead><tr className="border-b border-ink/10 text-[11px] uppercase tracking-widest text-dim">
            <th className="w-10 px-4 py-3"><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="select page" /></th>
            <th className="px-2 py-3">ID</th><th className="px-2 py-3">{tr('Problem', 'समस्या')}</th><th className="px-2 py-3">{tr('Severity', 'गंभीरता')}</th><th className="px-2 py-3">{tr('Status', 'स्थिति')}</th><th className="px-2 py-3">{tr('Department', 'विभाग')}</th><th className="px-4 py-3 text-right">{tr('Age', 'उम्र')}</th>
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.complaint_id} onClick={() => open(c.complaint_id)} className="cursor-pointer border-b border-ink/[.06] transition hover:bg-ink/[.05]">
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(c.complaint_id)} onChange={() => toggle(c.complaint_id)} aria-label={`select ${c.complaint_id}`} /></td>
                <td className="px-2 py-3 font-bold">{c.complaint_id}{c.flagged && <Flag size={12} className="ml-1 inline text-amber-400" />}</td>
                <td className="max-w-[280px] px-2 py-3"><div className="truncate font-medium">{tx(c.analysis.problem)}</div><div className="truncate text-xs text-dim">{tx(c.location.area)}</div></td>
                <td className="px-2 py-3"><SeverityBadge level={c.severity.level} score={c.severity.score} /></td>
                <td className="px-2 py-3"><StatusPill status={c.status} />{isOverdue(c) && <span className="ml-1.5 text-[11px] font-bold text-red-400">{tr('overdue', 'देरी')}</span>}</td>
                <td className="max-w-[200px] truncate px-2 py-3 text-mute">{tx(c.department.name)}</td>
                <td className="px-4 py-3 text-right text-xs text-dim">{timeAgo(c.created_at)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="7" className="p-10 text-center text-dim">{tr('No complaints match these filters.', 'इन फ़िल्टर से कोई शिकायत नहीं मिली।')}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((c) => (
          <li key={c.complaint_id} className="card p-3.5">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" checked={sel.has(c.complaint_id)} onChange={() => toggle(c.complaint_id)} aria-label={`select ${c.complaint_id}`} />
              <button className="min-w-0 flex-1 text-left" onClick={() => open(c.complaint_id)}>
                <div className="flex flex-wrap items-center gap-2"><b>{c.complaint_id}</b><SeverityBadge level={c.severity.level} score={c.severity.score} /><StatusPill status={c.status} />{c.flagged && <Flag size={12} className="text-amber-400" />}</div>
                <div className="mt-1.5 text-sm font-medium">{tx(c.analysis.problem)}</div>
                <div className="mt-0.5 text-xs text-dim">{tx(c.location.area)} · {timeAgo(c.created_at)}{isOverdue(c) && <b className="ml-1 text-red-400">· {tr('overdue', 'देरी')}</b>}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2"><CategoryTag category={c.analysis.category} /><span className="truncate text-xs text-mute">{tx(c.department.name)}</span></div>
              </button>
            </div>
          </li>
        ))}
        {!rows.length && <li className="card p-8 text-center text-sm text-dim">{tr('No complaints match these filters.', 'इन फ़िल्टर से कोई शिकायत नहीं मिली।')}</li>}
      </ul>

      <div className="flex items-center justify-between">
        <button className="btn-ghost btn-sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={15} /> {tr('Prev', 'पिछला')}</button>
        <span className="text-xs text-dim">{tr('Page', 'पेज')} {cur} / {pages}</span>
        <button className="btn-ghost btn-sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>{tr('Next', 'अगला')} <ChevronRight size={15} /></button>
      </div>
    </div>
  )
}
