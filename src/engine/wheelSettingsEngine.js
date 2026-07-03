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
import {
  getWheelFieldMeta,
  isInvalidWheelReason,
} from "../data/wheelFieldHelp.js";
import { getCarsForGame, getTrackDisplayName, getTracksForGame } from "../utils/gameData.js";
import { buildPodiumRecommendation, isPodiumInputComplete } from "./podiumEngine.js";

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
      setup.trackId === filters.trackId &&
      setup.wheelBase === filters.wheelBase,
  );

  if (carTrack) {
    return {
      matchType: carTrack.isValidated ? "validatedCarTrack" : "carTrack",
      setup: carTrack,
      message: null,
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

  const selectedFamily = getTemplateFamilyForWheelBase(filters.wheelBase ?? "");
  const familyReference = WHEEL_SETUP_POOL.find((setup) => {
    if (setup.gameVersion !== filters.gameVersion) {
      return false;
    }

    if (getTemplateFamilyForWheelBase(setup.wheelBase) !== selectedFamily) {
      return false;
    }

    return selectedFamily !== "other" || setup.wheelBase === filters.wheelBase;
  });

  if (familyReference) {
    return {
      matchType: familyReference.isValidated ? "validatedWheelFamily" : "wheelFamily",
      setup: familyReference,
      message: `Showing closest ${getWheelBaseOption(filters.wheelBase)?.label ?? "wheel"} reference profile.`,
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
      setup.trackId === filters.trackId &&
      setup.wheelBase === filters.wheelBase,
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
 * @typedef {import("./podiumEngine.js").PodiumEngineInput} PodiumEngineInput
 * @typedef {import("./podiumEngine.js").PodiumRecommendation} PodiumRecommendation
 */

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 * @param {PodiumEngineInput} [podiumInput]
 * @returns {{ rows: ReturnType<typeof formatWheelSetupValues> extends Array<infer T> ? T[] : never, podium: PodiumRecommendation | null }}
 */
export function buildWheelSetupPresentation(setup, podiumInput) {
  const templateWheelBaseId = podiumInput?.wheelBase ?? setup?.wheelBase;

  if (!setup || !podiumInput || !isPodiumInputComplete(podiumInput)) {
    return {
      rows: setup
        ? formatWheelSetupValues(setup, { templateWheelBaseId })
        : [],
      podium: null,
    };
  }

  const podium = buildPodiumRecommendation({
    ...podiumInput,
    gameVersion: podiumInput.gameVersion ?? setup.gameVersion,
    wheelBase: podiumInput.wheelBase ?? setup.wheelBase,
    baseValues: setup.values ?? {},
    carClass: getCarsForGame(setup.gameVersion).find(
      (car) => car.id === setup.carId,
    )?.class,
  });

  const rows = formatWheelSetupValues(setup, {
    templateWheelBaseId: podiumInput.wheelBase ?? setup.wheelBase,
    valueOverrides: podium?.adjustedValues,
    fieldReasons: podium?.fieldReasons ?? {},
    podiumContext: {
      contextLines: podium?.contextLines ?? [],
      narrative: podium?.narrative ?? "",
    },
  });

  return { rows, podium };
}

/**
 * @param {string} fieldKey
 * @param {string} label
 * @param {string | number} value
 * @param {string} [carClass]
 */
function resolveWheelFieldReason(fieldKey, label, value, carClass, preferredReason = "") {
  if (preferredReason && !isInvalidWheelReason(preferredReason, label, value)) {
    return preferredReason;
  }

  const meta = getWheelFieldMeta(fieldKey, label, value, carClass);
  if (meta.reason && !isInvalidWheelReason(meta.reason, label, value)) {
    return meta.reason;
  }

  const displayValue = value == null || value === "" ? "—" : String(value);
  if (displayValue === "—") {
    return "";
  }

  return `${label} is tuned to ${displayValue} for this wheel base and race conditions.`;
}

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 * @param {{
 *   templateWheelBaseId?: string,
 *   valueOverrides?: Record<string, string | number>,
 *   fieldReasons?: Record<string, string>,
 *   podiumContext?: { contextLines: string[], narrative: string },
 * }} [options]
 */
export function formatWheelSetupValues(setup, options = {}) {
  if (!setup) {
    return [];
  }

  const templateWheelBaseId = options.templateWheelBaseId ?? setup.wheelBase ?? "";
  const templateFamily = getTemplateFamilyForWheelBase(templateWheelBaseId);
  const fields = getTemplateFieldsForWheelBase(templateWheelBaseId);
  const baseValues = setup.values ?? {};
  const values = { ...baseValues, ...(options.valueOverrides ?? {}) };
  const fieldReasons = options.fieldReasons ?? {};
  const podiumContext = options.podiumContext ?? null;
  const carClass = getCarsForGame(setup.gameVersion).find(
    (car) => car.id === setup.carId,
  )?.class;

  const buildRowMeta = (
    fieldKey,
    label,
    value,
    description = "",
    baseReason = "",
  ) => {
    const baseValue = baseValues[fieldKey];
    const wasAdjusted =
      baseValue != null && String(baseValue) !== String(value);
    const reason = resolveWheelFieldReason(
      fieldKey,
      label,
      value,
      carClass,
      baseReason,
    );
    const podiumReason = wasAdjusted ? fieldReasons[fieldKey] ?? "" : "";

    return {
      key: fieldKey,
      label,
      value,
      description,
      reason,
      podiumReason,
      adjusted: wasAdjusted,
      contextLines: podiumContext?.contextLines ?? [],
      narrative: podiumContext?.narrative ?? "",
    };
  };

  const rows = fields.map((field) => {
    const value = values[field.key] ?? "—";

    if (templateFamily === "t598") {
      const meta = getT598FieldMeta(field.key, value, carClass);
      return buildRowMeta(
        field.key,
        meta.label,
        meta.value,
        meta.description,
        meta.reason,
      );
    }

    const meta = getWheelFieldMeta(field.key, field.label, value, carClass);
    return buildRowMeta(
      field.key,
      meta.label,
      meta.value,
      meta.description,
      meta.reason,
    );
  });

  const knownKeys = new Set(fields.map((field) => field.key));
  for (const [key, value] of Object.entries(values)) {
    if (knownKeys.has(key) || value == null || value === "") {
      continue;
    }

    if (templateFamily === "t598") {
      const meta = getT598FieldMeta(key, value, carClass);
      rows.push(
        buildRowMeta(key, meta.label, meta.value, meta.description, meta.reason),
      );
      continue;
    }

    const meta = getWheelFieldMeta(key, key, value, carClass);
    rows.push(buildRowMeta(key, meta.label, meta.value, meta.description, meta.reason));
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
