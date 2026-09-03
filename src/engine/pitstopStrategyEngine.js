import {
  buildPitstopStrategyContext,
  resolvePitstopStrategySignals,
} from "../data/pitstopStrategyEvidence.js";
import {
  getPitLaneCalendarEntry,
  getPitLaneLossLabel,
} from "../data/pitLaneLossDatabase.js";
import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  getLapCountModifiers,
  resolveLapCount,
} from "../utils/raceDistance.js";
import {
  buildRecommendationCacheKey,
  getCachedRecommendation,
  hasCachedRecommendation,
} from "./recommendationCache.js";
import { getAdvisorCacheVersionStamp, STRATEGY_ENGINE_VERSION } from "../data/advisorDataLayer.js";

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
 * @property {TyreStintInput[]} [stints] Optional user-defined stints (repeated compounds allowed)
 * @property {import("../data/driverProfile.js").DriverProfile} [driverProfile] Reserved
 * @property {import("../data/driverProfile.js").DriverCalibration} [driverCalibration] Reserved
 */

/**
 * @typedef {Object} TyreStintInput
 * @property {number} [stintNumber]
 * @property {string} compound Soft|Medium|Hard|S|M|H|IM|W
 * @property {number} [startLap]
 * @property {number} [endLap]
 * @property {number} [stintLength]
 */

/**
 * @typedef {Object} TyreStint
 * @property {number} stintNumber
 * @property {string} compound
 * @property {string} compoundCode
 * @property {number} startLap
 * @property {number} endLap
 * @property {number} stintLength
 * @property {number} [estimatedTyreLife]
 */

/**
 * @typedef {Object} StrategyCandidate
 * @property {number} stops
 * @property {TyreStint[]} stints
 * @property {number[]} pitLaps
 * @property {number} estimatedRaceTimeIndex
 * @property {string} label
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
 * @property {TyreStint[]} [stints]
 * @property {string} [alternativeStrategy]
 * @property {number} [alternativeStops]
 * @property {number[]} [alternativePitLaps]
 * @property {string} [alternativeTyreStrategy]
 * @property {TyreStint[]} [alternativeStints]
 * @property {StrategyCandidate[]} [comparedStrategies]
 * @property {string} [confidence]
 * @property {number} [confidenceScore]
 * @property {string} [pitLaneLoss]
 * @property {import("../data/pitstopStrategyEvidence.js").PitstopProvenStrategy[]} [provenStrategies]
 * @property {string[]} [notes]
 * @property {string[]} [validationErrors]
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

/**
 * @param {string} compound
 * @returns {string}
 */
export function normalizeCompoundCode(compound) {
  const raw = String(compound ?? "").trim().toUpperCase();
  if (raw === "SOFT" || raw === "S") return "S";
  if (raw === "MEDIUM" || raw === "M") return "M";
  if (raw === "HARD" || raw === "H") return "H";
  if (raw === "INTERMEDIATE" || raw === "IM") return "IM";
  if (raw === "WET" || raw === "W") return "W";
  return raw || "M";
}

/**
 * Relative compound pace index (lower is faster). Modelled estimate.
 * @param {string} code
 */
function compoundPaceIndex(code) {
  switch (normalizeCompoundCode(code)) {
    case "S":
      return 0.985;
    case "M":
      return 1;
    case "H":
      return 1.018;
    case "IM":
      return 1.04;
    case "W":
      return 1.06;
    default:
      return 1;
  }
}

/**
 * Estimated tyre life in laps for a compound under wear stress.
 *
 * Calibrated against real-world GT7 ALR race evidence:
 *   Ferrari 296 GT3 / Laguna Seca / 29 laps / tyreMultiplier x5 / tyreStress ≈ 5
 *   → Soft ≈ 10-11 laps, Medium ≈ 19-20 laps (observed by experienced drivers)
 *
 * Base values represent estimated laps at tyreMultiplier x1 and neutral stress (5).
 * The wear divisor uses a square-root scaling on the multiplier so that higher
 * multipliers erode life more gently than a direct ratio — matching observed data.
 *
 * @param {string} code
 * @param {number} tyreMultiplier
 * @param {number} tyreStress   0–10 scale from calculateRaceWearProfile
 * @param {number} totalLaps
 */
function estimateTyreLife(code, tyreMultiplier, tyreStress, totalLaps) {
  if (tyreMultiplier === 0) {
    return totalLaps;
  }

  // Base laps at x1 / neutral stress (stress=5).
  // Calibrated against ALR evidence:
  //   Ferrari 296 GT3 / Laguna Seca / x5 wear / stress≈5 → S≈10-11L, M≈19-20L
  // At x5/stress=5: divisor = sqrt(5) × 1.0 ≈ 2.236
  //   S: 24 / 2.236 ≈ 10.7 ✓   M: 44 / 2.236 ≈ 19.7 ✓   H: 72 / 2.236 ≈ 32 (realistic)
  const base =
    normalizeCompoundCode(code) === "S"
      ? 24
      : normalizeCompoundCode(code) === "H"
        ? 72
        : 44;

  // Stress factor: neutral stress is 5 (mid-range).  Below 5 → longer life, above → shorter.
  const stressFactor = Math.max(0.5, tyreStress / 5);

  // Multiplier scaling: sqrt gives a gentler curve than linear.
  // At x1: sqrt(1/1)=1.  At x5: sqrt(5/1)≈2.24.  At x10: sqrt(10)≈3.16.
  const multFactor = Math.sqrt(Math.max(1, tyreMultiplier));

  const life = base / (stressFactor * multFactor);
  return Math.max(3, Math.round(life));
}

/**
 * Build structured stints from stop count + compound plan.
 * Repeated compounds are allowed.
 *
 * @param {string[]} compounds
 * @param {number[]} pitLaps
 * @param {number} totalLaps
 * @param {number} tyreMultiplier
 * @param {number} tyreStress
 * @returns {TyreStint[]}
 */
export function buildStintsFromPlan(
  compounds,
  pitLaps,
  totalLaps,
  tyreMultiplier,
  tyreStress,
) {
  const boundaries = [1, ...pitLaps.map((lap) => lap + 1), totalLaps + 1];
  const stints = [];

  for (let i = 0; i < compounds.length; i += 1) {
    const startLap = boundaries[i] ?? 1;
    const endLap = Math.min(totalLaps, (boundaries[i + 1] ?? totalLaps + 1) - 1);
    if (endLap < startLap) {
      continue;
    }
    const code = normalizeCompoundCode(compounds[i]);
    stints.push({
      stintNumber: i + 1,
      compound: COMPOUND_LABELS[code] ?? code,
      compoundCode: code,
      startLap,
      endLap,
      stintLength: endLap - startLap + 1,
      estimatedTyreLife: estimateTyreLife(
        code,
        tyreMultiplier,
        tyreStress,
        totalLaps,
      ),
    });
  }

  return stints;
}

/**
 * Validate user-defined stints. Repeated compounds are allowed.
 *
 * @param {TyreStintInput[]} stints
 * @param {number} totalLaps
 * @returns {{ valid: boolean, errors: string[], normalized: TyreStint[] }}
 */
export function validateTyreStints(stints, totalLaps) {
  /** @type {string[]} */
  const errors = [];
  if (!Array.isArray(stints) || stints.length === 0) {
    return { valid: false, errors: ["At least one stint is required."], normalized: [] };
  }

  const laps = Math.max(1, Number(totalLaps) || 0);
  /** @type {TyreStint[]} */
  const normalized = [];
  let expectedStart = 1;

  stints.forEach((stint, index) => {
    const code = normalizeCompoundCode(stint.compound);
    let startLap = Number(stint.startLap);
    let endLap = Number(stint.endLap);
    const length = Number(stint.stintLength);

    if (!Number.isFinite(startLap) || startLap < 1) {
      startLap = expectedStart;
    }
    if ((!Number.isFinite(endLap) || endLap < startLap) && Number.isFinite(length) && length > 0) {
      endLap = startLap + Math.round(length) - 1;
    }
    if (!Number.isFinite(endLap)) {
      endLap = laps;
    }

    startLap = Math.round(startLap);
    endLap = Math.round(endLap);

    if (endLap < startLap) {
      errors.push(`Stint ${index + 1}: end lap must be after start lap.`);
    }
    if (startLap !== expectedStart) {
      errors.push(
        `Stint ${index + 1}: starts at lap ${startLap}, expected lap ${expectedStart} (no gaps/overlaps).`,
      );
    }
    if (startLap < 1 || endLap > laps) {
      errors.push(`Stint ${index + 1}: laps must be within 1–${laps}.`);
    }

    normalized.push({
      stintNumber: index + 1,
      compound: COMPOUND_LABELS[code] ?? code,
      compoundCode: code,
      startLap,
      endLap,
      stintLength: endLap - startLap + 1,
    });
    expectedStart = endLap + 1;
  });

  const covered = normalized.reduce((sum, stint) => sum + stint.stintLength, 0);
  if (covered !== laps && errors.length === 0) {
    errors.push(
      `Stint lengths cover ${covered} laps but race distance is ${laps} laps.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
  };
}

/**
 * Relative estimated race time index — lower is better.
 * Purely calculated from stop count, compound pace, degradation and pit loss.
 *
 * @param {{
 *   stops: number,
 *   compounds: string[],
 *   pitLaps: number[],
 *   totalLaps: number,
 *   tyreMultiplier: number,
 *   fuelMultiplier: number,
 *   tyreStress: number,
 *   pitLossSeconds?: number,
 * }} plan
 */
export function estimateStrategyTimeIndex(plan) {
  const {
    stops,
    compounds,
    totalLaps,
    tyreMultiplier,
    fuelMultiplier,
    tyreStress,
    pitLossSeconds = 22,
  } = plan;

  let driving = 0;
  const stints = buildStintsFromPlan(
    compounds,
    plan.pitLaps,
    totalLaps,
    tyreMultiplier,
    tyreStress,
  );

  stints.forEach((stint) => {
    const pace = compoundPaceIndex(stint.compoundCode);
    const wearPenalty =
      tyreMultiplier === 0
        ? 0
        : Math.max(0, stint.stintLength - (stint.estimatedTyreLife ?? stint.stintLength)) *
          0.35 *
          tyreMultiplier;
    driving += stint.stintLength * pace + wearPenalty;
  });

  const fuelPenalty =
    fuelMultiplier === 0 ? 0 : (fuelMultiplier / 10) * totalLaps * 0.02;
  const pitPenalty = stops * (pitLossSeconds / 90);

  return Number((driving + fuelPenalty + pitPenalty).toFixed(3));
}

/**
 * Return all viable compound permutations for a given stop count.
 * Repeated compounds are supported — e.g. M/M, S/S.
 *
 * @param {number} stops
 * @param {number} tyreMultiplier
 * @returns {string[][]}
 */
function buildCompoundPermutations(stops, tyreMultiplier) {
  const stintCount = stops + 1;

  // When wear is disabled there is no degradation pressure — only one compound needed.
  if (tyreMultiplier === 0) {
    return [["M"], ["S"], ["H"]].slice(0, 1);
  }

  const dryCompounds = ["S", "M", "H"];

  if (stintCount === 1) {
    return dryCompounds.map((c) => [c]);
  }

  if (stintCount === 2) {
    /** @type {string[][]} */
    const pairs = [];
    for (const c1 of dryCompounds) {
      for (const c2 of dryCompounds) {
        pairs.push([c1, c2]);
      }
    }
    return pairs;
  }

  if (stintCount === 3) {
    /** @type {string[][]} */
    const triples = [];
    for (const c1 of dryCompounds) {
      for (const c2 of dryCompounds) {
        for (const c3 of dryCompounds) {
          triples.push([c1, c2, c3]);
        }
      }
    }
    return triples;
  }

  // 3-stop (4 stints): limit to combinations that are physically sensible
  /** @type {string[][]} */
  const quads = [];
  for (const c1 of dryCompounds) {
    for (const c2 of dryCompounds) {
      quads.push([c1, c2, "M", "H"]);
      quads.push([c1, "M", c2, "H"]);
    }
  }
  return quads;
}

/**
 * Find the optimal pit lap(s) for a fixed compound sequence by minimising
 * estimated race time across a sensible range of split points.
 *
 * @param {string[]} compounds
 * @param {number} stops
 * @param {number} totalLaps
 * @param {number} tyreMultiplier
 * @param {number} fuelMultiplier
 * @param {number} tyreStress
 * @returns {{ pitLaps: number[], timeIndex: number }}
 */
function optimisePitLaps(compounds, stops, totalLaps, tyreMultiplier, fuelMultiplier, tyreStress) {
  if (stops === 0) {
    const timeIndex = estimateStrategyTimeIndex({
      stops: 0,
      compounds,
      pitLaps: [],
      totalLaps,
      tyreMultiplier,
      fuelMultiplier,
      tyreStress,
    });
    return { pitLaps: [], timeIndex };
  }

  // For a 1-stop, scan pit lap from 30% to 70% of race distance.
  if (stops === 1) {
    const lo = Math.max(1, Math.round(totalLaps * 0.3));
    const hi = Math.min(totalLaps - 1, Math.round(totalLaps * 0.7));
    let best = Infinity;
    let bestLap = Math.round(totalLaps * 0.5);
    for (let lap = lo; lap <= hi; lap += 1) {
      const t = estimateStrategyTimeIndex({
        stops: 1,
        compounds,
        pitLaps: [lap],
        totalLaps,
        tyreMultiplier,
        fuelMultiplier,
        tyreStress,
      });
      if (t < best) {
        best = t;
        bestLap = lap;
      }
    }
    return { pitLaps: [bestLap], timeIndex: best };
  }

  // For 2-stop, scan first pit from 25%–50% and second from 55%–80% in coarser steps.
  if (stops === 2) {
    const lo1 = Math.max(1, Math.round(totalLaps * 0.25));
    const hi1 = Math.round(totalLaps * 0.5);
    const lo2 = Math.round(totalLaps * 0.55);
    const hi2 = Math.min(totalLaps - 1, Math.round(totalLaps * 0.8));
    let best = Infinity;
    let bestLaps = [Math.round(totalLaps * 0.33), Math.round(totalLaps * 0.66)];
    for (let lap1 = lo1; lap1 <= hi1; lap1 += 2) {
      for (let lap2 = Math.max(lap1 + 3, lo2); lap2 <= hi2; lap2 += 2) {
        const t = estimateStrategyTimeIndex({
          stops: 2,
          compounds,
          pitLaps: [lap1, lap2],
          totalLaps,
          tyreMultiplier,
          fuelMultiplier,
          tyreStress,
        });
        if (t < best) {
          best = t;
          bestLaps = [lap1, lap2];
        }
      }
    }
    return { pitLaps: bestLaps, timeIndex: best };
  }

  // Fallback for 3+ stops
  const pitLaps = calculatePitLaps(stops, totalLaps, tyreStress);
  const timeIndex = estimateStrategyTimeIndex({
    stops,
    compounds,
    pitLaps,
    totalLaps,
    tyreMultiplier,
    fuelMultiplier,
    tyreStress,
  });
  return { pitLaps, timeIndex };
}

/**
 * Whether a compound sequence is feasible given tyre life and race distance.
 * Tyre life is a constraint not a ranking criterion.
 *
 * @param {string[]} compounds
 * @param {number[]} pitLaps
 * @param {number} totalLaps
 * @param {number} tyreMultiplier
 * @param {number} tyreStress
 */
function isCompoundSequenceFeasible(compounds, pitLaps, totalLaps, tyreMultiplier, tyreStress) {
  if (tyreMultiplier === 0) {
    return true; // no degradation constraint
  }

  const stints = buildStintsFromPlan(compounds, pitLaps, totalLaps, tyreMultiplier, tyreStress);
  for (const stint of stints) {
    const life = stint.estimatedTyreLife ?? totalLaps;
    // Allow up to 40% over estimated life — model is approximate
    if (stint.stintLength > life * 1.4) {
      return false;
    }
  }
  return true;
}

/**
 * Compare all viable compound combinations across feasible stop counts.
 * Tyre life is a feasibility constraint. Total estimated race time determines ranking.
 *
 * @param {{
 *   totalLaps: number,
 *   tyreMultiplier: number,
 *   fuelMultiplier: number,
 *   tyreStress: number,
 *   combinedStress: number,
 * }} context
 * @returns {StrategyCandidate[]}
 */
export function compareStrategyCandidates(context) {
  const {
    totalLaps,
    tyreMultiplier,
    fuelMultiplier,
    tyreStress,
    combinedStress,
  } = context;

  /** @type {number[]} */
  const stopOptions = [];
  if (tyreMultiplier === 0 && fuelMultiplier === 0) {
    stopOptions.push(0);
  } else {
    stopOptions.push(0, 1, 2);
    if (totalLaps >= 28 && tyreMultiplier >= 6) {
      stopOptions.push(3);
    }
  }

  const viableStops = [...new Set(stopOptions)].filter((stops) => {
    if (stops === 0 && (combinedStress >= 6.5 || (tyreMultiplier >= 5 && totalLaps >= 16))) {
      return tyreMultiplier === 0;
    }
    return true;
  });

  /** @type {StrategyCandidate[]} */
  const candidates = [];

  for (const stops of viableStops) {
    const permutations = buildCompoundPermutations(stops, tyreMultiplier);

    // Best time tracker so each unique compound sequence gets its own candidate
    /** @type {Map<string, StrategyCandidate>} */
    const bestPerSequence = new Map();

    for (const compounds of permutations) {
      const { pitLaps, timeIndex } = optimisePitLaps(
        compounds,
        stops,
        totalLaps,
        tyreMultiplier,
        fuelMultiplier,
        tyreStress,
      );

      // Skip infeasible sequences (tyre life constraint)
      if (!isCompoundSequenceFeasible(compounds, pitLaps, totalLaps, tyreMultiplier, tyreStress)) {
        continue;
      }

      const sequenceKey = compounds.join("/");
      const existing = bestPerSequence.get(sequenceKey);
      if (!existing || timeIndex < existing.estimatedRaceTimeIndex) {
        const stints = buildStintsFromPlan(compounds, pitLaps, totalLaps, tyreMultiplier, tyreStress);
        bestPerSequence.set(sequenceKey, {
          stops,
          stints,
          pitLaps,
          estimatedRaceTimeIndex: timeIndex,
          label: `${formatStopLabel(stops)} · ${formatCompoundChain(compounds)}`,
        });
      }
    }

    candidates.push(...bestPerSequence.values());
  }

  // Sort by estimated race time — fastest first. Tyre life has already been used as feasibility gate.
  candidates.sort((a, b) => a.estimatedRaceTimeIndex - b.estimatedRaceTimeIndex);

  return candidates;
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
    tyreMultiplier === 0
      ? 0
      : (trackTyreDemand * tyreMultiplier * lengthMods.tyreWeight) /
        carTyreRating;
  const fuelStress =
    fuelMultiplier === 0
      ? 0
      : (trackFuelDemand * fuelMultiplier * lengthMods.fuelWeight) /
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
 * @param {number} [fuelMultiplier=0]
 */
function estimateStopCount(combinedStress, laps, tyreMultiplier, fuelMultiplier = 0) {
  if (tyreMultiplier === 0) {
    if (fuelMultiplier === 0 || combinedStress <= 0) {
      return 0;
    }

    if (laps >= 28 && fuelMultiplier >= 5 && combinedStress >= 3.5) {
      return 1;
    }

    return 0;
  }

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
  const cacheKey = buildRecommendationCacheKey("pitstop-strategy", {
    ...getAdvisorCacheVersionStamp(),
    strategyEngineVersion: STRATEGY_ENGINE_VERSION,
    gameVersion: input.gameVersion ?? DEFAULT_GAME_VERSION,
    carId: input.carId ?? "",
    trackId: input.trackId ?? "",
    fuelMultiplier: input.fuelMultiplier ?? 0,
    tyreMultiplier: input.tyreMultiplier ?? 0,
    lapCount: input.lapCount ?? null,
    stints: input.stints ?? null,
  });
  const fromCache = hasCachedRecommendation(cacheKey);

  const result = getCachedRecommendation(cacheKey, () =>
    computePitstopStrategy(input),
  );

  return { ...result, fromCache };
}

/**
 * @param {PitstopStrategyInput} input
 * @returns {PitstopStrategyResult}
 */
function computePitstopStrategy(input = {}) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const carId = String(input.carId ?? "").trim();
  const trackId = String(input.trackId ?? "").trim();

  if (!carId || !trackId) {
    return {
      ready: false,
      message: "Select a car and track, then press Calculate Strategy.",
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

  /** @type {string[]} */
  const validationErrors = [];
  let userStints = null;
  if (Array.isArray(input.stints) && input.stints.length > 0) {
    const validated = validateTyreStints(input.stints, wear.laps);
    if (!validated.valid) {
      validationErrors.push(...validated.errors);
    } else {
      userStints = validated.normalized;
    }
  }

  const evidenceContext = buildPitstopStrategyContext({
    trackId,
    carId,
    carClass: car.class,
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  });
  const evidence = resolvePitstopStrategySignals(evidenceContext);
  const pitLaneEntry = getPitLaneCalendarEntry(trackId, {
    season: 23,
    carClass: car.class,
  });
  const pitLaneLoss = getPitLaneLossLabel(trackId, {
    season: 23,
    carClass: car.class,
  });

  const comparedStrategies = compareStrategyCandidates({
    totalLaps: wear.laps,
    tyreMultiplier,
    fuelMultiplier,
    tyreStress: wear.tyreStress,
    combinedStress: wear.combinedStress,
  });

  let recommendedStops = estimateStopCount(
    wear.combinedStress,
    wear.laps,
    tyreMultiplier,
    fuelMultiplier,
  );

  if (evidence.stopAdjustment > 0 && evidence.matchedEntryId) {
    recommendedStops = evidence.stopAdjustment;
  }

  // Prefer mathematically best candidate when close, unless evidence overrides.
  if (!evidence.matchedEntryId && comparedStrategies.length > 0) {
    recommendedStops = comparedStrategies[0].stops;
  }

  // Use the best-ranked candidate matching the recommended stop count.
  const bestCandidate = comparedStrategies.find((c) => c.stops === recommendedStops);

  let pitLaps =
    evidence.pitLapAdjustments.length > 0 && evidence.matchedEntryId
      ? evidence.pitLapAdjustments.map((lap) => clampLap(lap, wear.laps))
      : (bestCandidate?.pitLaps ?? calculatePitLaps(recommendedStops, wear.laps, wear.tyreStress));

  if (pitLaps.length !== recommendedStops && recommendedStops > 0) {
    pitLaps = calculatePitLaps(recommendedStops, wear.laps, wear.tyreStress);
  }

  const compounds =
    bestCandidate
      ? bestCandidate.stints.map((s) => s.compoundCode)
      : buildCompoundPlan(recommendedStops, wear.tyreStress, tyreMultiplier);

  const stints =
    userStints ??
    (bestCandidate?.stints ?? buildStintsFromPlan(
      compounds,
      pitLaps,
      wear.laps,
      tyreMultiplier,
      wear.tyreStress,
    ));

  const tyreStrategy =
    evidence.tyreStrategyOverride ??
    formatCompoundChain(stints.map((stint) => stint.compoundCode));

  // Alternative: best candidate with different compound sequence or stop count.
  const alternative =
    comparedStrategies.find(
      (candidate) =>
        candidate !== bestCandidate &&
        (candidate.stops !== recommendedStops ||
          candidate.label !== (bestCandidate?.label ?? "")),
    ) ??
    buildAlternativePlan(recommendedStops, wear.laps, wear.tyreStress);

  const alternativeStints =
    "stints" in alternative && Array.isArray(alternative.stints)
      ? alternative.stints
      : buildStintsFromPlan(
          alternative.compounds ??
            buildCompoundPlan(alternative.stops, wear.tyreStress, tyreMultiplier),
          alternative.pitLaps,
          wear.laps,
          tyreMultiplier,
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

  if (tyreMultiplier === 0 && fuelMultiplier === 0) {
    notes.push(
      "Tyre and fuel multipliers are x0 — no degradation- or fuel-driven stops are required.",
    );
  } else if (tyreMultiplier === 0) {
    notes.push("Tyre wear disabled — stop decisions ignore tyre degradation.");
  } else if (fuelMultiplier === 0) {
    notes.push("Fuel consumption disabled — no refuelling stops from fuel use.");
  }

  if (wear.tyreStress >= wear.fuelStress + 1.5) {
    notes.push("Tyre wear is the limiting factor — prioritize stint length over fuel saving.");
  } else if (wear.fuelStress >= wear.tyreStress + 1.2) {
    notes.push("Fuel consumption may define pit timing — consider short-shifting and lift-and-coast.");
  }

  if (recommendedStops === 0 && lapCount >= 12 && tyreMultiplier > 0) {
    notes.push("No-stop is aggressive at this distance — monitor tyre temperatures from lap six onward.");
  }

  if (stints.some((stint, index) =>
    stints.slice(index + 1).some((other) => other.compoundCode === stint.compoundCode),
  )) {
    notes.push("Repeated compounds are allowed — same compound may appear in multiple stints.");
  }

  if (evidence.matchedEntryId) {
    notes.push("ALR / community strategy evidence applied as a refinement layer.");
  }

  if (pitLaneEntry?.strategyNotes?.length) {
    notes.push(...pitLaneEntry.strategyNotes);
  }

  for (const proven of evidence.provenStrategies ?? []) {
    notes.push(
      `${proven.raceLabel}: ${proven.recommendedStops} stop — ${proven.tyreStrategy} (pit lap ${proven.pitLap}). Source: ${proven.source}.`,
    );
  }

  const provenConfidence = evidence.provenStrategies?.[0]?.confidence;
  const displayConfidence =
    provenConfidence && evidence.provenStrategies?.length
      ? provenConfidence
      : confidence.label;

  return {
    ready: validationErrors.length === 0,
    message:
      validationErrors.length > 0
        ? validationErrors[0]
        : undefined,
    recommendedStrategy: formatStopLabel(recommendedStops),
    recommendedStops,
    pitLaps,
    pitLapsLabel:
      pitLaps.length > 0 ? pitLaps.join(", ") : "No pit stop required",
    tyreStrategy,
    stints,
    alternativeStrategy: formatStopLabel(alternative.stops),
    alternativeStops: alternative.stops,
    alternativePitLaps: alternative.pitLaps,
    alternativeTyreStrategy: formatCompoundChain(
      alternativeStints.map((stint) => stint.compoundCode),
    ),
    alternativeStints,
    comparedStrategies,
    confidence: displayConfidence,
    confidenceScore: confidence.score,
    pitLaneLoss,
    provenStrategies: evidence.provenStrategies ?? [],
    notes,
    validationErrors,
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
      pitLaneLossStatus: pitLaneEntry?.status ?? "TBC",
      estimatedRaceTimeIndex: estimateStrategyTimeIndex({
        stops: recommendedStops,
        compounds: stints.map((stint) => stint.compoundCode),
        pitLaps,
        totalLaps: wear.laps,
        tyreMultiplier,
        fuelMultiplier,
        tyreStress: wear.tyreStress,
      }),
    },
  };
}
