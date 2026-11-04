/**
 * GT7 data snapshot registry — single source of truth for versioned datasets.
 * Production uses static validated snapshots; no live scraping.
 */

import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  GT7_171_OFFICIAL_PHYSICS_CHANGES,
  GT7_172_OFFICIAL_CONTENT_CHANGES,
  PHYSICS_GENERATION_LABEL,
  R79_GT7_DATA_SNAPSHOT_DATE,
  R79_GT7_DATA_SNAPSHOT_VERSION,
  R79_PHYSICS_LAST_VALIDATION,
} from "../gt7PhysicsVersion.js";
import { DATA_VERIFICATION_STATUS } from "../dataVerificationStatus.js";
import {
  GR3_DATA_VERSION,
  GR3_MEDIUM_BOP_172,
  GR3_PICKER_ENGINE_VERSION,
  MAZDA_RX_VISION_GT3_EVO_26_ID,
} from "../gr3MediumBop172.js";
import { cars as gt7Cars } from "./cars.js";
import {
  GT7_OFFICIAL_CATALOGUE_VERSION,
  OFFICIAL_GT7_CATALOGUE_META,
  isInvalidGt7R79CarId,
} from "./officialCarCatalogue.js";

/** @typedef {'CONFIRMED_CURRENT' | 'MEASURED_CURRENT' | 'EMPIRICAL_CURRENT' | 'HISTORICAL' | 'AWAITING_VERIFICATION' | 'UNKNOWN'} DatasetStatus */

/**
 * @typedef {Object} DatasetProvenance
 * @property {string} gameVersion
 * @property {string} physicsGeneration
 * @property {string} source
 * @property {string} sourceVersion
 * @property {string} capturedAt
 * @property {string} confidence
 * @property {DatasetStatus} status
 */

/**
 * Active snapshot envelope for cache keys and diagnostics.
 */
export const GT7_ACTIVE_SNAPSHOT = {
  activeGameVersion: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  physicsGenerationLabel: PHYSICS_GENERATION_LABEL,
  snapshotDate: R79_GT7_DATA_SNAPSHOT_DATE,
  snapshotVersion: R79_GT7_DATA_SNAPSHOT_VERSION,
  officialPhysicsChanges: GT7_171_OFFICIAL_PHYSICS_CHANGES,
  officialContentChanges: GT7_172_OFFICIAL_CONTENT_CHANGES,
};

/**
 * Per-dataset provenance for the active snapshot.
 * @type {Record<string, DatasetProvenance>}
 */
export const GT7_DATASET_REGISTRY = {
  gr3Measurable171Baseline: {
    gameVersion: "1.71",
    physicsGeneration: "GT7_1_71_PHYSICS",
    source: "GT ENG!NE measurable BoP",
    sourceVersion: "1.71",
    capturedAt: R79_PHYSICS_LAST_VALIDATION,
    confidence: "HIGH",
    status: "HISTORICAL",
  },
  gr3MediumBop172Overlay: {
    gameVersion: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    source: "Specialist measured / observed 1.72 medium BoP",
    sourceVersion: GR3_DATA_VERSION,
    capturedAt: R79_GT7_DATA_SNAPSHOT_DATE,
    confidence: "HIGH",
    status: "MEASURED_CURRENT",
  },
  gr3HighLowBop: {
    gameVersion: "1.71",
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    source: "GT ENG!NE measurable BoP (high/low awaiting 1.72 re-observation)",
    sourceVersion: "1.71",
    capturedAt: R79_PHYSICS_LAST_VALIDATION,
    confidence: "MEDIUM",
    status: "AWAITING_VERIFICATION",
  },
  classHandlingDefaults172: {
    gameVersion: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    source: "Official GT7 1.72 update notice",
    sourceVersion: "1.72",
    capturedAt: R79_GT7_DATA_SNAPSHOT_DATE,
    confidence: "VERY_HIGH",
    status: "CONFIRMED_CURRENT",
  },
  trackProfiles: {
    gameVersion: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    source: "R79 verified track geometry / demand profiles",
    sourceVersion: "r79-track-profiles",
    capturedAt: R79_GT7_DATA_SNAPSHOT_DATE,
    confidence: "HIGH",
    status: "CONFIRMED_CURRENT",
  },
  wheelDeviceSchemas: {
    gameVersion: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    source: "R79 device control schemas + official FFB change notices",
    sourceVersion: "wheel-platform-1.72",
    capturedAt: R79_GT7_DATA_SNAPSHOT_DATE,
    confidence: "HIGH",
    status: "EMPIRICAL_CURRENT",
  },
};

/**
 * Count cars by class from the canonical GT7 car catalog.
 * @returns {Record<string, number>}
 */
export function countCarsByClass() {
  /** @type {Record<string, number>} */
  const counts = { "Gr.1": 0, "Gr.2": 0, "Gr.3": 0, "Gr.4": 0 };
  for (const car of gt7Cars) {
    if (isInvalidGt7R79CarId(car.id)) continue;
    if (counts[car.class] != null) {
      counts[car.class] += 1;
    }
  }
  return counts;
}

/**
 * @returns {{
 *   snapshot: typeof GT7_ACTIVE_SNAPSHOT,
 *   carCounts: Record<string, number>,
 *   gr3MediumOverlayCount: number,
 *   mazdaEvoId: string,
 *   mazdaEvoPresent: boolean,
 *   gr3PickerEngineVersion: string,
 * }}
 */
export function getGt7SnapshotDiagnostics() {
  const carCounts = countCarsByClass();
  const mazdaEvoPresent = gt7Cars.some(
    (car) => car.id === MAZDA_RX_VISION_GT3_EVO_26_ID,
  );
  return {
    snapshot: GT7_ACTIVE_SNAPSHOT,
    carCounts,
    gr3MediumOverlayCount: Object.keys(GR3_MEDIUM_BOP_172).length,
    mazdaEvoId: MAZDA_RX_VISION_GT3_EVO_26_ID,
    mazdaEvoPresent,
    gr3PickerEngineVersion: GR3_PICKER_ENGINE_VERSION,
  };
}

/**
 * Stable fragment for recommendation cache keys.
 */
export function getGt7SnapshotCacheStamp() {
  return {
    snapshotVersion: R79_GT7_DATA_SNAPSHOT_VERSION,
    gameVersion: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: ACTIVE_PHYSICS_GENERATION,
    gr3DataVersion: GR3_DATA_VERSION,
    officialCatalogueVersion: GT7_OFFICIAL_CATALOGUE_VERSION,
    officialCatalogueCount: OFFICIAL_GT7_CATALOGUE_META.carCount,
    verification: DATA_VERIFICATION_STATUS.CURRENT_1_72_OBSERVED,
  };
}
