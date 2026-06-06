import { PATHFINDER_REGISTRY_COPY } from "../data/pathfinderRegistryMeta.js";
import {
  formatPathfinderNumber,
  getPathfinderRegistry,
} from "../utils/pathfinderRegistry.js";

export default function PathfinderRegistry() {
  const registry = getPathfinderRegistry();
  const copy = PATHFINDER_REGISTRY_COPY;
  const fillPercent = Math.min(100, (registry.count / registry.max) * 100);

  return (
    <article style={styles.registry} aria-label="Pathfinder Registry">
      <header style={styles.header}>
        <p style={styles.eyebrow}>{copy.subtitle}</p>
        <h3 style={styles.title}>{copy.title}</h3>
      </header>

      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>{copy.counterLabel}</p>
        <p style={styles.counterValue}>
          {registry.count} / {registry.max}
        </p>
        <div style={styles.progressTrack} aria-hidden="true">
          <span
            style={{
              ...styles.progressFill,
              width: `${fillPercent}%`,
            }}
          />
        </div>
      </div>

      <p style={styles.permanence}>{copy.permanence}</p>

      <div style={styles.awardBlock}>
        {copy.awardOnly.map((line) => (
          <p key={line} style={styles.awardLine}>
            {line}
          </p>
        ))}
      </div>

      {registry.isComplete ? (
        <ProgrammeCompletePanel copy={copy} />
      ) : (
        <p style={styles.closureNote}>{copy.closureNote}</p>
      )}

      <div style={styles.listSection}>
        <h4 style={styles.listTitle}>Registered Pathfinders</h4>
        <ul style={styles.list}>
          {registry.pathfinders.map((entry) => (
            <li key={entry.number} style={styles.listItem}>
              <span style={styles.numberBadge}>
                #{formatPathfinderNumber(entry.number)}
              </span>
              <div style={styles.entryBody}>
                <span style={styles.entryName}>{entry.name}</span>
                {entry.recognition ? (
                  <span style={styles.entryRecognition}>{entry.recognition}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ProgrammeCompletePanel({ copy }) {
  return (
    <section style={styles.completePanel} aria-label="Pathfinder Programme complete">
      <div style={styles.completeHeader}>
        <h4 style={styles.programmeTitle}>{copy.programmeTitle}</h4>
        <span style={styles.completeBadge}>{copy.programmeComplete}</span>
      </div>

      {copy.completeBody.map((line) => (
        <p key={line} style={styles.completeBodyLine}>
          {line}
        </p>
      ))}

      <div style={styles.completeDivider} aria-hidden="true">
        <span style={styles.completeDividerLine} />
      </div>

      {copy.completeVerses.map((line) => (
        <p key={line} style={styles.completeVerse}>
          {line}
        </p>
      ))}

      <p style={styles.completeClosing}>{copy.closing}</p>
    </section>
  );
}

const styles = {
  registry: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(180, 130, 255, 0.35)",
    borderRadius: "14px",
    marginBottom: "14px",
    padding: "18px 16px",
    textAlign: "center",
  },
  header: {
    marginBottom: "16px",
  },
  eyebrow: {
    color: "rgba(184, 205, 255, 0.7)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  title: {
    color: "#ffe6a8",
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: 0,
  },
  counterBlock: {
    marginBottom: "16px",
  },
  counterLabel: {
    color: "rgba(220, 228, 255, 0.82)",
    fontSize: "0.88rem",
    margin: "0 0 6px",
  },
  counterValue: {
    color: "#f3f7ff",
    fontSize: "clamp(1.4rem, 5vw, 1.75rem)",
    fontWeight: 800,
    letterSpacing: "0.04em",
    margin: "0 0 12px",
  },
  progressTrack: {
    background: "rgba(16, 24, 42, 0.75)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "999px",
    height: "6px",
    margin: "0 auto",
    maxWidth: "320px",
    overflow: "hidden",
  },
  progressFill: {
    background: "linear-gradient(90deg, rgba(200, 160, 80, 0.85), rgba(180, 130, 255, 0.85))",
    borderRadius: "999px",
    display: "block",
    height: "100%",
    minWidth: "4px",
    transition: "width 0.4s ease",
  },
  permanence: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: "0 0 14px",
  },
  awardBlock: {
    display: "grid",
    gap: "8px",
    marginBottom: "14px",
  },
  awardLine: {
    color: "#9bc0ff",
    fontSize: "0.9rem",
    fontWeight: 600,
    lineHeight: 1.5,
    margin: 0,
  },
  closureNote: {
    borderTop: "1px solid rgba(124, 156, 222, 0.2)",
    color: "rgba(184, 205, 255, 0.78)",
    fontSize: "0.84rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 0 16px",
    paddingTop: "14px",
  },
  listSection: {
    borderTop: "1px solid rgba(124, 156, 222, 0.22)",
    paddingTop: "16px",
    textAlign: "left",
  },
  listTitle: {
    color: "#e8efff",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: "0 0 12px",
    textAlign: "center",
    textTransform: "uppercase",
  },
  list: {
    display: "grid",
    gap: "8px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  listItem: {
    alignItems: "center",
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "10px",
    display: "flex",
    gap: "12px",
    padding: "10px 12px",
  },
  numberBadge: {
    background: "rgba(56, 44, 18, 0.45)",
    border: "1px solid rgba(220, 180, 90, 0.4)",
    borderRadius: "8px",
    color: "#ffe6a8",
    flexShrink: 0,
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    minWidth: "52px",
    padding: "6px 8px",
    textAlign: "center",
  },
  entryBody: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
  },
  entryName: {
    color: "#f3f7ff",
    fontSize: "0.92rem",
    fontWeight: 700,
  },
  entryRecognition: {
    color: "rgba(184, 205, 255, 0.78)",
    fontSize: "0.8rem",
    fontStyle: "italic",
    lineHeight: 1.4,
  },
  completePanel: {
    background:
      "linear-gradient(180deg, rgba(56, 44, 18, 0.28), rgba(28, 20, 52, 0.42), rgba(9, 14, 24, 0.92))",
    border: "1px solid rgba(220, 180, 90, 0.45)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "16px 14px",
    textAlign: "center",
  },
  completeHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "14px",
  },
  programmeTitle: {
    color: "#ffe6a8",
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  completeBadge: {
    background: "rgba(90, 60, 160, 0.45)",
    border: "1px solid rgba(180, 130, 255, 0.55)",
    borderRadius: "999px",
    color: "#f3f7ff",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.1em",
    padding: "5px 12px",
    textTransform: "uppercase",
  },
  completeBodyLine: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: "0 0 10px",
  },
  completeDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "14px 0",
  },
  completeDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(220, 180, 90, 0.45), rgba(180, 130, 255, 0.45), transparent)",
    display: "block",
    height: "1px",
    width: "min(280px, 72%)",
  },
  completeVerse: {
    color: "#f3f7ff",
    fontSize: "0.94rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.65,
    margin: "0 0 8px",
  },
  completeClosing: {
    color: "rgba(184, 205, 255, 0.92)",
    fontSize: "0.94rem",
    fontStyle: "italic",
    fontWeight: 600,
    margin: "12px 0 0",
  },
};
