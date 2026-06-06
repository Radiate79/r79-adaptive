import { GAME_CATALOG } from "../data/gameVersions.js";
import {
  AI_MODULES,
  APP_VERSION,
  BUILD_COMMIT_COUNT,
  BUILD_LABEL,
  PROJECT_START_DATE,
} from "../data/founderMeta.js";
import { getCarsForGame, getTracksForGame } from "./gameData.js";
import { loadALRRecords } from "./alrStorage.js";

function countDevelopmentDays() {
  const start = new Date(PROJECT_START_DATE);
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

function countImportedSeasons(records) {
  return new Set(records.map((record) => record.season)).size;
}

/**
 * Live project statistics for Founder Mode and Founder Console.
 */
export function getFounderStats() {
  const records = loadALRRecords();
  const gt7Cars = getCarsForGame("gt7");
  const gt8Cars = getCarsForGame("gt8");
  const gt7Tracks = getTracksForGame("gt7");
  const gt8Tracks = getTracksForGame("gt8");

  return {
    currentVersion: APP_VERSION,
    buildLabel: BUILD_LABEL,
    developmentDays: countDevelopmentDays(),
    carsIndexed: gt7Cars.length + gt8Cars.length,
    gt7Cars: gt7Cars.length,
    gt8Cars: gt8Cars.length,
    tracksSupported: gt7Tracks.length + gt8Tracks.length,
    gt7Tracks: gt7Tracks.length,
    gt8Tracks: gt8Tracks.length,
    historicalRecords: records.length,
    championshipSeasonsImported: countImportedSeasons(records),
    gt7Support: GAME_CATALOG.gt7.dataReady,
    gt8Ready: GAME_CATALOG.gt8.dataReady,
    gt8ArchitectureReady: true,
    commitCount: BUILD_COMMIT_COUNT,
    aiModulesCount: AI_MODULES.length,
    recordCount: records.length,
    carsCount: gt7Cars.length + gt8Cars.length,
    tracksCount: gt7Tracks.length + gt8Tracks.length,
  };
}
