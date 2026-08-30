import {
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
  getWheelBaseOption,
  WHEEL_BASE_OPTIONS,
} from "../data/wheelBases.js";
import {
  STARTER_WHEEL_SETUPS,
  WHEEL_SETUP_POOL,
  buildCarClassStarter,
} from "../data/wheelSetups.js";
import { NO_EXACT_SETUP_MESSAGE } from "../data/wheelSetupsMeta.js";
import { getT598FieldMeta } from "../data/t598FieldHelp.js";
import {
  getWheelFieldMeta,
  isInvalidWheelReason,
} from "../data/wheelFieldHelp.js";
import { getCarsForGame, getTrackDisplayName, getTracksForGame } from "../utils/gameData.js";
import {
  getWheelHistoricalCaveat,
  normalizeWheelSetupPhysics,
  pickBestPhysicsAwareSetup,
} from "../utils/physicsData.js";
import {
  formatWheelPlatformStatus,
  normalizeWheelPlatformMeta,
  resolveDualValidationState,
} from "../data/wheelPlatformVersion.js";
import { buildPodiumRecommendation, isPodiumInputComplete } from "./podiumEngine.js";
import { sanitizeWheelFieldValue } from "./wheelSchemaValidation.js";
import {
  resolveRecommendationConfidence,
  valuesLookEmpty,
} from "./recommendationConfidence.js";
import {
  buildRecommendationCacheKey,
  getCachedRecommendation,
} from "./recommendationCache.js";
import {
  ACTIVE_T598_FIRMWARE,
  SETUP_ANCHOR_WEIGHTS,
  WHEEL_SETTINGS_ENGINE_VERSION,
  WHEEL_SETTINGS_PLATFORM_BASELINE,
} from "../data/wheelSettingsConfig.js";
import { resolveCarDynamicsProfile } from "./carDynamicsProfile.js";
import { resolveTrackDynamicsProfile } from "./trackDynamicsProfile.js";
import { calculateT598WheelSettings } from "./wheelT598Calculator.js";

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
  const matches = WHEEL_SETUP_POOL.filter(
    (setup) => predicate(setup) && matchesSetup(setup, filters),
  );
  return /** @type {import("../data/wheelSetups.js").WheelSetupRecord | null} */ (
    pickBestPhysicsAwareSetup(matches)
  );
}

/**
 * @param {WheelSetupFilters} filters
 * @param {(setup: import("../data/wheelSetups.js").WheelSetupRecord) => boolean} predicate
 * @param {{ exactTyres?: boolean, exactBop?: boolean }} [options]
 */
function findSimilarInPool(filters, predicate, options) {
  const matches = WHEEL_SETUP_POOL.filter(
    (setup) => predicate(setup) && matchesSetup(setup, filters, options),
  );
  return /** @type {import("../data/wheelSetups.js").WheelSetupRecord | null} */ (
    pickBestPhysicsAwareSetup(matches)
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
 * @param {object} result
 */
function enrichLookupConfidence(filters, result) {
  const setup = result.setup;
  const physicsMeta = result.physicsMeta ?? (setup ? normalizeWheelSetupPhysics(setup) : null);
  const platformMeta =
    result.platformMeta ??
    normalizeWheelPlatformMeta(filters.wheelBase ?? setup?.wheelBase, setup ?? undefined);
  const confidence = resolveRecommendationConfidence({
    matchType: result.matchType,
    isValidated: Boolean(setup?.isValidated),
    hasEmptyValues: valuesLookEmpty(setup?.values),
    podiumAdjusted: false,
    physicsHistorical: Boolean(
      physicsMeta?.dataStatus === "HISTORICAL" ||
        physicsMeta?.validationStatus === "historical" ||
        result.physicsCaveat,
    ),
    platformValidationState: platformMeta?.validationStatus,
    dualBothValidated: Boolean(result.dualValidation?.bothValidated),
  });

  return {
    ...result,
    physicsMeta,
    platformMeta,
    confidence: confidence.confidence,
    confidenceLabel: confidence.label,
    confidenceNote: confidence.note,
  };
}

/**
 * @param {WheelSetupFilters} filters
 */
function findWheelSetupUncached(filters) {
  const exact = findInPool(filters, () => true);

  if (exact) {
    const platformMeta = normalizeWheelPlatformMeta(filters.wheelBase ?? exact.wheelBase, exact);
    return enrichLookupConfidence(filters, {
      matchType: exact.isValidated ? "validated" : "exact",
      setup: exact,
      physicsMeta: normalizeWheelSetupPhysics(exact),
      platformMeta,
      dualValidation: resolveDualValidationState({
        ...exact,
        wheelBaseId: filters.wheelBase ?? exact.wheelBase,
        physicsGeneration: normalizeWheelSetupPhysics(exact).physicsGeneration,
      }),
      physicsCaveat: getWheelHistoricalCaveat(exact),
      message: null,
    });
  }

  const similar = findSimilarInPool(filters, () => true, {
    exactTyres: false,
    exactBop: false,
  });

  if (similar) {
    return enrichLookupConfidence(filters, {
      matchType: similar.isValidated ? "validatedSimilar" : "similar",
      setup: similar,
      physicsMeta: normalizeWheelSetupPhysics(similar),
      physicsCaveat: getWheelHistoricalCaveat(similar),
      message: "Showing closest match — tyre compound or BOP may differ.",
    });
  }

  const carTrackMatches = WHEEL_SETUP_POOL.filter(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.carId === filters.carId &&
      setup.trackId === filters.trackId &&
      setup.wheelBase === filters.wheelBase,
  );
  const carTrack = pickBestPhysicsAwareSetup(carTrackMatches);

  if (carTrack) {
    return enrichLookupConfidence(filters, {
      matchType: carTrack.isValidated ? "validatedCarTrack" : "carTrack",
      setup: carTrack,
      physicsMeta: normalizeWheelSetupPhysics(carTrack),
      physicsCaveat: getWheelHistoricalCaveat(carTrack),
      message: null,
    });
  }

  const carOnlyMatches = WHEEL_SETUP_POOL.filter(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase &&
      setup.carId === filters.carId,
  );
  const carOnly = pickBestPhysicsAwareSetup(carOnlyMatches);

  if (carOnly) {
    return enrichLookupConfidence(filters, {
      matchType: carOnly.isValidated ? "validatedCarOnly" : "carOnly",
      setup: carOnly,
      physicsMeta: normalizeWheelSetupPhysics(carOnly),
      physicsCaveat: getWheelHistoricalCaveat(carOnly),
      message: carOnly.isValidated
        ? null
        : "Showing starter profile for this car on a different track.",
    });
  }

  const selectedCar = getCarsForGame(filters.gameVersion).find(
    (car) => car.id === filters.carId,
  );
  const carClass = selectedCar?.class;

  if (carClass && filters.wheelBase && filters.carId) {
    const synthesized = buildCarClassStarter(
      filters.carId,
      /** @type {"Gr.1" | "Gr.2" | "Gr.3" | "Gr.4"} */ (carClass),
      filters.trackId,
      filters.wheelBase,
    );

    return enrichLookupConfidence(filters, {
      matchType: "classStarter",
      setup: synthesized,
      physicsMeta: normalizeWheelSetupPhysics(synthesized),
      physicsCaveat: null,
      message: `Showing ${carClass} starter profile — refine per car after testing.`,
    });
  }

  const wheelOnlyMatches = WHEEL_SETUP_POOL.filter(
    (setup) =>
      setup.gameVersion === filters.gameVersion &&
      setup.wheelBase === filters.wheelBase,
  );
  const wheelOnly = pickBestPhysicsAwareSetup(wheelOnlyMatches);

  if (wheelOnly) {
    return enrichLookupConfidence(filters, {
      matchType: wheelOnly.isValidated ? "validatedWheelOnly" : "wheelOnly",
      setup: wheelOnly,
      physicsMeta: normalizeWheelSetupPhysics(wheelOnly),
      physicsCaveat: getWheelHistoricalCaveat(wheelOnly),
      message: "Showing starter reference for this wheel base only.",
    });
  }

  const selectedFamily = getTemplateFamilyForWheelBase(filters.wheelBase ?? "");
  const familyMatches = WHEEL_SETUP_POOL.filter((setup) => {
    if (setup.gameVersion !== filters.gameVersion) {
      return false;
    }

    if (getTemplateFamilyForWheelBase(setup.wheelBase) !== selectedFamily) {
      return false;
    }

    return selectedFamily !== "other" || setup.wheelBase === filters.wheelBase;
  });
  const familyReference = pickBestPhysicsAwareSetup(familyMatches);

  if (familyReference) {
    return enrichLookupConfidence(filters, {
      matchType: familyReference.isValidated ? "validatedWheelFamily" : "wheelFamily",
      setup: familyReference,
      physicsMeta: normalizeWheelSetupPhysics(familyReference),
      physicsCaveat: getWheelHistoricalCaveat(familyReference),
      message: `Showing closest ${getWheelBaseOption(filters.wheelBase)?.label ?? "wheel"} reference profile.`,
    });
  }

  return enrichLookupConfidence(filters, {
    matchType: "none",
    setup: null,
    physicsMeta: null,
    physicsCaveat: null,
    message: NO_EXACT_SETUP_MESSAGE,
  });
}

/**
 * @param {WheelSetupFilters} filters
 */
export function findWheelSetup(filters) {
  const key = buildRecommendationCacheKey("findWheelSetup", filters);
  return getCachedRecommendation(key, () => findWheelSetupUncached(filters));
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
 * @typedef {WheelSetupFilters & {
 *   fuelMultiplier?: number,
 *   tyreMultiplier?: number,
 *   lapCount?: number,
 * }} WheelSettingsInput
 */

/**
 * Authoritative Wheel Settings calculation — single entry point for UI and tests.
 *
 * @param {WheelSettingsInput} input
 */
export function calculateWheelSettings(input) {
  const cacheKey = buildRecommendationCacheKey("wheelSettings", {
    wheelSettingsEngineVersion: WHEEL_SETTINGS_ENGINE_VERSION,
    gt7Version: WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion,
    physicsGeneration: WHEEL_SETTINGS_PLATFORM_BASELINE.physicsGeneration,
    t598Firmware: ACTIVE_T598_FIRMWARE,
    gameVersion: input.gameVersion,
    wheelBase: input.wheelBase,
    carId: input.carId,
    trackId: input.trackId,
    tyreCompound: input.tyreCompound,
    bopOn: input.bopOn,
    fuelMultiplier: input.fuelMultiplier,
    tyreMultiplier: input.tyreMultiplier,
    lapCount: input.lapCount,
  });

  return getCachedRecommendation(cacheKey, () => calculateWheelSettingsUncached(input));
}

/**
 * @param {WheelSettingsInput} input
 */
function calculateWheelSettingsUncached(input) {
  const gameVersion = input.gameVersion ?? "gt7";
  const wheelBase = input.wheelBase ?? "";
  const carId = input.carId ?? "";

  const lookup = findWheelSetupUncached({
    gameVersion,
    wheelBase,
    carId,
    trackId: input.trackId,
    tyreCompound: input.tyreCompound,
    bopOn: input.bopOn,
  });

  const selectedCarId = carId || lookup.setup?.carId || "";
  const carProfile = resolveCarDynamicsProfile({
    carId: selectedCarId,
    gameVersion,
    bopOn: input.bopOn,
  });
  const trackProfile = resolveTrackDynamicsProfile({
    trackId: input.trackId,
    gameVersion,
    car: carProfile.car,
  });

  const templateFamily = getTemplateFamilyForWheelBase(wheelBase);
  const anchorValues = lookup.setup?.values ?? {};
  const anchorWeight = SETUP_ANCHOR_WEIGHTS[lookup.matchType] ?? 0;

  let modelValues = { ...anchorValues };
  /** @type {ReturnType<typeof calculateT598WheelSettings> | null} */
  let calculationBreakdown = null;

  if (templateFamily === "t598") {
    calculationBreakdown = calculateT598WheelSettings(anchorValues, {
      carProfile,
      trackProfile,
      tyreCompound: input.tyreCompound,
      lapCount: input.lapCount,
      tyreMultiplier: input.tyreMultiplier,
      fuelMultiplier: input.fuelMultiplier,
      anchorWeight,
      wheelBaseId: wheelBase,
    });
    modelValues = calculationBreakdown.values;
  }

  const setupForDisplay = {
    ...(lookup.setup ?? {
      id: `synthesized_${selectedCarId}_${input.trackId ?? "unknown"}`,
      label: "Calculated profile",
      isStarter: true,
      gameVersion,
      wheelBase,
      carId: selectedCarId,
      trackId: input.trackId ?? "",
      tyreCompound: input.tyreCompound ?? "M",
      bopOn: input.bopOn ?? true,
      values: modelValues,
    }),
    carId: selectedCarId,
    values: modelValues,
  };

  const podiumInput = {
    gameVersion,
    wheelBase,
    carId: selectedCarId,
    trackId: input.trackId,
    tyreCompound: input.tyreCompound,
    bopOn: input.bopOn,
    fuelMultiplier: input.fuelMultiplier,
    tyreMultiplier: input.tyreMultiplier,
    lapCount: input.lapCount,
  };

  /** @type {import("./podiumEngine.js").PodiumRecommendation | null} */
  let podium = null;
  const modelFieldReasons = calculationBreakdown?.fieldReasons ?? {};
  let fieldReasons = { ...modelFieldReasons };

  if (isPodiumInputComplete(podiumInput)) {
    podium = buildPodiumRecommendation({
      ...podiumInput,
      physicsGeneration:
        normalizeWheelSetupPhysics(lookup.setup ?? {}).physicsGeneration,
      baseValues: modelValues,
      carClass: carProfile.className,
    });

    fieldReasons = {
      ...modelFieldReasons,
      ...(podium?.fieldReasons ?? {}),
    };
  }

  const rows = formatWheelSetupValues(setupForDisplay, {
    templateWheelBaseId: wheelBase,
    carId: selectedCarId,
    valueOverrides: podium?.adjustedValues,
    fieldReasons,
    podiumContext: podium
      ? {
          contextLines: podium.contextLines ?? [],
          narrative: podium.narrative ?? "",
        }
      : null,
  });

  const platformMeta = normalizeWheelPlatformMeta(wheelBase, lookup.setup ?? undefined);
  const physicsMeta = lookup.setup
    ? normalizeWheelSetupPhysics(lookup.setup)
    : null;
  const confidence = resolveRecommendationConfidence({
    matchType: lookup.matchType,
    isValidated: Boolean(lookup.setup?.isValidated),
    hasEmptyValues: valuesLookEmpty(podium?.adjustedValues ?? modelValues),
    podiumAdjusted: Boolean(podium?.adjustments?.length),
    physicsHistorical: Boolean(
      physicsMeta?.dataStatus === "HISTORICAL" ||
        physicsMeta?.validationStatus === "historical" ||
        lookup.physicsCaveat,
    ),
    platformValidationState: platformMeta?.validationStatus,
    dualBothValidated: Boolean(lookup.dualValidation?.bothValidated),
  });

  return {
    lookup,
    rows,
    podium,
    confidence,
    settings: podium?.adjustedValues ?? modelValues,
    reasons: fieldReasons,
    provenance: {
      carProfile: carProfile.provenance,
      carCompleteness: carProfile.completeness,
      trackCompleteness: trackProfile.completeness,
      anchorMatchType: lookup.matchType,
      anchorWeight,
      engineVersion: WHEEL_SETTINGS_ENGINE_VERSION,
      gt7Version: WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion,
      t598Firmware: ACTIVE_T598_FIRMWARE,
    },
    calculationBreakdown,
    cacheKey: buildRecommendationCacheKey("wheelSettings", {
      wheelSettingsEngineVersion: WHEEL_SETTINGS_ENGINE_VERSION,
      gt7Version: WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion,
      physicsGeneration: WHEEL_SETTINGS_PLATFORM_BASELINE.physicsGeneration,
      t598Firmware: ACTIVE_T598_FIRMWARE,
      gameVersion: input.gameVersion,
      wheelBase: input.wheelBase,
      carId: input.carId,
      trackId: input.trackId,
      tyreCompound: input.tyreCompound,
      bopOn: input.bopOn,
      fuelMultiplier: input.fuelMultiplier,
      tyreMultiplier: input.tyreMultiplier,
      lapCount: input.lapCount,
    }),
  };
}

/**
 * @param {import("../data/wheelSetups.js").WheelSetupRecord} setup
 * @param {PodiumEngineInput} [podiumInput]
 * @returns {{ rows: ReturnType<typeof formatWheelSetupValues> extends Array<infer T> ? T[] : never, podium: PodiumRecommendation | null, confidence?: ReturnType<typeof resolveRecommendationConfidence> | null }}
 */
export function buildWheelSetupPresentation(setup, podiumInput) {
  if (!setup) {
    return { rows: [], podium: null, confidence: null };
  }

  return calculateWheelSettingsUncached({
    gameVersion: podiumInput?.gameVersion ?? setup.gameVersion,
    wheelBase: podiumInput?.wheelBase ?? setup.wheelBase,
    carId: podiumInput?.carId ?? setup.carId,
    trackId: podiumInput?.trackId ?? setup.trackId,
    tyreCompound: podiumInput?.tyreCompound ?? setup.tyreCompound,
    bopOn: podiumInput?.bopOn ?? setup.bopOn,
    fuelMultiplier: podiumInput?.fuelMultiplier,
    tyreMultiplier: podiumInput?.tyreMultiplier,
    lapCount: podiumInput?.lapCount,
  });
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
  const resolvedCarId = options.carId ?? setup.carId;
  const carClass = getCarsForGame(setup.gameVersion).find(
    (car) => car.id === resolvedCarId,
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
      fieldReasons[fieldKey] || baseReason,
    );
    const podiumReason =
      wasAdjusted && fieldReasons[fieldKey] && fieldReasons[fieldKey] !== reason
        ? fieldReasons[fieldKey]
        : wasAdjusted
          ? fieldReasons[fieldKey] ?? ""
          : "";

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
    const rawValue =
      values[field.key] == null || values[field.key] === ""
        ? "—"
        : values[field.key];
    const value = sanitizeWheelFieldValue(
      templateFamily,
      field.key,
      rawValue,
    );

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

  return rows;
}

/**
 * @param {string} wheelBaseId
 */
export function getWheelSetupTemplateMeta(wheelBaseId) {
  const option = getWheelBaseOption(wheelBaseId);
  const platform = normalizeWheelPlatformMeta(wheelBaseId);
  const status = formatWheelPlatformStatus(wheelBaseId);
  return {
    wheelBaseId,
    wheelBaseLabel: option?.label ?? wheelBaseId,
    templateFamily: getTemplateFamilyForWheelBase(wheelBaseId),
    fields: getTemplateFieldsForWheelBase(wheelBaseId),
    platform,
    statusSummary: status.summary,
  };
}
