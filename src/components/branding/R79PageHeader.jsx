import R79Wordmark from "./R79Wordmark.jsx";

/**
 * Branded page header — Radiate79 wordmark hero + page title.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {import("react").ReactNode} [props.children]
 */
export default function R79PageHeader({ title, subtitle, children }) {
  return (
    <header className="r79-page-header">
      <div className="r79-page-header__hero">
        <R79Wordmark variant="hero" />
      </div>
      <h2 className="r79-page-title">{title}</h2>
      {subtitle ? <p className="r79-page-subtitle">{subtitle}</p> : null}
      {children}
    </header>
  );
}
