import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import { getALRResultScore } from "../engine/alrPerformanceEngine.js";
import { isCarEligibleForRecommendations } from "./carClassFilter.js";
import { getCarsForGame } from "./gameData.js";
import { loadALRRecords } from "./alrStorage.js";

export const DEFAULT_COMMUNITY_CONFIDENCE = 60;

export const COMMUNITY_CONFIDENCE_REASON =
  "Strong community confidence: proven in competitive GT7 racing.";

export const COMMUNITY_CONFIDENCE_REASON_THRESHOLD = 75;

/** Community can nudge rankings but must not overcome meaningful track-fit gaps. */
export const COMMUNITY_MAX_MODIFIER = 3.5;
export const HISTORICAL_MAX_MODIFIER = 2;
export const COMMUNITY_BASELINE = DEFAULT_COMMUNITY_CONFIDENCE;
export const TRACK_SUITABILITY_PRIORITY_GAP = 1;

/**
 * @param {{ communityConfidence?: number }} car
 */
export function getCommunityConfidence(car) {
  const value = Number(car?.communityConfidence);
  if (!Number.isFinite(value)) {
    return DEFAULT_COMMUNITY_CONFIDENCE;
  }

  return Math.min(100, Math.max(0, value));
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
 * @param {{ communityConfidence?: number }} car
 * @param {number} [historicalScore]
 * @param {number} [maxHistorical]
 */
export function blendRecommendationScore(
  technicalScore,
  car,
  historicalScore = 0,
  maxHistorical = 1,
) {
  return Number(
    (
      technicalScore +
      getCommunityModifier(car) +
      getHistoricalModifier(historicalScore, maxHistorical)
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
  const techA = Number(a.technicalScore ?? a.score ?? 0);
  const techB = Number(b.technicalScore ?? b.score ?? 0);
  const techDiff = techB - techA;

  if (Math.abs(techDiff) > TRACK_SUITABILITY_PRIORITY_GAP) {
    return techDiff;
  }

  const overallA = Number(a.overallScore ?? a.score ?? techA);
  const overallB = Number(b.overallScore ?? b.score ?? techB);

  return overallB - overallA;
}

/**
 * @param {{ communityConfidence?: number }} car
 */
export function getCommunityConfidenceReason(car) {
  if (getCommunityConfidence(car) >= COMMUNITY_CONFIDENCE_REASON_THRESHOLD) {
    return COMMUNITY_CONFIDENCE_REASON;
  }

  return null;
}

/**
 * @param {{ communityConfidence?: number }} car
 * @param {string[]} reasons
 */
export function appendCommunityConfidenceReason(car, reasons) {
  const communityReason = getCommunityConfidenceReason(car);
  if (!communityReason) {
    return reasons;
  }

  return [communityReason, ...reasons.filter((reason) => reason !== communityReason)].slice(
    0,
    4,
  );
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

  if (records.length === 0) {
    return 0;
  }

  return Number(
    records.reduce((sum, record) => sum + getALRResultScore(record), 0).toFixed(2),
  );
}
