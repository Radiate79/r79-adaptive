import {
  buildPitstopStrategyContext,
  resolvePitstopStrategyEvidence,
} from "../data/pitstopStrategyEvidence.js";
import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  getLapCountModifiers,
  resolveLapCount,
} from "../utils/raceDistance.js";

/** GT7 compound codes → display labels. */
export const COMPOUND_LABELS = {
  S: "Soft",
  M: "Medium",
  H: "Hard",
  IM: "Intermediate",
  W: "Wet",
};

/**
 * @typedef {Object} PitstopStrategyInput
 * @property {string} [gameVersion]
 * @property {string} carId
 * @property {string} trackId
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 * @property {number} [lapCount]
 */

/**
 * @typedef {Object} PitstopStrategyResult
 * @property {boolean} ready
 * @property {string} [message]
 * @property {string} [recommendedStrategy]
 * @property {number} [recommendedStops]
 * @property {number[]} [pitLaps]
 * @property {string} [pitLapsLabel]
 * @property {string} [tyreStrategy]
 * @property {string} [alternativeStrategy]
 * @property {number} [alternativeStops]
 * @property {number[]} [alternativePitLaps]
 * @property {string} [alternativeTyreStrategy]
 * @property {string} [confidence]
 * @property {number} [confidenceScore]
 * @property {string[]} [notes]
 * @property {Object} [breakdown]
 */

function clampLap(value, maxLaps) {
  return Math.max(1, Math.min(maxLaps - 1, Math.round(value)));
}

function formatStopLabel(stops) {
  if (stops <= 0) {
    return "No Stop";
  }

  if (stops === 1) {
    return "1 Stop";
  }

  return `${stops} Stop`;
}

function formatCompoundChain(compounds) {
  return compounds
    .map((code) => COMPOUND_LABELS[code] ?? code)
    .join(" → ");
}

function normalizeMultiplier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(10, Math.max(0, numeric));
}

/**
 * Estimate combined tyre + fuel stress for strategy planning.
 * @param {{ tyres?: number, fuel?: number }} car
 * @param {{ tyres?: number, fuel?: number }} track
 * @param {{ fuelMultiplier?: number, tyreMultiplier?: number, lapCount?: number }} settings
 */
export function calculateRaceWearProfile(car, track, settings = {}) {
  const laps = resolveLapCount({ lapCount: settings.lapCount });
  const lengthMods = getLapCountModifiers(laps);
  const fuelMultiplier = normalizeMultiplier(settings.fuelMultiplier);
  const tyreMultiplier = normalizeMultiplier(settings.tyreMultiplier);

  const carTyreRating = Math.max(1, Number(car?.tyres ?? 6));
  const carFuelRating = Math.max(1, Number(car?.fuel ?? 6));
  const trackTyreDemand = Number(track?.tyres ?? 5);
  const trackFuelDemand = Number(track?.fuel ?? 5);

  const tyreStress =
    (trackTyreDemand * Math.max(0.35, tyreMultiplier) * lengthMods.tyreWeight) /
    carTyreRating;
  const fuelStress =
    (trackFuelDemand * Math.max(0.35, fuelMultiplier) * lengthMods.fuelWeight) /
    carFuelRating;
  const combinedStress = tyreStress * 0.72 + fuelStress * 0.28;

  return {
    laps,
    tyreStress: Number(tyreStress.toFixed(2)),
    fuelStress: Number(fuelStress.toFixed(2)),
    combinedStress: Number(combinedStress.toFixed(2)),
    lengthMods,
  };
}

/**
 * @param {number} combinedStress
 * @param {number} laps
 * @param {number} tyreMultiplier
 */
function estimateStopCount(combinedStress, laps, tyreMultiplier) {
  if (laps <= 6 && combinedStress < 4.5 && tyreMultiplier <= 2) {
    return 0;
  }

  if (laps >= 28 || combinedStress >= 7.5 || (laps >= 20 && tyreMultiplier >= 6)) {
    return 2;
  }

  if (combinedStress >= 5.2 || laps >= 16 || tyreMultiplier >= 4) {
    return 1;
  }

  if (laps <= 10 && combinedStress < 5) {
    return 0;
  }

  return 1;
}

/**
 * @param {number} stops
 * @param {number} laps
 * @param {number} tyreStress
 */
function calculatePitLaps(stops, laps, tyreStress) {
  if (stops <= 0) {
    return [];
  }

  if (stops === 1) {
    const ratio = tyreStress >= 7 ? 0.48 : tyreStress >= 5.5 ? 0.52 : 0.55;
    return [clampLap(laps * ratio, laps)];
  }

  const firstStop = clampLap(laps * (tyreStress >= 7 ? 0.28 : 0.32), laps);
  const secondStop = clampLap(laps * (tyreStress >= 7 ? 0.62 : 0.68), laps);

  if (secondStop <= firstStop + 2) {
    return [firstStop, clampLap(firstStop + Math.round(laps * 0.35), laps)];
  }

  return [firstStop, secondStop];
}

/**
 * @param {number} stops
 * @param {number} tyreStress
 * @param {number} tyreMultiplier
 */
function buildCompoundPlan(stops, tyreStress, tyreMultiplier) {
  if (stops <= 0) {
    if (tyreMultiplier >= 4 || tyreStress >= 6) {
      return ["M"];
    }

    return ["S"];
  }

  if (stops === 1) {
    if (tyreMultiplier >= 5 || tyreStress >= 7) {
      return ["M", "H"];
    }

    if (tyreStress >= 5.5 || tyreMultiplier >= 3) {
      return ["S", "M"];
    }

    return ["S", "M"];
  }

  if (tyreMultiplier >= 6 || tyreStress >= 7.5) {
    return ["M", "M", "H"];
  }

  return ["S", "M", "H"];
}

/**
 * @param {number} primaryStops
 * @param {number} laps
 * @param {number} tyreStress
 */
function buildAlternativePlan(primaryStops, laps, tyreStress) {
  if (primaryStops === 0) {
    return {
      stops: 1,
      pitLaps: calculatePitLaps(1, laps, tyreStress + 0.8),
      compounds: buildCompoundPlan(1, tyreStress + 0.8, 3),
    };
  }

  if (primaryStops === 1) {
    return {
      stops: 2,
      pitLaps: calculatePitLaps(2, laps, tyreStress + 0.5),
      compounds: buildCompoundPlan(2, tyreStress + 0.5, 4),
    };
  }

  return {
    stops: 1,
    pitLaps: calculatePitLaps(1, laps, Math.max(4, tyreStress - 0.6)),
    compounds: buildCompoundPlan(1, Math.max(4, tyreStress - 0.6), 3),
  };
}

/**
 * @param {number} primaryStops
 * @param {number} alternativeStops
 * @param {number} combinedStress
 * @param {number} evidenceBonus
 */
function resolveConfidence(primaryStops, alternativeStops, combinedStress, evidenceBonus) {
  const stopGap = Math.abs(primaryStops - alternativeStops);
  const borderline = combinedStress >= 4.8 && combinedStress <= 6.2;

  let score = 72;

  if (stopGap >= 2) {
    score += 14;
  } else if (stopGap === 1) {
    score += 8;
  }

  if (!borderline) {
    score += 10;
  }

  if (combinedStress >= 7 || combinedStress <= 4) {
    score += 4;
  }

  score = Math.min(98, score + evidenceBonus);

  if (borderline && evidenceBonus < 5) {
    score = Math.min(score, 68);
  }

  let label = "Medium";
  if (score >= 82) {
    label = "High";
  } else if (score < 60) {
    label = "Low";
  }

  return { label, score };
}

/**
 * @param {PitstopStrategyInput} input
 * @returns {PitstopStrategyResult}
 */
export function analyzePitstopStrategy(input = {}) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const carId = String(input.carId ?? "").trim();
  const trackId = String(input.trackId ?? "").trim();

  if (!carId || !trackId) {
    return {
      ready: false,
      message: "Select a car and track to generate a pitstop strategy.",
    };
  }

  const car = getCarsForGame(gameVersion).find((entry) => entry.id === carId);
  const track = getTracksForGame(gameVersion).find((entry) => entry.id === trackId);

  if (!car || !track) {
    return {
      ready: false,
      message: "Selected car or track could not be found in the current game data.",
    };
  }

  const lapCount = resolveLapCount({ lapCount: input.lapCount });
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);

  const wear = calculateRaceWearProfile(car, track, {
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  });

  const evidenceContext = buildPitstopStrategyContext({
    trackId,
    carId,
    carClass: car.class,
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  });
  const evidence = resolvePitstopStrategyEvidence(evidenceContext);

  let recommendedStops = estimateStopCount(
    wear.combinedStress,
    wear.laps,
    tyreMultiplier,
  );

  if (evidence.stopAdjustment > 0 && evidence.matchedEntryId) {
    recommendedStops = evidence.stopAdjustment;
  }

  let pitLaps =
    evidence.pitLapAdjustments.length > 0 && evidence.matchedEntryId
      ? evidence.pitLapAdjustments.map((lap) => clampLap(lap, wear.laps))
      : calculatePitLaps(recommendedStops, wear.laps, wear.tyreStress);

  if (pitLaps.length !== recommendedStops && recommendedStops > 0) {
    pitLaps = calculatePitLaps(recommendedStops, wear.laps, wear.tyreStress);
  }

  const compounds = buildCompoundPlan(
    recommendedStops,
    wear.tyreStress,
    tyreMultiplier,
  );
  const tyreStrategy =
    evidence.tyreStrategyOverride ??
    formatCompoundChain(compounds);

  const alternative = buildAlternativePlan(
    recommendedStops,
    wear.laps,
    wear.tyreStress,
  );
  const confidence = resolveConfidence(
    recommendedStops,
    alternative.stops,
    wear.combinedStress,
    evidence.confidenceBonus,
  );

  /** @type {string[]} */
  const notes = [];

  if (wear.tyreStress >= wear.fuelStress + 1.5) {
    notes.push("Tyre wear is the limiting factor — prioritize stint length over fuel saving.");
  } else if (wear.fuelStress >= wear.tyreStress + 1.2) {
    notes.push("Fuel consumption may define pit timing — consider short-shifting and lift-and-coast.");
  }

  if (recommendedStops === 0 && lapCount >= 12) {
    notes.push("No-stop is aggressive at this distance — monitor tyre temperatures from lap six onward.");
  }

  if (evidence.matchedEntryId) {
    notes.push("ALR / community strategy evidence applied as a refinement layer.");
  }

  return {
    ready: true,
    recommendedStrategy: formatStopLabel(recommendedStops),
    recommendedStops,
    pitLaps,
    pitLapsLabel:
      pitLaps.length > 0 ? pitLaps.join(", ") : "No pit stop required",
    tyreStrategy,
    alternativeStrategy: formatStopLabel(alternative.stops),
    alternativeStops: alternative.stops,
    alternativePitLaps: alternative.pitLaps,
    alternativeTyreStrategy: formatCompoundChain(alternative.compounds),
    confidence: confidence.label,
    confidenceScore: confidence.score,
    notes,
    breakdown: {
      lapCount: wear.laps,
      tyreStress: wear.tyreStress,
      fuelStress: wear.fuelStress,
      combinedStress: wear.combinedStress,
      carTyres: car.tyres,
      carFuel: car.fuel,
      trackTyres: track.tyres,
      trackFuel: track.fuel,
      evidenceMatched: evidence.matchedEntryId,
    },
  };
}
