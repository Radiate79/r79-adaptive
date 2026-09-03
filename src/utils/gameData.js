import {
  DEFAULT_GAME_VERSION,
  getGameCatalogEntry,
} from "../data/gameVersions.js";
import { filterRecommendationPool } from "./carClassFilter.js";
import { getTrackDisplayName } from "../data/gt7/trackMetadata.js";
import {
  getSelectableTracksForClass as filterTracksForClass,
} from "./trackClassification.js";
import { cars as gt7CarsRaw } from "../data/gt7/cars.js";
import { tracks as gt7Tracks } from "../data/gt7/tracks.js";
import { cars as gt8Cars } from "../data/gt8/cars.js";
import { tracks as gt8Tracks } from "../data/gt8/tracks.js";
import { GR3_CAR_PROFILES } from "../data/gr3CarProfiles.js";

/**
 * Merge authoritative Gr.3 v2 profiles into the raw car list.
 * Profile attributes override base car attributes for Gr.3 cars only.
 * Non-Gr.3 cars are unaffected.
 */
const GR3_PROFILE_MAP = new Map(GR3_CAR_PROFILES.map((p) => [p.carId, p]));

const gt7Cars = gt7CarsRaw.map((car) => {
  if (car.class !== "Gr.3") return car;
  const profile = GR3_PROFILE_MAP.get(car.id);
  if (!profile) return car;

  return {
    ...car,
    // Core scoring attributes — use profile values
    topSpeed: profile.topSpeed,
    traction: profile.traction,
    fuel: profile.fuel,
    tyres: profile.tyres,
    stability: profile.stability,
    rotation: profile.rotation,
    // Metadata
    communityConfidence: profile.communityConfidence ?? car.communityConfidence ?? null,
    competitiveUse: profile.competitiveUse ?? car.competitiveUse ?? null,
    strengths: profile.strengths?.length ? profile.strengths : (car.strengths ?? []),
    weaknesses: profile.weaknesses?.length ? profile.weaknesses : (car.weaknesses ?? []),
    // Extended fields for diagnostic use
    _gr3DataConfidence: profile.dataConfidence,
    _gr3Provenance: profile.provenance,
    _gr3EngineVersion: "2",
  };
});

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

/** @type {Map<string, Map<string, (typeof gt7Cars)[number]>>} */
const CAR_BY_ID = new Map();
/** @type {Map<string, Map<string, (typeof gt7Tracks)[number]>>} */
const TRACK_BY_ID = new Map();

/**
 * @param {GameVersion | string} gameVersion
 */
function getCarIndex(gameVersion) {
  const key = /** @type {GameVersion} */ (gameVersion) || DEFAULT_GAME_VERSION;
  if (!CAR_BY_ID.has(key)) {
    const map = new Map();
    for (const car of GAME_DATA[key]?.cars ?? []) {
      map.set(car.id, car);
    }
    CAR_BY_ID.set(key, map);
  }
  return CAR_BY_ID.get(key);
}

/**
 * @param {GameVersion | string} gameVersion
 */
function getTrackIndex(gameVersion) {
  const key = /** @type {GameVersion} */ (gameVersion) || DEFAULT_GAME_VERSION;
  if (!TRACK_BY_ID.has(key)) {
    const map = new Map();
    for (const track of GAME_DATA[key]?.tracks ?? []) {
      map.set(track.id, track);
    }
    TRACK_BY_ID.set(key, map);
  }
  return TRACK_BY_ID.get(key);
}

/**
 * @param {string} carId
 * @param {GameVersion | string} [gameVersion]
 */
export function getCarById(carId, gameVersion = DEFAULT_GAME_VERSION) {
  return getCarIndex(gameVersion)?.get(carId) ?? null;
}

/**
 * @param {string} trackId
 * @param {GameVersion | string} [gameVersion]
 */
export function getTrackById(trackId, gameVersion = DEFAULT_GAME_VERSION) {
  return getTrackIndex(gameVersion)?.get(trackId) ?? null;
}

/**
 * @param {GameVersion | string} [gameVersion]
 */
export function getCarsForGame(gameVersion = DEFAULT_GAME_VERSION) {
  const cars =
    GAME_DATA[/** @type {GameVersion} */ (gameVersion)]?.cars ??
    GAME_DATA[DEFAULT_GAME_VERSION]?.cars;

  return Array.isArray(cars)
    ? [...cars].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
    : [];
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
  const tracks =
    GAME_DATA[/** @type {GameVersion} */ (gameVersion)]?.tracks ??
    GAME_DATA[DEFAULT_GAME_VERSION]?.tracks;

  return Array.isArray(tracks)
    ? [...tracks].sort((a, b) =>
        getTrackDisplayName(a).localeCompare(getTrackDisplayName(b), undefined, {
          sensitivity: "base",
        }),
      )
    : [];
}

/**
 * Tracks valid for recommendation selectors for the selected class.
 * Full track records are preserved in getTracksForGame().
 *
 * @param {GameVersion | string} [gameVersion]
 * @param {string} selectedClass
 */
export function getSelectableTracksForClass(
  gameVersion = DEFAULT_GAME_VERSION,
  selectedClass,
) {
  return filterTracksForClass(getTracksForGame(gameVersion), selectedClass).sort(
    (a, b) =>
      getTrackDisplayName(a).localeCompare(getTrackDisplayName(b), undefined, {
        sensitivity: "base",
      }),
  );
}

/**
 * Tarmac tracks for Gr.3 / Gr.4 recommendation selectors.
 *
 * @param {GameVersion | string} [gameVersion]
 */
export function getStandardRaceTracks(gameVersion = DEFAULT_GAME_VERSION) {
  return getSelectableTracksForClass(gameVersion, "Gr.3");
}

export { getTrackDisplayName };

/**
 * @param {GameVersion | string} [gameVersion]
 */
export function isGameDataReady(gameVersion = DEFAULT_GAME_VERSION) {
  return getGameCatalogEntry(gameVersion).dataReady;
}

export { DEFAULT_GAME_VERSION, GT7_GAME_VERSION, GT8_GAME_VERSION } from "../data/gameVersions.js";
