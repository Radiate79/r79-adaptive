import {
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
  getWheelBaseOption,
  WHEEL_BASE_OPTIONS,
} from "../data/wheelBases.js";
import { STARTER_WHEEL_SETUPS } from "../data/wheelSetups.js";
import { NO_EXACT_SETUP_MESSAGE } from "../data/wheelSetupsMeta.js";
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
  const exact = STARTER_WHEEL_SETUPS.find((setup) => matchesSetup(setup, filters));

  if (exact) {
    return {
      matchType: "exact",
      setup: exact,
      message: null,
    };
  }

  const similar = STARTER_WHEEL_SETUPS.find((setup) =>
    matchesSetup(setup, filters, { exactTyres: false, exactBop: false }),
  );

  if (similar) {
    return {
      matchType: "similar",
      setup: similar,
      message: "Showing closest match — tyre compound or BOP may differ.",
    };
  }

  const carTrack = STARTER_WHEEL_SETUPS.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.carId === filters.carId &&
      setup.trackId === filters.trackId,
  );

  if (carTrack) {
    return {
      matchType: "carTrack",
      setup: carTrack,
      message: "Showing closest car/track match for a different wheel base.",
    };
  }

  const carOnly = STARTER_WHEEL_SETUPS.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase &&
      setup.carId === filters.carId,
  );

  if (carOnly) {
    return {
      matchType: "carOnly",
      setup: carOnly,
      message: "Showing starter profile for this car on a different track.",
    };
  }

  const selectedCar = getCarsForGame(filters.gameVersion).find(
    (car) => car.id === filters.carId,
  );
  const carClass = selectedCar?.class;

  if (carClass && filters.wheelBase) {
    const classStarter = STARTER_WHEEL_SETUPS.find((setup) => {
      if (
        setup.gameVersion !== filters.gameVersion ||
        setup.wheelBase !== filters.wheelBase ||
        !setup.isStarter
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
        matchType: "classStarter",
        setup: classStarter,
        message: `Showing ${carClass} starter profile — refine per car after testing.`,
      };
    }
  }

  const wheelOnly = STARTER_WHEEL_SETUPS.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase,
  );

  if (wheelOnly) {
    return {
      matchType: "wheelOnly",
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

  const exact = STARTER_WHEEL_SETUPS.find((setup) => matchesSetup(setup, filters));
  if (exact) {
    return { setup: exact, matchType: "exact" };
  }

  const similar = STARTER_WHEEL_SETUPS.find((setup) =>
    matchesSetup(setup, filters, { exactTyres: false, exactBop: false }),
  );

  if (similar) {
    return { setup: similar, matchType: "similar" };
  }

  const carTrack = STARTER_WHEEL_SETUPS.find(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.carId === filters.carId &&
      setup.trackId === filters.trackId,
  );

  if (carTrack) {
    return { setup: carTrack, matchType: "carTrack" };
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

  const fields = getTemplateFieldsForWheelBase(setup.wheelBase ?? "");
  const values = setup.values ?? {};

  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    value: values[field.key] ?? "—",
  }));
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
