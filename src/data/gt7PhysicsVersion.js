/**
 * Central GT7 game-update vs R79 physics-generation awareness.
 *
 * gameVersion (patch) and physicsGeneration are intentionally separate:
 * a content-only GT7 update can keep the same physics generation active.
 *
 * As of 2026-11-04:
 * - Active game version: 1.72
 * - Active physics generation: 1.71_PLUS
 *   (GT7 1.71 tyre/surface/suspension/steering physics + continuing 1.72 content)
 */

/** @typedef {'CURRENT' | 'HISTORICAL' | 'TESTING' | 'UNVALIDATED'} DataStatus */
/** @typedef {'validated' | 'testing' | 'unvalidated' | 'historical'} ValidationStatus */

/** Active GT7 game / update version string (patch). */
export const ACTIVE_GT7_GAME_VERSION = "1.72";

/** Last fully measured R79 baseline patch before 1.72 content overlays. */
export const LAST_VALIDATED_GT7_GAME_VERSION = "1.71";

/**
 * Active calculation physics generation.
 * GT7 1.71 introduced the current tyre/surface/suspension/steering physics era.
 * GT7 1.72 continues that era with BoP, defaults, and controller FFB revisions.
 */
export const ACTIVE_PHYSICS_GENERATION = "GT7_1_71_PLUS";

/** Alias for human-readable / external docs. */
export const PHYSICS_GENERATION_LABEL = "1.71_PLUS";

/** Legacy id used by older stored evidence — treated as same physics era as 1.71_PLUS. */
export const GT7_1_71_PHYSICS_GENERATION = "GT7_1_71_PHYSICS";

/** Introduced with GT7 1.72 content layer (not a separate tyre-physics era). */
export const GT7_1_72_PHYSICS_GENERATION = "GT7_1_72_PHYSICS";

/** Active generation constant (explicit). */
export const GT7_1_71_PLUS_PHYSICS_GENERATION = "GT7_1_71_PLUS";

/** Pre-1.71 / prior physics bucket for historical ALR and older R79 data. */
export const PRE_1_71_PHYSICS_GENERATION = "PRE_1_71";

/** Fallback when a record has no physics metadata (backwards compatible). */
export const UNKNOWN_PHYSICS_GENERATION = "UNKNOWN_PRE_1_71";

/** Human-readable label for the active patch. */
export const ACTIVE_GT7_PHYSICS_LABEL = "1.72";

/** Snapshot date for the current R79 GT7 intelligence baseline. */
export const R79_GT7_DATA_SNAPSHOT_DATE = "2026-11-04";

/** Version stamp for recommendation caches / diagnostics. */
export const R79_GT7_DATA_SNAPSHOT_VERSION = "gt7-1.72-2026-11-04";

/** Last R79 validation of the measurable 1.71 physics baseline tables. */
export const R79_PHYSICS_LAST_VALIDATION = "2026-08-20";

/** Date the active game version moved to 1.72. */
export const R79_GT7_172_UPDATE = "2026-10-15";

/**
 * Generations that share the post-1.71 tyre/steering physics era.
 * Stored evidence tagged GT7_1_71_PHYSICS remains valid under 1.71_PLUS.
 */
export const CURRENT_PHYSICS_ERA_IDS = new Set([
  GT7_1_71_PLUS_PHYSICS_GENERATION,
  GT7_1_71_PHYSICS_GENERATION,
  ACTIVE_PHYSICS_GENERATION,
]);

/**
 * Official GT7 1.71 physics-change themes accounted for by R79 models.
 * These are generation flags — not invented coefficients.
 */
export const GT7_171_OFFICIAL_PHYSICS_CHANGES = [
  "revised_tyre_physics_during_wheel_slip",
  "revised_road_surface_resistance",
  "revised_rolling_resistance",
  "revised_tyre_heating",
  "revised_tyre_wear",
  "revised_off_track_grip_loss_when_real",
  "refined_engine_torque_control",
  "improved_partial_throttle_speed_control",
  "revised_suspension_physics",
  "revised_steering_physics",
  "optimized_steering_geometry_per_car",
  "revised_damper_characteristics",
  "revised_suspension_default_settings_ranges",
  "revised_differential_default_settings_ranges",
  "revised_aerodynamic_default_settings_ranges",
];

/**
 * Official GT7 1.72 content / controller themes on top of 1.71_PLUS physics.
 */
export const GT7_172_OFFICIAL_CONTENT_CHANGES = [
  "revised_suspension_defaults_gr1_gr4",
  "revised_differential_defaults_gr1_gr4",
  "revised_ballast_restrictions_positioning",
  "revised_t598_force_feedback",
  "revised_logitech_rs50_force_feedback",
  "native_moza_r5s_pro_support",
  "current_1_72_bop_updates",
  "mazda_rx_vision_gt3_evo_26",
];

/**
 * Gr.1–Gr.4 default suspension and differential changed in GT7 1.72.
 * Existing handling measurements remain last verified under 1.71 unless remeasured.
 *
 * @type {Record<string, {
 *   lastValidatedGameVersion: string,
 *   status: string,
 *   note: string,
 * }>}
 */
export const GR_CLASS_HANDLING_VALIDATION = {
  "Gr.1": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten without remeasurement.",
  },
  "Gr.2": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten without remeasurement.",
  },
  "Gr.3": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Absolute mid BoP overlays are current where observed; rotation/stability remain last verified under 1.71 unless remeasured.",
  },
  "Gr.4": {
    lastValidatedGameVersion: LAST_VALIDATED_GT7_GAME_VERSION,
    status: "AWAITING_1_72_VERIFICATION",
    note: "Default suspension and differential changed in GT7 1.72. Handling numbers were not rewritten without remeasurement.",
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
 * @property {string} [contentUpdate]
 * @property {string} [snapshotDate]
 * @property {string} [snapshotVersion]
 */

/** @type {Gt7PhysicsConfig} */
export const ACTIVE_GT7_PHYSICS = {
  gameVersion: ACTIVE_GT7_GAME_VERSION,
  physicsGeneration: ACTIVE_PHYSICS_GENERATION,
  dataStatus: "CURRENT",
  validatedAfterUpdate: true,
  label: ACTIVE_GT7_PHYSICS_LABEL,
  lastR79Validation: R79_PHYSICS_LAST_VALIDATION,
  contentUpdate: R79_GT7_172_UPDATE,
  snapshotDate: R79_GT7_DATA_SNAPSHOT_DATE,
  snapshotVersion: R79_GT7_DATA_SNAPSHOT_VERSION,
};

/**
 * Registry of known physics generations for future GT7 updates.
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
    dataStatus: "HISTORICAL",
    notes:
      "Legacy id for the 1.71 measurable baseline. Same physics era as GT7_1_71_PLUS; kept for stored evidence compatibility.",
  },
  [GT7_1_71_PLUS_PHYSICS_GENERATION]: {
    id: GT7_1_71_PLUS_PHYSICS_GENERATION,
    gameVersionIntroduced: LAST_VALIDATED_GT7_GAME_VERSION,
    dataStatus: "CURRENT",
    notes:
      "Active R79 physics generation: GT7 1.71 tyre/surface/suspension/steering physics continuing through GT7 1.72 content, BoP, and controller revisions.",
  },
  [GT7_1_72_PHYSICS_GENERATION]: {
    id: GT7_1_72_PHYSICS_GENERATION,
    gameVersionIntroduced: ACTIVE_GT7_GAME_VERSION,
    dataStatus: "TESTING",
    notes:
      "Reserved for a future fully-remeasured 1.72 handling bucket. Not required while 1.71_PLUS remains the active physics era.",
  },
};

/**
 * @param {string} [physicsGeneration]
 * @returns {boolean}
 */
export function isCurrentPhysicsGeneration(physicsGeneration) {
  if (!physicsGeneration) {
    return false;
  }
  return CURRENT_PHYSICS_ERA_IDS.has(physicsGeneration);
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
 * Weight multiplier for empirical evidence by physics generation.
 * Physics-sensitive tyre/FFB conclusions must prefer post-1.71 evidence.
 *
 * @param {string} [physicsGeneration]
 * @returns {number} 0–1
 */
export function getPhysicsEvidenceWeight(physicsGeneration) {
  if (isCurrentPhysicsGeneration(physicsGeneration)) {
    return 1;
  }
  if (
    physicsGeneration === PRE_1_71_PHYSICS_GENERATION ||
    physicsGeneration === UNKNOWN_PHYSICS_GENERATION ||
    !physicsGeneration
  ) {
    return 0.35;
  }
  return 0.55;
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
    {
      label: "Physics Generation",
      value: `${PHYSICS_GENERATION_LABEL} (${ACTIVE_PHYSICS_GENERATION})`,
    },
    { label: "Data Snapshot", value: R79_GT7_DATA_SNAPSHOT_VERSION },
    {
      label: "Last measurable baseline",
      value: `${LAST_VALIDATED_GT7_GAME_VERSION} (${R79_PHYSICS_LAST_VALIDATION})`,
    },
  ];
}
