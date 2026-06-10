import { Component } from "react";
import { R79_LOGO_SIZES } from "../data/brandingMeta.js";
import R79Emblem from "./branding/R79Emblem.jsx";

const FALLBACK_MESSAGE =
  "R79 loaded but one module failed. Please report this issue.";

/**
 * Catches render errors so the R79 shell remains visible.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("R79 module render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.panel}>
          <div style={styles.logo}>
            <R79Emblem size={R79_LOGO_SIZES.errorIcon} />
          </div>
          <p style={styles.message}>{FALLBACK_MESSAGE}</p>
          {this.props.label ? (
            <p style={styles.detail}>Module: {this.props.label}</p>
          ) : null}
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={styles.button}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  panel: {
    background: "rgba(12, 18, 31, 0.92)",
    border: "1px solid rgba(220, 90, 90, 0.45)",
    borderRadius: "12px",
    color: "#f3f6ff",
    marginBottom: "16px",
    padding: "18px",
  },
  logo: {
    margin: "0 0 10px",
  },
  message: {
    color: "#ffe6a8",
    lineHeight: 1.5,
    margin: "0 0 10px",
  },
  detail: {
    color: "rgba(220, 228, 255, 0.75)",
    fontSize: "0.85rem",
    margin: "0 0 12px",
  },
  button: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 14px",
  },
};
