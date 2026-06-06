/** @typedef {'gt7' | 'gt8'} GameVersion */

export const GT7_GAME_VERSION = "gt7";
export const GT8_GAME_VERSION = "gt8";

/** @type {GameVersion} */
export const DEFAULT_GAME_VERSION = GT7_GAME_VERSION;

/**
 * @typedef {Object} GameCatalogEntry
 * @property {GameVersion} id
 * @property {string} label
 * @property {string} shortLabel
 * @property {GameVersion} alrGameVersion
 * @property {boolean} dataReady
 */

/** @type {Record<GameVersion, GameCatalogEntry>} */
export const GAME_CATALOG = {
  gt7: {
    id: GT7_GAME_VERSION,
    label: "Gran Turismo 7",
    shortLabel: "GT7",
    alrGameVersion: GT7_GAME_VERSION,
    dataReady: true,
  },
  gt8: {
    id: GT8_GAME_VERSION,
    label: "Gran Turismo 8",
    shortLabel: "GT8",
    alrGameVersion: GT7_GAME_VERSION,
    dataReady: false,
  },
};

/** @type {GameVersion[]} */
export const GAME_VERSION_ORDER = [GT7_GAME_VERSION, GT8_GAME_VERSION];

/**
 * @param {string} gameVersion
 * @returns {GameCatalogEntry}
 */
export function getGameCatalogEntry(gameVersion) {
  return (
    GAME_CATALOG[/** @type {GameVersion} */ (gameVersion)] ??
    GAME_CATALOG[DEFAULT_GAME_VERSION]
  );
}
