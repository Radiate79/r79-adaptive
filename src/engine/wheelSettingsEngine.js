import {
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
  getWheelBaseOption,
  WHEEL_BASE_OPTIONS,
} from "../data/wheelBases.js";
import {
  STARTER_WHEEL_SETUPS,
  WHEEL_SETUP_POOL,
} from "../data/wheelSetups.js";
import { NO_EXACT_SETUP_MESSAGE } from "../data/wheelSetupsMeta.js";
import { getT598FieldMeta } from "../data/t598FieldHelp.js";
import { getCarsForGame, getTrackDisplayName, getTracksForGame } from "../utils/gameData.js";

/**
 * @typedef {Object} WheelSetupFilters
 * @property {string} [gameVersion]
 * @property {string} [wheelBase]
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {string} [tyreCompound]
 * @property {boolean} [bopOn]
 */

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 * @param {WheelSetupFilters} filters
 * @param {{ exactTyres?: boolean, exactBop?: boolean }} [options]
 */
function matchesSetup(setup, filters, options = {}) {
  const { exactTyres = true, exactBop = true } = options;

  if (filters.gameVersion && setup.gameVersion !== filters.gameVersion) {
    return false;
  }

  if (filters.wheelBase && setup.wheelBase !== filters.wheelBase) {
    return false;
  }

  if (filters.carId && setup.carId !== filters.carId) {
    return false;
  }

  if (filters.trackId && setup.trackId !== filters.trackId) {
    return false;
  }

  if (
    exactTyres &&
    filters.tyreCompound &&
    setup.tyreCompound !== filters.tyreCompound
  ) {
    return false;
  }

  if (exactBop && filters.bopOn !== undefined && setup.bopOn !== filters.bopOn) {
    return false;
  }

  return true;
}

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 * @param {string} [gameVersion]
 */
function getSetupSearchText(setup, gameVersion = setup.gameVersion) {
  const car =
    getCarsForGame(gameVersion).find((entry) => entry.id === setup.carId)?.name ??
    setup.carId;
  const trackRecord = getTracksForGame(gameVersion).find(
    (entry) => entry.id === setup.trackId,
  );
  const track = trackRecord ? getTrackDisplayName(trackRecord) : setup.trackId;
  const wheel =
    WHEEL_BASE_OPTIONS.find((entry) => entry.id === setup.wheelBase)?.label ??
    setup.wheelBase;

  return [setup.label, car, track, wheel, setup.tyreCompound, setup.gameVersion]
    .join(" ")
    .toLowerCase();
}

/**
 * @param {WheelSetupFilters} filters
 * @param {(setup: import("../data/wheelSetups.js").WheelSetupRecord) => boolean} predicate
 */
function findInPool(filters, predicate) {
  return WHEEL_SETUP_POOL.find((setup) => predicate(setup) && matchesSetup(setup, filters));
}

/**
 * @param {WheelSetupFilters} filters
 * @param {(setup: import("../data/wheelSetups.js").WheelSetupRecord) => boolean} predicate
 * @param {{ exactTyres?: boolean, exactBop?: boolean }} [options]
 */
function findSimilarInPool(filters, predicate, options) {
  return WHEEL_SETUP_POOL.find(
    (setup) => predicate(setup) && matchesSetup(setup, filters, options),
  );
}

/** @returns {import("../data/wheelSetups.js").WheelSetupRecord[]} */
export function listWheelSetups(gameVersion) {
  const pool = Array.isArray(STARTER_WHEEL_SETUPS) ? STARTER_WHEEL_SETUPS : [];

  if (!gameVersion) {
    return [...pool];
  }

  return pool.filter((setup) => setup?.gameVersion === gameVersion);
}

/**
 * @param {string} query
 * @param {string} [gameVersion]
 */
export function searchWheelSetups(query, gameVersion) {
  const normalized = String(query ?? "").trim().toLowerCase();
  const pool = listWheelSetups(gameVersion);

  if (!normalized) {
    return pool;
  }

  return pool.filter((setup) =>
    getSetupSearchText(setup, gameVersion).includes(normalized),
  );
}

/**
 * @param {WheelSetupFilters} filters
 */
export function findWheelSetup(filters) {
  const exact = findInPool(filters, () => true);

  if (exact) {
    return {
      matchType: exact.isValidated ? "validated" : "exact",
      setup: exact,
      message: exact.isValidated
        ? null
        : null,
    };
  }

  const similar = findSimilarInPool(filters, () => true, {
    exactTyres: false,
    exactBop: false,
  });

  if (similar) {
    return {
      matchType: similar.isValidated ? "validatedSimilar" : "similar",
      setup: similar,
      message: "Showing closest match — tyre compound or BOP may differ.",
    };
  }

  const carTrack = WHEEL_SETUP_POOL.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.carId === filters.carId &&
      setup.trackId === filters.trackId,
  );

  if (carTrack) {
    return {
      matchType: carTrack.isValidated ? "validatedCarTrack" : "carTrack",
      setup: carTrack,
      message: "Showing closest car/track match for a different wheel base.",
    };
  }

  const carOnly = WHEEL_SETUP_POOL.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase &&
      setup.carId === filters.carId,
  );

  if (carOnly) {
    return {
      matchType: carOnly.isValidated ? "validatedCarOnly" : "carOnly",
      setup: carOnly,
      message: carOnly.isValidated
        ? null
        : "Showing starter profile for this car on a different track.",
    };
  }

  const selectedCar = getCarsForGame(filters.gameVersion).find(
    (car) => car.id === filters.carId,
  );
  const carClass = selectedCar?.class;

  if (carClass && filters.wheelBase) {
    const classStarter = WHEEL_SETUP_POOL.find((setup) => {
      if (
        setup.gameVersion !== filters.gameVersion ||
        setup.wheelBase !== filters.wheelBase ||
        (!setup.isStarter && !setup.isValidated)
      ) {
        return false;
      }

      const setupCar = getCarsForGame(filters.gameVersion).find(
        (car) => car.id === setup.carId,
      );
      return setupCar?.class === carClass;
    });

    if (classStarter) {
      return {
        matchType: classStarter.isValidated ? "validatedClass" : "classStarter",
        setup: classStarter,
        message: classStarter.isValidated
          ? null
          : `Showing ${carClass} starter profile — refine per car after testing.`,
      };
    }
  }

  const wheelOnly = WHEEL_SETUP_POOL.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase,
  );

  if (wheelOnly) {
    return {
      matchType: wheelOnly.isValidated ? "validatedWheelOnly" : "wheelOnly",
      setup: wheelOnly,
      message: "Showing starter reference for this wheel base only.",
    };
  }

  return {
    matchType: "none",
    setup: null,
    message: NO_EXACT_SETUP_MESSAGE,
  };
}

/**
 * Used by AI Race Engineer — any setup for recommended car + track.
 *
 * @param {WheelSetupFilters} filters
 */
export function findWheelSetupForRaceEngineer(filters) {
  if (!filters.carId || !filters.trackId) {
    return null;
  }

  const exact = WHEEL_SETUP_POOL.find((setup) => matchesSetup(setup, filters));
  if (exact) {
    return { setup: exact, matchType: exact.isValidated ? "validated" : "exact" };
  }

  const similar = WHEEL_SETUP_POOL.find((setup) =>
    matchesSetup(setup, filters, { exactTyres: false, exactBop: false }),
  );

  if (similar) {
    return {
      setup: similar,
      matchType: similar.isValidated ? "validatedSimilar" : "similar",
    };
  }

  const carTrack = WHEEL_SETUP_POOL.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.carId === filters.carId &&
      setup.trackId === filters.trackId,
  );

  if (carTrack) {
    return {
      setup: carTrack,
      matchType: carTrack.isValidated ? "validatedCarTrack" : "carTrack",
    };
  }

  return null;
}

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 */
export function formatWheelSetupValues(setup) {
  if (!setup) {
    return [];
  }

  const templateFamily = getTemplateFamilyForWheelBase(setup.wheelBase ?? "");
  const fields = getTemplateFieldsForWheelBase(setup.wheelBase ?? "");
  const values = setup.values ?? {};
  const carClass = getCarsForGame(setup.gameVersion).find(
    (car) => car.id === setup.carId,
  )?.class;

  const rows = fields.map((field) => {
    const value = values[field.key] ?? "—";

    if (templateFamily === "t598") {
      const meta = getT598FieldMeta(field.key, value, carClass);
      return {
        key: field.key,
        label: meta.label,
        value: meta.value,
        description: meta.description,
        reason: meta.reason,
      };
    }

    return {
      key: field.key,
      label: field.label,
      value,
      description: "",
      reason: value !== "—" ? `Recommended value: ${value}` : "",
    };
  });

  const knownKeys = new Set(fields.map((field) => field.key));
  for (const [key, value] of Object.entries(values)) {
    if (knownKeys.has(key) || value == null || value === "") {
      continue;
    }

    if (templateFamily === "t598") {
      const meta = getT598FieldMeta(key, value, carClass);
      rows.push({
        key,
        label: meta.label,
        value: meta.value,
        description: meta.description,
        reason: meta.reason,
      });
      continue;
    }

    rows.push({
      key,
      label: key,
      value,
      description: "",
      reason: `Recommended value: ${value}`,
    });
  }

  return rows;
}

/**
 * @param {string} wheelBaseId
 */
export function getWheelSetupTemplateMeta(wheelBaseId) {
  const option = getWheelBaseOption(wheelBaseId);
  return {
    wheelBaseId,
    wheelBaseLabel: option?.label ?? wheelBaseId,
    templateFamily: getTemplateFamilyForWheelBase(wheelBaseId),
    fields: getTemplateFieldsForWheelBase(wheelBaseId),
  };
}
