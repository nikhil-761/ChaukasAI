import { CountUp, Spot } from './fx'

const tones = {
  brand: 'text-brand-500',
  red: 'text-red-600',
  green: 'text-emerald-700',
  amber: 'text-amber-700',
}

export default function StatCard({ icon: Icon, label, value, suffix = '', decimals = 0, display, hint, tone = 'brand' }) {
  return (
    <Spot className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="label !mb-0">{label}</span>
        {Icon && <span className={`grid h-9 w-9 place-items-center rounded-md bg-panel2 ${tones[tone]}`}><Icon size={17} /></span>}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {display ?? <CountUp value={value} suffix={suffix} decimals={decimals} />}
      </div>
      {hint && <div className="mt-1 text-xs text-dim">{hint}</div>}
    </Spot>
  )
}
