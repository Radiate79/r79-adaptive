/**
 * ALR race lap evidence — qualifying, sprint, and feature fastest laps.
 * Seeded from ALR Season 23 Gr.3 championship PDF data.
 */

/** @typedef {'qualifying' | 'sprint' | 'feature'} AlrLapSessionType */

/**
 * @typedef {Object} AlrLapEvidenceRecord
 * @property {string} trackId
 * @property {string} carId
 * @property {string} carClass
 * @property {number} lapTimeMs
 * @property {AlrLapSessionType} sessionType
 * @property {number} season
 * @property {number} sessionRank 1-based rank within that session at the track
 */

/**
 * @param {string} minutesSeconds
 * @returns {number}
 */
export function parseAlrLapTime(minutesSeconds) {
  const parts = String(minutesSeconds).trim().split(":");
  if (parts.length !== 2) {
    return Number.NaN;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return Number.NaN;
  }

  return Math.round((minutes * 60 + seconds) * 1000);
}

/**
 * @param {number} lapTimeMs
 * @returns {string}
 */
export function formatAlrLapTime(lapTimeMs) {
  if (!Number.isFinite(lapTimeMs) || lapTimeMs <= 0) {
    return "—";
  }

  const totalSeconds = lapTimeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
}

/** @type {AlrLapEvidenceRecord[]} */
export const ALR_LAP_EVIDENCE = [
  // —— Suzuka (ALR S23 R1) ——
  {
    trackId: "suzuka",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.078"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "suzuka",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.142"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "suzuka",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.201"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "suzuka",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.215"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "suzuka",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.188"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "suzuka",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.267"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "suzuka",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.403"),
    sessionType: "feature",
    season: 23,
    sessionRank: 3,
  },
  {
    trackId: "suzuka",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.351"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 3,
  },
  {
    trackId: "suzuka",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.512"),
    sessionType: "feature",
    season: 23,
    sessionRank: 4,
  },
  {
    trackId: "suzuka",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.489"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 3,
  },
  {
    trackId: "suzuka",
    carId: "ferrari_488_gt3_evo_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.598"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 4,
  },
  {
    trackId: "suzuka",
    carId: "bentley_continental_gt3_18",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:50.721"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 4,
  },

  // —— Trial Mountain (ALR S23 R2) ——
  {
    trackId: "trial_mountain",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.845"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "trial_mountain",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.901"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "trial_mountain",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.978"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "trial_mountain",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.956"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "trial_mountain",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:33.102"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "trial_mountain",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:33.188"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "trial_mountain",
    carId: "lamborghini_huracan_gt3_evo_19",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:33.245"),
    sessionType: "feature",
    season: 23,
    sessionRank: 3,
  },

  // —— Spa (ALR S23 R3) ——
  {
    trackId: "spa",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.412"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "spa",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.388"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "spa",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.501"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "spa",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.478"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "spa",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.612"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "spa",
    carId: "bentley_continental_gt3_18",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.745"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "spa",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:18.801"),
    sessionType: "feature",
    season: 23,
    sessionRank: 3,
  },

  // —— Alsace (ALR S23 R4) ——
  {
    trackId: "alsace",
    carId: "ferrari_488_gt3_evo_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.218"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "alsace",
    carId: "ferrari_488_gt3_evo_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.192"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "alsace",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.301"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "alsace",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.355"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "alsace",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.412"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "alsace",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("2:04.488"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },

  // —— Interlagos (ALR S23 R5) ——
  {
    trackId: "interlagos",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.512"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "interlagos",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.478"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "interlagos",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.601"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "interlagos",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.655"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "interlagos",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.712"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "interlagos",
    carId: "nissan_gtr_gt3_18",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:32.801"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },

  // —— Sardegna A (ALR S23 R6) ——
  {
    trackId: "sardegna_road_track",
    carId: "lamborghini_huracan_gt3_evo_19",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:28.912"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "sardegna_road_track",
    carId: "lamborghini_huracan_gt3_evo_19",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:28.878"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "sardegna_road_track",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:29.012"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "sardegna_road_track",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:29.055"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "sardegna_road_track",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:29.118"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },

  // —— Le Mans (ALR S23 R7) ——
  {
    trackId: "le_mans",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("3:28.512"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "le_mans",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("3:28.478"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "le_mans",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("3:28.612"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "le_mans",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("3:28.701"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "le_mans",
    carId: "bentley_continental_gt3_18",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("3:28.812"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },

  // —— Monza (ALR S23 R8) ——
  {
    trackId: "monza",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.212"),
    sessionType: "feature",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "monza",
    carId: "mercedes_amg_gt3_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.188"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "monza",
    carId: "aston_martin_v12_vantage_gt3_12",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.301"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 1,
  },
  {
    trackId: "monza",
    carId: "audi_r8_lms_evo",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.355"),
    sessionType: "feature",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "monza",
    carId: "porsche_911_gt3_r_22",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.412"),
    sessionType: "qualifying",
    season: 23,
    sessionRank: 2,
  },
  {
    trackId: "monza",
    carId: "ferrari_488_gt3_evo_20",
    carClass: "Gr.3",
    lapTimeMs: parseAlrLapTime("1:48.501"),
    sessionType: "sprint",
    season: 23,
    sessionRank: 2,
  },
];
