import { normalizeRaceMultiplier } from "../utils/raceConditions.js";
import { ALR_CURRENT_TYRE_WEAR_MULTIPLIER } from "./alr/leagueRules.js";

export const RACE_CONDITION_PRESET_CUSTOM_ID = "custom";

/** @typedef {Object} RaceConditionPreset
 * @property {string} id
 * @property {string} label
 * @property {number} fuelMultiplier
 * @property {number} tyreMultiplier
 * @property {number} [defaultLaps]
 * @property {string} [description]
 * @property {boolean} [alrLeagueRule]
 */

/** @type {Record<string, string>} */
const LEGACY_FORMAT_ALIASES = {
  // Historical alias pointed at x5 Full Race. Current ALR uses x4 league rule.
  alr_full_race: "alr_full_race",
};

/** @type {RaceConditionPreset[]} */
export const RACE_FORMATS = [
  {
    id: RACE_CONDITION_PRESET_CUSTOM_ID,
    label: "Custom",
    fuelMultiplier: 0,
    tyreMultiplier: 0,
    defaultLaps: 20,
  },
  {
    id: "qualifying",
    label: "Qualifying",
    fuelMultiplier: 1,
    tyreMultiplier: 1,
    defaultLaps: 3,
    description: "Short session — minimal wear",
  },
  {
    id: "sprint",
    label: "Sprint",
    fuelMultiplier: 2,
    tyreMultiplier: 2,
    defaultLaps: 10,
    description: "Short race — moderate wear",
  },
  {
    id: "alr_full_race",
    label: "ALR Full Race",
    fuelMultiplier: 3,
    tyreMultiplier: ALR_CURRENT_TYRE_WEAR_MULTIPLIER,
    defaultLaps: 20,
    alrLeagueRule: true,
    description: `ALR current league rule — Tyre x${ALR_CURRENT_TYRE_WEAR_MULTIPLIER}, Fuel x3 (not global GT7 default)`,
  },
  {
    id: "full_race",
    label: "Full Race",
    fuelMultiplier: 3,
    tyreMultiplier: 5,
    defaultLaps: 20,
    description: "Standard race — Tyre x5, Fuel x3",
  },
  {
    id: "endurance",
    label: "Endurance",
    fuelMultiplier: 6,
    tyreMultiplier: 8,
    defaultLaps: 40,
    description: "Long stint — high wear",
  },
];

/** @deprecated Use RACE_FORMATS */
export const RACE_CONDITION_PRESETS = RACE_FORMATS;

/**
 * @param {string} [id]
 * @returns {string}
 */
export function resolveRaceFormatId(id) {
  return LEGACY_FORMAT_ALIASES[id] ?? id ?? RACE_CONDITION_PRESET_CUSTOM_ID;
}

/**
 * @param {string} [id]
 * @returns {RaceConditionPreset}
 */
/**
 * @param {string} [presetId]
 * @returns {number}
 */
export function getRaceFormatDefaultLaps(presetId) {
  const preset = getRaceConditionPreset(presetId);
  return preset.defaultLaps ?? 20;
}

export function getRaceConditionPreset(id) {
  const resolvedId = resolveRaceFormatId(id);
  return (
    RACE_FORMATS.find((preset) => preset.id === resolvedId) ?? RACE_FORMATS[0]
  );
}

/**
 * @param {string} presetId
 * @returns {{ fuelMultiplier: number, tyreMultiplier: number } | null}
 */
export function getRaceConditionPresetValues(presetId) {
  const preset = getRaceConditionPreset(presetId);
  if (preset.id === RACE_CONDITION_PRESET_CUSTOM_ID) {
    return null;
  }

  return {
    fuelMultiplier: preset.fuelMultiplier,
    tyreMultiplier: preset.tyreMultiplier,
  };
}

/**
 * @param {number} fuelMultiplier
 * @param {number} tyreMultiplier
 * @returns {string}
 */
export function matchRaceConditionPreset(fuelMultiplier, tyreMultiplier) {
  const match = RACE_FORMATS.find(
    (preset) =>
      preset.id !== RACE_CONDITION_PRESET_CUSTOM_ID &&
      preset.fuelMultiplier === fuelMultiplier &&
      preset.tyreMultiplier === tyreMultiplier,
  );

  return match?.id ?? RACE_CONDITION_PRESET_CUSTOM_ID;
}

/**
 * @param {{ racePresetId?: string, fuelMultiplier?: number, tyreMultiplier?: number }} settings
 * @returns {string}
 */
export function formatRaceConditionSummary(settings) {
  const fuelMultiplier = normalizeRaceMultiplier(settings.fuelMultiplier, 1);
  const tyreMultiplier = normalizeRaceMultiplier(settings.tyreMultiplier, 1);
  const preset = getRaceConditionPreset(settings.racePresetId);

  if (
    preset.id !== RACE_CONDITION_PRESET_CUSTOM_ID &&
    preset.fuelMultiplier === fuelMultiplier &&
    preset.tyreMultiplier === tyreMultiplier
  ) {
    return `${preset.label} · Tyre x${tyreMultiplier} · Fuel x${fuelMultiplier}`;
  }

  return `Tyre x${tyreMultiplier} · Fuel x${fuelMultiplier}`;
}
