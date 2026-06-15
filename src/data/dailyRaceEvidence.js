/**
 * GT7 Daily Race evidence — temporary / current-meta community signals.
 *
 * These entries reflect recent Daily Race rotations and should be updated over time
 * as GT7 Daily Races change. They provide SMALL confidence and score boosts only;
 * track fit, wear multipliers, BOP, race length and car handling remain primary.
 */

/** Max overall-score boost when track, class and race conditions align. */
export const DAILY_RACE_FULL_MATCH_SCORE_MODIFIER = 2.5;

/** Smaller boost when a car is listed for a class but conditions differ. */
export const DAILY_RACE_CLASS_META_SCORE_MODIFIER = 1.25;

export const DAILY_RACE_EVIDENCE_REASON =
  "Current Daily Race evidence supports this car in competitive GT7 meta.";

/**
 * @typedef {Object} DailyRaceStrongCar
 * @property {string} carId
 * @property {number} [confidenceBonus] Display-only community confidence bump (0–100 cap).
 * @property {number} [fullMatchScoreModifier] Override for full setup match.
 * @property {number} [classMetaScoreModifier] Override for class-only meta match.
 */

/**
 * @typedef {Object} DailyRaceEvidenceEntry
 * @property {string} id
 * @property {string} label
 * @property {string[]} trackIds
 * @property {string} carClass
 * @property {number} laps
 * @property {number} fuelMultiplier
 * @property {number} tyreMultiplier
 * @property {DailyRaceStrongCar[]} strongCars
 */

/** @type {DailyRaceEvidenceEntry[]} */
export const DAILY_RACE_EVIDENCE = [
  {
    id: "daily_race_b",
    label: "Daily Race B",
    trackIds: [
      "tokyo_expressway_south_inner_reverse",
      "tokyo_expressway_south_inner",
    ],
    carClass: "Gr.3",
    laps: 5,
    fuelMultiplier: 1,
    tyreMultiplier: 1,
    strongCars: [
      {
        carId: "supra_racing_concept",
        confidenceBonus: 4,
        fullMatchScoreModifier: 2.5,
        classMetaScoreModifier: 1.5,
      },
      {
        carId: "audi_r8_lms_evo",
        confidenceBonus: 2,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
      {
        carId: "ferrari_296_gt3_23",
        confidenceBonus: 2,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
    ],
  },
  {
    id: "daily_race_c",
    label: "Daily Race C",
    trackIds: ["sardegna_road_track_b", "sardegna_road_track_b_reverse"],
    carClass: "Gr.4",
    laps: 15,
    fuelMultiplier: 2,
    tyreMultiplier: 4,
    strongCars: [
      {
        carId: "citroen_gt_gr4",
        confidenceBonus: 3,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
      {
        carId: "porsche_cayman_gt4_clubsport_gr4",
        confidenceBonus: 3,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
      {
        carId: "honda_nsx_gr4",
        confidenceBonus: 3,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
      {
        carId: "ferrari_458_italia_gr4",
        confidenceBonus: 3,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
      {
        carId: "genesis_g70_gr4",
        confidenceBonus: 3,
        fullMatchScoreModifier: 2,
        classMetaScoreModifier: 1.25,
      },
    ],
  },
];

/**
 * @typedef {Object} RecommendationContext
 * @property {string} [trackId]
 * @property {string} [carClass]
 * @property {number} [lapCount]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 */

/**
 * @param {RecommendationContext} context
 * @param {DailyRaceEvidenceEntry} entry
 */
function matchesDailyRaceConditions(context, entry) {
  const lapCount = Number(context.lapCount);
  const fuelMultiplier = Number(context.fuelMultiplier ?? 0);
  const tyreMultiplier = Number(context.tyreMultiplier ?? 0);

  const lapsMatch =
    !Number.isFinite(lapCount) ||
    Math.abs(lapCount - entry.laps) <= Math.max(1, Math.round(entry.laps * 0.1));

  return (
    lapsMatch &&
    fuelMultiplier === entry.fuelMultiplier &&
    tyreMultiplier === entry.tyreMultiplier
  );
}

/**
 * @param {string} carId
 * @param {string} [carClass]
 * @param {RecommendationContext} [context]
 * @returns {{ scoreModifier: number, confidenceBonus: number, matchedEntryId: string | null }}
 */
export function resolveDailyRaceEvidenceBoost(
  carId,
  carClass = "",
  context = {},
) {
  let scoreModifier = 0;
  let confidenceBonus = 0;
  let matchedEntryId = null;

  for (const entry of DAILY_RACE_EVIDENCE) {
    if (carClass && entry.carClass !== carClass) {
      continue;
    }

    const carEvidence = entry.strongCars.find((item) => item.carId === carId);
    if (!carEvidence) {
      continue;
    }

    const trackMatch =
      Boolean(context.trackId) && entry.trackIds.includes(context.trackId);
    const conditionsMatch = matchesDailyRaceConditions(context, entry);

    if (trackMatch && conditionsMatch) {
      scoreModifier = Math.max(
        scoreModifier,
        carEvidence.fullMatchScoreModifier ?? DAILY_RACE_FULL_MATCH_SCORE_MODIFIER,
      );
      confidenceBonus = Math.max(
        confidenceBonus,
        carEvidence.confidenceBonus ?? 3,
      );
      matchedEntryId = entry.id;
      continue;
    }

    scoreModifier = Math.max(
      scoreModifier,
      carEvidence.classMetaScoreModifier ?? DAILY_RACE_CLASS_META_SCORE_MODIFIER,
    );
    confidenceBonus = Math.max(
      confidenceBonus,
      Math.round((carEvidence.confidenceBonus ?? 3) * 0.5),
    );
    matchedEntryId = matchedEntryId ?? entry.id;
  }

  return { scoreModifier, confidenceBonus, matchedEntryId };
}

/**
 * @param {RecommendationContext} params
 * @returns {RecommendationContext}
 */
export function buildRecommendationContext({
  trackId,
  carClass,
  lapCount,
  fuelMultiplier,
  tyreMultiplier,
} = {}) {
  return {
    trackId,
    carClass,
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  };
}
