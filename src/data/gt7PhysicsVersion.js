/**
 * Central GT7 game-update vs R79 physics-generation awareness.
 *
 * gameVersion (patch) and physicsGeneration are intentionally separate:
 * a content-only GT7 update can keep the same physics generation active.
 */

/** @typedef {'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED'} DataStatus */
/** @typedef {'validated' | 'testing' | 'unvalidated' | 'historical'} ValidationStatus */

/** Active GT7 game / update version string (patch). */
export const ACTIVE_GT7_GAME_VERSION = "1.72";

/** Last fully measured R79 baseline patch. Not deleted when 1.72 is active. */
export const LAST_VALIDATED_GT7_GAME_VERSION = "1.71";

/**
 * Calculation baseline remains the last validated 1.71 physics bucket.
 * GT7 1.72 changed suspension/differential defaults and some wheel FFB, but
 * those numbers have not been remeasured. Switching this id would re-rank
 * stored wheel evidence without new measurements.
 */
export const ACTIVE_PHYSICS_GENERATION = "GT7_1_71_PHYSICS";

/** Introduced with GT7 1.72. Not the calculation baseline until handling is revalidated. */
export const GT7_1_72_PHYSICS_GENERATION = "GT7_1_72_PHYSICS";

/** Last validated measurable physics bucket (GT7 1.71). */
export const GT7_1_71_PHYSICS_GENERATION = "GT7_1_71_PHYSICS";

/** Pre-1.71 / prior physics bucket for historical ALR and older R79 data. */
export const PRE_1_71_PHYSICS_GENERATION = "PRE_1_71";

/** Fallback when a record has no physics metadata (backwards compatible). */
export const UNKNOWN_PHYSICS_GENERATION = "UNKNOWN_PRE_1_71";

/** Human-readable label for the active patch. */
export const ACTIVE_GT7_PHYSICS_LABEL = "1.72";

/** Last R79 validation of the 1.71 measurable baseline. */
export const R79_PHYSICS_LAST_VALIDATION = "2026-08-20";

/** Date the active game version moved to 1.72. Not a full revalidation. */
export const R79_GT7_172_UPDATE = "2026-10-15";

/**
 * Gr.1–Gr.4 default suspension and differential changed in GT7 1.72.
 * Existing handling numbers stay as 1.71 baseline evidence.
 */
export const GR_CLASS_HANDLING_VALIDATION = {
  "Gr.1": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten.",
  },
  "Gr.2": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten.",
  },
  "Gr.3": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Rotation, traction, stability, and braking measurements remain last verified under 1.71.",
  },
  "Gr.4": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten.",
  },
};

/**
 * @typedef {Object} Gt7PhysicsConfig
 * @property {string} gameVersion
 * @property {string} physicsGeneration
 * @property {DataStatus} dataStatus
 * @property {boolean} validatedAfterUpdate
 * @property {string} label
 * @property {string} lastR79Validation
 */

/** @type {Gt7PhysicsConfig} */
export const ACTIVE_GT7_PHYSICS = {
  gameVersion: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  dataStatus: "CURRENT",
  validatedAfterUpdate: false,
  label: ACTIVE_GT7_PHYSICS_LABEL,
  lastR79Validation: R79_PHYSICS_LAST_VALIDATION,
  contentUpdate: R79_GT7_172_UPDATE,
};

/**
 * Registry of known physics generations for future GT7 updates.
 * Add a new entry when physics changes; keep old generations as HISTORICAL.
 *
 * @type {Record<string, {
 *   id: string,
 *   gameVersionIntroduced: string,
 *   dataStatus: DataStatus,
 *   notes: string,
 * }>}
 */
export const PHYSICS_GENERATION_REGISTRY = {
  [PRE_1_71_PHYSICS_GENERATION]: {
    id: PRE_1_71_PHYSICS_GENERATION,
    gameVersionIntroduced: "pre-1.71",
    dataStatus: "HISTORICAL",
    notes: "R79 / ALR data collected before GT7 1.71 physics generation.",
  },
  [GT7_1_71_PHYSICS_GENERATION]: {
    id: GT7_1_71_PHYSICS_GENERATION,
    gameVersionIntroduced: LAST_VALIDATED_GT7_GAME_VERSION,
    dataStatus: "CURRENT",
    notes: "Last validated calculation baseline. Still used while GT7 1.72 handling awaits verification.",
  },
  [GT7_1_72_PHYSICS_GENERATION]: {
    id: GT7_1_72_PHYSICS_GENERATION,
    gameVersionIntroduced: ACTIVE_GT7_GAME_VERSION,
    dataStatus: "TESTING",
    notes: "GT7 1.72 changed default suspension, differential, and some wheel FFB. Not the calculation baseline until those effects are remeasured.",
  },
};

/**
 * @param {string} [physicsGeneration]
 * @returns {boolean}
 */
export function isCurrentPhysicsGeneration(physicsGeneration) {
  return physicsGeneration === ACTIVE_PHYSICS_GENERATION;
}

/**
 * @param {string} [physicsGeneration]
 * @returns {boolean}
 */
export function isHistoricalPhysicsGeneration(physicsGeneration) {
  if (!physicsGeneration) {
    return true;
  }

  return (
    physicsGeneration === PRE_1_71_PHYSICS_GENERATION ||
    physicsGeneration === UNKNOWN_PHYSICS_GENERATION ||
    !isCurrentPhysicsGeneration(physicsGeneration)
  );
}

/**
 * Compact status line for chrome indicator.
 * @returns {string}
 */
export function formatGt7PhysicsStatusLine() {
  return `GT7 Physics: ${ACTIVE_GT7_PHYSICS_LABEL} ✓ Current`;
}

/**
 * Detail rows for the expandable status indicator.
 * @returns {{ label: string, value: string }[]}
 */
export function getGt7PhysicsStatusDetails() {
  return [
    { label: "Game Version", value: ACTIVE_GT7_GAME_VERSION },
    { label: "Physics Generation", value: ACTIVE_PHYSICS_GENERATION },
    {
      label: "Last validated baseline",
      value: `${LAST_VALIDATED_GT7_GAME_VERSION} (${R79_PHYSICS_LAST_VALIDATION})`,
    },
  ];
}
