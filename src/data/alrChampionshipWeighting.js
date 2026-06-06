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
