const styles = {
  warning: {
    background: "rgba(90, 58, 12, 0.45)",
    border: "1px solid rgba(255, 210, 120, 0.45)",
    borderRadius: "10px",
    color: "#ffe6a8",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    margin: "0 0 12px",
    padding: "10px 12px",
  },
  message: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    margin: "0 0 12px",
  },
};

/**
 * @param {{ warning?: string | null, message?: string | null }} props
 */
export function TrackSurfaceWarning({ warning, message }) {
  if (!warning && !message) {
    return null;
  }

  return (
    <>
      {warning ? <p style={styles.warning}>{warning}</p> : null}
      {message ? <p style={styles.message}>{message}</p> : null}
    </>
  );
}
