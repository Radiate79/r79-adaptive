/**
 * Normalized car capability vector for GT7 1.71_PLUS / 1.72 recommendations.
 * Prefer absolute current measured values. Deltas vs prior patches are historical only.
 */

import { resolveGr3Measurable } from "../data/gr3MediumBop172.js";
import { resolveCarDynamicsProfile } from "./carDynamicsProfile.js";
import { resolveBopCategoryForClass } from "../data/bopProfileModel.js";

/**
 * @typedef {Object} CapabilityField
 * @property {number | null} value 0–1 normalized, or null if unknown
 * @property {'measured' | 'derived' | 'unknown'} origin
 */

/**
 * @typedef {Object} CarCapabilityVector
 * @property {string} carId
 * @property {string} carClass
 * @property {string} bopCategory
 * @property {Record<string, CapabilityField>} capabilities
 * @property {number} completeness 0–1
 * @property {string[]} missingFields
 */

/**
 * @param {number | null | undefined} value
 * @param {number} [fallback]
 * @returns {number | null}
 */
function clamp01(value, fallback) {
  if (value == null || !Number.isFinite(Number(value))) {
    return fallback == null ? null : fallback;
  }
  return Math.min(1, Math.max(0, Number(value)));
}

/**
 * Map a higher-is-better field against a reference band into 0–1.
 * @param {number | null | undefined} value
 * @param {number} low
 * @param {number} high
 */
function scaleBand(value, low, high) {
  if (!Number.isFinite(Number(value)) || high <= low) {
    return null;
  }
  return clamp01((Number(value) - low) / (high - low));
}

/**
 * Invert a time-like field (lower is better) into 0–1.
 * @param {number | null | undefined} value
 * @param {number} best
 * @param {number} worst
 */
function scaleTime(value, best, worst) {
  if (!Number.isFinite(Number(value)) || worst <= best) {
    return null;
  }
  return clamp01((worst - Number(value)) / (worst - best));
}

/**
 * Build a capability vector from measurable BoP + dynamics traits.
 * Does not fabricate missing measurements.
 *
 * @param {{
 *   carId: string,
 *   gameVersion?: string,
 *   bopOn?: boolean,
 *   bopCategory?: 'high' | 'mid' | 'low',
 * }} input
 * @returns {CarCapabilityVector}
 */
export function buildCarCapabilityVector(input) {
  const dynamics = resolveCarDynamicsProfile({
    carId: input.carId,
    gameVersion: input.gameVersion ?? "gt7",
    bopOn: input.bopOn,
  });

  const carClass = dynamics.car?.class ?? "Gr.3";
  const bopCategory = resolveBopCategoryForClass(
    carClass,
    input.bopCategory ?? "mid",
  );

  const measurable =
    carClass === "Gr.3"
      ? resolveGr3Measurable(input.carId, bopCategory)
      : null;

  /** @type {Record<string, CapabilityField>} */
  const capabilities = {};

  const put = (key, value, origin) => {
    capabilities[key] = {
      value: value == null || !Number.isFinite(value) ? null : value,
      origin: value == null || !Number.isFinite(value) ? "unknown" : origin,
    };
  };

  // Acceleration — keep 0-400 / 0-1000 / 100-150 separate when measured.
  put(
    "launch",
    scaleTime(measurable?.accel400, 10.5, 13.5),
    measurable?.provenance?.acceleration?.derivation ? "derived" : "measured",
  );
  put(
    "lowSpeedAcceleration",
    scaleTime(measurable?.accel400, 10.5, 13.5),
    measurable?.provenance?.acceleration?.derivation ? "derived" : "measured",
  );
  put(
    "midRangeAcceleration",
    scaleTime(measurable?.accel100_150, 2.2, 4.2),
    measurable?.provenance?.acceleration?.derivation ? "derived" : "measured",
  );
  put(
    "straightLine",
    scaleTime(measurable?.accel1000, 19.5, 24.5),
    measurable?.provenance?.acceleration?.derivation ? "derived" : "measured",
  );

  put(
    "powerToWeight",
    scaleBand(measurable?.powerToWeightPsPerT, 300, 420),
    "measured",
  );

  put(
    "topSpeedPotential",
    dynamics.traits.topSpeed ?? null,
    dynamics.provenance.topSpeed === "class_baseline" ? "derived" : "measured",
  );

  put(
    "lowSpeedRotation",
    scaleBand(measurable?.rotation60, 1.0, 1.45) ?? dynamics.traits.rotation,
    measurable?.rotation60 != null ? "measured" : "derived",
  );
  put(
    "midSpeedRotation",
    scaleBand(measurable?.rotation120, 1.2, 1.75) ?? dynamics.traits.rotation,
    measurable?.rotation120 != null ? "measured" : "derived",
  );
  put(
    "highSpeedRotation",
    scaleBand(measurable?.rotation240, 1.0, 1.55) ?? dynamics.traits.rotation,
    measurable?.rotation240 != null ? "measured" : "derived",
  );

  put(
    "lowSpeedStability",
    scaleBand(measurable?.stabilityLow, -1.0, -0.15) ??
      dynamics.traits.stability,
    measurable?.stabilityLow != null ? "measured" : "derived",
  );
  put(
    "highSpeedStability",
    scaleBand(measurable?.stabilityHigh, -1.0, -0.15) ??
      dynamics.traits.stability,
    measurable?.stabilityHigh != null ? "measured" : "derived",
  );

  put(
    "traction",
    dynamics.traits.traction ?? null,
    dynamics.provenance.traction === "class_baseline" ? "derived" : "measured",
  );
  put(
    "brakingConfidence",
    dynamics.traits.stability ?? null,
    "derived",
  );
  put(
    "directionChange",
    mixNullable(
      capabilities.lowSpeedRotation?.value,
      capabilities.midSpeedRotation?.value,
      dynamics.traits.rotation,
    ),
    "derived",
  );
  put(
    "weightAgility",
    dynamics.drivetrain.rearBiased
      ? 0.62
      : dynamics.drivetrain.allWheel
        ? 0.48
        : 0.55,
    "derived",
  );
  put("aeroDependence", dynamics.traits.topSpeed ?? null, "derived");
  put(
    "mechanicalGrip",
    mixNullable(dynamics.traits.traction, dynamics.traits.tyres),
    "derived",
  );

  // Recompute directionChange after rotation fields exist (already set above).

  const missingFields = Object.entries(capabilities)
    .filter(([, field]) => field.value == null)
    .map(([key]) => key);

  const known = Object.values(capabilities).filter((field) => field.value != null);
  const completeness = known.length / Math.max(1, Object.keys(capabilities).length);

  return {
    carId: input.carId,
    carClass,
    bopCategory,
    capabilities,
    completeness,
    missingFields,
  };
}

/**
 * @param {...(number | null | undefined)} values
 * @returns {number | null}
 */
function mixNullable(...values) {
  const finite = values.filter((v) => v != null && Number.isFinite(v));
  if (!finite.length) return null;
  return finite.reduce((a, b) => a + /** @type {number} */ (b), 0) / finite.length;
}

/**
 * Standing-start vs rolling performance emphasis from capability vector.
 * Does not invent times — only uses available acceleration fields.
 *
 * @param {CarCapabilityVector} vector
 * @returns {{ standingStart: number | null, rollingRace: number | null }}
 */
export function deriveStartPerformance(vector) {
  const launch = vector.capabilities.launch?.value ?? null;
  const mid = vector.capabilities.midRangeAcceleration?.value ?? null;
  const straight = vector.capabilities.straightLine?.value ?? null;

  return {
    standingStart: launch,
    rollingRace: mixNullable(mid, straight, launch),
  };
}
