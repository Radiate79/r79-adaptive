import { MEMBERSHIP_BADGE_STYLES } from "../../data/brandingMeta.js";
import R79Emblem from "./R79Emblem.jsx";

/**
 * @param {{ tier: 'free' | 'pro' | 'pathfinder', size?: 'small' | 'medium' | 'large' }} props
 */
export default function MembershipBadge({ tier, size = "medium" }) {
  const style = MEMBERSHIP_BADGE_STYLES[tier];
  const logoVariant =
    size === "small" ? "badge-sm" : size === "large" ? "badge-lg" : "badge-md";
  const labelSize =
    size === "small" ? "0.72rem" : size === "large" ? "0.95rem" : "0.82rem";

  return (
    <div style={styles.badge}>
      <R79Emblem
        variant={logoVariant}
        pulse={tier === "pathfinder"}
      />
      <span
        style={{
          ...styles.label,
          color: style.text,
          fontSize: labelSize,
        }}
      >
        {style.label}
      </span>
    </div>
  );
}

const styles = {
  badge: {
    alignItems: "center",
    display: "grid",
    gap: "8px",
    justifyItems: "center",
  },
  label: {
    fontWeight: 700,
    letterSpacing: "0.04em",
    textAlign: "center",
  },
};
