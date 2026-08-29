/**
 * Authoritative R79 Advisor / Strategy data-layer metadata.
 * Single place for engine versions, GT7 baseline, and evidence source types.
 * Does not invent car or track performance values.
 */

import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  R79_PHYSICS_LAST_VALIDATION,
} from "./gt7PhysicsVersion.js";
import { CHAMPIONSHIP_ADVISOR_VERSION } from "./championshipAdvisor171.js";

/** @typedef {'CURRENT' | 'HISTORICAL' | 'COMMUNITY' | 'MODELLED' | 'UNKNOWN'} EvidenceSourceType */

export const ADVISOR_ENGINE_VERSION = "2.0.0";
export const STRATEGY_ENGINE_VERSION = "2.0.0";
export const ADVISOR_DATA_LAYER_VERSION = "2.0.0";

export const R79_ACTIVE_GT7_BASELINE = {
  gt7Version: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  updatedAt: R79_PHYSICS_LAST_VALIDATION,
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
    gt7Version: R79_ACTIVE_GT7_BASELINE.gt7Version,
    bopVersion: R79_ACTIVE_GT7_BASELINE.bopVersion,
    updatedAt: R79_ACTIVE_GT7_BASELINE.updatedAt,
  };
}
