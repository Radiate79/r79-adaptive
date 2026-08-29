import { normalizeRaceMultiplier } from "../utils/raceConditions.js";
import { getLapCountModifiers, resolveLapCount } from "../utils/raceDistance.js";
import { ADVISOR_ENGINE_VERSION } from "../data/advisorDataLayer.js";

/**
 * Documented Advisor scoring configuration (engine v2).
 * Evidence modifiers affect confidence / fine ranking only — not raw car pace.
 */

/** Final technical blend — track fit is primary. */
export const ADVISOR_BLEND_WEIGHTS = {
  /** Share of per-round score from CAR × TRACK technical fit. */
  trackFit: 0.62,
  /** Share from race-condition suitability (distance × tyre × fuel). */
  raceConditionFit: 0.23,
  /** Championship consistency across independently scored rounds. */
  consistency: 0.15,
};

/**
 * Evidence caps applied ONLY after technical suitability is established.
 * Kept small so history/community cannot act as horsepower.
 */
export const ADVISOR_EVIDENCE_WEIGHTS = {
  /** Max points historical ALR/archive may add after dampening. */
  historicalMaxModifier: 3,
  /** Max points from known community confidence (missing = 0). */
  communityMaxModifier: 3,
  /** PRE_1_71 ALR evidence dampening. */
  historicalPre171Dampening: 0.4,
  /** Small bonus for cars with documented high competitive use. */
  competitiveUseHighBonus: 1,
};

/** Minimum track-fit gap before evidence can reorder cars. */
export const TRACK_FIT_PRIORITY_GAP = 1.5;

/** Championship aggregation. */
export const CHAMPIONSHIP_CONFIG = {
  /** Weight of mean round score vs consistency penalty blend. */
  averageWeight: 0.82,
  consistencyWeight: 0.18,
  /** Soft penalty scale for round-to-round spread. */
  variancePenaltyScale: 0.2,
};

/** Continuous race-distance curve anchors (laps → emphases). */
export const RACE_DISTANCE_CONFIG = {
  sprintLaps: 8,
  shortLaps: 15,
  mediumLaps: 25,
};

export { ADVISOR_ENGINE_VERSION };

/**
 * Smooth race-distance profile — continuous between sprint and endurance.
 * @param {number | undefined} lapCount
 */
export function getRaceDistanceProfile(lapCount) {
  const laps = resolveLapCount({ lapCount: lapCount ?? 20 });
  const mods = getLapCountModifiers(laps);

  // Continuous blend: short races favour pace; long races favour endurance.
  const enduranceT = Math.min(1, Math.max(0, (laps - 5) / 35));
  const paceEmphasis = Number((1.4 - enduranceT * 0.55).toFixed(3));
  const enduranceEmphasis = Number((0.5 + enduranceT * 0.9).toFixed(3));

  let label = "medium";
  if (laps <= RACE_DISTANCE_CONFIG.sprintLaps) {
    label = "sprint";
  } else if (laps <= RACE_DISTANCE_CONFIG.shortLaps) {
    label = "short";
  } else if (laps > RACE_DISTANCE_CONFIG.mediumLaps) {
    label = "endurance";
  }

  return {
    ...mods,
    laps,
    paceEmphasis,
    enduranceEmphasis,
    label,
  };
}

/**
 * Tyre/fuel importance from multipliers × race distance.
 * x0 → contribution exactly 0.
 *
 * @param {{ fuelMultiplier?: number, tyreMultiplier?: number, lapCount?: number }} raceSettings
 */
export function getRaceConditionImportance(raceSettings = {}) {
  const fuelMult = normalizeRaceMultiplier(raceSettings.fuelMultiplier, 0);
  const tyreMult = normalizeRaceMultiplier(raceSettings.tyreMultiplier, 0);
  const profile = getRaceDistanceProfile(raceSettings.lapCount);

  const fuelImportance =
    fuelMult === 0
      ? 0
      : fuelMult *
        profile.fuelWeight *
        profile.enduranceEmphasis *
        (0.35 + profile.laps / 40);

  const tyreImportance =
    tyreMult === 0
      ? 0
      : tyreMult *
        profile.tyreWeight *
        (profile.enduranceEmphasis * 0.55 + profile.paceEmphasis * 0.45) *
        (0.45 + profile.laps / 35);

  return {
    fuelImportance: Number(fuelImportance.toFixed(4)),
    tyreImportance: Number(tyreImportance.toFixed(4)),
    paceEmphasis: profile.paceEmphasis,
    enduranceEmphasis: profile.enduranceEmphasis,
    profile,
  };
}

/**
 * @param {number} trackDemand
 * @param {number | null | undefined} carValue
 */
export function getAttributeWeaknessPenalty(trackDemand, carValue) {
  if (carValue == null || !Number.isFinite(Number(carValue))) {
    return 0;
  }

  const demand = Number(trackDemand ?? 0);
  const value = Number(carValue);

  if (demand < 6.5 || value >= demand - 0.75) {
    return 0;
  }

  const gap = demand - value;
  return gap * gap * 0.85;
}
