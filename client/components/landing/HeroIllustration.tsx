/** Decorative hero art: rupee notes and coins floating over a soft circle. Pure SVG, no assets. */

function Note({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect width="118" height="62" rx="8" fill="#22c55e" />
      <rect
        x="6"
        y="6"
        width="106"
        height="50"
        rx="5"
        fill="none"
        stroke="#bbf7d0"
        strokeWidth="2"
      />
      <circle cx="59" cy="31" r="15" fill="#16a34a" stroke="#bbf7d0" strokeWidth="2" />
      <text x="59" y="37" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f0fdf4">
        ₹
      </text>
      <circle cx="20" cy="31" r="4" fill="#bbf7d0" />
      <circle cx="98" cy="31" r="4" fill="#bbf7d0" />
    </g>
  );
}

function Coin({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy={r * 0.18} rx={r} ry={r} fill="#d97706" />
      <circle r={r} fill="#fbbf24" />
      <circle r={r * 0.72} fill="none" stroke="#f59e0b" strokeWidth="2" />
      <text y={r * 0.36} textAnchor="middle" fontSize={r} fontWeight="700" fill="#b45309">
        ₹
      </text>
    </g>
  );
}

export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 380" role="img" aria-label="Rupee notes and coins" className={className}>
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbe6ff" />
          <stop offset="100%" stopColor="#eef3ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="220" cy="200" r="175" fill="url(#hero-glow)" />
      <circle cx="220" cy="200" r="130" fill="#e3ebff" />
      <circle cx="220" cy="200" r="168" fill="none" stroke="#c7d6fb" strokeDasharray="4 8" />

      {/* Growth card */}
      <g transform="translate(150 175)">
        <rect width="140" height="120" rx="16" fill="#ffffff" />
        <rect x="18" y="18" width="56" height="8" rx="4" fill="#dbe3f4" />
        <rect x="18" y="32" width="36" height="6" rx="3" fill="#e8edf7" />
        {[30, 48, 40, 66, 82].map((h, i) => (
          <rect
            key={i}
            x={20 + i * 22}
            y={104 - h}
            width="14"
            height={h}
            rx="4"
            fill={i === 4 ? '#3b6cf6' : '#c7d6fb'}
          />
        ))}
      </g>

      <Note x={70} y={92} rotate={-18} />
      <Note x={268} y={70} rotate={14} />
      <Note x={300} y={238} rotate={-10} />

      <Coin x={120} y={250} r={20} />
      <Coin x={232} y={70} r={16} />
      <Coin x={338} y={170} r={14} />
      <Coin x={96} y={190} r={12} />

      {/* Sparkles */}
      {[
        [56, 60],
        [392, 110],
        [380, 320],
        [60, 320],
      ].map(([cx, cy]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - 8}L${cx + 2.5} ${cy - 2.5}L${cx + 8} ${cy}L${cx + 2.5} ${cy + 2.5}L${cx} ${cy + 8}L${cx - 2.5} ${cy + 2.5}L${cx - 8} ${cy}L${cx - 2.5} ${cy - 2.5}Z`}
          fill="#93b0f8"
        />
      ))}
    </svg>
  );
}
