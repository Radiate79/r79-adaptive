/**
 * ALR league rules — separate from GT7 game physics and car data.
 *
 * After the GT7 1.71+ physics update, ALR reduced tyre wear from x5 to x4
 * because tyre behaviour became materially harsher. That is a league rule,
 * not a global GT7 default.
 */

import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  PRE_1_71_PHYSICS_GENERATION,
} from "../gt7PhysicsVersion.js";

/** Current ALR tyre-wear multiplier for the post-1.71 physics era. */
export const ALR_CURRENT_TYRE_WEAR_MULTIPLIER = 4;

/** Historical ALR tyre-wear multiplier used before the physics update. */
export const ALR_HISTORICAL_TYRE_WEAR_MULTIPLIER = 5;

/**
 * @typedef {Object} AlrLeagueRules
 * @property {number} tyreWearMultiplier
 * @property {number | null} fuelMultiplier
 * @property {string} physicsGeneration
 * @property {string} gameVersion
 * @property {string} status
 * @property {string} note
 */

/** @type {AlrLeagueRules} */
export const ALR_CURRENT_LEAGUE_RULES = {
  tyreWearMultiplier: ALR_CURRENT_TYRE_WEAR_MULTIPLIER,
  fuelMultiplier: null,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  gameVersion: ACTIVE_GT7_GAME_VERSION,
  status: "CURRENT",
  note:
    "ALR current tyre wear is x4 under post-1.71 physics. Do not treat this as the global GT7 default.",
};

/** @type {AlrLeagueRules} */
export const ALR_HISTORICAL_LEAGUE_RULES = {
  tyreWearMultiplier: ALR_HISTORICAL_TYRE_WEAR_MULTIPLIER,
  fuelMultiplier: null,
  physicsGeneration: PRE_1_71_PHYSICS_GENERATION,
  gameVersion: "1.70",
  status: "HISTORICAL",
  note:
    "Historical ALR used tyre wear x5 under pre-1.71 physics. Must not be linearly converted to current x4 life.",
};

/**
 * @param {{ physicsGeneration?: string, tyreWearMultiplier?: number }} [meta]
 * @returns {boolean}
 */
export function isHistoricalAlrTyreEvidence(meta = {}) {
  if (meta.physicsGeneration === PRE_1_71_PHYSICS_GENERATION) {
    return true;
  }
  if (Number(meta.tyreWearMultiplier) === ALR_HISTORICAL_TYRE_WEAR_MULTIPLIER) {
    return true;
  }
  return false;
}

/**
 * Forbidden: oldLife * (oldMult / newMult).
 * Returns null always — kept as an explicit API so tests can prove no conversion.
 *
 * @param {number} _oldLifeLaps
 * @param {number} _oldMultiplier
 * @param {number} _newMultiplier
 * @returns {null}
 */
export function refuseLinearTyreLifeConversion(
  _oldLifeLaps,
  _oldMultiplier,
  _newMultiplier,
) {
  return null;
}
