/**
 * Pitstop Strategy evidence — future ALR / community strategy data layer.
 *
 * Populate `PITSTOP_STRATEGY_EVIDENCE` and `PITSTOP_PROVEN_STRATEGIES` with real
 * race imports to refine pit windows, compound choices and stop counts.
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

/**
 * @typedef {Object} PitstopProvenStrategy
 * @property {string} id
 * @property {string} trackId
 * @property {string} [carClass]
 * @property {string} raceLabel
 * @property {number} laps
 * @property {number} recommendedStops
 * @property {string} startTyre
 * @property {number} pitLap
 * @property {string} finishTyre
 * @property {string} tyreStrategy Display chain e.g. "Racing Hard → Racing Medium"
 * @property {string} confidence e.g. "Tested", "Community"
 * @property {string} source
 * @property {number} [confidenceBonus]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 */

/** @type {PitstopStrategyEvidenceEntry[]} */
export const PITSTOP_STRATEGY_EVIDENCE = [];

/** Known / proven race strategies — update as ALR rounds are completed. */
export const PITSTOP_PROVEN_STRATEGIES = [
  {
    id: "alr_s23_r1_suzuka_feature",
    trackId: "suzuka",
    carClass: "Gr.3",
    raceLabel: "ALR Season 23 Round 1 Feature",
    laps: 20,
    recommendedStops: 1,
    startTyre: "Racing Hard",
    pitLap: 11,
    finishTyre: "Racing Medium",
    tyreStrategy: "Racing Hard → Racing Medium",
    confidence: "Tested",
    source: "Radiate79 test race",
    confidenceBonus: 14,
  },
];

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
 * @param {PitstopStrategyContext} context
 * @returns {PitstopProvenStrategy[]}
 */
export function findProvenStrategies(context = {}) {
  const lapCount = Number(context.lapCount);

  return PITSTOP_PROVEN_STRATEGIES.filter((entry) => {
    if (context.trackId && entry.trackId !== context.trackId) {
      return false;
    }

    if (context.carClass && entry.carClass && entry.carClass !== context.carClass) {
      return false;
    }

    if (
      Number.isFinite(lapCount) &&
      Math.abs(lapCount - entry.laps) > Math.max(1, Math.round(entry.laps * 0.1))
    ) {
      return false;
    }

    if (
      context.fuelMultiplier != null &&
      entry.fuelMultiplier != null &&
      entry.fuelMultiplier !== context.fuelMultiplier
    ) {
      return false;
    }

    if (
      context.tyreMultiplier != null &&
      entry.tyreMultiplier != null &&
      entry.tyreMultiplier !== context.tyreMultiplier
    ) {
      return false;
    }

    return true;
  });
}

/**
 * @param {PitstopStrategyContext} context
 * @returns {{
 *   pitLapAdjustments: number[],
 *   stopAdjustment: number,
 *   tyreStrategyOverride: string | null,
 *   confidenceBonus: number,
 *   matchedEntryId: string | null,
 *   provenStrategies: PitstopProvenStrategy[],
 * }}
 */
export function resolvePitstopStrategySignals(context = {}) {
  const evidence = resolvePitstopStrategyEvidence(context);
  const provenStrategies = findProvenStrategies(context);

  if (provenStrategies.length === 0) {
    return {
      ...evidence,
      provenStrategies,
    };
  }

  const primary = provenStrategies[0];
  return {
    pitLapAdjustments: [primary.pitLap],
    stopAdjustment: primary.recommendedStops,
    tyreStrategyOverride: primary.tyreStrategy,
    confidenceBonus: Math.max(
      evidence.confidenceBonus,
      primary.confidenceBonus ?? 12,
    ),
    matchedEntryId: primary.id,
    provenStrategies,
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
