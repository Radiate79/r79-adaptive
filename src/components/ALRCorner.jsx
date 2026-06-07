import {
  ALR_CORNER_DISCORD_TEXT,
  ALR_CORNER_DISCORD_TITLE,
  ALR_CORNER_INDEPENDENCE_NOTE,
  ALR_CORNER_INTRO,
  ALR_CORNER_OFFERS,
  ALR_CORNER_OFFERS_TITLE,
  ALR_CORNER_R79_NOTE_TEXT,
  ALR_CORNER_R79_NOTE_TITLE,
  ALR_CORNER_WHY_TEXT,
  ALR_CORNER_WHY_TITLE,
} from "../data/alrCornerMeta.js";

export default function ALRCorner() {
  return (
    <section style={styles.shell}>
      <header style={styles.header}>
        <p style={styles.eyebrow}>Featured league</p>
        <h2 style={styles.title}>ALR Corner</h2>
        <p style={styles.intro}>{ALR_CORNER_INTRO}</p>
      </header>

      <article style={styles.independenceCard} aria-label="R79 independence note">
        <p style={styles.independenceText}>{ALR_CORNER_INDEPENDENCE_NOTE}</p>
      </article>

      <article style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>{ALR_CORNER_WHY_TITLE}</h3>
        <p style={styles.sectionText}>{ALR_CORNER_WHY_TEXT}</p>
      </article>

      <article style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>{ALR_CORNER_OFFERS_TITLE}</h3>
        <ul style={styles.offerList}>
          {ALR_CORNER_OFFERS.map((item) => (
            <li key={item} style={styles.offerItem}>
              <span style={styles.offerMarker} aria-hidden="true">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>

      <article style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>{ALR_CORNER_R79_NOTE_TITLE}</h3>
        <p style={styles.sectionText}>{ALR_CORNER_R79_NOTE_TEXT}</p>
      </article>

      <article style={styles.discordCard}>
        <h3 style={styles.sectionTitle}>{ALR_CORNER_DISCORD_TITLE}</h3>
        <p style={styles.discordText}>{ALR_CORNER_DISCORD_TEXT}</p>
      </article>
    </section>
  );
}

const styles = {
  shell: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.45), rgba(9, 12, 20, 0.95))",
    border: "1px solid rgba(122, 150, 220, 0.35)",
    borderRadius: "16px",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    margin: "0 auto",
    maxWidth: "720px",
    padding: "24px 22px",
  },
  header: {
    marginBottom: "18px",
    textAlign: "center",
  },
  eyebrow: {
    color: "rgba(184, 205, 255, 0.75)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    margin: "0 0 10px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 12px",
  },
  intro: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.98rem",
    lineHeight: 1.55,
    margin: 0,
  },
  independenceCard: {
    background: "rgba(56, 44, 18, 0.35)",
    border: "1px solid rgba(220, 180, 90, 0.35)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "12px 14px",
  },
  independenceText: {
    color: "#ffe6a8",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    margin: 0,
  },
  sectionCard: {
    background: "rgba(12, 18, 31, 0.72)",
    border: "1px solid rgba(128, 160, 229, 0.22)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px 16px",
  },
  sectionTitle: {
    color: "#b8cdff",
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: "0 0 10px",
  },
  sectionText: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.92rem",
    lineHeight: 1.55,
    margin: 0,
  },
  offerList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  offerItem: {
    alignItems: "flex-start",
    color: "rgba(220, 228, 255, 0.88)",
    display: "flex",
    fontSize: "0.92rem",
    gap: "10px",
    lineHeight: 1.45,
    marginBottom: "8px",
  },
  offerMarker: {
    color: "#77a0ff",
    flexShrink: 0,
    fontWeight: 700,
  },
  discordCard: {
    background: "rgba(20, 28, 48, 0.75)",
    border: "1px dashed rgba(141, 169, 233, 0.4)",
    borderRadius: "12px",
    marginTop: "4px",
    padding: "14px 16px",
  },
  discordText: {
    color: "rgba(184, 205, 255, 0.8)",
    fontSize: "0.9rem",
    fontStyle: "italic",
    lineHeight: 1.5,
    margin: 0,
  },
};
