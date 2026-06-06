import { THE_NORTH_STAR, THE_PROMISE } from "../data/promiseMeta.js";

export default function ThePromise() {
  return (
    <section style={styles.shell}>
      <header style={styles.header}>
        <p style={styles.eyebrow}>{THE_PROMISE.eyebrow}</p>
        <h2 style={styles.title}>{THE_PROMISE.title}</h2>
        <p style={styles.subtitle}>
          The principles that guide R79 forever — a permanent, read-only record.
        </p>
      </header>

      <article style={styles.promiseCard} aria-label="The Promise">
        <div style={styles.principlesBlock}>
          <p style={styles.lead}>{THE_PROMISE.lead}</p>
          {THE_PROMISE.commitments.map((line) => (
            <p key={line} style={styles.line}>
              {line}
            </p>
          ))}
          <div style={styles.principleGroup}>
            {THE_PROMISE.principles.map((line) => (
              <p key={line} style={styles.principle}>
                {line}
              </p>
            ))}
          </div>
          <p style={styles.closing}>{THE_PROMISE.closing}</p>
        </div>

        <div style={styles.divider} aria-hidden="true">
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.membershipBlock}>
          {THE_PROMISE.membership.map((line) => (
            <p key={line} style={styles.membershipLine}>
              {line}
            </p>
          ))}
        </div>

        <div style={styles.divider} aria-hidden="true">
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.identityBlock}>
          {THE_PROMISE.identity.map((line) => (
            <p key={line} style={styles.identityLine}>
              {line}
            </p>
          ))}
        </div>

        <div style={styles.divider} aria-hidden="true">
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.pathfinderBlock}>
          {THE_PROMISE.pathfinderRecognition.map((line) => (
            <p key={line} style={styles.pathfinderLine}>
              {line}
            </p>
          ))}
        </div>

        <div style={styles.divider} aria-hidden="true">
          <span style={styles.dividerLine} />
        </div>

        <section style={styles.northStarSection} aria-label="North Star">
          <h3 style={styles.northStarTitle}>{THE_NORTH_STAR.title}</h3>
          <p style={styles.northStarIntro}>{THE_NORTH_STAR.intro}</p>
          <blockquote style={styles.northStarQuestion}>
            &ldquo;{THE_NORTH_STAR.question}&rdquo;
          </blockquote>
          <p style={styles.northStarAffirmation}>{THE_NORTH_STAR.affirmation}</p>
          <div style={styles.northStarMantra}>
            {THE_NORTH_STAR.mantra.map((line) => (
              <p key={line} style={styles.northStarMantraLine}>
                {line}
              </p>
            ))}
          </div>
        </section>

        <p style={styles.finalLine}>{THE_PROMISE.finalLine}</p>
      </article>
    </section>
  );
}

const styles = {
  shell: {
    background: [
      "radial-gradient(ellipse at 50% -10%, rgba(45, 85, 160, 0.35), transparent 55%)",
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.45), rgba(9, 12, 20, 0.95))",
    ].join(", "),
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
    marginBottom: "20px",
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
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    margin: "0 0 10px",
  },
  subtitle: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.94rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: 0,
  },
  promiseCard: {
    background:
      "linear-gradient(180deg, rgba(28, 48, 92, 0.35), rgba(9, 14, 24, 0.95))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "14px",
    boxShadow:
      "0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(200, 215, 255, 0.08)",
    padding: "22px 20px",
    textAlign: "center",
  },
  principlesBlock: {
    borderLeft: "3px solid rgba(132, 172, 255, 0.4)",
    marginBottom: "20px",
    paddingLeft: "16px",
    textAlign: "left",
  },
  lead: {
    color: "#e8efff",
    fontSize: "0.98rem",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "0 0 12px",
  },
  line: {
    color: "#dce8ff",
    fontSize: "0.94rem",
    lineHeight: 1.55,
    margin: "0 0 8px",
  },
  principleGroup: {
    display: "grid",
    gap: "6px",
    margin: "14px 0",
  },
  principle: {
    color: "#9bc0ff",
    fontSize: "0.94rem",
    fontWeight: 700,
    lineHeight: 1.5,
    margin: 0,
  },
  closing: {
    color: "#e8efff",
    fontSize: "0.96rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "14px 0 0",
  },
  divider: {
    display: "flex",
    justifyContent: "center",
    margin: "20px 0",
  },
  dividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(132, 172, 255, 0.4), transparent)",
    display: "block",
    height: "1px",
    width: "min(320px, 80%)",
  },
  membershipBlock: {
    display: "grid",
    gap: "10px",
    marginBottom: "4px",
  },
  membershipLine: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.93rem",
    lineHeight: 1.65,
    margin: 0,
  },
  identityBlock: {
    marginBottom: "4px",
  },
  pathfinderBlock: {
    display: "grid",
    gap: "8px",
    marginBottom: "4px",
  },
  pathfinderLine: {
    color: "rgba(255, 230, 168, 0.92)",
    fontSize: "0.93rem",
    lineHeight: 1.65,
    margin: 0,
  },
  northStarSection: {
    marginBottom: "18px",
    textAlign: "center",
  },
  northStarTitle: {
    color: "#f3f7ff",
    fontSize: "1.08rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: "0 0 12px",
  },
  northStarIntro: {
    color: "#dce8ff",
    fontSize: "0.94rem",
    lineHeight: 1.55,
    margin: "0 0 12px",
  },
  northStarQuestion: {
    background: "rgba(12, 18, 31, 0.75)",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "10px",
    color: "#e8efff",
    fontSize: "1.02rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.55,
    margin: "0 auto 14px",
    maxWidth: "520px",
    padding: "14px 16px",
  },
  northStarAffirmation: {
    color: "#9bc0ff",
    fontSize: "0.94rem",
    fontWeight: 600,
    margin: "0 0 12px",
  },
  northStarMantra: {
    display: "grid",
    gap: "8px",
  },
  northStarMantraLine: {
    color: "#f3f7ff",
    fontSize: "clamp(1.05rem, 3.5vw, 1.25rem)",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1.4,
    margin: 0,
  },
  identityLine: {
    color: "#e8efff",
    fontSize: "1.02rem",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.65,
    margin: "0 0 6px",
  },
  finalLine: {
    borderTop: "1px solid rgba(124, 156, 222, 0.25)",
    color: "rgba(184, 205, 255, 0.92)",
    fontSize: "0.98rem",
    fontStyle: "italic",
    fontWeight: 600,
    letterSpacing: "0.02em",
    margin: 0,
    paddingTop: "16px",
  },
};
