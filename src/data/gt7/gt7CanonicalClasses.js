/**
 * Canonical GT7 racing-class metadata for R79 performance cars.
 *
 * Class assignment uses verified R79/GT7 class fields only.
 * NEVER infer class from display names containing "GT3", "GT4", "Gr.3", etc.
 *
 * Availability (official catalogue) and class (this registry / car.class) are separate.
 */

import { CAR_CLASS_OPTIONS, isSupportedCarClass } from "../carClasses.js";
import { isInvalidGt7R79CarId } from "./officialCarCatalogue.js";

/** Racing classes that may appear in R79 race selectors. */
export const GT7_RACING_CLASSES = Object.freeze([...CAR_CLASS_OPTIONS]);

/**
 * Explicit BMW class validation cases (canonical).
 * These override nothing when car.class already matches — they are the contract.
 */
export const BMW_CLASS_VALIDATION_CASES = Object.freeze([
  {
    id: "bmw_m4_gr4",
    availableInGT7: true,
    class: "Gr.4",
    mustAppearIn: ["Gr.4"],
    mustNotAppearIn: ["Gr.1", "Gr.2", "Gr.3"],
  },
  {
    id: "bmw_m4_gt3",
    availableInGT7: false,
    class: null,
    mustAppearIn: [],
    mustNotAppearIn: ["Gr.1", "Gr.2", "Gr.3", "Gr.4"],
  },
  {
    id: "bmw_m6_gt3_endurance_model_16",
    availableInGT7: true,
    class: "Gr.3",
    mustAppearIn: ["Gr.3"],
    mustNotAppearIn: ["Gr.1", "Gr.2", "Gr.4"],
  },
  {
    id: "bmw_m6_gt3_sprint_model",
    availableInGT7: true,
    class: "Gr.3",
    mustAppearIn: ["Gr.3"],
    mustNotAppearIn: ["Gr.1", "Gr.2", "Gr.4"],
  },
  {
    id: "bmw_z4_gt3_11",
    availableInGT7: true,
    class: "Gr.3",
    mustAppearIn: ["Gr.3"],
    mustNotAppearIn: ["Gr.1", "Gr.2", "Gr.4"],
  },
]);

/**
 * Resolve the canonical GT7 racing class for selector/recommendation use.
 * Returns null when the car is not a selectable GT7 race car for that class system.
 *
 * @param {{
 *   id?: string,
 *   class?: string,
 *   availableInGT7?: boolean,
 * }} car
 * @returns {string | null}
 */
export function getCanonicalGt7RacingClass(car) {
  if (!car) return null;
  if (car.availableInGT7 === false) return null;
  if (car.id && isInvalidGt7R79CarId(car.id)) return null;

  const racingClass = car.class ?? null;
  if (!isSupportedCarClass(racingClass)) {
    return null;
  }
  return racingClass;
}

/**
 * True only when the car may appear in a GT7 racing-class selector for `carClass`.
 * Uses canonical class metadata exclusively — never name/id string matching.
 *
 * @param {{ id?: string, class?: string, availableInGT7?: boolean }} car
 * @param {string} carClass
 */
export function isCarInCanonicalGt7RacingClass(car, carClass) {
  if (!carClass || !isSupportedCarClass(carClass)) {
    return false;
  }
  const canonical = getCanonicalGt7RacingClass(car);
  return canonical === carClass;
}

/**
 * @param {Array<{ id?: string, class?: string, availableInGT7?: boolean }>} cars
 * @param {string} carClass
 */
export function filterCarsByCanonicalGt7Class(cars, carClass) {
  if (!Array.isArray(cars)) return [];
  if (!carClass) {
    return cars.filter((car) => getCanonicalGt7RacingClass(car) != null);
  }
  return cars.filter((car) => isCarInCanonicalGt7RacingClass(car, carClass));
}

/**
 * Audit helper: find selector leakage / road-car contamination.
 * @param {Array<{ id?: string, name?: string, class?: string, availableInGT7?: boolean }>} selectableCars
 */
export function auditGt7ClassAssignments(selectableCars) {
  /** @type {Array<{ id: string, name?: string, class?: string, issue: string }>} */
  const issues = [];
  const pool = Array.isArray(selectableCars) ? selectableCars : [];

  for (const carClass of GT7_RACING_CLASSES) {
    const bucket = filterCarsByCanonicalGt7Class(pool, carClass);
    for (const car of bucket) {
      if (car.class !== carClass) {
        issues.push({
          id: car.id ?? "unknown",
          name: car.name,
          class: car.class,
          issue: `selector_${carClass}_contains_class_${car.class}`,
        });
      }
      if (car.availableInGT7 === false || (car.id && isInvalidGt7R79CarId(car.id))) {
        issues.push({
          id: car.id ?? "unknown",
          name: car.name,
          class: car.class,
          issue: `invalid_gt7_car_in_${carClass}_selector`,
        });
      }
    }
  }

  for (const car of pool) {
    const canonical = getCanonicalGt7RacingClass(car);
    if (canonical == null && isSupportedCarClass(car.class)) {
      // availableInGT7 false but still holding a racing class label — historical only
      if (car.availableInGT7 === false || (car.id && isInvalidGt7R79CarId(car.id))) {
        issues.push({
          id: car.id ?? "unknown",
          name: car.name,
          class: car.class,
          issue: "invalid_non_gt7_car_retains_active_racing_class_eligibility",
        });
      }
    }
    // Road / non-racing classes must never pass racing-class filters
    if (!isSupportedCarClass(car.class)) {
      for (const carClass of GT7_RACING_CLASSES) {
        if (isCarInCanonicalGt7RacingClass(car, carClass)) {
          issues.push({
            id: car.id ?? "unknown",
            name: car.name,
            class: car.class,
            issue: `road_or_non_racing_car_in_${carClass}`,
          });
        }
      }
    }
  }

  return issues;
}

export { isSupportedCarClass, GT7_RACING_CLASSES as RACING_CLASS_OPTIONS };
