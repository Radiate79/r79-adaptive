import { useEffect, useState } from "react";

/**
 * Returns a value that only updates after `delayMs` of stability.
 * Used to separate draft slider state from expensive calculation state
 * without adding visible Generate controls.
 *
 * @template T
 * @param {T} value
 * @param {number} [delayMs=400]
 * @returns {T}
 */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
