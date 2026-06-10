import R79BrandBar from "./R79BrandBar.jsx";

/**
 * Consistent R79 page header — logo, wordmark, title, subtitle.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {import("react").ReactNode} [props.children]
 */
export default function R79PageHeader({ title, subtitle, children }) {
  return (
    <header className="r79-page-header">
      <R79BrandBar variant="page" />
      <h2 className="r79-page-title">{title}</h2>
      {subtitle ? <p className="r79-page-subtitle">{subtitle}</p> : null}
      {children}
    </header>
  );
}
