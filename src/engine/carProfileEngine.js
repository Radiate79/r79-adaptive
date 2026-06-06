import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import { formatTierLabel } from "../data/alrImportSlots.js";
import { getCarManufacturer } from "../utils/carManufacturer.js";
import { loadALRRecords } from "../utils/alrStorage.js";
import {
  scoreCarConsistency,
  scoreCarForTrack,
} from "./championshipEngine.js";
import { getALRResultScore } from "./alrPerformanceEngine.js";

/** @typedef {'Rising' | 'Stable' | 'Falling'} ProfileTrend */

const DEFAULT_ROTATION = {
  MR: 9,
  RR: 8,
  FR: 7,
  "4WD": 6,
  FF: 5,
};

const PERFORMANCE_METRICS = [
  { key: "topSpeed", label: "Top Speed" },
  { key: "rotation", label: "Rotation" },
  { key: "stability", label: "Stability" },
  { key: "fuel", label: "Fuel Economy" },
  { key: "tyres", label: "Tyre Management" },
  { key: "acceleration", label: "Acceleration" },
  { key: "consistency", label: "Consistency" },
];

const STRENGTH_LABELS = {
  topSpeed: "Strong top speed on high-speed circuits",
  rotation: "Agile rotation and responsive turn-in",
  stability: "Stable under braking and kerb strikes",
  fuel: "Efficient fuel consumption over stints",
  tyres: "Strong tyre management across race distance",
  traction: "Good traction and acceleration out of corners",
  consistency: "Consistent pace across varied track types",
};

/**
 * @param {import("../data/cars.js").typeof cars[number]} car
 */
function getRotationValue(car) {
  return Number(car.rotation ?? DEFAULT_ROTATION[car.drivetrain] ?? 7);
}

/**
 * @param {import("../data/cars.js").typeof cars[number]} car
 */
function getAccelerationValue(car) {
  const traction = Number(car.traction ?? 7);
  const rotation = getRotationValue(car);
  return Number(((traction + rotation) / 2).toFixed(1));
}

/**
 * @param {string} name
 */
export function extractCarYear(name) {
  const shortYear = name.match(/'(\d{2})\b/);
  if (shortYear) {
    return `20${shortYear[1]}`;
  }

  const fullYear = name.match(/\b(19|20)\d{2}\b/);
  if (fullYear) {
    return fullYear[0];
  }

  return null;
}

/**
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord[]} records
 * @returns {ProfileTrend}
 */
function calculateProfileTrend(records) {
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
    return "Rising";
  }

  if (lateAverage > earlyAverage + 0.5) {
    return "Falling";
  }

  return "Stable";
}

/**
 * @param {string} carId
 */
function getCarALRRecords(carId) {
  return loadALRRecords().filter(
    (record) =>
      record.car === carId &&
      record.season >= ALR_HISTORICAL_SEASON_FROM &&
      record.season <= ALR_HISTORICAL_SEASON_TO,
  );
}

/**
 * @param {import("../data/cars.js").typeof cars[number]} car
 */
function buildPerformanceBreakdown(car, gameVersion = DEFAULT_GAME_VERSION) {
  const tracks = getTracksForGame(gameVersion);
  const consistencyRaw = scoreCarConsistency(car, tracks);
  const consistency = Number(Math.min(10, consistencyRaw / 10).toFixed(1));

  const values = {
    topSpeed: Number(car.topSpeed ?? 0),
    rotation: getRotationValue(car),
    stability: Number(car.stability ?? 0),
    fuel: Number(car.fuel ?? 0),
    tyres: Number(car.tyres ?? 0),
    acceleration: getAccelerationValue(car),
    consistency,
  };

  return PERFORMANCE_METRICS.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: values[metric.key],
    percent: Math.round((values[metric.key] / 10) * 100),
  }));
}

/**
 * @param {import("../data/cars.js").typeof cars[number]} car
 * @param {ReturnType<typeof buildPerformanceBreakdown>} breakdown
 */
function buildStrengthsAndWeaknesses(car, breakdown) {
  const scored = breakdown
    .filter((item) => item.key !== "consistency")
    .map((item) => ({
      key: item.key === "acceleration" ? "traction" : item.key,
      label: item.label,
      value: item.value,
    }));

  scored.push({
    key: "consistency",
    label: "Consistency",
    value: breakdown.find((item) => item.key === "consistency")?.value ?? 0,
  });

  const sorted = [...scored].sort((a, b) => b.value - a.value);
  const strengths = sorted
    .filter((item) => item.value >= 7)
    .slice(0, 3)
    .map((item) => STRENGTH_LABELS[item.key] ?? `Strong ${item.label.toLowerCase()}`);

  const weaknesses = [...sorted]
    .reverse()
    .filter((item) => item.value <= 6.5)
    .slice(0, 3)
    .map((item) => {
      if (item.key === "fuel") {
        return "Higher fuel consumption on long stints";
      }
      if (item.key === "tyres") {
        return "Tyre wear can limit race pace";
      }
      if (item.key === "topSpeed") {
        return "Limited top speed on long straights";
      }
      if (item.key === "rotation") {
        return "Slower rotation in tight technical sections";
      }
      if (item.key === "stability") {
        return "Less stable on kerbs and under heavy braking";
      }
      if (item.key === "traction") {
        return "Weaker traction and acceleration";
      }
      return `Below-average ${item.label.toLowerCase()}`;
    });

  if (strengths.length === 0) {
    strengths.push("Balanced package without a standout dominant trait");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("No major weak areas identified in base ratings");
  }

  return { strengths, weaknesses };
}

/**
 * @param {import("../data/cars.js").typeof cars[number]} car
 */
function buildRecommendedTracks(car, gameVersion = DEFAULT_GAME_VERSION) {
  const tracks = getTracksForGame(gameVersion);
  const scoredTracks = tracks
    .map((track) => ({
      track,
      score: scoreCarForTrack(car, track),
    }))
    .sort((a, b) => b.score - a.score);

  const excellent = [];
  const good = [];
  const average = [];

  for (const entry of scoredTracks) {
    if (entry.score >= 82) {
      excellent.push(entry.track.name);
    } else if (entry.score >= 72) {
      good.push(entry.track.name);
    } else {
      average.push(entry.track.name);
    }
  }

  return {
    excellent: excellent.slice(0, 6),
    good: good.slice(0, 6),
    average: average.slice(0, 6),
  };
}

/**
 * @param {import("../data/alrPerformance.js").ALRPerformanceRecord[]} records
 */
function buildHistoricalTimeline(records) {
  return [...records]
    .sort((a, b) => {
      if (a.season !== b.season) {
        return a.season - b.season;
      }
      if (a.tier !== b.tier) {
        return a.tier - b.tier;
      }
      return a.constructorsPosition - b.constructorsPosition;
    })
    .map((record) => ({
      season: record.season,
      tierLabel: formatTierLabel(record.tier, record.division),
      position: record.constructorsPosition,
      score: getALRResultScore(record),
    }));
}

/**
 * @param {string} carId
 * @param {import("../data/gameVersions.js").GameVersion} [gameVersion]
 */
export function getCarProfile(carId, gameVersion = DEFAULT_GAME_VERSION) {
  const car = getCarsForGame(gameVersion).find((entry) => entry.id === carId);
  if (!car) {
    return null;
  }

  const records = getCarALRRecords(carId);
  const historicalScore = Number(
    records.reduce((sum, record) => sum + getALRResultScore(record), 0).toFixed(2),
  );
  const championshipWins = records.filter(
    (record) => record.constructorsPosition === 1,
  ).length;
  const podiums = records.filter(
    (record) => record.constructorsPosition <= 3,
  ).length;
  const averageFinish =
    records.length > 0
      ? Number(
          (
            records.reduce(
              (sum, record) => sum + record.constructorsPosition,
              0,
            ) / records.length
          ).toFixed(2),
        )
      : null;
  const seasonsEntered = new Set(records.map((record) => record.season)).size;
  const highestTierCompeted =
    records.length > 0 ? Math.min(...records.map((record) => record.tier)) : null;

  const performanceBreakdown = buildPerformanceBreakdown(car, gameVersion);
  const { strengths, weaknesses } = buildStrengthsAndWeaknesses(
    car,
    performanceBreakdown,
  );

  return {
    carId: car.id,
    name: car.name,
    manufacturer: getCarManufacturer(car),
    category: car.class ?? "Unknown",
    drivetrain: car.drivetrain ?? "—",
    year: extractCarYear(car.name),
    gameVersion,
    historicalScore,
    championshipWins,
    podiums,
    averageFinish,
    seasonsEntered,
    highestTierCompeted,
    trend: calculateProfileTrend(records),
    hasALRHistory: records.length > 0,
    performanceBreakdown,
    strengths,
    weaknesses,
    recommendedTracks: buildRecommendedTracks(car, gameVersion),
    timeline: buildHistoricalTimeline(records),
    compareMetrics: {
      historicalScore,
      championships: championshipWins,
      podiums,
      averageFinish,
      tyreScore: Number(car.tyres ?? 0),
      fuelScore: Number(car.fuel ?? 0),
      rotation: getRotationValue(car),
      stability: Number(car.stability ?? 0),
      topSpeed: Number(car.topSpeed ?? 0),
    },
  };
}

/**
 * @param {string} [query]
 * @param {import("../data/gameVersions.js").GameVersion} [gameVersion]
 */
export function searchCarProfiles(query = "", gameVersion = DEFAULT_GAME_VERSION) {
  const normalized = query.trim().toLowerCase();

  return getCarsForGame(gameVersion)
    .filter((car) => {
      if (!normalized) {
        return true;
      }

      const manufacturer = getCarManufacturer(car).toLowerCase();
      const drivetrain = String(car.drivetrain ?? "").toLowerCase();
      const name = car.name.toLowerCase();
      const carClass = String(car.class ?? "").toLowerCase();

      return (
        name.includes(normalized) ||
        manufacturer.includes(normalized) ||
        drivetrain.includes(normalized) ||
        carClass.includes(normalized)
      );
    })
    .map((car) => ({
      id: car.id,
      name: car.name,
      manufacturer: getCarManufacturer(car),
      category: car.class,
      drivetrain: car.drivetrain,
      hasALRHistory: getCarALRRecords(car.id).length > 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {string} carIdA
 * @param {string} carIdB
 * @param {import("../data/gameVersions.js").GameVersion} [gameVersion]
 */
export function compareCarProfiles(
  carIdA,
  carIdB,
  gameVersion = DEFAULT_GAME_VERSION,
) {
  const profileA = getCarProfile(carIdA, gameVersion);
  const profileB = getCarProfile(carIdB, gameVersion);

  if (!profileA || !profileB) {
    return null;
  }

  const metrics = [
    { key: "historicalScore", label: "Historical Score", higherIsBetter: true },
    { key: "championships", label: "Championships", higherIsBetter: true },
    { key: "podiums", label: "Podiums", higherIsBetter: true },
    {
      key: "averageFinish",
      label: "Average Finish",
      higherIsBetter: false,
    },
    { key: "tyreScore", label: "Tyre Score", higherIsBetter: true },
    { key: "fuelScore", label: "Fuel Score", higherIsBetter: true },
    { key: "rotation", label: "Rotation", higherIsBetter: true },
    { key: "stability", label: "Stability", higherIsBetter: true },
    { key: "topSpeed", label: "Top Speed", higherIsBetter: true },
  ];

  const rows = metrics.map((metric) => {
    const valueA = profileA.compareMetrics[metric.key];
    const valueB = profileB.compareMetrics[metric.key];
    let winner = "tie";

    if (valueA !== null && valueB !== null && valueA !== valueB) {
      if (metric.higherIsBetter) {
        winner = valueA > valueB ? "a" : "b";
      } else {
        winner = valueA < valueB ? "a" : "b";
      }
    }

    return {
      ...metric,
      valueA,
      valueB,
      winner,
    };
  });

  return {
    carA: profileA,
    carB: profileB,
    rows,
  };
}
