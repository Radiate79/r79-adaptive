import { DEFAULT_GAME_VERSION } from "../data/gameVersions.js";
import { buildRecommendationContext } from "../data/dailyRaceEvidence.js";
import {
  DEFAULT_DRIVER_PROFILE,
  PERSONALISATION_STATUS,
} from "../data/driverProfile.js";
import {
  isCarEligibleForRecommendations,
  pickEligibleRecommendation,
} from "../utils/carClassFilter.js";
import { getCarsForGame, getRecommendableCarsForGame, getTracksForGame } from "../utils/gameData.js";
import { getTrackRecommendationStatus } from "../utils/trackClassification.js";
import {
  buildRecommendationBreakdown,
  compareRecommendationRanking,
  getCommunityConfidenceReason,
  getRecommendationHistoricalScore,
  passesCompetitiveUseGate,
} from "../utils/recommendationScoring.js";
import {
  scoreCarConsistency,
  scoreCarForTrack,
} from "./championshipEngine.js";
import { findWheelSetupForRaceEngineer } from "./wheelSettingsEngine.js";
import { loadWheelSettingsPreferences } from "../utils/wheelSetupsStorage.js";
import {
  TYRE_COMPOUND_OPTIONS,
  TYRE_COMPOUND_WEAR,
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

export const ENGINEER_NOTES = [
  "Today's recommendation is based on current R79 data and historical analysis.",
  "Review after qualifying if conditions change.",
  "Race smarter.",
  "Learn faster.",
  "Never stop improving.",
];

export { TYRE_COMPOUND_OPTIONS };

function toRating(value) {
  return Math.round(Math.min(100, Math.max(0, Number(value ?? 0))));
}

function getRotationValue(car) {
  return Number(car.rotation ?? DEFAULT_ROTATION[car.drivetrain] ?? 7);
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
      ? raceSettings.fuelMultiplier ?? 0
      : field === "tyres"
        ? raceSettings.tyreMultiplier ?? 0
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
  const compounds = (tyresAvailable.length > 0 ? tyresAvailable : ["M"]).filter(
    (compound) => TYRE_COMPOUND_OPTIONS.includes(compound),
  );

  let best = { compound: "M", score: -Infinity };

  for (const compound of compounds) {
    const wear = TYRE_COMPOUND_WEAR[compound] ?? 1;
    const tyreDemand =
      Number(track.tyres ?? 5) *
      (raceSettings.tyreMultiplier ?? 0) *
      lengthMods.tyreWeight *
      wear;
    const carTyre = Number(car.tyres ?? 5);
    const paceBonus = compound === "S" ? 1.1 : 1;
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

function buildWeaknessList(car, track) {
  if (Array.isArray(car?.weaknesses) && car.weaknesses.length > 0) {
    return car.weaknesses;
  }

  const items = [];

  if (Number(car?.tyres ?? 7) <= 5 && Number(track.tyres ?? 5) >= 7) {
    items.push("Higher tyre wear on abrasive circuits.");
  }

  if (Number(car?.fuel ?? 7) <= 5 && Number(track.fuel ?? 5) >= 7) {
    items.push("Fuel consumption may require saving.");
  }

  if (Number(car?.stability ?? 7) <= 5 && Number(track.stability ?? 5) >= 7) {
    items.push("Less stable under heavy braking.");
  }

  if (items.length === 0) {
    items.push("No significant weaknesses identified for this circuit profile.");
  }

  return items.slice(0, 4);
}

function buildEngineerReportSections({
  topPick,
  topCarData,
  track,
  compound,
  confidenceScore,
  reasoning,
  strengths,
  tyreStrategy,
  fuelStrategy,
  thingsToWatch,
}) {
  const trackName = track.displayName ?? track.name;
  const shortName = getCarShortName(topPick.name);
  const summary = `The ${shortName} is the strongest choice for ${trackName} on ${compound} tyres (${confidenceScore}% confidence).`;
  const whyThisCar = reasoning?.length
    ? reasoning.slice(0, 4)
    : [`Strong ${joinStrengthPhrases(strengths)} suit this circuit.`];
  const safeStrengths = Array.isArray(strengths) ? strengths : [];
  const strengthItems = safeStrengths.map(
    (phrase) => phrase.charAt(0).toUpperCase() + phrase.slice(1),
  );

  return {
    summary,
    whyThisCar: Array.isArray(whyThisCar) ? whyThisCar : [],
    strengths: strengthItems,
    weaknesses: buildWeaknessList(topCarData ?? topPick, track),
    tyreRecommendation: tyreStrategy ?? "",
    fuelStrategy: fuelStrategy ?? "",
    strategyNotes: Array.isArray(thingsToWatch) ? thingsToWatch : [],
  };
}

function buildReasoning(car, track, historicalScore, styleId, recommendationContext) {
  const points = [];
  const rotation = getRotationValue(car);
  const communityReason = getCommunityConfidenceReason(
    car,
    recommendationContext,
  );

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

function buildTyreStrategy(track, lapCount, compound, raceSettings, lengthMods) {
  const laps = resolveLapCount({ lapCount });
  const wear =
    Number(track.tyres ?? 5) *
    (raceSettings.tyreMultiplier ?? 0) *
    lengthMods.tyreWeight *
    (TYRE_COMPOUND_WEAR[compound] ?? 1);

  if (laps <= 12) {
    return `Open on ${compound}. A single stop is viable over ${laps} laps; manage graining from lap six onward.`;
  }

  if (laps >= 30 || wear >= 7.5) {
    return `Open on ${compound}. Two stops are likely over ${laps} laps; extend stint one and pit before mid-race pace degradation.`;
  }

  return `Open on ${compound}. One stop remains viable with measured tyre use through traffic.`;
}

function buildFuelStrategy(track, lapCount, raceSettings, lengthMods, styleId) {
  const laps = resolveLapCount({ lapCount });
  const demand =
    Number(track.fuel ?? 5) *
    (raceSettings.fuelMultiplier ?? 0) *
    lengthMods.fuelWeight;

  if (styleId === "fuelSaver" || demand >= 7.5) {
    return "Adopt lift-and-coast on straights and short-shift from slow corners; target a modest per-lap fuel delta.";
  }

  if (laps <= 12) {
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

function buildPitWindow(lapCount, track, raceSettings, lengthMods) {
  const laps = resolveLapCount({ lapCount });
  const tyreStress =
    Number(track.tyres ?? 5) *
    (raceSettings.tyreMultiplier ?? 0) *
    lengthMods.tyreWeight;

  if (laps <= 12) {
    return tyreStress >= 7
      ? `Lap ${Math.max(4, Math.round(laps * 0.55))}–${Math.max(6, Math.round(laps * 0.85))} (one stop)`
      : "No stop expected";
  }

  if (laps >= 30) {
    return `Stops around laps ${Math.round(laps * 0.3)}–${Math.round(laps * 0.4)} and ${Math.round(laps * 0.65)}–${Math.round(laps * 0.75)} depending on tyre cliff.`;
  }

  return tyreStress >= 7
    ? `Primary window: laps ${Math.round(laps * 0.5)}–${Math.round(laps * 0.65)}`
    : `Optional stop: laps ${Math.round(laps * 0.7)}–${Math.round(laps * 0.85)}`;
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
 * @property {number} [lapCount]
 * @property {string} [raceFormatId]
 * @property {'sprint' | 'medium' | 'endurance'} [raceLength]
 * @property {number} [tyreMultiplier]
 * @property {number} [fuelMultiplier]
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
    return {
      ready: false,
      recommendations: [],
      strategyNotes: [],
      aiReasoning: [],
      engineerReportSections: null,
    };
  }

  const recommendationStatus = getTrackRecommendationStatus(track, "Gr.3");

  const raceSettings = {
    fuelMultiplier: input.fuelMultiplier ?? 0,
    tyreMultiplier: input.tyreMultiplier ?? 0,
  };
  const lapCount = resolveLapCount(input);
  const raceFormatId = input.raceFormatId ?? "custom";
  const raceDistanceLabel = formatRaceDistanceLabel(lapCount, raceFormatId);
  const bopOn = Boolean(input.bopOn);
  const styleId = input.driverStyle ?? "balanced";
  const styleWeights = DRIVER_STYLE_WEIGHTS[styleId] ?? DRIVER_STYLE_WEIGHTS.balanced;
  const lengthMods = getLapCountModifiers(lapCount);
  const tyresAvailable = input.tyresAvailable ?? ["M", "H", "S"];
  const availableSet = new Set(
    (input.availableCarIds ?? []).filter((carId) => {
      const car = getCarsForGame(gameVersion).find((entry) => entry.id === carId);
      return car && isCarEligibleForRecommendations(car);
    }),
  );

  let candidateCars =
    availableSet.size > 0
      ? cars.filter((car) => availableSet.has(car.id))
      : cars;

  if (!recommendationStatus.enabled) {
    if (recommendationStatus.recommendedClass) {
      const surfaceCars = getRecommendableCarsForGame(
        gameVersion,
        recommendationStatus.recommendedClass,
      );
      candidateCars =
        availableSet.size > 0
          ? surfaceCars.filter((car) => availableSet.has(car.id))
          : surfaceCars;
    }

    if (candidateCars.length === 0) {
      return {
        ready: true,
        track,
        recommendationStatus,
        personalisation: {
          active: PERSONALISATION_STATUS.active,
          label: PERSONALISATION_STATUS.label,
          profile: input.driverProfile ?? DEFAULT_DRIVER_PROFILE,
        },
        recommendedCar: null,
        alternativeChoice: null,
        engineerReportSections: null,
        tyreStrategy: [],
        fuelStrategy: [],
        brakeBalance: null,
        confidenceScore: 0,
        rankedCars: [],
      };
    }
  }

  const historicalScores = candidateCars.map((car) =>
    getRecommendationHistoricalScore(car.id, gameVersion),
  );
  const maxHistorical = Math.max(...historicalScores, 1);
  const recommendationContext = buildRecommendationContext({
    trackId: track.id,
    carClass: "Gr.3",
    lapCount,
    fuelMultiplier: raceSettings.fuelMultiplier,
    tyreMultiplier: raceSettings.tyreMultiplier,
  });

  const ranked = candidateCars.map((car) => {
    const historicalScore = getRecommendationHistoricalScore(
      car.id,
      gameVersion,
    );
    const consistency = scoreCarConsistency(car, [track], raceSettings);
    const compound = pickBestTyre(
      car,
      track,
      tyresAvailable,
      raceSettings,
      lengthMods,
    );

    const baseTrackScore = scoreCarForTrack(car, track, raceSettings);
    const styleBias = Object.entries(styleWeights).reduce((sum, [field, weight]) => {
      const carValue =
        field === "rotation"
          ? getRotationValue(car)
          : Number(car?.[field] ?? 5);
      return sum + (Number(weight) - 1) * (carValue / 50);
    }, 0);
    const technicalScore =
      baseTrackScore * getBopModifier(bopOn) * (1 + styleBias);
    const breakdown = buildRecommendationBreakdown(
      technicalScore,
      car,
      historicalScore,
      maxHistorical,
      recommendationContext,
    );

    return {
      id: car.id,
      name: car.name,
      class: car.class,
      drivetrain: car.drivetrain,
      overallScore: breakdown.overallScore,
      technicalScore: breakdown.trackFit,
      adjustedTechnicalScore: breakdown.technicalFit,
      communityConfidence: breakdown.communityConfidence,
      communityModifier: breakdown.communityModifier,
      trackFit: breakdown.trackFit,
      historicalScore,
      recommendedCompound: compound,
      strengthRating: toRating(technicalScore),
      consistencyRating: toRating(consistency),
      reasoning: buildReasoning(
        car,
        track,
        historicalScore,
        styleId,
        recommendationContext,
      ),
    };
  });

  ranked.sort(compareRecommendationRanking);

  const eligibleRanked = ranked.filter((entry) => {
    const carData = candidateCars.find((car) => car.id === entry.id);
    return (
      carData &&
      passesCompetitiveUseGate(carData, entry.technicalScore ?? entry.trackFit)
    );
  });

  const topPick = pickEligibleRecommendation(eligibleRanked[0] ?? null);
  const alternativeChoice = pickEligibleRecommendation(
    eligibleRanked.find((entry) => entry.id !== topPick?.id) ?? null,
  );
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
  const pitWindow = buildPitWindow(lapCount, track, raceSettings, lengthMods);
  const strengths = topCarData
    ? buildStrengthPhrases(topCarData, track)
    : ["well-rounded race characteristics"];
  const tyreStrategy = buildTyreStrategy(
    track,
    lapCount,
    compound,
    raceSettings,
    lengthMods,
  );
  const fuelStrategy = buildFuelStrategy(
    track,
    lapCount,
    raceSettings,
    lengthMods,
    styleId,
  );
  const thingsToWatch = buildThingsToWatch(track);
  const engineerReportSections = topPick
    ? buildEngineerReportSections({
        topPick,
        topCarData,
        track,
        compound,
        confidenceScore,
        reasoning: topPick.reasoning,
        strengths,
        tyreStrategy,
        fuelStrategy,
        thingsToWatch,
      })
    : null;

  const driverProfile = input.driverProfile ?? DEFAULT_DRIVER_PROFILE;
  const wheelPreferences = loadWheelSettingsPreferences();
  const engineerTyreCompound = compound ?? tyresAvailable[0] ?? "M";
  const wheelSetupMatch = topPick
    ? findWheelSetupForRaceEngineer({
        gameVersion,
        wheelBase: wheelPreferences.wheelBase ?? "thrustmaster_t598",
        carId: topPick.id,
        trackId: track.id,
        tyreCompound: engineerTyreCompound,
        bopOn,
      })
    : null;

  return {
    ready: true,
    track,
    recommendationStatus,
    wheelSetupMatch,
    personalisation: {
      active: PERSONALISATION_STATUS.active,
      label: PERSONALISATION_STATUS.label,
      profile: driverProfile,
    },
    engineerReportSections,
    recommendedCar: topPick,
    tyreStrategy,
    fuelStrategy,
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
    alternativeChoice: alternativeChoice
      ? {
          car: alternativeChoice,
          summary: buildAlternativeSummary(topPick, alternativeChoice, track),
          reasoning: Array.isArray(alternativeChoice.reasoning)
            ? alternativeChoice.reasoning.slice(0, 4)
            : [],
        }
      : null,
    thingsToWatch,
    raceContext: {
      gameVersion,
      lapCount,
      raceFormatId,
      raceDistanceLabel,
      bopOn,
      driverStyle: styleLabel,
      fuelMultiplier: raceSettings.fuelMultiplier,
      tyreMultiplier: raceSettings.tyreMultiplier,
      tyresAvailable,
    },
  };
}
