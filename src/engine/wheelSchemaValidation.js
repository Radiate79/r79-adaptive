/**
 * Per-wheel-base recommendation schema safety.
 *
 * Legal controls come from WHEEL_TEMPLATE_FIELDS.
 * Legal T598 values come from T598_OPTION_RANGES (in-game menu).
 * Other families use numeric bounds consistent with stored R79 setup values —
 * never T598 menus on Logitech / Fanatec / Moza.
 */

import {
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
  getT598OptionsForField,
  T598_OPTION_RANGES,
} from "../data/wheelBases.js";

const T598_ENUM_ALIASES = {
  off: "Off",
  mid: "Mid",
  high: "High",
  low: "Low",
  extreme: "Extreme",
  ext: "Extreme",
  medium: "Medium",
  d: "D",
  b: "B",
  s: "S",
  p: "P",
  e: "E",
};

const T598_PERCENT_STEPS = {
  master: 5,
  damper: 10,
  spring: 5,
};

/**
 * Numeric bounds derived from existing R79 setup value types (not T598 menus).
 * Percentage-style fields stay 0–100. Logitech torque/sensitivity stay 1–10,
 * matching podiumEngine clamps already in use. Angle/SEN use observed GT7 lock.
 *
 * @type {Record<string, Record<string, { min: number, max: number, integer?: boolean }>>}
 */
const FAMILY_NUMERIC_BOUNDS = {
  logitech_g923: {
    forceFeedbackMaxTorque: { min: 1, max: 10, integer: true },
    forceFeedbackSensitivity: { min: 1, max: 10, integer: true },
    controllerSteeringSensitivity: { min: 1, max: 10, integer: true },
    vibrationStrength: { min: 1, max: 10, integer: true },
  },
  logitech_g_pro: {
    trueforceAudio: { min: 0, max: 100, integer: true },
    trueforceStrength: { min: 0, max: 100, integer: true },
    ffbStrength: { min: 1, max: 10, integer: true },
    filter: { min: 0, max: 10, integer: true },
    dampener: { min: 0, max: 10, integer: true },
    angle: { min: 180, max: 1080, integer: true },
    brakeForce: { min: 1, max: 10, integer: true },
  },
  logitech_rs50: {
    trueforceAudio: { min: 0, max: 100, integer: true },
    trueforceStrength: { min: 0, max: 100, integer: true },
    ffbStrength: { min: 1, max: 10, integer: true },
    filter: { min: 0, max: 10, integer: true },
    dampener: { min: 0, max: 10, integer: true },
    angle: { min: 180, max: 1080, integer: true },
    brakeForce: { min: 1, max: 10, integer: true },
  },
  fanatec: {
    sen: { min: 360, max: 2520, integer: true },
    ff: { min: 0, max: 100, integer: true },
    ffs: { min: 0, max: 100, integer: true },
    ndp: { min: 0, max: 100, integer: true },
    nfr: { min: 0, max: 100, integer: true },
    nin: { min: 0, max: 100, integer: true },
    int: { min: 0, max: 20, integer: true },
    fei: { min: 0, max: 100, integer: true },
    for: { min: 0, max: 100, integer: true },
    spr: { min: 0, max: 100, integer: true },
    dpr: { min: 0, max: 100, integer: true },
    ful: { min: 0, max: 100, integer: true },
    brf: { min: 0, max: 100, integer: true },
  },
  moza: {
    steeringAngle: { min: 180, max: 1080, integer: true },
    roadSensitivity: { min: 0, max: 100, integer: true },
    gameFfbIntensity: { min: 0, max: 100, integer: true },
    maximumWheelSpeed: { min: 0, max: 100, integer: true },
    wheelSpringStrength: { min: 0, max: 100, integer: true },
    wheelDamper: { min: 0, max: 100, integer: true },
    naturalInertia: { min: 0, max: 100, integer: true },
    mechanicalFriction: { min: 0, max: 100, integer: true },
  },
};

const FREE_TEXT_KEYS = new Set(["notes", "brakeBalance"]);

function isEmptyValue(value) {
  return value == null || value === "" || value === "—";
}

function parseNumeric(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const match = String(value).trim().match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function clampNumeric(value, min, max, integer) {
  let next = Math.min(max, Math.max(min, value));
  if (integer) {
    next = Math.round(next);
  }
  return next;
}

/**
 * @param {string} fieldKey
 * @param {string | number} value
 */
export function sanitizeT598Value(fieldKey, value) {
  if (isEmptyValue(value) || FREE_TEXT_KEYS.has(fieldKey)) {
    return value;
  }

  const options = getT598OptionsForField(fieldKey);
  if (!options) {
    return value;
  }

  const raw = String(value).trim();

  const percentStep = T598_PERCENT_STEPS[fieldKey];
  if (percentStep) {
    const numeric = parseNumeric(raw);
    if (numeric == null) {
      return options[0];
    }
    const snapped = clampNumeric(
      Math.round(numeric / percentStep) * percentStep,
      0,
      100,
      true,
    );
    return `${snapped}%`;
  }

  const exact = options.find((option) => option === raw);
  if (exact) {
    return exact;
  }

  const caseMatch = options.find(
    (option) => option.toLowerCase() === raw.toLowerCase(),
  );
  if (caseMatch) {
    return caseMatch;
  }

  const aliasKey = raw.replace(/^\+/, "").toLowerCase();
  const aliased = T598_ENUM_ALIASES[raw.toLowerCase()] ?? T598_ENUM_ALIASES[aliasKey];
  if (aliased) {
    const aliasMatch = options.find(
      (option) => option.toLowerCase() === aliased.toLowerCase(),
    );
    if (aliasMatch) {
      return aliasMatch;
    }
  }

  if (fieldKey === "boostLow" || fieldKey === "boostHigh") {
    const numeric = parseNumeric(raw);
    if (numeric != null) {
      const signed =
        numeric > 0 ? `+${numeric}` : numeric === 0 ? "0" : String(numeric);
      if (options.includes(signed)) {
        return signed;
      }
    }
  }

  if (options.includes(raw.toUpperCase())) {
    return raw.toUpperCase();
  }

  return options.includes(raw) ? raw : options[Math.floor(options.length / 2)];
}

/**
 * @param {string} family
 * @param {string} fieldKey
 * @param {string | number} value
 */
export function sanitizeWheelFieldValue(family, fieldKey, value) {
  if (isEmptyValue(value)) {
    return "—";
  }

  if (FREE_TEXT_KEYS.has(fieldKey)) {
    return value;
  }

  if (family === "t598") {
    return sanitizeT598Value(fieldKey, value);
  }

  const bounds = FAMILY_NUMERIC_BOUNDS[family]?.[fieldKey];
  if (!bounds) {
    return value;
  }

  const numeric = parseNumeric(value);
  if (numeric == null || Number.isNaN(numeric)) {
    return "—";
  }

  return clampNumeric(numeric, bounds.min, bounds.max, bounds.integer !== false);
}

/**
 * Keep only the selected wheel base's template keys.
 * Prevents T598 (or any other family) controls leaking onto another device.
 *
 * @param {string} wheelBaseId
 * @param {Record<string, string | number>} [values]
 */
export function filterValuesToWheelTemplate(wheelBaseId, values = {}) {
  const fields = getTemplateFieldsForWheelBase(wheelBaseId);
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  /** @type {Record<string, string | number>} */
  const filtered = {};

  for (const field of fields) {
    if (!(field.key in values) || isEmptyValue(values[field.key])) {
      continue;
    }
    filtered[field.key] = sanitizeWheelFieldValue(
      family,
      field.key,
      values[field.key],
    );
  }

  return filtered;
}

/**
 * @param {string} wheelBaseId
 * @param {Record<string, string | number>} [values]
 */
export function sanitizeWheelValues(wheelBaseId, values = {}) {
  return filterValuesToWheelTemplate(wheelBaseId, values);
}

/**
 * @param {string} family
 * @param {string} fieldKey
 * @param {string | number} value
 */
export function isLegalWheelFieldValue(family, fieldKey, value) {
  if (isEmptyValue(value) || FREE_TEXT_KEYS.has(fieldKey)) {
    return true;
  }

  if (Number.isNaN(value) || value === "NaN" || value === Infinity) {
    return false;
  }

  if (family === "t598") {
    const options = getT598OptionsForField(fieldKey);
    if (!options) {
      return true;
    }
    return options.includes(String(value));
  }

  const bounds = FAMILY_NUMERIC_BOUNDS[family]?.[fieldKey];
  if (!bounds) {
    return true;
  }

  const numeric = parseNumeric(value);
  if (numeric == null) {
    return false;
  }

  if (numeric < bounds.min || numeric > bounds.max) {
    return false;
  }

  if (bounds.integer && !Number.isInteger(numeric)) {
    return false;
  }

  return true;
}

/**
 * @param {string} wheelBaseId
 * @param {{ key: string, value: string | number }[]} rows
 */
export function findIllegalPresentationRows(wheelBaseId, rows) {
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  const allowedKeys = new Set(
    getTemplateFieldsForWheelBase(wheelBaseId).map((field) => field.key),
  );
  const issues = [];

  for (const row of rows) {
    if (!allowedKeys.has(row.key)) {
      issues.push({
        key: row.key,
        value: row.value,
        reason: "field not in selected wheel schema",
      });
      continue;
    }

    if (
      row.value !== "—" &&
      (row.value == null ||
        Number.isNaN(row.value) ||
        String(row.value) === "undefined")
    ) {
      issues.push({
        key: row.key,
        value: row.value,
        reason: "undefined or NaN value",
      });
      continue;
    }

    if (!isLegalWheelFieldValue(family, row.key, row.value)) {
      issues.push({
        key: row.key,
        value: row.value,
        reason: "value outside device schema",
      });
    }
  }

  return issues;
}

export { T598_OPTION_RANGES, FAMILY_NUMERIC_BOUNDS };
