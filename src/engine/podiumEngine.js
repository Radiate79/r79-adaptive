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
import { sanitizeWheelValues } from "./wheelSchemaValidation.js";
import {
  buildInteractionFieldReason,
  computeCarTrackInteraction,
  inferRaceObjective,
} from "./carTrackInteraction.js";

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
 * @property {'qualifying' | 'sprint' | 'race' | 'endurance'} [raceObjective]
 * @property {string[]} [interactionFactors]
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

  return Math.min(10, Math.max(0, numeric));
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
 * @param {ReturnType<typeof computeCarTrackInteraction>} [interaction]
 * @returns {Record<PodiumPriorityId, number>}
 */
function computeRawPriorities(input, car, track, wearProfile, interaction) {
  const laps = wearProfile.laps;
  const compound = normalizeTyreCompound(input.tyreCompound);
  const compoundWear = getCompoundTyreModifier(compound);
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);

  const trackStability = Number(track?.stability ?? 5) / 10;
  const trackTyres = Number(track?.tyres ?? 5) / 10;
  const trackFuel = Number(track?.fuel ?? 5) / 10;
  const trackTraction = Number(track?.traction ?? 5) / 10;
  const trackKerbs = Number(track?.kerbs ?? 5) / 10;
  const trackTopSpeed = Number(track?.topSpeed ?? 5) / 10;
  const carTyres = Number(car?.tyres ?? 6);
  const carRotation = Number(car?.rotation ?? 5) / 10;
  const carStability = Number(car?.stability ?? 5) / 10;
  const confirmedEvidence = getConfirmedPodiumEvidence(input);
  const objective = inferRaceObjective(laps, tyreMultiplier, fuelMultiplier);

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

  if (objective === "qualifying" || isLowWearRace) {
    raw.maximumPace += 0.42;
    raw.stability -= 0.04;
  } else if (objective === "sprint" || laps <= 12) {
    raw.maximumPace += 0.18;
    raw.consistency += 0.08;
  } else if (objective === "race" || laps <= 25) {
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
    carStability * 0.08 +
    trackKerbs * 0.12 +
    (compound === "W" || compound === "IM" ? 0.3 : 0);

  raw.maximumPace += carRotation * 0.06;

  if (carRotation >= 0.8 && trackTopSpeed >= 0.8) {
    raw.stability += 0.08;
    raw.consistency += 0.04;
  }

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

  // Bounded car × track interaction (never overwrites validated base lookup).
  if (interaction?.priorityDeltas) {
    for (const [key, delta] of Object.entries(interaction.priorityDeltas)) {
      if (key in raw && Number.isFinite(delta)) {
        raw[/** @type {PodiumPriorityId} */ (key)] += /** @type {number} */ (delta);
      }
    }
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
    `${lapCount === 1 ? "1 lap" : `${lapCount} laps`}`,
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
 * @param {ReturnType<typeof computeCarTrackInteraction>} [interaction]
 * @param {import("../data/gt7/cars.js").CarRecord | null} [car]
 * @param {import("../data/gt7/tracks.js").TrackRecord | null} [track]
 */
export function buildPodiumNarrative(
  priorities,
  wearProfile,
  input,
  interaction,
  car,
  track,
) {
  const leaders = priorities.slice(0, 2).map((entry) => entry.label.toLowerCase());
  const laps = wearProfile.laps;
  const tyreMultiplier = normalizeMultiplier(input.tyreMultiplier);
  const fuelMultiplier = normalizeMultiplier(input.fuelMultiplier);
  const compound = getTyreCompoundDisplayLabel(input.tyreCompound);
  const confirmedEvidence = getConfirmedPodiumEvidence(input);
  const testingPending = isPodiumTestingPending(input);
  const objective = inferRaceObjective(laps, tyreMultiplier, fuelMultiplier);
  const carName = car?.name ?? "this car";
  const trackName = track ? getTrackDisplayName(track) : "this circuit";
  const interactionFactor = interaction?.factors?.[0];

  if (confirmedEvidence) {
    const caveat = getPodiumEvidenceCaveat(input);
    const base = `${confirmedEvidence.summary} The Podium Engine biases ${leaders.join(" and ")} to protect the front-right tyre through the stint.`;
    return caveat ? `${base} ${caveat}` : base;
  }

  if (objective === "qualifying") {
    return `Short-run emphasis for ${carName} at ${trackName}${interactionFactor ? ` — ${interactionFactor}` : ""}. Settings favour sharper usable detail on ${compound.toLowerCase()} rather than stint conservation.`;
  }

  if (tyreMultiplier >= 4 || wearProfile.tyreStress >= 6) {
    return `Tyre wear multiplier x${tyreMultiplier} over ${laps} laps with ${carName} at ${trackName} calls for smoother steering and progressive load. Settings lean toward ${leaders.join(" and ")} to help the driver manage ${compound.toLowerCase()} life — not to change GT7 wear maths.`;
  }

  if (fuelMultiplier >= 4 || wearProfile.fuelStress >= 6) {
    return `Fuel multiplier x${fuelMultiplier} increases stint demands for ${carName}, so the recommendation favours traction, consistency and smoother control across the run at ${trackName}.`;
  }

  if (objective === "endurance" || laps >= 20) {
    return `Across ${laps} laps the Podium Engine prioritises sustained race pace for ${carName} at ${trackName}${interactionFactor ? ` (${interactionFactor})` : ""}, with emphasis on ${leaders.join(" and ")}.`;
  }

  if (testingPending) {
    return `Track-specific tyre behaviour for ${carName} is still being validated. Settings follow the tested base profile with Podium adjustments for your selected fuel, tyre wear and lap count only.`;
  }

  if (interactionFactor) {
    return `The Podium Engine balanced ${leaders.join(" and ")} for ${carName} at ${trackName}: ${interactionFactor}.`;
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
 * @param {{
 *   interaction: ReturnType<typeof computeCarTrackInteraction>,
 *   objective: ReturnType<typeof inferRaceObjective>,
 *   carName?: string,
 *   trackName?: string,
 *   compoundLabel?: string,
 * }} [context]
 */
function adjustT598Field(fieldKey, baseValue, weights, context) {
  const options = getT598OptionsForField(fieldKey);
  if (!options) {
    return { value: baseValue, changed: false, reason: "" };
  }

  let delta = 0;
  let reason = "";
  const interaction = context?.interaction;
  const objective = context?.objective ?? "race";

  // Bounded car×track nudges on top of race-priority deltas.
  if (interaction) {
    if (fieldKey === "damper" || fieldKey === "inertia" || fieldKey === "friction") {
      delta += interaction.catchabilityNeed * 0.45 + interaction.kerbLoad * 0.25;
      delta -= interaction.rotationNeed * 0.2;
    }
    if (fieldKey === "speed" || fieldKey === "damperGain") {
      delta += interaction.detailNeed * 0.25 - interaction.fatigueRisk * 0.3;
    }
    if (fieldKey === "endStop") {
      delta += interaction.highSpeedNeed * 0.2 + interaction.kerbLoad * 0.15;
    }
  }

  switch (fieldKey) {
    case "damper":
      delta +=
        weights.stability * 2 +
        weights.tyrePreservation * 1.4 +
        weights.consistency * 0.8 +
        weights.fuelEfficiency * 0.5 -
        weights.maximumPace * 1.8;
      break;
    case "inertia":
      delta +=
        weights.stability * 1.5 +
        weights.tyrePreservation * 0.9 +
        weights.fuelEfficiency * 0.8 +
        weights.consistency * 0.5 -
        weights.maximumPace * 1.2;
      break;
    case "friction":
      delta +=
        weights.stability * 0.9 +
        weights.consistency * 0.8 +
        weights.fuelEfficiency * 0.4 -
        weights.maximumPace * 0.55;
      break;
    case "speed":
      delta += weights.maximumPace * 1.3 - weights.stability * 0.75 - weights.consistency * 0.35;
      break;
    case "damperGain":
      delta +=
        weights.stability * 0.9 +
        weights.consistency * 0.6 -
        weights.tyrePreservation * 0.95 -
        weights.maximumPace * 0.3;
      break;
    case "endStop":
      delta += weights.stability * 1.15 - weights.maximumPace * 0.45;
      break;
    case "gearJolt":
      delta +=
        weights.consistency * 0.9 +
        weights.fuelEfficiency * 0.4 -
        weights.maximumPace * 0.55;
      break;
    default:
      return { value: baseValue, changed: false, reason: "" };
  }

  if (Math.abs(delta) < 0.2) {
    return { value: baseValue, changed: false, reason: "" };
  }

  const nextValue = stepOption(options, baseValue, delta);
  if (nextValue === baseValue) {
    return { value: baseValue, changed: false, reason: "" };
  }

  const direction = delta > 0 ? "up" : "down";
  const fieldLabels = {
    damper: "Wheel Damper",
    inertia: "Inertia",
    friction: "Friction",
    speed: "Speed",
    damperGain: "Damper Gain",
    endStop: "End Stop",
    gearJolt: "Gear Jolt",
  };
  if (interaction && context) {
    reason = buildInteractionFieldReason({
      fieldLabel: fieldLabels[fieldKey] ?? fieldKey,
      direction,
      carName: context.carName,
      trackName: context.trackName,
      interaction,
      objective,
      compoundLabel: context.compoundLabel,
    });
  }

  if (!reason) {
    if (fieldKey === "damper") {
      reason =
        direction === "up"
          ? "Higher damper smooths steering and adds stability as tyre wear builds through the stint."
          : "Lower damper frees rotation for maximum responsiveness in this short, low-wear race.";
    } else if (fieldKey === "inertia") {
      reason =
        direction === "up"
          ? "Added virtual mass keeps the car planted and easier to control over a long stint."
          : "Lighter inertia sharpens turn-in for outright lap time.";
    } else if (fieldKey === "friction") {
      reason =
        direction === "up"
          ? "More mechanical friction calms on-centre movement and reduces nervous corrections."
          : "";
    } else if (fieldKey === "speed") {
      reason =
        direction === "up"
          ? "Higher wheel speed keeps up with fast corrections when attacking for lap time."
          : "Reduced wheel speed softens high-load feedback for sustained race performance.";
    } else if (fieldKey === "damperGain") {
      reason =
        direction === "down"
          ? "Lower damper gain reduces tyre scrub feedback as rubber wears."
          : "Higher damper gain improves weight-transfer readability under load.";
    } else if (fieldKey === "endStop") {
      reason =
        direction === "up" ? "Stronger end stops protect full-lock moments on this circuit." : "";
    } else if (fieldKey === "gearJolt") {
      reason =
        direction === "down"
          ? "Reduced shift jolt keeps focus on traction and stint management."
          : "";
    }
  }

  return {
    value: nextValue,
    changed: true,
    reason,
  };
}

/**
 * @param {Record<string, string | number>} baseValues
 * @param {string} wheelBaseId
 * @param {Record<PodiumPriorityId, number>} weights
 * @param {{
 *   interaction: ReturnType<typeof computeCarTrackInteraction>,
 *   objective: ReturnType<typeof inferRaceObjective>,
 *   carName?: string,
 *   trackName?: string,
 *   compoundLabel?: string,
 * }} [context]
 */
function adjustWheelValues(baseValues, wheelBaseId, weights, context) {
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  const adjusted = { ...baseValues };
  /** @type {PodiumFieldAdjustment[]} */
  const adjustments = [];
  const interaction = context?.interaction;
  const objective = context?.objective ?? "race";
  const carName = context?.carName;
  const trackName = context?.trackName;
  const compoundLabel = context?.compoundLabel;

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
                ? `Slightly forward bias improves braking stability for ${carName ?? "this car"} at ${trackName ?? "this circuit"}.`
                : `A touch more rear bias protects tyre life through traction zones at ${trackName ?? "this circuit"}.`,
          });
        }
        continue;
      }

      const result = adjustT598Field(
        fieldKey,
        String(baseValues[fieldKey] ?? ""),
        weights,
        context,
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

    return {
      adjustedValues: sanitizeWheelValues(wheelBaseId, adjusted),
      adjustments,
    };
  }

  if (family === "logitech_g923" || family === "logitech_g_pro" || family === "logitech_rs50") {
    const torqueKey =
      family === "logitech_g923"
        ? "forceFeedbackMaxTorque"
        : "ffbStrength";
    const torque = Number(baseValues[torqueKey]);
    if (Number.isFinite(torque)) {
      let delta = Math.round(
        weights.maximumPace * 1.2 -
          weights.stability * 0.8 -
          weights.tyrePreservation * 0.5 -
          weights.fuelEfficiency * 0.4,
      );
      if (interaction) {
        delta += Math.round(interaction.detailNeed * 0.6 - interaction.fatigueRisk * 0.8);
      }
      const next = Math.max(1, Math.min(10, torque + delta));
      if (next !== torque) {
        adjusted[torqueKey] = next;
        adjustments.push({
          field: torqueKey,
          from: String(torque),
          to: String(next),
          reason:
            buildInteractionFieldReason({
              fieldLabel: "FFB strength",
              direction: next > torque ? "up" : "down",
              carName,
              trackName,
              interaction: interaction ?? computeCarTrackInteraction(null, null),
              objective,
              compoundLabel,
            }) ||
            (next > torque
              ? "Slightly stronger FFB supports responsive inputs in a short race."
              : "Softer FFB reduces fatigue and supports traction over a full stint."),
        });
      }
    }

    const dampenerKey =
      family === "logitech_g923" ? null : "dampener";
    if (dampenerKey && Number.isFinite(Number(baseValues[dampenerKey]))) {
      const dampener = Number(baseValues[dampenerKey]);
      let delta = Math.round(
        weights.stability * 1.2 +
          weights.consistency * 0.6 -
          weights.maximumPace * 0.9,
      );
      if (interaction) {
        delta += Math.round(interaction.catchabilityNeed * 0.8 + interaction.kerbLoad * 0.5);
      }
      const next = Math.max(0, Math.min(10, dampener + delta));
      if (next !== dampener) {
        adjusted[dampenerKey] = next;
        adjustments.push({
          field: dampenerKey,
          from: String(dampener),
          to: String(next),
          reason:
            buildInteractionFieldReason({
              fieldLabel: "Dampener",
              direction: next > dampener ? "up" : "down",
              carName,
              trackName,
              interaction: interaction ?? computeCarTrackInteraction(null, null),
              objective,
              compoundLabel,
            }) ||
            (next > dampener
              ? "Extra dampener calms kerb and mid-corner oscillation."
              : "Lower dampener keeps the rim livelier for short-run precision."),
        });
      }
    }
  }

  if (family === "fanatec") {
    const ff = Number(baseValues.ff);
    if (Number.isFinite(ff)) {
      let delta = Math.round(
        weights.maximumPace * 8 -
          weights.stability * 6 -
          weights.tyrePreservation * 4,
      );
      if (interaction) {
        delta += Math.round(interaction.detailNeed * 4 - interaction.fatigueRisk * 5);
      }
      const next = Math.max(0, Math.min(100, ff + delta));
      if (next !== ff) {
        adjusted.ff = next;
        adjustments.push({
          field: "ff",
          from: String(ff),
          to: String(next),
          reason:
            buildInteractionFieldReason({
              fieldLabel: "FF",
              direction: next > ff ? "up" : "down",
              carName,
              trackName,
              interaction: interaction ?? computeCarTrackInteraction(null, null),
              objective,
              compoundLabel,
            }) ||
            (next > ff
              ? "Higher FF keeps front-end detail available for a short, low-wear run."
              : "Lower FF reduces steering load so inputs stay consistent as the stint develops."),
        });
      }
    }

    const ndp = Number(baseValues.ndp);
    if (Number.isFinite(ndp)) {
      let delta = Math.round(
        weights.stability * 6 +
          weights.consistency * 3 -
          weights.maximumPace * 5,
      );
      if (interaction) {
        delta += Math.round(interaction.catchabilityNeed * 5 + interaction.kerbLoad * 4);
      }
      const next = Math.max(0, Math.min(100, ndp + delta));
      if (next !== ndp) {
        adjusted.ndp = next;
        adjustments.push({
          field: "ndp",
          from: String(ndp),
          to: String(next),
          reason:
            buildInteractionFieldReason({
              fieldLabel: "NDP",
              direction: next > ndp ? "up" : "down",
              carName,
              trackName,
              interaction: interaction ?? computeCarTrackInteraction(null, null),
              objective,
              compoundLabel,
            }) ||
            (next > ndp
              ? "Added natural damper calms on-centre movement for longer or kerb-heavy stints."
              : "Reduced natural damper frees rotation for qualifying-style short runs."),
        });
      }
    }
  }

  if (family === "moza") {
    const intensity = Number(baseValues.gameFfbIntensity);
    if (Number.isFinite(intensity)) {
      let delta = Math.round(
        weights.maximumPace * 8 -
          weights.stability * 6 -
          weights.tyrePreservation * 4,
      );
      if (interaction) {
        delta += Math.round(interaction.detailNeed * 4 - interaction.fatigueRisk * 5);
      }
      const next = Math.max(0, Math.min(100, intensity + delta));
      if (next !== intensity) {
        adjusted.gameFfbIntensity = next;
        adjustments.push({
          field: "gameFfbIntensity",
          from: String(intensity),
          to: String(next),
          reason:
            next > intensity
              ? `Higher game FFB intensity preserves detail for ${carName ?? "this car"} on a short, precise run.`
              : `Softer game FFB intensity supports smoother steering as tyres and driver load build at ${trackName ?? "this circuit"}.`,
        });
      }
    }

    const damper = Number(baseValues.wheelDamper);
    if (Number.isFinite(damper)) {
      let delta = Math.round(
        weights.stability * 6 +
          weights.consistency * 3 -
          weights.maximumPace * 5,
      );
      if (interaction) {
        delta += Math.round(interaction.catchabilityNeed * 5 + interaction.kerbLoad * 4);
      }
      const next = Math.max(0, Math.min(100, damper + delta));
      if (next !== damper) {
        adjusted.wheelDamper = next;
        adjustments.push({
          field: "wheelDamper",
          from: String(damper),
          to: String(next),
          reason:
            next > damper
              ? `Extra wheel damper steadies corrections through high-load and kerb sections at ${trackName ?? "this circuit"}.`
              : `Lower wheel damper keeps the rim livelier for short-run rotation confidence with ${carName ?? "this car"}.`,
        });
      }
    }
  }

  if (baseValues.brakeBalance && family !== "t598") {
    const from = String(baseValues.brakeBalance);
    const to = adjustBrakeBalance(from, weights);
    if (to !== from) {
      adjusted.brakeBalance = to;
      adjustments.push({
        field: "brakeBalance",
        from,
        to,
        reason: `Brake bias tuned for ${carName ?? "this car"} at ${trackName ?? "this circuit"} under the detected race objective.`,
      });
    }
  }

  return {
    adjustedValues: sanitizeWheelValues(wheelBaseId, adjusted),
    adjustments,
  };
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
  const objective = inferRaceObjective(lapCount, tyreMultiplier, fuelMultiplier);
  const interaction = computeCarTrackInteraction(car, track);
  const compoundLabel = getTyreCompoundDisplayLabel(input.tyreCompound);
  const carName = car?.name;
  const trackName = track ? getTrackDisplayName(track) : undefined;

  const wearProfile = calculateRaceWearProfile(car ?? {}, track ?? {}, {
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
  });

  const weights = computeRawPriorities(
    input,
    car,
    track,
    wearProfile,
    interaction,
  );
  const priorities = rankPodiumPriorities(weights);
  const dominantPriorityIds = priorities
    .filter((entry, index) => index < 2 && entry.weight >= 0.16)
    .map((entry) => entry.id);

  const { adjustedValues, adjustments } = adjustWheelValues(
    input.baseValues,
    input.wheelBase,
    weights,
    {
      interaction,
      objective,
      carName,
      trackName,
      compoundLabel,
    },
  );

  const adjustmentReasons = Object.fromEntries(
    adjustments.map((entry) => [entry.field, entry.reason]),
  );

  const contextLines = buildPodiumContextLines(input, car, track);
  const narrative = buildPodiumNarrative(
    priorities,
    wearProfile,
    input,
    interaction,
    car,
    track,
  );
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
    raceObjective: objective,
    interactionFactors: interaction.factors,
  };
}
