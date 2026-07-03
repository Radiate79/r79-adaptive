import { normalizeTyreCompound } from "./tyreCompounds.js";

/**
 * @typedef {Object} PodiumConfirmedEvidence
 * @property {string} carId
 * @property {string} trackId
 * @property {boolean} [bopOn]
 * @property {string} [tyreCompound]
 * @property {string} summary
 */

/** Confirmed ALR / R79 testing findings only — do not invent issues outside this list. */
export const PODIUM_CONFIRMED_EVIDENCE = [
  {
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "trial_mountain",
    bopOn: true,
    tyreCompound: "S",
    summary:
      "Confirmed ALR finding: heavy front-right tyre wear on Racing Softs with BOP at Trial Mountain.",
  },
];

/** Tracks where specific car testing is pending — avoid claiming confirmed issues here. */
export const PODIUM_PENDING_TESTING = [
  {
    carId: "aston_martin_v12_vantage_gt3_12",
    trackId: "spa",
  },
];

/**
 * @param {{
 *   carId?: string,
 *   trackId?: string,
 *   bopOn?: boolean,
 *   tyreCompound?: string,
 * }} input
 * @returns {PodiumConfirmedEvidence | null}
 */
export function getConfirmedPodiumEvidence(input) {
  const compound = normalizeTyreCompound(input.tyreCompound);

  return (
    PODIUM_CONFIRMED_EVIDENCE.find(
      (entry) =>
        entry.carId === input.carId &&
        entry.trackId === input.trackId &&
        (entry.bopOn === undefined || entry.bopOn === input.bopOn) &&
        (entry.tyreCompound === undefined || entry.tyreCompound === compound),
    ) ?? null
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
