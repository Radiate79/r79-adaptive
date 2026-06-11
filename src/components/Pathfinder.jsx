import { useEffect, useRef, useState } from "react";
import { PATHFINDER_FOOTER_LINES } from "../data/brandingMeta.js";
import {
  PATHFINDER_DESCRIPTION,
  PATHFINDER_FOUNDER_CLARIFIER,
  PATHFINDER_INVITATION,
  PATHFINDER_MAY,
  PATHFINDER_OATH,
  PATHFINDER_PRINCIPLES,
  PATHFINDER_TITLE,
} from "../data/pathfinderMeta.js";
import BrandFooter from "./branding/BrandFooter.jsx";
import MembershipBadge from "./branding/MembershipBadge.jsx";
import R79Emblem from "./branding/R79Emblem.jsx";
import PathfinderRegistry from "./PathfinderRegistry.jsx";
import R79PageHeader from "./branding/R79PageHeader.jsx";

export default function Pathfinder() {
  return (
    <section className="r79-page r79-page--narrow">
      <R79PageHeader title={PATHFINDER_TITLE} subtitle={PATHFINDER_DESCRIPTION[0]}>
        <MembershipBadge tier="pathfinder" size="large" />
      </R79PageHeader>

      <article style={styles.card}>
        <div style={styles.principlesBlock}>
          {PATHFINDER_PRINCIPLES.map((line) => (
            <p key={line} style={styles.principleLine}>
              {line}
            </p>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Pathfinders may</h3>
        <ul style={styles.list}>
          {PATHFINDER_MAY.map((item) => (
            <li key={item} style={styles.listItem}>
              {item}
            </li>
          ))}
        </ul>

        <p style={styles.clarifier}>{PATHFINDER_FOUNDER_CLARIFIER}</p>
      </article>

      <PathfinderRegistry />

      <article style={styles.invitationCard} aria-label="Pathfinder invitation mockup">
        <div style={styles.invitationHeader}>
          <R79Emblem variant="badge-lg" pulse />
          <h3 style={styles.invitationTitle}>{PATHFINDER_INVITATION.title}</h3>
        </div>
        <p style={styles.invitationHeadline}>{PATHFINDER_INVITATION.headline}</p>
        {PATHFINDER_INVITATION.lines.map((line) => (
          <p key={line} style={styles.invitationLine}>
            {line}
          </p>
        ))}
      </article>

      <BrandFooter lines={PATHFINDER_FOOTER_LINES} />

      <PathfinderOathSection />
    </section>
  );
}

function PathfinderOathSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={sectionRef}
      style={{
        ...styles.oathSection,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.95s ease, transform 0.95s ease",
      }}
      aria-label="The Pathfinder Oath"
    >
      <h3 style={styles.oathTitle}>{PATHFINDER_OATH.title}</h3>

      <blockquote style={styles.oathQuote}>
        {PATHFINDER_OATH.verses.map((line) => (
          <p key={line} style={styles.oathVerseLine}>
            {line}
          </p>
        ))}
      </blockquote>

      <div style={styles.oathBody}>
        {PATHFINDER_OATH.body.map((paragraph) => (
          <p key={paragraph} style={styles.oathBodyLine}>
            {paragraph}
          </p>
        ))}
      </div>

      <div style={styles.oathDivider} aria-hidden="true">
        <span style={styles.oathDividerLine} />
      </div>

      <p style={styles.oathClosing}>{PATHFINDER_OATH.closing}</p>
    </article>
  );
}

const styles = {
  shell: {
    background:
      "radial-gradient(circle at top, rgba(34, 211, 238, 0.1), rgba(8, 11, 18, 0.98))",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "16px",
    boxShadow: "0 10px 36px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 28px rgba(34, 211, 238, 0.06)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    margin: "0 auto",
    maxWidth: "720px",
    padding: "20px",
  },
  header: {
    marginBottom: "16px",
    textAlign: "center",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "14px 0 8px",
  },
  subtitle: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.94rem",
    lineHeight: 1.55,
    margin: 0,
  },
  card: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  principlesBlock: {
    display: "grid",
    gap: "8px",
    marginBottom: "14px",
  },
  principleLine: {
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#e8efff",
    fontSize: "0.92rem",
    fontWeight: 700,
    margin: "0 0 10px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  list: {
    display: "grid",
    gap: "8px",
    listStyle: "none",
    margin: "0 0 14px",
    padding: 0,
  },
  listItem: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "8px",
    color: "#dce8ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  clarifier: {
    borderTop: "1px solid rgba(124, 156, 222, 0.2)",
    color: "rgba(184, 205, 255, 0.85)",
    fontSize: "0.86rem",
    fontStyle: "italic",
    lineHeight: 1.5,
    margin: 0,
    paddingTop: "12px",
    textAlign: "center",
  },
  invitationCard: {
    background:
      "linear-gradient(180deg, rgba(56, 44, 18, 0.3), rgba(28, 20, 52, 0.45), rgba(9, 14, 24, 0.92))",
    border: "1px solid rgba(220, 180, 90, 0.45)",
    borderRadius: "14px",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.28)",
    padding: "18px",
    textAlign: "center",
  },
  invitationHeader: {
    alignItems: "center",
    display: "grid",
    gap: "10px",
    justifyItems: "center",
    marginBottom: "12px",
  },
  invitationTitle: {
    color: "#ffe6a8",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    margin: 0,
    textTransform: "uppercase",
  },
  invitationHeadline: {
    color: "#f3f7ff",
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: "0 0 10px",
  },
  invitationLine: {
    color: "#dce8ff",
    fontSize: "0.94rem",
    lineHeight: 1.6,
    margin: "0 0 8px",
  },
  oathSection: {
    background:
      "linear-gradient(180deg, rgba(56, 44, 18, 0.22), rgba(28, 20, 52, 0.38), rgba(9, 14, 24, 0.92))",
    border: "1px solid rgba(180, 130, 255, 0.32)",
    borderRadius: "14px",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.22)",
    marginTop: "18px",
    padding: "22px 18px",
    textAlign: "center",
  },
  oathTitle: {
    color: "#ffe6a8",
    fontSize: "1.08rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: "0 0 16px",
  },
  oathQuote: {
    border: "none",
    margin: "0 0 18px",
    padding: 0,
  },
  oathVerseLine: {
    color: "#f3f7ff",
    fontSize: "clamp(0.95rem, 2.8vw, 1.05rem)",
    fontStyle: "italic",
    fontWeight: 600,
    lineHeight: 1.65,
    margin: "0 0 8px",
  },
  oathBody: {
    display: "grid",
    gap: "12px",
    marginBottom: "18px",
  },
  oathBodyLine: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.92rem",
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "540px",
    marginInline: "auto",
  },
  oathDivider: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  oathDividerLine: {
    background:
      "linear-gradient(90deg, transparent, rgba(220, 180, 90, 0.45), rgba(180, 130, 255, 0.45), transparent)",
    display: "block",
    height: "1px",
    width: "min(280px, 72%)",
  },
  oathClosing: {
    color: "rgba(184, 205, 255, 0.92)",
    fontSize: "0.96rem",
    fontStyle: "italic",
    fontWeight: 600,
    letterSpacing: "0.02em",
    margin: 0,
  },
};
