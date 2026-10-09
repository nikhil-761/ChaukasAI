import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, ScanSearch, Landmark, BadgeCheck, Siren } from 'lucide-react'
import Logo from './Logo'
import { prefersReducedMotion, isFinePointer } from '../lib/hooks'
import { T } from '../lib/i18n'

const W = 560 // design box (px)
const CELL = 72, N = 5

/** one 3D building (box with top + 2 side faces), z-up inside the rotated ground plane */
function Building({ x, y, w, d, h, delay }) {
  const wrap = { left: x, top: y, width: w, height: d, transformOrigin: '0 0 0', animation: `bRise .9s cubic-bezier(.2,.8,.2,1) ${delay}ms both` }
  return (
    <div className="preserve3d absolute" style={wrap}>
      <div className="face bx-top" style={{ left: 0, top: 0, width: w, height: d, transform: `translateZ(${h}px)`, borderRadius: 3 }} />
      {/* +Y face (faces camera) */}
      <div className="face bx-front" style={{ left: 0, top: d, width: w, height: h, transformOrigin: 'top', transform: 'rotateX(90deg)' }} />
      {/* -X face */}
      <div className="face bx-side" style={{ left: 0, top: 0, width: h, height: d, transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />
    </div>
  )
}


function Cube({ size = 26, className = '', style }) {
  const f = (t) => ({ width: size, height: size, transform: t })
  const face = 'face border border-cyan2/50 bg-cyan2/10 backdrop-blur-[1px]'
  return (
    <div className={`preserve3d absolute animate-spin3d ${className}`} style={{ width: size, height: size, ...style }}>
      <div className={face} style={f(`translateZ(${size / 2}px)`)} />
      <div className={face} style={f(`rotateY(180deg) translateZ(${size / 2}px)`)} />
      <div className={face} style={f(`rotateY(90deg) translateZ(${size / 2}px)`)} />
      <div className={face} style={f(`rotateY(-90deg) translateZ(${size / 2}px)`)} />
      <div className={face} style={f(`rotateX(90deg) translateZ(${size / 2}px)`)} />
      <div className={face} style={f(`rotateX(-90deg) translateZ(${size / 2}px)`)} />
    </div>
  )
}

function InfoCard({ className = '', z = 60, delay = 0, k = 1, children, origin = 'center' }) {
  return (
    <div className={`absolute w-[188px] rounded-2xl border border-line p-3 shadow-card backdrop-blur-xl animate-float3d ${className}`}
      style={{ '--z': `${z}px`, animationDelay: `${delay}ms`, background: 'var(--card-bg)', scale: String(k), transformOrigin: origin }}>
      {children}
    </div>
  )
}

export default function Hero3D() {
  const box = useRef(null)
  const [k, setK] = useState(1)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = box.current
    if (!el) return undefined
    const set = () => setK(Math.max(0.5, Math.min(1.15, el.clientWidth / W)))
    set()
    const ro = new ResizeObserver(set); ro.observe(el)
    return () => ro.disconnect()
  }, [])


  const onMove = (e) => {
    if (!isFinePointer() || prefersReducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: -py * 14, y: px * 22 })
  }


  const buildings = useMemo(() => {
    const out = []
    const hs = [96, 138, 70, 118, 84, 150, 104, 66, 128, 92, 112, 76, 144, 88, 100, 122]
    let n = 0
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (i === 2 || j === 2) continue
      const h = hs[n % hs.length]; n++
      const w = 40 + ((i * 7 + j * 3) % 3) * 4, d = 40 + ((i * 5 + j * 11) % 3) * 4
      out.push({ key: `${i}-${j}`, x: i * CELL + (CELL - w) / 2, y: j * CELL + (CELL - d) / 2, w, d, h, delay: 250 + n * 70 })
    }
    return out
  }, [])

  const cardK = Math.min(1.12, 0.74 / k)
  const small = k < 0.78

  return (
    <div ref={box} className="relative mx-auto w-full max-w-[600px] select-none" style={{ height: W * k }} onPointerMove={onMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })} aria-label="3D city illustration">
      <div className="scene3d absolute left-0 top-0" style={{ width: W, height: W, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <div className="preserve3d absolute inset-0 animate-sway">
          <div className="preserve3d absolute inset-0 transition-transform duration-200 ease-out" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>

            {/* backdrop glow */}
            <div className="absolute left-1/2 top-[54%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgb(var(--brand) / .55), rgb(var(--cyan2) / .18) 55%, transparent 72%)', transform: 'translateZ(-120px)' }} />

            {/* ---- 3D city ---- */}
            <div className="preserve3d absolute left-1/2 top-[62%]" style={{ width: CELL * N, height: CELL * N, marginLeft: -(CELL * N) / 2, marginTop: -(CELL * N) / 2, transform: 'rotateX(62deg) rotateZ(-40deg)' }}>
              <div className="absolute -inset-5 rounded-[34px] ground-grid border border-line shadow-[0_40px_80px_-10px_rgba(0,0,0,.45)]" style={{ transform: 'translateZ(-2px)' }} />
              {/* roads */}
              <div className="absolute left-0 right-0" style={{ top: CELL * 2 + 6, height: CELL - 12, background: 'var(--road)' }}>
                <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'repeating-linear-gradient(90deg, rgb(var(--cyan2)/.7) 0 10px, transparent 10px 22px)' }} />
              </div>
              <div className="absolute top-0 bottom-0" style={{ left: CELL * 2 + 6, width: CELL - 12, background: 'var(--road)' }}>
                <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: 'repeating-linear-gradient(180deg, rgb(var(--cyan2)/.7) 0 10px, transparent 10px 22px)' }} />
              </div>
              {/* glowing route */}
              <svg className="absolute inset-0 overflow-visible" width={CELL * N} height={CELL * N} viewBox={`0 0 ${CELL * N} ${CELL * N}`} style={{ transform: 'translateZ(1px)' }} aria-hidden>
                <path d={`M0 ${CELL * 2.5} H${CELL * 2.5} V${CELL * 0}`} fill="none" stroke="rgb(var(--cyan2))" strokeWidth="3" strokeLinecap="round" strokeDasharray="14 10" className="animate-dash" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--cyan2)))' }} />
                <path d={`M${CELL * N} ${CELL * 2.5} H${CELL * 2.5} V${CELL * N}`} fill="none" stroke="rgb(var(--mint))" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="8 12" className="animate-dash" style={{ filter: 'drop-shadow(0 0 5px rgb(var(--mint)))', animationDirection: 'reverse' }} />
              </svg>
              {/* moving cars */}
              <span className="absolute h-[5px] w-[14px] rounded-full bg-cyan2 shadow-[0_0_10px_rgb(var(--cyan2))]" style={{ left: 0, top: CELL * 2.5 - 8, animation: 'carA 5.5s linear infinite', transform: 'translateZ(2px)' }} />
              <span className="absolute h-[5px] w-[14px] rounded-full bg-mint shadow-[0_0_10px_rgb(var(--mint))]" style={{ left: 0, top: CELL * 2.5 + 3, animation: 'carA 7.5s linear 1.5s infinite', transform: 'translateZ(2px)' }} />
              <span className="absolute h-[14px] w-[5px] rounded-full bg-brand-400 shadow-[0_0_10px_rgb(var(--brand))]" style={{ top: 0, left: CELL * 2.5 - 8, animation: 'carB 6.5s linear .6s infinite', transform: 'translateZ(2px)' }} />

              {buildings.map(({ key, ...b }) => <Building key={key} {...b} />)}

              {/* pulse ring at issue location */}
              <span className="absolute h-[120px] w-[120px] rounded-full border-2 border-red-400/80 animate-pulseRing" style={{ left: CELL * 2.5 - 60, top: CELL * 2.5 - 60, transform: 'translateZ(2px)' }} />
              <span className="absolute h-[60px] w-[60px] rounded-full bg-red-500/25" style={{ left: CELL * 2.5 - 30, top: CELL * 2.5 - 30, transform: 'translateZ(2px)' }} />
              {/* billboard pin (faces camera) */}
              <div className="preserve3d absolute" style={{ left: CELL * 2.5, top: CELL * 2.5, transform: "translateZ(64px)" }}>
                <div className="absolute" style={{ left: -26, top: -92, width: 52, height: 92, transformOrigin: '26px 92px', transform: 'rotateZ(40deg) rotateX(-62deg)' }}>
                  <div className="animate-pinDrop">
                    <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-[0_0_30px_rgba(239,68,68,.8)] ring-4 ring-white/30"><Siren size={24} /></div>
                    <div className="mx-auto h-10 w-[3px] rounded-full bg-gradient-to-b from-red-400 to-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* ---- orbit rings around logo ---- */}
            <div className="preserve3d absolute left-1/2 top-[27%]" style={{ width: 0, height: 0 }}>
              {[{ s: 330, rx: 72, ry: 0, cls: 'animate-spinSlow', dots: 3 }, { s: 420, rx: 72, ry: 28, cls: 'animate-spinRev', dots: 2 }].map((r, i) => (
                <div key={i} className="preserve3d absolute" style={{ width: r.s, height: r.s, left: -r.s / 2, top: -r.s / 2, transform: `rotateX(${r.rx}deg) rotateY(${r.ry}deg)` }}>
                  <div className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan2/60 ${r.cls}`}>
                    {Array.from({ length: r.dots }).map((_, j) => (
                      <span key={j} className="absolute h-2.5 w-2.5 rounded-full bg-cyan2 shadow-[0_0_14px_rgb(var(--cyan2))]" style={{ left: '50%', top: -5, marginLeft: -5, transformOrigin: `5px ${r.s / 2 + 5}px`, transform: `rotate(${(360 / r.dots) * j}deg)` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ---- logo ---- */}
            <div className="absolute left-1/2 top-[27%] animate-float3d" style={{ '--z': '90px', marginLeft: -78, marginTop: -78, width: 156, height: 156 }}>
              <div className="absolute inset-[-18%] rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgb(var(--cyan2) / .55), transparent 70%)' }} />
              <Logo className="relative h-full w-full !rounded-[28%]" glow />
            </div>

            {/* ---- floating cubes ---- */}
            <Cube size={24} className="left-[2%] top-[52%]" style={{ transform: 'translateZ(130px)' }} />
            <Cube size={16} className="right-[10%] top-[54%] [animation-duration:11s]" style={{ transform: 'translateZ(100px)' }} />
            <Cube size={20} className="left-[18%] top-[78%] [animation-duration:14s]" style={{ transform: 'translateZ(60px)' }} />


            {/* ---- glass cards ---- */}
            <InfoCard className={small ? 'bottom-[0%] left-[3%]' : 'left-[-2%] top-[6%]'} z={110} delay={0} k={cardK} origin={small ? 'bottom left' : 'top left'}>
              <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan2 text-white"><ScanSearch size={15} /></span><div className="text-[10px] font-bold uppercase tracking-widest text-dim"><T>Vision agent</T></div></div>
              <div className="mt-2 font-display text-sm font-bold"><T>Pothole detected</T></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full w-[94%] rounded-full bg-gradient-to-r from-brand-500 to-mint" /></div>
              <div className="mt-1 text-[10px] text-mute"><T>94% confidence</T></div>
            </InfoCard>
            <InfoCard className={small ? 'bottom-[0%] right-[3%]' : 'right-[-2%] top-[2%]'} z={150} delay={900} k={cardK} origin={small ? 'bottom right' : 'top right'}>
              <div className="flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-widest text-dim"><T>Severity</T></div><span className="chip bg-red-500/15 !py-0.5 text-[10px] text-red-500 dark:text-red-300"><T>Critical</T></span></div>
              <div className="mt-1 font-display text-3xl font-extrabold leading-none">9<span className="text-base text-dim">/10</span></div>
              <div className="mt-1.5 text-[10px] text-mute"><T>School within 200 m · +2</T></div>
            </InfoCard>
            {!small && (
              <>
                <InfoCard className="bottom-[2%] left-[-1%]" z={120} delay={1600} k={cardK} origin="bottom left">
                  <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/20 text-brand-300"><Landmark size={15} /></span><div><div className="text-[10px] font-bold uppercase tracking-widest text-dim"><T>Routed to</T></div><div className="font-display text-sm font-bold"><T>PWD · Roorkee</T></div></div></div>
                </InfoCard>
                <InfoCard className="bottom-[4%] right-[-1%]" z={140} delay={2300} k={cardK} origin="bottom right">
                  <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-500 dark:text-emerald-300"><BadgeCheck size={16} /></span><div><div className="text-[10px] font-bold uppercase tracking-widest text-dim"><T>Closure</T></div><div className="font-display text-sm font-bold"><T>Fix verified</T></div></div></div>
                </InfoCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
