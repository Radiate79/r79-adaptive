import { getTemplateFamilyForWheelBase } from "../data/wheelBases.js";
import { resolveCarDynamicsProfile } from "./carDynamicsProfile.js";
import { resolveTrackDynamicsProfile } from "./trackDynamicsProfile.js";
import { calculateT598WheelSettings } from "./wheelT598Calculator.js";

/**
 * Apply bounded car-profile offsets to a wheel baseline.
 * Delegates to the authoritative T598 calculator (engine v2).
 *
 * @param {Record<string, string | number>} baseValues
 * @param {import("../data/gt7/cars.js").CarRecord | null | undefined} car
 * @param {string} wheelBaseId
 * @returns {Record<string, string | number>}
 */
export function applyCarProfileToWheelBaseline(baseValues, car, wheelBaseId) {
  if (!car || !baseValues || getTemplateFamilyForWheelBase(wheelBaseId) !== "t598") {
    return { ...baseValues };
  }

  const carProfile = resolveCarDynamicsProfile({
    carId: car.id,
    gameVersion: "gt7",
    bopOn: true,
  });
  const trackProfile = resolveTrackDynamicsProfile({
    trackId: carProfile.car?.id ? undefined : undefined,
    gameVersion: "gt7",
    car,
  });

  return calculateT598WheelSettings(baseValues, {
    carProfile,
    trackProfile,
    anchorWeight: 0.35,
    wheelBaseId,
  }).values;
}
