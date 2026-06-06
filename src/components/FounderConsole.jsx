import {
  FOUNDER_CONSOLE_TAGLINE,
} from "../data/founderMeta.js";
import { getFounderStats } from "../utils/founderStats.js";
import BrandVersionLabel from "./branding/BrandVersionLabel.jsx";

export default function FounderConsole({ onClose }) {
  const stats = getFounderStats();

  return (
    <div style={styles.overlay} onClick={onClose} role="presentation">
      <div
        style={styles.panel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Founder Console"
      >
        <div style={styles.header}>
          <h3 style={styles.title}>Founder Console</h3>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.grid}>
          <Stat
            label="Current Version"
            value={
              <BrandVersionLabel version={stats.currentVersion} compact />
            }
          />
          <Stat
            label="Commit Count"
            value={
              stats.commitCount !== null && stats.commitCount !== undefined
                ? String(stats.commitCount)
                : "—"
            }
          />
          <Stat label="Record Count" value={stats.recordCount} />
          <Stat label="Cars Count" value={stats.carsCount} />
          <Stat label="Tracks Count" value={stats.tracksCount} />
          <Stat label="AI Modules Count" value={stats.aiModulesCount} />
        </div>

        <p style={styles.tagline}>{FOUNDER_CONSOLE_TAGLINE}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  overlay: {
    alignItems: "center",
    background: "rgba(4, 8, 16, 0.82)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: "16px",
    position: "fixed",
    zIndex: 1000,
  },
  panel: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.55), rgba(9, 12, 20, 0.98))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "14px",
    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.5)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    maxWidth: "420px",
    padding: "18px",
    width: "100%",
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  title: {
    color: "#e8efff",
    fontSize: "1.1rem",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#9bc0ff",
    cursor: "pointer",
    fontSize: "1.5rem",
    lineHeight: 1,
    padding: "0 4px",
  },
  grid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    marginBottom: "14px",
  },
  statCard: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "10px",
  },
  statLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  statValue: {
    color: "#9bc0ff",
    fontSize: "1rem",
    fontWeight: 700,
  },
  tagline: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    fontStyle: "italic",
    margin: 0,
    textAlign: "center",
  },
};
