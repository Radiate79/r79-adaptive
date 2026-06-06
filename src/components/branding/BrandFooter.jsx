/**
 * Elegant centred footer for R79 branding lines.
 * @param {{ lines: string[], accentLast?: boolean, style?: import('react').CSSProperties }} props
 */
export default function BrandFooter({ lines, accentLast = false, style }) {
  return (
    <footer style={{ ...styles.footer, ...style }}>
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        return (
          <p
            key={line}
            style={{
              ...styles.line,
              ...(accentLast && isLast ? styles.lineAccent : null),
            }}
          >
            {line}
          </p>
        );
      })}
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: "1px solid rgba(124, 156, 222, 0.22)",
    paddingTop: "16px",
    textAlign: "center",
  },
  line: {
    color: "rgba(205, 217, 255, 0.78)",
    fontSize: "0.9rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 0 6px",
  },
  lineAccent: {
    color: "rgba(184, 205, 255, 0.92)",
    fontWeight: 600,
    marginTop: "4px",
  },
};
