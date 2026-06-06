import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import {
  filterEligibleRecommendationResults,
  isCarEligibleForRecommendations,
  pickEligibleRecommendation,
} from "../utils/carClassFilter.js";
import { getCarsForGame, getTracksForGame } from "../utils/gameData.js";
import { loadALRRecords } from "../utils/alrStorage.js";
import {
  analyzeCalendarDNA,
  analyzeDrivetrainSuitability,
  recommendCarsForChampionship,
  scoreCarConsistency,
  scoreCarForTrack,
} from "./championshipEngine.js";
import { getALRResultScore } from "./alrPerformanceEngine.js";

const DEFAULT_ROTATION = {
  MR: 9,
  RR: 8,
  FR: 7,
  "4WD": 6,
  FF: 5,
};

const TYRE_COMPOUND_WEAR = {
  SM: 1.35,
  SS: 1.2,
  S: 1.05,
  M: 1,
  H: 0.85,
  IH: 0.75,
  W: 0.9,
  IM: 0.8,
};

const RACE_LENGTH_LABELS = {
  sprint: "Sprint",
  medium: "Medium",
  endurance: "Endurance",
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
  alr: "High ALR historical success",
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

function getCarALRHistoricalScore(carId, gameVersion = DEFAULT_GAME_VERSION) {
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

  const score = records.reduce(
    (sum, record) => sum + getALRResultScore(record),
    0,
  );

  return Number(score.toFixed(2));
}

function normalizeAlrBonus(historicalScore, maxHistorical) {
  if (maxHistorical <= 0 || historicalScore <= 0) {
    return 0;
  }

  return Number(((historicalScore / maxHistorical) * 8).toFixed(2));
}

function getCompoundTyreModifier(tyreCompound) {
  return TYRE_COMPOUND_WEAR[tyreCompound] ?? 1;
}

function getBopModifier(bopOn) {
  return bopOn ? 0.92 : 1;
}

function getRaceLengthModifiers(raceLength) {
  if (raceLength === "sprint") {
    return { fuelWeight: 0.85, tyreWeight: 0.9, strategyBias: "sprint" };
  }

  if (raceLength === "endurance") {
    return { fuelWeight: 1.25, tyreWeight: 1.2, strategyBias: "endurance" };
  }

  return { fuelWeight: 1, tyreWeight: 1, strategyBias: "medium" };
}

function getWeightedAttributeRating(car, track, field, raceSettings, extraWeight = 1) {
  const carValue = Number(car?.[field] ?? 0);
  const trackDemand = Number(track?.[field] ?? 5);
  const raceWeight =
    field === "fuel"
      ? raceSettings.fuelMultiplier ?? 1
      : field === "tyres"
        ? raceSettings.tyreMultiplier ?? 1
        : 1;

  const weighted = carValue * (0.55 + trackDemand / 20) * raceWeight * extraWeight;
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

function buildStrategyNotes(track, raceSettings, tyreCompound, raceLength) {
  const notes = [];
  const lengthMods = getRaceLengthModifiers(raceLength);
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

  if (raceLength === "sprint") {
    notes.push("Aggressive one-stop strategy viable on sprint distance.");
  } else if (raceLength === "endurance") {
    notes.push("Two-stop strategy likely required on endurance distance.");
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

  if (tyreCompound === "SM" || tyreCompound === "SS") {
    notes.push("Soft compound — manage graining in opening laps.");
  }

  if (tyreCompound === "H" || tyreCompound === "IH") {
    notes.push("Hard compound — longer stints possible with pace trade-off.");
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

  const attributes = metrics.map((metric) => {
    const rawValue =
      metric.key === "rotation"
        ? Number(track?.traction ?? 0)
        : Number(track?.[metric.key] ?? 0);

    return {
      ...metric,
      trackDemand: toRating((rawValue / 10) * 100),
      percent: toRating((rawValue / 10) * 100),
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
    attributes,
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
  const raceLength = input.raceLength ?? "medium";
  const tyreCompound = input.tyreCompound ?? "M";
  const bopOn = Boolean(input.bopOn);
  const lengthMods = getRaceLengthModifiers(raceLength);
  const compoundWear = getCompoundTyreModifier(tyreCompound);
  const unavailable = new Set(input.unavailableCarIds ?? []);

  const baseRecommendations = recommendCarsForChampionship(
    [track.id],
    input.carClass ?? "Gr.3",
    raceSettings,
    gameVersion,
  );

  const historicalScores = baseRecommendations.map((car) =>
    getCarALRHistoricalScore(car.id, gameVersion),
  );
  const maxHistorical = Math.max(...historicalScores, 1);

  const enriched = baseRecommendations.map((car) => {
    const trackScore = scoreCarForTrack(car, track, raceSettings);
    const historicalScore = getCarALRHistoricalScore(car.id, gameVersion);
    const alrBonus = normalizeAlrBonus(historicalScore, maxHistorical);
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

    const overallScore = Number(
      (
        trackScore * bopModifier * 0.72 +
        alrBonus +
        consistencyScore * 0.08
      ).toFixed(2),
    );

    return {
      id: car.id,
      name: car.name,
      class: car.class,
      drivetrain: car.drivetrain,
      overallScore,
      historicalScore,
      strengthRating: toRating(trackScore),
      fuelRating,
      tyreRating,
      stabilityRating: getWeightedAttributeRating(car, track, "stability", raceSettings),
      rotationRating: toRating((getRotationValue(car) / 10) * 100),
      accelerationRating: toRating((getAccelerationValue(car) / 10) * 100),
      consistencyRating: toRating(consistencyScore),
      topSpeedRating: getWeightedAttributeRating(car, track, "topSpeed", raceSettings),
      reasons: buildCarReasons(car, track, raceSettings, historicalScore),
      engineReasons: car.reasons ?? [],
      unavailable: unavailable.has(car.id),
    };
  });

  enriched.sort((a, b) => b.overallScore - a.overallScore);

  const eligibleEnriched = filterEligibleRecommendationResults(enriched);
  const top10 = filterEligibleRecommendationResults(
    eligibleEnriched.slice(0, 10),
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
    strategyNotes: buildStrategyNotes(
      track,
      raceSettings,
      tyreCompound,
      raceLength,
    ),
    raceContext: {
      gameVersion,
      carClass: input.carClass ?? "Gr.3",
      bopOn,
      tyreCompound,
      raceLength,
      raceLengthLabel: RACE_LENGTH_LABELS[raceLength] ?? raceLength,
      fuelMultiplier: raceSettings.fuelMultiplier,
      tyreMultiplier: raceSettings.tyreMultiplier,
    },
  };
}

export const TYRE_COMPOUND_OPTIONS = Object.keys(TYRE_COMPOUND_WEAR);
export const RACE_LENGTH_OPTIONS = [
  { id: "sprint", label: "Sprint (15–20 min)" },
  { id: "medium", label: "Medium (30–40 min)" },
  { id: "endurance", label: "Endurance (60+ min)" },
];
export const CAR_CLASS_OPTIONS = ["Gr.1", "Gr.2", "Gr.3", "Gr.4", "Gr.B", "N"];
