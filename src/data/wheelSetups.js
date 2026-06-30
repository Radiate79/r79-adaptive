import { STARTER_SETUP_LABEL } from "./wheelSetupsMeta.js";
import { cars as gt7Cars } from "./gt7/cars.js";
import { T598_VALIDATED_PROFILES } from "./t598ValidatedProfiles.js";

/** @type {Record<string, string>} */
const T598_BASE_VALUES = {
  ffb: "3",
  master: "100%",
  mode: "E",
  inertia: "High",
  friction: "Mid",
  boostLow: "0",
  boostHigh: "0",
  speed: "High",
  damper: "20%",
  damperGain: "High",
  spring: "0%",
  gearJolt: "Medium",
  endStop: "Mid",
};

/** Gr.1 — higher stability, controlled damping, high-speed confidence. */
const T598_GR1_STARTER = {
  ...T598_BASE_VALUES,
  damper: "35%",
  inertia: "High",
  friction: "Mid",
  speed: "High",
  brakeBalance: "54% front / 46% rear",
};

/** Gr.3 — balanced rotation, responsive centre, stable under load. */
const T598_GR3_STARTER = {
  ...T598_BASE_VALUES,
  damper: "20%",
  inertia: "Mid",
  friction: "Mid",
  brakeBalance: "52% front / 48% rear",
};

/** Gr.2 — sharp but stable, strong corner entry, balanced rotation. */
const T598_GR2_STARTER = {
  ...T598_BASE_VALUES,
  damper: "30%",
  inertia: "Mid",
  friction: "Mid",
  brakeBalance: "52% front / 48% rear",
};

/** Gr.4 — smoother, forgiving, lower snappiness, good traction. */
const T598_GR4_STARTER = {
  ...T598_BASE_VALUES,
  damper: "25%",
  inertia: "Mid",
  friction: "Low",
  speed: "Mid",
  brakeBalance: "51% front / 49% rear",
};

/**
 * @typedef {Object} WheelSetupRecord
 * @property {string} id
 * @property {string} label
 * @property {boolean} isStarter
 * @property {import("./gameVersions.js").GameVersion} gameVersion
 * @property {string} wheelBase
 * @property {string} carId
 * @property {string} trackId
 * @property {string} tyreCompound
 * @property {boolean} bopOn
 * @property {Record<string, string | number>} values
 */

/** @type {WheelSetupRecord[]} */
const BASE_STARTER_WHEEL_SETUPS = [
  {
    id: "starter_t598_suzuka_porsche",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "porsche_911_gt3_r_22",
    trackId: "suzuka",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
    },
  },
  {
    id: "starter_g923_spa_mercedes",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "logitech_g923",
    carId: "mercedes_amg_gt3_20",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      forceFeedbackMaxTorque: 5,
      forceFeedbackSensitivity: 6,
      controllerSteeringSensitivity: 5,
      vibrationStrength: 4,
      brakeBalance: "52% front / 48% rear",
      notes:
        "Demo placeholder for high-speed circuits. Reduce FFB if kerb hits feel harsh.",
    },
  },
  {
    id: "starter_fanatec_daytona_nissan",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "fanatec_gt_dd_pro",
    carId: "nissan_gtr_gt3_18",
    trackId: "daytona_road_course",
    tyreCompound: "M",
    bopOn: true,
    values: {
      sen: 360,
      ff: 75,
      ffs: 100,
      ndp: 20,
      nfr: 15,
      nin: 8,
      int: 5,
      fei: 100,
      for: 100,
      spr: 50,
      dpr: 50,
      brf: 60,
      brakeBalance: "50% front / 50% rear",
      notes:
        "Demo placeholder for drafting-heavy Daytona road course. Verify NDP on your DD base.",
    },
  },
  {
    id: "starter_moza_r5_watkins_genesis",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "moza_r5",
    carId: "genesis_x_gr3",
    trackId: "watkins_glen",
    tyreCompound: "M",
    bopOn: true,
    values: {
      steeringAngle: 900,
      roadSensitivity: 65,
      gameFfbIntensity: 70,
      maximumWheelSpeed: 100,
      wheelSpringStrength: 0,
      wheelDamper: 10,
      naturalInertia: 35,
      mechanicalFriction: 15,
      brakeBalance: "51% front / 49% rear",
      notes:
        "Demo placeholder for balanced road circuits. Tune road sensitivity after practice.",
    },
  },
  {
    id: "starter_t598_spa_ferrari296",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ferrari_296_gt3_23",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      damper: "40%",
      brakeBalance: "53% front / 47% rear",
      notes: "Technical high-speed circuit — moderate FFB for Eau Rouge kerbs.",
    },
  },
  {
    id: "starter_g923_fuji_jaguar",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "logitech_g923",
    carId: "jaguar_f_type_gt3",
    trackId: "fuji",
    tyreCompound: "M",
    bopOn: true,
    values: {
      forceFeedbackMaxTorque: 5,
      forceFeedbackSensitivity: 7,
      controllerSteeringSensitivity: 5,
      vibrationStrength: 4,
      brakeBalance: "51% front / 49% rear",
      notes: "High-speed Fuji layout — stable FFB for long corners.",
    },
  },
  {
    id: "starter_fanatec_dragon_aston",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "fanatec_gt_dd_pro",
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "dragon_trail_seaside",
    tyreCompound: "M",
    bopOn: true,
    values: {
      sen: 360,
      ff: 72,
      ffs: 100,
      ndp: 18,
      nfr: 14,
      nin: 8,
      int: 5,
      fei: 100,
      for: 100,
      spr: 52,
      dpr: 48,
      brf: 58,
      brakeBalance: "52% front / 48% rear",
      notes: "Technical seaside circuit — FR stability focus.",
    },
  },
  {
    id: "starter_t598_roadatlanta_ferrari296",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ferrari_296_gt3_23",
    trackId: "road_atlanta",
    tyreCompound: "S",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      brakeBalance: "54% front / 46% rear",
      notes: "Elevation changes — softer damper for compression sections.",
    },
  },
  {
    id: "starter_t598_monza_porsche",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "porsche_911_gt3_r_22",
    trackId: "monza",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      brakeBalance: "52% front / 48% rear",
      notes: "High-speed Monza — stable FFB for Parabolica and Ascari.",
    },
  },
  {
    id: "starter_t598_brands_jaguar",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "jaguar_f_type_gt3",
    trackId: "brands_hatch",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      damper: "40%",
      brakeBalance: "51% front / 49% rear",
      notes: "Undulating Brands layout — responsive rotation in sector two.",
    },
  },
  {
    id: "starter_t598_nurburgring_aston",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "nurburgring_gp",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      damper: "40%",
      brakeBalance: "52% front / 48% rear",
      notes: "Nürburgring GP — FR stability for Hatzenbach and Schwedenkreuz.",
    },
  },
  {
    id: "starter_t598_tsukuba_mercedes",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "mercedes_amg_gt3_20",
    trackId: "tsukuba",
    tyreCompound: "S",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      inertia: "Mid",
      brakeBalance: "50% front / 50% rear",
      notes: "Short Tsukuba circuit — sharp FFB for hairpin entries.",
    },
  },
  {
    id: "starter_t598_redbull_ferrari296",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ferrari_296_gt3_23",
    trackId: "red_bull_ring",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_BASE_VALUES,
      brakeBalance: "53% front / 47% rear",
      notes: "Elevation-heavy Red Bull Ring — MR rotation on climbs.",
    },
  },
  {
    id: "starter_g923_monza_mercedes",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "logitech_g923",
    carId: "mercedes_amg_gt3_20",
    trackId: "monza",
    tyreCompound: "M",
    bopOn: true,
    values: {
      forceFeedbackMaxTorque: 5,
      forceFeedbackSensitivity: 6,
      controllerSteeringSensitivity: 5,
      vibrationStrength: 4,
      brakeBalance: "52% front / 48% rear",
      notes: "Monza baseline for G923 — reduce torque if kerb hits spike.",
    },
  },
  {
    id: "starter_fanatec_suzuka_ferrari296",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "fanatec_gt_dd_pro",
    carId: "ferrari_296_gt3_23",
    trackId: "suzuka",
    tyreCompound: "M",
    bopOn: true,
    values: {
      sen: 360,
      ff: 74,
      ffs: 100,
      ndp: 20,
      nfr: 15,
      nin: 8,
      int: 5,
      fei: 100,
      for: 100,
      spr: 50,
      dpr: 50,
      brf: 60,
      brakeBalance: "53% front / 47% rear",
      notes: "Suzuka technical sections — MR traction through Spoon and 130R.",
    },
  },
  {
    id: "starter_moza_brands_genesis",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "moza_r5",
    carId: "genesis_x_gr3",
    trackId: "brands_hatch",
    tyreCompound: "M",
    bopOn: true,
    values: {
      steeringAngle: 900,
      roadSensitivity: 68,
      gameFfbIntensity: 72,
      maximumWheelSpeed: 100,
      wheelSpringStrength: 0,
      wheelDamper: 12,
      naturalInertia: 35,
      mechanicalFriction: 15,
      brakeBalance: "51% front / 49% rear",
      notes: "Brands Hatch GP — balanced road sensitivity for elevation changes.",
    },
  },
  // —— Gr.1 starter T598 profiles ——
  {
    id: "starter_t598_gr1_spa_ferrari499p",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ferrari_499p_23",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      notes:
        "Gr.1 starter — high-speed stability for Eau Rouge and Kemmel. Refine from testing.",
    },
  },
  {
    id: "starter_t598_gr1_lemans_toyota_gr010",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "toyota_gr010_hybrid_21",
    trackId: "le_mans",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      damper: "40%",
      notes:
        "Gr.1 starter — controlled damping for Le Mans kinks and long straights.",
    },
  },
  {
    id: "starter_t598_gr1_monza_porsche963",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "porsche_963_23",
    trackId: "monza",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      brakeBalance: "53% front / 47% rear",
      notes: "Gr.1 starter — Monza high-speed confidence with stable FFB.",
    },
  },
  // —— Gr.2 starter T598 profiles ——
  {
    id: "starter_t598_gr2_spa_porsche_rsr",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "porsche_911_rsr_gte_17",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      notes:
        "Gr.2 starter — sharp corner entry with stable traction through Pouhon.",
    },
  },
  {
    id: "starter_t598_gr2_monza_ferrari488gte",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ferrari_488_gte_evo_20",
    trackId: "monza",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      brakeBalance: "51% front / 49% rear",
      notes: "Gr.2 starter — balanced rotation for Ascari and Parabolica.",
    },
  },
  {
    id: "starter_t598_gr2_suzuka_bmw_m8gte",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "bmw_m8_gte_18",
    trackId: "suzuka",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      damper: "20%",
      notes: "Gr.2 starter — strong braking stability through Spoon and 130R.",
    },
  },
  {
    id: "starter_t598_gr1_spa_peugeot9x8",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "peugeot_9x8_22",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      notes: "Gr.1 starter profile — Peugeot 9X8 high-speed stability baseline.",
    },
  },
  {
    id: "starter_t598_gr1_spa_cadillac_vseries",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "cadillac_vseries_r_23",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      brakeBalance: "53% front / 47% rear",
      notes: "Gr.1 starter profile — Cadillac V-Series.R stable braking reference.",
    },
  },
  {
    id: "starter_t598_gr1_suzuka_toyota_ts030",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "toyota_ts030_hybrid_12",
    trackId: "suzuka",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      damper: "20%",
      notes: "Gr.1 starter profile — TS030 technical circuit baseline.",
    },
  },
  {
    id: "starter_t598_gr1_spa_audi_r18",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "audi_r18_16",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR1_STARTER,
      notes: "Gr.1 starter profile — Audi R18 endurance stability baseline.",
    },
  },
  {
    id: "starter_t598_gr2_spa_corvette_c8r",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "chevrolet_corvette_c8_r_20",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      notes: "Gr.2 starter profile — Corvette C8.R corner-entry baseline.",
    },
  },
  {
    id: "starter_t598_gr2_brands_aston_vantage_gte",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "aston_martin_vantage_amr_gte_18",
    trackId: "brands_hatch",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      brakeBalance: "51% front / 49% rear",
      notes: "Gr.2 starter profile — Aston Martin Vantage GTE rotation baseline.",
    },
  },
  {
    id: "starter_t598_gr2_spa_ford_gt_gte",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "ford_gt_gte_17",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR2_STARTER,
      damper: "20%",
      notes: "Gr.2 starter profile — Ford GT GTE high-speed baseline.",
    },
  },
  // —— Gr.4 starter T598 profiles ——
  {
    id: "starter_t598_gr4_brands_cayman_gt4",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "porsche_cayman_gt4_clubsport_gr4",
    trackId: "brands_hatch",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR4_STARTER,
      notes:
        "Gr.4 starter — forgiving traction for undulating Brands Hatch sectors.",
    },
  },
  {
    id: "starter_t598_gr4_sardegna_citroen_gr4",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "gt_by_citroen_gr4",
    trackId: "sardegna_road_track_b",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR4_STARTER,
      notes: "Gr.4 starter — smooth inputs for Sardegna B linked corners.",
    },
  },
  {
    id: "starter_t598_gr4_monza_genesis_g70",
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "genesis_g70_gr4",
    trackId: "monza",
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...T598_GR4_STARTER,
      friction: "Mid",
      notes: "Gr.4 starter — lower snappiness for Monza kerb stability.",
    },
  },
];

/** @type {Record<string, string>} */
const DEFAULT_TRACK_BY_CLASS = {
  "Gr.1": "spa",
  "Gr.2": "spa",
  "Gr.3": "suzuka",
  "Gr.4": "brands_hatch",
};

/** @type {Record<string, Record<string, string>>} */
const T598_CLASS_STARTERS = {
  "Gr.1": T598_GR1_STARTER,
  "Gr.2": T598_GR2_STARTER,
  "Gr.3": T598_GR3_STARTER,
  "Gr.4": T598_GR4_STARTER,
};

/**
 * @param {string} carId
 * @param {"Gr.1" | "Gr.2" | "Gr.3" | "Gr.4"} carClass
 * @param {string} [trackId]
 * @returns {WheelSetupRecord}
 */
function createT598ClassStarter(carId, carClass, trackId) {
  const template = T598_CLASS_STARTERS[carClass] ?? T598_BASE_VALUES;
  const resolvedTrack = trackId ?? DEFAULT_TRACK_BY_CLASS[carClass] ?? "spa";

  return {
    id: `starter_t598_auto_${carId}`,
    label: STARTER_SETUP_LABEL,
    isStarter: true,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId,
    trackId: resolvedTrack,
    tyreCompound: "M",
    bopOn: true,
    values: {
      ...template,
      notes: `${carClass} starter profile — untested T598 baseline. Refine after track testing.`,
    },
  };
}

const T598_COVERED_CAR_IDS = new Set(
  BASE_STARTER_WHEEL_SETUPS.filter(
    (setup) =>
      setup.gameVersion === "gt7" && setup.wheelBase === "thrustmaster_t598",
  ).map((setup) => setup.carId),
);

/** Auto T598 starters for every Gr.1–Gr.4 car without a manual profile. */
const AUTO_T598_STARTERS = gt7Cars
  .filter(
    (car) =>
      ["Gr.1", "Gr.2", "Gr.3", "Gr.4"].includes(car.class) &&
      !T598_COVERED_CAR_IDS.has(car.id),
  )
  .map((car) => createT598ClassStarter(car.id, car.class));

/** @type {WheelSetupRecord[]} */
export const STARTER_WHEEL_SETUPS = [
  ...BASE_STARTER_WHEEL_SETUPS,
  ...AUTO_T598_STARTERS,
];

/** Validated profiles take priority over starter entries in lookup. */
export const WHEEL_SETUP_POOL = [
  ...T598_VALIDATED_PROFILES,
  ...STARTER_WHEEL_SETUPS,
];
