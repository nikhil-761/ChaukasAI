import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, X, ArrowLeft, ArrowRight, Volume2, VolumeX, RotateCcw, Check, Info } from 'lucide-react'
import { useLang, LangSwitch } from '../lib/i18n'
import { TOUR } from '../lib/tourSteps'

const VOICE_KEY = 'chaukas-tutor-voice'
const SEEN_KEY = 'chaukas-tutor-seen'

/* ---------------- Speech (browser text-to-speech) ---------------- */
function pickVoice(lang) {
  const vs = window.speechSynthesis.getVoices() || []
  const norm = (v) => v.lang.replace('_', '-').toLowerCase()
  const prefs = lang === 'hi' ? ['hi-in', 'hi'] : ['en-in', 'en-gb', 'en-us', 'en']
  for (const p of prefs) {
    const v = vs.find((x) => norm(x) === p) || vs.find((x) => norm(x).startsWith(p.split('-')[0] + '-') && p.length === 2)
    if (v) return v
  }
  return null
}

// text ko chhote tukdon me todo (Chrome lambi awaaz ~15s par chup ho jata hai)
function chunkText(text, max = 170) {
  const parts = text.replace(/\s+/g, ' ').match(/[^।.!?]+[।.!?]*/g) || [text]
  const out = []
  let cur = ''
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    if ((cur + ' ' + p).trim().length > max && cur) { out.push(cur); cur = p } else cur = (cur + ' ' + p).trim()
  }
  if (cur) out.push(cur)
  return out
}

function useSpeech(lang) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState(false)
  const [engine, setEngine] = useState('')
  const token = useRef(0)
  const timers = useRef([])
  const keep = useRef([]) // utterance ko GC se bachane ke liye
  const audioRef = useRef(null)

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }

  const stop = useCallback(() => {
    token.current++
    clearTimers()
    try { if (supported) window.speechSynthesis.cancel() } catch {}
    if (audioRef.current) { try { audioRef.current.pause() } catch {} audioRef.current = null }
    setSpeaking(false)
  }, [supported])

  // Cloud fallback: jab device me us bhasha ki awaaz install nahi ho
  const speakCloud = useCallback((chunks, my, l) => {
    setEngine('cloud')
    let k = 0
    const next = () => {
      if (token.current !== my) return
      if (k >= chunks.length) { setSpeaking(false); return }
      const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${l === 'hi' ? 'hi' : 'en'}&q=${encodeURIComponent(chunks[k++])}`)
      audioRef.current = a
      a.onplaying = () => { if (token.current === my) { setSpeaking(true); setError(false) } }
      a.onended = next
      a.onerror = () => { if (token.current === my) { setSpeaking(false); setError(true) } }
      a.play().catch(() => { if (token.current === my) { setSpeaking(false); setError(true) } })
    }
    next()
  }, [])

  const speakSystem = useCallback((chunks, my, l, voice) => {
    setEngine('system')
    let k = 0
    let started = false
    const next = () => {
      if (token.current !== my) return
      if (k >= chunks.length) { setSpeaking(false); return }
      const u = new SpeechSynthesisUtterance(chunks[k++])
      u.lang = l === 'hi' ? 'hi-IN' : 'en-IN'
      if (voice) u.voice = voice
      u.rate = l === 'hi' ? 0.95 : 1
      u.onstart = () => { started = true; if (token.current === my) { setSpeaking(true); setError(false) } }
      u.onend = next
      u.onerror = (e) => { if (token.current === my && e.error !== 'interrupted' && e.error !== 'canceled') { setSpeaking(false); speakCloud(chunks.slice(k - 1), my, l) } }
      keep.current = [u]
      window.speechSynthesis.speak(u)
      window.speechSynthesis.resume?.()
    }
    next()
    // 2.5s me awaaz shuru nahi hui -> cloud awaaz try karo
    later(() => { if (!started && token.current === my) { try { window.speechSynthesis.cancel() } catch {} speakCloud(chunks, my, l) } }, 2500)
  }, [speakCloud])

  const speak = useCallback((text) => {
    if (!text) return
    stop()
    const my = token.current
    setError(false)
    const chunks = chunkText(text)
    later(() => {
      if (token.current !== my) return
      if (!supported) { speakCloud(chunks, my, lang); return }
      const voice = pickVoice(lang)
      const haveVoices = (window.speechSynthesis.getVoices() || []).length > 0
      // awaaz list aa chuki hai par is bhasha ki nahi mili -> seedha cloud
      if (haveVoices && !voice) speakCloud(chunks, my, lang)
      else speakSystem(chunks, my, lang, voice)
    }, 120)
  }, [supported, lang, stop, speakCloud, speakSystem])

  useEffect(() => () => { token.current++; clearTimers(); try { window.speechSynthesis?.cancel() } catch {} if (audioRef.current) audioRef.current.pause() }, [])
  return { supported, speaking, speak, stop, error, engine }
}

/* ---------------- helpers ---------------- */
const rootOf = (p) => '/' + (p.split('/')[1] || '')
const readVoicePref = () => { try { return localStorage.getItem(VOICE_KEY) !== 'off' } catch { return true } }

function useTargetRect(selector, active) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!active || !selector) { setRect(null); return undefined }
    let raf
    let last = ''
    const tick = () => {
      const el = document.querySelector(`[data-tour="${selector}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        const k = [r.top, r.left, r.width, r.height].map((n) => Math.round(n)).join(',')
        if (k !== last) { last = k; setRect({ top: r.top, left: r.left, width: r.width, height: r.height }) }
      } else if (last !== 'none') { last = 'none'; setRect(null) }
      raf = setTimeout(tick, 90)
    }
    tick()
    return () => clearTimeout(raf)
  }, [selector, active])
  return rect
}

/* ---------------- Floating launcher ---------------- */
function Launcher({ onClick, pulse }) {
  const { tr } = useLang()
  return (
    <button onClick={onClick} aria-label={tr('Open Guided Tutor', 'गाइडेड ट्यूटर खोलें')}
      className="fixed bottom-[calc(104px+var(--safe-b))] right-3 z-[45] flex items-center gap-2 rounded-full border border-brand-400/50 bg-canvas/90 py-2 pl-2 pr-4 text-sm font-bold text-fg shadow-[0_12px_34px_-8px_rgba(47,128,255,.7)] backdrop-blur-xl transition active:scale-95 md:bottom-6 md:right-6 md:hover:-translate-y-0.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan2 text-white">
        {pulse && <span className="absolute inset-0 animate-pulseRing rounded-full bg-brand-500/60" />}
        <GraduationCap size={18} className="relative" />
      </span>
      <span>{tr('Guided Tutor', 'गाइडेड ट्यूटर')}</span>
    </button>
  )
}

/* ---------------- Main ---------------- */
export default function GuidedTutor() {
  const { lang, tr } = useLang()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const [voiceOn, setVoiceOn] = useState(readVoicePref)
  const [seen, setSeen] = useState(() => { try { return !!localStorage.getItem(SEEN_KEY) } catch { return true } })
  const { supported, speaking, speak, stop, error, engine } = useSpeech(lang)
  const step = TOUR[i]
  const [targetKey, setTargetKey] = useState(null) // target tab ke route par aane ke baad hi dhoondho
  const rect = useTargetRect(targetKey, open)
  const cardRef = useRef(null)
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)

  useEffect(() => {
    const on = () => setVh(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const begin = () => {
    // current page ke pehle step se shuru; nahi mile to shuru se
    const idx = TOUR.findIndex((s) => rootOf(s.path) === rootOf(pathname))
    setI(idx > 0 && pathname !== '/' ? idx : 0)
    setOpen(true)
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setSeen(true)
  }
  const close = useCallback(() => { setOpen(false); setTargetKey(null); stop() }, [stop])

  // step badalte hi: sahi page par jao, target dhoondho, scroll karo
  useEffect(() => {
    if (!open) return undefined
    setTargetKey(null)
    if (rootOf(step.path) !== rootOf(pathname)) { nav(step.path); return undefined }
    if (!step.target) { window.scrollTo({ top: step.path === '/' && i === 0 ? 0 : window.scrollY, behavior: 'smooth' }); return undefined }
    let tries = 0
    let t
    const find = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        const tall = r.height > window.innerHeight * 0.62
        el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' })
        setTargetKey(step.target)
      } else if (tries++ < 18) t = setTimeout(find, 100)
    }
    t = setTimeout(find, 120)
    return () => clearTimeout(t)
  }, [open, i, pathname]) // eslint-disable-line

  // bolo: step ya language badalne par
  useEffect(() => {
    if (!open) return
    if (voiceOn) speak(`${step.title[lang === 'hi' ? 1 : 0]}. ${step.text[lang === 'hi' ? 1 : 0]}`)
    else stop()
  }, [open, i, lang, voiceOn]) // eslint-disable-line

  useEffect(() => { if (open) { const on = (e) => e.key === 'Escape' && close(); window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on) } return undefined }, [open, close])

  const toggleVoice = () => {
    const v = !voiceOn
    setVoiceOn(v)
    try { localStorage.setItem(VOICE_KEY, v ? 'on' : 'off') } catch {}
    if (!v) stop()
  }
  const next = () => (i >= TOUR.length - 1 ? close() : setI(i + 1))
  const back = () => setI(Math.max(0, i - 1))

  const idx = lang === 'hi' ? 1 : 0
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (pathname.startsWith('/admin') && !open) return null
  if (!open) {
    return (
      <Launcher onClick={begin} pulse={!seen} />
    )
  }

  // spotlight geometry (viewport me clamp)
  const pad = 8
  let hole = null
  if (rect && rect.height > 0) {
    const top = Math.max(6, rect.top - pad)
    const bottom = Math.min(vh - 6, rect.top + rect.height + pad)
    if (bottom > top + 10) hole = { top, left: Math.max(6, rect.left - pad), width: Math.min(window.innerWidth - 12, rect.width + pad * 2), height: bottom - top }
  }
  // card upar rakhein ya neeche: jahan target nahi hai
  const holeMid = hole ? hole.top + hole.height / 2 : null
  const cardAtTop = hole ? holeMid > vh * 0.55 : false
  const cardPos = cardAtTop
    ? { top: 'calc(76px + var(--safe-t, 0px))' }
    : { bottom: isMobile ? 'calc(92px + var(--safe-b, 0px))' : 'calc(20px + var(--safe-b, 0px))' }
  const centered = !hole

  return (
    <div className="fixed inset-0 z-[90]" style={{ pointerEvents: 'none' }} role="dialog" aria-label="Guided Tutor">
      {/* dim + spotlight */}
      {hole ? (
        <div className="absolute rounded-2xl ring-2 ring-brand-400 transition-all duration-300" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height, boxShadow: '0 0 0 9999px rgba(3,6,18,.66), 0 0 40px 4px rgba(47,128,255,.55)' }}>
          <span className="absolute -inset-1 animate-pulseRing rounded-[1.2rem] border border-brand-400/60" />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(3,6,18,.62)' }} />
      )}

      {/* tutor card */}
      <div className={`absolute inset-x-3 mx-auto w-auto max-w-[460px] ${centered ? 'top-1/2 -translate-y-1/2' : ''}`} style={{ ...(centered ? {} : cardPos), pointerEvents: 'auto' }}>
        <div ref={cardRef} key={i} className="animate-fadeUp overflow-hidden rounded-3xl border border-ink/15 bg-panel text-fg shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]">
          <div className="h-1 bg-ink/10"><div className="h-full bg-gradient-to-r from-brand-500 to-cyan2 transition-all duration-500" style={{ width: `${((i + 1) / TOUR.length) * 100}%` }} /></div>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan2 text-white"><GraduationCap size={16} /></span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-dim">{tr('Step', 'कदम')} {i + 1} / {TOUR.length}</span>
                {speaking && <span className="flex h-3.5 items-center gap-0.5">{[0, 1, 2, 3].map((k) => <span key={k} className="h-full w-0.5 animate-wave rounded bg-brand-400" style={{ animationDelay: `${k * 110}ms` }} />)}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <LangSwitch compact />
                <button onClick={close} aria-label={tr('Close tutor', 'ट्यूटर बंद करें')} className="grid h-8 w-8 place-items-center rounded-full border border-line bg-ink/[.06] text-mute transition hover:text-fg active:scale-90"><X size={15} /></button>
              </div>
            </div>

            <h3 className="mt-3 font-display text-xl font-extrabold leading-snug">{step.title[idx]}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{step.text[idx]}</p>

            {voiceOn && error && (
              <div className="mt-3 flex gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>{tr('Could not play the voice. Use Chrome or Edge, turn up the volume and stay online, then tap the replay button. Install a Hindi voice in Windows/Android Settings > Language > Text-to-speech for offline voice. The text above still works.', 'आवाज़ नहीं चल पाई। Chrome या Edge इस्तेमाल करें, वॉल्यूम बढ़ाएँ और इंटरनेट चालू रखें, फिर दोबारा सुनें बटन दबाएँ। ऑफ़लाइन आवाज़ के लिए Windows/Android की सेटिंग में भाषा → टेक्स्ट-टू-स्पीच में हिंदी जोड़ें। ऊपर का लिखा हुआ पाठ फिर भी पढ़ सकते हैं।')}</span>
              </div>
            )}
            {voiceOn && !error && !speaking && engine === 'cloud' && null}

            <div className="mt-4 flex items-center gap-2">
              <button onClick={back} disabled={i === 0} className="btn-ghost btn-sm" aria-label={tr('Back', 'पीछे')}><ArrowLeft size={15} /><span className="hidden sm:inline"> {tr('Back', 'पीछे')}</span></button>
              {true && (
                <>
                  <button onClick={toggleVoice} aria-pressed={voiceOn} aria-label={voiceOn ? tr('Mute voice', 'आवाज़ बंद करें') : tr('Turn on voice', 'आवाज़ चालू करें')} className={`grid h-9 w-9 place-items-center rounded-full border transition active:scale-90 ${voiceOn ? 'border-brand-400/50 bg-brand-500/15 text-brand-300' : 'border-line bg-ink/[.06] text-dim'}`}>
                    {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <button onClick={() => speak(`${step.title[idx]}. ${step.text[idx]}`)} aria-label={tr('Replay', 'दोबारा सुनें')} title={tr('Replay', 'दोबारा सुनें')} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ink/[.06] text-mute transition hover:text-fg active:scale-90"><RotateCcw size={15} /></button>
                </>
              )}
              <button onClick={next} className="btn-primary btn-sm ml-auto">
                {i >= TOUR.length - 1 ? <><Check size={15} /> {tr('Finish', 'पूरा करें')}</> : <>{tr('Next', 'आगे')} <ArrowRight size={15} /></>}
              </button>
            </div>
            {i > 0 && i < TOUR.length - 1 && (
              <button onClick={close} className="mt-3 w-full text-center text-xs text-dim underline">{tr('Skip tour', 'दौरा छोड़ें')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
