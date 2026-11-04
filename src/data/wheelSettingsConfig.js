import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  R79_PHYSICS_LAST_VALIDATION,
} from "./gt7PhysicsVersion.js";

/** Authoritative Wheel Settings engine generation — bump when calculation logic changes. */
export const WHEEL_SETTINGS_ENGINE_VERSION = "5";

/**
 * Independence note (authoritative):
 * Wheel recommendations are calculated from R79 physics/car/track/device evidence only.
 * External assistants are not targets. Numerical disagreement with them is acceptable.
 */

/** Car / track / device profile data stamps — invalidate cache when these change. */
export const WHEEL_CAR_PROFILE_VERSION = "5";
export const WHEEL_TRACK_PROFILE_VERSION = "5";
export const WHEEL_DEVICE_PROFILE_VERSION = "5";

/** Active T598 firmware baseline for R79 wheel recommendations. */
export const ACTIVE_T598_FIRMWARE = "3.08";

/**
 * Game-side T598 FFB calibration stamp after GT7 1.72 official FFB revision.
 * Recalibration goes through the desired-behaviour model — not a fake numeric conversion.
 */
export const T598_FFB_CALIBRATION_VERSION = "1.72";

/** @type {{ gameVersion: string, physicsGeneration: string, updateDate: string, t598FfbCalibrationVersion: string }} */
export const WHEEL_SETTINGS_PLATFORM_BASELINE = {
  gameVersion: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  updateDate: R79_PHYSICS_LAST_VALIDATION,
  t598FfbCalibrationVersion: T598_FFB_CALIBRATION_VERSION,
};

/**
 * GT7 1.71_PLUS physics emphasis factors for wheel-settings weighting.
 * These adjust model sensitivity — they do not replace car/track data
 * and do not invent official FFB conversion coefficients.
 */
export const GT7_171_PLUS_PHYSICS_EMPHASIS = {
  /** Revised slip simulation — slightly higher detail/readability weight. */
  tyreSlipDetail: 1.07,
  /** Revised wear/heating — long-stint tyre preservation weight. */
  tyreWearStint: 1.08,
  /** Revised kerb/off-track behaviour — kerb-load damping weight. */
  kerbLoad: 1.06,
  /** Revised damper/suspension — stability damping weight. */
  suspensionDamping: 1.05,
  /** Steering geometry per car — car rotation/trait weight unchanged in source data. */
  steeringGeometry: 1.0,
  /** Prefer useful feedback over artificial resistance after 1.72 FFB revisions. */
  resistanceDiscipline: 1.04,
};

/** @deprecated Use GT7_171_PLUS_PHYSICS_EMPHASIS */
export const GT7_171_PHYSICS_EMPHASIS = GT7_171_PLUS_PHYSICS_EMPHASIS;

/**
 * Relative grip index for tyre compounds (0–1). Used only where grip affects FFB load.
 * @type {Record<string, number>}
 */
export const TYRE_COMPOUND_GRIP_INDEX = {
  S: 1.0,
  M: 0.88,
  H: 0.74,
  IM: 0.62,
  W: 0.55,
};

/**
 * Anchor blend weight by lookup match tier.
 * Higher = trust stored setup values more; lower = model dominates.
 * @type {Record<string, number>}
 */
export const SETUP_ANCHOR_WEIGHTS = {
  validated: 0.35,
  exact: 0.55,
  validatedSimilar: 0.28,
  similar: 0.4,
  validatedCarTrack: 0.3,
  carTrack: 0.35,
  // Class-cloned "validated" profiles must NOT dominate — treat as soft anchors
  validatedCarOnly: 0.12,
  carOnly: 0.18,
  validatedClass: 0.08,
  classStarter: 0.06,
  validatedWheelOnly: 0.04,
  wheelOnly: 0.04,
  validatedWheelFamily: 0.03,
  wheelFamily: 0.03,
  none: 0,
};

/**
 * Documented continuous-space weights per T598 field.
 * Keys reference normalized trait names in car/track/race contexts.
 * @type {Record<string, Record<string, number>>}
 */
export const T598_FIELD_WEIGHTS = {
  ffb: {
    carRotation: 0.35,
    carDetail: 0.25,
    trackSteeringLoad: 0.2,
    tyreGrip: 0.12,
    physicsDetail: 0.08,
  },
  master: {
    carStability: 0.28,
    trackLoad: 0.22,
    tyreGrip: 0.18,
    raceFatigue: -0.12,
    carRotation: -0.14,
    clippingRisk: -0.18,
  },
  mode: {
    carRotation: 0.38,
    trackRotationNeed: 0.28,
    carStability: -0.22,
    raceSprint: 0.18,
    raceEndurance: -0.14,
  },
  inertia: {
    trackHighSpeed: 0.3,
    carStability: 0.26,
    carRotation: -0.24,
    trackKerb: 0.12,
    raceConsistency: 0.14,
  },
  friction: {
    carStability: 0.32,
    trackKerb: 0.18,
    carRotation: -0.16,
    raceConsistency: 0.16,
    physicsDetail: 0.06,
  },
  boostLow: {
    trackKerb: 0.34,
    trackDetail: 0.28,
    tyreGrip: -0.12,
    carTraction: 0.14,
  },
  boostHigh: {
    trackLoad: 0.26,
    carTopSpeed: 0.22,
    carRotation: 0.14,
    clippingRisk: -0.24,
  },
  speed: {
    carRotation: 0.3,
    trackRotationNeed: 0.26,
    trackTechnical: 0.18,
    carStability: -0.2,
    raceSprint: 0.12,
  },
  damper: {
    carStability: 0.24,
    trackKerb: 0.22,
    trackLoad: 0.18,
    carRotation: -0.2,
    raceTyreWear: 0.18,
    physicsDamping: 0.08,
  },
  damperGain: {
    carStability: 0.28,
    trackLoad: 0.22,
    raceTyreWear: -0.2,
    carRotation: -0.16,
  },
  spring: {
    carStability: 0.2,
    trackLoad: 0.12,
    defaultLow: -0.35,
  },
  endStop: {
    trackHighSpeed: 0.28,
    trackKerb: 0.24,
    carStability: 0.22,
    raceSprint: -0.1,
  },
};

/** Minimum trait completeness (0–1) before class-only fallback confidence cap applies. */
export const CAR_PROFILE_MIN_CONFIDENCE_COMPLETENESS = 0.45;
