import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  filterEligibleRecommendationResults,
  pickEligibleRecommendation,
} from "../utils/carClassFilter.js";
import {
  appendCommunityConfidenceReason,
  buildRecommendationBreakdown,
  compareRecommendationRanking,
  getAdjustedTechnicalScore,
  getRecommendationHistoricalScore,
  passesCompetitiveUseGate,
} from "../utils/recommendationScoring.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  DRIVING_STYLE_LABELS,
  TRACK_TYPE_LABELS,
} from "../data/gt7/trackTypes.js";
import { getTrackRecommendationStatus } from "../utils/trackClassification.js";
import {
  analyzeCalendarDNA,
  analyzeDrivetrainSuitability,
  getTrackDemandWeights,
  getTrackProfileWeightPercents,
  recommendCarsForChampionship,
  scoreCarConsistency,
  scoreCarForTrack,
} from "./championshipEngine.js";
import { CAR_CLASS_OPTIONS } from "../data/carClasses.js";
import {
  TYRE_COMPOUND_OPTIONS,
  getCompoundTyreModifier,
  normalizeTyreCompound,
} from "../data/tyreCompounds.js";
import {
  formatRaceDistanceLabel,
  getLapCountModifiers,
  resolveLapCount,
} from "../utils/raceDistance.js";

const DEFAULT_ROTATION = {
  MR: 9,
  RR: 8,
  FR: 7,
  "4WD": 6,
  FF: 5,
};

const TRACK_REASONS = {
  topSpeed: "High-speed circuit rewards straight-line pace",
  traction: "Technical layout demands strong corner traction",
  fuel: "Fuel consumption is a key race factor",
  tyres: "Tyre wear management is critical here",
  stability: "Stability under braking and kerbs is important",
  rotation: "Tight corners reward agile rotation",
};

const CAR_REASONS = {
  topSpeed: "Excellent top speed",
  traction: "Strong corner exit traction",
  fuel: "Excellent fuel economy",
  tyres: "Excellent tyre life",
  stability: "Stable under braking",
  rotation: "Strong rotation and agility",
  alr: "Strong historical race success",
  technical: "Well suited to technical circuits",
  power: "Strong on power circuits",
};

/**
 * @typedef {Object} TodaysRaceInput
 * @property {import("../data/gameVersions.js").GameVersion} [gameVersion]
 * @property {string} trackId
 * @property {string} [carClass]
 * @property {boolean} [bopOn]
 * @property {string} [tyreCompound]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 * @property {number} [lapCount]
 * @property {string} [raceFormatId]
 * @property {'sprint' | 'medium' | 'endurance'} [raceLength]
 * @property {string[]} [unavailableCarIds]
 */

function toRating(value) {
  return Math.round(Math.min(100, Math.max(0, Number(value ?? 0))));
}

function getRotationValue(car) {
  return Number(car.rotation ?? DEFAULT_ROTATION[car.drivetrain] ?? 7);
}

function getAccelerationValue(car) {
  const traction = Number(car.traction ?? 7);
  const rotation = getRotationValue(car);
  return Number(((traction + rotation) / 2).toFixed(1));
}

function getBopModifier(bopOn) {
  return bopOn ? 0.92 : 1;
}

function getWeightedAttributeRating(car, track, field, raceSettings, extraWeight = 1) {
  const carValue =
    field === "rotation" ? getRotationValue(car) : Number(car?.[field] ?? 0);
  const demands = getTrackDemandWeights(track, raceSettings);
  const totalDemand = Object.values(demands).reduce((sum, value) => sum + value, 0);
  const trackWeightShare =
    totalDemand > 0 ? (demands[field] ?? 0) / totalDemand : 1 / 6;
  const raceWeight =
    field === "fuel"
      ? raceSettings.fuelMultiplier ?? 1
      : field === "tyres"
        ? raceSettings.tyreMultiplier ?? 1
        : 1;

  const weighted = carValue * (0.35 + trackWeightShare * 3.5) * raceWeight * extraWeight;
  return toRating((weighted / 10) * 100);
}

function buildCarReasons(car, track, raceSettings, historicalScore) {
  const reasons = [];
  const isTechnical = track.traction >= 8;
  const isHighSpeed = track.topSpeed >= 8;

  const attributes = [
    { field: "tyres", value: Number(car.tyres ?? 0), demand: track.tyres },
    { field: "fuel", value: Number(car.fuel ?? 0), demand: track.fuel },
    { field: "traction", value: Number(car.traction ?? 0), demand: track.traction },
    { field: "topSpeed", value: Number(car.topSpeed ?? 0), demand: track.topSpeed },
    { field: "stability", value: Number(car.stability ?? 0), demand: track.stability },
    {
      field: "rotation",
      value: getRotationValue(car),
      demand: isTechnical ? 9 : 6,
    },
  ].sort((a, b) => b.value * b.demand - a.value * a.demand);

  for (const item of attributes.slice(0, 3)) {
    const reason = CAR_REASONS[item.field];
    if (reason) {
      reasons.push(reason);
    }
  }

  if (historicalScore >= 120) {
    reasons.push(CAR_REASONS.alr);
  }

  if (isTechnical && (car.traction >= 8 || getRotationValue(car) >= 8)) {
    reasons.push(CAR_REASONS.technical);
  }

  if (isHighSpeed && car.topSpeed >= 8) {
    reasons.push(CAR_REASONS.power);
  }

  return Array.from(new Set(reasons)).slice(0, 4);
}

function buildStrategyNotes(track, raceSettings, tyreCompound, lapCount) {
  const notes = [];
  const laps = resolveLapCount({ lapCount });
  const lengthMods = getLapCountModifiers(laps);
  const compoundWear = getCompoundTyreModifier(tyreCompound);
  const effectiveTyreDemand =
    Number(track.tyres ?? 5) *
    (raceSettings.tyreMultiplier ?? 1) *
    lengthMods.tyreWeight *
    compoundWear;
  const effectiveFuelDemand =
    Number(track.fuel ?? 5) *
    (raceSettings.fuelMultiplier ?? 1) *
    lengthMods.fuelWeight;

  if (laps <= 12) {
    notes.push(`Aggressive one-stop strategy viable over ${laps} laps.`);
  } else if (laps >= 30) {
    notes.push(`Two-stop strategy likely required over ${laps} laps.`);
  } else if (effectiveTyreDemand >= 7.5 || effectiveFuelDemand >= 7.5) {
    notes.push("Two-stop viable depending on stint management.");
  } else {
    notes.push("One-stop recommended with balanced stint lengths.");
  }

  if (effectiveTyreDemand >= 7 || compoundWear >= 1.1) {
    notes.push("Tyre conservation important — avoid excessive sliding.");
  }

  if (effectiveFuelDemand >= 7.5) {
    notes.push("Fuel saving beneficial — lift and coast where safe.");
  }

  if (track.traction >= 8) {
    notes.push("Prioritise clean exits; mistakes cost more time on technical sections.");
  }

  if (track.topSpeed >= 8) {
    notes.push("Drafting and slipstream can offset straight-line deficits.");
  }

  if (tyreCompound === "S") {
    notes.push("Soft compound — manage graining in opening laps.");
  }

  if (tyreCompound === "H") {
    notes.push("Hard compound — longer stints possible with pace trade-off.");
  }

  if (tyreCompound === "IM") {
    notes.push("Intermediate compound — suited to damp or mixed conditions.");
  }

  if (tyreCompound === "W") {
    notes.push("Wet compound — required when standing water is present.");
  }

  return Array.from(new Set(notes)).slice(0, 5);
}

function buildTrackAnalysis(track, raceSettings) {
  const metrics = [
    { key: "topSpeed", label: "Top Speed" },
    { key: "traction", label: "Traction" },
    { key: "fuel", label: "Fuel Economy" },
    { key: "tyres", label: "Tyre Management" },
    { key: "stability", label: "Stability" },
    { key: "rotation", label: "Rotation" },
  ];
  const profileWeights = getTrackProfileWeightPercents(track, raceSettings);
  const demandWeights = getTrackDemandWeights(track, raceSettings);

  const attributes = metrics.map((metric) => {
    const rawValue =
      metric.key === "rotation"
        ? Number(track?.traction ?? 0)
        : Number(track?.[metric.key] ?? 0);

    return {
      ...metric,
      trackDemand: toRating((rawValue / 10) * 100),
      percent: profileWeights[metric.key] ?? 0,
      weightShare: profileWeights[metric.key] ?? 0,
      demandWeight: Number((demandWeights[metric.key] ?? 0).toFixed(3)),
    };
  });

  const dna = analyzeCalendarDNA([track]);
  const drivetrainRankings = analyzeDrivetrainSuitability([track]);

  const keyDemands = Object.entries({
    topSpeed: track.topSpeed,
    traction: track.traction,
    fuel: track.fuel,
    tyres: track.tyres,
    stability: track.stability,
  })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([field]) => TRACK_REASONS[field])
    .filter(Boolean);

  return {
    track,
    trackType: track.trackType,
    drivingStyle: track.drivingStyle,
    trackTypeLabel: TRACK_TYPE_LABELS[track.trackType] ?? track.trackType,
    drivingStyleLabel:
      DRIVING_STYLE_LABELS[track.drivingStyle] ?? track.drivingStyle,
    attributes,
    profileWeights,
    dna,
    drivetrainRankings,
    keyDemands,
    raceSettings: {
      fuelMultiplier: raceSettings.fuelMultiplier ?? 1,
      tyreMultiplier: raceSettings.tyreMultiplier ?? 1,
    },
  };
}

/**
 * @param {TodaysRaceInput} input
 */
export function analyzeTodaysRace(input) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const tracks = getTracksForGame(gameVersion);
  const track = tracks.find((entry) => entry.id === input.trackId) ?? null;

  if (!track) {
    return {
      ready: false,
      track: null,
      trackAnalysis: null,
      recommendations: [],
      topPick: null,
      alternativeChoice: null,
      strategyNotes: [],
    };
  }

  const raceSettings = {
    fuelMultiplier: input.fuelMultiplier ?? 1,
    tyreMultiplier: input.tyreMultiplier ?? 1,
  };
  const lapCount = resolveLapCount(input);
  const raceFormatId = input.raceFormatId ?? "custom";
  const tyreCompound = normalizeTyreCompound(input.tyreCompound);
  const bopOn = Boolean(input.bopOn);
  const lengthMods = getLapCountModifiers(lapCount);
  const raceDistanceLabel = formatRaceDistanceLabel(lapCount, raceFormatId);
  const compoundWear = getCompoundTyreModifier(tyreCompound);
  const unavailable = new Set(input.unavailableCarIds ?? []);
  const requestedClass = input.carClass ?? "Gr.3";
  const recommendationStatus = getTrackRecommendationStatus(track, requestedClass);

  if (!recommendationStatus.enabled) {
    return {
      ready: true,
      track,
      trackAnalysis: buildTrackAnalysis(track, raceSettings),
      recommendations: [],
      topPick: null,
      alternativeChoice: null,
      strategyNotes: buildStrategyNotes(
        track,
        raceSettings,
        tyreCompound,
        lapCount,
      ),
      recommendationStatus,
      raceContext: {
        gameVersion,
        carClass: requestedClass,
        bopOn,
        tyreCompound,
        lapCount,
        raceFormatId,
        raceDistanceLabel,
        fuelMultiplier: raceSettings.fuelMultiplier,
        tyreMultiplier: raceSettings.tyreMultiplier,
      },
    };
  }

  const baseRecommendations = recommendCarsForChampionship(
    [track.id],
    requestedClass,
    raceSettings,
    gameVersion,
  );

  if (baseRecommendations.length === 0) {
    return {
      ready: true,
      track,
      trackAnalysis: buildTrackAnalysis(track, raceSettings),
      recommendations: [],
      topPick: null,
      alternativeChoice: null,
      strategyNotes: buildStrategyNotes(
        track,
        raceSettings,
        tyreCompound,
        lapCount,
      ),
      recommendationStatus: {
        ...recommendationStatus,
        message: recommendationStatus.message ?? "No supported recommendation yet",
      },
      raceContext: {
        gameVersion,
        carClass: requestedClass,
        bopOn,
        tyreCompound,
        lapCount,
        raceFormatId,
        raceDistanceLabel,
        fuelMultiplier: raceSettings.fuelMultiplier,
        tyreMultiplier: raceSettings.tyreMultiplier,
      },
    };
  }

  const historicalScores = baseRecommendations.map((car) =>
    getRecommendationHistoricalScore(car.id, gameVersion),
  );
  const maxHistorical = Math.max(...historicalScores, 1);

  const enriched = baseRecommendations.map((car) => {
    const trackScore = scoreCarForTrack(car, track, raceSettings);
    const historicalScore = getRecommendationHistoricalScore(
      car.id,
      gameVersion,
    );
    const bopModifier = getBopModifier(bopOn);
    const consistencyScore = scoreCarConsistency(car, [track], raceSettings);

    const fuelRating = getWeightedAttributeRating(
      car,
      track,
      "fuel",
      raceSettings,
      lengthMods.fuelWeight,
    );
    const tyreRating = getWeightedAttributeRating(
      car,
      track,
      "tyres",
      raceSettings,
      lengthMods.tyreWeight * compoundWear,
    );

    const technicalScore = trackScore * bopModifier;
    const scoreBreakdown = buildRecommendationBreakdown(
      technicalScore,
      car,
      historicalScore,
      maxHistorical,
    );
    const overallScore = scoreBreakdown.overallScore;
    const adjustedTechnicalScore = getAdjustedTechnicalScore(
      technicalScore,
      car,
    );

    return {
      id: car.id,
      name: car.name,
      class: car.class,
      drivetrain: car.drivetrain,
      overallScore,
      technicalScore: Number(technicalScore.toFixed(2)),
      adjustedTechnicalScore: Number(adjustedTechnicalScore.toFixed(2)),
      trackFitScore: scoreBreakdown.trackFit,
      technicalFitScore: scoreBreakdown.technicalFit,
      communityConfidence: scoreBreakdown.communityConfidence,
      scoreBreakdown,
      historicalScore,
      strengthRating: toRating(trackScore),
      fuelRating,
      tyreRating,
      stabilityRating: getWeightedAttributeRating(car, track, "stability", raceSettings),
      rotationRating: getWeightedAttributeRating(
        car,
        track,
        "rotation",
        raceSettings,
      ),
      accelerationRating: toRating((getAccelerationValue(car) / 10) * 100),
      consistencyRating: toRating(consistencyScore),
      topSpeedRating: getWeightedAttributeRating(car, track, "topSpeed", raceSettings),
      reasons: appendCommunityConfidenceReason(
        car,
        buildCarReasons(car, track, raceSettings, historicalScore),
      ),
      engineReasons: car.reasons ?? [],
      unavailable: unavailable.has(car.id),
    };
  });

  enriched.sort(compareRecommendationRanking);

  const eligibleEnriched = filterEligibleRecommendationResults(enriched);
  const top10 = filterEligibleRecommendationResults(
    eligibleEnriched
      .filter((car) => passesCompetitiveUseGate(car, car.technicalScore))
      .slice(0, 10),
  );
  const availableRanked = eligibleEnriched.filter((car) => !car.unavailable);
  const topPick = pickEligibleRecommendation(
    availableRanked[0] ?? top10[0] ?? null,
  );
  const alternativeChoice = pickEligibleRecommendation(
    availableRanked.find((car) => car.id !== topPick?.id) ??
      eligibleEnriched.find((car) => car.id !== topPick?.id) ??
      null,
  );

  return {
    ready: true,
    track,
    trackAnalysis: buildTrackAnalysis(track, raceSettings),
    recommendations: top10,
    topPick,
    alternativeChoice,
    recommendationStatus,
    strategyNotes: buildStrategyNotes(
      track,
      raceSettings,
      tyreCompound,
      lapCount,
    ),
    raceContext: {
      gameVersion,
      carClass: requestedClass,
      bopOn,
      tyreCompound,
      lapCount,
      raceFormatId,
      raceDistanceLabel,
      fuelMultiplier: raceSettings.fuelMultiplier,
      tyreMultiplier: raceSettings.tyreMultiplier,
    },
  };
}

export { TYRE_COMPOUND_OPTIONS, CAR_CLASS_OPTIONS };
