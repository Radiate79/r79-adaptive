/**
 * T598 calculator — Stage A + balance + Stage B for Thrustmaster T598.
 * Kept as a focused adapter so existing imports continue to work.
 */

import { calculateDesiredSteeringBehaviour } from "./wheelDesiredBehaviour.js";
import { applyWholeSetupBalance } from "./wheelSetupBalance.js";
import { translateDesiredBehaviourToDevice } from "./wheelDeviceTranslation.js";

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
  const stageA = calculateDesiredSteeringBehaviour({
    carProfile: input.carProfile,
    trackProfile: input.trackProfile,
    tyreCompound: input.tyreCompound,
    lapCount: input.lapCount,
    tyreMultiplier: input.tyreMultiplier,
    fuelMultiplier: input.fuelMultiplier,
  });

  const balanced = applyWholeSetupBalance(stageA.desired);

  const stageB = translateDesiredBehaviourToDevice("t598", balanced.desired, {
    wheelBaseId: input.wheelBaseId,
    anchorValues,
    anchorWeight: input.anchorWeight ?? 0.85,
  });

  /** @type {Record<string, string>} */
  const fieldReasons = buildFieldReasons(
    balanced.desired,
    stageA.contributors,
    stageA.race,
    input.carProfile,
    input.trackProfile,
    balanced.corrections,
  );

  return {
    values: stageB.values,
    continuous: stageB.continuous,
    signals: stageA.signals,
    raceContext: stageA.race,
    desiredBehaviour: balanced.desired,
    balanceCorrections: balanced.corrections,
    balanceDiagnostics: balanced.diagnostics,
    fieldReasons,
  };
}

/**
 * Re-export race context builder for tests that import it from this module.
 */
export { buildRaceBehaviourModifiers as buildRaceContextSignals } from "./wheelDesiredBehaviour.js";

/**
 * @param {import("./wheelDesiredBehaviour.js").DesiredSteeringBehaviour} desired
 * @param {Record<string, string[]>} contributors
 * @param {ReturnType<import("./wheelDesiredBehaviour.js").buildRaceBehaviourModifiers>} race
 * @param {ReturnType<import("./carDynamicsProfile.js").resolveCarDynamicsProfile>} carProfile
 * @param {ReturnType<import("./trackDynamicsProfile.js").resolveTrackDynamicsProfile>} trackProfile
 * @param {Array<{ channel: string, reason: string }>} corrections
 */
function buildFieldReasons(
  desired,
  contributors,
  race,
  carProfile,
  trackProfile,
  corrections,
) {
  const carName = carProfile.car?.name ?? "this car";
  const trackName = trackProfile.displayName || "this circuit";
  const balanceNote =
    corrections.find((c) => c.channel === "frictionTarget")?.reason ??
    corrections.find((c) => c.channel === "inertiaTarget")?.reason ??
    corrections.find((c) => c.channel === "dampingTarget")?.reason ??
    "";

  /** @type {Record<string, string>} */
  const reasons = {
    ffb: `FFB level set for ${carName}'s force demand and ${trackName} steering load under GT7 1.71.`,
    master: `Master scaled for controllable peak force — grip ${race.tyreCompound}, fatigue softener ${Math.round(race.raceFatigue * 100)}%.`,
    mode: contributors.rotation?.length
      ? `Mode favours ${desired.rotationSpeedTarget >= 0.55 ? "response/rotation" : "stability"} for ${carName} at ${trackName}.`
      : `Mode selected from car/track rotation–stability balance.`,
    inertia: describeChannel(
      "Inertia",
      desired.inertiaTarget,
      contributors.inertia,
      carName,
      trackName,
      balanceNote.includes("inertia") ? balanceNote : "",
    ),
    friction: describeChannel(
      "Friction",
      desired.frictionTarget,
      contributors.friction,
      carName,
      trackName,
      balanceNote.includes("friction") || balanceNote.includes("Friction")
        ? balanceNote
        : corrections.some((c) => c.channel === "frictionTarget")
          ? corrections.find((c) => c.channel === "frictionTarget")?.reason ?? ""
          : "",
    ),
    boostLow: `Boost Low tuned for low-force detail and kerb readability at ${trackName}.`,
    boostHigh: `Boost High set for high-load control without clipping on ${carName}.`,
    speed: `Speed prioritises ${desired.directionChangeSpeed >= 0.55 ? "fast direction changes" : "controlled steering rate"} for this layout.`,
    damper: describeChannel(
      "Damper",
      desired.dampingTarget,
      contributors.damping,
      carName,
      trackName,
      corrections.find((c) => c.channel === "dampingTarget")?.reason ?? "",
    ),
    damperGain: `Damper Gain follows oscillation control (${Math.round(desired.oscillationControlTarget * 100)}%) without stacking extra resistance.`,
    spring: `Spring kept low so return-to-centre does not fight mid-corner feel.`,
    endStop: `End Stop reflects high-speed / kerb protection needs at ${trackName}.`,
  };

  return reasons;
}

/**
 * @param {string} label
 * @param {number} target
 * @param {string[] | undefined} contrib
 * @param {string} carName
 * @param {string} trackName
 * @param {string} balanceNote
 */
function describeChannel(label, target, contrib, carName, trackName, balanceNote) {
  const level =
    target >= 0.7 ? "higher" : target >= 0.45 ? "moderate" : "lower";
  const why = (contrib ?? [])
    .slice(0, 2)
    .map((key) => {
      switch (key) {
        case "carRotation":
          return `${carName}'s rotation`;
        case "carStability":
          return `${carName}'s stability`;
        case "trackHighSpeed":
          return `${trackName}'s high-speed demand`;
        case "trackKerb":
          return `${trackName}'s kerb load`;
        case "trackRotationNeed":
          return `${trackName}'s rotation need`;
        case "raceConsistency":
          return "long-run consistency";
        case "raceTyreWear":
          return "tyre-wear readability";
        case "trackLoad":
          return `${trackName}'s steering load`;
        default:
          return key;
      }
    })
    .join(" and ");

  const base = why
    ? `${label} set ${level} for ${why} under GT7 1.71.`
    : `${label} set ${level} from the desired steering behaviour target.`;

  return balanceNote ? `${base} ${balanceNote}` : base;
}

/** Legacy exports kept for older tests — continuous path now lives in desired behaviour. */
export function computeT598ContinuousTargets() {
  return { continuous: {}, signals: {} };
}

export function quantizeT598ContinuousTargets(continuous, anchorValues = {}) {
  return { ...anchorValues, ...continuous };
}
