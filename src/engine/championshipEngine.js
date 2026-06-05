import { cars } from "../data/cars.js";
import { tracks } from "../data/tracks.js";

const SCORE_FIELDS = ["topSpeed", "traction", "fuel", "tyres", "stability"];
const DRIVETRAIN_TYPES = ["FR", "MR", "4WD", "FF"];
const ATTRIBUTE_REASON_MAP = {
  topSpeed: "Excellent top speed",
  traction: "Strong traction",
  fuel: "Good fuel economy",
  tyres: "Strong tyre management",
  stability: "Stable under braking",
};

function normalizeMultiplier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.min(10, Math.max(1, numeric));
}

function getScoreWeights(raceSettings = {}) {
  return {
    topSpeed: 1,
    traction: 1,
    fuel: normalizeMultiplier(raceSettings.fuelMultiplier),
    tyres: normalizeMultiplier(raceSettings.tyreMultiplier),
    stability: 1,
  };
}

export function scoreCarForTrack(car, track, raceSettings = {}) {
  const weights = getScoreWeights(raceSettings);
  return SCORE_FIELDS.reduce((total, field) => {
    const carValue = Number(car?.[field] ?? 0);
    const trackValue = Number(track?.[field] ?? 0);
    const closeness = 10 - Math.abs(carValue - trackValue);
    return total + Math.max(closeness, 0) * weights[field];
  }, 0);
}

export function scoreCarForChampionship(
  car,
  championshipTracks,
  raceSettings = {},
) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return 0;
  }

  const total = championshipTracks.reduce((sum, track) => {
    return sum + scoreCarForTrack(car, track, raceSettings);
  }, 0);

  return Number((total / championshipTracks.length).toFixed(2));
}

function getAttributeMatchAverages(car, championshipTracks, raceSettings = {}) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return SCORE_FIELDS.map((field) => ({
      field,
      average: 0,
    }));
  }

  const weights = getScoreWeights(raceSettings);

  return SCORE_FIELDS.map((field) => {
    const total = championshipTracks.reduce((sum, track) => {
      const carValue = Number(car?.[field] ?? 0);
      const trackValue = Number(track?.[field] ?? 0);
      const closeness = 10 - Math.abs(carValue - trackValue);
      return sum + Math.max(closeness, 0) * weights[field];
    }, 0);

    return {
      field,
      average: total / championshipTracks.length,
    };
  });
}

function generateCarReasons(car, championshipTracks, raceSettings = {}, count = 3) {
  const topAttributes = getAttributeMatchAverages(
    car,
    championshipTracks,
    raceSettings,
  )
    .sort((a, b) => b.average - a.average)
    .slice(0, count);

  return topAttributes.map(({ field }) => ATTRIBUTE_REASON_MAP[field] ?? field);
}

function resolveTracksByIds(selectedTrackIds) {
  if (!Array.isArray(selectedTrackIds)) {
    return [];
  }

  return selectedTrackIds
    .map((trackId) => tracks.find((track) => track.id === trackId) ?? null)
    .filter(Boolean);
}

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

function getTrackAttributeAverages(championshipTracks) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return Object.fromEntries(SCORE_FIELDS.map((field) => [field, 0]));
  }

  return Object.fromEntries(
    SCORE_FIELDS.map((field) => {
      const total = championshipTracks.reduce(
        (sum, track) => sum + Number(track?.[field] ?? 0),
        0,
      );
      return [field, total / championshipTracks.length];
    }),
  );
}

function getCalendarSignals(championshipTracks) {
  const trackCount = championshipTracks.length;

  return {
    averages: getTrackAttributeAverages(championshipTracks),
    highSpeedRatio:
      championshipTracks.filter((track) => track.topSpeed >= 8).length / trackCount,
    technicalRatio:
      championshipTracks.filter((track) => track.traction >= 8).length / trackCount,
    tractionHeavyRatio:
      championshipTracks.filter((track) => track.traction >= 7.5).length / trackCount,
    stabilityHeavyRatio:
      championshipTracks.filter((track) => track.stability >= 7.5).length / trackCount,
  };
}

function clampDrivetrainScore(score) {
  return Math.round(Math.min(99, Math.max(40, score)));
}

function scoreDrivetrainForCalendar(drivetrain, signals) {
  const { averages, highSpeedRatio, technicalRatio, tractionHeavyRatio, stabilityHeavyRatio } =
    signals;
  const highSpeedDemand = Math.max(0, averages.topSpeed - 6);
  const technicalDemand = Math.max(0, averages.traction - 6);
  const tyreDemand = Math.max(0, averages.tyres - 6);
  const stabilityDemand = Math.max(0, averages.stability - 6.5);
  const technicalBias = Math.max(0, averages.traction - averages.topSpeed + 1.5);

  if (drivetrain === "FR") {
    return (
      70 +
      highSpeedDemand * 4.5 +
      highSpeedRatio * 12 +
      stabilityDemand * 1.5 -
      technicalRatio * 4 -
      technicalBias * 2
    );
  }

  if (drivetrain === "MR") {
    return (
      68 +
      technicalDemand * 5 +
      technicalRatio * 10 +
      technicalBias * 4 +
      tyreDemand * 2 -
      highSpeedRatio * 8 -
      Math.max(0, averages.topSpeed - 7.5) * 3
    );
  }

  if (drivetrain === "4WD") {
    return (
      65 +
      Math.max(0, averages.traction - 6.5) * 4 +
      tractionHeavyRatio * 12 +
      stabilityDemand * 3 +
      technicalDemand * 1.5 -
      Math.max(0, averages.topSpeed - 8) * 4
    );
  }

  return (
    62 +
    Math.max(0, averages.traction - 7) * 3 +
    Math.max(0, averages.tyres - 7) * 3 +
    technicalRatio * 6 +
    technicalBias * 2 -
    Math.max(0, averages.topSpeed - 7) * 5 -
    highSpeedRatio * 8 -
    stabilityDemand * 4 -
    stabilityHeavyRatio * 6
  );
}

export function analyzeDrivetrainSuitability(championshipTracks) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return DRIVETRAIN_TYPES.map((drivetrain) => ({ drivetrain, score: 0 }));
  }

  const signals = getCalendarSignals(championshipTracks);

  return DRIVETRAIN_TYPES.map((drivetrain) => ({
    drivetrain,
    score: clampDrivetrainScore(scoreDrivetrainForCalendar(drivetrain, signals)),
  })).sort((a, b) => b.score - a.score);
}

export function analyzeDrivetrainSuitabilityByTrackIds(selectedTrackIds) {
  return analyzeDrivetrainSuitability(resolveTracksByIds(selectedTrackIds));
}

function getCarTrackScores(car, championshipTracks, raceSettings = {}) {
  return championshipTracks.map((track) =>
    scoreCarForTrack(car, track, raceSettings),
  );
}

function calculateConsistencyScore(trackScores) {
  if (!Array.isArray(trackScores) || trackScores.length === 0) {
    return 0;
  }

  if (trackScores.length === 1) {
    return Number(trackScores[0].toFixed(2));
  }

  const average =
    trackScores.reduce((sum, score) => sum + score, 0) / trackScores.length;
  const minimum = Math.min(...trackScores);
  const maximum = Math.max(...trackScores);
  const variance =
    trackScores.reduce((sum, score) => sum + (score - average) ** 2, 0) /
    trackScores.length;
  const standardDeviation = Math.sqrt(variance);
  const spread = maximum - minimum;

  const consistencyScore =
    average * 0.5 + minimum * 0.3 - standardDeviation * 1.5 - spread * 0.2;

  return Number(Math.max(0, consistencyScore).toFixed(2));
}

export function scoreCarConsistency(
  car,
  championshipTracks,
  raceSettings = {},
) {
  return calculateConsistencyScore(
    getCarTrackScores(car, championshipTracks, raceSettings),
  );
}

export function rankCarsByChampionshipConsistency(
  selectedTrackIds,
  carClass,
  raceSettings = {},
) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds);
  const candidateCars = cars.filter((car) => isCarInClass(car, carClass));

  return candidateCars
    .map((car) => ({
      ...car,
      consistencyScore: scoreCarConsistency(
        car,
        championshipTracks,
        raceSettings,
      ),
    }))
    .sort((a, b) => b.consistencyScore - a.consistencyScore);
}

export function recommendCarsForChampionship(
  selectedTrackIds,
  carClass,
  raceSettings = {},
) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds);
  const candidateCars = cars.filter((car) => isCarInClass(car, carClass));

  return candidateCars
    .map((car) => ({
      ...car,
      score: scoreCarForChampionship(car, championshipTracks, raceSettings),
      reasons: generateCarReasons(car, championshipTracks, raceSettings, 3),
    }))
    .sort((a, b) => b.score - a.score);
}

export function rankCarsForChampionship(championshipTracks, availableCars = cars) {
  const resolvedTracks = championshipTracks;

  return [...availableCars]
    .map((car) => ({
      ...car,
      score: scoreCarForChampionship(car, resolvedTracks),
    }))
    .sort((a, b) => b.score - a.score);
}

export function recommendBestCarForChampionship(
  championshipTracks,
  availableCars = cars,
) {
  const rankedCars = rankCarsForChampionship(championshipTracks, availableCars);
  return rankedCars[0] ?? null;
}
