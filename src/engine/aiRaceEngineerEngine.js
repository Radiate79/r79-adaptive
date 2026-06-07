import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import {
  DEFAULT_DRIVER_PROFILE,
  PERSONALISATION_STATUS,
} from "../data/driverProfile.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../data/alrChampionshipWeighting.js";
import {
  isCarEligibleForRecommendations,
  pickEligibleRecommendation,
} from "../utils/carClassFilter.js";
import { getCarsForGame, getRecommendableCarsForGame, getTracksForGame } from "../utils/gameData.js";
import {
  blendRecommendationScore,
  getCommunityConfidence,
  getCommunityConfidenceReason,
} from "../utils/recommendationScoring.js";
import { loadALRRecords } from "../utils/alrStorage.js";
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

/** @type {Record<string, Record<string, number>>} */
const DRIVER_STYLE_WEIGHTS = {
  aggressive: {
    topSpeed: 1.25,
    traction: 1.1,
    rotation: 1.2,
    tyres: 0.85,
    fuel: 0.9,
    stability: 0.9,
    consistency: 0.95,
  },
  balanced: {
    topSpeed: 1,
    traction: 1,
    rotation: 1,
    tyres: 1,
    fuel: 1,
    stability: 1,
    consistency: 1,
  },
  tyreSaver: {
    topSpeed: 0.9,
    traction: 1.05,
    rotation: 0.95,
    tyres: 1.4,
    fuel: 1.05,
    stability: 1.1,
    consistency: 1.15,
  },
  fuelSaver: {
    topSpeed: 0.95,
    traction: 1,
    rotation: 0.95,
    tyres: 1.05,
    fuel: 1.4,
    stability: 1.05,
    consistency: 1.1,
  },
  lateBraker: {
    topSpeed: 1,
    traction: 1.1,
    rotation: 1.05,
    tyres: 1,
    fuel: 1,
    stability: 1.35,
    consistency: 1.05,
  },
  smooth: {
    topSpeed: 0.95,
    traction: 1.1,
    rotation: 0.9,
    tyres: 1.15,
    fuel: 1.1,
    stability: 1.25,
    consistency: 1.2,
  },
};

export const DRIVER_STYLE_OPTIONS = [
  { id: "aggressive", label: "Aggressive" },
  { id: "balanced", label: "Balanced" },
  { id: "tyreSaver", label: "Tyre Saver" },
  { id: "fuelSaver", label: "Fuel Saver" },
  { id: "lateBraker", label: "Late Braker" },
  { id: "smooth", label: "Smooth" },
];

export const WEATHER_OPTIONS = [
  { id: "current", label: "Current (placeholder)" },
];

export const ENGINEER_NOTES = [
  "Today's recommendation is based on current R79 data and historical analysis.",
  "Review after qualifying if conditions change.",
  "Race smarter.",
  "Learn faster.",
  "Never stop improving.",
];

export const TYRE_COMPOUND_OPTIONS = Object.keys(TYRE_COMPOUND_WEAR);

export const RACE_LENGTH_OPTIONS = [
  { id: "sprint", label: "Sprint (15–20 min)" },
  { id: "medium", label: "Medium (30–40 min)" },
  { id: "endurance", label: "Endurance (60+ min)" },
];

function toRating(value) {
  return Math.round(Math.min(100, Math.max(0, Number(value ?? 0))));
}

function getRotationValue(car) {
  return Number(car.rotation ?? DEFAULT_ROTATION[car.drivetrain] ?? 7);
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

  return Number(
    records
      .reduce((sum, record) => sum + getALRResultScore(record), 0)
      .toFixed(2),
  );
}

function getRaceLengthModifiers(raceLength) {
  if (raceLength === "sprint") {
    return { fuelWeight: 0.85, tyreWeight: 0.9 };
  }

  if (raceLength === "endurance") {
    return { fuelWeight: 1.25, tyreWeight: 1.2 };
  }

  return { fuelWeight: 1, tyreWeight: 1 };
}

function getBopModifier(bopOn) {
  return bopOn ? 0.93 : 1;
}

function scoreAttribute(car, track, field, raceSettings, styleWeights, extra = 1) {
  const carValue =
    field === "rotation" ? getRotationValue(car) : Number(car?.[field] ?? 0);
  const trackDemand = Number(
    field === "rotation" ? track?.traction ?? 5 : track?.[field] ?? 5,
  );
  const raceWeight =
    field === "fuel"
      ? raceSettings.fuelMultiplier ?? 1
      : field === "tyres"
        ? raceSettings.tyreMultiplier ?? 1
        : 1;
  const styleWeight = styleWeights[field] ?? 1;
  const weighted =
    carValue * (0.5 + trackDemand / 18) * raceWeight * styleWeight * extra;

  return weighted;
}

function scoreConsistency(car, track, raceSettings) {
  const spread = [
    scoreAttribute(car, track, "topSpeed", raceSettings, DRIVER_STYLE_WEIGHTS.balanced),
    scoreAttribute(car, track, "traction", raceSettings, DRIVER_STYLE_WEIGHTS.balanced),
    scoreAttribute(car, track, "stability", raceSettings, DRIVER_STYLE_WEIGHTS.balanced),
    scoreAttribute(car, track, "tyres", raceSettings, DRIVER_STYLE_WEIGHTS.balanced),
  ];
  const avg = spread.reduce((sum, value) => sum + value, 0) / spread.length;
  const variance =
    spread.reduce((sum, value) => sum + (value - avg) ** 2, 0) / spread.length;

  return Math.max(0, 10 - variance * 0.15);
}

function pickBestTyre(car, track, tyresAvailable, raceSettings, lengthMods) {
  const compounds = tyresAvailable.length > 0 ? tyresAvailable : ["M"];

  let best = { compound: "M", score: -Infinity };

  for (const compound of compounds) {
    const wear = TYRE_COMPOUND_WEAR[compound] ?? 1;
    const tyreDemand =
      Number(track.tyres ?? 5) *
      (raceSettings.tyreMultiplier ?? 1) *
      lengthMods.tyreWeight *
      wear;
    const carTyre = Number(car.tyres ?? 5);
    const paceBonus = compound === "SM" || compound === "SS" ? 1.1 : 1;
    const score = carTyre * paceBonus - tyreDemand * 0.35;

    if (score > best.score) {
      best = { compound, score };
    }
  }

  return best.compound;
}

function getCarShortName(name) {
  const trimmed = String(name ?? "").replace(/\s+Gr\.\d+.*$/i, "").trim();
  return trimmed || name;
}

function buildStrengthPhrases(car, track) {
  const rotation = getRotationValue(car);
  /** @type {{ score: number, text: string }[]} */
  const candidates = [];

  if (Number(car.tyres ?? 0) >= 7) {
    candidates.push({ score: Number(car.tyres), text: "strong tyre stability" });
  } else if (Number(car.tyres ?? 0) >= 5) {
    candidates.push({ score: Number(car.tyres), text: "manageable tyre wear" });
  }

  if (rotation >= 8) {
    candidates.push({ score: rotation, text: "consistent rotation" });
  } else if (rotation >= 6) {
    candidates.push({ score: rotation, text: "balanced corner rotation" });
  }

  if (Number(car.traction ?? 0) >= 8) {
    candidates.push({ score: Number(car.traction), text: "dependable traction" });
  }

  if (Number(car.fuel ?? 0) >= 7) {
    candidates.push({ score: Number(car.fuel), text: "efficient fuel consumption" });
  }

  if (Number(car.stability ?? 0) >= 7) {
    candidates.push({
      score: Number(car.stability),
      text: "stable braking performance",
    });
  }

  if (Number(car.topSpeed ?? 0) >= 8 && Number(track.topSpeed ?? 0) >= 7) {
    candidates.push({ score: Number(car.topSpeed), text: "reliable long-run pace" });
  }

  candidates.sort((a, b) => b.score - a.score);

  const phrases = candidates.map((item) => item.text);

  while (phrases.length < 3) {
    phrases.push("well-rounded race characteristics");
  }

  return phrases.slice(0, 3);
}

function joinStrengthPhrases(phrases) {
  if (phrases.length === 1) {
    return phrases[0];
  }

  if (phrases.length === 2) {
    return `${phrases[0]} and ${phrases[1]}`;
  }

  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

function buildEngineerBriefing(car, track, compound, styleLabel, strengths, confidence) {
  const shortName = getCarShortName(car.name);
  const strengthText = joinStrengthPhrases(strengths);

  return `The ${shortName} is recommended for ${track.name} due to ${strengthText}. A ${compound} compound is appropriate for this race profile, with strategy aligned to a ${styleLabel.toLowerCase()} driving approach. Assessment confidence is ${confidence}%.`;
}

function buildEngineerReport(
  briefing,
  track,
  raceLengthLabel,
  pitWindow,
  historicalScore,
  compound,
) {
  const historicalNote =
    historicalScore > 0
      ? "Historical championship data supports this selection."
      : "Historical data is limited; this assessment is primarily attribute-based.";

  return `${briefing} ${historicalNote} Race distance is classified as ${raceLengthLabel.toLowerCase()}, with ${compound} tyres selected from your available compounds. Estimated pit timing: ${pitWindow.charAt(0).toLowerCase()}${pitWindow.slice(1)}.`;
}

function buildReasoning(car, track, historicalScore, styleId) {
  const points = [];
  const rotation = getRotationValue(car);
  const communityReason = getCommunityConfidenceReason(car);

  if (communityReason) {
    points.push(communityReason);
  }

  if (historicalScore > 0) {
    points.push(
      `Historical rankings indicate proven performance (${historicalScore.toFixed(0)} weighted points).`,
    );
  }

  const attributes = [
    { key: "topSpeed", label: "top speed", car: car.topSpeed, track: track.topSpeed },
    { key: "traction", label: "traction", car: car.traction, track: track.traction },
    { key: "tyres", label: "tyre management", car: car.tyres, track: track.tyres },
    { key: "fuel", label: "fuel economy", car: car.fuel, track: track.fuel },
    { key: "stability", label: "stability", car: car.stability, track: track.stability },
    {
      key: "rotation",
      label: "corner rotation",
      car: rotation,
      track: track.traction,
    },
  ]
    .map((item) => ({
      ...item,
      fit: Number(item.car ?? 0) * (0.55 + Number(item.track ?? 5) / 18),
    }))
    .sort((a, b) => b.fit - a.fit);

  for (const item of attributes.slice(0, 3)) {
    points.push(
      `Track demand for ${item.label} is well matched by this car (${item.car}/10).`,
    );
  }

  const consistency = scoreConsistency(car, track, {
    fuelMultiplier: 1,
    tyreMultiplier: 1,
  });
  points.push(
    `Consistency rating of ${toRating((consistency / 10) * 100)}/100 suggests predictable lap-to-lap performance.`,
  );

  const styleLabel =
    DRIVER_STYLE_OPTIONS.find((option) => option.id === styleId)?.label ??
    "Balanced";
  points.push(`Recommendation weighted for a ${styleLabel.toLowerCase()} driver profile.`);

  return points.slice(0, 6);
}

function buildTyreStrategy(track, raceLength, compound, raceSettings, lengthMods) {
  const wear =
    Number(track.tyres ?? 5) *
    (raceSettings.tyreMultiplier ?? 1) *
    lengthMods.tyreWeight *
    (TYRE_COMPOUND_WEAR[compound] ?? 1);

  if (raceLength === "sprint") {
    return `Open on ${compound}. A single stop is viable; manage graining from lap six onward.`;
  }

  if (raceLength === "endurance" || wear >= 7.5) {
    return `Open on ${compound}. Two stops are likely; extend stint one and pit before mid-race pace degradation.`;
  }

  return `Open on ${compound}. One stop remains viable with measured tyre use through traffic.`;
}

function buildFuelStrategy(track, raceLength, raceSettings, lengthMods, styleId) {
  const demand =
    Number(track.fuel ?? 5) *
    (raceSettings.fuelMultiplier ?? 1) *
    lengthMods.fuelWeight;

  if (styleId === "fuelSaver" || demand >= 7.5) {
    return "Adopt lift-and-coast on straights and short-shift from slow corners; target a modest per-lap fuel delta.";
  }

  if (raceLength === "sprint") {
    return "Prioritise pace throughout; reserve fuel saving for final-lap defence only.";
  }

  return "Maintain a balanced fuel map — conserve in low-risk zones, commit where overtakes are available.";
}

function buildBrakeBalance(car, track, styleId) {
  const stability = Number(car.stability ?? 7);
  const trackStability = Number(track.stability ?? 7);
  let front = 50 + (trackStability - stability) * 1.2;

  if (styleId === "lateBraker") {
    front += 2;
  }

  if (styleId === "aggressive") {
    front -= 1.5;
  }

  front = Math.min(58, Math.max(46, Math.round(front)));
  return `${front}% front / ${100 - front}% rear`;
}

function buildWheelSettings(car, track) {
  const traction = Number(track.traction ?? 5);
  const stability = Number(track.stability ?? 5);

  if (traction >= 8) {
    return "Medium-soft springs, responsive steering — prioritise rotation in technical sections.";
  }

  if (stability >= 8) {
    return "Stiffer rear ARB, increased brake bias stability — confidence under heavy braking.";
  }

  if (Number(car.topSpeed ?? 0) >= 8) {
    return "Lower downforce trim, stable rear toe — maximise straight-line without snap oversteer.";
  }

  return "Balanced baseline setup — refine after practice laps once tyre behaviour is confirmed.";
}

function buildPitWindow(raceLength, track, raceSettings, lengthMods) {
  const tyreStress =
    Number(track.tyres ?? 5) *
    (raceSettings.tyreMultiplier ?? 1) *
    lengthMods.tyreWeight;

  if (raceLength === "sprint") {
    return tyreStress >= 7 ? "Lap 10–14 (one stop)" : "No stop expected";
  }

  if (raceLength === "endurance") {
    return "Stops around laps 12–16 and 28–34 depending on tyre cliff.";
  }

  return tyreStress >= 7 ? "Primary window: laps 14–18" : "Optional stop: laps 18–22";
}

function buildThingsToWatch(track) {
  const items = [];

  if (Number(track.tyres ?? 0) >= 7) {
    items.push("Front tyre wear — avoid sliding on traction zones.");
  }

  if (Number(track.fuel ?? 0) >= 7) {
    items.push("Fuel saving — plan lift points before long straights.");
  }

  if (Number(track.traction ?? 0) >= 8) {
    items.push("Traction zones — clean exits matter more than entry speed.");
  }

  if (Number(track.overtaking ?? 0) >= 7) {
    items.push("Overtaking opportunities — use slipstream on main straight.");
  }

  if (Number(track.kerbs ?? 0) <= 5) {
    items.push("Kerbs — stay smooth; unstable landings cost time.");
  }

  if (items.length === 0) {
    items.push("Tyre temperatures across stint 1.");
    items.push("Brake fade in repeated heavy zones.");
    items.push("Track evolution as rubber builds.");
  }

  return items.slice(0, 5);
}

function buildPlainSummary(car, track, compound, confidence, styleLabel, strengths) {
  const shortName = getCarShortName(car.name);
  const strengthText = joinStrengthPhrases(strengths);

  return `In summary, the ${shortName} offers the most complete package for ${track.name}. Its ${strengthText} align with circuit requirements, ${compound} tyres suit the stint plan, and the ${styleLabel.toLowerCase()} profile was applied throughout the assessment. Confidence stands at ${confidence}%.`;
}

function buildAlternativeSummary(primary, alternative, track) {
  if (!alternative) {
    return null;
  }

  const altShort = getCarShortName(alternative.name);
  const gap = primary.overallScore - alternative.overallScore;
  const gapNote =
    gap < 3
      ? "The performance gap is marginal."
      : "It presents a slightly different performance trade-off.";

  return `The ${altShort} remains a credible alternative at ${track.name}. ${gapNote} Consider this option if your primary selection is unavailable or requires less setup preparation.`;
}

function computeConfidence(top, second, historicalPresent) {
  let score = 62;

  if (top && second) {
    const gap = top.overallScore - second.overallScore;
    score += Math.min(22, gap * 4);
  }

  if (historicalPresent) {
    score += 8;
  }

  if (top?.historicalScore >= 100) {
    score += 6;
  }

  return Math.min(100, Math.round(score));
}

/**
 * @typedef {Object} AIRaceEngineerInput
 * @property {import("../data/gameVersions.js").GameVersion} [gameVersion]
 * @property {string} trackId
 * @property {'sprint' | 'medium' | 'endurance'} [raceLength]
 * @property {number} [tyreMultiplier]
 * @property {number} [fuelMultiplier]
 * @property {string} [weather]
 * @property {boolean} [bopOn]
 * @property {string[]} [tyresAvailable]
 * @property {string[]} [availableCarIds]
 * @property {string} [driverStyle]
 * @property {import("../data/driverProfile.js").DriverProfile} [driverProfile]
 */

/**
 * @param {AIRaceEngineerInput} input
 */
export function analyzeAIRaceEngineer(input) {
  const gameVersion = input.gameVersion ?? DEFAULT_GAME_VERSION;
  const tracks = getTracksForGame(gameVersion);
  const cars = getRecommendableCarsForGame(gameVersion);
  const track = tracks.find((entry) => entry.id === input.trackId) ?? null;

  if (!track) {
    return { ready: false };
  }

  const raceSettings = {
    fuelMultiplier: input.fuelMultiplier ?? 1,
    tyreMultiplier: input.tyreMultiplier ?? 1,
  };
  const raceLength = input.raceLength ?? "medium";
  const bopOn = Boolean(input.bopOn);
  const styleId = input.driverStyle ?? "balanced";
  const styleWeights = DRIVER_STYLE_WEIGHTS[styleId] ?? DRIVER_STYLE_WEIGHTS.balanced;
  const lengthMods = getRaceLengthModifiers(raceLength);
  const tyresAvailable = input.tyresAvailable ?? ["M", "H", "S"];
  const availableSet = new Set(
    (input.availableCarIds ?? []).filter((carId) => {
      const car = getCarsForGame(gameVersion).find((entry) => entry.id === carId);
      return car && isCarEligibleForRecommendations(car);
    }),
  );

  const candidateCars =
    availableSet.size > 0
      ? cars.filter((car) => availableSet.has(car.id))
      : cars;

  const historicalScores = candidateCars.map((car) =>
    getCarALRHistoricalScore(car.id, gameVersion),
  );
  const maxHistorical = Math.max(...historicalScores, 1);

  const ranked = candidateCars.map((car) => {
    const fields = ["topSpeed", "traction", "tyres", "fuel", "stability", "rotation"];
    const attributeScore = fields.reduce(
      (sum, field) =>
        sum +
        scoreAttribute(
          car,
          track,
          field,
          raceSettings,
          styleWeights,
          field === "tyres" ? lengthMods.tyreWeight : field === "fuel" ? lengthMods.fuelWeight : 1,
        ),
      0,
    );

    const historicalScore = getCarALRHistoricalScore(car.id, gameVersion);
    const consistency = scoreConsistency(car, track, raceSettings);
    const compound = pickBestTyre(
      car,
      track,
      tyresAvailable,
      raceSettings,
      lengthMods,
    );

    const technicalScore =
      (attributeScore / fields.length) * getBopModifier(bopOn);
    const overallScore = blendRecommendationScore(
      technicalScore,
      car,
      historicalScore,
      maxHistorical,
    );

    return {
      id: car.id,
      name: car.name,
      class: car.class,
      drivetrain: car.drivetrain,
      overallScore,
      technicalScore: Number(technicalScore.toFixed(2)),
      communityConfidence: getCommunityConfidence(car),
      historicalScore,
      recommendedCompound: compound,
      strengthRating: toRating((attributeScore / fields.length) * 10),
      consistencyRating: toRating((consistency / 10) * 100),
      reasoning: buildReasoning(car, track, historicalScore, styleId),
    };
  });

  ranked.sort((a, b) => b.overallScore - a.overallScore);

  const topPick = pickEligibleRecommendation(ranked[0] ?? null);
  const alternativeChoice = pickEligibleRecommendation(ranked[1] ?? null);
  const styleLabel =
    DRIVER_STYLE_OPTIONS.find((option) => option.id === styleId)?.label ??
    "Balanced";

  const historicalPresent = ranked.some((car) => car.historicalScore > 0);
  const confidenceScore = computeConfidence(
    topPick,
    alternativeChoice,
    historicalPresent,
  );

  const compound = topPick?.recommendedCompound ?? "M";
  const topCarData =
    candidateCars.find((car) => car.id === topPick?.id) ?? topPick ?? null;
  const raceLengthLabel = RACE_LENGTH_LABELS[raceLength] ?? raceLength;
  const pitWindow = buildPitWindow(raceLength, track, raceSettings, lengthMods);
  const strengths = topCarData
    ? buildStrengthPhrases(topCarData, track)
    : ["well-rounded race characteristics"];
  const engineerBriefing = topPick
    ? buildEngineerBriefing(
        topPick,
        track,
        compound,
        styleLabel,
        strengths,
        confidenceScore,
      )
    : null;
  const engineerReport =
    topPick && engineerBriefing
      ? buildEngineerReport(
          engineerBriefing,
          track,
          raceLengthLabel,
          pitWindow,
          topPick.historicalScore,
          compound,
        )
      : null;

  const driverProfile = input.driverProfile ?? DEFAULT_DRIVER_PROFILE;

  return {
    ready: true,
    track,
    personalisation: {
      active: PERSONALISATION_STATUS.active,
      label: PERSONALISATION_STATUS.label,
      profile: driverProfile,
    },
    engineerBriefing,
    engineerReport,
    recommendedCar: topPick,
    tyreStrategy: buildTyreStrategy(
      track,
      raceLength,
      compound,
      raceSettings,
      lengthMods,
    ),
    fuelStrategy: buildFuelStrategy(
      track,
      raceLength,
      raceSettings,
      lengthMods,
      styleId,
    ),
    brakeBalance: topPick
      ? buildBrakeBalance(
          candidateCars.find((car) => car.id === topPick.id) ?? {},
          track,
          styleId,
        )
      : null,
    wheelSettings: topPick
      ? buildWheelSettings(
          candidateCars.find((car) => car.id === topPick.id) ?? {},
          track,
        )
      : null,
    pitWindow,
    confidenceScore,
    aiReasoning: topPick?.reasoning ?? [],
    whyRecommendation: topPick
      ? buildPlainSummary(
          topPick,
          track,
          compound,
          confidenceScore,
          styleLabel,
          strengths,
        )
      : null,
    alternativeChoice: alternativeChoice
      ? {
          car: alternativeChoice,
          summary: buildAlternativeSummary(topPick, alternativeChoice, track),
          reasoning: alternativeChoice.reasoning.slice(0, 4),
        }
      : null,
    thingsToWatch: buildThingsToWatch(track),
    raceContext: {
      gameVersion,
      raceLength,
      raceLengthLabel: RACE_LENGTH_LABELS[raceLength] ?? raceLength,
      bopOn,
      weather: input.weather ?? "current",
      driverStyle: styleLabel,
      fuelMultiplier: raceSettings.fuelMultiplier,
      tyreMultiplier: raceSettings.tyreMultiplier,
      tyresAvailable,
    },
  };
}
