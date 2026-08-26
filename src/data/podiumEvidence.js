import { normalizeTyreCompound } from "./tyreCompounds.js";
import {
  createEvidenceRecord,
  getEvidencePriorityRank,
  getHistoricalEvidenceCaveat,
} from "./evidenceTypes.js";
import { PRE_1_71_PHYSICS_GENERATION } from "./gt7PhysicsVersion.js";

/**
 * Confirmed ALR / R79 testing findings only — do not invent issues outside this list.
 * Observation applies ONLY to the listed car/track/condition combination.
 *
 * This confirmed Trial Mountain finding predates GT7 1.71 validation and remains
 * stored as CONFIRMED historical evidence until re-validated under current physics.
 */
export const PODIUM_CONFIRMED_EVIDENCE = [
  createEvidenceRecord({
    id: "podium_aston_v12_trial_mountain_fr_wear",
    evidenceKind: "CONFIRMED",
    dataStatus: "HISTORICAL",
    physicsGeneration: PRE_1_71_PHYSICS_GENERATION,
    validatedAfterUpdate: false,
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "trial_mountain",
    bopOn: true,
    tyreCompound: "S",
    observedIssue: "Heavy front-right tyre wear",
    summary:
      "Confirmed ALR finding: heavy front-right tyre wear on Racing Softs with BOP at Trial Mountain.",
    notes:
      "Applies only to Aston Martin V12 Vantage GT3 + Trial Mountain + BOP + Racing Softs. Do not transfer to Spa or other circuits.",
  }),
];

/** Tracks where specific car testing is pending — avoid claiming confirmed issues here. */
export const PODIUM_PENDING_TESTING = [
  createEvidenceRecord({
    id: "podium_aston_v12_spa_pending",
    evidenceKind: "TESTING",
    dataStatus: "UNVALIDATED",
    physicsGeneration: PRE_1_71_PHYSICS_GENERATION,
    validatedAfterUpdate: false,
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "spa",
    summary: "Spa tyre behaviour for this car is still pending testing.",
  }),
];

/**
 * @param {{
 *   carId?: string,
 *   trackId?: string,
 *   bopOn?: boolean,
 *   tyreCompound?: string,
 * }} input
 * @returns {import("./evidenceTypes.js").R79EvidenceRecord | null}
 */
export function getConfirmedPodiumEvidence(input) {
  const compound = normalizeTyreCompound(input.tyreCompound);

  const matches = PODIUM_CONFIRMED_EVIDENCE.filter(
    (entry) =>
      entry.carId === input.carId &&
      entry.trackId === input.trackId &&
      (entry.bopOn === undefined || entry.bopOn === input.bopOn) &&
      (entry.tyreCompound === undefined || entry.tyreCompound === compound),
  );

  if (!matches.length) {
    return null;
  }

  return matches.reduce((best, entry) =>
    getEvidencePriorityRank(entry) < getEvidencePriorityRank(best) ? entry : best,
  );
}

/**
 * @param {{ carId?: string, trackId?: string }} input
 */
export function isPodiumTestingPending(input) {
  return PODIUM_PENDING_TESTING.some(
    (entry) => entry.carId === input.carId && entry.trackId === input.trackId,
  );
}

/**
 * @param {{
 *   carId?: string,
 *   trackId?: string,
 *   bopOn?: boolean,
 *   tyreCompound?: string,
 * }} input
 * @returns {string | null}
 */
export function getPodiumEvidenceCaveat(input) {
  return getHistoricalEvidenceCaveat(getConfirmedPodiumEvidence(input));
}
