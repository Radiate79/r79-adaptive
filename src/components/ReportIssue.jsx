import { useEffect, useState } from "react";
import {
  DATA_CORRECTION_TAGLINE,
  DATA_REPORT_ISSUE_TYPES,
} from "../data/dataReportsMeta.js";
import { addDataReport } from "../utils/dataReportsStorage.js";

/**
 * @typedef {Object} ReportIssueButtonProps
 * @property {string} sourcePage
 * @property {string} [itemName]
 * @property {string} [defaultIssueType]
 * @property {string} [gameVersion]
 * @property {boolean} [compact]
 */

/**
 * @param {ReportIssueButtonProps} props
 */
export function ReportIssueButton({
  sourcePage,
  itemName = "",
  defaultIssueType = "other",
  gameVersion = "",
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...styles.trigger,
          ...(compact ? styles.triggerCompact : null),
        }}
        aria-label={`Report issue${itemName ? ` for ${itemName}` : ""}`}
      >
        Report Issue
      </button>

      {open ? (
        <ReportIssueModal
          sourcePage={sourcePage}
          itemName={itemName}
          defaultIssueType={defaultIssueType}
          gameVersion={gameVersion}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

/**
 * @param {{
 *   sourcePage: string,
 *   itemName: string,
 *   defaultIssueType: string,
 *   gameVersion: string,
 *   onClose: () => void,
 * }} props
 */
function ReportIssueModal({
  sourcePage,
  itemName,
  defaultIssueType,
  gameVersion,
  onClose,
}) {
  const [issueType, setIssueType] = useState(defaultIssueType);
  const [item, setItem] = useState(itemName);
  const [source, setSource] = useState(sourcePage);
  const [userNote, setUserNote] = useState("");
  const [contactName, setContactName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const saved = addDataReport({
      issueType,
      itemName: item,
      sourcePage: source,
      userNote,
      contactName,
      gameVersion,
    });

    if (!saved) {
      setMessage("Could not save report. Check required fields and try again.");
      setSubmitting(false);
      return;
    }

    setMessage("Report saved. Thank you — every correction makes R79 stronger.");
    setSubmitting(false);

    window.setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div style={styles.overlay} role="presentation" onClick={onClose}>
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-issue-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div>
            <h3 id="report-issue-title" style={styles.modalTitle}>
              Report Incorrect Data
            </h3>
            <p style={styles.modalTagline}>{DATA_CORRECTION_TAGLINE}</p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            Issue Type
            <select
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              style={styles.select}
              required
            >
              {DATA_REPORT_ISSUE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            Item
            <input
              type="text"
              value={item}
              onChange={(event) => setItem(event.target.value)}
              placeholder="Car, track, or data item"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            Source Page
            <input
              type="text"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              style={styles.input}
              required
            />
          </label>

          <label style={styles.field}>
            Your Note
            <textarea
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
              placeholder="Describe what looks wrong…"
              rows={4}
              style={styles.textarea}
            />
          </label>

          <label style={styles.field}>
            Contact / Name <span style={styles.optional}>(optional)</span>
            <input
              type="text"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Pathfinder callsign or email"
              style={styles.input}
            />
          </label>

          {message ? <p style={styles.message}>{message}</p> : null}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={styles.submitButton}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  trigger: {
    background: "rgba(18, 28, 48, 0.75)",
    border: "1px solid rgba(140, 170, 230, 0.35)",
    borderRadius: "8px",
    color: "#c8d8ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "6px 10px",
    whiteSpace: "nowrap",
  },
  triggerCompact: {
    fontSize: "0.72rem",
    padding: "4px 8px",
  },
  overlay: {
    alignItems: "center",
    background: "rgba(4, 8, 18, 0.82)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: "20px",
    position: "fixed",
    zIndex: 1200,
  },
  modal: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.55), rgba(9, 12, 20, 0.98))",
    border: "1px solid rgba(122, 150, 220, 0.45)",
    borderRadius: "14px",
    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.5)",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    maxHeight: "90vh",
    maxWidth: "520px",
    overflowY: "auto",
    padding: "20px",
    width: "100%",
  },
  modalHeader: {
    alignItems: "flex-start",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  modalTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    margin: 0,
  },
  modalTagline: {
    color: "#9eb4e8",
    fontSize: "0.86rem",
    fontStyle: "italic",
    margin: "6px 0 0",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#9eb4e8",
    cursor: "pointer",
    fontSize: "1.5rem",
    lineHeight: 1,
    padding: "0 4px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  field: {
    color: "#d8e4ff",
    display: "flex",
    flexDirection: "column",
    fontSize: "0.84rem",
    gap: "6px",
    fontWeight: 600,
  },
  optional: {
    color: "#8fa3d0",
    fontWeight: 400,
  },
  select: {
    background: "rgba(10, 16, 30, 0.9)",
    border: "1px solid rgba(120, 150, 220, 0.35)",
    borderRadius: "8px",
    color: "#f3f6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    padding: "10px 12px",
  },
  input: {
    background: "rgba(10, 16, 30, 0.9)",
    border: "1px solid rgba(120, 150, 220, 0.35)",
    borderRadius: "8px",
    color: "#f3f6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    padding: "10px 12px",
  },
  textarea: {
    background: "rgba(10, 16, 30, 0.9)",
    border: "1px solid rgba(120, 150, 220, 0.35)",
    borderRadius: "8px",
    color: "#f3f6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    padding: "10px 12px",
    resize: "vertical",
  },
  message: {
    color: "#b8f5c6",
    fontSize: "0.86rem",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "4px",
  },
  cancelButton: {
    background: "transparent",
    border: "1px solid rgba(140, 170, 230, 0.35)",
    borderRadius: "8px",
    color: "#c8d8ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    padding: "10px 14px",
  },
  submitButton: {
    background: "linear-gradient(135deg, #3b6fd4, #2a4f9c)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    fontWeight: 600,
    padding: "10px 16px",
  },
};
