import {
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
  getWheelBaseOption,
} from "../data/wheelBases.js";
import { STARTER_WHEEL_SETUPS } from "../data/wheelSetups.js";
import { NO_EXACT_SETUP_MESSAGE } from "../data/wheelSetupsMeta.js";

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
  const fields = getTemplateFieldsForWheelBase(setup.wheelBase);

  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    value: setup.values[field.key] ?? "—",
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
