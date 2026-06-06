import { GT7_GAME_VERSION } from "../data/gameVersions.js";
import { getCarsForGame } from "../utils/gameData.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import { getCarManufacturer } from "../utils/carManufacturer.js";
import { loadALRRecords } from "../utils/alrStorage.js";
import { getALRResultScore } from "./alrPerformanceEngine.js";

/** @typedef {'Up' | 'Down' | 'Stable'} ALRTrend */

/**
 * @typedef {Object} ALRRankingsFilters
 * @property {number | ''} [season]
 * @property {number | ''} [tier]
 * @property {string} [manufacturer]
 * @property {string} [drivetrain]
 */

/**
 * @typedef {Object} ALRHistoricalRankingRow
 * @property {string} carId
 * @property {string} name
 * @property {string} manufacturer
 * @property {string | null} drivetrain
 * @property {string | null} class
 * @property {number} historicalScore
 * @property {number} championshipWins
 * @property {number} podiums
 * @property {number | null} averagePosition
 * @property {number} seasonsEntered
 * @property {ALRTrend} trend
 * @property {number} entries
 */

/**
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord[]} records
 * @param {ALRRankingsFilters} filters
 */
function filterRecords(records, filters) {
  return records.filter((record) => {
    if (filters.season !== undefined && filters.season !== "") {
      if (record.season !== Number(filters.season)) {
        return false;
      }
    } else if (
      record.season < ALR_HISTORICAL_SEASON_FROM ||
      record.season > ALR_HISTORICAL_SEASON_TO
    ) {
      return false;
    }

    if (filters.tier !== undefined && filters.tier !== "") {
      if (record.tier !== Number(filters.tier)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord[]} records
 * @returns {ALRTrend}
 */
function calculateTrend(records) {
  if (records.length < 2) {
    return "Stable";
  }

  const seasons = [...new Set(records.map((record) => record.season))].sort(
    (a, b) => a - b,
  );

  if (seasons.length < 2) {
    return "Stable";
  }

  const midpoint = Math.max(1, Math.floor(seasons.length / 2));
  const earlySeasons = new Set(seasons.slice(0, midpoint));
  const lateSeasons = new Set(seasons.slice(midpoint));

  const earlyRecords = records.filter((record) =>
    earlySeasons.has(record.season),
  );
  const lateRecords = records.filter((record) => lateSeasons.has(record.season));

  if (earlyRecords.length === 0 || lateRecords.length === 0) {
    return "Stable";
  }

  const earlyAverage =
    earlyRecords.reduce(
      (sum, record) => sum + record.constructorsPosition,
      0,
    ) / earlyRecords.length;
  const lateAverage =
    lateRecords.reduce((sum, record) => sum + record.constructorsPosition, 0) /
    lateRecords.length;

  if (lateAverage < earlyAverage - 0.5) {
    return "Up";
  }

  if (lateAverage > earlyAverage + 0.5) {
    return "Down";
  }

  return "Stable";
}

/**
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord[]} records
 * @param {ALRRankingsFilters} filters
 */
function buildRankingRow(records, filters) {
  if (records.length === 0) {
    return null;
  }

  const carId = records[0].car;
  const carMeta = getCarsForGame(GT7_GAME_VERSION).find(
    (car) => car.id === carId,
  );
  const manufacturer = carMeta ? getCarManufacturer(carMeta) : "Unknown";
  const drivetrain = carMeta?.drivetrain ?? null;

  if (filters.manufacturer && manufacturer !== filters.manufacturer) {
    return null;
  }

  if (filters.drivetrain && drivetrain !== filters.drivetrain) {
    return null;
  }

  const historicalScore = Number(
    records
      .reduce((sum, record) => sum + getALRResultScore(record), 0)
      .toFixed(2),
  );
  const championshipWins = records.filter(
    (record) => record.constructorsPosition === 1,
  ).length;
  const podiums = records.filter(
    (record) => record.constructorsPosition <= 3,
  ).length;
  const averagePosition = Number(
    (
      records.reduce(
        (sum, record) => sum + record.constructorsPosition,
        0,
      ) / records.length
    ).toFixed(2),
  );
  const seasonsEntered = new Set(records.map((record) => record.season)).size;

  return {
    carId,
    name: carMeta?.name ?? carId,
    manufacturer,
    drivetrain,
    class: carMeta?.class ?? null,
    historicalScore,
    championshipWins,
    podiums,
    averagePosition,
    seasonsEntered,
    trend: calculateTrend(records),
    entries: records.length,
  };
}

/**
 * @param {ALRRankingsFilters} [filters]
 * @param {number} [limit]
 */
export function getALRHistoricalRankings(filters = {}, limit = 25) {
  const allRecords = loadALRRecords();
  const filteredRecords = filterRecords(allRecords, filters);
  const carIds = [...new Set(filteredRecords.map((record) => record.car))];

  return carIds
    .map((carId) => {
      const carRecords = filteredRecords.filter((record) => record.car === carId);
      return buildRankingRow(carRecords, filters);
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.historicalScore !== a.historicalScore) {
        return b.historicalScore - a.historicalScore;
      }
      if (a.averagePosition !== b.averagePosition) {
        return (a.averagePosition ?? 99) - (b.averagePosition ?? 99);
      }
      return b.podiums - a.podiums;
    })
    .slice(0, limit);
}

/**
 * @param {ALRRankingsFilters} [filters]
 */
export function getAvailableRankingSeasons(filters = {}) {
  const records = filterRecords(loadALRRecords(), {
    ...filters,
    season: "",
  });

  return [...new Set(records.map((record) => record.season))].sort(
    (a, b) => a - b,
  );
}

/**
 * @param {ALRRankingsFilters} [filters]
 */
export function getAvailableRankingManufacturers(filters = {}) {
  const rankings = getALRHistoricalRankings(
    { ...filters, manufacturer: "", drivetrain: filters.drivetrain ?? "" },
    999,
  );

  return [...new Set(rankings.map((row) => row.manufacturer))].sort((a, b) =>
    a.localeCompare(b),
  );
}
