/**
 * Bounded, explainable car × track interaction for the Podium Engine.
 * Uses existing car/track ratings only — no invented per-car physics.
 *
 * @typedef {Object} CarTrackInteraction
 * @property {number} frontDemand
 * @property {number} rearNervousness
 * @property {number} kerbLoad
 * @property {number} highSpeedNeed
 * @property {number} rotationNeed
 * @property {number} catchabilityNeed
 * @property {number} detailNeed
 * @property {number} fatigueRisk
 * @property {string[]} factors
 * @property {Partial<Record<'maximumPace'|'stability'|'tyrePreservation'|'fuelEfficiency'|'consistency', number>>} priorityDeltas
 */

/**
 * @param {import("../data/gt7/cars.js").CarRecord | null | undefined} car
 * @param {import("../data/gt7/tracks.js").TrackRecord | null | undefined} track
 * @returns {CarTrackInteraction}
 */
export function computeCarTrackInteraction(car, track) {
  const carStability = Number(car?.stability ?? 5) / 10;
  const carTraction = Number(car?.traction ?? 5) / 10;
  const carRotation = Number(car?.rotation ?? 5) / 10;
  const carTyres = Number(car?.tyres ?? 6) / 10;
  const carTopSpeed = Number(car?.topSpeed ?? 5) / 10;
  const drivetrain = String(car?.drivetrain ?? "").toUpperCase();

  const trackStability = Number(track?.stability ?? 5) / 10;
  const trackTraction = Number(track?.traction ?? 5) / 10;
  const trackKerbs = Number(track?.kerbs ?? 5) / 10;
  const trackTopSpeed = Number(track?.topSpeed ?? 5) / 10;
  const trackTyres = Number(track?.tyres ?? 5) / 10;

  const rearBiased =
    drivetrain === "MR" || drivetrain === "RR" || carRotation >= 0.75;
  const frontLimited = carTraction >= 0.7 && carRotation <= 0.55;

  const frontDemand = clamp01(
    trackTraction * 0.45 +
      trackTyres * 0.25 +
      (1 - carRotation) * 0.2 +
      (frontLimited ? 0.15 : 0),
  );
  const rearNervousness = clamp01(
    carRotation * 0.4 +
      (1 - carStability) * 0.35 +
      (rearBiased ? 0.2 : 0) +
      trackKerbs * 0.15,
  );
  const kerbLoad = clamp01(trackKerbs * 0.7 + (1 - carStability) * 0.2);
  const highSpeedNeed = clamp01(
    trackTopSpeed * 0.55 + carTopSpeed * 0.25 + (1 - carStability) * 0.15,
  );
  const rotationNeed = clamp01(
    trackTraction * 0.35 +
      carRotation * 0.35 +
      (1 - trackStability) * 0.2 +
      (frontLimited ? 0.1 : 0),
  );
  const catchabilityNeed = clamp01(
    rearNervousness * 0.55 + kerbLoad * 0.35 + (1 - carStability) * 0.15,
  );
  const detailNeed = clamp01(
    frontDemand * 0.45 + rotationNeed * 0.35 + trackTraction * 0.2,
  );
  const fatigueRisk = clamp01(
    highSpeedNeed * 0.35 + kerbLoad * 0.35 + (1 - carTyres) * 0.2,
  );

  /** @type {CarTrackInteraction['priorityDeltas']} */
  const priorityDeltas = {
    stability: 0,
    consistency: 0,
    maximumPace: 0,
    tyrePreservation: 0,
    fuelEfficiency: 0,
  };

  /** @type {string[]} */
  const factors = [];

  if (rearNervousness >= 0.62 && kerbLoad >= 0.55) {
    priorityDeltas.stability = (priorityDeltas.stability ?? 0) + 0.12;
    priorityDeltas.consistency = (priorityDeltas.consistency ?? 0) + 0.08;
    priorityDeltas.maximumPace = (priorityDeltas.maximumPace ?? 0) - 0.06;
    factors.push(
      "rear-sensitive car on a kerb-heavy circuit needs calmer oscillation and catchability",
    );
  } else if (rearNervousness >= 0.65) {
    priorityDeltas.stability = (priorityDeltas.stability ?? 0) + 0.08;
    priorityDeltas.consistency = (priorityDeltas.consistency ?? 0) + 0.05;
    factors.push("rear-sensitive balance benefits from planted, progressive steering");
  }

  if (frontLimited && frontDemand >= 0.55) {
    priorityDeltas.maximumPace = (priorityDeltas.maximumPace ?? 0) + 0.04;
    priorityDeltas.stability = (priorityDeltas.stability ?? 0) + 0.04;
    factors.push(
      "front-limited car on a front-demanding circuit needs clear front-end information without excess weight",
    );
  }

  if (highSpeedNeed >= 0.7) {
    priorityDeltas.stability = (priorityDeltas.stability ?? 0) + 0.1;
    priorityDeltas.consistency = (priorityDeltas.consistency ?? 0) + 0.05;
    priorityDeltas.maximumPace = (priorityDeltas.maximumPace ?? 0) - 0.03;
    factors.push(
      "high-speed circuit demand favours confidence and stability while keeping detail",
    );
  }

  if (rotationNeed >= 0.65 && carStability >= 0.65) {
    priorityDeltas.maximumPace = (priorityDeltas.maximumPace ?? 0) + 0.07;
    factors.push(
      "stable car on a technical circuit can use more immediacy and rotation information",
    );
  }

  if (fatigueRisk >= 0.65) {
    priorityDeltas.consistency = (priorityDeltas.consistency ?? 0) + 0.06;
    priorityDeltas.tyrePreservation = (priorityDeltas.tyrePreservation ?? 0) + 0.04;
    factors.push("loaded corners and kerbs raise fatigue risk across a stint");
  }

  if (carTyres <= 0.55 && trackTyres >= 0.65) {
    priorityDeltas.tyrePreservation = (priorityDeltas.tyrePreservation ?? 0) + 0.08;
    factors.push("tyre-stressed car on a high tyre-demand track needs progressive load");
  }

  return {
    frontDemand,
    rearNervousness,
    kerbLoad,
    highSpeedNeed,
    rotationNeed,
    catchabilityNeed,
    detailNeed,
    fatigueRisk,
    factors,
    priorityDeltas,
  };
}

/**
 * Build a concise field-level reason from interaction + race objective.
 *
 * @param {{
 *   fieldLabel: string,
 *   direction: 'up' | 'down' | 'hold',
 *   carName?: string,
 *   trackName?: string,
 *   interaction: CarTrackInteraction,
 *   objective: 'qualifying' | 'sprint' | 'race' | 'endurance',
 *   compoundLabel?: string,
 * }} args
 */
export function buildInteractionFieldReason(args) {
  const car = args.carName ?? "this car";
  const track = args.trackName ?? "this circuit";
  const factor = args.interaction.factors[0];
  const compound = args.compoundLabel ? ` on ${args.compoundLabel}` : "";

  if (args.direction === "up") {
    if (args.interaction.catchabilityNeed >= 0.6) {
      return `Raises ${args.fieldLabel.toLowerCase()} to calm unnecessary oscillation and keep ${car} catchable at ${track}.`;
    }
    if (args.interaction.highSpeedNeed >= 0.65) {
      return `Higher ${args.fieldLabel.toLowerCase()} builds confidence through ${track}'s high-speed loads while preserving usable detail from ${car}.`;
    }
    if (args.objective === "endurance" || args.objective === "race") {
      return `Higher ${args.fieldLabel.toLowerCase()} keeps steering progressive through ${track} as the stint develops${compound}.`;
    }
    if (factor) {
      return `Higher ${args.fieldLabel.toLowerCase()} suits ${factor}.`;
    }
    return `Higher ${args.fieldLabel.toLowerCase()} supports stability and readability for ${car} at ${track}.`;
  }

  if (args.direction === "down") {
    if (args.objective === "qualifying") {
      return `Lower ${args.fieldLabel.toLowerCase()} sharpens response for a short run${compound} where precision outweighs fatigue.`;
    }
    if (args.interaction.rotationNeed >= 0.6 && args.interaction.frontDemand >= 0.5) {
      return `Lower ${args.fieldLabel.toLowerCase()} frees front-end information from ${car} without excess steering weight at ${track}.`;
    }
    if (factor) {
      return `Lower ${args.fieldLabel.toLowerCase()} suits ${factor}.`;
    }
    return `Lower ${args.fieldLabel.toLowerCase()} keeps ${car} more immediate at ${track}.`;
  }

  return "";
}

/**
 * @param {number} laps
 * @param {number} tyreMultiplier
 * @param {number} fuelMultiplier
 * @returns {'qualifying' | 'sprint' | 'race' | 'endurance'}
 */
export function inferRaceObjective(laps, tyreMultiplier, fuelMultiplier) {
  if (laps <= 2 && tyreMultiplier <= 1.5 && fuelMultiplier <= 1.5) {
    return "qualifying";
  }
  if (laps <= 10 && tyreMultiplier <= 2 && fuelMultiplier <= 2) {
    return "sprint";
  }
  if (laps >= 26 || tyreMultiplier >= 4 || fuelMultiplier >= 4) {
    return "endurance";
  }
  return "race";
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, value));
}
