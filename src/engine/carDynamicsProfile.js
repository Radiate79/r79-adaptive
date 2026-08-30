import { cars as gt7Cars } from "../data/gt7/cars.js";
import {
  GR3_171_ATTRIBUTE_DELTAS,
  resolveChampionshipCarAttributes,
} from "../data/championshipAdvisor171.js";
import { getCarsForGame } from "../utils/gameData.js";

/** @typedef {'car' | 'bop_adjusted' | 'class_baseline' | 'unknown'} TraitProvenance */

const SCORE_TRAITS = ["topSpeed", "traction", "fuel", "tyres", "stability", "rotation"];

/**
 * @param {number | undefined} value
 * @param {number} [fallback]
 */
function normalizeTrait(value, fallback = 5) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(1, Math.max(0, numeric / 10));
}

/**
 * @param {import("../data/gt7/cars.js").CarRecord[]} classCars
 * @param {string} field
 */
function computeClassMedian(classCars, field) {
  const values = classCars
    .map((car) => Number(car[field]))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];

  return normalizeTrait(median, 5);
}

/**
 * @param {string | undefined} drivetrain
 */
export function resolveDrivetrainLayout(drivetrain) {
  const layout = String(drivetrain ?? "").toUpperCase();

  return {
    layout,
    rearBiased: layout === "MR" || layout === "RR",
    allWheel: layout === "4WD" || layout === "AWD",
    frontDrive: layout === "FF",
  };
}

/**
 * Resolve a structured car dynamics profile with explicit provenance.
 * Unknown traits remain null — they are excluded from weighted calculations.
 *
 * @param {{ carId?: string, gameVersion?: string, bopOn?: boolean }} input
 */
export function resolveCarDynamicsProfile(input) {
  const gameVersion = input.gameVersion ?? "gt7";
  const rawCar =
    getCarsForGame(gameVersion).find((entry) => entry.id === input.carId) ?? null;

  if (!rawCar) {
    return {
      carId: input.carId ?? "",
      car: null,
      traits: {},
      provenance: {},
      completeness: 0,
      drivetrain: resolveDrivetrainLayout(null),
      bopApplied: false,
    };
  }

  const bopApplied = Boolean(input.bopOn !== false && rawCar.class === "Gr.3");
  const car = resolveChampionshipCarAttributes(rawCar, { bopOn: input.bopOn });
  const classCars = gt7Cars.filter((entry) => entry.class === car.class);

  /** @type {Record<string, number | null>} */
  const traits = {};
  /** @type {Record<string, TraitProvenance>} */
  const provenance = {};

  for (const field of SCORE_TRAITS) {
    const rawValue = car[field];
    if (rawValue != null && Number.isFinite(Number(rawValue))) {
      traits[field] = normalizeTrait(rawValue);
      const hasBopDelta =
        bopApplied && GR3_171_ATTRIBUTE_DELTAS[car.id]?.[field] != null;
      provenance[field] = hasBopDelta ? "bop_adjusted" : "car";
      continue;
    }

    const classMedian = computeClassMedian(classCars, field);
    if (classMedian != null) {
      traits[field] = classMedian;
      provenance[field] = "class_baseline";
    } else {
      traits[field] = null;
      provenance[field] = "unknown";
    }
  }

  const drivetrain = resolveDrivetrainLayout(car.drivetrain);
  provenance.drivetrain = car.drivetrain ? "car" : "unknown";

  const knownTraits = SCORE_TRAITS.filter(
    (field) => provenance[field] !== "unknown",
  ).length;
  const completeness =
    (knownTraits + (provenance.drivetrain !== "unknown" ? 1 : 0)) /
    (SCORE_TRAITS.length + 1);

  return {
    carId: car.id,
    car,
    traits,
    provenance,
    completeness,
    drivetrain,
    bopApplied,
    className: car.class ?? "",
  };
}

/**
 * Build a flat signal map for T598 weighting from a resolved car profile.
 * Missing traits are omitted — callers renormalise weights.
 *
 * @param {ReturnType<typeof resolveCarDynamicsProfile>} profile
 */
export function buildCarDynamicsSignals(profile) {
  const { traits, drivetrain } = profile;

  return {
    carRotation: traits.rotation,
    carStability: traits.stability,
    carTraction: traits.traction,
    carTyres: traits.tyres,
    carTopSpeed: traits.topSpeed,
    carFuel: traits.fuel,
    carDetail:
      traits.rotation != null && traits.traction != null
        ? Math.min(1, traits.rotation * 0.55 + traits.traction * 0.45)
        : traits.rotation ?? traits.traction,
    carRearBias: drivetrain.rearBiased ? 1 : drivetrain.allWheel ? 0.55 : 0.25,
  };
}
