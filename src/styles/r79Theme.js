/** Radiate79 / R79 premium visual tokens — presentation only. */

export const R79_COLORS = {
  cyan: "#22d3ee",
  neonBlue: "#38bdf8",
  cyanSoft: "rgba(34, 211, 238, 0.55)",
  violet: "#8b5cf6",
  violetSoft: "rgba(139, 92, 246, 0.5)",
  indigo: "#6366f1",
  gold: "#f5c842",
  goldSoft: "rgba(245, 200, 66, 0.65)",
  textPrimary: "#f4f8ff",
  textSecondary: "rgba(228, 236, 255, 0.9)",
  textMuted: "rgba(196, 210, 240, 0.82)",
  textAccent: "#8ee8ff",
};

export const R79_GRADIENT_PRIMARY =
  "linear-gradient(135deg, #22d3ee 0%, #38bdf8 28%, #6366f1 58%, #8b5cf6 100%)";

export const R79_GRADIENT_GOLD =
  "linear-gradient(135deg, #f5c842 0%, #22d3ee 100%)";

export const R79_FONT =
  "Inter, Segoe UI, Roboto, system-ui, sans-serif";

export const R79_GLASS = {
  background: "rgba(6, 10, 20, 0.72)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export const R79_PAGE_SHELL = {
  ...R79_GLASS,
  background:
    "linear-gradient(160deg, rgba(34, 211, 238, 0.06) 0%, rgba(6, 10, 20, 0.92) 38%, rgba(139, 92, 246, 0.05) 100%)",
  border: "1px solid rgba(34, 211, 238, 0.22)",
  borderRadius: "18px",
  boxShadow:
    "0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1), 0 0 32px rgba(34, 211, 238, 0.08)",
  color: R79_COLORS.textPrimary,
  fontFamily: R79_FONT,
  margin: "0 auto",
  maxWidth: "900px",
  padding: "18px",
};

export const R79_PAGE_TITLE = {
  background: R79_GRADIENT_PRIMARY,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontSize: "1.55rem",
  fontWeight: 800,
  letterSpacing: "0.02em",
  lineHeight: 1.15,
  margin: 0,
  textShadow: "0 0 24px rgba(34, 211, 238, 0.15)",
};

export const R79_PAGE_SUBTITLE = {
  color: R79_COLORS.textSecondary,
  fontSize: "0.92rem",
  lineHeight: 1.45,
  margin: "6px 0 0",
};

export const R79_SECTION_TITLE = {
  background: R79_GRADIENT_PRIMARY,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontSize: "1.05rem",
  fontWeight: 800,
  letterSpacing: "0.02em",
  margin: "0 0 12px",
};

export const R79_INNER_PANEL = {
  ...R79_GLASS,
  border: "1px solid rgba(34, 211, 238, 0.16)",
  borderRadius: "14px",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 0 20px rgba(34, 211, 238, 0.05), 0 0 28px rgba(139, 92, 246, 0.04)",
};

export const R79_BTN_SECONDARY = {
  ...R79_GLASS,
  border: "1px solid rgba(34, 211, 238, 0.32)",
  borderRadius: "12px",
  boxShadow: "0 0 12px rgba(34, 211, 238, 0.08)",
  color: R79_COLORS.textPrimary,
  cursor: "pointer",
  fontSize: "0.88rem",
  fontWeight: 600,
  minHeight: "44px",
  padding: "10px 16px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

export const R79_BTN_ACTIVE = {
  background: R79_GRADIENT_PRIMARY,
  border: "1px solid rgba(34, 211, 238, 0.6)",
  borderRadius: "999px",
  boxShadow:
    "0 0 18px rgba(34, 211, 238, 0.35), 0 0 28px rgba(139, 92, 246, 0.22)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
  minHeight: "44px",
  padding: "10px 16px",
  transition: "box-shadow 0.2s ease, transform 0.15s ease",
};

export const R79_BTN_CHIP = {
  ...R79_GLASS,
  border: "1px solid rgba(34, 211, 238, 0.24)",
  borderRadius: "999px",
  boxShadow: "0 0 10px rgba(34, 211, 238, 0.05)",
  color: R79_COLORS.textPrimary,
  cursor: "pointer",
  fontSize: "0.84rem",
  fontWeight: 600,
  minHeight: "44px",
  padding: "10px 16px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};
