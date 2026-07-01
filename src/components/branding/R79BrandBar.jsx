import { R79_APP_TAGLINE } from "../../data/brandingMeta.js";
import R79Emblem from "./R79Emblem.jsx";

/**
 * R79 identity bar — icon logo and optional tagline.
 *
 * @param {Object} props
 * @param {"app" | "page"} [props.variant]
 * @param {boolean} [props.showTagline]
 * @param {() => void} [props.onLogoClick]
 */
export default function R79BrandBar({
  variant = "page",
  showTagline = false,
  onLogoClick = null,
}) {
  const logoVariant = variant === "app" ? "header" : "compact";
  const emblem = <R79Emblem variant={logoVariant} />;

  return (
    <div className={`r79-brand-bar r79-brand-bar--${variant}`}>
      {onLogoClick ? (
        <button
          type="button"
          className="r79-brand-bar__logo-btn"
          onClick={onLogoClick}
          aria-label="R79"
          title="R79"
        >
          {emblem}
        </button>
      ) : (
        <div className="r79-brand-bar__logo" aria-hidden="true">
          {emblem}
        </div>
      )}

      <div className="r79-brand-bar__copy">
        {showTagline ? (
          <span className="r79-brand-bar__tagline">{R79_APP_TAGLINE}</span>
        ) : null}
      </div>
    </div>
  );
}
