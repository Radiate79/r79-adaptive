/**
 * ALR (Assetto League Racing) constructors championship history.
 *
 * `car` must match an `id` from cars.js.
 * Scoring uses alrChampionshipWeighting.js (tier × position / 100 per result).
 *
 * @typedef {Object} ALRPerformanceRecord
 * @property {number} season - Season number
 * @property {number} tier - Championship tier (1 = top tier)
 * @property {'blue' | 'white'} [division] - Tier 2 / Tier 4 split (optional)
 * @property {string} car - Car id from cars.js
 * @property {number} constructorsPosition - Final constructors championship position
 * @property {string} [sourceName] - League or community source (e.g. ALR, GTWS)
 */

/**
 * Historical ALR constructors championship results.
 * Populate with Seasons 20–22 (and beyond) for historical analysis.
 *
 * @type {ALRPerformanceRecord[]}
 *
 * @example
 * {
 *   season: 21,
 *   tier: 1,
 *   car: "porsche_911_gt3_r_22",
 *   constructorsPosition: 2,
 * }
 */
export const alrPerformance = [];
