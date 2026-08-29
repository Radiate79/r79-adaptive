/**
 * Shared race-condition multiplier helpers.
 * Zero is a valid explicit value (disabled fuel/tyre wear in GT7).
 * Prefer fallback=0 for wear multipliers so missing values do not invent x1.
 */

/**
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function normalizeRaceMultiplier(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(10, Math.max(0, numeric));
}

/**
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function normalizeStoredRaceMultiplier(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(10, Math.max(0, numeric));
}
