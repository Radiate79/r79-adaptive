/**
 * ALR pit lane loss database — measured times and calendar metadata.
 *
 * Set `pitLaneLossSeconds` to a number when measured; leave null for TBC.
 * Update `strategyNotes` with track-specific guidance as data becomes available.
 */

/** @typedef {'TBC' | 'measured'} PitLaneLossStatus */

/**
 * @typedef {Object} ALRPitLaneCalendarEntry
 * @property {number} season
 * @property {number} [round]
 * @property {string} trackId
 * @property {string} label
 * @property {string} carClass
 * @property {number | null} pitLaneLossSeconds Measured loss in seconds; null = TBC
 * @property {PitLaneLossStatus} status
 * @property {string[]} [strategyNotes]
 */

/** ALR Season 23 Gr.3 championship calendar. */
export const ALR_SEASON_23_GR3_CALENDAR = [
  {
    season: 23,
    round: 1,
    trackId: "suzuka",
    label: "Suzuka",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 2,
    trackId: "trial_mountain",
    label: "Trial Mountain",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 3,
    trackId: "spa",
    label: "Spa",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 4,
    trackId: "alsace",
    label: "Alsace",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 5,
    trackId: "interlagos",
    label: "Interlagos",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 6,
    trackId: "sardegna_road_track",
    label: "Sardegna A",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 7,
    trackId: "le_mans",
    label: "Le Mans",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
  {
    season: 23,
    round: 8,
    trackId: "monza",
    label: "Monza",
    carClass: "Gr.3",
    pitLaneLossSeconds: null,
    status: "TBC",
    strategyNotes: [],
  },
];

/**
 * @param {ALRPitLaneCalendarEntry | null | undefined} entry
 * @returns {string}
 */
export function formatPitLaneLoss(entry) {
  if (!entry) {
    return "TBC";
  }

  if (
    entry.status === "TBC" ||
    entry.pitLaneLossSeconds == null ||
    !Number.isFinite(Number(entry.pitLaneLossSeconds))
  ) {
    return "TBC";
  }

  const seconds = Number(entry.pitLaneLossSeconds);
  if (seconds <= 0) {
    return "TBC";
  }

  return `${seconds.toFixed(1)}s`;
}

/**
 * @param {string} trackId
 * @param {{ season?: number, carClass?: string }} [options]
 * @returns {ALRPitLaneCalendarEntry | null}
 */
export function getPitLaneCalendarEntry(
  trackId,
  options = { season: 23, carClass: "Gr.3" },
) {
  const season = options.season ?? 23;
  const carClass = options.carClass ?? "Gr.3";

  return (
    ALR_SEASON_23_GR3_CALENDAR.find(
      (entry) =>
        entry.trackId === trackId &&
        entry.season === season &&
        entry.carClass === carClass,
    ) ?? null
  );
}

/**
 * @param {string} trackId
 * @param {{ season?: number, carClass?: string }} [options]
 * @returns {string}
 */
export function getPitLaneLossLabel(trackId, options) {
  return formatPitLaneLoss(getPitLaneCalendarEntry(trackId, options));
}
