import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Brain, Layers, Route as RouteIcon, BadgeCheck, ArrowRight, School, Repeat, ShieldCheck, Siren, MapPin, Building2, ClipboardList, FileText, Clock, Phone, Search, ListChecks } from 'lucide-react'
import { useComplaints } from '../lib/useComplaints'
import { computeStats } from '../lib/api'
import { SEVERITY, levelFromScore } from '../lib/constants'
import { Reveal } from '../components/fx'
import Gauge from '../components/Gauge'
import { ShowPhoto, IMG } from '../components/Photo'
import { useLang } from '../lib/i18n'

const Section = ({ eyebrow, title, sub, children, className = '', ...rest }) => (
  <section className={`container-x py-12 sm:py-16 ${className}`} {...rest}>
    <div className="max-w-3xl">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="h-display mt-2 text-2xl sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-mute">{sub}</p>}
    </div>
    <div className="mt-8">{children}</div>
  </section>
)

/* ---------- HERO ---------- */
function Hero({ stats }) {
  const { tr } = useLang()
  return (
    <section className="border-b border-ink/10 bg-panel">
      <div className="container-x grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
        <div>
          <span className="eyebrow">{tr('For municipal and utility departments', 'नगर निकाय और उपयोगिता विभागों के लिए')}</span>
          <h1 className="h-display mt-3 text-3xl sm:text-5xl">
            {tr('Citizen complaints, sorted and sent to the right department - with proof of the fix.', 'नागरिक शिकायतें, छँटकर सही विभाग तक - मरम्मत के प्रमाण के साथ।')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
            {tr('PWD, Jal Sansthan, Nagar Nigam and the electricity department get one queue: photo, exact location, severity score, duplicate reports merged, and a ready complaint letter in Hindi and English.', 'PWD, जल संस्थान, नगर निगम और बिजली विभाग को मिलती है एक कतार: फ़ोटो, सटीक लोकेशन, गंभीरता स्कोर, दोहराई शिकायतें जुड़ी हुईं, और हिंदी-अंग्रेज़ी में तैयार शिकायत पत्र।')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/report" data-tour="hero-report" className="btn-saffron !px-6 !py-3"><Camera size={17} /> {tr('Report an issue', 'समस्या दर्ज करें')}</Link>
            <Link to="/department" className="btn-ghost !px-6 !py-3"><Building2 size={17} /> {tr('Open department panel', 'विभाग पैनल खोलें')}</Link>
          </div>
          <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-ink/10 pt-5">
            {[[stats.total || 40, tr('Complaints handled', 'शिकायतें संभाली')], [`${stats.rate}%`, tr('Resolved', 'हल हुईं')], ['12 s', tr('Photo to routed case', 'फ़ोटो से रूटेड केस')]].map(([v, l]) => (
              <div key={l}><dd className="text-2xl font-bold text-brand-500">{v}</dd><dt className="mt-0.5 text-xs text-dim">{l}</dt></div>
            ))}
          </dl>
        </div>

        <div data-tour="hero-card" className="card">
          <div className="relative aspect-[16/10] bg-panel2"><ShowPhoto src={IMG.before} alt="Pothole reported by a citizen" className="h-full w-full" pos="50% 60%" /></div>
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold">CS-1002</span>
              <span className="flex gap-2"><span className="chip bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">{tr('Critical', 'अति गंभीर')} · 9/10</span><span className="chip bg-panel2 text-mute">{tr('Road damage', 'सड़क खराब')}</span></span>
            </div>
            <div className="text-base font-semibold leading-snug">{tr('Deep pothole near school gate, two-wheelers skidding', 'स्कूल गेट के पास गहरा गड्ढा, दोपहिया फिसल रहे हैं')}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 text-xs text-mute">
              <div><div className="label !mb-0.5">{tr('Routed to', 'भेजा गया')}</div><b className="text-fg">PWD, Roorkee</b></div>
              <div><div className="label !mb-0.5">{tr('Why this score', 'यह स्कोर क्यों')}</div><b className="text-fg">{tr('Photo 6 + school 200 m + 2 repeats', 'फ़ोटो 6 + स्कूल 200 मी. + 2 दोहराव')}</b></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PROBLEM (department view) ---------- */
function Problem() {
  const { tr } = useLang()
  const rows = [
    [Phone, tr('Complaints arrive everywhere', 'शिकायतें हर जगह से आती हैं'), tr('Phone calls, WhatsApp, written applications and CM-helpline tickets - no single queue.', 'फ़ोन, व्हाट्सऐप, लिखित आवेदन और हेल्पलाइन टिकट - कोई एक कतार नहीं।')],
    [Layers, tr('Same problem, ten tickets', 'एक समस्या, दस टिकट'), tr('Every neighbour reports the same pothole, so staff cannot tell one big problem from ten small ones.', 'हर पड़ोसी वही गड्ढा बताता है, इसलिए एक बड़ी समस्या और दस छोटी में फ़र्क करना मुश्किल।')],
    [MapPin, tr('No exact location or photo', 'सटीक लोकेशन या फ़ोटो नहीं'), tr('"Near the chowk" costs a field visit just to find the spot.', '"चौक के पास" का मतलब जगह खोजने के लिए ही फ़ील्ड विज़िट।')],
    [BadgeCheck, tr('Closed on paper, not on the road', 'काग़ज़ पर बंद, सड़क पर नहीं'), tr('There is no proof the work was done, so citizens re-complain and trust drops.', 'काम होने का कोई सबूत नहीं, इसलिए नागरिक दोबारा शिकायत करते हैं और भरोसा घटता है।')],
  ]
  return (
    <Section eyebrow={tr('What departments deal with today', 'आज विभागों की दिक्कत')} title={tr('The work is not the problem. The inbox is.', 'दिक्कत काम की नहीं, शिकायतों के ढेर की है।')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([Icon, t, d]) => (
          <div key={t} className="card p-5"><Icon size={22} className="text-saffron" /><h3 className="mt-3 text-base font-bold leading-snug">{t}</h3><p className="mt-1.5 text-sm leading-relaxed text-mute">{d}</p></div>
        ))}
      </div>
    </Section>
  )
}

/* ---------- PIPELINE ---------- */
function Pipeline() {
  const { tr } = useLang()
  const steps = [
    [Camera, tr('Capture', 'फ़ोटो'), tr('Citizen sends a photo, GPS location and a voice or text note in Hindi or English.', 'नागरिक फ़ोटो, GPS लोकेशन और हिंदी/अंग्रेज़ी में आवाज़ या टेक्स्ट नोट भेजता है।')],
    [Brain, tr('Understand', 'समझना'), tr('The vision model checks it is a real civic issue, names the category and rates the damage.', 'विज़न मॉडल जाँचता है कि असली नागरिक समस्या है, श्रेणी बताता है और नुकसान आँकता है।')],
    [Layers, tr('Prioritise', 'प्राथमिकता'), tr('Nearby school or hospital, main road, repeat reports and safety words adjust the score.', 'पास का स्कूल/अस्पताल, मुख्य सड़क, दोहराई शिकायतें और सुरक्षा शब्द स्कोर बदलते हैं।')],
    [RouteIcon, tr('Route', 'भेजना'), tr('The case goes to the right department for that city, with a formal letter attached.', 'केस उस शहर के सही विभाग को, औपचारिक पत्र के साथ जाता है।')],
    [BadgeCheck, tr('Verify', 'सत्यापन'), tr('The department uploads an after-photo. AI checks the same spot is truly repaired before closing.', 'विभाग बाद की फ़ोटो डालता है। बंद करने से पहले AI जाँचता है कि उसी जगह मरम्मत हुई।')],
  ]
  return (
    <Section data-tour="pipeline" eyebrow={tr('How it works', 'यह कैसे काम करता है')} title={tr('Five steps from photo to verified closure', 'फ़ोटो से सत्यापित समाधान तक पाँच कदम')} className="border-t border-ink/10">
      <ol className="grid gap-4 md:grid-cols-5">
        {steps.map(([Icon, t, d], i) => (
          <li key={t} className="card p-4">
            <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded bg-brand-500 text-xs font-bold text-white">{i + 1}</span><Icon size={18} className="text-brand-500" /></div>
            <h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm leading-relaxed text-mute">{d}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/* ---------- DEPARTMENTS ---------- */
function Departments() {
  const { tr } = useLang()
  const depts = [
    ['PWD', tr('Road damage, potholes', 'सड़क खराब, गड्ढे'), tr('Queue sorted by severity, school-zone potholes first; after-photo proof for every repair.', 'गंभीरता से क्रमबद्ध कतार, स्कूल क्षेत्र के गड्ढे पहले; हर मरम्मत का बाद की फ़ोटो से प्रमाण।')],
    [tr('Jal Sansthan / Jal Nigam', 'जल संस्थान / जल निगम'), tr('Pipe bursts, water leakage', 'पाइप फटना, पानी का रिसाव'), tr('Leaks tagged with GPS, so a team reaches the spot before the road is damaged.', 'रिसाव GPS के साथ, ताकि सड़क खराब होने से पहले टीम पहुँचे।')],
    [tr('Nagar Nigam / Nagar Palika', 'नगर निगम / नगर पालिका'), tr('Garbage, drainage', 'कचरा, नाली'), tr('Repeat reports from one spot merge into one task, so sanitation sees a clear priority.', 'एक जगह की दोहराई शिकायतें एक टास्क बनती हैं, सफ़ाई विभाग को साफ़ प्राथमिकता दिखती है।')],
    [tr('Electricity / street lighting', 'बिजली / स्ट्रीट लाइट'), tr('Dark streets, broken lamps, live wires', 'अँधेरी गली, टूटे लैंप, खुले तार'), tr('Live-wire reports are always Critical and jump to the top of the queue.', 'खुले तार की शिकायत हमेशा अति गंभीर, कतार में सबसे ऊपर।')],
  ]
  return (
    <section data-tour="dept-section" className="border-y border-ink/10 bg-panel">
      <div className="container-x py-12 sm:py-16">
        <span className="eyebrow">{tr('Built around departments', 'विभागों को केंद्र में रखकर')}</span>
        <h2 className="h-display mt-2 max-w-3xl text-2xl sm:text-4xl">{tr('Each department sees only its own work - and can prove it finished it', 'हर विभाग को सिर्फ़ अपना काम दिखता है - और वह पूरा करने का प्रमाण दे सकता है')}</h2>
        <div className="mt-8 overflow-x-auto rounded-lg border border-ink/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-panel2 text-xs font-semibold text-dim"><tr><th className="px-4 py-3">{tr('Department', 'विभाग')}</th><th className="px-4 py-3">{tr('Complaint types', 'शिकायत के प्रकार')}</th><th className="px-4 py-3">{tr('What they get', 'उन्हें क्या मिलता है')}</th></tr></thead>
            <tbody className="divide-y divide-ink/10">
              {depts.map(([d, t, g]) => <tr key={d}><td className="px-4 py-3.5 font-bold text-brand-500">{d}</td><td className="px-4 py-3.5 text-mute">{t}</td><td className="px-4 py-3.5 text-mute">{g}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/department" className="btn-primary"><Building2 size={16} /> {tr('Try the department panel', 'विभाग पैनल आज़माएँ')}</Link>
          <Link to="/dashboard" className="btn-ghost">{tr('City dashboard', 'शहर डैशबोर्ड')} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- SEVERITY SIMULATOR ---------- */
function Toggle({ on, onClick, icon: Icon, label, pts }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`flex w-full items-center gap-3 rounded-md border px-3.5 py-2.5 text-left ${on ? 'border-brand-500 bg-brand-500/5' : 'border-ink/15 bg-panel'}`}>
      <Icon size={18} className={on ? 'text-brand-500' : 'text-dim'} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs font-bold text-saffron">{pts}</span>
      <span className={`grid h-5 w-5 place-items-center rounded border ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink/30'}`}>{on && <BadgeCheck size={13} />}</span>
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
  const parts = [[tr('AI damage score (from photo)', 'AI नुकसान स्कोर (फ़ोटो से)'), base]]
  if (school) parts.push([tr('School within 200 m', '200 मी. में स्कूल'), 2])
  if (reports >= 4) parts.push([tr('Reported by 4+ citizens', '4+ नागरिकों ने बताया'), 2])
  else if (reports >= 2) parts.push([tr('Reported by 2-3 citizens', '2-3 नागरिकों ने बताया'), 1])
  if (road) parts.push([tr('Main road', 'मुख्य सड़क'), 1])
  if (words) parts.push([tr('Safety words in note', 'नोट में सुरक्षा शब्द'), 1])
  let score = Math.min(10, parts.reduce((a, [, v]) => a + v, 0))
  if (danger) score = 10
  const level = levelFromScore(score)
  return (
    <section data-tour="severity" className="border-b border-ink/10">
      <div className="container-x grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          <span className="eyebrow">{tr('Transparent scoring', 'पारदर्शी स्कोरिंग')}</span>
          <h2 className="h-display mt-2 text-2xl sm:text-4xl">{tr('Same pothole, different priority - and the reason is shown', 'वही गड्ढा, अलग प्राथमिकता - और कारण भी दिखता है')}</h2>
          <p className="mt-3 text-mute">{tr('Officers can see why a case is ranked where it is. Switch the options to try it.', 'अधिकारी देख सकते हैं कि केस इस क्रम में क्यों है। विकल्प बदलकर देखें।')}</p>
          <div className="mt-6 space-y-2">
            <Toggle on={school} onClick={() => setSchool(!school)} icon={School} label={tr('School or hospital within 200 m', '200 मी. में स्कूल या अस्पताल')} pts="+2" />
            <div className="flex items-center gap-3 rounded-md border border-ink/15 bg-panel px-3.5 py-2.5">
              <Repeat size={18} className="text-dim" />
              <span className="flex-1 text-sm font-medium">{tr('Citizens who reported it', 'कितने नागरिकों ने बताया')}</span>
              <div className="flex gap-1">{[1, 3, 5].map((n) => <button key={n} onClick={() => setReports(n)} className={`rounded px-3 py-1 text-xs font-bold ${reports === n ? 'bg-brand-500 text-white' : 'bg-panel2 text-mute'}`}>{n}</button>)}</div>
            </div>
            <Toggle on={road} onClick={() => setRoad(!road)} icon={RouteIcon} label={tr('Main or high-traffic road', 'मुख्य या भीड़ वाली सड़क')} pts="+1" />
            <Toggle on={words} onClick={() => setWords(!words)} icon={Siren} label={tr('Safety words ("fell", "child")', 'सुरक्षा शब्द ("गिर गया", "बच्चा")')} pts="+1" />
            <Toggle on={danger} onClick={() => setDanger(!danger)} icon={ShieldCheck} label={tr('Open manhole or live wire', 'खुला मैनहोल या करंट वाला तार')} pts={tr('Always critical', 'हमेशा अति गंभीर')} />
          </div>
        </div>
        <div className="card p-5 sm:p-7">
          <Gauge score={score} size={250} />
          <div className="mt-2 text-center text-sm font-bold" style={{ color: SEVERITY[level].color }}>{tr(SEVERITY[level].label, SEVERITY[level].hi)}</div>
          <ul className="mt-5 divide-y divide-ink/10 rounded-md border border-ink/10 text-sm">
            {(danger ? [[tr('Open manhole / live wire', 'खुला मैनहोल / करंट वाला तार'), tr('Always Critical', 'हमेशा अति गंभीर')]] : parts.map(([l, v]) => [l, `+${v}`])).map(([l, v]) => (
              <li key={l} className="flex items-center justify-between px-3.5 py-2"><span className="text-mute">{l}</span><b>{v}</b></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- REAL CASES ---------- */
function Gallery() {
  const { tr } = useLang()
  const cards = [
    { src: IMG.streetNight, tag: tr('Streetlight', 'स्ट्रीट लाइट'), dept: tr('Electricity department', 'बिजली विभाग'), title: tr('Dark street, broken lamp', 'अँधेरी गली, टूटा लैंप'), alt: 'Broken streetlight on a dark street at night' },
    { src: IMG.waterBurst, tag: tr('Water leakage', 'पानी का रिसाव'), dept: 'Jal Sansthan', title: tr('Burst pipe flooding the lane', 'फटी पाइपलाइन से गली में पानी'), alt: 'Water pipe burst flooding a street' },
    { src: IMG.garbageFull, tag: tr('Garbage', 'कचरा'), dept: tr('Nagar Nigam - Sanitation', 'नगर निगम - सफ़ाई'), title: tr('Overflowing dumpster', 'भरकर बहता कचरा'), alt: 'Overflowing garbage dumpster' },
  ]
  return (
    <Section data-tour="gallery" eyebrow={tr('Case examples', 'केस के उदाहरण')} title={tr('What a department receives', 'विभाग को क्या मिलता है')} sub={tr('Each case arrives with a photo, a category, a severity and the department it belongs to.', 'हर केस फ़ोटो, श्रेणी, गंभीरता और संबंधित विभाग के साथ आता है।')}>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Reveal key={c.alt}>
            <div className="card h-full">
              <div className="aspect-[1.72] overflow-hidden"><ShowPhoto src={c.src} alt={c.alt} className="h-full w-full" /></div>
              <div className="p-4"><span className="chip bg-panel2 text-mute">{c.tag}</span><h3 className="mt-2 font-bold leading-snug">{c.title}</h3><p className="mt-1 text-sm text-mute">{tr('Routed to', 'भेजा गया')}: <b className="text-fg">{c.dept}</b></p></div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="card mt-4">
        <ShowPhoto src={IMG.proof} alt="Before and after: a pothole repaired and verified by AI" className="aspect-[1024/582] w-full" />
        <div className="flex flex-col gap-3 border-t border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"><BadgeCheck size={13} /> {tr('Verified closure', 'सत्यापित समाधान')}</span>
            <h3 className="mt-2 text-lg font-bold">{tr('From critical pothole to a verified fix', 'अति गंभीर गड्ढे से सत्यापित मरम्मत तक')}</h3>
            <p className="mt-1 max-w-2xl text-sm text-mute">{tr('The after-photo must match the original GPS spot, and the AI checks the surface is truly repaired. A wrong or unrelated photo is rejected and the case stays open.', 'बाद की फ़ोटो मूल GPS जगह से मेल खानी चाहिए और AI जाँचता है कि मरम्मत हुई। ग़लत या असंबंधित फ़ोटो अस्वीकार होती है और केस खुला रहता है।')}</p>
          </div>
          <Link to="/track/CS-1002" className="btn-ghost shrink-0">{tr('See a resolved case', 'हल हुआ केस देखें')} <ArrowRight size={16} /></Link>
        </div>
      </div>
    </Section>
  )
}

function CTA() {
  const { tr } = useLang()
  return (
    <section className="bg-brand-500 text-white">
      <div className="container-x flex flex-col items-start justify-between gap-5 py-10 sm:flex-row sm:items-center">
        <div><h2 className="text-2xl font-bold sm:text-3xl">{tr('See the whole flow in two minutes', 'पूरा फ़्लो दो मिनट में देखें')}</h2><p className="mt-1 text-white/80">{tr('Report an issue, then open the department panel and close it with an after-photo.', 'समस्या दर्ज करें, फिर विभाग पैनल में बाद की फ़ोटो से उसे बंद करें।')}</p></div>
        <div className="flex flex-wrap gap-3"><Link to="/report" className="btn-saffron !px-6">{tr('Report an issue', 'समस्या दर्ज करें')}</Link><Link to="/department" className="btn border border-white/50 text-white hover:bg-white/10">{tr('Department panel', 'विभाग पैनल')}</Link></div>
      </div>
    </section>
  )
}

export default function Landing() {
  const { complaints } = useComplaints()
  const stats = computeStats(complaints)
  return (
    <div className="-mt-px">
      <Hero stats={stats} />
      <Problem />
      <Pipeline />
      <Departments />
      <SeveritySim />
      <Gallery />
      <CTA />
    </div>
  )
}
