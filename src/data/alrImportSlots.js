import { ALR_HISTORICAL_SEASONS } from "./alrChampionshipWeighting.js";

/** Minimum constructor records required to mark an import slot complete. */
export const ALR_IMPORT_COMPLETE_MIN_RECORDS = 10;

/** Seasons tracked in the import progress panel. */
export const ALR_IMPORT_SEASONS = ALR_HISTORICAL_SEASONS;

/**
 * @typedef {Object} ALRImportSlotDefinition
 * @property {number} tier
 * @property {'blue' | 'white'} [division]
 * @property {string} label
 */

/** @type {ALRImportSlotDefinition[]} */
export const ALR_IMPORT_SLOT_DEFINITIONS = [
  { tier: 1, label: "Tier 1" },
  { tier: 2, division: "blue", label: "Tier 2 Blue" },
  { tier: 2, division: "white", label: "Tier 2 White" },
  { tier: 3, label: "Tier 3" },
  { tier: 4, division: "blue", label: "Tier 4 Blue" },
  { tier: 4, division: "white", label: "Tier 4 White" },
  { tier: 5, label: "Tier 5" },
  { tier: 6, label: "Tier 6" },
];

/**
 * @param {number} tier
 */
export function tierUsesDivision(tier) {
  return tier === 2 || tier === 4;
}

/**
 * @param {number} tier
 * @param {'blue' | 'white' | undefined} [division]
 */
export function formatTierLabel(tier, division) {
  if (division === "blue") {
    return `Tier ${tier} Blue`;
  }
  if (division === "white") {
    return `Tier ${tier} White`;
  }
  return `Tier ${tier}`;
}
