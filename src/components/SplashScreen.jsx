import {
  BRAND_TAGLINE,
  SPLASH_COPY,
  formatVersionLabel,
} from "../data/brandingMeta.js";
import { APP_VERSION } from "../data/founderMeta.js";
import { markSplashSeen } from "../utils/splashStorage.js";
import R79Emblem from "./branding/R79Emblem.jsx";

export default function SplashScreen({ onEnter }) {
  const handleEnter = () => {
    markSplashSeen();
    onEnter();
  };

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes splashFadeIn {
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

      <div style={styles.panel}>
        <div style={styles.emblemWrap}>
          <R79Emblem size={128} pulse />
        </div>

        <h1 style={styles.title}>{SPLASH_COPY.title}</h1>

        <div style={styles.mottoBlock}>
          {SPLASH_COPY.motto.map((line) => (
            <p key={line} style={styles.mottoLine}>
              {line}
            </p>
          ))}
        </div>

        <div style={styles.mantraBlock}>
          {SPLASH_COPY.mantra.map((line) => (
            <p key={line} style={styles.mantraLine}>
              {line}
            </p>
          ))}
        </div>

        <button type="button" onClick={handleEnter} style={styles.enterButton}>
          {SPLASH_COPY.enterLabel}
        </button>
      </div>

      <div style={styles.splashFooter}>
        <p style={styles.splashVersion}>{formatVersionLabel(APP_VERSION)}</p>
        <p style={styles.splashTagline}>{BRAND_TAGLINE}</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    alignItems: "center",
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.55), rgba(6, 9, 16, 0.98))",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: "20px 20px 72px",
    position: "fixed",
    zIndex: 2000,
  },
  splashFooter: {
    bottom: "28px",
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
  },
  splashVersion: {
    color: "rgba(184, 205, 255, 0.55)",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    margin: "0 0 4px",
    textTransform: "uppercase",
  },
  splashTagline: {
    color: "rgba(184, 205, 255, 0.42)",
    fontSize: "0.72rem",
    fontStyle: "italic",
    fontWeight: 500,
    margin: 0,
  },
  panel: {
    animation: "splashFadeIn 0.9s ease forwards",
    maxWidth: "420px",
    opacity: 0,
    textAlign: "center",
    width: "100%",
  },
  emblemWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "18px",
  },
  title: {
    background: "linear-gradient(90deg, #dce9ff, #9bc0ff)",
    backgroundClip: "text",
    color: "transparent",
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    margin: "0 0 14px",
  },
  mottoBlock: {
    marginBottom: "20px",
  },
  mottoLine: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.95rem",
    fontStyle: "italic",
    lineHeight: 1.55,
    margin: "0 0 4px",
  },
  mantraBlock: {
    display: "grid",
    gap: "6px",
    marginBottom: "22px",
  },
  mantraLine: {
    color: "#9bc0ff",
    fontSize: "0.88rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    margin: 0,
  },
  enterButton: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 700,
    padding: "12px 28px",
  },
};
