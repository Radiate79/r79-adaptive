import {
  DEFAULT_GAME_VERSION,
  getGameCatalogEntry,
} from "../data/gameVersions.js";
import { filterRecommendationPool } from "./carClassFilter.js";
import { cars as gt7Cars } from "../data/gt7/cars.js";
import { tracks as gt7Tracks } from "../data/gt7/tracks.js";
import { cars as gt8Cars } from "../data/gt8/cars.js";
import { tracks as gt8Tracks } from "../data/gt8/tracks.js";

/** @typedef {import("../data/gameVersions.js").GameVersion} GameVersion */

/** @type {Record<GameVersion, { cars: typeof gt7Cars, tracks: typeof gt7Tracks }>} */
const GAME_DATA = {
  gt7: {
    cars: gt7Cars,
    tracks: gt7Tracks,
  },
  gt8: {
    cars: gt8Cars,
    tracks: gt8Tracks,
  },
};

/**
 * @param {GameVersion | string} [gameVersion]
 */
export function getCarsForGame(gameVersion = DEFAULT_GAME_VERSION) {
  return (
    GAME_DATA[/** @type {GameVersion} */ (gameVersion)]?.cars ??
    GAME_DATA[DEFAULT_GAME_VERSION].cars
  );
}

/**
 * Cars eligible for all R79 recommendation surfaces (advisors, engineer, shortlists).
 * Source data is preserved; excluded cars remain in getCarsForGame().
 * @param {GameVersion | string} [gameVersion]
 * @param {string} [carClass]
 */
export function getRecommendableCarsForGame(
  gameVersion = DEFAULT_GAME_VERSION,
  carClass,
) {
  return filterRecommendationPool(getCarsForGame(gameVersion), carClass);
}

/**
 * @param {GameVersion | string} [gameVersion]
 */
export function getTracksForGame(gameVersion = DEFAULT_GAME_VERSION) {
  return (
    GAME_DATA[/** @type {GameVersion} */ (gameVersion)]?.tracks ??
    GAME_DATA[DEFAULT_GAME_VERSION].tracks
  );
}

/**
 * @param {GameVersion | string} [gameVersion]
 */
export function isGameDataReady(gameVersion = DEFAULT_GAME_VERSION) {
  return getGameCatalogEntry(gameVersion).dataReady;
}

export { DEFAULT_GAME_VERSION, GT7_GAME_VERSION, GT8_GAME_VERSION } from "../data/gameVersions.js";
