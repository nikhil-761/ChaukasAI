import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { adminHealth, USE_MOCK } from '../lib/api'
import { useLang } from '../lib/i18n'

// Real backend mode: server na mile to chhota banner dikhao (retry apne-aap). Demo mode me kuch nahi dikhta.
export default function ApiStatus() {
  const { tr } = useLang()
  const [down, setDown] = useState(false)
  useEffect(() => {
    if (USE_MOCK) return undefined
    let live = true
    let fails = 0
    const ping = async () => {
      const h = await adminHealth()
      fails = h.ok ? 0 : fails + 1
      if (live) setDown(fails >= 2)
    }
    ping()
    const t = setInterval(ping, 12000)
    return () => { live = false; clearInterval(t) }
  }, [])
  if (!down) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-red-500/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg backdrop-blur" style={{ paddingTop: 'max(.5rem, env(safe-area-inset-top))' }}>
      <WifiOff size={14} className="shrink-0" />
      <span>{tr('Server is not reachable. Retrying automatically...', 'सर्वर से कनेक्ट नहीं हो पा रहा। अपने-आप दोबारा कोशिश हो रही है...')}</span>
    </div>
  )
}
