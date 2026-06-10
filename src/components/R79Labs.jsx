import {
  LABS_FEATURES,
  LABS_FOOTER_LINES,
  LABS_INTRO_CLOSING,
  LABS_INTRO_DESCRIPTION,
  LABS_INTRO_QUESTION,
  LABS_INTRO_QUOTES,
  LABS_MANTRA,
  LABS_STATUS_COLORS,
} from "../data/labsMeta.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

/**
 * @param {{ onOpenDataReports?: () => void }} props
 */
export default function R79Labs({ onOpenDataReports }) {
  return (
    <section className="r79-page r79-page--wide">
      <style>{`
        @keyframes labsIntroFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes labsMantraFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <R79PageHeader title="R79 Labs" subtitle="Experimental features and community tools.">
        <div style={styles.introPanel}>
          <div style={styles.quotesBlock}>
            {LABS_INTRO_QUOTES.map((line) => (
              <p key={line} style={styles.quoteLine}>
                {line}
              </p>
            ))}
          </div>

          <div style={styles.introDivider} aria-hidden="true">
            <span style={styles.introDividerLine} />
          </div>

          <div style={styles.descriptionBlock}>
            {LABS_INTRO_DESCRIPTION.map((line) => (
              <p key={line} style={styles.descriptionLine}>
                {line}
              </p>
            ))}
            <p style={styles.questionLine}>&ldquo;{LABS_INTRO_QUESTION}&rdquo;</p>
          </div>

          <div style={styles.introDivider} aria-hidden="true">
            <span style={styles.introDividerLine} />
          </div>

          <p style={styles.closingLine}>{LABS_INTRO_CLOSING}</p>
        </div>
      </R79PageHeader>

      <DevelopmentMantra />

      <div style={styles.cardGrid}>
        {LABS_FEATURES.map((feature) => (
          <LabFeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {onOpenDataReports ? (
        <div style={styles.toolsPanel}>
          <h3 style={styles.toolsTitle}>Labs Tools</h3>
          <p style={styles.toolsText}>
            Found incorrect car, track, class or recommendation data? Report it
            and review submissions locally.
          </p>
          <button
            type="button"
            onClick={onOpenDataReports}
            style={styles.toolsButton}
          >
            Open Data Reports
          </button>
        </div>
      ) : null}

      <footer style={styles.footer}>
        {LABS_FOOTER_LINES.map((line) => (
          <p key={line} style={styles.footerLine}>
            {line}
          </p>
        ))}
      </footer>
    </section>
  );
}

function DevelopmentMantra() {
  return (
    <section style={styles.mantraSection} aria-label="Development Mantra">
      <h3 style={styles.mantraTitle}>{LABS_MANTRA.title}</h3>

      <div style={styles.mantraLines}>
        {LABS_MANTRA.lines.map((line) => (
          <p key={line} style={styles.mantraLine}>
            {line}
          </p>
        ))}
      </div>

      <div style={styles.mantraDivider} aria-hidden="true">
        <span style={styles.mantraDividerLine} />
      </div>

      <div style={styles.mantraReflections}>
        {LABS_MANTRA.reflections.map((line) => (
          <p key={line} style={styles.mantraReflectionLine}>
            {line}
          </p>
        ))}
      </div>

      <div style={styles.mantraFooterDivider} aria-hidden="true">
        <span style={styles.mantraFooterDividerLine} />
      </div>

      <p style={styles.mantraFooter}>{LABS_MANTRA.footer}</p>
    </section>
  );
}

function LabFeatureCard({ feature }) {
  const accent = LABS_STATUS_COLORS[feature.statusKey] ?? "#9bc0ff";

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon} aria-hidden="true">
          {feature.icon}
        </span>
        <div style={styles.cardTitleBlock}>
          <h3 style={styles.cardTitle}>{feature.name}</h3>
          <span
            style={{
              ...styles.statusBadge,
              borderColor: `${accent}66`,
              color: accent,
            }}
          >
            {feature.status}
          </span>
        </div>
        {feature.comingSoon ? (
          <span style={styles.comingSoonBadge}>Coming Soon</span>
        ) : null}
      </div>

      <p style={styles.cardDescription}>{feature.description}</p>

      <div style={styles.metaGrid}>
        <MetaField label="Development Status" value={feature.status} />
        <MetaField label="Version Target" value={feature.versionTarget} />
        <MetaField label="Expected Release" value={feature.expectedRelease} wide />
      </div>

      <div style={styles.progressBlock}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>Progress</span>
          <span style={styles.progressValue}>{feature.progress}%</span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${feature.progress}%`,
              background: `linear-gradient(90deg, ${accent}99, ${accent})`,
            }}
          />
        </div>
      </div>
    </article>
  );
}

function MetaField({ label, value, wide = false }) {
  return (
    <div style={{ ...styles.metaField, ...(wide ? styles.metaFieldWide : null) }}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

const styles = {
  shell: {
    background: [
      "radial-gradient(ellipse at 50% -10%, rgba(55, 90, 160, 0.3), transparent 55%)",
      "radial-gradient(circle at top, rgba(34, 211, 238, 0.1), rgba(8, 11, 18, 0.98))",
    ].join(", "),
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "16px",
    boxShadow: "0 10px 36px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 28px rgba(34, 211, 238, 0.06)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    margin: "0 auto",
    maxWidth: "980px",
    padding: "20px",
  },
  header: {
    marginBottom: "24px",
    textAlign: "center",
  },
  mantraSection: {
    animation: "labsMantraFadeIn 0.95s ease 0.12s forwards",
    margin: "0 auto 36px",
    maxWidth: "640px",
    opacity: 0,
    padding: "0 8px",
    textAlign: "center",
  },
  mantraTitle: {
    color: "#e8efff",
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0 0 20px",
  },
  mantraLines: {
    display: "grid",
    gap: "12px",
    marginBottom: "24px",
  },
  mantraLine: {
    color: "#f3f7ff",
    fontSize: "clamp(1.35rem, 4vw, 1.75rem)",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1.35,
    margin: 0,
  },
  mantraDivider: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  mantraDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.35), transparent)",
    display: "block",
    height: "1px",
    width: "min(280px, 75%)",
  },
  mantraReflections: {
    display: "grid",
    gap: "10px",
    marginBottom: "20px",
  },
  mantraReflectionLine: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.96rem",
    fontStyle: "italic",
    lineHeight: 1.6,
    margin: 0,
  },
  mantraFooterDivider: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  mantraFooterDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.22), transparent)",
    display: "block",
    height: "1px",
    width: "min(220px, 65%)",
  },
  mantraFooter: {
    color: "rgba(184, 205, 255, 0.75)",
    fontSize: "0.88rem",
    fontStyle: "italic",
    fontWeight: 500,
    lineHeight: 1.5,
    margin: 0,
  },
  introPanel: {
    animation: "labsIntroFadeIn 0.9s ease forwards",
    background:
      "linear-gradient(180deg, rgba(22, 36, 68, 0.45), rgba(9, 14, 24, 0.35))",
    border: "1px solid rgba(132, 172, 255, 0.28)",
    borderRadius: "14px",
    margin: "0 auto",
    maxWidth: "640px",
    opacity: 0,
    padding: "26px 22px",
    textAlign: "center",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    margin: "0 0 18px",
  },
  quotesBlock: {
    display: "grid",
    gap: "10px",
    marginBottom: "22px",
  },
  quoteLine: {
    color: "#e8efff",
    fontSize: "1.08rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.6,
    margin: 0,
  },
  introDivider: {
    display: "flex",
    justifyContent: "center",
    margin: "22px 0",
  },
  introDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.45), transparent)",
    display: "block",
    height: "1px",
    width: "min(320px, 80%)",
  },
  descriptionBlock: {
    display: "grid",
    gap: "9px",
    marginBottom: "4px",
  },
  descriptionLine: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.93rem",
    lineHeight: 1.65,
    margin: 0,
  },
  questionLine: {
    color: "#9bc0ff",
    fontSize: "1.1rem",
    fontStyle: "italic",
    fontWeight: 700,
    lineHeight: 1.5,
    margin: "8px 0 0",
  },
  closingLine: {
    color: "#dce8ff",
    fontSize: "0.98rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: 0,
  },
  cardGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    marginBottom: "16px",
    marginTop: "8px",
  },
  card: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    display: "grid",
    gap: "12px",
    padding: "14px",
  },
  cardHeader: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  cardIcon: {
    fontSize: "1.6rem",
    lineHeight: 1,
  },
  cardTitleBlock: {
    display: "grid",
    flex: 1,
    gap: "6px",
    minWidth: "140px",
  },
  cardTitle: {
    color: "#f3f7ff",
    fontSize: "1rem",
    fontWeight: 700,
    margin: 0,
  },
  statusBadge: {
    border: "1px solid",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    padding: "3px 10px",
    width: "fit-content",
  },
  comingSoonBadge: {
    background: "rgba(56, 44, 18, 0.55)",
    border: "1px solid rgba(220, 180, 90, 0.4)",
    borderRadius: "999px",
    color: "#ffe6a8",
    flexShrink: 0,
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "4px 10px",
    textTransform: "uppercase",
  },
  cardDescription: {
    color: "#dce8ff",
    fontSize: "0.88rem",
    lineHeight: 1.55,
    margin: 0,
  },
  metaGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  metaField: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(128, 160, 229, 0.22)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
  },
  metaFieldWide: {
    gridColumn: "1 / -1",
  },
  metaLabel: {
    color: "#b8cdff",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  metaValue: {
    color: "#9bc0ff",
    fontSize: "0.88rem",
    fontWeight: 700,
  },
  progressBlock: {
    display: "grid",
    gap: "6px",
  },
  progressHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "#b8cdff",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  progressValue: {
    color: "#dce8ff",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  progressTrack: {
    background: "rgba(20, 30, 52, 0.65)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "999px",
    height: "8px",
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: "999px",
    height: "100%",
    minWidth: "4px",
    transition: "width 0.3s ease",
  },
  toolsPanel: {
    background: "rgba(12, 18, 31, 0.75)",
    border: "1px solid rgba(128, 160, 229, 0.28)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "16px",
  },
  toolsTitle: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 8px",
  },
  toolsText: {
    color: "#b8c8ef",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  toolsButton: {
    background: "linear-gradient(135deg, #3b6fd4, #2a4f9c)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 600,
    padding: "10px 14px",
  },
  footer: {
    borderTop: "1px solid rgba(124, 156, 222, 0.22)",
    paddingTop: "16px",
    textAlign: "center",
  },
  footerLine: {
    color: "rgba(205, 217, 255, 0.82)",
    fontSize: "0.92rem",
    fontStyle: "italic",
    fontWeight: 600,
    margin: "0 0 6px",
  },
};
