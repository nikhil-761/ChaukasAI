/** Official Chaukas AI mark (raster tile from brand logo). */
export default function Logo({ className = 'h-9 w-9', glow = false }) {
  return (
    <img src="/brand/logo-mark.png" alt="Chaukas AI" width="64" height="64" draggable="false"
      className={`${className} select-none rounded-[22%] object-cover ${glow ? 'drop-shadow-[0_0_22px_rgba(34,211,238,.55)]' : 'shadow-[0_6px_20px_-6px_rgba(37,99,235,.55)]'}`} />
  )
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>Chaukas<span className="gradient-text"> AI</span></span>
  )
}
