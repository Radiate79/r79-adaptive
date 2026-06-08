/** GT7 Gr.1–Gr.4 dry and wet compounds supported by R79. */
export const TYRE_COMPOUND_OPTIONS = ["S", "M", "H", "IM", "W"];

/** Relative wear rate used by recommendation engines (higher = faster wear). */
export const TYRE_COMPOUND_WEAR = {
  S: 1.05,
  M: 1,
  H: 0.85,
  IM: 0.8,
  W: 0.9,
};

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
export function normalizeTyreCompound(compound) {
  const value = String(compound ?? "M").trim().toUpperCase();
  return TYRE_COMPOUND_OPTIONS.includes(value) ? value : "M";
}
