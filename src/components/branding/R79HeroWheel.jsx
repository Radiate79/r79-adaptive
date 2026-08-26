/**
 * Large dimensional racing-wheel visual for the Wheel Settings hero.
 * Presentation only — not a screenshot replica.
 */
export default function R79HeroWheel({ size = 118 }) {
  return (
    <svg
      className="r79-hero-wheel"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="r79hw-glow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="r79hw-rim" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="28%" stopColor="#38bdf8" />
          <stop offset="58%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="r79hw-metal" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="22%" stopColor="#9fb4d0" />
          <stop offset="55%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id="r79hw-hub" cx="34%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>
        <linearGradient id="r79hw-grip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="50%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <filter id="r79hw-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="80" cy="148" rx="42" ry="7" fill="url(#r79hw-glow)" opacity="0.7" />
      <circle cx="80" cy="76" r="68" fill="url(#r79hw-glow)" opacity="0.55" />

      <circle
        cx="80"
        cy="76"
        r="58"
        fill="url(#r79hw-grip)"
        stroke="url(#r79hw-rim)"
        strokeWidth="8"
        filter="url(#r79hw-soft)"
      />
      <circle cx="80" cy="76" r="48" fill="none" stroke="url(#r79hw-metal)" strokeWidth="7" />
      <circle cx="80" cy="76" r="40" fill="none" stroke="url(#r79hw-rim)" strokeWidth="2.2" opacity="0.9" />

      {/* spokes */}
      <path
        d="M80 36v22M80 94v22M38 76h22M100 76h22"
        stroke="url(#r79hw-rim)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M51 47l16 16M93 89l16 16M51 105l16-16M93 63l16-16"
        stroke="url(#r79hw-metal)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* paddles */}
      <rect x="34" y="58" width="10" height="36" rx="4" fill="url(#r79hw-metal)" />
      <rect x="116" y="58" width="10" height="36" rx="4" fill="url(#r79hw-metal)" />

      {/* hub */}
      <circle cx="80" cy="76" r="22" fill="url(#r79hw-metal)" stroke="url(#r79hw-rim)" strokeWidth="2.4" />
      <circle cx="80" cy="76" r="13.5" fill="url(#r79hw-hub)" />
      <circle cx="80" cy="76" r="6" fill="#06101f" stroke="#67e8f9" strokeWidth="1.4" />
      <circle cx="74" cy="70" r="2.4" fill="#fff" opacity="0.7" />

      {/* specular rim highlight */}
      <path
        d="M42 48c12-16 34-24 52-18"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
