import R79Wordmark from "./R79Wordmark.jsx";

/**
 * Page title header — branding lives in the app chrome; wordmark optional.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {boolean} [props.showWordmark]
 * @param {import("react").ReactNode} [props.children]
 */
export default function R79PageHeader({
  title,
  subtitle,
  children,
  showWordmark = false,
}) {
  return (
    <header className="r79-page-header">
      {showWordmark ? (
        <div className="r79-page-header__hero">
          <R79Wordmark variant="hero" />
        </div>
      ) : null}
      <h2 className="r79-page-title">{title}</h2>
      {subtitle ? <p className="r79-page-subtitle">{subtitle}</p> : null}
      {children}
    </header>
  );
}
