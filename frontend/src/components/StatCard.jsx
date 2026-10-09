import { CountUp, Spot } from './fx'

const tones = {
  brand: 'from-brand-500/25 text-brand-300',
  red: 'from-red-500/25 text-red-300',
  green: 'from-emerald-500/25 text-emerald-300',
  amber: 'from-amber-500/25 text-amber-300',
}

export default function StatCard({ icon: Icon, label, value, suffix = '', decimals = 0, display, hint, tone = 'brand' }) {
  return (
    <Spot className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="label !mb-0">{label}</span>
        {Icon && <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br to-transparent ${tones[tone]}`}><Icon size={17} /></span>}
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {display ?? <CountUp value={value} suffix={suffix} decimals={decimals} />}
      </div>
      {hint && <div className="mt-1 text-xs text-dim">{hint}</div>}
    </Spot>
  )
}
