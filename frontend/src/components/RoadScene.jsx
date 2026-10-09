// Illustrated dusk road scene: pothole near a school. fixed=true -> repaired road.
export default function RoadScene({ fixed = false, className = '', id = 'rs', tall = false }) {
  return (
    <svg viewBox={tall ? '50 -190 200 410' : '0 0 300 220'} preserveAspectRatio={tall ? 'xMidYMid slice' : 'xMidYMax slice'} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0C1230" /><stop offset=".55" stopColor="#2B2A63" /><stop offset="1" stopColor="#F4A06C" />
        </linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2E44" /><stop offset="1" stopColor="#12141F" />
        </linearGradient>
        <radialGradient id={`${id}-lamp`}><stop offset="0" stopColor="#FFE9A8" stopOpacity=".95" /><stop offset="1" stopColor="#FFE9A8" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-hole`} cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#05060B" /><stop offset=".7" stopColor="#10121C" /><stop offset="1" stopColor="#222638" /></radialGradient>
      </defs>
      {tall && (
        <g>
          <rect x="0" y="-190" width="300" height="192" fill="#0C1230" />
          <g fill="#fff" opacity=".7">{[[70,-170,.8],[110,-140,.6],[160,-175,1],[205,-120,.7],[235,-160,.6],[90,-100,.5],[185,-80,.8],[130,-60,.5],[60,-40,.6],[225,-30,.5]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} />)}</g>
          <circle cx="215" cy="-130" r="14" fill="#E8ECFF" opacity=".9" /><circle cx="221" cy="-134" r="12" fill="#0C1230" />
        </g>
      )}
      <rect width="300" height="220" fill={`url(#${id}-sky)`} />
      {/* skyline */}
      <g fill="#10142F" opacity=".95">
        <rect x="8" y="48" width="26" height="32" /><rect x="38" y="58" width="20" height="22" /><rect x="236" y="42" width="30" height="38" /><rect x="270" y="56" width="22" height="24" />
      </g>
      {/* school */}
      <g>
        <rect x="64" y="52" width="62" height="30" fill="#1B2150" /><polygon points="58,52 95,36 132,52" fill="#262D6A" />
        <rect x="84" y="62" width="22" height="20" fill="#0D1130" />
        <g fill="#FFD27A" opacity=".9"><rect x="70" y="60" width="8" height="7" /><rect x="112" y="60" width="8" height="7" /><rect x="70" y="72" width="8" height="7" /><rect x="112" y="72" width="8" height="7" /></g>
        <rect x="76" y="44" width="38" height="8" rx="2" fill="#2F80FF" /><text x="95" y="50.5" fontSize="5.5" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter,sans-serif">SCHOOL</text>
      </g>
      <rect y="80" width="300" height="140" fill="#161A2B" />
      {/* footpaths */}
      <polygon points="0,84 128,84 0,220" fill="#232842" /><polygon points="300,84 172,84 300,220" fill="#232842" />
      {/* road */}
      <polygon points="128,80 172,80 300,220 0,220" fill={`url(#${id}-road)`} />
      <g fill="#E8ECFF" opacity=".85">
        <polygon points="148.6,82 151.4,82 151.8,88 148.2,88" /><polygon points="147.8,96 152.2,96 153,108 147,108" />
        <polygon points="146.6,120 153.4,120 155,140 145,140" /><polygon points="144.6,156 155.4,156 158.5,186 141.5,186" />
        <polygon points="141,200 159,200 164,220 136,220" />
      </g>
      {/* streetlamp */}
      <circle cx="30" cy="74" r="26" fill={`url(#${id}-lamp)`} opacity=".7" />
      <rect x="28.5" y="72" width="3" height="76" fill="#0C0F1E" /><rect x="22" y="70" width="14" height="4" rx="2" fill="#0C0F1E" /><circle cx="29" cy="74" r="3" fill="#FFE9A8" />
      {fixed ? (
        <g>
          <ellipse cx="150" cy="176" rx="44" ry="13" fill="#1E2236" />
          <ellipse cx="150" cy="176" rx="44" ry="13" fill="none" stroke="rgba(52,245,197,.55)" strokeWidth="1.2" strokeDasharray="3 3" />
          <ellipse cx="146" cy="173" rx="20" ry="4" fill="rgba(255,255,255,.05)" />
        </g>
      ) : (
        <g>
          <path d="M108 176c3-10 20-16 42-16 24 0 44 6 46 17 2 10-18 17-45 17-26 0-46-8-43-18z" fill="#2D3148" />
          <path d="M114 176c3-8 18-13 36-13 21 0 38 5 40 14 2 8-16 14-39 14-23 0-40-7-37-15z" fill={`url(#${id}-hole)`} />
          <path d="M118 171l-10-8M190 172l12-7M150 160l-3-11M130 191l-6 8M176 190l8 7" stroke="#0A0C14" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="156" cy="178" rx="20" ry="3.6" fill="#8FB4FF" opacity=".22" />
        </g>
      )}
    </svg>
  )
}
