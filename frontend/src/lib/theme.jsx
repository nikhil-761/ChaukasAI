import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Sun, Moon, MonitorSmartphone } from 'lucide-react'

const KEY = 'chaukas-theme' // 'light' | 'dark' | 'system'
const Ctx = createContext({ mode: 'system', theme: 'dark', setMode: () => {}, cycle: () => {} })

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

function readMode() {
  try { const m = localStorage.getItem(KEY); if (m === 'light' || m === 'dark' || m === 'system') return m } catch {}
  return 'system'
}

function apply(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F3F6FF' : '#05070F')
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readMode)
  const [sys, setSys] = useState(systemTheme)
  const theme = mode === 'system' ? sys : mode

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const on = () => setSys(mq.matches ? 'light' : 'dark')
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on)
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on) }
  }, [])

  useEffect(() => { apply(theme) }, [theme])

  const setMode = useCallback((m) => {
    setModeState(m)
    try { localStorage.setItem(KEY, m) } catch {}
  }, [])
  const cycle = useCallback(() => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'), [mode, setMode])

  return <Ctx.Provider value={{ mode, theme, setMode, cycle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)

const OPTS = [
  { k: 'light', label: 'Light', Icon: Sun },
  { k: 'dark', label: 'Dark', Icon: Moon },
  { k: 'system', label: 'Device', Icon: MonitorSmartphone },
]

/** 3-way segmented switch: Light / Dark / Device */
export function ThemeSwitch({ className = '', labels = false }) {
  const { mode, setMode } = useTheme()
  const idx = OPTS.findIndex((o) => o.k === mode)
  return (
    <div role="radiogroup" aria-label="Theme" className={`relative inline-flex items-center rounded-full border border-line bg-ink/[.05] p-[3px] ${className}`}>
      <span aria-hidden className="absolute left-[3px] top-[3px] h-[calc(100%-6px)] rounded-full bg-gradient-to-br from-brand-500 to-cyan2 shadow-[0_4px_14px_-2px_rgb(var(--brand)/.7)] transition-transform duration-300 ease-[cubic-bezier(.3,.8,.2,1)]" style={{ width: 'calc((100% - 6px) / 3)', transform: `translateX(${idx * 100}%)` }} />
      {OPTS.map(({ k, label, Icon }) => (
        <button key={k} role="radio" aria-checked={mode === k} aria-label={`${label} mode`} title={`${label} mode`} onClick={() => setMode(k)}
          className={`relative z-10 grid h-8 place-items-center rounded-full transition-colors ${labels ? 'w-auto flex-1 grid-flow-col gap-1.5 px-3 text-xs font-semibold' : 'w-8'} ${mode === k ? 'text-white' : 'text-mute hover:text-fg'}`}>
          <Icon size={15} />{labels && label}
        </button>
      ))}
    </div>
  )
}

/** compact single button (cycles modes) for tight spaces */
export function ThemeButton({ className = '' }) {
  const { mode, cycle } = useTheme()
  const o = OPTS.find((x) => x.k === mode)
  return (
    <button onClick={cycle} aria-label={`Theme: ${o.label}. Tap to change`} title={`Theme: ${o.label}`} className={`grid h-9 w-9 place-items-center rounded-full border border-line bg-ink/[.06] text-fg transition active:scale-90 ${className}`}>
      <o.Icon size={16} key={mode} className="animate-pop" />
    </button>
  )
}
