import {
  BRAND_TAGLINE,
  formatBrandVersion,
  formatVersionLabel,
} from "../../data/brandingMeta.js";

/**
 * Standard R79 version display — Version X.X plus Built by curiosity.
 * @param {{ version: string, compact?: boolean }} props
 */
export default function BrandVersionLabel({ version, compact = false }) {
  const label = formatVersionLabel(version);

  return (
    <span style={styles.wrap}>
      <span style={compact ? styles.versionCompact : styles.version}>
        {label}
      </span>
      <span style={compact ? styles.taglineCompact : styles.tagline}>
        {BRAND_TAGLINE}
      </span>
    </span>
  );
}

/** @param {string} version */
export function formatBrandVersionDisplay(version) {
  return {
    version: formatVersionLabel(version),
    tagline: BRAND_TAGLINE,
    short: formatBrandVersion(version),
  };
}

const styles = {
  wrap: {
    display: "grid",
    gap: "4px",
    justifyItems: "inherit",
    textAlign: "inherit",
  },
  version: {
    color: "#e8efff",
    display: "block",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  tagline: {
    color: "rgba(184, 205, 255, 0.72)",
    display: "block",
    fontSize: "0.82rem",
    fontStyle: "italic",
    fontWeight: 500,
  },
  versionCompact: {
    color: "inherit",
    display: "block",
    fontSize: "0.92rem",
    fontWeight: 700,
  },
  taglineCompact: {
    color: "rgba(184, 205, 255, 0.65)",
    display: "block",
    fontSize: "0.78rem",
    fontStyle: "italic",
    fontWeight: 500,
  },
};
