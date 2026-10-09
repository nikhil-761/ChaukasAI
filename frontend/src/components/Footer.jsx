import { Link } from 'react-router-dom'
import Logo from './Logo'
import { ThemeSwitch } from '../lib/theme'
import { useLang, LangSwitch } from '../lib/i18n'

export default function Footer() {
  const { tr } = useLang()
  return (
    <footer className="mt-16 hidden border-t border-ink/10 bg-panel md:block">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5"><Logo className="h-8 w-8" /><span className="text-lg font-bold text-brand-500">Chaukas AI</span></div>
          <p className="mt-3 max-w-sm text-sm text-dim">{tr('A complaint-handling tool for city departments: verify the photo, prioritise by severity, route to the right department and prove the fix.', 'शहर के विभागों के लिए शिकायत प्रबंधन टूल: फ़ोटो जाँचो, गंभीरता से प्राथमिकता तय करो, सही विभाग को भेजो और समाधान का प्रमाण दो।')}</p>
        </div>
        <div className="text-sm"><div className="label">{tr('Pages', 'पन्ने')}</div><div className="flex flex-col gap-2 text-mute"><Link to="/report" className="hover:text-fg">{tr('Report an issue', 'समस्या दर्ज करें')}</Link><Link to="/track" className="hover:text-fg">{tr('Track complaint', 'शिकायत ट्रैक करें')}</Link><Link to="/dashboard" className="hover:text-fg">{tr('City dashboard', 'शहर डैशबोर्ड')}</Link><Link to="/department" className="hover:text-fg">{tr('Department panel', 'विभाग पैनल')}</Link><Link to="/admin" className="hover:text-fg">{tr('Admin panel', 'एडमिन पैनल')}</Link></div></div>
        <div className="text-sm"><div className="label">{tr('Appearance', 'दिखावट')}</div><ThemeSwitch labels /><div className="label mt-4">{tr('Language', 'भाषा')}</div><LangSwitch /></div>
        <div className="text-sm"><div className="label">{tr('Built by', 'बनाया')}</div><div className="text-mute">Team Shivay</div><div className="text-dim">National Hackathon 6.0 · COER University</div></div>
      </div>
      <div className="border-t border-ink/10"><div className="container-x py-4 text-xs text-dim">{tr('Prototype. Dispatch goes to test inboxes and older dashboard history is sample data.', 'प्रोटोटाइप। शिकायतें टेस्ट इनबॉक्स में जाती हैं और पुराना डैशबोर्ड डेटा सैंपल है।')}</div></div>
    </footer>
  )
}
