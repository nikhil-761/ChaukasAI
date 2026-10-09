/** Chaukas AI mark */
export default function Logo({ className = 'h-9 w-9' }) {
  return <img src="/brand/logo-mark.png" alt="Chaukas AI" width="64" height="64" draggable="false" className={`${className} select-none rounded-md object-cover`} />
}

export function Wordmark({ className = '' }) {
  return <span className={`font-bold tracking-tight ${className}`}>Chaukas AI</span>
}
