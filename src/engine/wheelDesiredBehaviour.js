/**
 * Stage A — Hardware-neutral desired steering behaviour.
 * Computes continuous targets (0–1) from car × track × tyre × race × GT7 1.71 physics.
 * Device translation happens separately in wheelDeviceTranslation.js.
 */

import {
  GT7_171_PHYSICS_EMPHASIS,
  TYRE_COMPOUND_GRIP_INDEX,
  WHEEL_SETTINGS_PLATFORM_BASELINE,
} from "../data/wheelSettingsConfig.js";
import {
  getCompoundTyreModifier,
  normalizeTyreCompound,
} from "../data/tyreCompounds.js";
import { calculateRaceWearProfile } from "./pitstopStrategyEngine.js";
import { inferRaceObjective } from "./carTrackInteraction.js";
import { buildCarDynamicsSignals } from "./carDynamicsProfile.js";
import { buildTrackDynamicsSignals } from "./trackDynamicsProfile.js";

/** @typedef {ReturnType<import("./carDynamicsProfile.js").resolveCarDynamicsProfile>} CarDynamicsProfile */
/** @typedef {ReturnType<import("./trackDynamicsProfile.js").resolveTrackDynamicsProfile>} TrackDynamicsProfile */

/**
 * @typedef {Object} DesiredSteeringBehaviour
 * @property {number} steeringForceTarget
 * @property {number} responseTarget
 * @property {number} rotationSpeedTarget
 * @property {number} stabilityTarget
 * @property {number} dampingTarget
 * @property {number} frictionTarget
 * @property {number} inertiaTarget
 * @property {number} lowForceDetailTarget
 * @property {number} highForceControlTarget
 * @property {number} oscillationControlTarget
 * @property {number} returnToCentreTarget
 * @property {number} resistanceBudget
 * @property {number} entryConfidence
 * @property {number} midCornerReadability
 * @property {number} exitControl
 * @property {number} directionChangeSpeed
 */

/**
 * @param {number | null | undefined} value
 * @param {number} [fallback]
 */
function n(value, fallback = 0.5) {
  if (value == null || !Number.isFinite(Number(value))) {
    return fallback;
  }
  return Math.min(1, Math.max(0, Number(value)));
}

/**
 * @param {...number} parts
 */
function mix(...parts) {
  const values = parts.filter((v) => Number.isFinite(v));
  if (!values.length) return 0.5;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Race-context modifiers — refine baseline, never replace it.
 * Tyres x0 / Fuel x0 → zero endurance contribution.
 *
 * @param {{
 *   carProfile: CarDynamicsProfile,
 *   trackProfile: TrackDynamicsProfile,
 *   tyreCompound?: string,
 *   lapCount?: number,
 *   tyreMultiplier?: number,
 *   fuelMultiplier?: number,
 * }} context
 */
export function buildRaceBehaviourModifiers(context) {
  const tyreCompound = normalizeTyreCompound(context.tyreCompound);
  const tyreMultiplier = Number(context.tyreMultiplier ?? 0);
  const fuelMultiplier = Number(context.fuelMultiplier ?? 0);
  const lapCount = Number(context.lapCount ?? 0);
  const wearProfile = calculateRaceWearProfile(
    context.carProfile.car ?? {},
    context.trackProfile.track ?? {},
    { lapCount, tyreMultiplier, fuelMultiplier },
  );
  const objective = inferRaceObjective(lapCount, tyreMultiplier, fuelMultiplier);
  const gripIndex = TYRE_COMPOUND_GRIP_INDEX[tyreCompound] ?? 0.88;

  const tyreWearActive = tyreMultiplier > 0;
  const raceTyreWear = tyreWearActive
    ? Math.min(1, wearProfile.tyreStress / 10 + tyreMultiplier / 12)
    : 0;
  const longRace = lapCount >= 20;
  const shortRace = lapCount > 0 && lapCount <= 8;
  const raceEndurance = objective === "endurance" || longRace ? 1 : 0;
  const raceSprint =
    objective === "qualifying" || shortRace ? 1 : 0;

  // Fuel must NOT invent FFB physics from multiplier alone.
  // Only a tiny long-run workload cue when fuel×≥2 AND laps≥15.
  const fuelLongRun =
    fuelMultiplier >= 2 && lapCount >= 15
      ? Math.min(0.25, fuelMultiplier / 20)
      : 0;

  return {
    tyreCompound,
    gripIndex,
    compoundWear: getCompoundTyreModifier(tyreCompound),
    raceTyreWear,
    raceEndurance,
    raceSprint,
    raceConsistency: Math.min(1, raceTyreWear * 0.55 + raceEndurance * 0.25),
    raceFatigue: Math.min(1, raceTyreWear * 0.35 + raceEndurance * 0.2 + fuelLongRun),
    fuelLongRun,
    objective,
    wearProfile,
    tyreWearActive,
    physics: WHEEL_SETTINGS_PLATFORM_BASELINE,
  };
}

/**
 * Stage A: calculate desired vehicle / steering behaviour (0–1 continuous).
 * Performance baseline first; race modifiers applied conservatively afterward.
 *
 * @param {{
 *   carProfile: CarDynamicsProfile,
 *   trackProfile: TrackDynamicsProfile,
 *   tyreCompound?: string,
 *   lapCount?: number,
 *   tyreMultiplier?: number,
 *   fuelMultiplier?: number,
 * }} input
 * @returns {{
 *   desired: DesiredSteeringBehaviour,
 *   race: ReturnType<typeof buildRaceBehaviourModifiers>,
 *   signals: Record<string, number>,
 *   contributors: Record<string, string[]>,
 * }}
 */
export function calculateDesiredSteeringBehaviour(input) {
  const car = buildCarDynamicsSignals(input.carProfile);
  const track = buildTrackDynamicsSignals(input.trackProfile);
  const race = buildRaceBehaviourModifiers(input);
  const phys = GT7_171_PHYSICS_EMPHASIS;

  const rotation = n(car.carRotation);
  const stability = n(car.carStability);
  const traction = n(car.carTraction);
  const topSpeed = n(car.carTopSpeed);
  const detail = n(car.carDetail);
  const rearBias = n(car.carRearBias, 0.25);

  const trackLoad = n(track.trackLoad);
  const trackRotation = n(track.trackRotationNeed);
  const trackHighSpeed = n(track.trackHighSpeed);
  const trackKerb = n(track.trackKerb);
  const trackTechnical = n(track.trackTechnical);
  const trackDetail = n(track.trackDetail);

  // ── PERFORMANCE BASELINE (always computed) ──────────────────────────────
  // Anchor around 0.5 so car/track deltas remain visible after quantisation.
  const responseTarget = n(
    0.48 +
      (rotation - 0.5) * 0.28 +
      (trackRotation - 0.5) * 0.22 +
      (trackTechnical - 0.5) * 0.14 +
      (detail - 0.5) * 0.08 +
      race.raceSprint * 0.06 -
      race.raceFatigue * 0.05,
  );

  const rotationSpeedTarget = n(
    0.5 +
      (rotation - 0.5) * 0.35 +
      (trackRotation - 0.5) * 0.28 +
      (trackTechnical - 0.5) * 0.16 -
      (stability - 0.5) * 0.18 +
      race.raceSprint * 0.05 -
      race.raceConsistency * 0.05,
  );

  const stabilityTarget = n(
    0.48 +
      (stability - 0.5) * 0.32 +
      (trackHighSpeed - 0.5) * 0.28 +
      (trackLoad - 0.5) * 0.16 +
      (topSpeed - 0.5) * 0.1 +
      race.raceConsistency * 0.06 -
      (rotation - 0.5) * 0.1,
  );

  // Resistance channels are SEPARATED — not all driven by the same stability signal.
  // Inertia: high-speed / mass feel
  const inertiaTarget = n(
    0.38 +
      (trackHighSpeed - 0.5) * 0.36 +
      (stability - 0.5) * 0.2 +
      (topSpeed - 0.5) * 0.16 +
      race.raceConsistency * 0.04 -
      (rotation - 0.5) * 0.22 -
      (trackTechnical - 0.5) * 0.12,
  );

  // Friction: micro-resistance — bias toward Low, not Mid/High
  const frictionTarget = n(
    0.28 +
      (stability - 0.5) * 0.18 +
      (trackKerb - 0.5) * 0.14 +
      race.raceConsistency * 0.08 -
      (rotation - 0.5) * 0.2 -
      (trackTechnical - 0.5) * 0.1,
  );

  // Damping: primary oscillation / kerb channel
  const dampingTarget = n(
    (0.36 +
      (stability - 0.5) * 0.2 +
      (trackKerb - 0.5) * 0.28 * phys.kerbLoad +
      (trackLoad - 0.5) * 0.14 +
      race.raceTyreWear * 0.08 -
      (rotation - 0.5) * 0.16) *
      phys.suspensionDamping,
  );

  const lowForceDetailTarget = n(
    (0.5 +
      (trackDetail - 0.5) * 0.3 +
      (trackKerb - 0.5) * 0.22 +
      (detail - 0.5) * 0.16 +
      (1 - race.gripIndex) * 0.08 -
      race.raceFatigue * 0.05) *
      phys.tyreSlipDetail,
  );

  const highForceControlTarget = n(
    0.5 +
      (trackLoad - 0.5) * 0.28 +
      (topSpeed - 0.5) * 0.2 +
      (race.gripIndex - 0.5) * 0.16 -
      (rotation - 0.5) * 0.08,
  );

  const oscillationControlTarget = n(
    0.45 +
      (stability - 0.5) * 0.28 +
      (trackHighSpeed - 0.5) * 0.22 +
      (trackKerb - 0.5) * 0.14 +
      race.raceConsistency * 0.05 -
      (rotation - 0.5) * 0.12,
  );

  const returnToCentreTarget = n(
    0.12 + (stability - 0.5) * 0.1 + (trackHighSpeed - 0.5) * 0.08,
  );

  const steeringForceTarget = n(
    0.55 +
      (race.gripIndex - 0.5) * 0.22 +
      (trackLoad - 0.5) * 0.2 +
      (detail - 0.5) * 0.12 +
      (rotation - 0.5) * 0.08 -
      race.raceFatigue * 0.06,
  );

  // Phase objectives
  const entryConfidence = n(
    mix(traction * 0.3, stability * 0.25, responseTarget * 0.25, trackLoad * 0.2),
  );
  const midCornerReadability = n(
    mix(lowForceDetailTarget * 0.4, stability * 0.3, dampingTarget * 0.15) -
      frictionTarget * 0.1,
  );
  const exitControl = n(
    mix(traction * 0.35, rotationSpeedTarget * 0.25, responseTarget * 0.2) -
      dampingTarget * 0.08 -
      inertiaTarget * 0.08,
  );
  const directionChangeSpeed = n(
    mix(rotationSpeedTarget * 0.5, trackTechnical * 0.3, responseTarget * 0.2) -
      inertiaTarget * 0.15,
  );

  // Combined resistance budget — sum of overlapping resistance channels
  const resistanceBudget = n(
    inertiaTarget * 0.35 + frictionTarget * 0.3 + dampingTarget * 0.35,
  );

  /** @type {DesiredSteeringBehaviour} */
  const desired = {
    steeringForceTarget,
    responseTarget,
    rotationSpeedTarget,
    stabilityTarget,
    dampingTarget,
    frictionTarget,
    inertiaTarget,
    lowForceDetailTarget,
    highForceControlTarget,
    oscillationControlTarget,
    returnToCentreTarget,
    resistanceBudget,
    entryConfidence,
    midCornerReadability,
    exitControl,
    directionChangeSpeed,
  };

  const signals = {
    carRotation: rotation,
    carStability: stability,
    carTraction: traction,
    carTopSpeed: topSpeed,
    carDetail: detail,
    carRearBias: rearBias,
    trackLoad,
    trackRotationNeed: trackRotation,
    trackHighSpeed,
    trackKerb,
    trackTechnical,
    trackDetail,
    tyreGrip: race.gripIndex,
    raceTyreWear: race.raceTyreWear,
    raceSprint: race.raceSprint,
    raceEndurance: race.raceEndurance,
    raceConsistency: race.raceConsistency,
    raceFatigue: race.raceFatigue,
  };

  const contributors = {
    response: pickContributors(signals, ["carRotation", "trackRotationNeed", "trackTechnical", "raceSprint"]),
    rotation: pickContributors(signals, ["carRotation", "trackRotationNeed", "carStability"]),
    stability: pickContributors(signals, ["carStability", "trackHighSpeed", "trackLoad"]),
    inertia: pickContributors(signals, ["trackHighSpeed", "carStability", "carRotation"]),
    friction: pickContributors(signals, ["carStability", "trackKerb", "raceConsistency"]),
    damping: pickContributors(signals, ["trackKerb", "carStability", "trackLoad", "raceTyreWear"]),
    detail: pickContributors(signals, ["trackDetail", "trackKerb", "tyreGrip"]),
  };

  return { desired, race, signals, contributors };
}

/**
 * @param {Record<string, number>} signals
 * @param {string[]} keys
 */
function pickContributors(signals, keys) {
  return keys
    .filter((k) => signals[k] != null)
    .sort((a, b) => Math.abs(signals[b] ?? 0) - Math.abs(signals[a] ?? 0))
    .slice(0, 3);
}
