const STORAGE_KEY = "r79-ai-race-feedback";

export const RECOMMENDATION_HELP_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "partly", label: "Partly" },
  { id: "no", label: "No" },
];

/**
 * @typedef {Object} RaceFeedbackRecommendationContext
 * @property {string} trackId
 * @property {string} trackName
 * @property {string} recommendedCarId
 * @property {string} recommendedCarName
 * @property {number} confidenceScore
 * @property {string} gameVersion
 * @property {string} [driverStyle]
 */

/**
 * @typedef {Object} RaceFeedbackEntry
 * @property {string} id
 * @property {number} createdAt
 * @property {RaceFeedbackRecommendationContext} recommendation
 * @property {string} finishedPosition
 * @property {string} fastestLap
 * @property {string} carUsed
 * @property {string} tyresUsed
 * @property {string} pitStrategyUsed
 * @property {string} fuelLeft
 * @property {string} tyreWearNotes
 * @property {'yes' | 'no' | 'partly'} recommendationHelpful
 * @property {string} driverNotes
 */

/**
 * @param {Partial<RaceFeedbackEntry>} entry
 * @returns {RaceFeedbackEntry}
 */
function normalizeEntry(entry) {
  return {
    id: entry.id ?? `feedback-${Date.now()}`,
    createdAt: entry.createdAt ?? Date.now(),
    recommendation: {
      trackId: entry.recommendation?.trackId ?? "",
      trackName: entry.recommendation?.trackName ?? "",
      recommendedCarId: entry.recommendation?.recommendedCarId ?? "",
      recommendedCarName: entry.recommendation?.recommendedCarName ?? "",
      confidenceScore: Number(entry.recommendation?.confidenceScore ?? 0),
      gameVersion: entry.recommendation?.gameVersion ?? "",
      driverStyle: entry.recommendation?.driverStyle ?? "",
    },
    finishedPosition: String(entry.finishedPosition ?? "").trim(),
    fastestLap: String(entry.fastestLap ?? "").trim(),
    carUsed: String(entry.carUsed ?? "").trim(),
    tyresUsed: String(entry.tyresUsed ?? "").trim(),
    pitStrategyUsed: String(entry.pitStrategyUsed ?? "").trim(),
    fuelLeft: String(entry.fuelLeft ?? "").trim(),
    tyreWearNotes: String(entry.tyreWearNotes ?? "").trim(),
    recommendationHelpful:
      entry.recommendationHelpful === "yes" ||
      entry.recommendationHelpful === "no" ||
      entry.recommendationHelpful === "partly"
        ? entry.recommendationHelpful
        : "partly",
    driverNotes: String(entry.driverNotes ?? "").trim(),
  };
}

/** @returns {RaceFeedbackEntry[]} */
export function loadRaceFeedbackEntries() {
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
export function loadRaceFeedbackEntriesNewestFirst() {
  return [...loadRaceFeedbackEntries()].sort((a, b) => b.createdAt - a.createdAt);
}

/** @param {RaceFeedbackEntry[]} entries */
function saveRaceFeedbackEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * @param {Omit<RaceFeedbackEntry, 'id' | 'createdAt'>} entry
 * @returns {RaceFeedbackEntry | null}
 */
export function addRaceFeedbackEntry(entry) {
  if (!entry.recommendation?.trackId) {
    return null;
  }

  const normalized = normalizeEntry(entry);
  const updated = [...loadRaceFeedbackEntries(), normalized];
  saveRaceFeedbackEntries(updated);
  return normalized;
}

/**
 * @param {number} timestamp
 */
export function formatRaceFeedbackDate(timestamp) {
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

/**
 * @param {'yes' | 'no' | 'partly'} value
 */
export function getRecommendationHelpLabel(value) {
  const match = RECOMMENDATION_HELP_OPTIONS.find((option) => option.id === value);
  return match?.label ?? value;
}
