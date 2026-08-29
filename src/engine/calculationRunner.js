/**
 * Local calculation request tokens — prevent stale results and duplicate work.
 * Advisor/Pitstop engines are synchronous; this wraps them with request IDs
 * so older async completions never overwrite newer confirmed results.
 */

let nextRequestId = 1;

/** @type {Map<string, Promise<unknown>>} */
const inFlightCalculations = new Map();

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
 *   dedupeKey?: string,
 * }} options
 * @returns {Promise<{ ok: true, value: T, requestId: number, fromCache?: boolean } | { ok: false, reason: 'cancelled' | 'aborted' | 'error', error?: unknown, requestId: number }>}
 */
export async function runCancellableCalculation(options) {
  const { isCurrent, requestId, compute, signal, dedupeKey } = options;

  if (signal?.aborted || !isCurrent(requestId)) {
    return { ok: false, reason: "cancelled", requestId };
  }

  try {
    await Promise.resolve();

    if (signal?.aborted || !isCurrent(requestId)) {
      return { ok: false, reason: "cancelled", requestId };
    }

    let value;
    if (dedupeKey) {
      const existing = inFlightCalculations.get(dedupeKey);
      if (existing) {
        value = /** @type {T} */ (await existing);
      } else {
        const pending = Promise.resolve().then(() => compute());
        inFlightCalculations.set(dedupeKey, pending);
        try {
          value = await pending;
        } finally {
          inFlightCalculations.delete(dedupeKey);
        }
      }
    } else {
      value = compute();
    }

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
  return JSON.stringify(payload);
}

/**
 * Debounce helper for surfaces without an existing Generate button.
 * Updates draft immediately; only invokes onSettle after quiet period (~400ms).
 *
 * @param {number} [delayMs=400]
 */
export function createCalculationDebouncer(delayMs = 400) {
  let timer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
  let latestRequestId = 0;

  return {
    /**
     * @param {(requestId: number) => void} onSettle
     */
    schedule(onSettle) {
      latestRequestId = createCalculationRequestId();
      const requestId = latestRequestId;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        if (requestId === latestRequestId) {
          onSettle(requestId);
        }
      }, delayMs);
      return requestId;
    },
    /**
     * @param {number} requestId
     */
    isCurrent(requestId) {
      return requestId === latestRequestId;
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      latestRequestId = createCalculationRequestId();
    },
    get currentRequestId() {
      return latestRequestId;
    },
  };
}
