import {
  MEMBERSHIP_INTRO,
  MEMBERSHIP_TIER_SUMMARIES,
  MEMBERSHIP_TIERS,
} from "../data/membershipMeta.js";
import { MEMBERSHIP_FOOTER_LINES } from "../data/brandingMeta.js";
import BrandFooter from "./branding/BrandFooter.jsx";
import MembershipBadge from "./branding/MembershipBadge.jsx";
import R79PageHeader from "./branding/R79PageHeader.jsx";

const TIER_VARIANT_STYLES = {
  free: "tierCardFree",
  pro: "tierCardPro",
  pathfinder: "tierCardPathfinder",
};

export default function Membership({ onOpenPathfinder }) {
  return (
    <section className="r79-page r79-page--wide">
      <R79PageHeader title="Membership" subtitle={MEMBERSHIP_INTRO} />

      <div style={styles.tierGrid}>
        {MEMBERSHIP_TIERS.map((tier) => (
          <MembershipTierCard key={tier.id} tier={tier} />
        ))}
      </div>

      <article style={styles.pathfinderNote}>
        <p style={styles.pathfinderNoteText}>
          Pathfinder is invitation-only — not bought, but invited or earned.
          It recognises early contributors and testers, not project ownership.
        </p>
        {onOpenPathfinder ? (
          <button
            type="button"
            onClick={onOpenPathfinder}
            style={styles.pathfinderButton}
          >
            Learn about Pathfinder
          </button>
        ) : null}
      </article>

      <BrandFooter lines={MEMBERSHIP_FOOTER_LINES} style={styles.footer} />
    </section>
  );
}

function MembershipTierCard({ tier }) {
  const variantStyle = styles[TIER_VARIANT_STYLES[tier.variant]];

  return (
    <article style={{ ...styles.tierCard, ...variantStyle }}>
      <div style={styles.badgeWrap}>
        <MembershipBadge tier={tier.variant} size="medium" />
      </div>
      <h3 style={styles.tierTitle}>{tier.title}</h3>
      <p style={styles.tierSummary}>
        {MEMBERSHIP_TIER_SUMMARIES[tier.variant]}
      </p>
      <ul style={styles.featureList}>
        {tier.features.map((feature) => (
          <li key={feature} style={styles.featureItem}>
            <span style={styles.featureMarker} aria-hidden="true">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
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
    maxWidth: "980px",
    padding: "20px",
  },
  header: {
    marginBottom: "18px",
    textAlign: "center",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  subtitle: {
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: "0 auto",
    maxWidth: "560px",
  },
  tierGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    marginBottom: "16px",
  },
  tierCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    display: "grid",
    gap: "10px",
    padding: "14px",
  },
  tierCardFree: {
    borderColor: "rgba(123, 153, 219, 0.3)",
  },
  tierCardPro: {
    background:
      "linear-gradient(180deg, rgba(28, 48, 92, 0.4), rgba(9, 14, 24, 0.92))",
    borderColor: "rgba(132, 172, 255, 0.45)",
    boxShadow: "inset 0 1px 0 rgba(180, 200, 255, 0.08)",
  },
  tierCardPathfinder: {
    background:
      "linear-gradient(180deg, rgba(56, 44, 18, 0.25), rgba(9, 14, 24, 0.92))",
    borderColor: "rgba(220, 180, 90, 0.4)",
  },
  badgeWrap: {
    display: "flex",
    justifyContent: "center",
  },
  tierTitle: {
    color: "#f3f7ff",
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: 0,
    textAlign: "center",
  },
  tierSummary: {
    color: "rgba(184, 205, 255, 0.9)",
    fontSize: "0.88rem",
    fontStyle: "italic",
    lineHeight: 1.45,
    margin: 0,
    textAlign: "center",
  },
  featureList: {
    display: "grid",
    gap: "8px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  featureItem: {
    alignItems: "flex-start",
    background: "rgba(16, 24, 42, 0.45)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    color: "#dce8ff",
    display: "flex",
    fontSize: "0.88rem",
    gap: "10px",
    lineHeight: 1.45,
    padding: "8px 10px",
  },
  featureMarker: {
    color: "#7dffa8",
    flexShrink: 0,
    fontWeight: 700,
  },
  pathfinderNote: {
    background: "rgba(28, 20, 52, 0.35)",
    border: "1px solid rgba(180, 130, 255, 0.35)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "14px",
    textAlign: "center",
  },
  pathfinderNoteText: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    margin: "0 0 12px",
  },
  pathfinderButton: {
    background: "linear-gradient(90deg, rgba(120, 90, 40, 0.85), rgba(90, 60, 160, 0.85))",
    border: "1px solid rgba(220, 180, 90, 0.5)",
    borderRadius: "999px",
    color: "#ffe6a8",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "10px 18px",
  },
  footer: {
    marginTop: "4px",
  },
};
