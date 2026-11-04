import {
  ACTIVE_PHYSICS_GENERATION,
  getPhysicsEvidenceWeight,
  PRE_1_71_PHYSICS_GENERATION,
} from "./gt7PhysicsVersion.js";

/** GT7 Gr.1–Gr.4 dry and wet compounds supported by R79. */
export const TYRE_COMPOUND_OPTIONS = ["S", "M", "H", "IM", "W"];

/**
 * Relative wear rate used by recommendation engines (higher = faster wear).
 * These are relative compound indices — not fabricated lap-life values.
 * Physics-sensitive empirical stints must carry their own physicsGeneration.
 */
export const TYRE_COMPOUND_WEAR = {
  S: 1.05,
  M: 1,
  H: 0.85,
  IM: 0.8,
  W: 0.9,
};

/** Active tyre physics generation for current recommendations. */
export const ACTIVE_TYRE_PHYSICS_GENERATION = ACTIVE_PHYSICS_GENERATION;

/** Historical tyre physics bucket (pre-1.71 slip/heat/wear behaviour). */
export const PRE_1_71_TYRE_PHYSICS_GENERATION = PRE_1_71_PHYSICS_GENERATION;

/**
 * Weight for tyre/stint evidence under the active physics generation.
 * @param {string} [physicsGeneration]
 * @returns {number}
 */
export function getTyrePhysicsEvidenceWeight(physicsGeneration) {
  return getPhysicsEvidenceWeight(physicsGeneration);
}

/**
 * @param {string} [compound]
 * @returns {number}
 */
export function getCompoundTyreModifier(compound) {
  return TYRE_COMPOUND_WEAR[compound] ?? 1;
}

/**
 * @param {string} [compound]
 * @returns {string}
 */
export function getTyreCompoundDisplayLabel(compound) {
  const value = normalizeTyreCompound(compound);
  return TYRE_COMPOUND_DISPLAY_LABELS[value] ?? value;
}

/** GT7 compound codes → user-facing labels for recommendations. */
export const TYRE_COMPOUND_DISPLAY_LABELS = {
  S: "Racing Softs",
  M: "Racing Mediums",
  H: "Racing Hards",
  IM: "Intermediates",
  W: "Wet Tyres",
};

/**
 * @param {string} [compound]
 * @returns {string}
 */
export function normalizeTyreCompound(compound) {
  const value = String(compound ?? "M").trim().toUpperCase();
  return TYRE_COMPOUND_OPTIONS.includes(value) ? value : "M";
}
