import { useId } from "react";

/**
 * R79 premium dimensional icon family — glass/metal + optional illuminated pedestal.
 * Approximates concept 3D treatment via SVG layers (no rasters). Presentation only.
 *
 * @param {{
 *   name: string,
 *   size?: number,
 *   className?: string,
 *   accent?: string,
 *   withBase?: boolean,
 * }} props
 */
export default function R79Icon({
  name,
  size = 28,
  className = "",
  accent = "spectrum",
  withBase = false,
}) {
  const uid = useId().replace(/:/g, "");
  const g = (key) => `r79i-${uid}-${key}`;

  const accents = {
    spectrum: { a: "#22d3ee", b: "#38bdf8", c: "#6366f1", d: "#c026d3", e: "#8b5cf6" },
    gold: { a: "#fbbf24", b: "#f59e0b", c: "#fde68a", d: "#a855f7", e: "#8b5cf6" },
    podium: { a: "#22d3ee", b: "#38bdf8", c: "#8b5cf6", d: "#d946ef", e: "#64748b" },
    cyan: { a: "#22d3ee", b: "#38bdf8", c: "#67e8f9", d: "#0ea5e9", e: "#6366f1" },
    violet: { a: "#8b5cf6", b: "#6366f1", c: "#a855f7", d: "#38bdf8", e: "#c026d3" },
    magenta: { a: "#d946ef", b: "#c026d3", c: "#f0abfc", d: "#8b5cf6", e: "#38bdf8" },
    pit: { a: "#22d3ee", b: "#c026d3", c: "#38bdf8", d: "#a855f7", e: "#67e8f9" },
    ai: { a: "#38bdf8", b: "#8b5cf6", c: "#6366f1", d: "#22d3ee", e: "#a855f7" },
    champ: { a: "#c026d3", b: "#8b5cf6", c: "#d946ef", d: "#fbbf24", e: "#6366f1" },
    today: { a: "#22d3ee", b: "#38bdf8", c: "#67e8f9", d: "#0ea5e9", e: "#6366f1" },
  };

  const c = accents[accent] ?? accents.spectrum;
  const vb = withBase ? "0 0 48 56" : "0 0 48 48";
  const h = withBase ? Math.round(size * 1.16) : size;

  const defs = (
    <defs>
      <linearGradient id={g("rim")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={c.a} />
        <stop offset="40%" stopColor={c.b} />
        <stop offset="75%" stopColor={c.e} />
        <stop offset="100%" stopColor={c.d} />
      </linearGradient>
      <linearGradient id={g("face")} x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
        <stop offset="35%" stopColor="#b8d4f0" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#0b1220" stopOpacity="0.95" />
      </linearGradient>
      <radialGradient id={g("core")} cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="42%" stopColor={c.a} stopOpacity="0.8" />
        <stop offset="100%" stopColor={c.e} stopOpacity="0.9" />
      </radialGradient>
      <radialGradient id={g("glow")} cx="50%" cy="42%" r="55%">
        <stop offset="0%" stopColor={c.a} stopOpacity="0.65" />
        <stop offset="55%" stopColor={c.e} stopOpacity="0.2" />
        <stop offset="100%" stopColor={c.d} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={g("metal")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fbff" stopOpacity="0.95" />
        <stop offset="38%" stopColor="#94a3b8" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
      </linearGradient>
      <radialGradient id={g("pedestal")} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={c.a} stopOpacity="0.85" />
        <stop offset="55%" stopColor={c.b} stopOpacity="0.35" />
        <stop offset="100%" stopColor={c.e} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={g("goldCup")} x1="18%" y1="0%" x2="88%" y2="100%">
        <stop offset="0%" stopColor="#fff8dc" />
        <stop offset="18%" stopColor="#fde68a" />
        <stop offset="42%" stopColor="#fbbf24" />
        <stop offset="68%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id={g("goldStem")} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="28%" stopColor="#f59e0b" />
        <stop offset="55%" stopColor="#fde68a" />
        <stop offset="78%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id={g("goldBase")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id={g("trophyRim")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
        <stop offset="35%" stopColor="#fbbf24" />
        <stop offset="65%" stopColor="#a855f7" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#d946ef" stopOpacity="0.75" />
      </linearGradient>
      <radialGradient id={g("trophyGlow")} cx="42%" cy="28%" r="62%">
        <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
        <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.55" />
        <stop offset="70%" stopColor="#a855f7" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      <filter id={g("soft")} x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="1.1" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  const pedestal = withBase ? (
    <g className="r79-icon__pedestal">
      <ellipse cx="24" cy="51.2" rx="16" ry="3.8" fill={`url(#${g("pedestal")})`} />
      <ellipse
        cx="24"
        cy="50.2"
        rx="12.5"
        ry="2.6"
        fill="none"
        stroke={`url(#${g("rim")})`}
        strokeWidth="1.6"
        opacity="0.95"
      />
      <ellipse cx="24" cy="49.2" rx="8" ry="1.4" fill={c.a} opacity="0.45" />
      <ellipse cx="24" cy="48.6" rx="4.5" ry="0.8" fill="#fff" opacity="0.35" />
    </g>
  ) : (
    <ellipse cx="24" cy="42" rx="12" ry="2.4" fill={c.a} opacity="0.28" />
  );

  const yOff = withBase ? -2 : 0;

  /** @type {Record<string, import("react").ReactNode>} */
  const glyphs = {
    wheel: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="40.5" rx="11" ry="2.4" fill={`url(#${g("glow")})`} opacity="0.55" />
        <circle cx="24" cy="22" r="17" fill={`url(#${g("glow")})`} opacity="0.5" />
        <circle
          cx="24"
          cy="22"
          r="15.2"
          fill="#0b1220"
          stroke={`url(#${g("rim")})`}
          strokeWidth="4.2"
        />
        <circle cx="24" cy="22" r="11.4" fill="none" stroke={`url(#${g("metal")})`} strokeWidth="2.4" />
        <path d="M24 9.2v7.2M24 27.6v7.2M9.2 22h7.2M31.6 22h7.2" stroke={`url(#${g("rim")})`} strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="24" cy="22" r="6.4" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.1" />
        <circle cx="24" cy="22" r="3.4" fill={`url(#${g("core")})`} />
        <circle cx="21.8" cy="20" r="1.2" fill="#fff" opacity="0.7" />
      </g>
    ),
    podium: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="24" rx="10" ry="12" fill={`url(#${g("glow")})`} opacity="0.45" />
        <path
          d="M16.6 12.4c-3.1.5-4.4 3.4-3.4 6.5.5 1.7 2 2.9 3.7 3.2"
          fill="none"
          stroke={`url(#${g("metal")})`}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M31.4 12.4c3.1.5 4.4 3.4 3.4 6.5-.5 1.7-2 2.9-3.7 3.2"
          fill="none"
          stroke={`url(#${g("metal")})`}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M16.8 10.2h14.4c.32 0 .55.3.5.62L30.2 23c-.32 2.5-2.5 4.3-5.05 4.3h-2.3c-2.55 0-4.73-1.8-5.05-4.3L16.3 10.82c-.05-.32.18-.62.5-.62z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.05"
        />
        <path
          d="M18.6 12h10.8c.22 0 .4.2.37.42l-1.05 8.4c-.22 1.7-1.7 3-3.45 3h-1.84c-1.75 0-3.23-1.3-3.45-3L18.23 12.42c-.03-.22.15-.42.37-.42z"
          fill={`url(#${g("core")})`}
          opacity="0.72"
        />
        <ellipse cx="24" cy="17.8" rx="2.8" ry="4.8" fill="#67e8f9" opacity="0.55" />
        <path d="M17.6 10.4c1.6-.9 4.2-1.4 6.4-1.4s4.8.5 6.4 1.4" fill="none" stroke="#38bdf8" strokeWidth="1.15" strokeLinecap="round" />
        <path d="M20.4 10h7.2" fill="none" stroke="#fde68a" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
        <path d="M22.4 27.6h3.2l.5 4.4h-4.2z" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="0.6" />
        <rect x="23.15" y="27.8" width="0.85" height="4" rx="0.3" fill="#22d3ee" opacity="0.55" />
        <path
          d="M18.4 37.6h11.2c.8 0 1.28-.66 1.08-1.38l-.9-2.55c-.18-.55-.74-.92-1.32-.92H19.54c-.58 0-1.14.37-1.32.92l-.9 2.55c-.2.72.28 1.38 1.08 1.38z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="0.85"
        />
        <path d="M19.8 37.35h8.4" fill="none" stroke="#fbbf24" strokeWidth="0.65" strokeLinecap="round" opacity="0.55" />
      </g>
    ),
    today: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="40" rx="10" ry="2.2" fill={`url(#${g("glow")})`} opacity="0.4" />
        <rect x="29.2" y="7.5" width="3.4" height="30" rx="1.4" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="0.8" />
        <path
          d="M32.4 9.2H14.8c-1.15 0-1.7 1.35-.95 2.15l4 4.05c.38.38.38.98 0 1.36l-4 4.05c-.75.8-.2 2.15.95 2.15h17.6"
          fill={`url(#${g("face")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.15"
        />
        <path d="M16.4 11.6h3.5v3.5h-3.5z" fill="#06101f" />
        <path d="M19.9 11.6h3.5v3.5h-3.5z" fill="#f8fafc" />
        <path d="M23.4 11.6h3.5v3.5h-3.5z" fill="#06101f" />
        <path d="M16.4 15.1h3.5v3.5h-3.5z" fill="#f8fafc" />
        <path d="M19.9 15.1h3.5v3.5h-3.5z" fill="#06101f" />
        <path d="M23.4 15.1h3.5v3.5h-3.5z" fill="#f8fafc" />
        <path d="M16.4 18.6h3.5v3.2h-3.5z" fill="#06101f" />
        <path d="M19.9 18.6h3.5v3.2h-3.5z" fill="#f8fafc" />
        <circle cx="18.2" cy="10.6" r="1.1" fill="#fff" opacity="0.55" />
      </g>
    ),
    ai: (
      <g transform={`translate(0 ${yOff})`}>
        <polygon points="24,7 38,15.2 38,31.2 24,39.4 10,31.2 10,15.2" fill={`url(#${g("glow")})`} opacity="0.5" />
        <polygon
          points="24,9.2 35.8 16 35.8 29.6 24,36.4 12.2 29.6 12.2 16"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <polygon points="24,14.2 30.8 18.2 30.8 26.2 24,30.2 17.2 26.2 17.2 18.2" fill={`url(#${g("core")})`} opacity="0.92" />
        <circle cx="24" cy="22.2" r="2.6" fill="#fff" opacity="0.9" />
        <circle cx="20.2" cy="19.8" r="1.25" fill={c.a} />
        <circle cx="27.8" cy="19.8" r="1.25" fill={c.b} />
        <circle cx="20.2" cy="24.6" r="1.25" fill={c.e} />
        <circle cx="27.8" cy="24.6" r="1.25" fill={c.d} />
        <path d="M20.2 19.8L24 22.2M27.8 19.8L24 22.2M20.2 24.6L24 22.2M27.8 24.6L24 22.2" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.9" />
      </g>
    ),
    championship: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M24 7.5c7.4 0 13 3.6 13 8.4v8.4c0 7.4-5.8 13.2-13 16-7.2-2.8-13-8.6-13-16V15.9c0-4.8 5.6-8.4 13-8.4z"
          fill={`url(#${g("glow")})`}
          opacity="0.4"
        />
        <path
          d="M24 8.8c6.8 0 12 3.2 12 7.6v7.8c0 6.8-5.4 12.2-12 14.8-6.6-2.6-12-8-12-14.8V16.4c0-4.4 5.2-7.6 12-7.6z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.6"
        />
        <path d="M24 13.5c4.6 0 8 2 8 4.8v5c0 4.4-3.6 8-8 9.8-4.4-1.8-8-5.4-8-9.8v-5c0-2.8 3.4-4.8 8-4.8z" fill={`url(#${g("core")})`} opacity="0.35" />
        <path d="M24 16.2l1.5 3.1 3.4.35-2.55 2.3.7 3.3L24 23.4l-3.05 1.85.7-3.3-2.55-2.3 3.4-.35z" fill="#fbbf24" opacity="0.9" />
        <circle cx="18.2" cy="16" r="1.15" fill="#fff" opacity="0.5" />
      </g>
    ),
    pitstop: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="40" rx="11" ry="2.2" fill={`url(#${g("glow")})`} opacity="0.4" />
        <ellipse cx="18" cy="27" rx="8.4" ry="8.4" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6" />
        <ellipse cx="18" cy="27" rx="3.6" ry="3.6" fill="#06101f" stroke={c.a} strokeWidth="1.1" />
        <path d="M24 14.5h8.5c1.5 0 2.7 1.2 2.7 2.7V32c0 1.4-1.1 2.6-2.5 2.7l-8.7.6" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.3" />
        <rect x="27.2" y="17.5" width="5.2" height="11" rx="1.4" fill={`url(#${g("core")})`} opacity="0.8" />
        <circle cx="29.8" cy="16.2" r="1.2" fill="#fff" opacity="0.5" />
      </g>
    ),
    more: (
      <g transform={`translate(0 ${yOff})`}>
        <rect
          x="10"
          y="14"
          width="28"
          height="20"
          rx="6"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <circle cx="17" cy="24" r="2.6" fill={`url(#${g("core")})`} />
        <circle cx="24" cy="24" r="2.6" fill={`url(#${g("core")})`} />
        <circle cx="31" cy="24" r="2.6" fill={`url(#${g("core")})`} />
      </g>
    ),
    car: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="39.5" rx="13" ry="2.4" fill={`url(#${g("glow")})`} opacity="0.35" />
        <path
          d="M7.5 28.2c1.8-8.8 8.2-13.6 16.5-13.6s14.7 4.8 16.5 13.6l-2 6.6H9.5l-2-6.6z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <path d="M14.2 17.2h19.6c-2.4-3.4-6.4-4.8-10-4.8s-7.6 1.4-9.6 4.8z" fill={`url(#${g("core")})`} opacity="0.55" />
        <path d="M13 21.5h8.4v3.2H13z" fill="#06101f" opacity="0.45" />
        <circle cx="14.2" cy="33.4" r="3.5" fill="#06101f" stroke={`url(#${g("rim")})`} strokeWidth="1.2" />
        <circle cx="33.8" cy="33.4" r="3.5" fill="#06101f" stroke={`url(#${g("rim")})`} strokeWidth="1.2" />
        <circle cx="16.5" cy="19.8" r="1.15" fill="#fff" opacity="0.55" />
      </g>
    ),
    track: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="23" rx="15.5" ry="11.2" fill={`url(#${g("glow")})`} opacity="0.28" />
        <ellipse cx="24" cy="23" rx="14.6" ry="10.6" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="4.2" opacity="0.35" />
        <ellipse cx="24" cy="23" rx="14.6" ry="10.6" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="2.3" />
        <ellipse cx="24" cy="23" rx="7.4" ry="4.8" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1" />
        <path d="M18 23h12" stroke={`url(#${g("core")})`} strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="32.5" cy="16.2" r="1.3" fill="#22d3ee" opacity="0.85" />
      </g>
    ),
    tyre: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="38.8" rx="12" ry="2.6" fill={`url(#${g("glow")})`} opacity="0.3" />
        <ellipse cx="24" cy="24" rx="13.2" ry="12.2" fill="#0b1220" stroke={`url(#${g("rim")})`} strokeWidth="3.4" />
        <ellipse cx="24" cy="24" rx="7.4" ry="6.8" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.2" />
        <ellipse cx="24" cy="24" rx="3.2" ry="2.9" fill="#06101f" stroke={c.a} strokeWidth="1.1" />
        <path d="M16.5 18.5c2.4-3 6.2-4.6 10.2-3.6" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    ),
    conditions: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="39.6" rx="11" ry="2.2" fill={`url(#${g("glow")})`} opacity="0.3" />
        <path
          d="M16.6 14.2h14.8l2.4 4.4V35.6c0 1.5-1.2 2.7-2.7 2.7H17c-1.5 0-2.7-1.2-2.7-2.7V18.6l2.3-4.4z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.45"
        />
        <path d="M16.6 14.2 19 11h10l2.4 3.2" fill={`url(#${g("core")})`} opacity="0.55" />
        <rect x="19.8" y="20" width="8.4" height="10.4" rx="1.5" fill={`url(#${g("core")})`} opacity="0.78" />
        <path d="M21.8 23.6h4.4M21.8 27h4.4" stroke="#06101f" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        <circle cx="18.4" cy="17" r="1.1" fill="#fff" opacity="0.5" />
      </g>
    ),
    chip: (
      <g transform={`translate(0 ${yOff})`}>
        <rect x="14" y="14" width="20" height="20" rx="3" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <rect x="18" y="18" width="12" height="12" rx="1.5" fill={`url(#${g("core")})`} opacity="0.75" />
        <path d="M24 10v4M24 34v4M10 24h4M34 24h4" stroke={`url(#${g("rim")})`} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ),
    pulse: (
      <g transform={`translate(0 ${yOff})`}>
        <rect x="10" y="14" width="28" height="20" rx="5" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path
          d="M14 24h4l2-6 3 12 3-10 2 4h6"
          fill="none"
          stroke={`url(#${g("rim")})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    ),
    search: (
      <g transform={`translate(0 ${yOff})`}>
        <circle cx="21" cy="21" r="9" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="2.4" />
        <path d="M28 28l7 7" stroke={`url(#${g("rim")})`} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="18" cy="18" r="2" fill={`url(#${g("core")})`} opacity="0.7" />
      </g>
    ),
    filter: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M12 12h24l-8 10v10l-8 4V22L12 12z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.6"
        />
        <path d="M20 22h8" stroke={c.a} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    ),
    info: (
      <g transform={`translate(0 ${yOff})`}>
        <circle cx="24" cy="24" r="13" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.8" />
        <circle cx="24" cy="17" r="2" fill={`url(#${g("core")})`} />
        <path d="M24 22v10" stroke={`url(#${g("rim")})`} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    ),
    chevron: (
      <path
        d="M20 12l10 12-10 12"
        fill="none"
        stroke={`url(#${g("rim")})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    check: (
      <g transform={`translate(0 ${yOff})`}>
        <circle cx="24" cy="24" r="13" fill={`url(#${g("metal")})`} stroke="#4ade80" strokeWidth="1.8" />
        <path
          d="M16 24.5l5.5 5.5L33 18.5"
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="18" r="1.2" fill="#fff" opacity="0.45" />
      </g>
    ),
    settings: (
      <g transform={`translate(0 ${yOff})`}>
        <circle cx="24" cy="24" r="13" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6" />
        <circle cx="24" cy="24" r="5.5" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="2" />
        <path d="M24 10.5v4.2M24 33.3v4.2M10.5 24h4.2M33.3 24h4.2" stroke={c.a} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="18" r="1.2" fill="#fff" opacity="0.45" />
      </g>
    ),
    archive: (
      <g transform={`translate(0 ${yOff})`}>
        <rect x="12" y="14" width="24" height="22" rx="4" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path d="M16 14V11h16v3" stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <rect x="18" y="20" width="12" height="2.2" rx="1" fill={`url(#${g("core")})`} opacity="0.7" />
        <rect x="18" y="25" width="9" height="2.2" rx="1" fill={`url(#${g("core")})`} opacity="0.5" />
      </g>
    ),
    labs: (
      <g transform={`translate(0 ${yOff})`}>
        <path d="M18 36h12l-2-14h-8l-2 14z" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path d="M20 22h8l1.5-6H18.5l1.5 6z" fill={`url(#${g("core")})`} opacity="0.65" />
        <circle cx="22" cy="30" r="2" fill={c.a} opacity="0.85" />
        <circle cx="28" cy="28" r="1.5" fill={c.d} opacity="0.75" />
      </g>
    ),
    feedback: (
      <g transform={`translate(0 ${yOff})`}>
        <path d="M10 14h28v16H18l-6 6V14z" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path d="M16 20h16M16 24h10" stroke={`url(#${g("rim")})`} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ),
    chart: (
      <g transform={`translate(0 ${yOff})`}>
        <rect x="10" y="12" width="28" height="24" rx="4" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path d="M15 28l5-8 4 5 5-10 4 6" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    compass: (
      <g transform={`translate(0 ${yOff})`}>
        <circle cx="24" cy="24" r="13" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6" />
        <path d="M24 11l3 8.5 8.5 3-8.5 3-3 8.5-3-8.5-8.5-3 8.5-3z" fill={`url(#${g("core")})`} opacity="0.85" />
      </g>
    ),
    folder: (
      <g transform={`translate(0 ${yOff})`}>
        <path d="M10 16h10l3 3h15v17H10V16z" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.5" />
        <path d="M10 19h28" stroke={c.a} strokeWidth="1.2" opacity="0.6" />
      </g>
    ),
    star: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M24 9l2.8 8.6h9l-7.3 5.3 2.8 8.6L24 26.2l-7.3 5.3 2.8-8.6-7.3-5.3h9z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.3"
        />
        <path d="M24 13l1.6 4.8 4.8 1.6-4.8 1.6L24 26l-1.6-4.8-4.8-1.6 4.8-1.6z" fill="#fbbf24" opacity="0.85" />
      </g>
    ),
  };

  const body = glyphs[name] ?? glyphs.more;

  return (
    <svg
      className={`r79-icon r79-icon--${name} ${withBase ? "r79-icon--pedestal" : ""} ${className}`.trim()}
      width={size}
      height={h}
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {defs}
      {pedestal}
      <g filter={`url(#${g("soft")})`}>{body}</g>
    </svg>
  );
}

/** @type {Record<string, { name: string, accent: string }>} */
export const R79_FEATURE_ICONS = {
  "wheel-settings": { name: "wheel", accent: "spectrum" },
  podium: { name: "podium", accent: "podium" },
  "todays-race": { name: "today", accent: "today" },
  "ai-engineer": { name: "ai", accent: "ai" },
  advisor: { name: "championship", accent: "champ" },
  "pitstop-strategy": { name: "pitstop", accent: "pit" },
  more: { name: "more", accent: "violet" },
};

/** @type {Record<string, { name: string, accent: string }>} */
export const R79_FILTER_ICONS = {
  car: { name: "car", accent: "violet" },
  track: { name: "track", accent: "cyan" },
  tyre: { name: "tyre", accent: "magenta" },
  conditions: { name: "conditions", accent: "magenta" },
  wheel: { name: "wheel", accent: "spectrum" },
  bop: { name: "championship", accent: "champ" },
};

/** Telemetry mini-icon mapping by line kind / pattern. */
export function telemetryIconForLine(line, index) {
  if (index === 0) return { name: "wheel", accent: "cyan" };
  if (/^FW\s/i.test(line)) return { name: "chip", accent: "violet" };
  if (/^GT7\s/i.test(line)) return { name: "championship", accent: "today" };
  if (/testing|validated|historical|unvalidated|unknown/i.test(line)) {
    return { name: "pulse", accent: "gold" };
  }
  return { name: "chip", accent: "violet" };
}
