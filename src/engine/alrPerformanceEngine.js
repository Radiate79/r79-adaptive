import { alrPerformance } from "../data/alrPerformance.js";
import {
  ALR_CONSTRUCTOR_POSITION_POINTS,
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
  ALR_TIER_POINTS,
} from "../data/alrChampionshipWeighting.js";
import { GT7_GAME_VERSION } from "../data/gameVersions.js";
import { isCarEligibleForRecommendations } from "../utils/carClassFilter.js";
import { getCarsForGame } from "../utils/gameData.js";

function normalizeCarId(car) {
  if (typeof car === "string") {
    return car.trim();
  }

  if (car && typeof car.id === "string") {
    return car.id.trim();
  }

  return "";
}

/**
 * Tier championship weight (1 = 100, 2 = 90, …, 6 = 50).
 * @param {number} tier
 */
export function getTierPoints(tier) {
  return ALR_TIER_POINTS[tier] ?? 0;
}

/**
 * Constructor finishing position points (1st = 100, …, 10th = 10).
 * @param {number} position
 */
export function getConstructorPositionPoints(position) {
  const numeric = Number(position);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return 0;
  }

  return ALR_CONSTRUCTOR_POSITION_POINTS[numeric] ?? 0;
}

/**
 * Single-result ALR score from tier and constructor position weighting.
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord} record
 */
export function getALRResultScore(record) {
  const tierPoints = getTierPoints(record.tier);
  const positionPoints = getConstructorPositionPoints(
    record.constructorsPosition,
  );

  return Number(((tierPoints * positionPoints) / 100).toFixed(2));
}

/**
 * @param {string} carId
 * @param {{ season?: number, tier?: number, fromSeason?: number, toSeason?: number }} [filters]
 * @returns {import("../data/alrPerformance.js").ALRPerformanceRecord[]}
 */
export function getALRRecordsForCar(carId, filters = {}) {
  const normalizedId = normalizeCarId(carId);
  if (!normalizedId) {
    return [];
  }

  return alrPerformance.filter((record) => {
    if (record.car !== normalizedId) {
      return false;
    }

    if (filters.season !== undefined && record.season !== filters.season) {
      return false;
    }

    if (filters.tier !== undefined && record.tier !== filters.tier) {
      return false;
    }

    if (
      filters.fromSeason !== undefined &&
      record.season < filters.fromSeason
    ) {
      return false;
    }

    if (filters.toSeason !== undefined && record.season > filters.toSeason) {
      return false;
    }

    return true;
  });
}

/**
 * Count constructors championship wins (position 1).
 * @param {string | { id: string }} car
 * @param {{ fromSeason?: number, toSeason?: number }} [filters]
 */
export function getCarChampionshipWins(car, filters = {}) {
  return getALRRecordsForCar(car, filters).filter(
    (record) => record.constructorsPosition === 1,
  ).length;
}

/**
 * Count top-three constructors championship finishes.
 * @param {string | { id: string }} car
 * @param {{ fromSeason?: number, toSeason?: number }} [filters]
 */
export function getCarTop3Finishes(car, filters = {}) {
  return getALRRecordsForCar(car, filters).filter(
    (record) => record.constructorsPosition <= 3,
  ).length;
}

/**
 * Mean constructors championship position across ALR history.
 * Returns null when the car has no matching records.
 * @param {string | { id: string }} car
 * @param {{ fromSeason?: number, toSeason?: number }} [filters]
 */
export function getCarAveragePosition(car, filters = {}) {
  const records = getALRRecordsForCar(car, filters);
  if (records.length === 0) {
    return null;
  }

  const total = records.reduce(
    (sum, record) => sum + record.constructorsPosition,
    0,
  );

  return Number((total / records.length).toFixed(2));
}

/**
 * Sum of weighted ALR result scores across all stored records.
 * @param {string | { id: string }} car
 * @param {{ fromSeason?: number, toSeason?: number }} [filters]
 */
export function getCarALRScore(car, filters = {}) {
  const carId = normalizeCarId(car);
  const carMeta = getCarsForGame(GT7_GAME_VERSION).find(
    (entry) => entry.id === carId,
  );

  if (carMeta && !isCarEligibleForRecommendations(carMeta)) {
    return 0;
  }

  const records = getALRRecordsForCar(car, filters);
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
 * ALR Historical Score — weighted sum for Seasons 20–22 (configurable).
 * @param {string | { id: string }} car
 * @param {{ fromSeason?: number, toSeason?: number }} [options]
 */
export function getCarALRHistoricalScore(
  car,
  options = {},
) {
  const fromSeason = options.fromSeason ?? ALR_HISTORICAL_SEASON_FROM;
  const toSeason = options.toSeason ?? ALR_HISTORICAL_SEASON_TO;

  return getCarALRScore(car, { fromSeason, toSeason });
}

/**
 * All unique car ids with ALR records in the season window.
 * @param {{ fromSeason?: number, toSeason?: number }} [options]
 */
export function getALRCarIdsInSeasonRange(options = {}) {
  const fromSeason = options.fromSeason ?? ALR_HISTORICAL_SEASON_FROM;
  const toSeason = options.toSeason ?? ALR_HISTORICAL_SEASON_TO;

  const ids = new Set();

  alrPerformance.forEach((record) => {
    if (record.season >= fromSeason && record.season <= toSeason) {
      ids.add(record.car);
    }
  });

  return [...ids];
}

/**
 * ALR Historical Score for every car with results in the season window.
 * Sorted highest score first.
 * @param {{ fromSeason?: number, toSeason?: number }} [options]
 */
export function getAllCarsALRHistoricalScores(options = {}) {
  const fromSeason = options.fromSeason ?? ALR_HISTORICAL_SEASON_FROM;
  const toSeason = options.toSeason ?? ALR_HISTORICAL_SEASON_TO;
  const carIds = getALRCarIdsInSeasonRange({ fromSeason, toSeason });

  return carIds
    .map((carId) => {
      const carMeta = getCarsForGame(GT7_GAME_VERSION).find(
        (car) => car.id === carId,
      );

      if (carMeta && !isCarEligibleForRecommendations(carMeta)) {
        return null;
      }

      const records = getALRRecordsForCar(carId, { fromSeason, toSeason });

      return {
        carId,
        name: carMeta?.name ?? carId,
        class: carMeta?.class ?? null,
        historicalScore: getCarALRHistoricalScore(carId, { fromSeason, toSeason }),
        averagePosition: getCarAveragePosition(carId, { fromSeason, toSeason }),
        wins: getCarChampionshipWins(carId, { fromSeason, toSeason }),
        top3: getCarTop3Finishes(carId, { fromSeason, toSeason }),
        entries: records.length,
        results: records.map((record) => ({
          season: record.season,
          tier: record.tier,
          position: record.constructorsPosition,
          resultScore: getALRResultScore(record),
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.historicalScore - a.historicalScore);
}
