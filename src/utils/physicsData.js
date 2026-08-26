import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  PRE_1_71_PHYSICS_GENERATION,
  UNKNOWN_PHYSICS_GENERATION,
  isCurrentPhysicsGeneration,
} from "../data/gt7PhysicsVersion.js";
import { EVIDENCE_PRIORITY } from "../data/evidenceTypes.js";

/**
 * Backwards-compatible physics metadata for wheel setup records.
 * Existing records without these fields continue to work via defaults —
 * values are NOT rewritten in place.
 *
 * @typedef {Object} WheelPhysicsMeta
 * @property {string} gameVersionPatch
 * @property {string} physicsGeneration
 * @property {'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED'} dataStatus
 * @property {'validated' | 'testing' | 'unvalidated' | 'historical'} validationStatus
 * @property {boolean} validatedAfterUpdate
 */

/**
 * @param {Partial<import("../data/wheelSetups.js").WheelSetupRecord> & {
 *   isValidated?: boolean,
 *   physicsGeneration?: string,
 *   dataStatus?: string,
 *   validationStatus?: string,
 *   validatedAfterUpdate?: boolean,
 *   gameVersionPatch?: string,
 * }} [setup]
 * @returns {WheelPhysicsMeta}
 */
export function normalizeWheelSetupPhysics(setup = {}) {
  if (setup.physicsGeneration || setup.validationStatus || setup.dataStatus) {
    const physicsGeneration =
      setup.physicsGeneration ?? UNKNOWN_PHYSICS_GENERATION;
    const validatedAfterUpdate = setup.validatedAfterUpdate === true;
    const validationStatus =
      setup.validationStatus ??
      (validatedAfterUpdate && isCurrentPhysicsGeneration(physicsGeneration)
        ? "validated"
        : setup.isValidated
          ? "historical"
          : "unvalidated");

    return {
      gameVersionPatch: setup.gameVersionPatch ?? ACTIVE_GT7_GAME_VERSION,
      physicsGeneration,
      dataStatus:
        /** @type {WheelPhysicsMeta['dataStatus']} */ (
          setup.dataStatus ??
            (isCurrentPhysicsGeneration(physicsGeneration)
              ? validatedAfterUpdate
                ? "CURRENT"
                : "UNVALIDATED"
              : "HISTORICAL")
        ),
      validationStatus:
        /** @type {WheelPhysicsMeta['validationStatus']} */ (validationStatus),
      validatedAfterUpdate,
    };
  }

  // Legacy records: keep working. Do not claim 1.71 validation.
  if (setup.isValidated) {
    return {
      gameVersionPatch: ACTIVE_GT7_GAME_VERSION,
      physicsGeneration: PRE_1_71_PHYSICS_GENERATION,
      dataStatus: "HISTORICAL",
      validationStatus: "historical",
      validatedAfterUpdate: false,
    };
  }

  return {
    gameVersionPatch: ACTIVE_GT7_GAME_VERSION,
    physicsGeneration: UNKNOWN_PHYSICS_GENERATION,
    dataStatus: "UNVALIDATED",
    validationStatus: "unvalidated",
    validatedAfterUpdate: false,
  };
}

/**
 * Recommendation priority when multiple setups / evidence pieces exist.
 * Lower rank wins. Historical must never silently override current validated.
 *
 * @param {Partial<import("../data/wheelSetups.js").WheelSetupRecord> & {
 *   isValidated?: boolean,
 *   physicsGeneration?: string,
 *   dataStatus?: string,
 *   validationStatus?: string,
 *   validatedAfterUpdate?: boolean,
 * }} [setup]
 * @returns {number}
 */
export function getWheelSetupPhysicsPriority(setup) {
  const meta = normalizeWheelSetupPhysics(setup);
  const current = isCurrentPhysicsGeneration(meta.physicsGeneration);

  if (current && meta.validatedAfterUpdate && meta.validationStatus === "validated") {
    return EVIDENCE_PRIORITY.CURRENT_VALIDATED;
  }

  if (current && (meta.validationStatus === "testing" || meta.dataStatus === "TESTING")) {
    return EVIDENCE_PRIORITY.CURRENT_TESTING;
  }

  if (current) {
    return EVIDENCE_PRIORITY.CURRENT_GENERAL;
  }

  if (
    meta.dataStatus === "HISTORICAL" ||
    meta.validationStatus === "historical" ||
    setup?.isValidated
  ) {
    return EVIDENCE_PRIORITY.HISTORICAL;
  }

  return EVIDENCE_PRIORITY.GENERIC_FALLBACK;
}

/**
 * @param {Array<Partial<import("../data/wheelSetups.js").WheelSetupRecord>>} setups
 * @returns {Partial<import("../data/wheelSetups.js").WheelSetupRecord> | null}
 */
export function pickBestPhysicsAwareSetup(setups) {
  if (!Array.isArray(setups) || setups.length === 0) {
    return null;
  }

  let best = setups[0];
  let bestRank = getWheelSetupPhysicsPriority(best);

  for (let index = 1; index < setups.length; index += 1) {
    const candidate = setups[index];
    const rank = getWheelSetupPhysicsPriority(candidate);
    if (rank < bestRank) {
      best = candidate;
      bestRank = rank;
    }
  }

  return best;
}

/**
 * @param {Partial<import("../data/wheelSetups.js").WheelSetupRecord>} [setup]
 * @returns {string | null}
 */
export function getWheelHistoricalCaveat(setup) {
  const meta = normalizeWheelSetupPhysics(setup);
  if (isCurrentPhysicsGeneration(meta.physicsGeneration) && meta.validatedAfterUpdate) {
    return null;
  }

  if (meta.validationStatus === "historical" || meta.dataStatus === "HISTORICAL") {
    return `Profile retained from prior physics (${meta.physicsGeneration}). Not yet validated under ${ACTIVE_PHYSICS_GENERATION}.`;
  }

  return null;
}

/**
 * Season / ALR classification helpers — capability for tagging without fabricating.
 *
 * @param {number} season
 * @returns {{
 *   season: number,
 *   physicsGeneration: string,
 *   dataStatus: 'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED',
 * }}
 */
export function classifyAlrSeasonPhysics(season) {
  const numeric = Number(season);

  // Season 25+ can target current physics when tagged as such.
  if (Number.isFinite(numeric) && numeric >= 25) {
    return {
      season: numeric,
      physicsGeneration: ACTIVE_PHYSICS_GENERATION,
      dataStatus: "TESTING",
    };
  }

  // Season 24 and earlier: historical / pre-1.71 capability (do not invent values).
  if (Number.isFinite(numeric) && numeric <= 24) {
    return {
      season: numeric,
      physicsGeneration: PRE_1_71_PHYSICS_GENERATION,
      dataStatus: "HISTORICAL",
    };
  }

  return {
    season: Number.isFinite(numeric) ? numeric : 0,
    physicsGeneration: UNKNOWN_PHYSICS_GENERATION,
    dataStatus: "UNVALIDATED",
  };
}
