/**
 * Shared car class and eligibility filtering for all recommendation engines.
 * Uses the canonical `class` field only — never car names or ids for class matching.
 */

/** @param {string} value */
export function normalizeCarClass(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * @param {{ class?: string, carClass?: string, category?: string, group?: string, id?: string }} car
 * @param {string} carClass
 */
export function isCarInClass(car, carClass) {
  if (!carClass) {
    return true;
  }

  const requested = normalizeCarClass(carClass);
  const actual = normalizeCarClass(
    car.class ?? car.carClass ?? car.category ?? car.group,
  );

  return actual === requested;
}

/** Matches Alpine manufacturer entries by name until classification is verified. */
const ALPINE_NAME_PATTERN = /\balpine\b/i;

/**
 * Cars temporarily withheld from all R79 recommendation outputs.
 * @param {{ id?: string, name?: string, excludedFromRecommendations?: boolean }} car
 */
export function isExcludedFromRecommendations(car) {
  if (!car) {
    return true;
  }

  if (car.excludedFromRecommendations) {
    return true;
  }

  if (car.id?.startsWith("alpine_")) {
    return true;
  }

  if (ALPINE_NAME_PATTERN.test(car.name ?? "")) {
    return true;
  }

  return false;
}

/**
 * Shared eligibility gate — use before building any recommendation output.
 * @param {{ id?: string, name?: string, excludedFromRecommendations?: boolean }} car
 */
export function isCarEligibleForRecommendations(car) {
  return !isExcludedFromRecommendations(car);
}

/**
 * @param {Array<{ id?: string, class?: string, excludedFromRecommendations?: boolean }>} cars
 * @param {string} [carClass]
 */
export function filterCarsByClass(cars, carClass) {
  if (!carClass) {
    return cars;
  }

  return cars.filter((car) => isCarInClass(car, carClass));
}

/**
 * Recommendation pool used by all advisor engines.
 * @param {Array<{ id?: string, class?: string, excludedFromRecommendations?: boolean }>} cars
 * @param {string} [carClass]
 */
export function filterRecommendationPool(cars, carClass) {
  const classFiltered = carClass ? filterCarsByClass(cars, carClass) : cars;

  return classFiltered.filter((car) => isCarEligibleForRecommendations(car));
}

/**
 * Final safety pass on recommendation result arrays.
 * @param {Array<{ id?: string, name?: string, excludedFromRecommendations?: boolean }>} cars
 */
export function filterEligibleRecommendationResults(cars) {
  if (!Array.isArray(cars)) {
    return [];
  }

  return cars.filter((car) => isCarEligibleForRecommendations(car));
}

/**
 * @param {{ id?: string, name?: string, excludedFromRecommendations?: boolean } | null | undefined} car
 */
export function pickEligibleRecommendation(car) {
  return car && isCarEligibleForRecommendations(car) ? car : null;
}
