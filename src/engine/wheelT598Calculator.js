import { getT598OptionsForField } from "../data/wheelBases.js";
import {
  GT7_171_PHYSICS_EMPHASIS,
  T598_FIELD_WEIGHTS,
  TYRE_COMPOUND_GRIP_INDEX,
} from "../data/wheelSettingsConfig.js";
import {
  getCompoundTyreModifier,
  normalizeTyreCompound,
} from "../data/tyreCompounds.js";
import { calculateRaceWearProfile } from "./pitstopStrategyEngine.js";
import { inferRaceObjective } from "./carTrackInteraction.js";
import { sanitizeWheelValues } from "./wheelSchemaValidation.js";
import { buildCarDynamicsSignals } from "./carDynamicsProfile.js";
import { buildTrackDynamicsSignals } from "./trackDynamicsProfile.js";

/**
 * @param {Record<string, number>} weights
 * @param {Record<string, number | null | undefined>} signals
 */
function weightedSignal(weights, signals) {
  let totalWeight = 0;
  let sum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const signal = signals[key];
    if (signal == null || !Number.isFinite(Number(signal))) {
      continue;
    }

    totalWeight += Math.abs(weight);
    sum += Number(signal) * weight;
  }

  if (totalWeight <= 0) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, 0.5 + sum / (totalWeight * 2)));
}

/**
 * @param {string[]} options
 * @param {string} value
 */
function enumToContinuous(options, value) {
  const index = options.findIndex(
    (option) => String(option).toLowerCase() === String(value).toLowerCase(),
  );
  if (index < 0) {
    return 0.5;
  }
  return options.length <= 1 ? 0.5 : index / (options.length - 1);
}

/**
 * @param {string[]} options
 * @param {number} continuous
 */
function continuousToEnum(options, continuous) {
  const index = Math.round(continuous * (options.length - 1));
  return options[Math.max(0, Math.min(options.length - 1, index))];
}

/**
 * @param {string | number} value
 */
function percentToContinuous(value) {
  const match = String(value).match(/(\d+)/);
  if (!match) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, Number(match[1]) / 100));
}

/**
 * @param {number} continuous
 * @param {number} step
 */
function continuousToPercent(continuous, step = 5) {
  const percent = Math.round((continuous * 100) / step) * step;
  return `${Math.min(100, Math.max(0, percent))}%`;
}

/**
 * @param {number} anchor
 * @param {number} model
 * @param {number} anchorWeight
 */
function blendContinuous(anchor, model, anchorWeight) {
  const weight = Math.min(1, Math.max(0, anchorWeight));
  return anchor * (1 - weight) + model * weight;
}

/**
 * @param {Record<string, string | number>} anchorValues
 * @param {{
 *   carProfile: ReturnType<import("./carDynamicsProfile.js").resolveCarDynamicsProfile>,
 *   trackProfile: ReturnType<import("./trackDynamicsProfile.js").resolveTrackDynamicsProfile>,
 *   tyreCompound?: string,
 *   lapCount?: number,
 *   tyreMultiplier?: number,
 *   fuelMultiplier?: number,
 *   anchorWeight?: number,
 * }} context
 */
export function buildRaceContextSignals(context) {
  const tyreCompound = normalizeTyreCompound(context.tyreCompound);
  const tyreMultiplier = Number(context.tyreMultiplier ?? 0);
  const fuelMultiplier = Number(context.fuelMultiplier ?? 0);
  const lapCount = Number(context.lapCount ?? 0);
  const wearProfile = calculateRaceWearProfile(
    context.carProfile.car ?? {},
    context.trackProfile.track ?? {},
    {
      lapCount,
      tyreMultiplier,
      fuelMultiplier,
    },
  );
  const objective = inferRaceObjective(lapCount, tyreMultiplier, fuelMultiplier);
  const gripIndex = TYRE_COMPOUND_GRIP_INDEX[tyreCompound] ?? 0.88;

  const raceTyreWear =
    tyreMultiplier <= 0
      ? 0
      : Math.min(1, wearProfile.tyreStress / 10 + tyreMultiplier / 12);
  const raceEndurance = objective === "endurance" || lapCount >= 20 ? 1 : 0;
  const raceSprint =
    objective === "qualifying" || (lapCount > 0 && lapCount <= 8) ? 1 : 0;
  const raceConsistency = Math.min(
    1,
    raceTyreWear * 0.65 + (raceEndurance ? 0.35 : 0),
  );
  const raceFatigue = Math.min(1, raceConsistency * 0.7 + raceEndurance * 0.3);

  return {
    tyreCompound,
    gripIndex,
    compoundWear: getCompoundTyreModifier(tyreCompound),
    raceTyreWear,
    raceEndurance,
    raceSprint,
    raceConsistency,
    raceFatigue,
    objective,
    wearProfile,
    /** Fuel multiplier does not imply starting mass — only long-run workload. */
    fuelLongRun:
      fuelMultiplier >= 2 && lapCount >= 15
        ? Math.min(1, fuelMultiplier / 10)
        : 0,
  };
}

/**
 * @param {Record<string, string | number>} anchorValues
 * @param {{
 *   carProfile: ReturnType<import("./carDynamicsProfile.js").resolveCarDynamicsProfile>,
 *   trackProfile: ReturnType<import("./trackDynamicsProfile.js").resolveTrackDynamicsProfile>,
 *   raceContext: ReturnType<typeof buildRaceContextSignals>,
 *   anchorWeight?: number,
 * }} input
 */
export function computeT598ContinuousTargets(anchorValues, input) {
  const carSignals = buildCarDynamicsSignals(input.carProfile);
  const trackSignals = buildTrackDynamicsSignals(input.trackProfile);
  const race = input.raceContext;

  const signals = {
    ...carSignals,
    ...trackSignals,
    tyreGrip: race.gripIndex,
    raceTyreWear: race.raceTyreWear,
    raceEndurance: race.raceEndurance,
    raceSprint: race.raceSprint,
    raceConsistency: race.raceConsistency,
    raceFatigue: race.raceFatigue,
    physicsDetail: GT7_171_PHYSICS_EMPHASIS.tyreSlipDetail / 1.1,
    physicsDamping: GT7_171_PHYSICS_EMPHASIS.suspensionDamping / 1.1,
    clippingRisk:
      race.gripIndex != null && carSignals.carRotation != null
        ? Math.min(1, race.gripIndex * 0.55 + carSignals.carRotation * 0.45)
        : race.gripIndex,
    defaultLow: 0.08,
  };

  /** @type {Record<string, number>} */
  const continuous = {};

  for (const [fieldKey, weights] of Object.entries(T598_FIELD_WEIGHTS)) {
    const options = getT598OptionsForField(fieldKey);
    const anchorRaw = anchorValues[fieldKey];
    const anchorContinuous =
      fieldKey === "master" || fieldKey === "damper" || fieldKey === "spring"
        ? percentToContinuous(anchorRaw ?? "50%")
        : options
          ? enumToContinuous(options, String(anchorRaw ?? options[Math.floor(options.length / 2)]))
          : 0.5;

    const modelContinuous = weightedSignal(weights, signals);
    continuous[fieldKey] = blendContinuous(
      anchorContinuous,
      modelContinuous,
      input.anchorWeight ?? 0.35,
    );
  }

  return { continuous, signals };
}

/**
 * @param {Record<string, number>} continuous
 * @param {Record<string, string | number>} anchorValues
 */
export function quantizeT598ContinuousTargets(continuous, anchorValues = {}) {
  /** @type {Record<string, string | number>} */
  const values = { ...anchorValues };

  for (const [fieldKey, target] of Object.entries(continuous)) {
    const options = getT598OptionsForField(fieldKey);
    if (!options) {
      continue;
    }

    if (fieldKey === "master" || fieldKey === "damper") {
      const step = fieldKey === "master" ? 5 : 10;
      values[fieldKey] = continuousToPercent(target, step);
      continue;
    }

    if (fieldKey === "spring") {
      values[fieldKey] = continuousToPercent(Math.min(target, 0.12), 5);
      continue;
    }

    values[fieldKey] = continuousToEnum(options, target);
  }

  return values;
}

/**
 * @param {string} fieldKey
 * @param {Record<string, number | null | undefined>} signals
 * @param {ReturnType<typeof buildRaceContextSignals>} raceContext
 * @param {ReturnType<typeof resolveCarDynamicsProfile>} carProfile
 * @param {ReturnType<typeof resolveTrackDynamicsProfile>} trackProfile
 */
function buildCalculationReason(fieldKey, signals, raceContext, carProfile, trackProfile) {
  const weights = T598_FIELD_WEIGHTS[fieldKey] ?? {};
  const ranked = Object.entries(weights)
    .map(([signalKey, weight]) => ({
      signalKey,
      weight: Math.abs(weight),
      value: signals[signalKey],
    }))
    .filter((entry) => entry.value != null && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2);

  if (!ranked.length) {
    return "";
  }

  const carName = carProfile.car?.name ?? "this car";
  const trackName = trackProfile.displayName || "this circuit";
  const descriptors = ranked.map((entry) => {
    switch (entry.signalKey) {
      case "carRotation":
        return `${carName}'s rotation tendency`;
      case "carStability":
        return `${carName}'s stability`;
      case "trackHighSpeed":
        return `${trackName}'s high-speed demands`;
      case "trackKerb":
        return `${trackName}'s kerb load`;
      case "trackRotationNeed":
        return `${trackName}'s rotation requirement`;
      case "raceTyreWear":
        return raceContext.raceTyreWear > 0
          ? `tyre wear over ${raceContext.wearProfile.laps} laps`
          : "short-run tyre preservation";
      case "raceSprint":
        return "short-run response priority";
      case "raceEndurance":
        return "long-stint consistency";
      case "tyreGrip":
        return `${raceContext.tyreCompound} compound grip`;
      default:
        return entry.signalKey;
    }
  });

  return `Weighted for ${descriptors.join(" and ")} under GT7 1.71 physics.`;
}

/**
 * @param {Record<string, string | number>} anchorValues
 * @param {{
 *   carProfile: ReturnType<import("./carDynamicsProfile.js").resolveCarDynamicsProfile>,
 *   trackProfile: ReturnType<import("./trackDynamicsProfile.js").resolveTrackDynamicsProfile>,
 *   tyreCompound?: string,
 *   lapCount?: number,
 *   tyreMultiplier?: number,
 *   fuelMultiplier?: number,
 *   anchorWeight?: number,
 *   wheelBaseId: string,
 * }} input
 */
export function calculateT598WheelSettings(anchorValues, input) {
  const raceContext = buildRaceContextSignals({
    carProfile: input.carProfile,
    trackProfile: input.trackProfile,
    tyreCompound: input.tyreCompound,
    lapCount: input.lapCount,
    tyreMultiplier: input.tyreMultiplier,
    fuelMultiplier: input.fuelMultiplier,
  });

  const { continuous, signals } = computeT598ContinuousTargets(anchorValues, {
    carProfile: input.carProfile,
    trackProfile: input.trackProfile,
    raceContext,
    anchorWeight: input.anchorWeight,
  });

  const values = sanitizeWheelValues(
    input.wheelBaseId,
    quantizeT598ContinuousTargets(continuous, anchorValues),
  );

  /** @type {Record<string, string>} */
  const fieldReasons = {};
  for (const fieldKey of Object.keys(T598_FIELD_WEIGHTS)) {
    fieldReasons[fieldKey] = buildCalculationReason(
      fieldKey,
      signals,
      raceContext,
      input.carProfile,
      input.trackProfile,
    );
  }

  return {
    values,
    continuous,
    signals,
    raceContext,
    fieldReasons,
  };
}
