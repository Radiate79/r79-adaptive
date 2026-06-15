import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import {
  DAILY_RACE_EVIDENCE_REASON,
  resolveDailyRaceEvidenceBoost,
} from "../data/dailyRaceEvidence.js";
import { getALRResultScore } from "../engine/alrPerformanceEngine.js";
import { isCarEligibleForRecommendations } from "./carClassFilter.js";
import { getCarsForGame } from "./gameData.js";
import { loadALRRecords } from "./alrStorage.js";
import { loadRaceArchiveEntries } from "./raceArchiveStorage.js";

export const DEFAULT_COMMUNITY_CONFIDENCE = 60;

export const COMMUNITY_CONFIDENCE_REASON =
  "Strong community confidence: proven in competitive GT7 racing.";

export const COMMUNITY_CONFIDENCE_REASON_THRESHOLD = 75;

/** Community reflects real GT7 competitive use alongside track fit. */
export const COMMUNITY_MAX_MODIFIER = 12;
export const HISTORICAL_MAX_MODIFIER = 6;
export const COMMUNITY_BASELINE = DEFAULT_COMMUNITY_CONFIDENCE;
export const TRACK_SUITABILITY_PRIORITY_GAP = 1.25;
export const COMPETITIVE_USE_HIGH_MODIFIER = 2.5;
export const LOW_COMPETITIVE_USE_TRACK_FIT_THRESHOLD = 88;
export const RACE_ARCHIVE_WIN_POINTS = 12;
export const RACE_ARCHIVE_PODIUM_POINTS = 4;

/**
 * @param {{ communityConfidence?: number }} car
 * @param {import("../data/dailyRaceEvidence.js").RecommendationContext} [recommendationContext]
 */
export function getCommunityConfidence(car, recommendationContext = {}) {
  const value = Number(car?.communityConfidence);
  const base = !Number.isFinite(value)
    ? DEFAULT_COMMUNITY_CONFIDENCE
    : Math.min(100, Math.max(0, value));
  const dailyRace = resolveDailyRaceEvidenceBoost(
    car?.id ?? "",
    car?.class ?? recommendationContext.carClass ?? "",
    recommendationContext,
  );

  return Math.min(100, base + dailyRace.confidenceBonus);
}

/**
 * @param {number} historicalScore
 * @param {number} maxHistorical
 */
export function normalizeHistoricalContribution(historicalScore, maxHistorical) {
  if (!maxHistorical || maxHistorical <= 0 || historicalScore <= 0) {
    return 0;
  }

  return (historicalScore / maxHistorical) * 100;
}

/**
 * @param {{ recommendationPenalty?: number }} car
 */
export function getRecommendationPenalty(car) {
  const penalty = Number(car?.recommendationPenalty ?? 0);
  if (!Number.isFinite(penalty) || penalty <= 0) {
    return 0;
  }

  return penalty;
}

/**
 * @param {number} technicalScore
 * @param {{ recommendationPenalty?: number }} car
 */
export function getAdjustedTechnicalScore(technicalScore, car) {
  return Math.max(0, technicalScore - getRecommendationPenalty(car));
}

/**
 * @param {{ competitiveUse?: string }} car
 * @param {number} trackFitScore
 */
export function passesCompetitiveUseGate(car, trackFitScore) {
  if (car?.competitiveUse !== "low") {
    return true;
  }

  return trackFitScore >= LOW_COMPETITIVE_USE_TRACK_FIT_THRESHOLD;
}

/**
 * @param {number} technicalScore
 * @param {{ communityConfidence?: number, recommendationPenalty?: number, id?: string, class?: string }} car
 * @param {number} [historicalScore]
 * @param {number} [maxHistorical]
 * @param {import("../data/dailyRaceEvidence.js").RecommendationContext} [recommendationContext]
 */
export function buildRecommendationBreakdown(
  technicalScore,
  car,
  historicalScore = 0,
  maxHistorical = 1,
  recommendationContext = {},
) {
  const trackFit = Number(technicalScore.toFixed(2));
  const technicalFit = Number(
    getAdjustedTechnicalScore(technicalScore, car).toFixed(2),
  );
  const dailyRace = resolveDailyRaceEvidenceBoost(
    car?.id ?? "",
    car?.class ?? recommendationContext.carClass ?? "",
    recommendationContext,
  );
  const communityConfidence = getCommunityConfidence(car, recommendationContext);
  const communityModifier = getCommunityModifier(car);
  const historicalModifier = getHistoricalModifier(historicalScore, maxHistorical);

  return {
    trackFit,
    technicalFit,
    communityConfidence,
    communityModifier: Number(communityModifier.toFixed(2)),
    recommendationPenalty: getRecommendationPenalty(car),
    historicalModifier: Number(historicalModifier.toFixed(2)),
    dailyRaceModifier: Number(dailyRace.scoreModifier.toFixed(2)),
    overallScore: blendRecommendationScore(
      technicalScore,
      car,
      historicalScore,
      maxHistorical,
      recommendationContext,
    ),
  };
}

/**
 * @param {{ competitiveUse?: string }} car
 */
export function getCompetitiveUseModifier(car) {
  return car?.competitiveUse === "high" ? COMPETITIVE_USE_HIGH_MODIFIER : 0;
}

/**
 * @param {{ communityConfidence?: number }} car
 */
export function getCommunityModifier(car) {
  const community = getCommunityConfidence(car);
  const normalized = (community - COMMUNITY_BASELINE) / 40;
  const modifier = normalized * COMMUNITY_MAX_MODIFIER;

  return Math.max(
    -COMMUNITY_MAX_MODIFIER,
    Math.min(COMMUNITY_MAX_MODIFIER, modifier),
  );
}

/**
 * @param {number} historicalScore
 * @param {number} maxHistorical
 */
export function getHistoricalModifier(historicalScore, maxHistorical) {
  const normalized =
    normalizeHistoricalContribution(historicalScore, maxHistorical) / 100;

  return normalized * HISTORICAL_MAX_MODIFIER;
}

/**
 * Track suitability is the primary score; community and history are small modifiers.
 *
 * @param {number} technicalScore
 * @param {{ communityConfidence?: number, id?: string, class?: string }} car
 * @param {number} [historicalScore]
 * @param {number} [maxHistorical]
 * @param {import("../data/dailyRaceEvidence.js").RecommendationContext} [recommendationContext]
 */
export function blendRecommendationScore(
  technicalScore,
  car,
  historicalScore = 0,
  maxHistorical = 1,
  recommendationContext = {},
) {
  const adjustedTechnical = getAdjustedTechnicalScore(technicalScore, car);
  const dailyRace = resolveDailyRaceEvidenceBoost(
    car?.id ?? "",
    car?.class ?? recommendationContext.carClass ?? "",
    recommendationContext,
  );

  return Number(
    (
      adjustedTechnical +
      getCommunityModifier(car) +
      getHistoricalModifier(historicalScore, maxHistorical) +
      getCompetitiveUseModifier(car) +
      dailyRace.scoreModifier
    ).toFixed(2),
  );
}

/**
 * Track suitability is always the primary ranking signal.
 *
 * @param {{ technicalScore?: number, overallScore?: number, score?: number }} a
 * @param {{ technicalScore?: number, overallScore?: number, score?: number }} b
 */
export function compareRecommendationRanking(a, b) {
  const techA = Number(
    a.adjustedTechnicalScore ?? a.technicalScore ?? a.score ?? 0,
  );
  const techB = Number(
    b.adjustedTechnicalScore ?? b.technicalScore ?? b.score ?? 0,
  );
  const techDiff = techB - techA;

  if (Math.abs(techDiff) > TRACK_SUITABILITY_PRIORITY_GAP) {
    return techDiff;
  }

  const overallA = Number(a.overallScore ?? a.score ?? techA);
  const overallB = Number(b.overallScore ?? b.score ?? techB);

  return overallB - overallA;
}

/**
 * @param {{ communityConfidence?: number, id?: string, class?: string }} car
 * @param {import("../data/dailyRaceEvidence.js").RecommendationContext} [recommendationContext]
 */
export function getCommunityConfidenceReason(
  car,
  recommendationContext = {},
) {
  const dailyRace = resolveDailyRaceEvidenceBoost(
    car?.id ?? "",
    car?.class ?? recommendationContext.carClass ?? "",
    recommendationContext,
  );

  if (dailyRace.scoreModifier > 0) {
    return DAILY_RACE_EVIDENCE_REASON;
  }

  if (getCommunityConfidence(car, recommendationContext) >= COMMUNITY_CONFIDENCE_REASON_THRESHOLD) {
    return COMMUNITY_CONFIDENCE_REASON;
  }

  return null;
}

/**
 * @param {{ communityConfidence?: number, id?: string, class?: string }} car
 * @param {string[]} reasons
 * @param {import("../data/dailyRaceEvidence.js").RecommendationContext} [recommendationContext]
 */
export function appendCommunityConfidenceReason(
  car,
  reasons,
  recommendationContext = {},
) {
  const communityReason = getCommunityConfidenceReason(
    car,
    recommendationContext,
  );
  if (!communityReason) {
    return reasons;
  }

  return [communityReason, ...reasons.filter((reason) => reason !== communityReason)].slice(
    0,
    4,
  );
}

/**
 * @param {string} text
 */
function normalizeCarText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * @param {{ id: string, name: string }} car
 * @param {string} text
 */
function archiveTextMatchesCar(car, text) {
  const normalized = normalizeCarText(text);
  if (!normalized) {
    return false;
  }

  const carName = normalizeCarText(car.name);
  const significantTokens = carName
    .split(" ")
    .filter((token) => token.length > 3 && !["gran", "turismo"].includes(token));

  if (significantTokens.length === 0) {
    return normalized.includes(normalizeCarText(car.id.replace(/_/g, " ")));
  }

  const matchedTokens = significantTokens.filter((token) =>
    normalized.includes(token),
  );

  return matchedTokens.length >= Math.min(2, significantTokens.length);
}

/**
 * @param {string} carId
 * @param {import("../data/gameVersions.js").GameVersion | string} [gameVersion]
 */
export function getRaceArchiveHistoricalBonus(carId, gameVersion = "gt7") {
  const carMeta = getCarsForGame(gameVersion).find((car) => car.id === carId);
  if (!carMeta || !isCarEligibleForRecommendations(carMeta)) {
    return 0;
  }

  let bonus = 0;

  for (const entry of loadRaceArchiveEntries()) {
    const placements = [
      { text: entry.winner, points: RACE_ARCHIVE_WIN_POINTS },
      { text: entry.p2, points: RACE_ARCHIVE_PODIUM_POINTS },
      { text: entry.p3, points: RACE_ARCHIVE_PODIUM_POINTS },
    ];

    for (const placement of placements) {
      if (archiveTextMatchesCar(carMeta, placement.text)) {
        bonus += placement.points;
        break;
      }
    }

    if (archiveTextMatchesCar(carMeta, entry.car)) {
      bonus += 2;
    }
  }

  return bonus;
}

/**
 * @param {string} carId
 * @param {import("../data/gameVersions.js").GameVersion | string} [gameVersion]
 */
export function getRecommendationHistoricalScore(
  carId,
  gameVersion = "gt7",
) {
  const carMeta = getCarsForGame(gameVersion).find((car) => car.id === carId);
  if (carMeta && !isCarEligibleForRecommendations(carMeta)) {
    return 0;
  }

  const records = loadALRRecords().filter(
    (record) =>
      record.car === carId &&
      record.season >= ALR_HISTORICAL_SEASON_FROM &&
      record.season <= ALR_HISTORICAL_SEASON_TO,
  );

  const alrScore = records.reduce(
    (sum, record) => sum + getALRResultScore(record),
    0,
  );
  const archiveBonus = getRaceArchiveHistoricalBonus(carId, gameVersion);
  const total = alrScore + archiveBonus;

  if (total <= 0) {
    return 0;
  }

  return Number(total.toFixed(2));
}
