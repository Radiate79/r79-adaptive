/**
 * Stint feasibility layer — answer "can this stint be completed safely?"
 * before ranking theoretical strategy speed.
 *
 * Does NOT linearly convert pre-1.71 x5 tyre life into post-1.71 x4 life.
 */

import {
  ACTIVE_PHYSICS_GENERATION,
  getPhysicsEvidenceWeight,
  isCurrentPhysicsGeneration,
  PRE_1_71_PHYSICS_GENERATION,
} from "../data/gt7PhysicsVersion.js";
import {
  ALR_CURRENT_TYRE_WEAR_MULTIPLIER,
  isHistoricalAlrTyreEvidence,
  refuseLinearTyreLifeConversion,
} from "../data/alr/leagueRules.js";
import { getTyrePhysicsEvidenceWeight } from "../data/tyreCompounds.js";

/**
 * @typedef {Object} TyreStintEvidence
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {string} [carClass]
 * @property {string} [compound]
 * @property {number} [tyreWearMultiplier]
 * @property {number} [fuelMultiplier]
 * @property {string} [physicsGeneration]
 * @property {string} [gameVersion]
 * @property {number} [stintLaps]
 * @property {number} [observedLifeLaps]
 * @property {number} [lifeMin]
 * @property {number} [lifeMax]
 * @property {string} [endWearState]
 * @property {string} [limitingTyre]
 * @property {number} [paceDrop]
 * @property {string} [handlingChange]
 * @property {number} [fuelRemaining]
 * @property {string} [source]
 * @property {number} [confidence] 0–1
 */

/**
 * @typedef {Object} StintFeasibilityResult
 * @property {boolean} feasible
 * @property {'VERY_HIGH'|'HIGH'|'MEDIUM'|'LOW'|'UNKNOWN'} confidence
 * @property {{ min: number | null, max: number | null, estimate: number | null }} expectedLifeRange
 * @property {string | null} limitingTyre
 * @property {'exact_current'|'similar_current'|'class_current'|'historical'|'heuristic'|'none'} evidenceQuality
 * @property {string} [note]
 * @property {TyreStintEvidence | null} [matchedEvidence]
 */

/** Soft heuristic bases — low authority only. Not converted from ALR x5. */
const HEURISTIC_BASE_LAPS = { S: 22, M: 40, H: 65, IM: 28, W: 30 };

/**
 * Evidence priority for tyre-life (highest first):
 * 1 exact post-1.71 same car/track/compound/wear
 * 2 post-1.71 same car + similar conditions
 * 3 post-1.71 class-level
 * 4 pre-1.71 exact historical
 * 5 legacy heuristic
 *
 * @param {TyreStintEvidence} evidence
 * @param {{
 *   carId?: string,
 *   trackId?: string,
 *   carClass?: string,
 *   compound?: string,
 *   tyreWearMultiplier?: number,
 * }} query
 * @returns {number} lower is better
 */
export function rankTyreLifeEvidence(evidence, query) {
  const compound = String(query.compound ?? "").toUpperCase();
  const eCompound = String(evidence.compound ?? "").toUpperCase();
  const sameCompound = !compound || !eCompound || compound === eCompound;
  if (!sameCompound) return 99;

  const current = isCurrentPhysicsGeneration(evidence.physicsGeneration);
  const historical = isHistoricalAlrTyreEvidence(evidence) || !current;
  const sameCar = evidence.carId && evidence.carId === query.carId;
  const sameTrack = evidence.trackId && evidence.trackId === query.trackId;
  const sameWear =
    evidence.tyreWearMultiplier != null &&
    query.tyreWearMultiplier != null &&
    Number(evidence.tyreWearMultiplier) === Number(query.tyreWearMultiplier);
  const sameClass = evidence.carClass && evidence.carClass === query.carClass;

  if (current && sameCar && sameTrack && sameWear) return 1;
  if (current && sameCar && sameWear) return 2;
  if (current && sameCar) return 3;
  if (current && sameClass && sameWear) return 4;
  if (current && sameClass) return 5;
  if (historical && sameCar && sameTrack) return 6;
  if (historical) return 7;
  return 8;
}

/**
 * Select best evidence without linear wear remapping.
 * @param {TyreStintEvidence[]} pool
 * @param {object} query
 * @returns {{ evidence: TyreStintEvidence | null, quality: StintFeasibilityResult['evidenceQuality'] }}
 */
export function selectTyreLifeEvidence(pool, query) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return { evidence: null, quality: "none" };
  }

  const ranked = [...pool]
    .map((entry) => ({ entry, rank: rankTyreLifeEvidence(entry, query) }))
    .filter((row) => row.rank < 99)
    .sort((a, b) => a.rank - b.rank || (b.entry.confidence ?? 0) - (a.entry.confidence ?? 0));

  if (!ranked.length) {
    return { evidence: null, quality: "none" };
  }

  const best = ranked[0];
  if (best.rank === 1) return { evidence: best.entry, quality: "exact_current" };
  if (best.rank <= 3) return { evidence: best.entry, quality: "similar_current" };
  if (best.rank <= 5) return { evidence: best.entry, quality: "class_current" };
  return { evidence: best.entry, quality: "historical" };
}

/**
 * Low-authority heuristic life — never a linear remap of historical ALR x5.
 * @param {string} compound
 * @param {number} tyreMultiplier
 * @param {number} tyreStress
 */
export function estimateHeuristicTyreLife(compound, tyreMultiplier, tyreStress) {
  if (tyreMultiplier === 0) {
    return { estimate: null, min: null, max: null, confidence: "UNKNOWN" };
  }

  const code = String(compound ?? "M").toUpperCase();
  const base = HEURISTIC_BASE_LAPS[code] ?? HEURISTIC_BASE_LAPS.M;
  const stressFactor = Math.max(0.55, (Number(tyreStress) || 5) / 5);
  // Non-linear wear curve — intentionally NOT oldLife * (5/4).
  const multFactor = Math.pow(Math.max(1, Number(tyreMultiplier) || 1), 0.62);
  const estimate = Math.max(3, Math.round(base / (stressFactor * multFactor)));
  const spread = Math.max(2, Math.round(estimate * 0.22));
  return {
    estimate,
    min: Math.max(2, estimate - spread),
    max: estimate + spread,
    confidence: "LOW",
  };
}

/**
 * Evaluate whether a stint is safely feasible.
 *
 * @param {{
 *   carId?: string,
 *   trackId?: string,
 *   carClass?: string,
 *   compound: string,
 *   laps: number,
 *   tyreWearMultiplier?: number,
 *   fuelMultiplier?: number,
 *   physicsGeneration?: string,
 *   tyreStress?: number,
 *   evidence?: TyreStintEvidence[],
 * }} input
 * @returns {StintFeasibilityResult}
 */
export function evaluateStint(input) {
  const laps = Math.max(0, Number(input.laps) || 0);
  const tyreWearMultiplier = Number(input.tyreWearMultiplier ?? 0);
  const physicsGeneration = input.physicsGeneration ?? ACTIVE_PHYSICS_GENERATION;

  if (tyreWearMultiplier === 0) {
    return {
      feasible: true,
      confidence: "HIGH",
      expectedLifeRange: { min: null, max: null, estimate: null },
      limitingTyre: null,
      evidenceQuality: "none",
      note: "Tyre wear multiplier is 0 — degradation constraint disabled.",
      matchedEvidence: null,
    };
  }

  const { evidence, quality } = selectTyreLifeEvidence(input.evidence ?? [], {
    carId: input.carId,
    trackId: input.trackId,
    carClass: input.carClass,
    compound: input.compound,
    tyreWearMultiplier,
  });

  // Explicitly refuse linear conversion of mismatched wear multipliers.
  if (
    evidence &&
    evidence.tyreWearMultiplier != null &&
    Number(evidence.tyreWearMultiplier) !== tyreWearMultiplier
  ) {
    refuseLinearTyreLifeConversion(
      evidence.observedLifeLaps ?? evidence.lifeMax ?? 0,
      evidence.tyreWearMultiplier,
      tyreWearMultiplier,
    );
    // Fall through — mismatched wear multiplier evidence is not remapped.
  }

  let lifeMin = null;
  let lifeMax = null;
  let estimate = null;
  let confidence = /** @type {StintFeasibilityResult['confidence']} */ ("UNKNOWN");
  let limitingTyre = null;
  let evidenceQuality = quality;
  let matched = null;

  const wearMatches =
    evidence &&
    (evidence.tyreWearMultiplier == null ||
      Number(evidence.tyreWearMultiplier) === tyreWearMultiplier);

  if (evidence && wearMatches) {
    matched = evidence;
    const physicsWeight = getTyrePhysicsEvidenceWeight(evidence.physicsGeneration);
    estimate =
      evidence.observedLifeLaps ??
      evidence.lifeMax ??
      (evidence.lifeMin != null && evidence.lifeMax == null
        ? evidence.lifeMin
        : null);
    lifeMin = evidence.lifeMin ?? (estimate != null ? Math.max(2, estimate - 2) : null);
    lifeMax = evidence.lifeMax ?? estimate;
    limitingTyre = evidence.limitingTyre ?? null;

    if (quality === "exact_current" && physicsWeight >= 0.95) confidence = "HIGH";
    else if (quality === "similar_current" || quality === "class_current") confidence = "MEDIUM";
    else if (quality === "historical") {
      confidence = "LOW";
      // Historical evidence informs caution only — do not treat as precise current life.
      if (estimate != null) {
        lifeMin = Math.max(2, Math.round(estimate * 0.55));
        lifeMax = Math.round(estimate * 0.85);
        estimate = lifeMax;
      }
    }
  } else {
    const heuristic = estimateHeuristicTyreLife(
      input.compound,
      tyreWearMultiplier,
      input.tyreStress ?? 5,
    );
    estimate = heuristic.estimate;
    lifeMin = heuristic.min;
    lifeMax = heuristic.max;
    confidence = "LOW";
    evidenceQuality = "heuristic";
  }

  const safeLimit = lifeMin ?? estimate;
  let feasible = true;
  if (safeLimit != null && Number.isFinite(safeLimit)) {
    // Hard feasibility: stint must fit inside the conservative life bound.
    feasible = laps <= safeLimit;
  }

  return {
    feasible,
    confidence,
    expectedLifeRange: { min: lifeMin, max: lifeMax, estimate },
    limitingTyre,
    evidenceQuality,
    note:
      physicsGeneration === PRE_1_71_PHYSICS_GENERATION
        ? "Evaluating under historical physics generation."
        : tyreWearMultiplier === ALR_CURRENT_TYRE_WEAR_MULTIPLIER
          ? "ALR current wear x4 accepted as league rule input."
          : undefined,
    matchedEvidence: matched,
  };
}

/**
 * Strategy-level feasibility: every stint must be feasible.
 * @param {Array<{ compound: string, stintLength: number }>} stints
 * @param {Parameters<typeof evaluateStint>[0]} baseInput
 */
export function evaluateStrategyFeasibility(stints, baseInput) {
  const results = stints.map((stint) =>
    evaluateStint({
      ...baseInput,
      compound: stint.compound,
      laps: stint.stintLength,
    }),
  );
  const feasible = results.every((row) => row.feasible);
  const worst = results.reduce(
    (acc, row) =>
      ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"].indexOf(row.confidence) <
      ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"].indexOf(acc)
        ? row.confidence
        : acc,
    /** @type {StintFeasibilityResult['confidence']} */ ("VERY_HIGH"),
  );
  return {
    feasible,
    confidence: worst,
    stints: results,
    infeasibleStintIndexes: results
      .map((row, index) => (row.feasible ? -1 : index))
      .filter((index) => index >= 0),
  };
}

export { getPhysicsEvidenceWeight, refuseLinearTyreLifeConversion };
