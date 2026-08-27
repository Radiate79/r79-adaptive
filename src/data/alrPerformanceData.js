/**
 * ALR performance data — structured race results for R79.
 *
 * Expand each round manually from PDF exports (qualifying, feature fastest laps,
 * feature total times). No in-browser PDF parsing.
 */

/** @typedef {'qualifying' | 'feature_fastest_lap' | 'feature_total_time'} AlrPerformanceSessionType */

/**
 * @typedef {Object} AlrPerformanceEvent
 * @property {string} id
 * @property {string} eventName
 * @property {string} track
 * @property {string} trackId
 * @property {number} season
 * @property {number} round
 * @property {string} carClass
 */

/**
 * @typedef {Object} AlrPerformanceRecord
 * @property {string} id
 * @property {string} eventId
 * @property {string} eventName
 * @property {string} track
 * @property {string} trackId
 * @property {AlrPerformanceSessionType} sessionType
 * @property {string} driver
 * @property {string} [car]
 * @property {string} [lapTime]
 * @property {string} [totalTime]
 * @property {number} tier
 * @property {string} source
 * @property {number} season
 * @property {number} round
 * @property {number} [position]
 */

/** @type {Record<AlrPerformanceSessionType, string>} */
export const ALR_PERFORMANCE_SESSION_LABELS = {
  qualifying: "Qualifying",
  feature_fastest_lap: "Feature Race — Fastest Lap",
  feature_total_time: "Feature Race — Total Time",
};

/** @type {AlrPerformanceSessionType[]} */
export const ALR_PERFORMANCE_SESSION_TYPES = [
  "qualifying",
  "feature_fastest_lap",
  "feature_total_time",
];

/** @type {AlrPerformanceEvent[]} */
export const ALR_PERFORMANCE_EVENTS = [
  {
    id: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    season: 23,
    round: 1,
    carClass: "Gr.3",
  },
  {
    id: "s23_r2_trial_mountain",
    eventName: "ALR Season 23 Round 2",
    track: "Trial Mountain",
    trackId: "trial_mountain",
    season: 23,
    round: 2,
    carClass: "Gr.3",
  },
];

/**
 * @param {string} lapOrRaceTime
 * @returns {number}
 */
export function parseAlrPerformanceTime(lapOrRaceTime) {
  const raw = String(lapOrRaceTime ?? "").trim();
  if (!raw) {
    return Number.NaN;
  }

  const segments = raw.split(":").map((part) => Number(part));
  if (segments.some((value) => !Number.isFinite(value))) {
    return Number.NaN;
  }

  if (segments.length === 2) {
    return Math.round((segments[0] * 60 + segments[1]) * 1000);
  }

  if (segments.length === 3) {
    return Math.round((segments[0] * 3600 + segments[1] * 60 + segments[2]) * 1000);
  }

  return Number.NaN;
}

/**
 * @param {string} lapOrRaceTime
 * @returns {string}
 */
export function formatAlrPerformanceTime(lapOrRaceTime) {
  return String(lapOrRaceTime ?? "").trim() || "—";
}

/** @type {AlrPerformanceRecord[]} */
export const ALR_PERFORMANCE_DATA = [
  // —— Suzuka R1 — Qualifying ——
  {
    id: "s23_r1_q_p1",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "R79_Apex",
    car: "Aston Martin V12 Vantage GT3",
    lapTime: "1:50.142",
    tier: 1,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 1,
  },
  {
    id: "s23_r1_q_p2",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "VeloGT_R8",
    car: "Audi R8 LMS Evo",
    lapTime: "1:50.188",
    tier: 1,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 2,
  },
  {
    id: "s23_r1_q_p3",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "AMG_Shift",
    car: "Mercedes-AMG GT3",
    lapTime: "1:50.351",
    tier: 1,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 3,
  },
  {
    id: "s23_r1_q_p4",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "PorschePulse",
    car: "Porsche 911 GT3 R",
    lapTime: "1:50.489",
    tier: 2,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 4,
  },
  {
    id: "s23_r1_q_p5",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "FerrariForge",
    car: "Ferrari 488 GT3 Evo",
    lapTime: "1:50.598",
    tier: 2,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 5,
  },
  {
    id: "s23_r1_q_p6",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "BentleyBoost",
    car: "Bentley Continental GT3",
    lapTime: "1:50.721",
    tier: 2,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 6,
  },
  {
    id: "s23_r1_q_p7",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "NismoNight",
    car: "Nissan GT-R Nismo GT3",
    lapTime: "1:50.812",
    tier: 3,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 7,
  },
  {
    id: "s23_r1_q_p8",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "McLarenMotion",
    car: "McLaren 720S GT3",
    lapTime: "1:50.901",
    tier: 3,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 8,
  },
  {
    id: "s23_r1_q_p9",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "LamborghiniLine",
    car: "Lamborghini Huracan GT3 Evo",
    lapTime: "1:51.024",
    tier: 3,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 9,
  },
  {
    id: "s23_r1_q_p10",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "qualifying",
    driver: "BMW_Brake",
    car: "BMW M6 GT3",
    lapTime: "1:51.118",
    tier: 3,
    source: "ALR S23 R1 Qualifying PDF",
    season: 23,
    round: 1,
    position: 10,
  },

  // —— Suzuka R1 — Feature fastest laps ——
  {
    id: "s23_r1_fl_p1",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "R79_Apex",
    car: "Aston Martin V12 Vantage GT3",
    lapTime: "1:50.078",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 1,
  },
  {
    id: "s23_r1_fl_p2",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "VeloGT_R8",
    car: "Audi R8 LMS Evo",
    lapTime: "1:50.215",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 2,
  },
  {
    id: "s23_r1_fl_p3",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "AMG_Shift",
    car: "Mercedes-AMG GT3",
    lapTime: "1:50.403",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 3,
  },
  {
    id: "s23_r1_fl_p4",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "PorschePulse",
    car: "Porsche 911 GT3 R",
    lapTime: "1:50.512",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 4,
  },
  {
    id: "s23_r1_fl_p5",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "FerrariForge",
    car: "Ferrari 488 GT3 Evo",
    lapTime: "1:50.598",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 5,
  },
  {
    id: "s23_r1_fl_p6",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "BentleyBoost",
    car: "Bentley Continental GT3",
    lapTime: "1:50.721",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 6,
  },
  {
    id: "s23_r1_fl_p7",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "GenesisGrip",
    car: "Genesis X GR3",
    lapTime: "1:50.845",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 7,
  },
  {
    id: "s23_r1_fl_p8",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "NismoNight",
    car: "Nissan GT-R Nismo GT3",
    lapTime: "1:50.912",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 8,
  },
  {
    id: "s23_r1_fl_p9",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "FordFocus",
    car: "Ford Mustang GR3",
    lapTime: "1:51.018",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 9,
  },
  {
    id: "s23_r1_fl_p10",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_fastest_lap",
    driver: "BMW_Brake",
    car: "BMW M6 GT3",
    lapTime: "1:51.102",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 10,
  },

  // —— Suzuka R1 — Feature total times ——
  {
    id: "s23_r1_tt_p1",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "R79_Apex",
    car: "Aston Martin V12 Vantage GT3",
    totalTime: "45:18.412",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 1,
  },
  {
    id: "s23_r1_tt_p2",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "VeloGT_R8",
    car: "Audi R8 LMS Evo",
    totalTime: "45:19.088",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 2,
  },
  {
    id: "s23_r1_tt_p3",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "AMG_Shift",
    car: "Mercedes-AMG GT3",
    totalTime: "45:20.215",
    tier: 1,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 3,
  },
  {
    id: "s23_r1_tt_p4",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "PorschePulse",
    car: "Porsche 911 GT3 R",
    totalTime: "45:22.501",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 4,
  },
  {
    id: "s23_r1_tt_p5",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "FerrariForge",
    car: "Ferrari 488 GT3 Evo",
    totalTime: "45:24.118",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 5,
  },
  {
    id: "s23_r1_tt_p6",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "BentleyBoost",
    car: "Bentley Continental GT3",
    totalTime: "45:25.902",
    tier: 2,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 6,
  },
  {
    id: "s23_r1_tt_p7",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "NismoNight",
    car: "Nissan GT-R Nismo GT3",
    totalTime: "45:28.445",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 7,
  },
  {
    id: "s23_r1_tt_p8",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "McLarenMotion",
    car: "McLaren 720S GT3",
    totalTime: "45:30.012",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 8,
  },
  {
    id: "s23_r1_tt_p9",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "LamborghiniLine",
    car: "Lamborghini Huracan GT3 Evo",
    totalTime: "45:31.778",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 9,
  },
  {
    id: "s23_r1_tt_p10",
    eventId: "s23_r1_suzuka",
    eventName: "ALR Season 23 Round 1",
    track: "Suzuka",
    trackId: "suzuka",
    sessionType: "feature_total_time",
    driver: "BMW_Brake",
    car: "BMW M6 GT3",
    totalTime: "45:33.201",
    tier: 3,
    source: "ALR S23 R1 Feature Race PDF",
    season: 23,
    round: 1,
    position: 10,
  },

  // —— Trial Mountain R2 — starter qualifying (expand each round) ——
  {
    id: "s23_r2_q_p1",
    eventId: "s23_r2_trial_mountain",
    eventName: "ALR Season 23 Round 2",
    track: "Trial Mountain",
    trackId: "trial_mountain",
    sessionType: "qualifying",
    driver: "PorschePulse",
    car: "Porsche 911 GT3 R",
    lapTime: "1:32.901",
    tier: 1,
    source: "ALR S23 R2 Qualifying PDF",
    season: 23,
    round: 2,
    position: 1,
  },
  {
    id: "s23_r2_q_p2",
    eventId: "s23_r2_trial_mountain",
    eventName: "ALR Season 23 Round 2",
    track: "Trial Mountain",
    trackId: "trial_mountain",
    sessionType: "qualifying",
    driver: "VeloGT_R8",
    car: "Audi R8 LMS Evo",
    lapTime: "1:32.956",
    tier: 1,
    source: "ALR S23 R2 Qualifying PDF",
    season: 23,
    round: 2,
    position: 2,
  },
];
