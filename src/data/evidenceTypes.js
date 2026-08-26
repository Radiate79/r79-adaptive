import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  PRE_1_71_PHYSICS_GENERATION,
  UNKNOWN_PHYSICS_GENERATION,
} from "./gt7PhysicsVersion.js";

/**
 * Reusable R79 evidence structure.
 *
 * @typedef {'CONFIRMED' | 'TESTING' | 'HISTORICAL' | 'GENERAL'} EvidenceKind
 * @typedef {'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED'} DataStatus
 */

/**
 * @typedef {Object} R79EvidenceRecord
 * @property {string} id
 * @property {EvidenceKind} evidenceKind
 * @property {DataStatus} [dataStatus]
 * @property {string} [gameVersion] GT7 patch string when known (e.g. "1.71")
 * @property {string} [physicsGeneration]
 * @property {boolean} [validatedAfterUpdate]
 * @property {number} [season] ALR season when applicable
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {boolean} [bopOn]
 * @property {string} [tyreCompound]
 * @property {string} summary
 * @property {string} [observedIssue]
 * @property {string} [notes]
 */

/** Priority rank — lower is better. Historical must never silently beat current validated. */
export const EVIDENCE_PRIORITY = {
  CURRENT_VALIDATED: 1,
  CURRENT_TESTING: 2,
  CURRENT_GENERAL: 3,
  HISTORICAL: 4,
  GENERIC_FALLBACK: 5,
};

/**
 * @param {Partial<R79EvidenceRecord> | null | undefined} evidence
 * @returns {number}
 */
export function getEvidencePriorityRank(evidence) {
  if (!evidence) {
    return EVIDENCE_PRIORITY.GENERIC_FALLBACK;
  }

  const kind = evidence.evidenceKind ?? "GENERAL";
  const physics =
    evidence.physicsGeneration ?? UNKNOWN_PHYSICS_GENERATION;
  const isCurrent = physics === ACTIVE_PHYSICS_GENERATION;
  const validated =
    evidence.validatedAfterUpdate === true || kind === "CONFIRMED";

  if (isCurrent && validated && kind === "CONFIRMED") {
    return EVIDENCE_PRIORITY.CURRENT_VALIDATED;
  }

  if (isCurrent && (kind === "TESTING" || evidence.dataStatus === "TESTING")) {
    return EVIDENCE_PRIORITY.CURRENT_TESTING;
  }

  if (isCurrent && (kind === "GENERAL" || kind === "CONFIRMED")) {
    return EVIDENCE_PRIORITY.CURRENT_GENERAL;
  }

  if (kind === "HISTORICAL" || evidence.dataStatus === "HISTORICAL" || !isCurrent) {
    return EVIDENCE_PRIORITY.HISTORICAL;
  }

  return EVIDENCE_PRIORITY.GENERIC_FALLBACK;
}

/**
 * @param {Partial<R79EvidenceRecord>} partial
 * @returns {R79EvidenceRecord}
 */
export function createEvidenceRecord(partial) {
  const physicsGeneration =
    partial.physicsGeneration ??
    (partial.evidenceKind === "HISTORICAL"
      ? PRE_1_71_PHYSICS_GENERATION
      : UNKNOWN_PHYSICS_GENERATION);

  return {
    id: partial.id ?? `evidence_${Date.now()}`,
    evidenceKind: partial.evidenceKind ?? "GENERAL",
    dataStatus: partial.dataStatus,
    gameVersion: partial.gameVersion,
    physicsGeneration,
    validatedAfterUpdate: partial.validatedAfterUpdate ?? false,
    season: partial.season,
    carId: partial.carId,
    trackId: partial.trackId,
    bopOn: partial.bopOn,
    tyreCompound: partial.tyreCompound,
    summary: partial.summary ?? "",
    observedIssue: partial.observedIssue,
    notes: partial.notes,
  };
}

/**
 * Caveat when only historical / pre-current physics evidence is available.
 * @param {Partial<R79EvidenceRecord> | null | undefined} evidence
 * @returns {string | null}
 */
export function getHistoricalEvidenceCaveat(evidence) {
  if (!evidence) {
    return null;
  }

  const rank = getEvidencePriorityRank(evidence);
  if (rank > EVIDENCE_PRIORITY.CURRENT_GENERAL) {
    return `Supporting evidence only — not yet validated under ${ACTIVE_PHYSICS_GENERATION} (GT7 ${ACTIVE_GT7_GAME_VERSION}).`;
  }

  return null;
}
