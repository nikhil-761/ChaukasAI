import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Camera, Search, LayoutDashboard, Building2, Download, WifiOff, ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import { useScrolled, useOnline } from '../lib/hooks'
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
    <NavLink to={to} end={end} className={({ isActive }) => `tab-link relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-semibold transition ${isActive ? 'tabbar-active text-fg' : 'text-dim active:text-fg'}`}>
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} className={isActive ? 'text-brand-300 drop-shadow-[0_0_8px_rgba(90,162,255,.9)]' : ''} />
          {tr(...label)}
        </>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const scrolled = useScrolled()
  const online = useOnline()
  const { pathname } = useLocation()
  const { canInstall, install } = usePWAInstall()
  const onReport = pathname === '/report'
  const { tr } = useLang()

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-black" style={{ paddingTop: 'calc(6px + var(--safe-t))' }}>
          <WifiOff size={14} /> {tr('You are offline - saved data still works', 'आप ऑफ़लाइन हैं - सेव किया डेटा चलता रहेगा')}
        </div>
      )}
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? 'border-b border-ink/10 bg-canvas/70 backdrop-blur-2xl' : 'border-b border-transparent'}`} style={{ paddingTop: 'var(--safe-t)', top: online ? 0 : 28 }}>
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Chaukas AI home">
            <Logo className="h-10 w-10 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
            <span className="font-display text-[17px] font-extrabold tracking-tight">Chaukas<span className="gradient-text"> AI</span></span>
          </Link>

          <nav className="relative hidden items-center gap-1 rounded-full border border-ink/10 bg-ink/[.04] p-1 backdrop-blur-xl md:flex">
            {desktop.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${isActive ? 'bg-ink/[.10] text-fg shadow-[0_0_20px_-4px_rgba(47,128,255,.55)]' : 'text-mute hover:text-fg'}`}>
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
            <Link to="/admin" aria-label={tr('Admin panel', 'एडमिन पैनल')} title={tr('Admin panel', 'एडमिन पैनल')} className={`hidden h-9 w-9 place-items-center rounded-full border border-line bg-ink/[.06] transition hover:text-fg md:grid ${pathname === '/admin' ? 'text-brand-300' : 'text-mute'}`}><ShieldCheck size={16} /></Link>
            {canInstall && (
              <button onClick={install} className="btn-ghost btn-sm hidden sm:inline-flex"><Download size={14} /> {tr('Install app', 'ऐप इंस्टॉल करें')}</button>
            )}
            {!onReport && (
              <Link to="/report" className="btn-primary btn-sm !px-4 !py-2.5"><Camera size={15} /> <span className="hidden sm:inline">{tr('Report an issue', 'समस्या दर्ज करें')}</span><span className="sm:hidden">{tr('Report', 'शिकायत')}</span></Link>
            )}
          </div>
        </div>
      </header>
      <div className="h-16" style={{ marginTop: 'var(--safe-t)' }} />

      {/* Mobile app tab bar with centre FAB */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 md:hidden" style={{ paddingBottom: 'calc(10px + var(--safe-b))' }} aria-label="Primary">
        <div className="relative mx-auto max-w-md rounded-[26px] border border-ink/10 shadow-[0_20px_50px_-12px_rgba(10,30,90,.45)] backdrop-blur-2xl" style={{ background: 'var(--tab-bg)' }}>
          <div className="flex items-end px-1.5 pb-0.5 pt-1">
            {left.map((t) => <Tab key={t.to} {...t} />)}
            <div className="relative flex w-[76px] shrink-0 justify-center">
              <Link to="/report" aria-label="Report an issue" className="absolute -top-[30px] grid h-[62px] w-[62px] place-items-center rounded-full text-white transition active:scale-95" style={{ background: 'linear-gradient(135deg,#2F80FF,#1BA8F5 55%,#1DD3B0)', boxShadow: '0 0 0 5px rgb(var(--canvas)), 0 12px 30px -4px rgba(47,128,255,.75)' }}>
                {!onReport && <span className="absolute inset-0 animate-pulseRing rounded-full bg-brand-500/50" />}
                <Camera size={26} strokeWidth={2.2} className="relative" />
              </Link>
              <span className="pointer-events-none mt-[34px] block h-6 text-[10.5px] font-semibold text-dim">{tr('Report', 'शिकायत')}</span>
            </div>
            {right.map((t) => <Tab key={t.to} {...t} />)}
          </div>
        </div>
      </nav>
    </>
  )
}
