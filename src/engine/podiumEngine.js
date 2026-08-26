import {
  getTemplateFamilyForWheelBase,
  getT598OptionsForField,
  getWheelBaseOption,
} from "../data/wheelBases.js";
import {
  getCompoundTyreModifier,
  getTyreCompoundDisplayLabel,
  normalizeTyreCompound,
} from "../data/tyreCompounds.js";
import { getCarsForGame, getTrackDisplayName, getTracksForGame } from "../utils/gameData.js";
import { resolveLapCount } from "../utils/raceDistance.js";
import {
  getConfirmedPodiumEvidence,
  getPodiumEvidenceCaveat,
  isPodiumTestingPending,
} from "../data/podiumEvidence.js";
import { ACTIVE_PHYSICS_GENERATION } from "../data/gt7PhysicsVersion.js";
import { calculateRaceWearProfile } from "./pitstopStrategyEngine.js";

/** @typedef {'maximumPace' | 'stability' | 'tyrePreservation' | 'fuelEfficiency' | 'consistency'} PodiumPriorityId */

/** @type {Record<PodiumPriorityId, string>} */
export const PODIUM_PRIORITY_LABELS = {
  maximumPace: "Maximum pace",
  stability: "Stability",
  tyrePreservation: "Tyre preservation",
  fuelEfficiency: "Fuel efficiency",
  consistency: "Consistency",
};

/**
 * @typedef {Object} PodiumEngineInput
 * @property {string} [gameVersion]
 * @property {string} [gameVersionPatch]
 * @property {string} [physicsGeneration]
 * @property {string} carId
 * @property {string} trackId
 * @property {string} tyreCompound
 * @property {boolean} bopOn
 * @property {string} wheelBase
 * @property {number} fuelMultiplier
 * @property {number} tyreMultiplier
 * @property {number} lapCount
 */

/**
 * @typedef {Object} PodiumPriority
 * @property {PodiumPriorityId} id
 * @property {string} label
 * @property {number} weight
 */

/**
 * @typedef {Object} PodiumFieldAdjustment
 * @property {string} field
 * @property {string} from
 * @property {string} to
 * @property {string} reason
 */

/**
 * @typedef {Object} PodiumRecommendation
 * @property {PodiumPriority[]} priorities
 * @property {PodiumPriorityId[]} dominantPriorityIds
 * @property {string} summary
 * @property {string[]} contextLines
 * @property {string} narrative
 * @property {Record<string, string>} fieldReasons
 * @property {Record<string, string | number>} adjustedValues
 * @property {PodiumFieldAdjustment[]} adjustments
 * @property {{ laps: number, tyreStress: number, fuelStress: number, combinedStress: number }} wearProfile
 * @property {string | null} [evidenceCaveat]
 * @property {string} [physicsGeneration]
 */

/**
 * @param {Partial<PodiumEngineInput>} input
 */
export function isPodiumInputComplete(input) {
  return Boolean(
    input?.carId &&
      input?.trackId &&
      input?.tyreCompound &&
      input?.wheelBase &&
      input?.bopOn !== undefined &&
      Number.isFinite(Number(input.fuelMultiplier)) &&
      Number.isFinite(Number(input.tyreMultiplier)) &&
      Number.isFinite(Number(input.lapCount)) &&
      Number(input.lapCount) >= 1,
  );
}

function normalizeMultiplier(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.min(10, Math.max(1, numeric));
}

/**
 * @param {Record<PodiumPriorityId, number>} raw
 * @returns {Record<PodiumPriorityId, number>}
 */
function normalizePriorityWeights(raw) {
  const total = Object.values(raw).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) {
    return {
      maximumPace: 0.2,
      stability: 0.2,
      tyrePreservation: 0.2,
      fuelEfficiency: 0.2,
      consistency: 0.2,
    };
  }

  /** @type {Record<PodiumPriorityId, number>} */
  const normalized = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[key] = Math.max(0, value) / total;
  }

  return normalized;
}

/**
 * @param {PodiumEngineInput} input
 * @param {import("../data/gt7/cars.js").CarRecord | null} car
 * @param {import("../data/gt7/tracks.js").TrackRecord | null} track
 * @param {ReturnType<typeof calculateRaceWearProfile>} wearProfile
 * @returns {Record<PodiumPriorityId, number>}
 */
function computeRawPriorities(input, car, track, wearProfile) {
  const laps = wearProfile.laps;
  const compound = normalizeTyreCompound(input.tyreCompound);
  const compoundWear = getCompoundTyreModifier(compound);
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);

  const trackStability = Number(track?.stability ?? 5) / 10;
  const trackTyres = Number(track?.tyres ?? 5) / 10;
  const trackFuel = Number(track?.fuel ?? 5) / 10;
  const trackTraction = Number(track?.traction ?? 5) / 10;
  const carTyres = Number(car?.tyres ?? 6);
  const confirmedEvidence = getConfirmedPodiumEvidence(input);

  /** @type {Record<PodiumPriorityId, number>} */
  const raw = {
    maximumPace: 0.1,
    stability: 0.1,
    tyrePreservation: 0.1,
    fuelEfficiency: 0.1,
    consistency: 0.1,
  };

  const isLowWearRace =
    laps <= 8 && tyreMultiplier <= 1.5 && fuelMultiplier <= 1.5;
  const isHighTyreWear = tyreMultiplier >= 4 || wearProfile.tyreStress >= 6;
  const isHighFuelWear = fuelMultiplier >= 4 || wearProfile.fuelStress >= 6;

  if (isLowWearRace) {
    raw.maximumPace += 0.42;
    raw.stability -= 0.04;
  } else if (laps <= 12) {
    raw.maximumPace += 0.18;
    raw.consistency += 0.08;
  } else if (laps <= 25) {
    raw.consistency += 0.16;
    raw.tyrePreservation += 0.1;
    raw.fuelEfficiency += 0.08;
    raw.maximumPace -= 0.04;
  } else {
    raw.consistency += 0.26;
    raw.tyrePreservation += 0.2;
    raw.fuelEfficiency += 0.16;
    raw.stability += 0.08;
    raw.maximumPace -= 0.08;
  }

  raw.tyrePreservation +=
    (tyreMultiplier / 10) * 0.38 +
    wearProfile.tyreStress * 0.05 +
    trackTyres * 0.2 +
    (compoundWear > 1 ? (compoundWear - 1) * 0.5 : 0);

  raw.fuelEfficiency +=
    (fuelMultiplier / 10) * 0.38 +
    wearProfile.fuelStress * 0.05 +
    trackFuel * 0.2;

  raw.stability +=
    trackStability * 0.24 +
    trackTraction * 0.08 +
    (compound === "W" || compound === "IM" ? 0.3 : 0);

  raw.consistency +=
    (laps >= 20 ? 0.12 : 0) +
    (isHighFuelWear ? 0.14 : 0) +
    (input.bopOn ? 0.1 : 0);

  if (isHighTyreWear) {
    raw.tyrePreservation += 0.18;
    raw.stability += 0.14;
    raw.consistency += 0.1;
    raw.maximumPace -= 0.1;
  }

  if (isHighFuelWear) {
    raw.fuelEfficiency += 0.18;
    raw.consistency += 0.14;
    raw.stability += 0.1;
    raw.maximumPace -= 0.08;
  }

  if (compound === "S") {
    raw.maximumPace += 0.12;
    raw.tyrePreservation += isHighTyreWear ? 0.16 : 0.08;
    raw.stability += isHighTyreWear ? 0.08 : 0.04;
  } else if (compound === "H") {
    raw.maximumPace += 0.06;
    raw.tyrePreservation -= 0.05;
  }

  if (carTyres <= 5 && trackTyres >= 0.65) {
    raw.tyrePreservation += 0.14;
    raw.consistency += 0.06;
  }

  if (wearProfile.combinedStress >= 7) {
    raw.consistency += 0.14;
    raw.stability += 0.1;
    raw.tyrePreservation += 0.08;
  }

  if (confirmedEvidence) {
    raw.tyrePreservation += 0.16;
    raw.stability += 0.12;
    raw.maximumPace -= 0.06;
  }

  return normalizePriorityWeights(raw);
}

/**
 * @param {Record<PodiumPriorityId, number>} weights
 * @returns {PodiumPriority[]}
 */
export function rankPodiumPriorities(weights) {
  return Object.entries(weights)
    .map(([id, weight]) => ({
      id: /** @type {PodiumPriorityId} */ (id),
      label: PODIUM_PRIORITY_LABELS[/** @type {PodiumPriorityId} */ (id)],
      weight: Number(weight.toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * @param {PodiumPriority[]} priorities
 * @param {{ laps: number, tyreMultiplier: number, fuelMultiplier: number }} context
 */
export function buildPodiumSummary(priorities, context) {
  const leaders = priorities
    .filter((entry) => entry.weight >= 0.16)
    .slice(0, 2)
    .map((entry) => entry.label);

  const focus =
    leaders.length > 0 ? leaders.join(" · ") : priorities[0]?.label ?? "Balanced";

  return `${focus} (${context.laps} laps · Tyre x${context.tyreMultiplier} · Fuel x${context.fuelMultiplier})`;
}

/**
 * @param {PodiumEngineInput} input
 * @param {import("../data/gt7/cars.js").CarRecord | null} car
 * @param {import("../data/gt7/tracks.js").TrackRecord | null} track
 */
export function buildPodiumContextLines(input, car, track) {
  const lapCount = resolveLapCount({ lapCount: input.lapCount });
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);
  const wheelLabel =
    getWheelBaseOption(input.wheelBase)?.label ?? input.wheelBase;

  return [
    `${lapCount} laps`,
    `Fuel x${fuelMultiplier}`,
    `Tyres x${tyreMultiplier}`,
    getTyreCompoundDisplayLabel(input.tyreCompound),
    car?.name ?? input.carId,
    track ? getTrackDisplayName(track) : input.trackId,
    `BOP ${input.bopOn ? "On" : "Off"}`,
    wheelLabel,
  ];
}

/**
 * @param {PodiumPriority[]} priorities
 * @param {ReturnType<typeof calculateRaceWearProfile>} wearProfile
 * @param {PodiumEngineInput} input
 */
export function buildPodiumNarrative(priorities, wearProfile, input) {
  const leaders = priorities.slice(0, 2).map((entry) => entry.label.toLowerCase());
  const laps = wearProfile.laps;
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);
  const compound = getTyreCompoundDisplayLabel(input.tyreCompound);
  const confirmedEvidence = getConfirmedPodiumEvidence(input);
  const testingPending = isPodiumTestingPending(input);

  if (confirmedEvidence) {
    const caveat = getPodiumEvidenceCaveat(input);
    const base = `${confirmedEvidence.summary} The Podium Engine biases ${leaders.join(" and ")} to protect the front-right tyre through the stint.`;
    return caveat ? `${base} ${caveat}` : base;
  }

  if (
    laps <= 8 &&
    tyreMultiplier <= 1 &&
    fuelMultiplier <= 1
  ) {
    return `With only ${laps} laps and low fuel and tyre wear, the Podium Engine favours sharper pace and responsive steering rather than stint conservation.`;
  }

  if (tyreMultiplier >= 4 || wearProfile.tyreStress >= 6) {
    return `Tyre wear multiplier x${tyreMultiplier} over ${laps} laps calls for smoother steering, stronger stability and less scrub. Settings lean toward ${leaders.join(" and ")} to protect ${compound.toLowerCase()} life.`;
  }

  if (fuelMultiplier >= 4 || wearProfile.fuelStress >= 6) {
    return `Fuel multiplier x${fuelMultiplier} increases stint demands, so the recommendation favours traction, consistency and smoother control across the run.`;
  }

  if (laps >= 20) {
    return `Across ${laps} laps the Podium Engine prioritises sustained race pace over one-lap aggression, with emphasis on ${leaders.join(" and ")}.`;
  }

  if (testingPending) {
    return `Track-specific tyre behaviour for this car is still being validated. Settings follow the tested base profile with Podium adjustments for your selected fuel, tyre wear and lap count only.`;
  }

  return `The Podium Engine balanced ${leaders.join(" and ")} for these race conditions using your selected car, track, compound, BOP, fuel multiplier, tyre wear and lap count.`;
}

/**
 * @param {string[]} options
 * @param {string} value
 * @param {number} delta
 */
function stepOption(options, value, delta) {
  if (!options?.length) {
    return value;
  }

  const currentIndex = options.findIndex(
    (option) => String(option).toLowerCase() === String(value).toLowerCase(),
  );
  const baseIndex = currentIndex >= 0 ? currentIndex : Math.floor(options.length / 2);
  const nextIndex = Math.max(0, Math.min(options.length - 1, baseIndex + Math.round(delta)));

  return options[nextIndex];
}

/**
 * @param {string} value
 * @param {Record<PodiumPriorityId, number>} weights
 */
function adjustBrakeBalance(value, weights) {
  const match = String(value).match(/(\d+)%\s*front\s*\/\s*(\d+)%\s*rear/i);
  if (!match) {
    return value;
  }

  let front = Number(match[1]);
  const shift = Math.round(
    weights.stability * 2.2 +
      weights.consistency * 0.8 +
      weights.fuelEfficiency * 0.5 -
      weights.tyrePreservation * 1.4 -
      weights.maximumPace * 1.2,
  );
  front = Math.max(48, Math.min(56, front + shift));
  const rear = 100 - front;
  return `${front}% front / ${rear}% rear`;
}

/**
 * @param {string} fieldKey
 * @param {string} baseValue
 * @param {Record<PodiumPriorityId, number>} weights
 */
function adjustT598Field(fieldKey, baseValue, weights) {
  const options = getT598OptionsForField(fieldKey);
  if (!options) {
    return { value: baseValue, changed: false, reason: "" };
  }

  let delta = 0;
  let reason = "";

  switch (fieldKey) {
    case "damper":
      delta =
        weights.stability * 2 +
        weights.tyrePreservation * 1.4 +
        weights.consistency * 0.8 +
        weights.fuelEfficiency * 0.5 -
        weights.maximumPace * 1.8;
      reason =
        delta > 0.35
          ? "Higher damper smooths steering and adds stability as tyre wear builds through the stint."
          : delta < -0.35
            ? "Lower damper frees rotation for maximum responsiveness in this short, low-wear race."
            : "";
      break;
    case "inertia":
      delta =
        weights.stability * 1.5 +
        weights.tyrePreservation * 0.9 +
        weights.fuelEfficiency * 0.8 +
        weights.consistency * 0.5 -
        weights.maximumPace * 1.2;
      reason =
        delta > 0.4
          ? "Added virtual mass keeps the car planted and easier to control over a long stint."
          : delta < -0.35
            ? "Lighter inertia sharpens turn-in for outright lap time."
            : "";
      break;
    case "friction":
      delta =
        weights.stability * 0.9 +
        weights.consistency * 0.8 +
        weights.fuelEfficiency * 0.4 -
        weights.maximumPace * 0.55;
      reason =
        delta > 0.25
          ? "More mechanical friction calms on-centre movement and reduces nervous corrections."
          : "";
      break;
    case "speed":
      delta = weights.maximumPace * 1.3 - weights.stability * 0.75 - weights.consistency * 0.35;
      reason =
        delta > 0.35
          ? "Higher wheel speed keeps up with fast corrections when attacking for lap time."
          : delta < -0.25
            ? "Reduced wheel speed softens high-load feedback for sustained race performance."
            : "";
      break;
    case "damperGain":
      delta =
        weights.stability * 0.9 +
        weights.consistency * 0.6 -
        weights.tyrePreservation * 0.95 -
        weights.maximumPace * 0.3;
      reason =
        delta < -0.25
          ? "Lower damper gain reduces tyre scrub feedback as rubber wears."
          : delta > 0.25
            ? "Higher damper gain improves weight-transfer readability under load."
            : "";
      break;
    case "endStop":
      delta = weights.stability * 1.15 - weights.maximumPace * 0.45;
      reason =
        delta > 0.3
          ? "Stronger end stops protect full-lock moments on this circuit."
          : "";
      break;
    case "gearJolt":
      delta =
        weights.consistency * 0.9 +
        weights.fuelEfficiency * 0.4 -
        weights.maximumPace * 0.55;
      reason =
        delta < -0.2
          ? "Reduced shift jolt keeps focus on traction and stint management."
          : "";
      break;
    default:
      return { value: baseValue, changed: false, reason: "" };
  }

  if (Math.abs(delta) < 0.2) {
    return { value: baseValue, changed: false, reason: "" };
  }

  const nextValue = stepOption(options, baseValue, delta);
  return {
    value: nextValue,
    changed: nextValue !== baseValue,
    reason,
  };
}

/**
 * @param {Record<string, string | number>} baseValues
 * @param {string} wheelBaseId
 * @param {Record<PodiumPriorityId, number>} weights
 */
function adjustWheelValues(baseValues, wheelBaseId, weights) {
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  const adjusted = { ...baseValues };
  /** @type {PodiumFieldAdjustment[]} */
  const adjustments = [];

  if (family === "t598") {
    for (const fieldKey of Object.keys(baseValues)) {
      if (fieldKey === "brakeBalance") {
        const from = String(baseValues[fieldKey] ?? "");
        const to = adjustBrakeBalance(from, weights);
        if (to !== from) {
          adjusted[fieldKey] = to;
          adjustments.push({
            field: fieldKey,
            from,
            to,
            reason:
              weights.stability >= weights.maximumPace
                ? "Slightly forward bias improves braking stability for these conditions."
                : "A touch more rear bias protects tyre life through traction zones.",
          });
        }
        continue;
      }

      const result = adjustT598Field(
        fieldKey,
        String(baseValues[fieldKey] ?? ""),
        weights,
      );

      if (result.changed) {
        adjusted[fieldKey] = result.value;
        adjustments.push({
          field: fieldKey,
          from: String(baseValues[fieldKey] ?? ""),
          to: result.value,
          reason: result.reason || "Adjusted for the detected race priorities.",
        });
      }
    }

    return { adjustedValues: adjusted, adjustments };
  }

  if (family === "logitech_g923" || family === "logitech_g_pro" || family === "logitech_rs50") {
    const torqueKey =
      family === "logitech_g923"
        ? "forceFeedbackMaxTorque"
        : "ffbStrength";
    const torque = Number(baseValues[torqueKey]);
    if (Number.isFinite(torque)) {
      const delta = Math.round(
        weights.maximumPace * 1.2 -
          weights.stability * 0.8 -
          weights.tyrePreservation * 0.5 -
          weights.fuelEfficiency * 0.4,
      );
      const next = Math.max(1, Math.min(10, torque + delta));
      if (next !== torque) {
        adjusted[torqueKey] = next;
        adjustments.push({
          field: torqueKey,
          from: String(torque),
          to: String(next),
          reason:
            next > torque
              ? "Slightly stronger FFB supports responsive inputs in a short race."
              : "Softer FFB reduces fatigue and supports traction over a full stint.",
        });
      }
    }
  }

  if (baseValues.brakeBalance) {
    const from = String(baseValues.brakeBalance);
    const to = adjustBrakeBalance(from, weights);
    if (to !== from) {
      adjusted.brakeBalance = to;
      adjustments.push({
        field: "brakeBalance",
        from,
        to,
        reason: "Brake bias tuned for the auto-detected race priorities.",
      });
    }
  }

  return { adjustedValues: adjusted, adjustments };
}

/**
 * @param {PodiumEngineInput & { baseValues?: Record<string, string | number>, carClass?: string }} input
 * @returns {PodiumRecommendation | null}
 */
export function buildPodiumRecommendation(input) {
  if (!isPodiumInputComplete(input) || !input.baseValues) {
    return null;
  }

  const gameVersion = input.gameVersion ?? "gt7";
  const car =
    getCarsForGame(gameVersion).find((entry) => entry.id === input.carId) ?? null;
  const track =
    getTracksForGame(gameVersion).find((entry) => entry.id === input.trackId) ?? null;

  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);
  const lapCount = resolveLapCount({ lapCount: input.lapCount });

  const wearProfile = calculateRaceWearProfile(car ?? {}, track ?? {}, {
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  });

  const weights = computeRawPriorities(input, car, track, wearProfile);
  const priorities = rankPodiumPriorities(weights);
  const dominantPriorityIds = priorities
    .filter((entry, index) => index < 2 && entry.weight >= 0.16)
    .map((entry) => entry.id);

  const { adjustedValues, adjustments } = adjustWheelValues(
    input.baseValues,
    input.wheelBase,
    weights,
  );

  const adjustmentReasons = Object.fromEntries(
    adjustments.map((entry) => [entry.field, entry.reason]),
  );

  const contextLines = buildPodiumContextLines(input, car, track);
  const narrative = buildPodiumNarrative(priorities, wearProfile, input);
  const evidenceCaveat = getPodiumEvidenceCaveat(input);
  const physicsGeneration =
    input.physicsGeneration ?? ACTIVE_PHYSICS_GENERATION;

  return {
    priorities,
    dominantPriorityIds,
    summary: buildPodiumSummary(priorities, {
      laps: lapCount,
      tyreMultiplier,
      fuelMultiplier,
    }),
    contextLines,
    narrative,
    fieldReasons: adjustmentReasons,
    adjustedValues,
    adjustments,
    wearProfile: {
      laps: wearProfile.laps,
      tyreStress: wearProfile.tyreStress,
      fuelStress: wearProfile.fuelStress,
      combinedStress: wearProfile.combinedStress,
    },
    evidenceCaveat,
    physicsGeneration,
  };
}
