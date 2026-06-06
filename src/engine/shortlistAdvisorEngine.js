import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import {
  analyzeDrivetrainSuitability,
  scoreCarConsistency,
  scoreCarForChampionship,
} from "./championshipEngine.js";
import { getALRResultScore } from "./alrPerformanceEngine.js";
import { loadALRRecords } from "../utils/alrStorage.js";

/** @typedef {'Low' | 'Medium' | 'High'} AvailabilityRisk */

/**
 * @typedef {Object} ShortlistAdvisorInput
 * @property {number} tier
 * @property {string} [carClass]
 * @property {string} [teamName]
 * @property {string} [driver1]
 * @property {string} [driver2]
 * @property {string[]} [trackIds]
 * @property {{ fuelMultiplier?: number, tyreMultiplier?: number }} [raceSettings]
 * @property {import("../data/gameVersions.js").GameVersion} [gameVersion]
 */

const SLOT_PROFILES = [
  {
    rank: 1,
    label: "Anchor pick",
    weights: {
      performance: 0.32,
      alr: 0.22,
      consistency: 0.22,
      drivetrain: 0.12,
      fallback: 0.07,
      availabilityPenalty: 0.05,
    },
    whyLead:
      "Primary team choice — strongest blend of championship pace, ALR pedigree, and calendar coverage.",
  },
  {
    rank: 2,
    label: "Contender",
    weights: {
      performance: 0.28,
      alr: 0.2,
      consistency: 0.22,
      drivetrain: 0.1,
      fallback: 0.1,
      availabilityPenalty: 0.16,
    },
    whyLead:
      "Strong second choice if the anchor is taken — still competitive with slightly lower demand risk.",
  },
  {
    rank: 3,
    label: "Versatile option",
    weights: {
      performance: 0.2,
      alr: 0.16,
      consistency: 0.3,
      drivetrain: 0.1,
      fallback: 0.14,
      availabilityPenalty: 0.2,
    },
    whyLead:
      "Balanced insurance pick — prioritises cross-track consistency over raw peak pace.",
  },
  {
    rank: 4,
    label: "Insurance",
    weights: {
      performance: 0.16,
      alr: 0.12,
      consistency: 0.28,
      drivetrain: 0.08,
      fallback: 0.26,
      availabilityPenalty: 0.22,
    },
    whyLead:
      "Reliable mid-list option when popular meta cars are already claimed.",
  },
  {
    rank: 5,
    label: "Fallback",
    weights: {
      performance: 0.12,
      alr: 0.1,
      consistency: 0.24,
      drivetrain: 0.06,
      fallback: 0.38,
      availabilityPenalty: 0.28,
    },
    whyLead:
      "Deep fallback — chosen for availability safety and dependable floor performance.",
  },
];

const DRIVER_STYLE_WEIGHTS = {
  "Smooth Driver": { consistency: 0.04, availabilityPenalty: -0.02 },
  "Aggressive Driver": { performance: 0.05, consistency: -0.02 },
  "Tyre Saver": { consistency: 0.05, fallback: 0.02 },
  "Fuel Saver": { consistency: 0.03, fallback: 0.03 },
  "Qualifying Specialist": { performance: 0.05, availabilityPenalty: 0.02 },
};

function normalizeClass(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isCarInClass(car, carClass) {
  if (!carClass) {
    return true;
  }

  const requestedClass = normalizeClass(carClass);
  const carClassFields = [
    car.class,
    car.carClass,
    car.category,
    car.group,
    car.name,
  ].map(normalizeClass);

  return carClassFields.some((value) => value.includes(requestedClass));
}

function resolveTracks(trackIds, gameVersion = DEFAULT_GAME_VERSION) {
  const tracks = getTracksForGame(gameVersion);

  if (Array.isArray(trackIds) && trackIds.length > 0) {
    return trackIds
      .map((trackId) => tracks.find((track) => track.id === trackId) ?? null)
      .filter(Boolean);
  }

  return [...tracks];
}

/**
 * @param {number[]} values
 */
function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return values.map(() => 0.5);
  }

  return values.map((value) => (value - min) / (max - min));
}

/**
 * @param {string} carId
 * @param {number} tier
 */
function getCarTierALRHistoricalScore(carId, tier) {
  const records = loadALRRecords().filter(
    (record) =>
      record.car === carId &&
      record.tier === tier &&
      record.season >= ALR_HISTORICAL_SEASON_FROM &&
      record.season <= ALR_HISTORICAL_SEASON_TO,
  );

  if (records.length === 0) {
    return 0;
  }

  const score = records.reduce(
    (sum, record) => sum + getALRResultScore(record),
    0,
  );

  return Number(score.toFixed(2));
}

/**
 * @param {Record<string, number>} weights
 */
function normalizeWeightProfile(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return weights;
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / total]),
  );
}

/**
 * @param {typeof SLOT_PROFILES[number]['weights']} baseWeights
 * @param {string[]} driverStyles
 */
function applyDriverStyleWeights(baseWeights, driverStyles) {
  const adjusted = { ...baseWeights };

  for (const style of driverStyles) {
    const modifiers = DRIVER_STYLE_WEIGHTS[style];
    if (!modifiers) {
      continue;
    }

    for (const [key, delta] of Object.entries(modifiers)) {
      adjusted[key] = (adjusted[key] ?? 0) + delta;
    }
  }

  for (const key of Object.keys(adjusted)) {
    adjusted[key] = Math.max(0, adjusted[key]);
  }

  return normalizeWeightProfile(adjusted);
}

/**
 * @param {number} popularityIndex
 * @returns {AvailabilityRisk}
 */
function getAvailabilityRisk(popularityIndex) {
  if (popularityIndex >= 0.72) {
    return "High";
  }
  if (popularityIndex >= 0.42) {
    return "Medium";
  }
  return "Low";
}

/**
 * @param {number} popularityIndex
 * @param {AvailabilityRisk} risk
 */
function getAvailabilityPenalty(popularityIndex, risk) {
  if (risk === "High") {
    return 0.75 + popularityIndex * 0.25;
  }
  if (risk === "Medium") {
    return 0.35 + popularityIndex * 0.2;
  }
  return popularityIndex * 0.15;
}

/**
 * @param {{
 *   performanceNorm: number,
 *   consistencyNorm: number,
 *   popularityIndex: number,
 * }} metrics
 */
function getFallbackScore(metrics) {
  return (
    metrics.consistencyNorm * 0.45 +
    (1 - metrics.popularityIndex) * 0.35 +
    metrics.performanceNorm * 0.2
  );
}

/**
 * @param {import("../data/cars.js").Car} car
 * @param {ReturnType<typeof buildCarMetrics>} metrics
 * @param {typeof SLOT_PROFILES[number]} slot
 * @param {number} rank
 */
function buildWhyThisPosition(car, metrics, slot, rank) {
  const reasons = [slot.whyLead];

  if (metrics.performanceScore >= 85) {
    reasons.push("Strong championship performance across the calendar.");
  } else if (metrics.performanceScore >= 75) {
    reasons.push("Solid championship pace without being the obvious meta pick.");
  }

  if (metrics.alrHistoricalScore > 0) {
    reasons.push(
      `Proven ALR Tier ${metrics.tier} history (${metrics.alrHistoricalScore.toFixed(1)} historical score).`,
    );
  } else {
    reasons.push("Limited ALR history at this tier — pick based on raw pace and consistency.");
  }

  if (metrics.consistencyScore >= 70) {
    reasons.push("High consistency score — dependable across different track types.");
  }

  if (metrics.drivetrainFitScore >= 75) {
    reasons.push(`${car.drivetrain} drivetrain fits the current calendar profile.`);
  }

  if (metrics.availabilityRisk === "High" && rank <= 2) {
    reasons.push("List early — this is a likely popular choice with other teams.");
  }

  if (metrics.availabilityRisk === "Low" && rank >= 3) {
    reasons.push("Lower demand risk improves the chance this car survives the allocation process.");
  }

  return reasons.join(" ");
}

/**
 * @param {ReturnType<typeof buildCarMetrics>} metrics
 * @param {number} rank
 */
function buildFallbackNotes(metrics, rank) {
  if (rank >= 4 && metrics.availabilityRisk === "Low") {
    return "Strong late-list safety net — less likely to be blocked by rival teams.";
  }

  if (rank >= 4 && metrics.availabilityRisk === "Medium") {
    return "Reasonable backup if top picks are taken; moderate chance of still being available.";
  }

  if (rank === 5) {
    return "Designed as the deepest fallback — prioritises availability and a dependable performance floor.";
  }

  if (metrics.availabilityRisk === "High") {
    return "High-demand car — treat as an aspirational pick and ensure lower ranks cover availability risk.";
  }

  if (metrics.consistencyScore >= 72) {
    return "Consistency-led fallback value if faster but riskier options disappear.";
  }

  return "Balanced fallback if earlier shortlist cars are unavailable.";
}

/**
 * @param {import("../data/cars.js").Car} car
 * @param {ShortlistAdvisorInput} input
 * @param {ReturnType<typeof resolveTracks>} championshipTracks
 * @param {ReturnType<typeof analyzeDrivetrainSuitability>} drivetrainRankings
 */
function buildCarMetrics(car, input, championshipTracks, drivetrainRankings) {
  const raceSettings = input.raceSettings ?? {};
  const performanceScore = scoreCarForChampionship(
    car,
    championshipTracks,
    raceSettings,
  );
  const consistencyScore = scoreCarConsistency(
    car,
    championshipTracks,
    raceSettings,
  );
  const alrHistoricalScore = getCarTierALRHistoricalScore(car.id, input.tier);
  const drivetrainFitScore =
    drivetrainRankings.find((entry) => entry.drivetrain === car.drivetrain)
      ?.score ?? 50;

  return {
    tier: input.tier,
    performanceScore,
    consistencyScore,
    alrHistoricalScore,
    drivetrainFitScore,
    performanceNorm: 0,
    consistencyNorm: 0,
    alrNorm: 0,
    drivetrainNorm: 0,
    fallbackNorm: 0,
    popularityIndex: 0,
    availabilityRisk: /** @type {AvailabilityRisk} */ ("Low"),
    fallbackScore: 0,
  };
}

/**
 * @param {ReturnType<typeof buildCarMetrics>} metrics
 * @param {typeof SLOT_PROFILES[number]} slot
 * @param {Record<string, number>} weights
 * @param {Set<string>} pickedDrivetrains
 */
function scoreForSlot(metrics, slot, weights, pickedDrivetrains) {
  const availabilityPenalty = getAvailabilityPenalty(
    metrics.popularityIndex,
    metrics.availabilityRisk,
  );
  let score =
    metrics.performanceNorm * weights.performance +
    metrics.alrNorm * weights.alr +
    metrics.consistencyNorm * weights.consistency +
    metrics.drivetrainNorm * weights.drivetrain +
    metrics.fallbackNorm * weights.fallback -
    availabilityPenalty * weights.availabilityPenalty;

  if (pickedDrivetrains.size > 0 && pickedDrivetrains.has(metrics.drivetrain)) {
    score -= 0.04;
  }

  return score;
}

/**
 * @param {ShortlistAdvisorInput} input
 */
export function recommendTeamCarShortlist(input) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const carClass = input.carClass ?? "Gr.3";
  const championshipTracks = resolveTracks(input.trackIds, gameVersion);
  const drivetrainRankings = analyzeDrivetrainSuitability(championshipTracks);
  const driverStyles = [input.driver1, input.driver2].filter(Boolean);
  const candidates = getCarsForGame(gameVersion)
    .filter((car) => isCarInClass(car, carClass))
    .map((car) => ({
      car,
      metrics: buildCarMetrics(
        car,
        input,
        championshipTracks,
        drivetrainRankings,
      ),
    }));

  if (candidates.length === 0) {
    return [];
  }

  const performanceValues = candidates.map(
    (entry) => entry.metrics.performanceScore,
  );
  const consistencyValues = candidates.map(
    (entry) => entry.metrics.consistencyScore,
  );
  const alrValues = candidates.map((entry) => entry.metrics.alrHistoricalScore);
  const drivetrainValues = candidates.map(
    (entry) => entry.metrics.drivetrainFitScore,
  );

  const performanceNorms = minMaxNormalize(performanceValues);
  const consistencyNorms = minMaxNormalize(consistencyValues);
  const alrNorms = minMaxNormalize(alrValues);
  const drivetrainNorms = minMaxNormalize(drivetrainValues);

  candidates.forEach((entry, index) => {
    entry.metrics.performanceNorm = performanceNorms[index];
    entry.metrics.consistencyNorm = consistencyNorms[index];
    entry.metrics.alrNorm = alrNorms[index];
    entry.metrics.drivetrainNorm = drivetrainNorms[index];
    entry.metrics.drivetrain = entry.car.drivetrain;

    entry.metrics.popularityIndex = Number(
      (
        entry.metrics.performanceNorm * 0.35 +
        entry.metrics.alrNorm * 0.3 +
        (entry.car.topSpeed / 10) * 0.2 +
        (entry.car.traction / 10) * 0.15
      ).toFixed(3),
    );

    entry.metrics.availabilityRisk = getAvailabilityRisk(
      entry.metrics.popularityIndex,
    );
    entry.metrics.fallbackScore = getFallbackScore(entry.metrics);
  });

  const fallbackNorms = minMaxNormalize(
    candidates.map((entry) => entry.metrics.fallbackScore),
  );
  candidates.forEach((entry, index) => {
    entry.metrics.fallbackNorm = fallbackNorms[index];
  });

  const pickedIds = new Set();
  const pickedDrivetrains = new Set();
  /** @type {ReturnType<typeof recommendTeamCarShortlist>} */
  const shortlist = [];

  for (const slot of SLOT_PROFILES) {
    const weights = applyDriverStyleWeights(slot.weights, driverStyles);
    const remaining = candidates.filter(
      (entry) => !pickedIds.has(entry.car.id),
    );

    if (remaining.length === 0) {
      break;
    }

    const best = remaining
      .map((entry) => ({
        entry,
        slotScore: scoreForSlot(
          entry.metrics,
          slot,
          weights,
          pickedDrivetrains,
        ),
      }))
      .sort((a, b) => b.slotScore - a.slotScore)[0];

    pickedIds.add(best.entry.car.id);
    pickedDrivetrains.add(best.entry.car.drivetrain);

    const { car, metrics } = best.entry;

    shortlist.push({
      rank: slot.rank,
      slotLabel: slot.label,
      carId: car.id,
      name: car.name,
      class: car.class,
      drivetrain: car.drivetrain,
      whyThisPosition: buildWhyThisPosition(car, metrics, slot, slot.rank),
      performanceScore: metrics.performanceScore,
      alrHistoricalScore: metrics.alrHistoricalScore,
      consistencyScore: metrics.consistencyScore,
      drivetrainFitScore: metrics.drivetrainFitScore,
      availabilityRisk: metrics.availabilityRisk,
      fallbackNotes: buildFallbackNotes(metrics, slot.rank),
      popularityIndex: metrics.popularityIndex,
      slotScore: Number(best.slotScore.toFixed(3)),
    });
  }

  return shortlist;
}
