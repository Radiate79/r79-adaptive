/**
 * Stage B — Translate desired steering behaviour into device-specific settings.
 * Each wheel base has its own mapping. Never copy T598 menus onto other brands.
 */

import { getT598OptionsForField } from "../data/wheelBases.js";
import { sanitizeWheelValues } from "./wheelSchemaValidation.js";

/**
 * @typedef {import("./wheelDesiredBehaviour.js").DesiredSteeringBehaviour} DesiredSteeringBehaviour
 */

/**
 * @param {string[]} options
 * @param {number} continuous
 */
function continuousToEnum(options, continuous) {
  const index = Math.round(continuous * (options.length - 1));
  return options[Math.max(0, Math.min(options.length - 1, index))];
}

/**
 * @param {number} continuous
 * @param {number} step
 */
function continuousToPercent(continuous, step = 5) {
  const percent = Math.round((continuous * 100) / step) * step;
  return `${Math.min(100, Math.max(0, percent))}%`;
}

/**
 * @param {number} continuous
 * @param {number} min
 * @param {number} max
 */
function continuousToInt(continuous, min, max) {
  return Math.round(min + continuous * (max - min));
}

/**
 * T598 translation from balanced desired behaviour.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchorValues]
 * @param {number} [anchorWeight] model dominance 0–1 (high = trust model)
 */
export function translateDesiredToT598(desired, anchorValues = {}, anchorWeight = 0.85) {
  const options = {
    ffb: getT598OptionsForField("ffb"),
    mode: getT598OptionsForField("mode"),
    inertia: getT598OptionsForField("inertia"),
    friction: getT598OptionsForField("friction"),
    boostLow: getT598OptionsForField("boostLow"),
    boostHigh: getT598OptionsForField("boostHigh"),
    speed: getT598OptionsForField("speed"),
    damperGain: getT598OptionsForField("damperGain"),
    gearJolt: getT598OptionsForField("gearJolt"),
    endStop: getT598OptionsForField("endStop"),
  };

  // Continuous field targets derived from desired behaviour
  const continuous = {
    // Prefer FFB 2–3 for performance cars; D/1 reserved for very low force demand
    ffb: clamp(0.45 + desired.steeringForceTarget * 0.45 + desired.responseTarget * 0.1),
    master: clamp(
      0.55 +
        desired.steeringForceTarget * 0.35 +
        desired.highForceControlTarget * 0.15 -
        (1 - desired.responseTarget) * 0.08,
    ),
    // Mode: more E when rotation/response high; more P/S when stability dominates
    mode: clamp(
      0.35 +
        desired.rotationSpeedTarget * 0.4 +
        desired.responseTarget * 0.25 -
        desired.stabilityTarget * 0.2,
    ),
    inertia: clamp(desired.inertiaTarget),
    friction: clamp(desired.frictionTarget),
    boostLow: clamp(0.45 + (desired.lowForceDetailTarget - 0.5) * 0.9),
    boostHigh: clamp(0.45 + (desired.highForceControlTarget - 0.5) * 0.8),
    speed: clamp(
      0.35 + desired.rotationSpeedTarget * 0.45 + desired.directionChangeSpeed * 0.25,
    ),
    damper: clamp(desired.dampingTarget),
    damperGain: clamp(
      0.4 + desired.oscillationControlTarget * 0.35 - desired.dampingTarget * 0.15,
    ),
    spring: clamp(Math.min(0.12, desired.returnToCentreTarget * 0.35)),
    endStop: clamp(
      0.35 + desired.stabilityTarget * 0.25 + desired.oscillationControlTarget * 0.2,
    ),
    gearJolt: 0.55,
  };

  /** @type {Record<string, string | number>} */
  const modelValues = {
    ffb: continuousToEnum(options.ffb, continuous.ffb),
    master: continuousToPercent(continuous.master, 5),
    mode: continuousToEnum(options.mode, continuous.mode),
    inertia: continuousToEnum(options.inertia, continuous.inertia),
    friction: continuousToEnum(options.friction, continuous.friction),
    boostLow: continuousToEnum(options.boostLow, continuous.boostLow),
    boostHigh: continuousToEnum(options.boostHigh, continuous.boostHigh),
    speed: continuousToEnum(options.speed, continuous.speed),
    damper: continuousToPercent(continuous.damper, 10),
    damperGain: continuousToEnum(options.damperGain, continuous.damperGain),
    spring: continuousToPercent(continuous.spring, 5),
    gearJolt: continuousToEnum(options.gearJolt, continuous.gearJolt),
    endStop: continuousToEnum(options.endStop, continuous.endStop),
  };

  // Light anchor blend only for fields present on exact/validated setups
  const weight = Math.min(1, Math.max(0, anchorWeight));
  if (weight < 0.95 && Object.keys(anchorValues).length) {
    for (const key of Object.keys(modelValues)) {
      if (anchorValues[key] == null || key === "notes" || key === "brakeBalance") {
        continue;
      }
      // Only blend when anchor weight is meaningful AND field is continuous-ish
      // Prefer model for class anchors (weight already low from caller)
      if (weight > 0.55) {
        // Keep model dominant; optional soft pull toward exact validated
        // Already model-first via high weight semantics in caller
      }
    }
  }

  // Preserve brakeBalance / notes from anchor if present
  if (anchorValues.brakeBalance != null) {
    modelValues.brakeBalance = anchorValues.brakeBalance;
  }
  if (anchorValues.notes != null) {
    modelValues.notes = anchorValues.notes;
  }

  return { values: modelValues, continuous };
}

/**
 * Fanatec Tuning Menu translation.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchor]
 */
export function translateDesiredToFanatec(desired, anchor = {}) {
  return {
    sen: continuousToInt(0.15 + desired.responseTarget * 0.25, 360, 1080),
    ff: continuousToInt(desired.steeringForceTarget, 55, 100),
    ffs: continuousToInt(desired.highForceControlTarget, 40, 100),
    ndp: continuousToInt(desired.dampingTarget, 10, 55),
    nfr: continuousToInt(desired.frictionTarget, 0, 40),
    nin: continuousToInt(desired.inertiaTarget, 0, 45),
    int: continuousToInt(desired.lowForceDetailTarget, 2, 12),
    fei: continuousToInt(desired.lowForceDetailTarget, 40, 100),
    for: continuousToInt(desired.steeringForceTarget, 50, 100),
    spr: continuousToInt(desired.returnToCentreTarget, 0, 30),
    dpr: continuousToInt(desired.dampingTarget, 10, 50),
    ful: 100,
    brf: continuousToInt(0.5 + desired.entryConfidence * 0.3, 40, 80),
    brakeBalance: anchor.brakeBalance ?? "52% front / 48% rear",
    notes:
      anchor.notes ??
      "Calculated from shared R79 desired-behaviour targets for Fanatec Tuning Menu.",
  };
}

/**
 * Moza translation.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchor]
 */
export function translateDesiredToMoza(desired, anchor = {}) {
  return {
    steeringAngle: continuousToInt(0.2 + desired.responseTarget * 0.2, 360, 1080),
    roadSensitivity: continuousToInt(desired.lowForceDetailTarget, 40, 100),
    gameFfbIntensity: continuousToInt(desired.steeringForceTarget, 55, 100),
    maximumWheelSpeed: continuousToInt(desired.directionChangeSpeed, 40, 100),
    wheelSpringStrength: continuousToInt(desired.returnToCentreTarget, 0, 25),
    wheelDamper: continuousToInt(desired.dampingTarget, 10, 50),
    naturalInertia: continuousToInt(desired.inertiaTarget, 50, 150),
    mechanicalFriction: continuousToInt(desired.frictionTarget, 0, 40),
    brakeBalance: anchor.brakeBalance ?? "52% front / 48% rear",
    notes:
      anchor.notes ??
      "Calculated from shared R79 desired-behaviour targets for Moza.",
  };
}

/**
 * Logitech G923 translation.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchor]
 */
export function translateDesiredToLogitechG923(desired, anchor = {}) {
  return {
    forceFeedbackMaxTorque: continuousToInt(desired.steeringForceTarget, 4, 10),
    forceFeedbackSensitivity: continuousToInt(desired.responseTarget, 4, 10),
    controllerSteeringSensitivity: continuousToInt(desired.rotationSpeedTarget, 4, 10),
    vibrationStrength: continuousToInt(desired.lowForceDetailTarget, 2, 8),
    brakeBalance: anchor.brakeBalance ?? "52% front / 48% rear",
    notes:
      anchor.notes ??
      "Calculated from shared R79 desired-behaviour targets for Logitech G923.",
  };
}

/**
 * Logitech G Pro / RS50 shared TrueForce-style mapping.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchor]
 */
export function translateDesiredToLogitechTrueforce(desired, anchor = {}) {
  return {
    trueforceAudio: continuousToInt(desired.lowForceDetailTarget, 20, 80),
    trueforceStrength: continuousToInt(desired.lowForceDetailTarget, 30, 90),
    ffbStrength: continuousToInt(desired.steeringForceTarget, 5, 10),
    filter: continuousToInt(desired.oscillationControlTarget, 1, 7),
    dampener: continuousToInt(desired.dampingTarget, 1, 6),
    angle: continuousToInt(0.2 + desired.responseTarget * 0.2, 360, 1080),
    brakeForce: continuousToInt(0.5 + desired.entryConfidence * 0.3, 4, 9),
    brakeBalance: anchor.brakeBalance ?? "52% front / 48% rear",
    notes:
      anchor.notes ??
      "Calculated from shared R79 desired-behaviour targets for Logitech TrueForce wheel.",
  };
}

/**
 * Other / Custom — minimal guidance only.
 * @param {DesiredSteeringBehaviour} desired
 * @param {Record<string, string | number>} [anchor]
 */
export function translateDesiredToOther(desired, anchor = {}) {
  return {
    brakeBalance: anchor.brakeBalance ?? "52% front / 48% rear",
    notes:
      anchor.notes ??
      `R79 behaviour targets — response ${pct(desired.responseTarget)}, stability ${pct(desired.stabilityTarget)}, damping ${pct(desired.dampingTarget)}. Map manually to your wheel software.`,
  };
}

/**
 * Master device translator.
 *
 * @param {string} templateFamily
 * @param {DesiredSteeringBehaviour} desired
 * @param {{
 *   wheelBaseId: string,
 *   anchorValues?: Record<string, string | number>,
 *   anchorWeight?: number,
 * }} options
 */
export function translateDesiredBehaviourToDevice(templateFamily, desired, options) {
  const anchor = options.anchorValues ?? {};
  let raw;

  switch (templateFamily) {
    case "t598": {
      const translated = translateDesiredToT598(desired, anchor, options.anchorWeight ?? 0.85);
      raw = translated.values;
      return {
        values: sanitizeWheelValues(options.wheelBaseId, raw),
        continuous: translated.continuous,
        family: templateFamily,
      };
    }
    case "fanatec":
      raw = translateDesiredToFanatec(desired, anchor);
      break;
    case "moza":
      raw = translateDesiredToMoza(desired, anchor);
      break;
    case "logitech_g923":
      raw = translateDesiredToLogitechG923(desired, anchor);
      break;
    case "logitech_g_pro":
    case "logitech_rs50":
      raw = translateDesiredToLogitechTrueforce(desired, anchor);
      break;
    default:
      raw = translateDesiredToOther(desired, anchor);
      break;
  }

  return {
    values: sanitizeWheelValues(options.wheelBaseId, raw),
    continuous: null,
    family: templateFamily,
  };
}

/**
 * @param {number} value
 */
function clamp(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

/**
 * @param {number} value
 */
function pct(value) {
  return `${Math.round(clamp(value) * 100)}%`;
}
