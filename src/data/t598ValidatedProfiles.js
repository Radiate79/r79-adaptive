import { cars as gt7Cars } from "./gt7/cars.js";
import { INTELLIGENCE_UPDATE_DATE } from "./t598FieldHelp.js";

/** Latest tested T598 values — primary source for validated profiles. */
export const T598_VALIDATED_BASE = {
  ffb: "3",
  master: "100%",
  mode: "E",
  inertia: "Mid",
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

/** @type {Record<string, Record<string, string>>} */
export const T598_VALIDATED_CLASS_OVERRIDES = {
  "Gr.1": {
    inertia: "High",
    damper: "35%",
    speed: "High",
    brakeBalance: "54% front / 46% rear",
  },
  "Gr.2": {
    inertia: "Mid",
    damper: "30%",
    brakeBalance: "52% front / 48% rear",
  },
  "Gr.3": {
    inertia: "Mid",
    damper: "20%",
    brakeBalance: "52% front / 48% rear",
  },
  "Gr.4": {
    inertia: "Mid",
    friction: "Low",
    damper: "25%",
    speed: "Mid",
    brakeBalance: "51% front / 49% rear",
  },
};

/** @type {Record<string, string>} */
const DEFAULT_TRACK_BY_CLASS = {
  "Gr.1": "spa",
  "Gr.2": "spa",
  "Gr.3": "suzuka",
  "Gr.4": "brands_hatch",
};

/**
 * @param {string} carClass
 * @returns {Record<string, string>}
 */
export function getValidatedT598ValuesForClass(carClass) {
  return {
    ...T598_VALIDATED_BASE,
    ...(T598_VALIDATED_CLASS_OVERRIDES[carClass] ?? {}),
  };
}

/**
 * @typedef {Object} ValidatedWheelSetupRecord
 * @property {string} id
 * @property {string} label
 * @property {boolean} isStarter
 * @property {boolean} isValidated
 * @property {string} lastUpdated
 * @property {import("./gameVersions.js").GameVersion} gameVersion
 * @property {string} wheelBase
 * @property {string} carId
 * @property {string} trackId
 * @property {string} tyreCompound
 * @property {boolean} bopOn
 * @property {Record<string, string | number>} values
 */

/**
 * @param {string} carId
 * @param {string} carClass
 * @param {string} [trackId]
 * @returns {ValidatedWheelSetupRecord}
 */
function createValidatedT598Profile(carId, carClass, trackId) {
  const resolvedTrack = trackId ?? DEFAULT_TRACK_BY_CLASS[carClass] ?? "spa";

  return {
    id: `validated_t598_${carId}`,
    label: "Validated profile",
    isStarter: false,
    isValidated: true,
    lastUpdated: INTELLIGENCE_UPDATE_DATE,
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId,
    trackId: resolvedTrack,
    tyreCompound: "M",
    bopOn: true,
    values: getValidatedT598ValuesForClass(carClass),
  };
}

/** Validated T598 profile for every Gr.1–Gr.4 car in the database. */
export const T598_VALIDATED_PROFILES = gt7Cars
  .filter((car) =>
    ["Gr.1", "Gr.2", "Gr.3", "Gr.4"].includes(car.class),
  )
  .map((car) => createValidatedT598Profile(car.id, car.class));
