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

const TECHNICAL_WEIGHT = 0.6;
const COMMUNITY_WEIGHT = 0.3;
const HISTORICAL_WEIGHT = 0.1;

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
  const community = getCommunityConfidence(car);
  const historical = normalizeHistoricalContribution(
    historicalScore,
    maxHistorical,
  );

  return Number(
    (
      technicalScore * TECHNICAL_WEIGHT +
      community * COMMUNITY_WEIGHT +
      historical * HISTORICAL_WEIGHT
    ).toFixed(2),
  );
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
