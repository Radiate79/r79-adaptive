import { STARTER_SETUP_LABEL } from "./wheelSetupsMeta.js";

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
export const STARTER_WHEEL_SETUPS = [
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
      ffb: 75,
      master: 100,
      mode: 3,
      inertia: 4,
      friction: 2,
      boostLow: 0,
      boostHigh: 0,
      speed: 5,
      damper: 3,
      damperGain: 100,
      spring: 0,
      gearJolt: 2,
      endStop: 4,
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
];
