/**
 * Structured Championship Advisor calculation API.
 * UI collects inputs / displays results; this module owns recommendation orchestration.
 */

import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  analyzeCarBestAndWeakestTracks,
  rankCarsByChampionshipConsistency,
  recommendCarsForChampionship,
} from "./championshipEngine.js";
import {
  buildRecommendationCacheKey,
  getCachedRecommendation,
  hasCachedRecommendation,
} from "./recommendationCache.js";
import { getAdvisorCacheVersionStamp } from "../data/advisorDataLayer.js";
import { getTracksForGame } from "../utils/gameData.js";

/**
 * @typedef {Object} ChampionshipRecommendationInput
 * @property {string[]} selectedTrackIds
 * @property {string} carClass
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 * @property {number} [lapCount]
 * @property {boolean} [bopOn]
 * @property {string[]} [bannedCarNames]
 * @property {string} [gameVersion]
 * @property {string} [tyreCompound]
 * @property {import("../data/driverProfile.js").DriverProfile} [driverProfile] Reserved for future personalisation
 * @property {import("../data/driverProfile.js").DriverCalibration} [driverCalibration] Reserved for future calibration
 */

/**
 * @typedef {Object} ChampionshipRecommendationResult
 * @property {object[]} rankings
 * @property {object[]} consistencyRankings
 * @property {object[]} scores
 * @property {string} [confidence]
 * @property {string[]} reasons
 * @property {string[]} warnings
 * @property {boolean} fromCache
 */

/**
 * @param {ChampionshipRecommendationInput} input
 */
function buildCachePayload(input) {
  return {
    ...getAdvisorCacheVersionStamp(),
    gameVersion: input.gameVersion ?? DEFAULT_GAME_VERSION,
    carClass: input.carClass,
    selectedTrackIds: [...(input.selectedTrackIds ?? [])].sort(),
    fuelMultiplier: input.fuelMultiplier ?? 0,
    tyreMultiplier: input.tyreMultiplier ?? 0,
    lapCount: input.lapCount ?? null,
    bopOn: input.bopOn !== false,
    bannedCarNames: [...(input.bannedCarNames ?? [])].sort(),
    tyreCompound: input.tyreCompound ?? null,
  };
}

/**
 * Independently evaluates ALL eligible cars for the confirmed race scenario.
 * Does not retain previous winner bonuses or sticky ranking state.
 *
 * @param {ChampionshipRecommendationInput} input
 * @returns {ChampionshipRecommendationResult}
 */
export function calculateChampionshipRecommendation(input) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const selectedTrackIds = Array.isArray(input.selectedTrackIds)
    ? input.selectedTrackIds
    : [];
  const carClass = input.carClass ?? "Gr.3";
  const raceSettings = {
    fuelMultiplier: input.fuelMultiplier ?? 0,
    tyreMultiplier: input.tyreMultiplier ?? 0,
    lapCount: input.lapCount,
    bopOn: input.bopOn !== false,
    bannedCarNames: input.bannedCarNames ?? [],
    tyreCompound: input.tyreCompound,
    // Reserved — accepted for future personalisation without affecting current rankings.
    driverProfile: input.driverProfile ?? null,
    driverCalibration: input.driverCalibration ?? null,
  };

  const cacheKey = buildRecommendationCacheKey(
    "championship-advisor",
    buildCachePayload(input),
  );
  const fromCache = hasCachedRecommendation(cacheKey);

  const result = getCachedRecommendation(cacheKey, () => {
    const rankings = recommendCarsForChampionship(
      selectedTrackIds,
      carClass,
      raceSettings,
      gameVersion,
    ).slice(0, 5);

    const allTracks = getTracksForGame(gameVersion);
    const selectedTracks = allTracks.filter((track) =>
      selectedTrackIds.includes(track.id),
    );

    const rankingsWithAnalysis = rankings.map((car) => ({
      ...car,
      trackAnalysis: analyzeCarBestAndWeakestTracks(
        car,
        selectedTracks,
        raceSettings,
      ),
    }));

    const consistencyRankings = rankCarsByChampionshipConsistency(
      selectedTrackIds,
      carClass,
      raceSettings,
      gameVersion,
    ).slice(0, 5);

    /** @type {string[]} */
    const warnings = [];
    if (selectedTrackIds.length === 0) {
      warnings.push("Select one or more championship tracks before generating.");
    }
    if (rankingsWithAnalysis.length === 0 && selectedTrackIds.length > 0) {
      warnings.push("No eligible cars matched this championship scenario.");
    }

    return {
      rankings: rankingsWithAnalysis,
      consistencyRankings,
      scores: rankingsWithAnalysis.map((car) => ({
        id: car.id,
        name: car.name,
        overall: car.score,
        trackFit: car.trackFitScore,
        technicalFit: car.technicalFitScore,
        raceConditionFit: car.raceConditionFitScore,
        communityConfidence: car.communityConfidence,
        confidence: car.advisorConfidence?.level ?? null,
      })),
      confidence:
        rankingsWithAnalysis[0]?.advisorConfidence?.label ?? null,
      reasons: rankingsWithAnalysis[0]?.reasons ?? [],
      warnings,
    };
  });

  return {
    ...result,
    fromCache,
  };
}
