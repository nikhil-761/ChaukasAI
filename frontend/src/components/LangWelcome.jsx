import { useEffect, useState } from 'react'
import Logo from './Logo'
import { useLang } from '../lib/i18n'

const KEY = 'chaukas-lang-chosen'

// Pehli baar aane par: "भाषा चुनें / Choose language" (Splash ke baad)
export default function LangWelcome() {
  const { setLang } = useLang()
  const [show, setShow] = useState(false)
  useEffect(() => {
    let done = false
    try { done = !!localStorage.getItem(KEY) } catch { done = true }
    if (done) return undefined
    const t = setTimeout(() => setShow(true), 2300) // splash (~2.1s) ke baad
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  const pick = (l) => { setLang(l); try { localStorage.setItem(KEY, '1') } catch {}; setShow(false) }
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-label="Choose language">
      <div className="w-full max-w-sm animate-pop rounded-3xl border border-ink/15 bg-panel p-6 text-center text-fg shadow-card">
        <Logo className="mx-auto h-14 w-14" glow />
        <h2 className="mt-4 font-display text-2xl font-extrabold">Choose your language</h2>
        <p className="font-display text-xl font-bold text-brand-300">अपनी भाषा चुनें</p>
        <p className="mt-2 text-sm text-mute">The site and the Guided Tutor voice will use it.<br />साइट और गाइडेड ट्यूटर की आवाज़ इसी भाषा में होगी।</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => pick('en')} className="btn-ghost !py-4 text-base font-bold">English</button>
          <button onClick={() => pick('hi')} className="btn-primary !py-4 text-base font-bold">हिन्दी</button>
        </div>
      </div>
    </div>
  )
}
