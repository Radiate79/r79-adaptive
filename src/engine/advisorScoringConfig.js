import { normalizeRaceMultiplier } from "../utils/raceConditions.js";
import { getLapCountModifiers, resolveLapCount } from "../utils/raceDistance.js";

/** Final recommendation blend — track fit is primary. */
export const ADVISOR_BLEND_WEIGHTS = {
  trackFit: 0.58,
  raceConditionFit: 0.24,
  consistency: 0.18,
};

/** Evidence modifiers applied after technical suitability. */
export const ADVISOR_EVIDENCE_WEIGHTS = {
  historicalMaxModifier: 6,
  communityMaxModifier: 8,
  /** PRE_1_71 ALR evidence dampening factor. */
  historicalPre171Dampening: 0.45,
  competitiveUseHighBonus: 2,
};

/** Minimum track-fit gap before community/history can reorder cars. */
export const TRACK_FIT_PRIORITY_GAP = 1.25;

/**
 * @param {number | undefined} lapCount
 */
export function getRaceDistanceProfile(lapCount) {
  const laps = resolveLapCount({ lapCount: lapCount ?? 20 });
  const mods = getLapCountModifiers(laps);

  if (laps <= 8) {
    return {
      ...mods,
      laps,
      paceEmphasis: 1.35,
      enduranceEmphasis: 0.55,
      label: "sprint",
    };
  }

  if (laps <= 15) {
    return {
      ...mods,
      laps,
      paceEmphasis: 1.12,
      enduranceEmphasis: 0.82,
      label: "short",
    };
  }

  if (laps <= 25) {
    return {
      ...mods,
      laps,
      paceEmphasis: 1,
      enduranceEmphasis: 1,
      label: "medium",
    };
  }

  return {
    ...mods,
    laps,
    paceEmphasis: 0.88,
    enduranceEmphasis: 1.32,
    label: "endurance",
  };
}

/**
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
        (profile.laps >= 15 ? 1.15 : profile.laps <= 8 ? 0.45 : 0.75);

  const tyreImportance =
    tyreMult === 0
      ? 0
      : tyreMult *
        profile.tyreWeight *
        (profile.enduranceEmphasis * 0.55 + profile.paceEmphasis * 0.45) *
        (profile.laps >= 12 ? 1.1 : profile.laps <= 8 ? 0.75 : 0.95);

  return {
    fuelImportance,
    tyreImportance,
    paceEmphasis: profile.paceEmphasis,
    enduranceEmphasis: profile.enduranceEmphasis,
    profile,
  };
}

/**
 * @param {number} trackDemand
 * @param {number} carValue
 */
export function getAttributeWeaknessPenalty(trackDemand, carValue) {
  const demand = Number(trackDemand ?? 0);
  const value = Number(carValue ?? 0);

  if (demand < 6.5 || value >= demand - 0.75) {
    return 0;
  }

  const gap = demand - value;
  return gap * gap * 0.85;
}
