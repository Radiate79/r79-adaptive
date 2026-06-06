import { GAME_VERSION_ORDER } from "../data/gameVersions.js";
import { getFounderStats } from "./founderStats.js";

/**
 * Live statistics for the R79 Archive page.
 */
export function getArchiveStats() {
  const base = getFounderStats();

  return {
    ...base,
    gamesSupported: GAME_VERSION_ORDER.length,
    currentVersion: `v${base.currentVersion}`,
  };
}
