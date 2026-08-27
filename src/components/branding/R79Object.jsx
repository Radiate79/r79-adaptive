import R79Icon from "./R79Icon.jsx";

/** Lightweight dimensional object assets — black keyed via CSS mix-blend. */
export const R79_OBJECT_SRC = {
  heroWheel: "/assets/objects/hero-wheel.webp",
  podium: "/assets/objects/podium.webp",
  today: "/assets/objects/today.webp",
  ai: "/assets/objects/ai.webp",
  championship: "/assets/objects/championship.webp",
  pitstop: "/assets/objects/pitstop.webp",
  car: "/assets/objects/car.webp",
  track: "/assets/objects/track.webp",
  tyre: "/assets/objects/tyre.webp",
  conditions: "/assets/objects/conditions.webp",
  bop: "/assets/objects/bop.webp",
  wheelbase: "/assets/objects/wheelbase.webp",
  wheel: "/assets/objects/hero-wheel.webp",
  firmware: "/assets/objects/firmware.webp",
  physics: "/assets/objects/physics.webp",
  status: "/assets/objects/status.webp",
};

/** @type {Record<string, string>} */
export const R79_FEATURE_OBJECTS = {
  podium: "podium",
  "todays-race": "today",
  "ai-engineer": "ai",
  advisor: "championship",
  "pitstop-strategy": "pitstop",
  "wheel-settings": "wheel",
};

/** @type {Record<string, string>} */
export const R79_FILTER_OBJECTS = {
  car: "car",
  track: "track",
  tyre: "tyre",
  conditions: "conditions",
  wheel: "wheelbase",
  bop: "bop",
};

/** @type {Record<string, string>} */
export const R79_DOCK_OBJECTS = {
  "wheel-settings": "wheel",
  "ai-engineer": "ai",
  advisor: "championship",
  "pitstop-strategy": "pitstop",
};

/**
 * Dimensional object for feature/filter/dock showcases.
 * Falls back to the SVG icon family if an asset is missing.
 *
 * @param {{
 *   name: string,
 *   size?: number,
 *   className?: string,
 *   fallbackName?: string,
 *   fallbackAccent?: string,
 *   eager?: boolean,
 * }} props
 */
export default function R79Object({
  name,
  size = 72,
  className = "",
  fallbackName,
  fallbackAccent = "spectrum",
  eager = false,
}) {
  const src = R79_OBJECT_SRC[name];

  if (!src) {
    return (
      <R79Icon
        name={fallbackName || name}
        accent={fallbackAccent}
        size={size}
        withBase
        className={className}
      />
    );
  }

  return (
    <span
      className={`r79-object r79-object--${name} ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <img
        className="r79-object__img"
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        draggable={false}
      />
    </span>
  );
}

/** Map Race Engineering status lines to object assets. */
export function telemetryObjectForLine(line, index) {
  if (index === 0) return "wheelbase";
  if (/^FW\s/i.test(line)) return "firmware";
  if (/^GT7\s/i.test(line)) return "physics";
  if (/testing|validated|historical|unvalidated|unknown|verification/i.test(line)) {
    return "status";
  }
  return "firmware";
}
