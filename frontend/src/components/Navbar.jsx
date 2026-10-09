import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Camera, Search, LayoutDashboard, Building2, Download, WifiOff, ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import { useOnline } from '../lib/hooks'
import { usePWAInstall } from '../lib/pwa'
import { ThemeSwitch, ThemeButton } from '../lib/theme'
import { useLang, LangSwitch } from '../lib/i18n'

const left = [
  { to: '/', label: ['Home', 'होम'], icon: Home, end: true },
  { to: '/dashboard', label: ['City', 'शहर'], icon: LayoutDashboard },
]
const right = [
  { to: '/track', label: ['Track', 'ट्रैक'], icon: Search },
  { to: '/department', label: ['Dept', 'विभाग'], icon: Building2 },
]
const desktop = [
  { to: '/', label: ['Home', 'होम'], end: true },
  { to: '/report', label: ['Report', 'शिकायत'] },
  { to: '/track', label: ['Track', 'ट्रैक'] },
  { to: '/dashboard', label: ['Dashboard', 'डैशबोर्ड'] },
  { to: '/department', label: ['Department', 'विभाग'] },
]

function Tab({ to, label, icon: Icon, end }) {
  const { tr } = useLang()
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `tab-link relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold ${isActive ? 'tabbar-active text-brand-500' : 'text-dim'}`}>
      <Icon size={20} strokeWidth={2} />
      {tr(...label)}
    </NavLink>
  )
}

export default function Navbar() {
  const online = useOnline()
  const { pathname } = useLocation()
  const { canInstall, install } = usePWAInstall()
  const onReport = pathname === '/report'
  const { tr } = useLang()

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black">
          <WifiOff size={14} /> {tr('You are offline - saved data still works', 'आप ऑफ़लाइन हैं - सेव किया डेटा चलता रहेगा')}
        </div>
      )}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-panel" style={{ paddingTop: 'var(--safe-t)', top: online ? 0 : 28 }}>
        <div className="tricolor" />
        <div className="container-x flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Chaukas AI home">
            <Logo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-base font-bold tracking-tight text-brand-500">Chaukas AI</span>
              <span className="hidden text-[11px] text-dim sm:block">{tr('Complaint to resolution, with proof', 'शिकायत से समाधान तक, प्रमाण के साथ')}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {desktop.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `border-b-2 px-3.5 py-4 text-sm font-semibold ${isActive ? 'border-saffron text-brand-500' : 'border-transparent text-mute hover:text-fg'}`}>
                {tr(...label)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div data-tour="nav-lang" className="flex items-center gap-2">
              <LangSwitch compact className="inline-flex" />
              <ThemeSwitch className="hidden md:inline-flex" />
            </div>
            <ThemeButton className="md:hidden" />
            <Link to="/admin" aria-label={tr('Admin panel', 'एडमिन पैनल')} title={tr('Admin panel', 'एडमिन पैनल')} className={`hidden h-9 w-9 place-items-center rounded-md border border-line md:grid ${pathname === '/admin' ? 'text-brand-500' : 'text-mute hover:text-fg'}`}><ShieldCheck size={16} /></Link>
            {canInstall && (
              <button onClick={install} className="btn-ghost btn-sm hidden sm:inline-flex"><Download size={14} /> {tr('Install app', 'ऐप इंस्टॉल करें')}</button>
            )}
            {!onReport && (
              <Link to="/report" className="btn-saffron btn-sm !px-4 !py-2"><Camera size={15} /> <span className="hidden sm:inline">{tr('Report an issue', 'समस्या दर्ज करें')}</span><span className="sm:hidden">{tr('Report', 'शिकायत')}</span></Link>
            )}
          </div>
        </div>
      </header>
      <div className="h-[60px]" style={{ marginTop: 'var(--safe-t)' }} />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-panel md:hidden" style={{ paddingBottom: 'var(--safe-b)' }} aria-label="Primary">
        <div className="flex items-end px-1">
          {left.map((t) => <Tab key={t.to} {...t} />)}
          <Link to="/report" aria-label="Report an issue" className="relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-bold text-saffron">
            <Camera size={20} strokeWidth={2.2} />
            {tr('Report', 'शिकायत')}
          </Link>
          {right.map((t) => <Tab key={t.to} {...t} />)}
        </div>
      </nav>
    </>
  )
}
