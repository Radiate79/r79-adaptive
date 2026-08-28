/**
 * Shared race-condition multiplier helpers.
 * Zero is a valid explicit value (disabled fuel/tyre wear in GT7).
 */

/**
 * @param {unknown} value
 * @param {number} [fallback=1]
 * @returns {number}
 */
export function normalizeRaceMultiplier(value, fallback = 1) {
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
