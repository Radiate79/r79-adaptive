/**
 * Deterministic recommendation memoisation.
 * Safe for pure lookups; invalidated automatically by key changes.
 */

const MAX_ENTRIES = 64;

/** @type {Map<string, unknown>} */
const cache = new Map();

/**
 * @param {unknown} value
 */
function stableSerialize(value) {
  if (value == null) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  const keys = Object.keys(/** @type {Record<string, unknown>} */ (value)).sort();
  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(
          /** @type {Record<string, unknown>} */ (value)[key],
        )}`,
    )
    .join(",")}}`;
}

/**
 * @param {string} namespace
 * @param {unknown} keyPayload
 */
export function buildRecommendationCacheKey(namespace, keyPayload) {
  return `${namespace}:${stableSerialize(keyPayload)}`;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function hasCachedRecommendation(key) {
  return cache.has(key);
}

/**
 * @template T
 * @param {string} key
 * @param {() => T} compute
 * @returns {T}
 */
export function getCachedRecommendation(key, compute) {
  if (cache.has(key)) {
    return /** @type {T} */ (cache.get(key));
  }

  const value = compute();
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, value);
  return value;
}

export function clearRecommendationCache() {
  cache.clear();
}

export function getRecommendationCacheSize() {
  return cache.size;
}
