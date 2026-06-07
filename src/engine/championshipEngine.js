import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  filterEligibleRecommendationResults,
  filterRecommendationPool,
  isCarEligibleForRecommendations,
} from "../utils/carClassFilter.js";
import { getRecommendableCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  getCalendarRecommendationStatus,
  getTrackSurfaceModifiers,
} from "../utils/trackClassification.js";
import {
  appendCommunityConfidenceReason,
  blendRecommendationScore,
  buildRecommendationBreakdown,
  compareRecommendationRanking,
  getAdjustedTechnicalScore,
  getCommunityConfidence,
  getRecommendationHistoricalScore,
  passesCompetitiveUseGate,
} from "../utils/recommendationScoring.js";

const SCORE_FIELDS = ["topSpeed", "traction", "fuel", "tyres", "stability"];
const SCORING_FIELDS = [...SCORE_FIELDS, "rotation"];
const DRIVETRAIN_TYPES = ["FR", "MR", "4WD", "FF"];
const DEFAULT_ROTATION = {
  MR: 9,
  RR: 8,
  FR: 7,
  "4WD": 6,
  FF: 5,
};
const ATTRIBUTE_REASON_MAP = {
  topSpeed: "Excellent top speed",
  traction: "Strong traction",
  fuel: "Good fuel economy",
  tyres: "Strong tyre management",
  stability: "Stable under braking",
  rotation: "Strong rotation and agility",
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
    rotation: 1,
  };
}

function getCarAttribute(car, field) {
  if (field === "rotation") {
    return Number(car?.rotation ?? DEFAULT_ROTATION[car?.drivetrain] ?? 7);
  }

  return Number(car?.[field] ?? 0);
}

function computeRotationDemand(track) {
  const topSpeed = Number(track?.topSpeed ?? 5);
  const traction = Number(track?.traction ?? 5);
  const stability = Number(track?.stability ?? 5);
  const technicalBias =
    traction * 0.5 + Math.max(0, 9 - topSpeed) * 0.35 + stability * 0.15;

  return Math.min(10, Math.max(3, technicalBias));
}

function getAttributeDemandWeight(
  trackValue,
  raceWeight = 1,
  emphasisBoost = 1,
) {
  const normalized = trackValue / 10;
  const emphasis = 0.5 + normalized * 1.75;
  const tierBoost =
    trackValue >= 8
      ? 1.6
      : trackValue >= 6.5
        ? 1.15
        : trackValue <= 4.5
          ? 0.7
          : 1;

  return (
    normalized * normalized * emphasis * tierBoost * raceWeight * emphasisBoost
  );
}

export function getTrackDemandWeights(track, raceSettings = {}) {
  const raceWeights = getScoreWeights(raceSettings);
  const surfaceModifiers = getTrackSurfaceModifiers(track);
  const kerbDifficulty = Math.max(0, 8 - Number(track?.kerbs ?? 6));
  const attrs = {
    topSpeed: Number(track?.topSpeed ?? 5),
    traction: Number(track?.traction ?? 5),
    fuel: Number(track?.fuel ?? 5),
    tyres: Number(track?.tyres ?? 5),
    stability: Number(track?.stability ?? 5),
  };
  const rotationValue = computeRotationDemand(track);

  const applySurface = (field, weight) =>
    weight * (surfaceModifiers[field] ?? 1);

  return {
    topSpeed: applySurface(
      "topSpeed",
      getAttributeDemandWeight(
        attrs.topSpeed,
        raceWeights.topSpeed,
        attrs.topSpeed >= 8 ? 1.4 : 1,
      ),
    ),
    traction: applySurface(
      "traction",
      getAttributeDemandWeight(
        attrs.traction,
        raceWeights.traction,
        attrs.traction >= 8 ? 1.5 : 1,
      ),
    ),
    fuel: applySurface(
      "fuel",
      getAttributeDemandWeight(
        attrs.fuel,
        raceWeights.fuel,
        attrs.fuel >= 8 ? 1.7 : 1,
      ),
    ),
    tyres: applySurface(
      "tyres",
      getAttributeDemandWeight(
        attrs.tyres,
        raceWeights.tyres,
        attrs.tyres >= 7 ? 1.5 : 1,
      ),
    ),
    stability: applySurface(
      "stability",
      getAttributeDemandWeight(
        attrs.stability,
        raceWeights.stability,
        attrs.stability >= 7 || kerbDifficulty >= 3 ? 1.35 : 1,
      ),
    ),
    rotation: applySurface(
      "rotation",
      getAttributeDemandWeight(
        rotationValue,
        raceWeights.rotation,
        attrs.traction >= 7.5 && attrs.topSpeed <= 8 ? 1.45 : 0.9,
      ),
    ),
  };
}

export function getTrackProfileWeightPercents(track, raceSettings = {}) {
  const demands = getTrackDemandWeights(track, raceSettings);
  const total = SCORING_FIELDS.reduce(
    (sum, field) => sum + (demands[field] ?? 0),
    0,
  );

  if (total <= 0) {
    return Object.fromEntries(SCORING_FIELDS.map((field) => [field, 0]));
  }

  return Object.fromEntries(
    SCORING_FIELDS.map((field) => [
      field,
      Math.round(((demands[field] ?? 0) / total) * 100),
    ]),
  );
}

function getDrivetrainTrackBonus(car, track) {
  const drivetrain = car?.drivetrain;
  let bonus = 0;

  if (drivetrain === "MR" && track.traction >= 8) {
    bonus += 2;
  }

  const isBalanced =
    track.topSpeed >= 7 &&
    track.topSpeed <= 9 &&
    track.traction >= 6 &&
    track.traction <= 8 &&
    track.fuel < 8;

  if (drivetrain === "FR" && isBalanced && track.stability >= 7) {
    bonus += 1.5;
  }

  if (drivetrain === "4WD" && track.traction >= 7.5) {
    bonus += 1;
  }

  if (drivetrain === "FF" && track.traction >= 8 && track.topSpeed <= 7) {
    bonus += 1;
  }

  return bonus;
}

function getWeightedTrackScore(car, track, raceSettings = {}) {
  const demands = getTrackDemandWeights(track, raceSettings);
  let weightedTotal = 0;
  let maxWeightedTotal = 0;

  SCORING_FIELDS.forEach((field) => {
    const demand = demands[field] ?? 0;
    const carValue = getCarAttribute(car, field);
    weightedTotal += carValue * demand;
    maxWeightedTotal += 10 * demand;
  });

  const fitScore =
    maxWeightedTotal > 0 ? (weightedTotal / maxWeightedTotal) * 100 : 0;
  const drivetrainBonus = getDrivetrainTrackBonus(car, track);

  return fitScore + drivetrainBonus;
}

export function scoreCarForTrack(car, track, raceSettings = {}) {
  return Number(getWeightedTrackScore(car, track, raceSettings).toFixed(2));
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

function getCarStrengthContributions(car, championshipTracks, raceSettings = {}) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return SCORING_FIELDS.map((field) => ({
      field,
      contribution: 0,
    }));
  }

  return SCORING_FIELDS.map((field) => {
    const carValue = getCarAttribute(car, field);
    const contribution =
      championshipTracks.reduce((sum, track) => {
        const demands = getTrackDemandWeights(track, raceSettings);
        return sum + carValue * (demands[field] ?? 0);
      }, 0) / championshipTracks.length;

    return {
      field,
      contribution: contribution * (0.65 + carValue / 25),
    };
  });
}

function generateCarReasons(car, championshipTracks, raceSettings = {}, count = 3) {
  const topAttributes = getCarStrengthContributions(
    car,
    championshipTracks,
    raceSettings,
  )
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, count);

  return topAttributes.map(({ field }) => ATTRIBUTE_REASON_MAP[field] ?? field);
}

function resolveTracksByIds(
  selectedTrackIds,
  gameVersion = DEFAULT_GAME_VERSION,
) {
  if (!Array.isArray(selectedTrackIds)) {
    return [];
  }

  const tracks = getTracksForGame(gameVersion);

  return selectedTrackIds
    .map((trackId) => tracks.find((track) => track.id === trackId) ?? null)
    .filter(Boolean);
}

function toPercent(value) {
  return Math.round((Number(value ?? 0) / 10) * 100);
}

function determineChampionshipType(dna) {
  const candidates = [
    { type: "Power Championship", score: dna.highSpeed },
    {
      type: "Technical Championship",
      score: dna.technical * 0.85 + dna.stability * 0.15,
    },
    {
      type: "Traction Championship",
      score: dna.technical * 1.05 - dna.highSpeed * 0.25,
    },
    {
      type: "Endurance Championship",
      score: (dna.fuelImportance + dna.tyreSensitivity) / 2,
    },
  ].sort((a, b) => b.score - a.score);

  if (
    candidates[0].score < 65 ||
    candidates[0].score - candidates[1].score < 5
  ) {
    return "Balanced Championship";
  }

  return candidates[0].type;
}

export function analyzeCalendarDNA(championshipTracks) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return null;
  }

  const averages = getTrackAttributeAverages(championshipTracks);
  const dna = {
    highSpeed: toPercent(averages.topSpeed),
    technical: toPercent(averages.traction),
    stability: toPercent(averages.stability),
    tyreSensitivity: toPercent(averages.tyres),
    fuelImportance: toPercent(averages.fuel),
  };

  return {
    ...dna,
    championshipType: determineChampionshipType(dna),
  };
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

export function analyzeDrivetrainSuitabilityByTrackIds(
  selectedTrackIds,
  gameVersion = DEFAULT_GAME_VERSION,
) {
  return analyzeDrivetrainSuitability(
    resolveTracksByIds(selectedTrackIds, gameVersion),
  );
}

function getCarTrackScores(car, championshipTracks, raceSettings = {}) {
  return championshipTracks.map((track) =>
    scoreCarForTrack(car, track, raceSettings),
  );
}

export function analyzeCarBestAndWeakestTracks(
  car,
  championshipTracks,
  raceSettings = {},
) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return null;
  }

  const trackScores = championshipTracks.map((track) => ({
    track,
    score: scoreCarForTrack(car, track, raceSettings),
  }));

  const best = trackScores.reduce((top, current) =>
    current.score > top.score ? current : top,
  );
  const weakest = trackScores.reduce((low, current) =>
    current.score < low.score ? current : low,
  );

  return {
    bestTrack: {
      name: best.track.name,
      score: Number(best.score.toFixed(2)),
    },
    weakestTrack: {
      name: weakest.track.name,
      score: Number(weakest.score.toFixed(2)),
    },
    scoreDifference: Number((best.score - weakest.score).toFixed(2)),
  };
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
  gameVersion = DEFAULT_GAME_VERSION,
) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds, gameVersion);
  const candidateCars = getRecommendableCarsForGame(gameVersion, carClass);

  return filterEligibleRecommendationResults(
    candidateCars
      .map((car) => ({
        ...car,
        consistencyScore: scoreCarConsistency(
          car,
          championshipTracks,
          raceSettings,
        ),
      }))
      .sort((a, b) => b.consistencyScore - a.consistencyScore),
  );
}

export function recommendCarsForChampionship(
  selectedTrackIds,
  carClass,
  raceSettings = {},
  gameVersion = DEFAULT_GAME_VERSION,
) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds, gameVersion);
  const recommendationStatus = getCalendarRecommendationStatus(
    championshipTracks,
    carClass,
  );

  if (!recommendationStatus.enabled) {
    return [];
  }

  const candidateCars = getRecommendableCarsForGame(gameVersion, carClass);

  const historicalScores = candidateCars.map((car) =>
    getRecommendationHistoricalScore(car.id, gameVersion),
  );
  const maxHistorical = Math.max(...historicalScores, 1);

  return filterEligibleRecommendationResults(
    candidateCars
      .map((car, index) => {
        const technicalScore = scoreCarForChampionship(
          car,
          championshipTracks,
          raceSettings,
        );
        const reasons = appendCommunityConfidenceReason(
          car,
          generateCarReasons(car, championshipTracks, raceSettings, 3),
        );
        const scoreBreakdown = buildRecommendationBreakdown(
          technicalScore,
          car,
          historicalScores[index],
          maxHistorical,
        );

        return {
          ...car,
          technicalScore,
          adjustedTechnicalScore: getAdjustedTechnicalScore(
            technicalScore,
            car,
          ),
          trackFitScore: scoreBreakdown.trackFit,
          technicalFitScore: scoreBreakdown.technicalFit,
          communityConfidence: scoreBreakdown.communityConfidence,
          scoreBreakdown,
          score: scoreBreakdown.overallScore,
          reasons,
        };
      })
      .filter((car) => passesCompetitiveUseGate(car, car.technicalScore))
      .sort(compareRecommendationRanking),
  );
}

export function rankCarsForChampionship(
  championshipTracks,
  availableCars = getRecommendableCarsForGame(DEFAULT_GAME_VERSION),
) {
  const resolvedTracks = championshipTracks;

  return filterEligibleRecommendationResults(
    [...filterRecommendationPool(availableCars)]
      .filter((car) => isCarEligibleForRecommendations(car))
      .map((car) => ({
        ...car,
        score: scoreCarForChampionship(car, resolvedTracks),
      }))
      .sort((a, b) => b.score - a.score),
  );
}

export function recommendBestCarForChampionship(
  championshipTracks,
  availableCars = getRecommendableCarsForGame(DEFAULT_GAME_VERSION),
) {
  const rankedCars = rankCarsForChampionship(championshipTracks, availableCars);
  return rankedCars[0] ?? null;
}
