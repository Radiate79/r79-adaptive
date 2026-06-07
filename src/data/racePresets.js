export const RACE_CONDITION_PRESET_CUSTOM_ID = "custom";

/** @typedef {Object} RaceConditionPreset
 * @property {string} id
 * @property {string} label
 * @property {number} fuelMultiplier
 * @property {number} tyreMultiplier
 * @property {string} [description]
 */

/** @type {Record<string, string>} */
const LEGACY_FORMAT_ALIASES = {
  alr_full_race: "full_race",
};

/** @type {RaceConditionPreset[]} */
export const RACE_FORMATS = [
  {
    id: RACE_CONDITION_PRESET_CUSTOM_ID,
    label: "Custom",
    fuelMultiplier: 1,
    tyreMultiplier: 1,
  },
  {
    id: "qualifying",
    label: "Qualifying",
    fuelMultiplier: 1,
    tyreMultiplier: 1,
    description: "Short session — minimal wear",
  },
  {
    id: "sprint",
    label: "Sprint",
    fuelMultiplier: 2,
    tyreMultiplier: 2,
    description: "Short race — moderate wear",
  },
  {
    id: "full_race",
    label: "Full Race",
    fuelMultiplier: 3,
    tyreMultiplier: 5,
    description: "Standard race — Tyre x5, Fuel x3",
  },
  {
    id: "endurance",
    label: "Endurance",
    fuelMultiplier: 6,
    tyreMultiplier: 8,
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
  const fuelMultiplier = settings.fuelMultiplier ?? 1;
  const tyreMultiplier = settings.tyreMultiplier ?? 1;
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
