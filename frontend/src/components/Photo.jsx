// Real demo photos (public/img). Road-damage complaints use these instead of illustrations.
export const IMG = {
  before: '/img/pothole-before.jpg',
  after: '/img/pothole-after.jpg',
  city: '/img/smart-city.jpg',
  // clean crops (no baked-in labels) for complaint cards
  streetlight: '/img/streetlight-crop.jpg',
  water: '/img/water-crop.jpg',
  garbage: '/img/garbage-crop.jpg',
  // full annotated showcase images
  streetNight: '/img/street-night.jpg',
  waterBurst: '/img/water-burst.jpg',
  garbageFull: '/img/garbage-overflow.jpg',
  proof: '/img/proof-before-after.jpg',
}

export function ShowPhoto({ src, alt, className = '', pos = '50% 50%', style }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" draggable="false" className={`object-cover ${className}`} style={{ objectPosition: pos, ...style }} />
}

export function RoadPhoto({ fixed = false, className = '', pos = '70% 55%', alt, style }) {
  return (
    <img src={fixed ? IMG.after : IMG.before} alt={alt ?? (fixed ? 'Road after repair' : 'Pothole on a road')} loading="lazy" decoding="async" draggable="false"
      className={`object-cover ${className}`} style={{ objectPosition: pos, ...style }} />
  )
}

export function CityPhoto({ className = '', pos = '50% 50%', style }) {
  return <img src={IMG.city} alt="AI-monitored smart city street at dusk" loading="lazy" decoding="async" draggable="false" className={`object-cover ${className}`} style={{ objectPosition: pos, ...style }} />
}
