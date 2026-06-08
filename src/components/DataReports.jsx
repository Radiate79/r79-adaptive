import { useMemo, useState } from "react";
import {
  DATA_CORRECTION_TAGLINE,
  DATA_REPORT_STATUSES,
  getDataReportIssueLabel,
} from "../data/dataReportsMeta.js";
import {
  exportDataReportsJson,
  formatDataReportDate,
  loadDataReportsNewestFirst,
  updateDataReportStatus,
} from "../utils/dataReportsStorage.js";
/**
 * @param {{ onBack?: () => void, breadcrumb?: React.ReactNode }} props
 */
export default function DataReports({ onBack, breadcrumb = null }) {
  const [reports, setReports] = useState(() => loadDataReportsNewestFirst());
  const [exportMessage, setExportMessage] = useState("");

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      DATA_REPORT_STATUSES.map((status) => [status, 0]),
    );

    reports.forEach((report) => {
      counts[report.status] = (counts[report.status] ?? 0) + 1;
    });

    return counts;
  }, [reports]);

  const refresh = () => {
    setReports(loadDataReportsNewestFirst());
  };

  const handleStatusChange = (reportId, status) => {
    const updated = updateDataReportStatus(reportId, status);
    if (updated) {
      refresh();
    }
  };

  const handleExport = () => {
    const json = exportDataReportsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `r79-data-reports-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportMessage(`Exported ${reports.length} report(s).`);
    window.setTimeout(() => setExportMessage(""), 3000);
  };

  return (
    <section style={styles.shell}>
      {breadcrumb}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Data Reports</h2>
          <p style={styles.subtitle}>
            Review user and Pathfinder reports of incorrect car, track, class,
            scoring or recommendation data.
          </p>
          <p style={styles.tagline}>{DATA_CORRECTION_TAGLINE}</p>
        </div>
        <div style={styles.headerActions}>
          <button type="button" onClick={refresh} style={styles.secondaryButton}>
            Refresh
          </button>
          <button type="button" onClick={handleExport} style={styles.primaryButton}>
            Export JSON
          </button>
        </div>
      </div>

      {exportMessage ? <p style={styles.exportMessage}>{exportMessage}</p> : null}

      <div style={styles.statsRow}>
        {DATA_REPORT_STATUSES.map((status) => (
          <div key={status} style={styles.statChip}>
            <span style={styles.statLabel}>{status}</span>
            <strong style={styles.statValue}>{statusCounts[status] ?? 0}</strong>
          </div>
        ))}
      </div>

      {reports.length === 0 ? (
        <p style={styles.emptyState}>
          No reports yet. Use &ldquo;Report Issue&rdquo; on recommendation or car
          cards to submit corrections.
        </p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Issue Type</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Source Page</th>
                <th style={styles.th}>User Note</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={styles.tr}>
                  <td style={styles.td}>{formatDataReportDate(report.createdAt)}</td>
                  <td style={styles.td}>
                    {getDataReportIssueLabel(report.issueType)}
                  </td>
                  <td style={styles.td}>{report.itemName || "—"}</td>
                  <td style={styles.td}>{report.sourcePage}</td>
                  <td style={styles.tdNote}>{report.userNote || "—"}</td>
                  <td style={styles.td}>{report.contactName || "—"}</td>
                  <td style={styles.td}>
                      <select
                        value={report.status}
                        onChange={(event) =>
                          handleStatusChange(
                            report.id,
                            /** @type {import("../data/dataReportsMeta.js").DataReportStatus} */ (
                              event.target.value
                            ),
                          )
                        }
                        style={{
                          ...styles.statusSelect,
                          ...STATUS_STYLES[report.status],
                        }}
                      >
                        {DATA_REPORT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onBack ? (
        <button type="button" onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
      ) : null}
    </section>
  );
}

const STATUS_STYLES = {
  New: { borderColor: "rgba(120, 180, 255, 0.5)", color: "#b8d4ff" },
  Reviewing: { borderColor: "rgba(255, 220, 120, 0.5)", color: "#ffe6a8" },
  Fixed: { borderColor: "rgba(120, 220, 150, 0.5)", color: "#b8f5c6" },
  Rejected: { borderColor: "rgba(255, 150, 150, 0.5)", color: "#ffb8b8" },
};

const styles = {
  shell: {
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
  },
  header: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  title: {
    fontSize: "1.45rem",
    fontWeight: 700,
    margin: "0 0 6px",
  },
  subtitle: {
    color: "#b8c8ef",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: 0,
    maxWidth: "560px",
  },
  tagline: {
    color: "#9eb4e8",
    fontSize: "0.88rem",
    fontStyle: "italic",
    margin: "10px 0 0",
  },
  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #3b6fd4, #2a4f9c)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.86rem",
    fontWeight: 600,
    padding: "9px 14px",
  },
  secondaryButton: {
    background: "rgba(18, 28, 48, 0.75)",
    border: "1px solid rgba(140, 170, 230, 0.35)",
    borderRadius: "8px",
    color: "#c8d8ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.86rem",
    padding: "9px 14px",
  },
  exportMessage: {
    color: "#b8f5c6",
    fontSize: "0.86rem",
    margin: "0 0 12px",
  },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "16px",
  },
  statChip: {
    background: "rgba(14, 22, 40, 0.7)",
    border: "1px solid rgba(120, 150, 220, 0.25)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: "88px",
    padding: "8px 12px",
  },
  statLabel: {
    color: "#8fa3d0",
    fontSize: "0.72rem",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "1.1rem",
  },
  emptyState: {
    color: "#9eb4e8",
    fontSize: "0.92rem",
    lineHeight: 1.5,
    margin: "12px 0 0",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(120, 150, 220, 0.25)",
    borderRadius: "10px",
  },
  table: {
    borderCollapse: "collapse",
    fontSize: "0.82rem",
    minWidth: "860px",
    width: "100%",
  },
  th: {
    background: "rgba(14, 22, 40, 0.85)",
    borderBottom: "1px solid rgba(120, 150, 220, 0.25)",
    color: "#9eb4e8",
    fontWeight: 600,
    padding: "10px 12px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(80, 100, 150, 0.2)",
  },
  td: {
    padding: "10px 12px",
    verticalAlign: "top",
  },
  tdNote: {
    maxWidth: "220px",
    padding: "10px 12px",
    verticalAlign: "top",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  statusSelect: {
    background: "rgba(10, 16, 30, 0.9)",
    border: "1px solid rgba(120, 150, 220, 0.35)",
    borderRadius: "6px",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    padding: "6px 8px",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#9eb4e8",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.88rem",
    marginTop: "18px",
    padding: 0,
  },
};
