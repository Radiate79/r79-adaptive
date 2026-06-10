import R79Emblem from "./R79Emblem.jsx";

const EMBLEM_SIZES = {
  app: 60,
  page: 48,
};

/**
 * Shared R79 / Radiate79 identity bar — logo + wordmark.
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
        <div className="r79-brand-strip">
          <span className="r79-brand-strip__title">R79</span>
          <span className="r79-brand-strip__divider" />
          <span className="r79-brand-strip__subtitle">Radiate79</span>
        </div>
        {showTagline ? (
          <span className="r79-brand-bar__tagline">Premium Racing Assistant</span>
        ) : null}
      </div>
    </div>
  );
}
