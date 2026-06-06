/** Tagline shown on report UI and Data Reports review page. */
export const DATA_CORRECTION_TAGLINE = "Every correction makes R79 stronger.";

/** @typedef {'New' | 'Reviewing' | 'Fixed' | 'Rejected'} DataReportStatus */

/** @type {DataReportStatus[]} */
export const DATA_REPORT_STATUSES = ["New", "Reviewing", "Fixed", "Rejected"];

/** @type {{ id: string, label: string }[]} */
export const DATA_REPORT_ISSUE_TYPES = [
  { id: "incorrect_car_class", label: "Incorrect car class" },
  { id: "wrong_car_appearing", label: "Wrong car appearing" },
  { id: "wrong_track_data", label: "Wrong track data" },
  { id: "wrong_score", label: "Wrong score" },
  { id: "wrong_recommendation", label: "Wrong recommendation" },
  { id: "missing_car", label: "Missing car" },
  { id: "missing_track", label: "Missing track" },
  { id: "other", label: "Other" },
];

/**
 * @param {string} issueTypeId
 */
export function getDataReportIssueLabel(issueTypeId) {
  const match = DATA_REPORT_ISSUE_TYPES.find((type) => type.id === issueTypeId);
  return match?.label ?? issueTypeId;
}
