import { useEffect, useRef, useState } from "react";
import { createCalculationDebouncer } from "../engine/calculationRunner.js";

/**
 * Debounced stable calculation for surfaces that recalculate live.
 * Draft inputs update immediately; expensive compute runs ~400ms after settle.
 * Stale results are discarded via request IDs.
 *
 * @template TInput
 * @template TResult
 * @param {TInput} draftInput
 * @param {(input: TInput) => TResult} compute
 * @param {{ enabled?: boolean, delayMs?: number, serialize?: (input: TInput) => string }} [options]
 * @returns {{ result: TResult | null, isCalculating: boolean, settledInput: TInput | null }}
 */
export function useDebouncedCalculation(draftInput, compute, options = {}) {
  const {
    enabled = true,
    delayMs = 400,
    serialize = (input) => JSON.stringify(input),
  } = options;

  const [result, setResult] = useState(/** @type {TResult | null} */ (null));
  const [settledInput, setSettledInput] = useState(/** @type {TInput | null} */ (null));
  const [isCalculating, setIsCalculating] = useState(false);
  const debouncerRef = useRef(createCalculationDebouncer(delayMs));
  const computeRef = useRef(compute);
  computeRef.current = compute;

  useEffect(() => {
    if (!enabled) {
      debouncerRef.current.cancel();
      setIsCalculating(false);
      return undefined;
    }

    setIsCalculating(true);
    const key = serialize(draftInput);

    const requestId = debouncerRef.current.schedule((settledId) => {
      if (!debouncerRef.current.isCurrent(settledId)) {
        return;
      }

      try {
        const next = computeRef.current(draftInput);
        if (!debouncerRef.current.isCurrent(settledId)) {
          return;
        }
        setResult(next);
        setSettledInput(draftInput);
      } finally {
        if (debouncerRef.current.isCurrent(settledId)) {
          setIsCalculating(false);
        }
      }
    });

    return () => {
      // Keep latest timer; only cancel on unmount via separate effect.
      void requestId;
      void key;
    };
  }, [draftInput, enabled, serialize]);

  useEffect(() => {
    const debouncer = debouncerRef.current;
    return () => {
      debouncer.cancel();
    };
  }, []);

  return { result, isCalculating, settledInput };
}
