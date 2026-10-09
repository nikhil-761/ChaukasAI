import { useState } from 'react'
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useLang } from '../../lib/i18n'

export default function Login({ onLogin }) {
  const { tr } = useLang()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [fails, setFails] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (Date.now() < lockUntil) { setErr(tr('Too many attempts. Wait 30 seconds.', 'बहुत ज़्यादा कोशिशें। 30 सेकंड रुकें।')); return }
    setBusy(true)
    const ok = await onLogin(u, p)
    setBusy(false)
    if (!ok) {
      const n = fails + 1
      setFails(n)
      if (n >= 5) { setLockUntil(Date.now() + 30000); setFails(0); setErr(tr('Too many attempts. Wait 30 seconds.', 'बहुत ज़्यादा कोशिशें। 30 सेकंड रुकें।')) }
      else setErr(tr('Wrong username or password.', 'यूज़रनेम या पासवर्ड गलत है।'))
    }
  }

  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} className="card w-full max-w-md animate-fadeUp p-6 sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan2 text-white shadow-glow"><ShieldCheck size={26} /></div>
        <h1 className="mt-4 text-center font-display text-2xl font-extrabold">{tr('Admin sign in', 'एडमिन लॉगिन')}</h1>
        <p className="mt-1 text-center text-sm text-mute">{tr('Only authorised administrators can open the control panel.', 'कंट्रोल पैनल सिर्फ़ अधिकृत एडमिन खोल सकते हैं।')}</p>

        <label className="label mt-6" htmlFor="au">{tr('Username', 'यूज़रनेम')}</label>
        <div className="relative"><User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" /><input id="au" className="input !pl-11" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} autoFocus /></div>
        <label className="label mt-4" htmlFor="ap">{tr('Password', 'पासवर्ड')}</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
          <input id="ap" className="input !pl-11 !pr-11" type={show ? 'text' : 'password'} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} />
          <button type="button" onClick={() => setShow(!show)} aria-label="toggle password" className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-fg">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        {err && <p className="mt-3 flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={15} />{err}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy || !u || !p}>{busy ? tr('Checking...', 'जाँच रहा है...') : tr('Sign in', 'लॉगिन')}</button>
      </form>
    </div>
  )
}
