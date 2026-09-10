/**
 * Gr.3 measurable performance scoring from GT ENG!NE BoP tables (GT7 1.71).
 *
 * Stability semantics (GT ENG!NE):
 * - Reported stability values are negative (typically -0.2 to -1.0).
 * - N = Neutral balance tendency; U = Understeer tendency.
 * - Values closer to zero indicate a more neutral / stable platform.
 * - We score stability using the raw value (higher is better) with a small
 *   understeer penalty when class === "U".
 *
 * Rotation G (60 / 120 / 240 km/h): higher lateral G = stronger cornering.
 */

import { getTrackRacingProfile } from "../data/championshipAdvisor171.js";
import {
  GR3_DATA_VERSION,
  GR3_MEASURABLE_171,
  GR3_PICKER_ENGINE_VERSION,
  getGr3Measurable,
} from "../data/gr3Measurable171.js";

const ACCEL_WEIGHTS = {
  accel400: 0.35,
  accel1000: 0.45,
  accel100_150: 0.2,
};

const ROTATION_AGILITY_WEIGHTS = {
  rotation60: 0.25,
  rotation120: 0.35,
  rotation240: 0.4,
};

/** @typedef {'high'|'mid'|'low'} Gr3BopCategory */

/**
 * @param {number[]} values
 * @param {number} value
 * @param {{ invert?: boolean }} [options]
 */
function percentileRank(values, value, options = {}) {
  const finite = values.filter((entry) => Number.isFinite(entry));
  if (!finite.length || !Number.isFinite(value)) {
    return 50;
  }

  const sorted = [...finite].sort((a, b) => a - b);
  let below = 0;
  for (const entry of sorted) {
    if (entry < value) below += 1;
  }

  let rank = (below / sorted.length) * 100;
  if (options.invert) {
    rank = 100 - rank;
  }

  return Math.min(100, Math.max(0, rank));
}

/**
 * Clipped z-score mapped to 0–100 for robustness against outliers.
 * @param {number[]} values
 * @param {number} value
 * @param {{ invert?: boolean }} [options]
 */
function clippedZScore(values, value, options = {}) {
  const finite = values.filter((entry) => Number.isFinite(entry));
  if (finite.length < 2 || !Number.isFinite(value)) {
    return 50;
  }

  const mean = finite.reduce((sum, entry) => sum + entry, 0) / finite.length;
  const variance =
    finite.reduce((sum, entry) => sum + (entry - mean) ** 2, 0) /
    finite.length;
  const std = Math.sqrt(variance) || 1;
  const z = (value - mean) / std;
  const clipped = Math.max(-2, Math.min(2, z));
  let score = 50 + clipped * 25;
  if (options.invert) {
    score = 100 - score;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Blend percentile rank (robust) with clipped z-score (spread-aware).
 * @param {number[]} values
 * @param {number} value
 * @param {{ invert?: boolean, compressStdBelow?: number, compressFactor?: number }} [options]
 */
function robustNormalize(values, value, options = {}) {
  const rank = percentileRank(values, value, options);
  const z = clippedZScore(values, value, options);
  let score = rank * 0.55 + z * 0.45;

  // Tightly clustered metrics (e.g. GT ENG!NE stability) otherwise explode
  // tiny absolute gaps into near 0/100 ranks — compress toward midfield.
  const compressBelow = options.compressStdBelow;
  if (Number.isFinite(compressBelow)) {
    const finite = values.filter((entry) => Number.isFinite(entry));
    if (finite.length >= 2) {
      const mean =
        finite.reduce((sum, entry) => sum + entry, 0) / finite.length;
      const variance =
        finite.reduce((sum, entry) => sum + (entry - mean) ** 2, 0) /
        finite.length;
      const std = Math.sqrt(variance);
      if (std < compressBelow) {
        const factor = options.compressFactor ?? 0.55;
        score = 50 + (score - 50) * factor;
      }
    }
  }

  return Number(score.toFixed(2));
}

/**
 * @param {ReturnType<typeof getGr3Measurable>} raw
 */
function convertStabilityScore(raw) {
  if (!Number.isFinite(raw?.stabilityLow) && !Number.isFinite(raw?.stabilityHigh)) {
    return { lowSpeedStability: null, highSpeedStability: null };
  }

  const understeerPenalty = (entry) =>
    entry?.class === "U" ? 0.92 : entry?.class === "N" ? 1 : 0.96;

  const lowBase = Number.isFinite(raw.stabilityLow) ? raw.stabilityLow : null;
  const highBase = Number.isFinite(raw.stabilityHigh) ? raw.stabilityHigh : null;

  return {
    lowSpeedStability:
      lowBase == null
        ? null
        : Number((lowBase * understeerPenalty({ class: raw.stabilityLowClass })).toFixed(4)),
    highSpeedStability:
      highBase == null
        ? null
        : Number((highBase * understeerPenalty({ class: raw.stabilityHighClass })).toFixed(4)),
  };
}

/**
 * @param {Gr3BopCategory} bopCategory
 */
function collectFieldValues(bopCategory = "high") {
  const table = GR3_MEASURABLE_171.bop?.[bopCategory];
  if (!table) return null;

  const entries = Object.values(table);
  const stabilityConverted = entries.map((entry) => convertStabilityScore(entry));

  return {
    pp: entries.map((entry) => entry.pp),
    powerToWeightPsPerT: entries.map((entry) => entry.powerToWeightPsPerT),
    accel400: entries.map((entry) => entry.accel400),
    accel1000: entries.map((entry) => entry.accel1000),
    accel100_150: entries.map((entry) => entry.accel100_150),
    lowSpeedStability: stabilityConverted.map((entry) => entry.lowSpeedStability),
    highSpeedStability: stabilityConverted.map((entry) => entry.highSpeedStability),
    rotation60: entries.map((entry) => entry.rotation60),
    rotation120: entries.map((entry) => entry.rotation120),
    rotation240: entries.map((entry) => entry.rotation240),
  };
}

/** @type {Map<string, ReturnType<typeof collectFieldValues>>} */
const fieldCache = new Map();

/**
 * @param {Gr3BopCategory} bopCategory
 */
function getFieldValues(bopCategory = "high") {
  const key = bopCategory;
  if (!fieldCache.has(key)) {
    fieldCache.set(key, collectFieldValues(bopCategory));
  }
  return fieldCache.get(key);
}

/**
 * @param {string} carId
 * @param {Gr3BopCategory} [bopCategory='high']
 */
export function hasGr3MeasurableData(carId, bopCategory = "high") {
  return getGr3Measurable(carId, bopCategory) != null;
}

/**
 * Infer BoP table from track characteristics when not explicitly provided.
 * @param {{ topSpeed?: number, traction?: number }} [track]
 * @param {{ bopCategory?: Gr3BopCategory }} [options]
 * @returns {Gr3BopCategory}
 */
export function resolveGr3BopCategory(track, options = {}) {
  if (options.bopCategory) {
    return options.bopCategory;
  }

  const topSpeed = Number(track?.topSpeed ?? 5);
  if (topSpeed >= 9) return "high";
  if (topSpeed <= 6.5) return "low";
  return "mid";
}

/**
 * Build normalized performance profile (0–100) for a Gr.3 car.
 *
 * @param {string} carId
 * @param {{ bopCategory?: Gr3BopCategory }} [options]
 */
export function resolveGr3PerformanceProfile(carId, options = {}) {
  const bopCategory = options.bopCategory ?? "high";
  const raw = getGr3Measurable(carId, bopCategory);
  const fields = getFieldValues(bopCategory);

  if (!raw || !fields) {
    return null;
  }

  const stability = convertStabilityScore(raw);

  const accel400 = robustNormalize(fields.accel400, raw.accel400, { invert: true });
  const accel1000 = robustNormalize(fields.accel1000, raw.accel1000, { invert: true });
  const accel100_150 = robustNormalize(fields.accel100_150, raw.accel100_150, {
    invert: true,
  });

  const acceleration = Number(
    (
      accel400 * ACCEL_WEIGHTS.accel400 +
      accel1000 * ACCEL_WEIGHTS.accel1000 +
      accel100_150 * ACCEL_WEIGHTS.accel100_150
    ).toFixed(2),
  );

  const sustainedAccel = Number(
    (accel1000 * 0.6 + accel100_150 * 0.4).toFixed(2),
  );

  const lowSpeedCornering = robustNormalize(fields.rotation60, raw.rotation60);
  const mediumSpeedCornering = robustNormalize(fields.rotation120, raw.rotation120);
  const highSpeedCornering = robustNormalize(fields.rotation240, raw.rotation240);

  const rotationAgility = Number(
    (
      lowSpeedCornering * ROTATION_AGILITY_WEIGHTS.rotation60 +
      mediumSpeedCornering * ROTATION_AGILITY_WEIGHTS.rotation120 +
      highSpeedCornering * ROTATION_AGILITY_WEIGHTS.rotation240
    ).toFixed(2),
  );

  const lowSpeedStability = robustNormalize(
    fields.lowSpeedStability,
    stability.lowSpeedStability,
    { compressStdBelow: 0.12, compressFactor: 0.52 },
  );
  const highSpeedStability = robustNormalize(
    fields.highSpeedStability,
    stability.highSpeedStability,
    { compressStdBelow: 0.18, compressFactor: 0.52 },
  );

  const powerDelivery = robustNormalize(
    fields.powerToWeightPsPerT,
    raw.powerToWeightPsPerT,
  );

  return {
    carId,
    bopCategory,
    dataVersion: GR3_DATA_VERSION,
    raw,
    normalized: {
      acceleration,
      sustainedAccel,
      lowSpeedCornering,
      mediumSpeedCornering,
      highSpeedCornering,
      lowSpeedStability,
      highSpeedStability,
      rotationAgility,
      powerDelivery,
    },
    components: {
      accel400,
      accel1000,
      accel100_150,
    },
  };
}

/**
 * Track-weighted fit from measurable profile dimensions.
 * @param {NonNullable<ReturnType<typeof resolveGr3PerformanceProfile>>} carProfile
 * @param {{ topSpeed?: number, traction?: number, stability?: number, drivingStyle?: string }} track
 */
export function computeGr3TechnicalFit(carProfile, track) {
  const profile = carProfile.normalized;
  const racingProfile = getTrackRacingProfile(track);

  const weightsByProfile = {
    power: {
      acceleration: 0.28,
      sustainedAccel: 0.22,
      highSpeedCornering: 0.12,
      highSpeedStability: 0.18,
      powerDelivery: 0.2,
    },
    technical: {
      lowSpeedCornering: 0.22,
      mediumSpeedCornering: 0.22,
      rotationAgility: 0.2,
      lowSpeedStability: 0.18,
      acceleration: 0.18,
    },
    highSpeedCorner: {
      highSpeedCornering: 0.24,
      highSpeedStability: 0.22,
      sustainedAccel: 0.18,
      mediumSpeedCornering: 0.16,
      powerDelivery: 0.2,
    },
    tractionHeavy: {
      lowSpeedCornering: 0.2,
      mediumSpeedCornering: 0.2,
      rotationAgility: 0.18,
      lowSpeedStability: 0.22,
      acceleration: 0.2,
    },
    tyreSensitive: {
      lowSpeedStability: 0.24,
      highSpeedStability: 0.2,
      rotationAgility: 0.18,
      mediumSpeedCornering: 0.18,
      sustainedAccel: 0.2,
    },
    balanced: {
      acceleration: 0.2,
      sustainedAccel: 0.16,
      rotationAgility: 0.18,
      mediumSpeedCornering: 0.16,
      highSpeedStability: 0.15,
      powerDelivery: 0.15,
    },
  };

  const weights = weightsByProfile[racingProfile] ?? weightsByProfile.balanced;
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    const value = profile[dimension];
    if (!Number.isFinite(value)) continue;
    weightedSum += value * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 50;

  return {
    score: Number(score.toFixed(2)),
    racingProfile,
    weights,
  };
}

/**
 * Race-condition modifier on Technical Fit.
 * Tyre/fuel consumption are NOT measured in GT ENG!NE tables — unknown stays
 * unknown. When tyre multipliers are active, apply a small modelled stability
 * proxy only (never invented tyre/fuel ratings). Fuel remains neutral.
 *
 * @param {number} technicalFit
 * @param {NonNullable<ReturnType<typeof resolveGr3PerformanceProfile>>} carProfile
 * @param {{ fuelMultiplier?: number, tyreMultiplier?: number, lapCount?: number }} [raceSettings]
 */
export function applyGr3RaceConditionModifier(
  technicalFit,
  carProfile,
  raceSettings = {},
) {
  const tyreMult = Number(raceSettings.tyreMultiplier ?? 0);
  const fuelMult = Number(raceSettings.fuelMultiplier ?? 0);
  const tyreActive = Number.isFinite(tyreMult) && tyreMult > 0;
  const fuelActive = Number.isFinite(fuelMult) && fuelMult > 0;

  if (!tyreActive && !fuelActive) {
    return {
      score: technicalFit,
      tyreModifier: 0,
      fuelModifier: 0,
      notes: ["tyre_fuel_x0_or_inactive"],
    };
  }

  const low = carProfile.normalized.lowSpeedStability;
  const high = carProfile.normalized.highSpeedStability;
  const stabilityProxy =
    Number.isFinite(low) && Number.isFinite(high)
      ? (low + high) / 2
      : Number.isFinite(low)
        ? low
        : Number.isFinite(high)
          ? high
          : 50;

  // Scale: at tyre x5, ± up to ~4.5 pts from midfield stability.
  const tyreScale = tyreActive ? Math.min(1.2, Math.sqrt(tyreMult) * 0.55) : 0;
  const tyreModifier = tyreActive
    ? ((stabilityProxy - 50) / 50) * 4.5 * tyreScale
    : 0;

  // No measured fuel economy — do not invent a fuel ranking.
  const fuelModifier = 0;
  const notes = [];
  if (tyreActive) notes.push("tyre_modifier_from_stability_proxy");
  if (fuelActive) notes.push("fuel_unknown_neutral");

  return {
    score: Number((technicalFit + tyreModifier + fuelModifier).toFixed(2)),
    tyreModifier: Number(tyreModifier.toFixed(2)),
    fuelModifier: 0,
    notes,
  };
}

/**
 * Score a Gr.3 car for a single race context using measurable data.
 *
 * @param {string} carId
 * @param {{ topSpeed?: number, traction?: number, stability?: number, drivingStyle?: string }} track
 * @param {{ bopCategory?: Gr3BopCategory, confidenceScale?: number, fuelMultiplier?: number, tyreMultiplier?: number, lapCount?: number }} [options]
 */
export function scoreGr3CarForRace(carId, track, options = {}) {
  const bopCategory = resolveGr3BopCategory(track, options);
  const carProfile = resolveGr3PerformanceProfile(carId, { bopCategory });

  if (!carProfile) {
    return {
      score: null,
      confidence: "missing",
      bopCategory,
      dataVersion: GR3_DATA_VERSION,
    };
  }

  const fit = computeGr3TechnicalFit(carProfile, track);
  const raceAdjusted = applyGr3RaceConditionModifier(
    fit.score,
    carProfile,
    options,
  );
  const confidenceScale = options.confidenceScale ?? 1;
  const score = Number((raceAdjusted.score * confidenceScale).toFixed(2));

  return {
    score: Math.max(0, Math.min(100, score)),
    confidence: "full",
    bopCategory,
    dataVersion: GR3_DATA_VERSION,
    profile: carProfile,
    fit,
    raceCondition: raceAdjusted,
  };
}

export { GR3_DATA_VERSION, GR3_PICKER_ENGINE_VERSION };
