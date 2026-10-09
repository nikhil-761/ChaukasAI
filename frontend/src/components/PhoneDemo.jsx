import { useEffect, useRef, useState } from 'react'
import { Camera, Mic, MapPin, Check, Landmark, Sparkles, Send, ShieldCheck, School, Repeat, Route, Siren } from 'lucide-react'
import { RoadPhoto } from './Photo'
import Gauge from './Gauge'
import Logo from './Logo'
import { T, useLang } from '../lib/i18n'
import { Typewriter } from './fx'
import { useInterval, prefersReducedMotion, isFinePointer } from '../lib/hooks'

const SCENES = [
  { key: 'capture', title: 'Capture', sub: 'Photo + GPS + Hindi voice' },
  { key: 'analyse', title: 'AI analysis', sub: 'Vision agent is inspecting' },
  { key: 'severity', title: 'Severity', sub: 'Context-aware scoring' },
  { key: 'route', title: 'Route and draft', sub: 'Right department, formal letter' },
  { key: 'resolve', title: 'Verified fix', sub: 'After-photo + GPS check' },
]
const DURATION = 4200

function Capture() {
  return (
    <div className="absolute inset-0 animate-fadeIn">
      <RoadPhoto className="absolute inset-0 h-full w-full" pos="70% 50%" /><div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />
      {/* viewfinder */}
      {['left-4 top-[72px] border-l-2 border-t-2 rounded-tl-xl', 'right-4 top-[72px] border-r-2 border-t-2 rounded-tr-xl', 'left-4 bottom-24 border-l-2 border-b-2 rounded-bl-xl', 'right-4 bottom-24 border-r-2 border-b-2 rounded-br-xl'].map((c) => (
        <span key={c} className={`absolute h-7 w-7 border-white/90 ${c}`} />
      ))}
      <div className="absolute left-1/2 top-[82px] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur"><span className="mr-1.5 inline-block h-1.5 w-1.5 animate-blink rounded-full bg-red-500" />REC · 29.8543, 77.8880</div>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-xl">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan2 text-white"><Mic size={16} /></span>
        <div className="flex h-6 flex-1 items-center gap-[3px]">
          {Array.from({ length: 22 }).map((_, i) => <span key={i} className="w-[3px] flex-1 origin-center animate-wave rounded-full bg-brand-300/90" style={{ height: '100%', animationDelay: `${(i % 7) * 90}ms` }} />)}
        </div>
        <span className="text-[10px] font-semibold text-white/80">हिंदी</span>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 0, animation: 'flash .6s ease 3.3s both' }} />
    </div>
  )
}

function Analyse() {
  return (
    <div className="absolute inset-0 animate-fadeIn">
      <RoadPhoto className="absolute inset-0 h-full w-full brightness-[.85]" pos="70% 50%" /><div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 to-cyan-400/10" />
      <div className="absolute inset-x-0 h-14 animate-scan bg-gradient-to-b from-transparent via-cyan2/35 to-transparent"><div className="absolute inset-x-0 bottom-0 h-px bg-cyan2 shadow-[0_0_14px_#22D3EE]" /></div>
      {/* bounding box on pothole */}
      <div className="absolute animate-pop rounded-md border-2 border-mint shadow-[0_0_18px_rgba(52,245,197,.6)]" style={{ left: '6%', top: '34%', width: '88%', height: '32%', animationDelay: '1.1s' }}>
        <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-mint px-1.5 py-0.5 text-[9px] font-extrabold text-black"><T>POTHOLE · 94%</T></span>
      </div>
      <div className="absolute inset-x-3 bottom-3 space-y-1.5">
        {['Valid civic issue', 'Hazard to two-wheelers', 'School in frame'].map((t, i) => (
          <div key={t} className="flex animate-fadeUp items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-xl" style={{ animationDelay: `${1.4 + i * 0.7}s` }}>
            <Check size={13} className="text-mint" /><T>{t}</T>
          </div>
        ))}
      </div>
    </div>
  )
}

function Severity() {
  const reasons = [[School, 'School within 120 m', '+2'], [Repeat, 'Reported by 3 citizens', '+1'], [Route, 'Main road', '+1']]
  return (
    <div className="absolute inset-0 animate-fadeIn bg-gradient-to-b from-[#12183A] to-canvas px-4 pt-[74px]">
      <div className="text-center text-[10px] font-bold uppercase tracking-[.22em] text-dim"><T>Severity score</T></div>
      <div className="mt-2 flex justify-center"><Gauge score={9} size={170} /></div>
      <div className="mt-3 space-y-1.5">
        <div className="flex animate-fadeUp items-center justify-between rounded-xl border border-white/10 bg-white/[.05] px-3 py-1.5 text-[11px]" style={{ animationDelay: '.5s' }}><span className="flex items-center gap-2 text-mute"><Sparkles size={13} className="text-brand-300" /><T>AI damage score</T></span><b>5</b></div>
        {reasons.map(([Icon, t, p], i) => (
          <div key={t} className="flex animate-fadeUp items-center justify-between rounded-xl border border-white/10 bg-white/[.05] px-3 py-1.5 text-[11px]" style={{ animationDelay: `${0.9 + i * 0.5}s` }}>
            <span className="flex items-center gap-2 text-mute"><Icon size={13} className="text-brand-300" /><T>{t}</T></span><b className="text-amber-300">{p}</b>
          </div>
        ))}
      </div>
      <div className="mt-4 flex animate-pop items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 py-2.5 text-[12px] font-bold text-red-300" style={{ animationDelay: '2.7s' }}><Siren size={14} /><T>Escalated: Critical priority</T></div>
    </div>
  )
}

function RouteScene() {
  return (
    <div className="absolute inset-0 animate-fadeIn bg-gradient-to-b from-[#12183A] to-canvas px-4 pt-[78px]">
      <div className="flex animate-pop items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan2 text-white"><Landmark size={18} /></span>
        <div><div className="text-[10px] font-bold uppercase tracking-widest text-dim"><T>Routed to</T></div><div className="text-[13px] font-bold"><T>Public Works Dept. (PWD)</T></div></div>
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.05] p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-dim"><Sparkles size={11} className="text-brand-300" /><T>Auto-drafted complaint</T></div>
        <div className="mt-2 space-y-1.5">
          {[100, 92, 96, 70].map((w, i) => <div key={i} className="h-1.5 animate-fadeUp rounded-full bg-white/15" style={{ width: `${w}%`, animationDelay: `${0.6 + i * 0.25}s` }} />)}
        </div>
        <div className="mt-3 text-[11px] leading-snug text-mute"><Typewriter active text="माननीय महोदय, स्कूल के पास सड़क पर बड़ा गड्ढा है। कृपया शीघ्र मरम्मत करवाएँ।" speed={32} /></div>
      </div>
      <div className="mt-3 flex animate-pop items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 py-2 text-[12px] font-bold text-emerald-300" style={{ animationDelay: '2.6s' }}><Send size={13} /><T>Dispatched · ID CS-1042</T></div>
    </div>
  )
}

function Resolve() {
  return (
    <div className="absolute inset-0 animate-fadeIn">
      <RoadPhoto fixed className="absolute inset-0 h-full w-full" pos="68% 50%" /><div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute left-3 top-[76px] rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-white"><T>AFTER</T></div>
      <div className="absolute inset-x-3 bottom-3 animate-pop rounded-2xl border border-emerald-400/30 bg-black/55 p-3 backdrop-blur-xl" style={{ animationDelay: '.5s' }}>
        <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-300"><ShieldCheck size={15} /><T>Issue resolved · 92% confident</T></div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/70"><MapPin size={12} /><T>Same place verified · 38 m from original</T></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full animate-[fadeIn_.1s] rounded-full bg-gradient-to-r from-brand-500 to-mint" style={{ width: '92%' }} /></div>
      </div>
    </div>
  )
}

const VIEWS = [Capture, Analyse, Severity, RouteScene, Resolve]

export default function PhoneDemo({ className = '' }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const wrap = useRef(null)
  const reduce = prefersReducedMotion()
  useInterval(() => setI((x) => (x + 1) % SCENES.length), DURATION, !paused && !reduce)

  // 3D tilt (desktop pointer only)
  useEffect(() => {
    const el = wrap.current
    if (!el || !isFinePointer() || reduce) return undefined
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth
      const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight
      el.style.transform = `perspective(1100px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [reduce])

  const View = VIEWS[i]
  const scene = SCENES[i]
  return (
    <div className={`relative mx-auto w-[min(76vw,300px)] ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="absolute -inset-12 rounded-full bg-brand-600/35 blur-[90px]" />
      <div ref={wrap} className="relative transition-transform duration-300 ease-out will-change-transform">
        <div className="animate-floaty">
          {/* device */}
          <div className="relative aspect-[9/18.6] rounded-[2.6rem] border border-white/15 bg-[#0A0F22] p-2 shadow-[0_40px_90px_-20px_rgba(0,0,0,.9),0_0_0_1px_rgba(255,255,255,.06)_inset]">
            <div data-theme="dark" className="relative h-full overflow-hidden rounded-[2.1rem] bg-canvas text-fg">
              {/* status bar */}
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-white">
                <span>9:41</span><span className="absolute left-1/2 top-2 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" /><span>5G ▮▮▮</span>
              </div>
              {/* app header */}
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-8">
                <div className="flex items-center gap-1.5"><Logo className="h-6 w-6" /><span className="text-[12px] font-extrabold">Chaukas AI</span></div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold backdrop-blur">CS-1042</span>
              </div>
              <div className="absolute inset-0 pt-0"><View key={i} /></div>
              {/* bottom: step + progress */}
              <div className="absolute inset-x-0 bottom-0 z-20 hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* floating glass chips (parallax-ish) */}
      <div className="pointer-events-none absolute -left-4 top-[22%] hidden animate-floaty2 sm:block lg:-left-14">
        <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold shadow-card"><School size={14} className="text-amber-300" /><T>School within 120 m</T></div>
      </div>
      <div className="pointer-events-none absolute -right-4 top-[46%] hidden animate-floaty sm:block lg:-right-16">
        <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold shadow-card"><Landmark size={14} className="text-brand-300" /><T>PWD notified</T></div>
      </div>
      <div className="pointer-events-none absolute -left-2 bottom-[10%] hidden animate-floaty2 sm:block lg:-left-10">
        <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold shadow-card"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /><T>Critical · 9/10</T></div>
      </div>

      {/* scene label + dots */}
      <div className="mt-5 text-center">
        <div key={scene.key} className="animate-fadeUp"><div className="font-display text-sm font-bold"><T>{scene.title}</T></div><div className="text-xs text-dim"><T>{scene.sub}</T></div></div>
        <div className="mt-3 flex justify-center gap-1.5">
          {SCENES.map((s, k) => (
            <button key={s.key} aria-label={s.title} onClick={() => setI(k)} className="relative h-1.5 overflow-hidden rounded-full bg-white/15 transition-all" style={{ width: k === i ? 34 : 12 }}>
              {k === i && <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-cyan2" style={{ animation: paused ? 'none' : `fillbar ${DURATION}ms linear both`, width: paused ? '100%' : undefined }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
