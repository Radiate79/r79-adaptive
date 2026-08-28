/**
 * Central GT7 game-update vs R79 physics-generation awareness.
 *
 * gameVersion (patch) and physicsGeneration are intentionally separate:
 * a content-only GT7 update can keep the same physics generation active.
 */

/** @typedef {'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED'} DataStatus */
/** @typedef {'validated' | 'testing' | 'unvalidated' | 'historical'} ValidationStatus */

/** Active GT7 game / update version string (patch). */
export const ACTIVE_GT7_GAME_VERSION = "1.71";

/**
 * Active R79 physics generation for NEW testing and recommendations.
 * Content-only GT7 patches may keep this identifier unchanged.
 */
export const ACTIVE_PHYSICS_GENERATION = "GT7_1_71_PHYSICS";

/** Pre-1.71 / prior physics bucket for historical ALR and older R79 data. */
export const PRE_1_71_PHYSICS_GENERATION = "PRE_1_71";

/** Fallback when a record has no physics metadata (backwards compatible). */
export const UNKNOWN_PHYSICS_GENERATION = "UNKNOWN_PRE_1_71";

/** Human-readable label for the active patch. */
export const ACTIVE_GT7_PHYSICS_LABEL = "1.71";

/** Last R79 validation / architecture stamp for the active physics generation. */
export const R79_PHYSICS_LAST_VALIDATION = "2026-08-20";

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
  [ACTIVE_PHYSICS_GENERATION]: {
    id: ACTIVE_PHYSICS_GENERATION,
    gameVersionIntroduced: ACTIVE_GT7_GAME_VERSION,
    dataStatus: "CURRENT",
    notes: "Active physics generation for new testing and recommendations.",
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
      label: "Last R79 validation/update",
      value: R79_PHYSICS_LAST_VALIDATION,
    },
  ];
}
