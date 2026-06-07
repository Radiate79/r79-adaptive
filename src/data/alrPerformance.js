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
 * Historical ALR constructors championship results (Seasons 20–22).
 * Seeds recommendation historical scoring when localStorage is empty.
 *
 * @type {ALRPerformanceRecord[]}
 */
export const alrPerformance = [
  { season: 22, tier: 1, car: "ferrari_296_gt3_23", constructorsPosition: 1 },
  { season: 21, tier: 1, car: "ferrari_296_gt3_23", constructorsPosition: 2 },
  { season: 20, tier: 1, car: "ferrari_296_gt3_23", constructorsPosition: 3 },

  { season: 22, tier: 1, car: "jaguar_f_type_gt3", constructorsPosition: 3 },
  { season: 21, tier: 1, car: "jaguar_f_type_gt3", constructorsPosition: 4 },
  { season: 20, tier: 1, car: "jaguar_f_type_gt3", constructorsPosition: 5 },

  {
    season: 22,
    tier: 1,
    car: "aston_martin_v12_vantage_gt3_12",
    constructorsPosition: 4,
  },
  {
    season: 21,
    tier: 1,
    car: "aston_martin_v12_vantage_gt3_12",
    constructorsPosition: 3,
  },
  {
    season: 20,
    tier: 1,
    car: "aston_martin_v12_vantage_gt3_12",
    constructorsPosition: 6,
  },

  { season: 22, tier: 1, car: "porsche_911_gt3_r_22", constructorsPosition: 5 },
  { season: 21, tier: 1, car: "porsche_911_gt3_r_22", constructorsPosition: 1 },
  { season: 20, tier: 1, car: "porsche_911_gt3_r_22", constructorsPosition: 2 },

  { season: 22, tier: 1, car: "mercedes_amg_gt3_20", constructorsPosition: 2 },
  { season: 21, tier: 1, car: "mercedes_amg_gt3_20", constructorsPosition: 5 },
  { season: 20, tier: 1, car: "mercedes_amg_gt3_20", constructorsPosition: 4 },

  { season: 22, tier: 1, car: "nissan_gtr_gt3_18", constructorsPosition: 6 },
  { season: 21, tier: 1, car: "nissan_gtr_gt3_18", constructorsPosition: 6 },
  { season: 20, tier: 1, car: "nissan_gtr_gt3_18", constructorsPosition: 7 },

  { season: 22, tier: 1, car: "genesis_x_gr3", constructorsPosition: 7 },
  { season: 21, tier: 1, car: "genesis_x_gr3", constructorsPosition: 7 },
  { season: 20, tier: 1, car: "genesis_x_gr3", constructorsPosition: 8 },
];
