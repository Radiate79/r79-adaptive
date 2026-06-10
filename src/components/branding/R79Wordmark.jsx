import { R79_WORDMARK_SRC } from "../../data/brandingMeta.js";

/**
 * Radiate79 wordmark asset — large branding areas.
 *
 * @param {Object} props
 * @param {"header" | "hero" | "compact"} [props.variant]
 * @param {string} [props.className]
 */
export default function R79Wordmark({ variant = "header", className = "" }) {
  return (
    <img
      src={R79_WORDMARK_SRC}
      alt="Radiate79"
      className={["r79-wordmark", `r79-wordmark--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
