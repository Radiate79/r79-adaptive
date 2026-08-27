/**
 * ALR Championship Weighting — tier and constructor position point tables.
 *
 * Each result score = (tierPoints × positionPoints) / 100
 */

/** @type {Record<number, number>} */
export const ALR_TIER_POINTS = {
  1: 100,
  2: 90,
  3: 80,
  4: 70,
  5: 60,
  6: 50,
  7: 45,
  8: 40,
  9: 35,
  10: 30,
};

/** @type {Record<number, number>} */
export const ALR_CONSTRUCTOR_POSITION_POINTS = {
  1: 100,
  2: 90,
  3: 80,
  4: 70,
  5: 60,
  6: 50,
  7: 40,
  8: 30,
  9: 20,
  10: 10,
};

/** Seasons included in the ALR Historical Score window. */
export const ALR_HISTORICAL_SEASON_FROM = 20;
export const ALR_HISTORICAL_SEASON_TO = 22;

export const ALR_HISTORICAL_SEASONS = [20, 21, 22];

/**
 * Physics-generation classification capability for ALR seasons.
 * Season 24 (and earlier stored seasons) → PRE_1_71 / HISTORICAL.
 * Season 25+ testing can target GT7_1_71_PHYSICS when tagged.
 * Does not fabricate missing season datasets — tags existing windows only.
 */
export const ALR_SEASON_PHYSICS_META = {
  20: { season: 20, physicsGeneration: "PRE_1_71", dataStatus: "HISTORICAL" },
  21: { season: 21, physicsGeneration: "PRE_1_71", dataStatus: "HISTORICAL" },
  22: { season: 22, physicsGeneration: "PRE_1_71", dataStatus: "HISTORICAL" },
  23: { season: 23, physicsGeneration: "PRE_1_71", dataStatus: "HISTORICAL" },
  24: { season: 24, physicsGeneration: "PRE_1_71", dataStatus: "HISTORICAL" },
};
