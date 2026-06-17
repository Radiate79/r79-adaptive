/**
 * Pitstop Strategy evidence — future ALR / community strategy data layer.
 *
 * Populate `PITSTOP_STRATEGY_EVIDENCE` with real race imports to refine pit windows,
 * compound choices and stop counts. The engine applies small adjustments only;
 * tyre/fuel wear and car characteristics remain primary.
 */

/**
 * @typedef {Object} PitstopStrategyEvidenceEntry
 * @property {string} id
 * @property {string} [label]
 * @property {string} [trackId]
 * @property {string} [carId]
 * @property {string} [carClass]
 * @property {number} [laps]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 * @property {number} [recommendedStops]
 * @property {number[]} [pitLaps]
 * @property {string} [tyreStrategy]
 * @property {number} [confidenceBonus] 0–15 boost to confidence score
 * @property {string} [source] e.g. "ALR Season 22", "Community"
 */

/** @type {PitstopStrategyEvidenceEntry[]} */
export const PITSTOP_STRATEGY_EVIDENCE = [];

/**
 * @typedef {Object} PitstopStrategyContext
 * @property {string} [trackId]
 * @property {string} [carId]
 * @property {string} [carClass]
 * @property {number} [lapCount]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 */

/**
 * @param {PitstopStrategyContext} context
 * @returns {{
 *   pitLapAdjustments: number[],
 *   stopAdjustment: number,
 *   tyreStrategyOverride: string | null,
 *   confidenceBonus: number,
 *   matchedEntryId: string | null,
 * }}
 */
export function resolvePitstopStrategyEvidence(context = {}) {
  let stopAdjustment = 0;
  let tyreStrategyOverride = null;
  let confidenceBonus = 0;
  let matchedEntryId = null;
  /** @type {number[]} */
  let pitLapAdjustments = [];

  for (const entry of PITSTOP_STRATEGY_EVIDENCE) {
    const trackMatch = !entry.trackId || entry.trackId === context.trackId;
    const carMatch = !entry.carId || entry.carId === context.carId;
    const classMatch = !entry.carClass || entry.carClass === context.carClass;

    const lapCount = Number(context.lapCount);
    const lapsMatch =
      entry.laps == null ||
      !Number.isFinite(lapCount) ||
      Math.abs(lapCount - entry.laps) <= Math.max(1, Math.round(entry.laps * 0.1));

    const fuelMatch =
      entry.fuelMultiplier == null ||
      entry.fuelMultiplier === context.fuelMultiplier;
    const tyreMatch =
      entry.tyreMultiplier == null ||
      entry.tyreMultiplier === context.tyreMultiplier;

    if (!trackMatch || !carMatch || !classMatch || !lapsMatch || !fuelMatch || !tyreMatch) {
      continue;
    }

    if (entry.recommendedStops != null) {
      stopAdjustment = entry.recommendedStops;
    }

    if (Array.isArray(entry.pitLaps) && entry.pitLaps.length > 0) {
      pitLapAdjustments = entry.pitLaps;
    }

    if (entry.tyreStrategy) {
      tyreStrategyOverride = entry.tyreStrategy;
    }

    confidenceBonus = Math.max(confidenceBonus, entry.confidenceBonus ?? 8);
    matchedEntryId = entry.id;
  }

  return {
    pitLapAdjustments,
    stopAdjustment,
    tyreStrategyOverride,
    confidenceBonus,
    matchedEntryId,
  };
}

/**
 * @param {PitstopStrategyContext} params
 * @returns {PitstopStrategyContext}
 */
export function buildPitstopStrategyContext({
  trackId,
  carId,
  carClass,
  lapCount,
  fuelMultiplier,
  tyreMultiplier,
} = {}) {
  return {
    trackId,
    carId,
    carClass,
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  };
}
