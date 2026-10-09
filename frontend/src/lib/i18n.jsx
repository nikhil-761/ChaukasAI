import { toHindi } from './dataHi'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const KEY = 'chaukas-lang' // 'en' | 'hi'
const Ctx = createContext({ lang: 'en', setLang: () => {}, tr: (en) => en, tx: (s) => s })

function readLang() {
  try { const l = localStorage.getItem(KEY); if (l === 'en' || l === 'hi') return l } catch {}
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLang)
  useEffect(() => { document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en') }, [lang])
  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch {}
  }, [])
  // tr('English text', 'हिंदी टेक्स्ट') -> picks by current language
  const tr = useCallback((en, hi) => (lang === 'hi' && hi ? hi : en), [lang])
  // tx(dynamicString) -> demo data ka Hindi (agar glossary me ho)
  const tx = useCallback((s) => (lang === 'hi' ? toHindi(s) : s), [lang])
  return <Ctx.Provider value={{ lang, setLang, tr, tx }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** EN | हिं segmented switch */
export function LangSwitch({ className = '', compact = false, ...rest }) {
  const { lang, setLang } = useLang()
  const opts = [['en', 'EN', 'English'], ['hi', 'हिं', 'हिन्दी']]
  return (
    <div role="radiogroup" aria-label="Language" {...rest} className={`relative inline-flex items-center rounded-full border border-line bg-ink/[.05] p-[3px] ${className}`}>
      <span aria-hidden className="absolute left-[3px] top-[3px] h-[calc(100%-6px)] rounded-full bg-gradient-to-br from-brand-500 to-cyan2 shadow-[0_4px_14px_-2px_rgb(var(--brand)/.7)] transition-transform duration-300 ease-[cubic-bezier(.3,.8,.2,1)]" style={{ width: 'calc((100% - 6px) / 2)', transform: `translateX(${lang === 'hi' ? 100 : 0}%)` }} />
      {opts.map(([k, short, full]) => (
        <button key={k} role="radio" aria-checked={lang === k} aria-label={full} title={full} onClick={() => setLang(k)}
          className={`relative z-10 h-8 rounded-full text-xs font-bold transition-colors ${compact ? 'w-9' : 'px-3.5'} ${lang === k ? 'text-white' : 'text-mute hover:text-fg'}`}>
          {compact ? short : full}
        </button>
      ))}
    </div>
  )
}

/** <T>English demo text</T> -> Hindi agar glossary me ho */
export function T({ children }) {
  const { tx } = useLang()
  return typeof children === 'string' ? tx(children) : children
}
