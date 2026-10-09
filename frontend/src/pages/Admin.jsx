import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, ListChecks, Building2, ScanSearch, Map as MapIcon, History, Settings2, LogOut, ShieldCheck, RefreshCw } from 'lucide-react'
import { useComplaints } from '../lib/useComplaints'
import { adminPatch, adminDelete } from '../lib/api'
import { useAdminAuth } from '../lib/admin'
import { useLang } from '../lib/i18n'
import Login from './admin/Login'
import Overview from './admin/Overview'
import ComplaintsTab from './admin/ComplaintsTab'
import Drawer from './admin/Drawer'
import { DepartmentsTab, AuditTab, MapTab, ActivityTab, SystemTab } from './admin/Tabs'

export default function Admin() {
  const { admin, login, logout } = useAdminAuth()
  if (!admin) return <Login onLogin={login} />
  return <Panel admin={admin} logout={logout} />
}

function Panel({ admin, logout }) {
  const { tr } = useLang()
  const { complaints, loading, refresh } = useComplaints()
  const [tab, setTab] = useState('overview')
  const [openId, setOpenId] = useState(null)
  const [tick, setTick] = useState(0)

  const act = useCallback(async (id, patch, label) => {
    await adminPatch(id, patch, { actor: admin.user, label })
    await refresh(); setTick((t) => t + 1)
  }, [admin.user, refresh])
  const remove = useCallback(async (id) => { await adminDelete(id, { actor: admin.user }); setOpenId(null); await refresh(); setTick((t) => t + 1) }, [admin.user, refresh])
  const bulk = useCallback(async (ids, status) => {
    for (const id of ids) await adminPatch(id, { status, ...(status === 'resolved' ? { keepResolution: true } : {}) }, { actor: admin.user, label: `Bulk status → ${status}` })
    await refresh(); setTick((t) => t + 1)
  }, [admin.user, refresh])

  const open = (id) => setOpenId(id)
  const goComplaints = (t) => setTab(t)
  const current = useMemo(() => complaints.find((c) => c.complaint_id === openId), [complaints, openId])

  const TABS = [
    ['overview', tr('Overview', 'ओवरव्यू'), LayoutGrid], ['complaints', tr('Complaints', 'शिकायतें'), ListChecks], ['departments', tr('Departments', 'विभाग'), Building2],
    ['audit', tr('AI audit', 'AI ऑडिट'), ScanSearch], ['map', tr('Map', 'नक्शा'), MapIcon], ['activity', tr('Activity', 'गतिविधि'), History], ['system', tr('System', 'सिस्टम'), Settings2],
  ]

  return (
    <div className="container-x py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fadeUp">
        <div>
          <span className="eyebrow"><ShieldCheck size={13} />{tr('Admin control panel', 'एडमिन कंट्रोल पैनल')}</span>
          <h1 className="h-display mt-3 text-3xl sm:text-5xl">{tr('Control', 'कंट्रोल')} <span className="gradient-text">{tr('centre', 'सेंटर')}</span></h1>
          <p className="mt-2 text-sm text-mute">{tr('Signed in as', 'लॉगिन:')} <b className="text-fg">{admin.user}</b> · {tr('You can view, edit, reassign and audit everything.', 'आप सब कुछ देख, बदल, दोबारा भेज और जाँच सकते हैं।')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !p-3" onClick={refresh} aria-label="Refresh"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
          <Link to="/dashboard" className="btn-ghost btn-sm !py-3">{tr('Public dashboard', 'पब्लिक डैशबोर्ड')}</Link>
          <button className="btn-ghost btn-sm !py-3" onClick={logout}><LogOut size={14} /> {tr('Sign out', 'लॉगआउट')}</button>
        </div>
      </div>

      <div className="scroll-hide sticky top-16 z-30 -mx-4 mt-6 overflow-x-auto bg-canvas/80 px-4 py-2  sm:mx-0 sm:rounded-2xl sm:px-2" style={{ top: 'calc(64px + var(--safe-t))' }}>
        <div className="flex w-max gap-1.5">
          {TABS.map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === k ? 'bg-brand-500 text-white ' : 'text-mute hover:bg-ink/[.07] hover:text-fg'}`}><Icon size={15} />{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-5" key={tab}>
        <div className="animate-fadeUp">
          {tab === 'overview' && <Overview complaints={complaints} go={goComplaints} open={open} />}
          {tab === 'complaints' && <ComplaintsTab complaints={complaints} open={open} bulk={bulk} />}
          {tab === 'departments' && <DepartmentsTab complaints={complaints} openFiltered={open} />}
          {tab === 'audit' && <AuditTab complaints={complaints} open={open} act={act} />}
          {tab === 'map' && <MapTab complaints={complaints} open={open} />}
          {tab === 'activity' && <ActivityTab complaints={complaints} tick={tick} />}
          {tab === 'system' && <SystemTab complaints={complaints} refresh={refresh} />}
        </div>
      </div>

      {current && <Drawer c={current} onClose={() => setOpenId(null)} act={act} remove={remove} actor={admin.user} />}
    </div>
  )
}
