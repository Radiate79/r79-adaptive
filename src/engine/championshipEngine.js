import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  GR3_171_ATTRIBUTE_DELTAS,
  getTrackProfileDemandBoosts,
  getTrackRacingProfile,
  resolveChampionshipCarAttributes,
} from "../data/championshipAdvisor171.js";
import { buildRecommendationContext } from "../data/dailyRaceEvidence.js";
import {
  ADVISOR_BLEND_WEIGHTS,
  ADVISOR_EVIDENCE_WEIGHTS,
  getAttributeWeaknessPenalty,
  getRaceConditionImportance,
  getRaceDistanceProfile,
} from "./advisorScoringConfig.js";
import { resolveAdvisorConfidence } from "./advisorConfidenceEngine.js";
import { generateAdvisorReasons } from "./advisorExplanationEngine.js";
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
  blendRecommendationScore,
  buildRecommendationBreakdown,
  compareRecommendationRanking,
  getAdjustedTechnicalScore,
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
function normalizeMultiplier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(10, Math.max(0, numeric));
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
  const profile = resolveChampionshipCarAttributes(car);

  if (field === "rotation") {
    return Number(profile?.rotation ?? DEFAULT_ROTATION[profile?.drivetrain] ?? 7);
  }

  return Number(profile?.[field] ?? 0);
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
  const attrs = getTrackAttributeTargets(track);
  const rotationValue = attrs.rotation;
  const profileBoosts = getTrackProfileDemandBoosts(getTrackRacingProfile(track));
  const drivingStyle = track?.drivingStyle ?? "balanced";
  const styleBoosts =
    drivingStyle === "high_speed"
      ? { topSpeed: 1.45, traction: 0.92, rotation: 0.88 }
      : drivingStyle === "technical"
        ? { traction: 1.4, rotation: 1.35, topSpeed: 0.82 }
        : { topSpeed: 1.05, traction: 1.05, rotation: 1.05 };

  const applySurface = (field, weight) =>
    weight *
    (surfaceModifiers[field] ?? 1) *
    (profileBoosts[field] ?? 1) *
    (styleBoosts[field] ?? 1);

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

function getTrackAttributeTargets(track) {
  return {
    topSpeed: Number(track?.topSpeed ?? 5),
    traction: Number(track?.traction ?? 5),
    fuel: Number(track?.fuel ?? 5),
    tyres: Number(track?.tyres ?? 5),
    stability: Number(track?.stability ?? 5),
    rotation: computeRotationDemand(track),
  };
}

function getWeightedTrackScore(car, track, raceSettings = {}) {
  const demands = getTrackDemandWeights(track, raceSettings);
  const targets = getTrackAttributeTargets(track);
  const raceImportance = getRaceConditionImportance(raceSettings);
  let weightedTotal = 0;
  let maxWeightedTotal = 0;
  let weaknessTotal = 0;

  SCORING_FIELDS.forEach((field) => {
    const demand = demands[field] ?? 0;
    const carValue = getCarAttribute(car, field);
    const paceBoost =
      field === "topSpeed" || field === "rotation"
        ? raceImportance.paceEmphasis
        : field === "fuel" || field === "tyres"
          ? raceImportance.enduranceEmphasis
          : 1;
    const effectiveDemand = demand * paceBoost;

    weightedTotal += carValue * effectiveDemand;
    maxWeightedTotal += 10 * effectiveDemand;
    weaknessTotal += getAttributeWeaknessPenalty(targets[field], carValue) * demand;
  });

  const fitScore =
    maxWeightedTotal > 0 ? (weightedTotal / maxWeightedTotal) * 100 : 0;
  const drivetrainBonus = getDrivetrainTrackBonus(car, track);
  const penalty = Math.min(fitScore * 0.35, weaknessTotal * 2.4);

  return Math.max(0, fitScore + drivetrainBonus - penalty);
}

function computeRaceConditionFitScore(car, track, raceSettings = {}) {
  const raceImportance = getRaceConditionImportance(raceSettings);
  const carFuel = getCarAttribute(car, "fuel");
  const carTyres = getCarAttribute(car, "tyres");
  const carStability = getCarAttribute(car, "stability");
  const profile = getRaceDistanceProfile(raceSettings.lapCount);

  let score = 50;

  if (raceImportance.tyreImportance > 0) {
    score += ((carTyres - 5) / 5) * raceImportance.tyreImportance * 18;
    score +=
      ((Number(track?.tyres ?? 5) - 5) / 5) *
      raceImportance.tyreImportance *
      6;
  }

  if (raceImportance.fuelImportance > 0) {
    score += ((carFuel - 5) / 5) * raceImportance.fuelImportance * 16;
  }

  if (profile.paceEmphasis > 1) {
    score +=
      ((getCarAttribute(car, "topSpeed") + getCarAttribute(car, "traction")) /
        20 -
        0.5) *
      (profile.paceEmphasis - 0.85) *
      22;
  }

  if (profile.enduranceEmphasis > 1) {
    score +=
      ((carStability + carTyres) / 20 - 0.5) *
      (profile.enduranceEmphasis - 0.85) *
      18;
  }

  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

function getDetailedStrengthContributions(
  car,
  championshipTracks,
  raceSettings = {},
) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return SCORING_FIELDS.map((field) => ({
      field,
      contribution: 0,
      carValue: getCarAttribute(car, field),
      demand: 0,
    }));
  }

  return SCORING_FIELDS.map((field) => {
    const carValue = getCarAttribute(car, field);
    const contribution =
      championshipTracks.reduce((sum, track) => {
        const demands = getTrackDemandWeights(track, raceSettings);
        const targets = getTrackAttributeTargets(track);
        const fit = carValue * (demands[field] ?? 0);
        const weakness = getAttributeWeaknessPenalty(targets[field], carValue);
        return sum + fit - weakness * 1.5;
      }, 0) / championshipTracks.length;

    const demand =
      championshipTracks.reduce(
        (sum, track) => sum + getTrackAttributeTargets(track)[field],
        0,
      ) / championshipTracks.length;

    return {
      field,
      contribution,
      carValue,
      demand,
    };
  });
}

export function scoreCarForTrack(car, track, raceSettings = {}) {
  return Number(getWeightedTrackScore(car, track, raceSettings).toFixed(2));
}

export function scoreCarRaceConditionFit(car, track, raceSettings = {}) {
  return computeRaceConditionFitScore(car, track, raceSettings);
}

export function scoreCarForChampionship(
  car,
  championshipTracks,
  raceSettings = {},
) {
  if (!Array.isArray(championshipTracks) || championshipTracks.length === 0) {
    return 0;
  }

  const roundScores = championshipTracks.map((track) =>
    computeRoundTechnicalScore(car, track, raceSettings),
  );
  const average =
    roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length;
  const consistency = calculateConsistencyScore(
    championshipTracks.map((track) => scoreCarForTrack(car, track, raceSettings)),
  );

  return Number(
    (
      average * (1 - ADVISOR_BLEND_WEIGHTS.consistency) +
      consistency * ADVISOR_BLEND_WEIGHTS.consistency
    ).toFixed(2),
  );
}

function generateCarReasons(car, championshipTracks, raceSettings = {}) {
  return generateAdvisorReasons(
    getDetailedStrengthContributions(car, championshipTracks, raceSettings),
    raceSettings,
    championshipTracks,
  );
}

function computeRoundTechnicalScore(car, track, raceSettings = {}) {
  const trackFit = getWeightedTrackScore(car, track, raceSettings);
  const raceConditionFit = computeRaceConditionFitScore(car, track, raceSettings);

  return Number(
    (
      trackFit * ADVISOR_BLEND_WEIGHTS.trackFit +
      raceConditionFit * ADVISOR_BLEND_WEIGHTS.raceConditionFit
    ).toFixed(2),
  );
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

function applyBannedCarFilter(cars, raceSettings = {}) {
  const bannedCarNames = raceSettings.bannedCarNames;
  if (!Array.isArray(bannedCarNames) || bannedCarNames.length === 0) {
    return cars;
  }

  const banned = new Set(bannedCarNames);
  return cars.filter((car) => !banned.has(car.name));
}

export function rankCarsByChampionshipConsistency(
  selectedTrackIds,
  carClass,
  raceSettings = {},
  gameVersion = DEFAULT_GAME_VERSION,
) {
  const championshipTracks = resolveTracksByIds(selectedTrackIds, gameVersion);
  const candidateCars = applyBannedCarFilter(
    getRecommendableCarsForGame(gameVersion, carClass),
    raceSettings,
  );

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

  const candidateCars = applyBannedCarFilter(
    getRecommendableCarsForGame(gameVersion, carClass),
    raceSettings,
  );

  if (candidateCars.length === 0 || championshipTracks.length === 0) {
    return [];
  }

  const historicalScores = candidateCars.map((car) =>
    getRecommendationHistoricalScore(car.id, gameVersion) *
      ADVISOR_EVIDENCE_WEIGHTS.historicalPre171Dampening,
  );
  const maxHistorical = Math.max(...historicalScores, 1);
  const recommendationContext = buildRecommendationContext({
    carClass,
    trackId:
      championshipTracks.length === 1 ? championshipTracks[0]?.id : undefined,
    fuelMultiplier: raceSettings.fuelMultiplier ?? 0,
    tyreMultiplier: raceSettings.tyreMultiplier ?? 0,
    lapCount: raceSettings.lapCount,
  });

  return filterEligibleRecommendationResults(
    candidateCars
      .map((car, index) => {
        const trackFitScore = Number(
          (
            championshipTracks.reduce(
              (sum, track) => sum + scoreCarForTrack(car, track, raceSettings),
              0,
            ) / championshipTracks.length
          ).toFixed(2),
        );
        const raceConditionFitScore = Number(
          (
            championshipTracks.reduce(
              (sum, track) =>
                sum + computeRaceConditionFitScore(car, track, raceSettings),
              0,
            ) / championshipTracks.length
          ).toFixed(2),
        );
        const consistencyScore = scoreCarConsistency(
          car,
          championshipTracks,
          raceSettings,
        );
        const technicalScore = scoreCarForChampionship(
          car,
          championshipTracks,
          raceSettings,
        );
        const reasons = generateCarReasons(car, championshipTracks, raceSettings);
        const scoreBreakdown = buildRecommendationBreakdown(
          technicalScore,
          car,
          historicalScores[index],
          maxHistorical,
          recommendationContext,
        );
        scoreBreakdown.trackFit = trackFitScore;
        scoreBreakdown.technicalFit = Number(
          getAdjustedTechnicalScore(technicalScore, car).toFixed(2),
        );
        scoreBreakdown.raceConditionFit = raceConditionFitScore;
        scoreBreakdown.consistencyScore = consistencyScore;
        scoreBreakdown.overallScore = blendRecommendationScore(
          technicalScore,
          car,
          historicalScores[index],
          maxHistorical,
          recommendationContext,
        );

        const advisorConfidence = resolveAdvisorConfidence({
          car,
          trackFitScore,
          historicalScore: historicalScores[index],
          hasCurrent171Profile: car.class === "Gr.3",
          hasTrackEvidence: historicalScores[index] > 0,
        });

        return {
          ...car,
          technicalScore,
          adjustedTechnicalScore: getAdjustedTechnicalScore(
            technicalScore,
            car,
          ),
          trackFitScore,
          raceConditionFitScore,
          technicalFitScore: scoreBreakdown.technicalFit,
          communityConfidence: scoreBreakdown.communityConfidence,
          advisorConfidence,
          scoreBreakdown,
          score: scoreBreakdown.overallScore,
          reasons,
        };
      })
      .filter((car) => passesCompetitiveUseGate(car, car.trackFitScore))
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
