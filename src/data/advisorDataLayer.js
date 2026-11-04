/**
 * Authoritative R79 Advisor / Strategy data-layer metadata.
 * Single place for engine versions, GT7 baseline, and evidence source types.
 * Does not invent car or track performance values.
 */

import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  R79_GT7_DATA_SNAPSHOT_DATE,
  R79_GT7_DATA_SNAPSHOT_VERSION,
  R79_PHYSICS_LAST_VALIDATION,
} from "./gt7PhysicsVersion.js";
import { CHAMPIONSHIP_ADVISOR_VERSION } from "./championshipAdvisor171.js";
import {
  GR3_DATA_VERSION,
  GR3_PICKER_ENGINE_VERSION,
} from "./gr3MediumBop172.js";
import { getGt7SnapshotCacheStamp } from "./gt7/snapshotMetadata.js";

/** @typedef {'CURRENT' | 'HISTORICAL' | 'COMMUNITY' | 'MODELLED' | 'UNKNOWN'} EvidenceSourceType */

export const ADVISOR_ENGINE_VERSION = "3.2.1";
export const STRATEGY_ENGINE_VERSION = "2.2.0";
export const ADVISOR_DATA_LAYER_VERSION = "3.2.1"; // Tyre feasibility + wheel min-intervention — 2026-11-04

export const R79_ACTIVE_GT7_BASELINE = {
  gt7Version: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  updatedAt: R79_GT7_DATA_SNAPSHOT_DATE,
  measurableBaselineValidatedAt: R79_PHYSICS_LAST_VALIDATION,
  snapshotVersion: R79_GT7_DATA_SNAPSHOT_VERSION,
  bopVersion: CHAMPIONSHIP_ADVISOR_VERSION.BOP_VERSION,
  sourceType: /** @type {EvidenceSourceType} */ ("CURRENT"),
};

export const EVIDENCE_SOURCE_TYPES = {
  CURRENT: /** @type {EvidenceSourceType} */ ("CURRENT"),
  HISTORICAL: /** @type {EvidenceSourceType} */ ("HISTORICAL"),
  COMMUNITY: /** @type {EvidenceSourceType} */ ("COMMUNITY"),
  MODELLED: /** @type {EvidenceSourceType} */ ("MODELLED"),
  UNKNOWN: /** @type {EvidenceSourceType} */ ("UNKNOWN"),
};

/**
 * @param {unknown} value
 * @param {{
 *   sourceType?: EvidenceSourceType,
 *   gt7Version?: string | null,
 *   confidence?: number | null,
 * }} [meta]
 */
export function withEvidenceProvenance(value, meta = {}) {
  const isUnknown =
    value == null ||
    (typeof value === "number" && !Number.isFinite(value));

  return {
    value: isUnknown ? null : value,
    sourceType: isUnknown
      ? EVIDENCE_SOURCE_TYPES.UNKNOWN
      : (meta.sourceType ?? EVIDENCE_SOURCE_TYPES.CURRENT),
    gt7Version: meta.gt7Version ?? R79_ACTIVE_GT7_BASELINE.gt7Version,
    confidence: isUnknown
      ? 0
      : Math.min(1, Math.max(0, Number(meta.confidence ?? 0.75))),
  };
}

/**
 * Stable payload fragment for cache keys — bumps when engine/data versions change.
 */
export function getAdvisorCacheVersionStamp() {
  return {
    advisorEngineVersion: ADVISOR_ENGINE_VERSION,
    strategyEngineVersion: STRATEGY_ENGINE_VERSION,
    dataLayerVersion: ADVISOR_DATA_LAYER_VERSION,
    gr3PickerEngineVersion: GR3_PICKER_ENGINE_VERSION,
    gr3DataVersion: GR3_DATA_VERSION,
    gt7Version: R79_ACTIVE_GT7_BASELINE.gt7Version,
    physicsGeneration: R79_ACTIVE_GT7_BASELINE.physicsGeneration,
    bopVersion: R79_ACTIVE_GT7_BASELINE.bopVersion,
    updatedAt: R79_ACTIVE_GT7_BASELINE.updatedAt,
    snapshot: getGt7SnapshotCacheStamp(),
  };
}
