import { Link } from 'react-router-dom'
import Logo from './Logo'
import { ThemeSwitch } from '../lib/theme'
import { useLang, LangSwitch } from '../lib/i18n'

export default function Footer() {
  const { tr } = useLang()
  return (
    <footer className="relative mt-20 hidden border-t border-ink/10 md:block">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5"><Logo className="h-9 w-9" /><span className="font-display text-lg font-extrabold">Chaukas <span className="gradient-text">AI</span></span></div>
          <p className="mt-3 max-w-sm text-sm text-dim">{tr('From complaint to closure. An AI action layer for civic problems - verify, prioritise, route and prove the fix.', 'शिकायत से समाधान तक। नागरिक समस्याओं के लिए AI एक्शन लेयर - जाँचो, प्राथमिकता तय करो, सही विभाग तक भेजो और समाधान का प्रमाण दो।')}</p>
        </div>
        <div className="text-sm"><div className="label">{tr('Product', 'प्रोडक्ट')}</div><div className="flex flex-col gap-2 text-mute"><Link to="/report" className="hover:text-fg">{tr('Report an issue', 'समस्या दर्ज करें')}</Link><Link to="/track" className="hover:text-fg">{tr('Track complaint', 'शिकायत ट्रैक करें')}</Link><Link to="/dashboard" className="hover:text-fg">{tr('City dashboard', 'शहर डैशबोर्ड')}</Link><Link to="/admin" className="hover:text-fg">{tr('Admin panel', 'एडमिन पैनल')}</Link></div></div>
        <div className="text-sm"><div className="label">{tr('Appearance', 'दिखावट')}</div><ThemeSwitch labels /><div className="mt-2 text-xs text-dim">{tr('Device follows your phone or PC setting.', 'Device मोड आपके फ़ोन/PC की सेटिंग के हिसाब से चलता है।')}</div><div className="label mt-4">{tr('Language', 'भाषा')}</div><LangSwitch /></div>
        <div className="text-sm"><div className="label">{tr('Built by', 'बनाया')}</div><div className="text-mute">Team Shivay</div><div className="text-dim">National Hackathon 6.0 · COER University</div></div>
      </div>
      <div className="hairline" />
      <div className="container-x py-5 text-xs text-dim">{tr('Demo build. Dispatch goes to test inboxes and dashboard history is seeded sample data.', 'डेमो बिल्ड। शिकायतें टेस्ट इनबॉक्स में जाती हैं और डैशबोर्ड का इतिहास सैंपल डेटा है।')}</div>
    </footer>
  )
}
