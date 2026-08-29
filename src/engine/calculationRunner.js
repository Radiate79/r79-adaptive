/**
 * Local calculation request tokens — prevent stale results and duplicate work.
 * Advisor/Pitstop engines are synchronous; this wraps them with request IDs
 * so older async completions never overwrite newer confirmed results.
 */

let nextRequestId = 1;

/**
 * @returns {number}
 */
export function createCalculationRequestId() {
  nextRequestId += 1;
  return nextRequestId;
}

/**
 * @template T
 * @param {{
 *   isCurrent: (requestId: number) => boolean,
 *   requestId: number,
 *   compute: () => T,
 *   signal?: AbortSignal,
 * }} options
 * @returns {Promise<{ ok: true, value: T, requestId: number, fromCache?: boolean } | { ok: false, reason: 'cancelled' | 'aborted' | 'error', error?: unknown, requestId: number }>}
 */
export async function runCancellableCalculation(options) {
  const { isCurrent, requestId, compute, signal } = options;

  if (signal?.aborted || !isCurrent(requestId)) {
    return { ok: false, reason: "cancelled", requestId };
  }

  try {
    // Yield so React can paint loading state before heavy sync work.
    await Promise.resolve();

    if (signal?.aborted || !isCurrent(requestId)) {
      return { ok: false, reason: "cancelled", requestId };
    }

    const value = compute();

    if (signal?.aborted || !isCurrent(requestId)) {
      return { ok: false, reason: "cancelled", requestId };
    }

    return { ok: true, value, requestId };
  } catch (error) {
    if (signal?.aborted || !isCurrent(requestId)) {
      return { ok: false, reason: "cancelled", requestId };
    }

    return { ok: false, reason: "error", error, requestId };
  }
}

/**
 * Stable fingerprint for "inputs changed since last confirmed result".
 * @param {unknown} payload
 * @returns {string}
 */
export function fingerprintCalculationInputs(payload) {
  return JSON.stringify(payload, Object.keys(/** @type {object} */ (payload ?? {})).sort());
}
