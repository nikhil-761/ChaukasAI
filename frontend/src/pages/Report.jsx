import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ImagePlus, MapPin, Mic, MicOff, Check, ArrowRight, ArrowLeft, Navigation, Copy, FileText, Sparkles, X } from 'lucide-react'
import MapView from '../components/MapView'
import ExplainCard from '../components/ExplainCard'
import { Reveal } from '../components/fx'
import { submitComplaint, USE_MOCK } from '../lib/api'
import { useLang } from '../lib/i18n'

const STEPS = [['Photo', 'फ़ोटो'], ['Location', 'लोकेशन'], ['Details', 'विवरण']]
const PIPE = [
  ['Vision Agent', 'Checking the photo is a real civic issue', 'Vision एजेंट', 'जाँच कि फ़ोटो असली नागरिक समस्या की है'],
  ['Context Agent', 'Looking for nearby schools and repeat reports', 'Context एजेंट', 'आसपास स्कूल और दोहराई शिकायतें खोज रहा है'],
  ['Severity Engine', 'Scoring with transparent rules', 'Severity इंजन', 'साफ़ नियमों से स्कोर दे रहा है'],
  ['Router', 'Finding the responsible department', 'Router', 'ज़िम्मेदार विभाग ढूँढ रहा है'],
  ['Drafter', 'Writing the complaint in Hindi and English', 'Drafter', 'हिंदी और अंग्रेज़ी में शिकायत लिख रहा है'],
]

/* Cinematic processing screen: the user's own photo gets "scanned" */
function Processing({ preview, idx }) {
  const { tr } = useLang()
  const pct = Math.min(100, Math.round(((idx + 1) / PIPE.length) * 100))
  return (
    <div className="container-x grid min-h-[78vh] max-w-4xl place-items-center py-8">
      <div className="grid w-full items-center gap-8 md:grid-cols-[1fr_1.05fr]">
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-8 rounded-full bg-brand-600/30 blur-[80px]" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-ink/15 shadow-card">
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-panel2" />}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-600/20 via-transparent to-cyan-400/15" />
            <div className="absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-cyan2/40 to-transparent"><div className="absolute inset-x-0 bottom-0 h-px bg-cyan2 shadow-[0_0_18px_#22D3EE]" /></div>
            {['left-3 top-3 border-l-2 border-t-2 rounded-tl-xl', 'right-3 top-3 border-r-2 border-t-2 rounded-tr-xl', 'left-3 bottom-3 border-l-2 border-b-2 rounded-bl-xl', 'right-3 bottom-3 border-r-2 border-b-2 rounded-br-xl'].map((c) => <span key={c} className={`absolute h-8 w-8 border-mint ${c}`} />)}
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl text-white bg-black/55 px-3 py-2 text-[11px] font-bold tracking-widest backdrop-blur"><span className="text-mint">{tr('ANALYSING', 'जाँच जारी')}</span><span>{pct}%</span></div>
          </div>
        </div>
        <div>
          <h2 className="h-display text-3xl">{tr('Chaukas AI is', 'चौकस AI')} <span className="gradient-text">{tr('working', 'काम कर रहा है')}</span></h2>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint transition-all duration-700" style={{ width: `${pct}%` }} /></div>
          <ul className="mt-6 space-y-2.5">
            {PIPE.map(([n, d, nh, dh], i) => (
              <li key={n} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${i <= idx ? 'border-ink/10 bg-ink/[.05] opacity-100' : 'border-transparent opacity-30'}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-brand-500' : 'bg-ink/10'}`}>
                  {i < idx ? <Check size={14} strokeWidth={3} /> : i === idx ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> : null}
                </span>
                <div><div className="text-sm font-bold">{tr(n, nh)}</div><div className="text-xs text-dim">{tr(d, dh)}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Report() {
  const { lang: gLang, tr } = useLang()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pos, setPos] = useState([29.8543, 77.888])
  const [located, setLocated] = useState(false)
  const [area, setArea] = useState('')
  const [text, setText] = useState('')
  const [lang, setLang] = useState(gLang)
  const [letterLang, setLetterLang] = useState(gLang)
  useEffect(() => { setLang(gLang); setLetterLang(gLang) }, [gLang])
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pipeIdx, setPipeIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [geoErr, setGeoErr] = useState('')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const recRef = useRef(null)
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  const onFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const reverse = async (lat, lng) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`)
      const j = await r.json()
      const a = j.address || {}
      setArea([a.suburb || a.neighbourhood || a.road, a.city || a.town || a.village].filter(Boolean).join(', ') || j.display_name?.split(',').slice(0, 2).join(','))
    } catch { /* offline: ignore */ }
  }

  const locate = () => {
    setGeoErr('')
    if (!navigator.geolocation) return setGeoErr(tr('Location is not supported on this device. Tap on the map to set it.', 'इस डिवाइस पर लोकेशन उपलब्ध नहीं है। नक्शे पर टैप करके चुनें।'))
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos([p.coords.latitude, p.coords.longitude]); setLocated(true); reverse(p.coords.latitude, p.coords.longitude) },
      () => setGeoErr(tr('Could not get GPS. Tap on the map to set the location manually.', 'GPS नहीं मिला। नक्शे पर टैप करके लोकेशन चुनें।')),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  const pickOnMap = (p) => { setPos(p); setLocated(true); reverse(p[0], p[1]) }

  const toggleMic = () => {
    if (!SR) return
    if (listening) { recRef.current?.stop(); return }
    const rec = new SR()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = true
    rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(' '))
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start(); setListening(true)
  }

  const submit = async () => {
    setBusy(true); setPipeIdx(0); setErr('')
    const timer = setInterval(() => setPipeIdx((i) => Math.min(i + 1, PIPE.length - 1)), USE_MOCK ? 750 : 1800)
    try {
      const data = await submitComplaint({ file, lat: pos[0], lng: pos[1], area, text, language: lang })
      await new Promise((r) => setTimeout(r, USE_MOCK ? 3900 : 900))
      setResult(data)
    } catch (e) {
      const d = e?.detail
      if (d && typeof d === 'object' && d.en) { setErr(tr(d.en, d.hi)); setStep(0) }
      else if (e?.status === 0) setErr(tr('Cannot reach the server. Check your internet and try again.', 'सर्वर से कनेक्ट नहीं हो पाया। इंटरनेट जाँचकर दोबारा कोशिश करें।'))
      else if (e?.status === 429) setErr(tr('Too many requests. Please wait a minute and try again.', 'बहुत ज़्यादा अनुरोध। एक मिनट रुककर दोबारा कोशिश करें।'))
      else if (e?.status === 413) setErr(tr('This photo is too large. Please choose a smaller one.', 'यह फ़ोटो बहुत बड़ी है। छोटी फ़ोटो चुनें।'))
      else setErr(e?.message || tr('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। दोबारा कोशिश करें।'))
    } finally { clearInterval(timer); setBusy(false) }
  }

  const reset = () => { setStep(0); setFile(null); setPreview(null); setText(''); setResult(null); setLocated(false); setArea('') }
  const copy = () => { navigator.clipboard?.writeText(result.complaint_text[letterLang]); setCopied(true); setTimeout(() => setCopied(false), 1600) }

  /* ---------- RESULT ---------- */
  if (result) {
    return (
      <div className="container-x max-w-4xl py-8 sm:py-12">
        <div className="mb-7 flex items-center gap-4 animate-fadeUp">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_0_40px_-4px_rgba(52,245,197,.7)]">
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-emerald-400/50" />
            <Check size={28} strokeWidth={3} className="relative" />
          </span>
          <div>
            <h1 className="h-display text-3xl sm:text-4xl">{tr('Complaint submitted', 'शिकायत दर्ज हो गई')}</h1>
            <p className="text-sm text-mute">{tr('Save your ID', 'अपनी ID सेव करें')} <b className="text-fg">{result.complaint_id}</b> {tr('to track progress.', 'प्रगति देखने के लिए।')}</p>
          </div>
        </div>
        <ExplainCard c={result} />
        <Reveal className="card mt-5 p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold"><FileText size={16} className="text-brand-300" /> {tr('Auto-drafted complaint', 'अपने-आप बना शिकायत पत्र')}</div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-ink/[.07] p-1 text-xs font-bold">
                {[['en', 'English'], ['hi', 'हिंदी']].map(([k, l]) => <button key={k} onClick={() => setLetterLang(k)} className={`rounded-lg px-3 py-1 transition ${letterLang === k ? 'bg-brand-500 text-white' : 'text-mute'}`}>{l}</button>)}
              </div>
              <button className="btn-ghost btn-sm" onClick={copy}>{copied ? <><Check size={13} /> {tr('Copied', 'कॉपी हुआ')}</> : <><Copy size={13} /> {tr('Copy', 'कॉपी')}</>}</button>
            </div>
          </div>
          <div className="text-sm font-semibold">{result.complaint_text.subject}</div>
          <p key={letterLang} className="mt-2 animate-fadeIn text-sm leading-relaxed text-mute">{result.complaint_text[letterLang]}</p>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/track/${result.complaint_id}`} className="btn-primary">{tr('Track this complaint', 'शिकायत ट्रैक करें')} <ArrowRight size={16} /></Link>
          <Link to="/dashboard" className="btn-ghost">{tr('See on live map', 'लाइव नक्शे पर देखें')}</Link>
          <button className="btn-ghost" onClick={reset}>{tr('Report another', 'एक और शिकायत')}</button>
        </div>
      </div>
    )
  }

  if (busy) return <Processing preview={preview} idx={pipeIdx} />

  /* ---------- FORM ---------- */
  const canNext = step === 0 ? !!file : step === 1 ? located : true
  return (
    <div className="container-x max-w-3xl py-6 sm:py-10">
      <div className="animate-fadeUp">
        <h1 className="h-display text-3xl sm:text-5xl">{tr('Report a', 'नागरिक समस्या')} <span className="gradient-text">{tr('civic issue', 'दर्ज करें')}</span></h1>
        <p className="mt-2 text-sm text-mute sm:text-base">{tr('Takes about 30 seconds. We handle the rest.', 'सिर्फ़ 30 सेकंड लगते हैं। बाकी हम संभालेंगे।')}</p>
      </div>
      {err && <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300 animate-fadeIn"><span className="mt-0.5">⚠️</span><span className="min-w-0 flex-1">{err}</span><button className="shrink-0 text-xs underline" onClick={() => setErr('')}>{tr('Dismiss', 'हटाएँ')}</button></div>}

      <ol data-tour="report-steps" className="my-7 flex items-center gap-2">
        {STEPS.map(([s, sh], i) => (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all duration-500 ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-gradient-to-br from-brand-500 to-cyan2 text-white shadow-glow' : 'bg-ink/10 text-dim'}`}>
              {i < step ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`hidden text-sm font-semibold sm:block ${i === step ? 'text-fg' : 'text-dim'}`}>{tr(s, sh)}</span>
            {i < STEPS.length - 1 && <span className="relative h-0.5 flex-1 overflow-hidden rounded bg-ink/10"><span className="absolute inset-y-0 left-0 rounded bg-emerald-500 transition-all duration-700" style={{ width: i < step ? '100%' : '0%' }} /></span>}
          </li>
        ))}
      </ol>

      <div className="card p-4 sm:p-7">
        <div key={step} className="animate-fadeUp">
          {step === 0 && (
            <div>
              <div className="label">{tr('Step 1 · Photo of the problem', 'स्टेप 1 · समस्या की फ़ोटो')}</div>
              {preview ? (
                <div className="relative overflow-hidden rounded-3xl border border-ink/10">
                  <img src={preview} alt="Selected" className="max-h-[440px] w-full object-cover" />
                  <button onClick={() => { setFile(null); setPreview(null) }} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full text-white bg-black/65 px-3.5 py-2 text-xs font-bold backdrop-blur"><X size={13} /> {tr('Change', 'बदलें')}</button>
                  <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-bold"><Check size={13} /> {tr('Photo ready', 'फ़ोटो तैयार')}</span>
                </div>
              ) : (
                <div data-tour="report-photo" className="grid gap-3 sm:grid-cols-2">
                  <label className="group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-3xl border border-brand-400/40 bg-gradient-to-br from-brand-500/20 to-cyan2/10 px-4 py-12 text-center transition hover:border-brand-400/70">
                    <span className="absolute inset-0 animate-shine opacity-40" style={{ background: 'linear-gradient(100deg,transparent 30%,rgba(255,255,255,.12),transparent 70%)' }} />
                    {['left-3 top-3 border-l-2 border-t-2 rounded-tl-lg', 'right-3 top-3 border-r-2 border-t-2 rounded-tr-lg', 'left-3 bottom-3 border-l-2 border-b-2 rounded-bl-lg', 'right-3 bottom-3 border-r-2 border-b-2 rounded-br-lg'].map((c) => <span key={c} className={`absolute h-5 w-5 border-brand-300/80 ${c}`} />)}
                    <span className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan2 text-white shadow-glow transition group-hover:scale-110"><Camera size={28} /></span>
                    <span className="relative font-display text-lg font-bold">{tr('Take a photo', 'फ़ोटो खींचें')}</span>
                    <span className="relative text-xs text-mute">{tr('Opens the camera on your phone', 'फ़ोन का कैमरा खुलेगा')}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                  <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed border-ink/20 px-4 py-12 text-center transition hover:border-ink/40 hover:bg-ink/[.04]">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-ink/10 text-mute transition group-hover:scale-110"><ImagePlus size={28} /></span>
                    <span className="font-display text-lg font-bold">{tr('Upload from gallery', 'गैलरी से चुनें')}</span>
                    <span className="text-xs text-mute">{tr('JPG or PNG', 'JPG या PNG')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                </div>
              )}
              <p className="mt-4 flex gap-2 text-xs text-dim"><Sparkles size={14} className="mt-px shrink-0 text-brand-300" />{tr('Keep the damage in the centre and include some surroundings (road marking, building) so we can verify the fix later.', 'खराबी को बीच में रखें और आसपास की चीज़ें (रोड मार्किंग, इमारत) भी दिखाएँ, ताकि बाद में समाधान जाँचा जा सके।')}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="label">{tr('Step 2 · Where is it?', 'स्टेप 2 · यह कहाँ है?')}</div>
              <button data-tour="report-locate" className="btn-primary mb-4 w-full sm:w-auto" onClick={locate}><Navigation size={16} /> {tr('Use my current location', 'मेरी मौजूदा लोकेशन लें')}</button>
              {geoErr && <p className="mb-3 text-sm text-amber-300">{geoErr}</p>}
              <div className="overflow-hidden rounded-3xl border border-ink/10"><MapView center={pos} zoom={14} height={300} pickable picked={located ? pos : null} onPick={pickOnMap} flyTo={located ? pos : undefined} rounded="rounded-none" /></div>
              <p className="mt-2 text-xs text-dim">{tr('Or tap on the map to drop a pin.', 'या नक्शे पर टैप करके पिन लगाएँ।')}</p>
              <div className="mt-4">
                <label className="label" htmlFor="area">{tr('Area / landmark', 'इलाका / लैंडमार्क')}</label>
                <input id="area" className="input" placeholder={tr('e.g. Near Civil Lines school', 'जैसे: सिविल लाइन्स स्कूल के पास')} value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              {located && <div className="mt-3 inline-flex animate-pop items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300"><MapPin size={14} /> {pos[0].toFixed(5)}, {pos[1].toFixed(5)}</div>}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="label">{tr('Step 3 · Tell us more (optional)', 'स्टेप 3 · थोड़ा और बताएँ (ज़रूरी नहीं)')}</div>
              <div className="mb-3 inline-flex rounded-xl bg-ink/[.07] p-1 text-sm font-semibold" data-tour="report-lang">
                {[['hi', 'हिंदी'], ['en', 'English']].map(([k, l]) => (
                  <button key={k} onClick={() => setLang(k)} className={`rounded-lg px-4 py-1.5 transition ${lang === k ? 'bg-brand-500 text-white' : 'text-mute'}`}>{l}</button>
                ))}
              </div>
              <textarea className="input min-h-32" placeholder={lang === 'hi' ? 'समस्या के बारे में लिखिए या बोलिए... जैसे: स्कूल के सामने बड़ा गड्ढा है' : 'Describe the problem or use the mic...'} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button data-tour="report-mic" onClick={toggleMic} disabled={!SR} className={`btn ${listening ? 'bg-red-500 text-white shadow-[0_0_30px_-4px_rgba(239,68,68,.8)]' : 'btn-ghost'}`}>
                  {listening ? <><MicOff size={16} /> {tr('Stop', 'रोकें')}</> : <><Mic size={16} /> {tr('Speak', 'बोलें')}</>}
                </button>
                {listening && <span className="flex items-center gap-2 text-sm text-red-300"><span className="flex h-4 items-center gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className="h-full w-0.5 animate-wave rounded bg-red-400" style={{ animationDelay: `${i * 110}ms` }} />)}</span>{tr('Listening...', 'सुन रहा हूँ...')}</span>}
                {!SR && <span className="text-xs text-dim">{tr('Voice input works in Chrome / Edge.', 'वॉइस इनपुट Chrome / Edge में चलता है।')}</span>}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ink/10 bg-ink/[.04] p-3">
                {preview && <img src={preview} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                <div className="min-w-0 text-sm"><div className="font-bold">{tr('Ready to submit', 'जमा करने के लिए तैयार')}</div><div className="truncate text-dim">{area || `${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`}</div></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> {tr('Back', 'पीछे')}</button>
          {step < 2
            ? <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{tr('Next', 'आगे')} <ArrowRight size={16} /></button>
            : <button className="btn-primary" onClick={submit}>{tr('Submit complaint', 'शिकायत जमा करें')} <ArrowRight size={16} /></button>}
        </div>
      </div>
    </div>
  )
}
