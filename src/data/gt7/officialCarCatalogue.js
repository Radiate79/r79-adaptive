/**
 * Canonical GT7 car availability — single source of truth.
 *
 * Production never scrapes gran-turismo.com. Availability comes only from the
 * validated local snapshot under src/data/gt7/1.72/.
 *
 * REAL GT3 CAR ≠ GT7 CAR. Official catalogue defines GT7 availability.
 */

import catalogueSnapshot from "./1.72/officialCarCatalogue.json" with { type: "json" };

export const GT7_OFFICIAL_CATALOGUE_VERSION =
  catalogueSnapshot.meta?.catalogueVersion ?? "1.72.0";
export const GT7_OFFICIAL_SOURCE_VERSION =
  catalogueSnapshot.meta?.sourceVersion ?? "1.72";
export const GT7_OFFICIAL_CAR_COUNT_EXPECTED = 580;

/** @typedef {typeof catalogueSnapshot.cars[number]} OfficialGt7Car */

/** @type {OfficialGt7Car[]} */
export const OFFICIAL_GT7_CARS = catalogueSnapshot.cars;

export const OFFICIAL_GT7_CATALOGUE_META = catalogueSnapshot.meta;

/**
 * R79 performance-car ids that are confirmed NOT in the official GT7 catalogue.
 * Kept for historical/ALR references but must never appear as selectable GT7 cars.
 */
export const INVALID_GT7_R79_CAR_IDS = Object.freeze([
  "bmw_m4_gt3",
  "bentley_continental_gt3_18",
  "lamborghini_huracan_gt3_evo_20",
  "ferrari_488_gt3_16",
  "lexus_lc500_gr3",
  "mclaren_720s_gt3",
  "chevrolet_camaro_gr3",
  "aston_martin_vantage_gt3_19",
  "alpine_a110_gr4",
  "chevrolet_camaro_gr4",
  "dodge_challenger_gr4",
  "ford_focus_rs_gr4",
  "hyundai_veloster_n_gr4",
  "mclaren_570s_gr4",
  "mercedes_amg_gt_gr4",
  "nissan_370z_gr4",
  "volkswagen_golf_gti_gr4",
  "volvo_v60_gr4",
  "toyota_supra_gr4",
  "renault_megane_trophy_gr4",
  "mazda_rx_vision_gt3_concept_stealth",
  "peugeot_9x8_22",
  "porsche_963_23",
  "cadillac_vseries_r_23",
  "porsche_911_rsr_gte_17",
  "ferrari_488_gte_evo_20",
  "bmw_m8_gte_18",
  "chevrolet_corvette_c8_r_20",
  "aston_martin_vantage_amr_gte_18",
  "ford_gt_gte_17",
]);

/**
 * Verified aliases: query string → official catalogue car name (manufacturer-relative).
 * Never alias non-GT7 vehicles onto GT7 cars.
 */
export const GT7_SEARCH_ALIASES = Object.freeze({
  "ferrari 296": "296 GT3 '23",
  "296 gt3": "296 GT3 '23",
  "ferrari 296 gt3": "296 GT3 '23",
  "ferrari 296 gt3 '23": "296 GT3 '23",
  "audi r8 lms evo": "R8 LMS Evo '19",
  "audi r8 lms evo '19": "R8 LMS Evo '19",
  "r8 lms evo": "R8 LMS Evo '19",
  "mazda rx-vision gt3 evo": "RX-VISION GT3 EVO '26",
  "mazda rx vision gt3 evo": "RX-VISION GT3 EVO '26",
  "rx-vision gt3 evo '26": "RX-VISION GT3 EVO '26",
  "xiaomi vision gran turismo": "Xiaomi VGT",
  "xiaomi vgt": "Xiaomi VGT",
  "bmw m6 gt3 endurance": "M6 GT3 Endurance Model '16",
  "bmw m6 gt3 sprint": "M6 GT3 Sprint Model '16",
  "bmw z4 gt3": "Z4 GT3 '11",
  "bmw m4 gr.4": "M4 Gr.4",
  "bmw m4 gr4": "M4 Gr.4",
});

/**
 * Explicit forbidden queries that must never resolve via alias.
 */
export const GT7_FORBIDDEN_ALIASES = Object.freeze([
  "bmw m4 gt3",
  "m4 gt3",
  "bentley continental gt3",
  "bentley continental gt3 '18",
  "continental gt3",
]);

function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @type {Map<string, OfficialGt7Car>} */
const BY_ID = new Map(OFFICIAL_GT7_CARS.map((car) => [car.id, car]));

/** @type {Map<string, OfficialGt7Car>} */
const BY_NORM_NAME = new Map();
for (const car of OFFICIAL_GT7_CARS) {
  BY_NORM_NAME.set(normalizeToken(car.name), car);
  BY_NORM_NAME.set(normalizeToken(car.displayName), car);
  BY_NORM_NAME.set(normalizeToken(`${car.manufacturer} ${car.name}`), car);
}

/**
 * @param {string} carId
 */
export function isInvalidGt7R79CarId(carId) {
  return INVALID_GT7_R79_CAR_IDS.includes(String(carId ?? ""));
}

/**
 * @param {string | null | undefined} query
 * @returns {boolean}
 */
export function isForbiddenGt7AliasQuery(query) {
  const key = normalizeToken(query);
  return GT7_FORBIDDEN_ALIASES.some((forbidden) => normalizeToken(forbidden) === key);
}

/**
 * @param {string} officialIdOrName
 * @returns {OfficialGt7Car | null}
 */
export function getOfficialGt7Car(officialIdOrName) {
  if (!officialIdOrName) return null;
  if (isForbiddenGt7AliasQuery(officialIdOrName)) return null;
  const byId = BY_ID.get(officialIdOrName);
  if (byId) return byId;
  const aliasTarget = GT7_SEARCH_ALIASES[normalizeToken(officialIdOrName)];
  if (aliasTarget) {
    return BY_NORM_NAME.get(normalizeToken(aliasTarget)) ?? null;
  }
  return BY_NORM_NAME.get(normalizeToken(officialIdOrName)) ?? null;
}

/**
 * Availability check against the official catalogue only.
 * @param {{ id?: string, name?: string, officialCatalogueId?: string | null, availableInGT7?: boolean } | string | null | undefined} carOrQuery
 */
export function isAvailableInGT7(carOrQuery) {
  if (carOrQuery == null) return false;
  if (typeof carOrQuery === "string") {
    if (isForbiddenGt7AliasQuery(carOrQuery)) return false;
    if (isInvalidGt7R79CarId(carOrQuery)) return false;
    return getOfficialGt7Car(carOrQuery) != null;
  }
  if (carOrQuery.availableInGT7 === false) return false;
  if (carOrQuery.id && isInvalidGt7R79CarId(carOrQuery.id)) return false;
  if (carOrQuery.officialCatalogueId) {
    return BY_ID.has(carOrQuery.officialCatalogueId);
  }
  if (carOrQuery.name && isForbiddenGt7AliasQuery(carOrQuery.name)) return false;
  if (carOrQuery.name && getOfficialGt7Car(carOrQuery.name)) return true;
  return false;
}

/**
 * Search official GT7 catalogue only (never a global vehicle library).
 * @param {string} query
 * @param {{ limit?: number }} [options]
 * @returns {OfficialGt7Car[]}
 */
export function searchGT7(query, options = {}) {
  const limit = Math.max(1, Number(options.limit ?? 50));
  const q = normalizeToken(query);
  if (!q) return [];
  if (isForbiddenGt7AliasQuery(q)) return [];

  const aliasTarget = GT7_SEARCH_ALIASES[q];
  if (aliasTarget) {
    const hit = BY_NORM_NAME.get(normalizeToken(aliasTarget));
    return hit ? [hit] : [];
  }

  const scored = [];
  for (const car of OFFICIAL_GT7_CARS) {
    const hay = normalizeToken(
      `${car.manufacturer} ${car.name} ${car.displayName}`,
    );
    if (!hay.includes(q) && !q.split(" ").every((part) => hay.includes(part))) {
      continue;
    }
    const exact = hay === q || normalizeToken(car.name) === q;
    scored.push({ car, rank: exact ? 0 : 1 });
  }
  scored.sort((a, b) => a.rank - b.rank || a.car.displayName.localeCompare(b.car.displayName));
  return scored.slice(0, limit).map((row) => row.car);
}

/**
 * Resolve a GT7 car from id/name/alias. Returns null when unavailable.
 * @param {string} query
 * @returns {OfficialGt7Car | null}
 */
export function getGT7Car(query) {
  if (!query) return null;
  if (isForbiddenGt7AliasQuery(query)) return null;
  if (isInvalidGt7R79CarId(query)) return null;
  return getOfficialGt7Car(query);
}

/**
 * @param {{ id?: string, name?: string } | null | undefined} car
 */
export function assertSelectableGt7Car(car) {
  if (!car) {
    return { ok: false, reason: "missing_selection" };
  }
  if (!isAvailableInGT7(car)) {
    return {
      ok: false,
      reason: "invalid_gt7_car",
      message:
        "Saved car is not available in the official Gran Turismo 7 catalogue. Please select a valid GT7 car.",
    };
  }
  return { ok: true };
}

export function getOfficialGt7CatalogueStats() {
  const ids = new Set();
  const nameKeys = new Set();
  let duplicateIds = 0;
  let duplicateNames = 0;
  for (const car of OFFICIAL_GT7_CARS) {
    if (ids.has(car.id)) duplicateIds += 1;
    ids.add(car.id);
    const key = `${normalizeToken(car.manufacturer)}::${normalizeToken(car.name)}`;
    if (nameKeys.has(key)) duplicateNames += 1;
    nameKeys.add(key);
  }
  return {
    count: OFFICIAL_GT7_CARS.length,
    duplicateIds,
    duplicateNames,
    allGt7: OFFICIAL_GT7_CARS.every((c) => c.gt7 === true),
    emptyNames: OFFICIAL_GT7_CARS.filter((c) => !c.name).length,
    catalogueVersion: GT7_OFFICIAL_CATALOGUE_VERSION,
    sourceVersion: GT7_OFFICIAL_SOURCE_VERSION,
  };
}
