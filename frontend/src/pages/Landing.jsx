import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Brain, Layers, Route as RouteIcon, BadgeCheck, ArrowRight, School, Repeat, Languages, Trophy, ShieldCheck, Sparkles, Siren, Download, MapPin, ChevronDown, Mic } from 'lucide-react'
import { useComplaints } from '../lib/useComplaints'
import { computeStats } from '../lib/api'
import { usePWAInstall } from '../lib/pwa'
import { useScrollProgress } from '../lib/hooks'
import { SEVERITY, levelFromScore } from '../lib/constants'
import { Reveal, Spot, Magnetic, CountUp, Aurora, Particles, WordReveal, Tilt } from '../components/fx'
import PhoneDemo from '../components/PhoneDemo'
import Hero3D from '../components/Hero3D'
import Gauge from '../components/Gauge'
import { RoadPhoto, CityPhoto, ShowPhoto, IMG } from '../components/Photo'
import { useLang } from '../lib/i18n'

/* ---------- small helpers ---------- */
const SectionHead = ({ eyebrow, title, sub, center = true }) => (
  <Reveal className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2 className="h-display mt-4 text-[2rem] sm:text-5xl">{title}</h2>
    {sub && <p className="mt-4 text-base leading-relaxed text-mute sm:text-lg">{sub}</p>}
  </Reveal>
)

/* ---------- HERO ---------- */
function Hero({ stats }) {
  const { tr } = useLang()
  return (
    <section className="noise relative isolate overflow-hidden pt-16">
      <Aurora />
      <div className="grid-bg absolute inset-0" />
      <Particles />
      <div className="container-x relative grid items-center gap-6 pb-16 pt-4 sm:pt-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <div>
          <div className="animate-fadeUp"><span className="eyebrow"><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-pulseRing rounded-full bg-emerald-400" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>{tr('Live demo · AI for civic action', 'लाइव डेमो · नागरिक कार्रवाई के लिए AI')}</span></div>
          <h1 className="h-display mt-6 text-[2.75rem] sm:text-7xl lg:text-[5.25rem]">
            <WordReveal key={tr('a','अ')} text={tr('From complaint', 'शिकायत से')} start={150} /><br />
            <WordReveal key={tr('b','ब')} text={tr('to closure.', 'समाधान तक।')} start={450} gradientFrom={1} />
          </h1>
          <p className="mt-6 max-w-xl animate-fadeUp text-base leading-relaxed text-mute sm:text-lg" style={{ animationDelay: '.8s' }}>
            {tr('AI can tell what is in a photo.', 'AI बता सकता है कि फ़ोटो में क्या है।')} <b className="text-fg">{tr('Chaukas AI answers what happens next', 'चौकस AI बताता है कि आगे क्या होगा')}</b> - {tr('verify the issue, prioritise it with local context, route it to the right department and prove the fix.', 'समस्या जाँचो, स्थानीय संदर्भ से प्राथमिकता तय करो, सही विभाग तक पहुँचाओ और समाधान का प्रमाण दो।')}
          </p>
          <p className="mt-2 animate-fadeUp font-display text-sm font-semibold text-brand-300" style={{ animationDelay: '.9s' }}>{tr('शिकायत से समाधान तक.', 'From complaint to closure.')}</p>
          <div className="mt-8 flex animate-fadeUp flex-wrap gap-3" style={{ animationDelay: '1s' }}>
            <Magnetic><Link to="/report" data-tour="hero-report" className="btn-primary !px-6 !py-3.5 text-[15px]"><Camera size={18} /> {tr('Report an issue', 'समस्या दर्ज करें')}</Link></Magnetic>
            <Magnetic><Link to="/dashboard" className="btn-ghost !px-6 !py-3.5 text-[15px]">{tr('Live dashboard', 'लाइव डैशबोर्ड')} <ArrowRight size={16} /></Link></Magnetic>
          </div>
          <div className="mt-12 grid max-w-lg animate-fadeUp grid-cols-3 gap-4 border-t border-ink/10 pt-6" style={{ animationDelay: '1.15s' }}>
            {[[<CountUp key="a" value={stats.total || 40} />, tr('Issues tracked', 'शिकायतें ट्रैक हुईं')], [<CountUp key="b" value={stats.rate} suffix="%" />, tr('Resolution rate', 'समाधान दर')], [<span key="c">{tr('< 1 min', '< 1 मिनट')}</span>, tr('To route and draft', 'भेजने और ड्राफ़्ट में')]].map(([v, l]) => (
              <div key={l}><div className="font-display text-2xl font-extrabold sm:text-3xl">{v}</div><div className="mt-0.5 text-xs text-dim">{l}</div></div>
            ))}
          </div>
        </div>
        <div data-tour="hero-3d" className="order-first mx-auto -mb-4 w-full max-w-[390px] animate-fadeUp sm:max-w-[470px] lg:order-last lg:mb-0 lg:max-w-none" style={{ animationDelay: '.5s' }}><Hero3D /></div>
      </div>
      <a href="#story" aria-label="Scroll" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-dim lg:block"><ChevronDown className="animate-floaty" /></a>
    </section>
  )
}

/* ---------- MARQUEE ---------- */
const TAGS = [['🕳️ Potholes','🕳️ गड्ढे'], ['🗑️ Garbage','🗑️ कचरा'], ['💡 Streetlights','💡 स्ट्रीट लाइट'], ['💧 Water leakage','💧 पानी रिसाव'], ['🌊 Drainage','🌊 नाली'], ['📍 Roorkee','📍 रुड़की'], ['📍 Muzaffarnagar','📍 मुज़फ़्फ़रनगर'], ['🎙️ Hindi voice','🎙️ हिंदी वॉइस'], ['🛡️ Explainable AI','🛡️ समझने योग्य AI'], ['✅ Verified fixes','✅ सत्यापित समाधान']]
function Marquee() {
  const { tr } = useLang()
  const row = [...TAGS, ...TAGS].map(([e, h]) => tr(e, h))
  return (
    <div className="relative overflow-hidden border-y border-ink/10 bg-ink/[.02] py-4" style={{ maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)' }}>
      <div className="flex w-max animate-marquee gap-3">
        {row.map((t, i) => <span key={i} className="whitespace-nowrap rounded-full border border-ink/10 bg-ink/[.04] px-4 py-2 text-sm font-medium text-mute">{t}</span>)}
      </div>
    </div>
  )
}

/* ---------- GALLERY: real problems + proof ---------- */
function Gallery() {
  const { tr } = useLang()
  const cards = [
    { src: IMG.streetNight, pos: '50% 50%', emoji: '💡', tag: tr('Streetlight', 'स्ट्रीट लाइट'), title: tr('Dark street, broken lamp', 'अँधेरी गली, टूटा लैंप'), text: tr('At night the AI flags the dark patch, rates it High and routes it to the Electricity department.', 'रात में AI अँधेरे हिस्से को पहचानकर उसे गंभीर मानता है और बिजली विभाग को भेजता है।'), alt: 'Broken streetlight on a dark Indian street at night' },
    { src: IMG.waterBurst, pos: '50% 50%', emoji: '💧', tag: tr('Water leakage', 'पानी का रिसाव'), title: tr('Burst pipe flooding the lane', 'फटी पाइपलाइन से गली में पानी'), text: tr('A burst main is spotted, tagged with GPS and sent straight to the water board - before the road is damaged.', 'फटी पाइपलाइन पहचानी जाती है, GPS के साथ सीधे जल विभाग को भेजी जाती है - सड़क खराब होने से पहले।'), alt: 'Water pipe burst flooding a residential street' },
    { src: IMG.garbageFull, pos: '50% 50%', emoji: '🗑️', tag: tr('Garbage', 'कचरा'), title: tr('Overflowing dumpster', 'भरकर बहता कचरा'), text: tr('Repeat reports from the same spot are merged, so sanitation sees one clear priority instead of ten.', 'एक ही जगह की दोहराई शिकायतें जुड़ जाती हैं, ताकि सफ़ाई विभाग को दस नहीं, एक साफ़ प्राथमिकता दिखे।'), alt: 'Overflowing garbage dumpster on a city road' },
  ]
  return (
    <section data-tour="gallery" className="container-x py-16 sm:py-24">
      <SectionHead eyebrow={tr('Seen on real streets', 'असली सड़कों से')} title={<>{tr('Real problems.', 'असली समस्याएँ।')} <span className="gradient-text">{tr('Real proof.', 'असली सबूत।')}</span></>} sub={tr('Every report becomes a clear, labelled case - with an ID, severity and the department that owns it.', 'हर शिकायत एक साफ़ केस बन जाती है - ID, गंभीरता और ज़िम्मेदार विभाग के साथ।')} />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.alt} delay={i * 90}>
            <Tilt className="card group h-full overflow-hidden">
              <div className="relative aspect-[1.72] overflow-hidden">
                <ShowPhoto src={c.src} alt={c.alt} pos={c.pos} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"><span>{c.emoji}</span>{c.tag}</span>
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="font-display text-lg font-bold leading-snug">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{c.text}</p>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
      <Reveal delay={120} className="mt-4">
        <Spot className="card overflow-hidden">
          <div className="relative">
            <ShowPhoto src={IMG.proof} alt="Before and after: a pothole repaired and verified by AI" className="aspect-[1024/582] w-full" pos="50% 50%" />
          </div>
          <div className="flex flex-col gap-3 border-t border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <span className="chip bg-emerald-500/15 text-emerald-300"><BadgeCheck size={13} /> {tr('Verified closure', 'सत्यापित समाधान')}</span>
              <h3 className="mt-2 font-display text-xl font-extrabold sm:text-2xl">{tr('From critical pothole to a verified fix', 'अति गंभीर गड्ढे से सत्यापित मरम्मत तक')}</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mute">{tr('The after-photo is matched to the original spot (GPS within 38 m) and the AI checks the surface is truly repaired. Only then is the complaint closed and the scoreboard updated.', 'बाद की फ़ोटो को मूल जगह से मिलाया जाता है (GPS 38 मी. के भीतर) और AI जाँचता है कि सतह सच में ठीक हुई है। तभी शिकायत बंद होती है और स्कोरबोर्ड बदलता है।')}</p>
            </div>
            <Link to="/track/CS-1002" className="btn-ghost shrink-0">{tr('See a resolved case', 'हल हुआ केस देखें')} <ArrowRight size={16} /></Link>
          </div>
        </Spot>
      </Reveal>
    </section>
  )
}

/* ---------- STORY: scroll-filled text ---------- */
const STORY = 'Every day, citizens photograph potholes, overflowing garbage and dark streetlights. Then nothing happens. The complaint reaches the wrong desk, gets repeated, or is closed without a single repair. Chaukas AI changes what happens next.'
const STORY_HI = 'हर दिन नागरिक गड्ढों, भरे कचरे और बंद स्ट्रीट लाइटों की फ़ोटो खींचते हैं। फिर कुछ नहीं होता। शिकायत गलत मेज़ पर पहुँचती है, दोहराई जाती है, या बिना किसी मरम्मत के बंद कर दी जाती है। चौकस AI यह बदल देता है कि आगे क्या होगा।'
function Story() {
  const { tr } = useLang()
  const text = tr(STORY, STORY_HI)
  const words = useMemo(() => text.split(' '), [text])
  const refs = useRef([])
  const sec = useScrollProgress((p) => {
    const n = words.length
    refs.current.forEach((el, i) => {
      if (!el) return
      const t = Math.max(0, Math.min(1, p * 1.25 * n - i))
      el.style.opacity = String(0.16 + t * 0.84)
      el.style.filter = t > 0.5 ? 'none' : 'blur(1.5px)'
    })
  })
  return (
    <section id="story" ref={sec} className="container-x py-24 sm:py-36">
      <p className="mx-auto max-w-4xl font-display text-[1.7rem] font-bold leading-[1.25] tracking-tight sm:text-5xl sm:leading-[1.2]">
        {words.map((w, i) => (
          <span key={i} ref={(el) => { refs.current[i] = el }} className={`inline-block transition-[opacity,filter] duration-150 ${i >= words.length - 6 ? 'gradient-text' : ''}`} style={{ opacity: 0.16, marginRight: '.28em' }}>{w}</span>
        ))}
      </p>
    </section>
  )
}

/* ---------- PIPELINE (scroll timeline) ---------- */
const STEPS = [
  { icon: Camera, title: ['Capture','कैप्चर'], text: ['Snap a photo, add a Hindi or English voice note. GPS is picked automatically - no forms, no typing.','फ़ोटो खींचें, हिंदी या अंग्रेज़ी में आवाज़ से बताएँ। GPS अपने-आप लग जाता है - न फ़ॉर्म, न टाइपिंग।'], tag: ['Photo + GPS + voice','फ़ोटो + GPS + आवाज़'] },
  { icon: Brain, title: ['Understand','समझना'], text: ['The Vision agent verifies the issue, filters spam and explains exactly what it sees, with evidence.','Vision एजेंट समस्या जाँचता है, स्पैम हटाता है और सबूत के साथ बताता है कि उसने क्या देखा।'], tag: ['Vision agent','Vision एजेंट'] },
  { icon: Layers, title: ['Prioritise','प्राथमिकता'], text: ['Severity uses real context - a school nearby, repeat reports, road type - not just how big the damage looks.','गंभीरता असली संदर्भ से तय होती है - पास में स्कूल, दोहराई शिकायतें, सड़क का प्रकार - सिर्फ़ नुकसान के आकार से नहीं।'], tag: ['Rule-based severity engine','नियम-आधारित गंभीरता इंजन'] },
  { icon: RouteIcon, title: ['Route','विभाग तक'], text: ['The right department gets a formal complaint in Hindi and English, with photo and GPS attached.','सही विभाग को फ़ोटो और GPS के साथ हिंदी-अंग्रेज़ी में औपचारिक शिकायत मिलती है।'], tag: ['Router + drafter + n8n dispatch','Router + Drafter + n8n डिस्पैच'] },
  { icon: BadgeCheck, title: ['Close the loop','समाधान पक्का'], text: ['A complaint closes only when an after-photo at the same spot shows it is truly fixed.','शिकायत तभी बंद होती है जब उसी जगह की बाद की फ़ोटो दिखाए कि सच में ठीक हुआ।'], tag: ['Resolution verifier','समाधान सत्यापनकर्ता'] },
]
function Pipeline() {
  const { tr } = useLang()
  const [p, setP] = useState(0)
  const ref = useScrollProgress(setP)
  const active = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * 1.02))
  return (
    <section ref={ref} data-tour="pipeline" className="container-x py-20 sm:py-28">
      <SectionHead eyebrow={tr('How it works', 'यह कैसे काम करता है')} title={<>{tr('An action layer,', 'सिर्फ़ डिटेक्टर नहीं,')} <span className="gradient-text">{tr('not just a detector', 'एक एक्शन लेयर')}</span></>} sub={tr('Five agents work as one pipeline - and every step is visible to the citizen.', 'पाँच एजेंट एक पाइपलाइन की तरह काम करते हैं - और हर कदम नागरिक को दिखता है।')} />
      <div className="relative mx-auto mt-14 max-w-3xl">
        <div className="absolute bottom-6 left-[27px] top-6 w-[3px] rounded bg-ink/10 sm:left-[35px]">
          <div className="w-full rounded bg-gradient-to-b from-brand-500 via-cyan2 to-cyan2 shadow-[0_0_18px_rgba(47,128,255,.8)]" style={{ height: `${Math.min(100, p * 112)}%`, transition: 'height .15s linear' }} />
        </div>
        <div className="space-y-5">
          {STEPS.map(({ icon: Icon, title, text, tag }, i) => {
            const on = i <= active
            return (
              <div key={title[0]} className={`relative flex gap-4 transition-all duration-500 sm:gap-6 ${on ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition-all duration-500 sm:h-[72px] sm:w-[72px] sm:rounded-3xl ${on ? 'border-brand-400/50 bg-gradient-to-br from-brand-500 to-cyan2 text-white shadow-[0_0_30px_-4px_rgba(47,128,255,.8)]' : 'border-ink/10 bg-panel text-dim'}`}>
                  <Icon size={24} />
                  {i === active && <span className="absolute inset-0 animate-pulseRing rounded-3xl border border-brand-400/60" />}
                </div>
                <Spot className={`card flex-1 p-5 transition-colors duration-500 sm:p-6 ${i === active ? '!border-brand-400/40' : ''}`}>
                  <div className="flex items-center justify-between gap-2"><h3 className="text-xl font-bold">{tr(...title)}</h3><span className="font-display text-sm font-extrabold text-white/20">0{i + 1}</span></div>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{tr(...text)}</p>
                  <span className="chip mt-3 bg-brand-500/15 text-brand-300">{tr(...tag)}</span>
                </Spot>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- INTERACTIVE SEVERITY ---------- */
function Toggle({ on, onClick, icon: Icon, label, pts }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 active:scale-[.98] ${on ? 'border-brand-400/50 bg-brand-500/15 shadow-[0_0_30px_-8px_rgba(47,128,255,.8)]' : 'border-ink/10 bg-ink/[.03] hover:bg-ink/[.07]'}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${on ? 'bg-gradient-to-br from-brand-500 to-cyan2 text-white' : 'bg-ink/[.07] text-dim'}`}><Icon size={18} /></span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className={`text-xs font-bold ${on ? 'text-amber-300' : 'text-dim'}`}>{pts}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-500' : 'bg-ink/15'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>
    </button>
  )
}
function SeveritySim() {
  const { tr } = useLang()
  const [school, setSchool] = useState(true)
  const [reports, setReports] = useState(3)
  const [road, setRoad] = useState(true)
  const [words, setWords] = useState(false)
  const [danger, setDanger] = useState(false)
  const base = 5
  const parts = [[tr('AI damage score (from photo)', 'AI नुकसान स्कोर (फ़ोटो से)'), base], school && [tr('School within 200 m', '200 मी. में स्कूल'), 2], reports >= 4 ? [tr('Reported by 4+ citizens', '4+ नागरिकों ने बताया'), 2] : reports >= 2 ? [`${tr('Reported by', 'बताने वाले')} ${reports} ${tr('citizens', 'नागरिक')}`, 1] : null, road && [tr('Main road', 'मुख्य सड़क'), 1], words && [tr('Safety words in note', 'नोट में सुरक्षा शब्द'), 1]].filter(Boolean)
  let score = Math.min(10, parts.reduce((a, [, v]) => a + v, 0))
  if (danger) score = 10
  const level = levelFromScore(score)
  return (
    <section data-tour="severity" className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 hairline" />
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHead center={false} eyebrow={tr('Explainable by design', 'शुरू से समझने योग्य')} title={<>{tr('Same pothole.', 'वही गड्ढा।')}<br /><span className="gradient-text">{tr('Very different priority.', 'बिल्कुल अलग प्राथमिकता।')}</span></>} sub={tr('AI sets the base score. Transparent rules add local context on top - so officers and citizens can see exactly why something is Critical. Try it.', 'AI बेस स्कोर देता है। साफ़ नियम उस पर स्थानीय संदर्भ जोड़ते हैं - ताकि अफ़सर और नागरिक देख सकें कि कुछ अति गंभीर क्यों है। आज़माकर देखें।')} />
          <Reveal delay={150} className="mt-8 space-y-2.5">
            <Toggle on={school} onClick={() => setSchool(!school)} icon={School} label={tr('School or hospital within 200 m', '200 मी. में स्कूल या अस्पताल')} pts="+2" />
            <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-ink/[.03] px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/[.07] text-dim"><Repeat size={18} /></span>
              <span className="flex-1 text-sm font-semibold">{tr('Citizens who reported it', 'कितने नागरिकों ने बताया')}</span>
              <div className="flex gap-1 rounded-xl bg-ink/[.06] p-1">
                {[1, 3, 5].map((n) => <button key={n} onClick={() => setReports(n)} className={`rounded-lg px-3 py-1 text-xs font-bold transition ${reports === n ? 'bg-brand-500 text-white' : 'text-mute hover:text-fg'}`}>{n}</button>)}
              </div>
            </div>
            <Toggle on={road} onClick={() => setRoad(!road)} icon={RouteIcon} label={tr('Main or high-traffic road', 'मुख्य या भीड़ वाली सड़क')} pts="+1" />
            <Toggle on={words} onClick={() => setWords(!words)} icon={Siren} label={tr('Safety words ("fell", "child")', 'सुरक्षा शब्द ("गिर गया", "बच्चा")')} pts="+1" />
            <Toggle on={danger} onClick={() => setDanger(!danger)} icon={ShieldCheck} label={tr('Open manhole or live wire', 'खुला मैनहोल या करंट वाला तार')} pts={tr('Always critical', 'हमेशा अति गंभीर')} />
          </Reveal>
        </div>

        <Reveal delay={100}>
          <Spot className="card p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[90px] transition-colors duration-700" style={{ background: `${SEVERITY[level].color}40` }} />
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-ink/10"><div className="relative aspect-[16/9]"><RoadPhoto className="absolute inset-0 h-full w-full" /><span className="absolute left-3 top-3 rounded-full text-white bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">{tr('Pothole', 'गड्ढा')} · 94%</span></div></div>
              <div className="mt-6"><Gauge score={score} size={260} /></div>
              <ul className="mt-8 space-y-2">
                {(danger ? [[tr('Open manhole / live wire', 'खुला मैनहोल / करंट वाला तार'), tr('Always Critical', 'हमेशा अति गंभीर')]] : parts.map(([l, v]) => [l, `+${v}`])).map(([l, v]) => (
                  <li key={l} className="flex animate-pop items-center justify-between rounded-xl border border-ink/10 bg-ink/[.04] px-3.5 py-2 text-sm"><span className="text-mute">{l}</span><b className="text-amber-300">{v}</b></li>
                ))}
              </ul>
            </div>
          </Spot>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- BENTO FEATURES ---------- */
function VoiceViz() {
  const { tr } = useLang()
  return (
    <div className="mt-5 rounded-2xl border border-ink/10 bg-ink/[.05] p-4">
      <div className="flex h-12 items-center gap-[3px]">{Array.from({ length: 36 }).map((_, i) => <span key={i} className="flex-1 origin-center animate-wave rounded-full bg-gradient-to-t from-brand-500 to-cyan2" style={{ height: '100%', animationDelay: `${(i * 53) % 700}ms` }} />)}</div>
      <div className="mt-3 flex items-center gap-2 text-sm text-mute"><Mic size={14} className="text-brand-300" />{tr('"स्कूल के सामने बड़ा गड्ढा है"', '"स्कूल के सामने बड़ा गड्ढा है"')}</div>
    </div>
  )
}
function ClusterViz() {
  const dots = [[-60, -30], [-48, 34], [54, -36], [62, 30], [0, -52], [8, 50]]
  return (
    <div className="relative mt-5 grid h-32 place-items-center rounded-2xl border border-ink/10 bg-ink/[.05]">
      {dots.map(([x, y], i) => <span key={i} className="absolute h-3 w-3 animate-converge rounded-full bg-brand-400 shadow-[0_0_12px_#5AA2FF]" style={{ '--tx': `${x}px`, '--ty': `${y}px`, animationDelay: `${i * 120}ms` }} />)}
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-xs font-extrabold shadow-[0_0_24px_rgba(239,68,68,.7)]">6</span>
    </div>
  )
}
function ScoreViz() {
  return (
    <div className="mt-5 space-y-3 rounded-2xl border border-ink/10 bg-ink/[.05] p-4">
      {[['PWD', 78], ['Jal Sansthan', 61], ['Nagar Nigam', 44]].map(([n, v], i) => (
        <div key={n}><div className="mb-1 flex justify-between text-xs"><span className="text-mute">{n}</span><b>{v}%</b></div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full origin-left rounded-full bg-gradient-to-r from-brand-500 to-cyan2" style={{ width: `${v}%`, animation: `fillbar 1.6s cubic-bezier(.2,.7,.2,1) ${i * 150}ms both` }} /></div></div>
      ))}
    </div>
  )
}
function VerifyViz() {
  const { tr } = useLang()
  return (
    <div className="relative mt-5 h-32 overflow-hidden rounded-2xl border border-ink/10">
      <RoadPhoto fixed className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 overflow-hidden" style={{ animation: 'wipe 5s ease-in-out infinite alternate' }}><RoadPhoto className="absolute inset-0 h-full w-full" /></div>
      <span className="absolute bottom-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold">{tr('Verified', 'सत्यापित')}</span>
    </div>
  )
}
function Bento() {
  const { tr } = useLang()
  const items = [
    { span: 'lg:col-span-2', icon: School, title: tr('Context-aware severity', 'संदर्भ-आधारित गंभीरता'), text: tr('The same pothole scores higher near a school or hospital, on a main road, or when many citizens report it.', 'वही गड्ढा स्कूल/अस्पताल के पास, मुख्य सड़क पर या कई नागरिकों के बताने पर ज़्यादा स्कोर पाता है।'), viz: (
      <div className="relative mt-5 h-40 overflow-hidden rounded-2xl border border-ink/10"><RoadPhoto className="absolute inset-0 h-full w-full" pos="70% 60%" /><span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-black"><School size={12} />{tr('School 120 m · +2', 'स्कूल 120 मी. · +2')}</span><span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold"><span className="h-1.5 w-1.5 animate-blink rounded-full bg-white" />{tr('CRITICAL', 'अति गंभीर')}</span></div>) },
    { icon: Languages, title: tr('Hindi voice complaints', 'हिंदी आवाज़ में शिकायत'), text: tr('Speak naturally in Hindi or Hinglish. No typing needed.', 'हिंदी या हिंग्लिश में बोलिए। टाइप करने की ज़रूरत नहीं।'), viz: <VoiceViz /> },
    { icon: Repeat, title: tr('Duplicate clustering', 'दोहराई शिकायतों का समूह'), text: tr('Ten reports of one pothole become one high-priority issue.', 'एक गड्ढे की दस शिकायतें एक ऊँची प्राथमिकता वाली शिकायत बन जाती हैं।'), viz: <ClusterViz /> },
    { icon: BadgeCheck, title: tr('Resolution verification', 'समाधान का सत्यापन'), text: tr('Before and after photos with GPS matching. No fake closures.', 'GPS मिलान के साथ पहले और बाद की फ़ोटो। फ़र्ज़ी क्लोज़र नहीं।'), viz: <VerifyViz /> },
    { icon: Trophy, title: tr('Accountability scoreboard', 'जवाबदेही स्कोरबोर्ड'), text: tr('Department-wise resolution rate and closure time - public by default.', 'विभाग-वार समाधान दर और समय - सबके लिए खुला।'), viz: <ScoreViz /> },
  ]
  return (
    <section className="container-x py-20 sm:py-28">
      <SectionHead eyebrow={tr('Why it is different', 'यह अलग क्यों है')} title={<>{tr('Built for citizens,', 'नागरिकों के लिए,')} <span className="gradient-text">{tr('officers and cities', 'अफ़सरों और शहरों के लिए')}</span></>} sub={tr('Six ideas that turn a complaint box into an accountable system.', 'छह विचार जो शिकायत पेटी को जवाबदेह व्यवस्था बनाते हैं।')} />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ span = '', icon: Icon, title, text, viz }, i) => (
          <Reveal key={i} delay={(i % 3) * 90} className={span}>
            <Tilt className="card h-full p-5 sm:p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-cyan2/10 text-brand-300"><Icon size={20} /></span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{text}</p>
              {viz}
            </Tilt>
          </Reveal>
        ))}
        <Reveal delay={180} className="sm:col-span-2 lg:col-span-3">
          <Spot className="card flex flex-col items-start justify-between gap-5 bg-gradient-to-br from-brand-600/30 via-cyan2/20 to-transparent p-6 sm:flex-row sm:items-center sm:p-8">
            <div><span className="chip bg-ink/10 text-white">{tr('Ready to try', 'आज़माने को तैयार')}</span><h3 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">{tr('See it on a real map', 'असली नक्शे पर देखें')}</h3><p className="mt-2 max-w-md text-sm text-mute">{tr('Roorkee and Muzaffarnagar, colour-coded by AI severity, with a live department scoreboard.', 'रुड़की और मुज़फ़्फ़रनगर, AI गंभीरता के रंगों में, लाइव विभाग स्कोरबोर्ड के साथ।')}</p></div>
            <Link to="/dashboard" className="btn-dark shrink-0">{tr('Open dashboard', 'डैशबोर्ड खोलें')} <ArrowRight size={16} /></Link>
          </Spot>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- CTA ---------- */
/* ---------- CITY VISION (real photo + parallax) ---------- */
function CityVision() {
  const { tr } = useLang()
  const [p, setP] = useState(0.5)
  const ref = useScrollProgress(setP)
  const chips = [[Camera, tr('Photo to priority', 'फ़ोटो से प्राथमिकता तक'), tr('under a minute', 'एक मिनट से कम')], [Languages, tr('Hindi + English', 'हिंदी + अंग्रेज़ी'), tr('voice and letters', 'आवाज़ और पत्र')], [BadgeCheck, tr('Verified closure', 'सत्यापित समाधान'), tr('after-photo, same GPS', 'बाद की फ़ोटो, वही GPS')]]
  return (
    <section className="container-x py-12 sm:py-20">
      <Reveal>
        <div ref={ref} data-theme="dark" className="relative isolate overflow-hidden rounded-[2rem] border border-ink/10 text-fg shadow-card">
          <CityPhoto className="absolute inset-0 -z-10 h-[125%] w-full" style={{ transform: `translateY(${(0.5 - p) * 70 - 30}px) scale(1.04)`, willChange: 'transform' }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#05070F]/95 via-[#05070F]/60 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#05070F]/90 via-transparent to-transparent" />
          <div className="relative flex min-h-[26rem] flex-col justify-between gap-10 p-6 sm:min-h-[32rem] sm:p-12">
            <div className="max-w-xl">
              <span className="eyebrow">{tr('Built to scale', 'बड़े स्तर के लिए बना')}</span>
              <h2 className="h-display mt-4 text-[2rem] sm:text-5xl">{tr('From one pothole to', 'एक गड्ढे से')} <span className="gradient-text">{tr('a whole city', 'पूरे शहर तक')}</span></h2>
              <p className="mt-4 text-base leading-relaxed text-mute sm:text-lg">{tr('The same pipeline that fixes one street can watch every ward - verified reports, transparent priorities and a public scoreboard for every department.', 'जो पाइपलाइन एक गली ठीक करती है वही हर वार्ड पर नज़र रख सकती है - सत्यापित शिकायतें, साफ़ प्राथमिकताएँ और हर विभाग का सार्वजनिक स्कोरबोर्ड।')}</p>
              <div className="mt-6"><Magnetic><Link to="/dashboard" className="btn-primary !px-6 !py-3.5">{tr('Explore the city dashboard', 'शहर डैशबोर्ड देखें')} <ArrowRight size={16} /></Link></Magnetic></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {chips.map(([Icon, t, d]) => (
                <div key={t} className="glass flex items-center gap-3 rounded-2xl p-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan2 text-white"><Icon size={18} /></span>
                  <div><div className="font-display text-sm font-bold">{t}</div><div className="text-xs text-mute">{d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function CTA() {
  const { tr } = useLang()
  const { canInstall, install, ios } = usePWAInstall()
  return (
    <section className="container-x pb-10 pt-6 sm:pb-16">
      <Reveal>
        <div className="noise relative overflow-hidden rounded-[2rem] border border-ink/10 bg-panel px-6 py-14 text-center sm:py-20">
          <CityPhoto className="absolute inset-0 h-full w-full opacity-[.28] dark:opacity-[.35]" />
          <div className="absolute inset-0 bg-gradient-to-b from-panel/80 via-panel/70 to-panel/95" />
          <Aurora className="opacity-80" />
          <div className="grid-bg absolute inset-0" />
          <div className="relative">
            <h2 className="h-display mx-auto max-w-3xl text-[2rem] sm:text-6xl">{tr('See a problem?', 'कोई समस्या दिखी?')}<br /><span className="gradient-text">{tr('Report it in 30 seconds.', '30 सेकंड में दर्ज करें।')}</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-mute sm:text-lg">{tr('Photo, location, voice. Chaukas AI does the rest - and keeps everyone honest until it is fixed.', 'फ़ोटो, लोकेशन, आवाज़। बाकी चौकस AI करता है - और ठीक होने तक सबको जवाबदेह रखता है।')}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Magnetic><Link to="/report" className="btn-primary !px-7 !py-4 text-base"><Camera size={19} /> {tr('Report an issue', 'समस्या दर्ज करें')}</Link></Magnetic>
              <Magnetic><Link to="/track" className="btn-ghost !px-7 !py-4 text-base"><MapPin size={17} /> {tr('Track a complaint', 'शिकायत ट्रैक करें')}</Link></Magnetic>
              {canInstall && <button onClick={install} className="btn-ghost !px-7 !py-4 text-base"><Download size={17} /> {tr('Install app', 'ऐप इंस्टॉल करें')}</button>}
            </div>
            {ios && !canInstall && <p className="mt-4 text-xs text-dim">{tr('On iPhone: tap Share, then "Add to Home Screen" to install.', 'iPhone पर: Share दबाएँ, फिर "Add to Home Screen"।')}</p>}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- PHONE DEMO SECTION ---------- */
function Demo() {
  const { tr } = useLang()
  const pts = [[Camera, tr('Snap or speak', 'खींचें या बोलें'), tr('One photo, GPS auto-filled, Hindi voice supported.', 'एक फ़ोटो, GPS अपने-आप, हिंदी आवाज़ भी चलेगी।')], [Brain, tr('AI verifies and scores', 'AI जाँचता और स्कोर देता है'), tr('Vision agent plus local context - school, hospital, repeats.', 'Vision एजेंट और स्थानीय संदर्भ - स्कूल, अस्पताल, दोहराव।')], [RouteIcon, tr('Routed and drafted', 'विभाग तक और पत्र तैयार'), tr('Right department, formal letter in English and Hindi.', 'सही विभाग, हिंदी-अंग्रेज़ी में औपचारिक पत्र।')], [BadgeCheck, tr('Closure proven', 'समाधान का प्रमाण'), tr('After-photo checked against the original.', 'बाद की फ़ोटो को मूल से मिलाकर जाँचा जाता है।')]]
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="container-x grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
        <div data-tour="phone-demo" className="order-2 lg:order-1"><PhoneDemo /></div>
        <div className="order-1 lg:order-2">
          <SectionHead center={false} eyebrow={tr('Live walkthrough', 'लाइव वॉकथ्रू')} title={<>{tr('The whole journey,', 'पूरा सफ़र,')} <span className="gradient-text">{tr('in your pocket', 'आपकी जेब में')}</span></>} sub={tr('Watch a real complaint travel from a citizen\'s phone to a verified repair - the same flow you can try right now.', 'देखें एक असली शिकायत नागरिक के फ़ोन से सत्यापित मरम्मत तक कैसे पहुँचती है - यही फ़्लो आप अभी आज़मा सकते हैं।')} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {pts.map(([Icon, t, d], i) => (
              <Reveal key={t} delay={i * 80}><Tilt className="card h-full p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan2 text-white"><Icon size={18} /></span><div className="mt-3 font-display font-bold">{t}</div><p className="mt-1 text-sm leading-relaxed text-mute">{d}</p></Tilt></Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  const { complaints } = useComplaints()
  const stats = computeStats(complaints)
  return (
    <div className="-mt-16">
      <Hero stats={stats} />
      <Marquee />
      <Demo />
      <Gallery />
      <Story />
      <Pipeline />
      <SeveritySim />
      <Bento />
      <CityVision />
      <CTA />
    </div>
  )
}
