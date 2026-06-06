import {
  DATA_REPORT_ISSUE_TYPES,
  DATA_REPORT_STATUSES,
} from "../data/dataReportsMeta.js";

const STORAGE_KEY = "r79-data-reports";

/**
 * @typedef {import("../data/dataReportsMeta.js").DataReportStatus} DataReportStatus
 */

/**
 * @typedef {Object} DataReportEntry
 * @property {string} id
 * @property {number} createdAt
 * @property {string} issueType
 * @property {string} itemName
 * @property {string} sourcePage
 * @property {string} userNote
 * @property {string} contactName
 * @property {DataReportStatus} status
 * @property {string} [gameVersion]
 */

/**
 * @param {Partial<DataReportEntry>} entry
 * @returns {DataReportEntry}
 */
function normalizeEntry(entry) {
  const issueType = DATA_REPORT_ISSUE_TYPES.some(
    (type) => type.id === entry.issueType,
  )
    ? entry.issueType
    : "other";

  const status = DATA_REPORT_STATUSES.includes(entry.status)
    ? entry.status
    : "New";

  return {
    id: entry.id ?? `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt ?? Date.now(),
    issueType,
    itemName: String(entry.itemName ?? "").trim(),
    sourcePage: String(entry.sourcePage ?? "").trim(),
    userNote: String(entry.userNote ?? "").trim(),
    contactName: String(entry.contactName ?? "").trim(),
    status,
    gameVersion: String(entry.gameVersion ?? "").trim(),
  };
}

/** @returns {DataReportEntry[]} */
export function loadDataReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => normalizeEntry(entry));
      }
    }
  } catch {
    // fall through
  }

  return [];
}

/** Newest first. */
export function loadDataReportsNewestFirst() {
  return [...loadDataReports()].sort((a, b) => b.createdAt - a.createdAt);
}

/** @param {DataReportEntry[]} entries */
function saveDataReports(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * @param {Omit<DataReportEntry, 'id' | 'createdAt' | 'status'> & { status?: DataReportStatus }} report
 * @returns {DataReportEntry | null}
 */
export function addDataReport(report) {
  if (!report.issueType || !report.sourcePage) {
    return null;
  }

  const normalized = normalizeEntry({
    ...report,
    status: report.status ?? "New",
  });
  const updated = [...loadDataReports(), normalized];
  saveDataReports(updated);
  return normalized;
}

/**
 * @param {string} reportId
 * @param {DataReportStatus} status
 * @returns {DataReportEntry | null}
 */
export function updateDataReportStatus(reportId, status) {
  if (!DATA_REPORT_STATUSES.includes(status)) {
    return null;
  }

  let updatedEntry = null;
  const updated = loadDataReports().map((entry) => {
    if (entry.id !== reportId) {
      return entry;
    }

    updatedEntry = normalizeEntry({ ...entry, status });
    return updatedEntry;
  });

  if (!updatedEntry) {
    return null;
  }

  saveDataReports(updated);
  return updatedEntry;
}

/** @returns {string} */
export function exportDataReportsJson() {
  return JSON.stringify(loadDataReportsNewestFirst(), null, 2);
}

/**
 * @param {number} timestamp
 */
export function formatDataReportDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
