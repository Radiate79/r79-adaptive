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
        <circle cx="24" cy="22.5" r="18.5" fill={`url(#${g("glow")})`} opacity="0.9" />
        <circle
          cx="24"
          cy="22.5"
          r="16"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="22.5"
          r="12.2"
          fill="none"
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.8"
          opacity="0.95"
        />
        <circle
          cx="24"
          cy="22.5"
          r="8.4"
          fill={`url(#${g("face")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.2"
        />
        <circle
          cx="24"
          cy="22.5"
          r="4.6"
          fill={`url(#${g("core")})`}
          stroke="#fff"
          strokeOpacity="0.75"
          strokeWidth="1"
        />
        {/* paddle / grip accents */}
        <path
          d="M11.5 14.5c2.2-3.2 6-5.2 12.5-5.2s10.3 2 12.5 5.2"
          fill="none"
          stroke={`url(#${g("rim")})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M24 7.5v6.2M24 31.5v6.2M8 22.5h6.2M33.8 22.5H40"
          stroke={`url(#${g("rim")})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <rect x="20.2" y="18.8" width="7.6" height="7.4" rx="1.6" fill="#0b1220" opacity="0.35" />
        <circle cx="18.8" cy="16.8" r="1.8" fill="#fff" opacity="0.65" />
        <circle cx="29.4" cy="16.8" r="1.2" fill={c.a} opacity="0.8" />
      </g>
    ),
    podium: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M11 36h7.5V23h11v13H37V17.5L24 7.5 11 17.5V36z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.6"
        />
        <path d="M18.5 36V23h11v13" fill={`url(#${g("core")})`} opacity="0.5" />
        <path
          d="M24 9.5l2.4 4.8 5.2.55-3.9 3.5 1 5.1L24 20.8l-4.7 2.45 1-5.1-3.9-3.5 5.2-.55z"
          fill={c.a}
          stroke={c.c}
          strokeWidth="0.6"
        />
        <circle cx="16.5" cy="15.5" r="1.5" fill="#fff" opacity="0.55" />
      </g>
    ),
    today: (
      <g transform={`translate(0 ${yOff})`}>
        <rect
          x="28"
          y="8"
          width="3.2"
          height="28"
          rx="1.2"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="0.8"
        />
        <path
          d="M31.2 9.5H14.5c-1.2 0-1.8 1.4-1 2.2l4.2 4.2c.4.4.4 1 0 1.4l-4.2 4.2c-.8.8-.2 2.2 1 2.2H31.2"
          fill={`url(#${g("face")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.2"
        />
        <path d="M16.2 12.2h3.6v3.6h-3.6z" fill="#0b1220" opacity="0.9" />
        <path d="M19.8 12.2h3.6v3.6h-3.6z" fill="#f8fafc" opacity="0.92" />
        <path d="M23.4 12.2h3.6v3.6h-3.6z" fill="#0b1220" opacity="0.9" />
        <path d="M16.2 15.8h3.6v3.6h-3.6z" fill="#f8fafc" opacity="0.9" />
        <path d="M19.8 15.8h3.6v3.6h-3.6z" fill="#0b1220" opacity="0.88" />
        <path d="M23.4 15.8h3.6v3.6h-3.6z" fill="#f8fafc" opacity="0.9" />
        <path d="M16.2 19.4h3.6v3.2h-3.6z" fill="#0b1220" opacity="0.88" />
        <path d="M19.8 19.4h3.6v3.2h-3.6z" fill="#f8fafc" opacity="0.88" />
        <circle cx="18" cy="11" r="1.1" fill="#fff" opacity="0.55" />
      </g>
    ),
    ai: (
      <g transform={`translate(0 ${yOff})`}>
        <polygon
          points="24,7.5 37,15 37,30 24,37.5 11,30 11,15"
          fill={`url(#${g("glow")})`}
          opacity="0.55"
        />
        <polygon
          points="24,9 35.5 15.5 35.5 29.5 24,36 12.5 29.5 12.5 15.5"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.6"
        />
        <polygon
          points="24,14.5 30.5 18.2 30.5 25.8 24,29.5 17.5 25.8 17.5 18.2"
          fill={`url(#${g("core")})`}
          opacity="0.9"
        />
        <circle cx="24" cy="22" r="2.4" fill="#fff" opacity="0.85" />
        <circle cx="20.2" cy="19.8" r="1.3" fill={c.a} opacity="0.95" />
        <circle cx="27.8" cy="19.8" r="1.3" fill={c.b} opacity="0.95" />
        <circle cx="20.2" cy="24.2" r="1.3" fill={c.e} opacity="0.9" />
        <circle cx="27.8" cy="24.2" r="1.3" fill={c.d} opacity="0.9" />
        <path
          d="M20.2 19.8L24 22M27.8 19.8L24 22M20.2 24.2L24 22M27.8 24.2L24 22"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="0.9"
        />
        <circle cx="17" cy="15" r="1.2" fill="#fff" opacity="0.5" />
      </g>
    ),
    championship: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M24 8c7 0 12 3.5 12 8v8c0 7-5.5 12.5-12 15-6.5-2.5-12-8-12-15v-8c0-4.5 5-8 12-8z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.7"
        />
        <path
          d="M24 14l1.8 3.6 4 .4-3 2.7.8 3.9L24 22.5l-3.6 2.1.8-3.9-3-2.7 4-.4z"
          fill={c.d === "#fbbf24" || accent === "champ" ? "#fbbf24" : c.a}
        />
        <circle cx="18" cy="16" r="1.2" fill="#fff" opacity="0.5" />
      </g>
    ),
    pitstop: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M15 34l-3.5-3.5 8-8 2 2 4.2-4.2 6.2 6.2-4.2 4.2 2 2-8 8-2-2-4.5 4.5-6.2-6.2 4-4z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <circle
          cx="31"
          cy="13.5"
          r="5.5"
          fill={`url(#${g("core")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.3"
        />
        <path d="M28.8 11.5h4.4M31 9.3v4.4" stroke="#0b1220" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17.5" cy="19.5" r="1.3" fill="#fff" opacity="0.5" />
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
        <path
          d="M8 28c2-8.5 8-13 16-13s14 4.5 16 13l-2.2 6.5H10.2L8 28z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <path d="M14 17.5h20c-2.2-3.2-6-4.5-10-4.5s-7.8 1.3-10 4.5z" fill={`url(#${g("core")})`} opacity="0.55" />
        <circle cx="14" cy="32.5" r="3.3" fill="#0b1220" stroke={`url(#${g("rim")})`} strokeWidth="1.2" />
        <circle cx="34" cy="32.5" r="3.3" fill="#0b1220" stroke={`url(#${g("rim")})`} strokeWidth="1.2" />
        <circle cx="16" cy="20" r="1.2" fill="#fff" opacity="0.55" />
      </g>
    ),
    track: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="22" rx="14.5" ry="10.5" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="4.5" opacity="0.28" />
        <ellipse cx="24" cy="22" rx="14.5" ry="10.5" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="2.2" />
        <ellipse
          cx="24"
          cy="22"
          rx="7.2"
          ry="4.6"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1"
        />
        <path d="M18 22h12" stroke={`url(#${g("core")})`} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ),
    tyre: (
      <g transform={`translate(0 ${yOff})`}>
        <ellipse cx="24" cy="33" rx="11" ry="3.2" fill={c.e} opacity="0.25" />
        <circle cx="18" cy="26" r="8.2" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6" />
        <circle cx="18" cy="26" r="3.6" fill="#0b1220" stroke={c.a} strokeWidth="1" />
        <circle cx="30" cy="26" r="8.2" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.6" />
        <circle cx="30" cy="26" r="3.6" fill="#0b1220" stroke={c.b} strokeWidth="1" />
        <circle cx="24" cy="17" r="9" fill={`url(#${g("metal")})`} stroke={`url(#${g("rim")})`} strokeWidth="1.8" />
        <circle cx="24" cy="17" r="4.2" fill="#0b1220" stroke={`url(#${g("core")})`} strokeWidth="1.2" />
        <circle cx="24" cy="17" r="1.8" fill={`url(#${g("core")})`} />
        <circle cx="20" cy="13.5" r="1.1" fill="#fff" opacity="0.5" />
      </g>
    ),
    conditions: (
      <g transform={`translate(0 ${yOff})`}>
        <path
          d="M17 14h14l2.5 4.5V36c0 1.5-1.2 2.8-2.8 2.8H17.3c-1.6 0-2.8-1.3-2.8-2.8V18.5L17 14z"
          fill={`url(#${g("metal")})`}
          stroke={`url(#${g("rim")})`}
          strokeWidth="1.5"
        />
        <path d="M17 14l2.5-3h9L31 14" fill={`url(#${g("core")})`} opacity="0.55" />
        <rect x="20" y="20" width="8" height="10" rx="1.5" fill={`url(#${g("core")})`} opacity="0.75" />
        <path d="M22 24h4M22 27h4" stroke="#0b1220" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        <circle cx="18.5" cy="17" r="1.1" fill="#fff" opacity="0.5" />
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
  podium: { name: "podium", accent: "gold" },
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
