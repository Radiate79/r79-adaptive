import { useState } from "react";
import {
  R79_EMBLEM_FALLBACK_SRC,
  R79_EMBLEM_SRC,
} from "../../data/brandingMeta.js";

/**
 * R79 icon logo — displays the uploaded logo asset without placeholder framing.
 *
 * @param {Object} props
 * @param {"header" | "compact" | "splash" | "badge-sm" | "badge-md" | "badge-lg"} [props.variant]
 * @param {boolean} [props.pulse]
 * @param {string} [props.className]
 */
export default function R79Emblem({
  variant = "header",
  pulse = false,
  className = "",
}) {
  const [src, setSrc] = useState(R79_EMBLEM_SRC);

  const handleError = () => {
    if (src !== R79_EMBLEM_FALLBACK_SRC) {
      setSrc(R79_EMBLEM_FALLBACK_SRC);
    }
  };

  return (
    <img
      src={src}
      alt="R79 logo"
      onError={handleError}
      className={[
        "r79-brand-logo",
        `r79-brand-logo--${variant}`,
        pulse ? "r79-brand-logo--pulse" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
