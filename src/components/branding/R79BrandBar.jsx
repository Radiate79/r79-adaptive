import {
  R79_APP_TAGLINE,
  R79_LOGO_SIZES,
} from "../../data/brandingMeta.js";
import R79Emblem from "./R79Emblem.jsx";
import R79Wordmark from "./R79Wordmark.jsx";

const EMBLEM_SIZES = {
  app: R79_LOGO_SIZES.headerIcon,
  page: R79_LOGO_SIZES.pageIcon,
};

/**
 * R79 identity bar — icon logo + Radiate79 wordmark.
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
  const emblemSize = EMBLEM_SIZES[variant] ?? EMBLEM_SIZES.page;
  const emblem = <R79Emblem size={emblemSize} />;
  const wordmarkVariant = variant === "app" ? "header" : "compact";

  return (
    <div className={`r79-brand-bar r79-brand-bar--${variant}`}>
      {onLogoClick ? (
        <button
          type="button"
          className="r79-brand-bar__logo-btn"
          onClick={onLogoClick}
          aria-label="R79 Radiate79"
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
        <R79Wordmark variant={wordmarkVariant} />
        {showTagline ? (
          <span className="r79-brand-bar__tagline">{R79_APP_TAGLINE}</span>
        ) : null}
      </div>
    </div>
  );
}
