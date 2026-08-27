/**
 * Recommendation confidence / quality states for Wheel Settings.
 * Only mark VALIDATED when supporting data exists.
 */

/** @typedef {'VALIDATED'|'COMMUNITY_VALIDATED'|'OPTIMISED'|'BASELINE'|'TESTING'|'NEEDS_VALIDATION'|'NEEDS_RETEST'|'NEEDS_VERIFICATION'} RecommendationConfidence */

/** @type {Record<RecommendationConfidence, string>} */
export const CONFIDENCE_LABELS = {
  VALIDATED: "Validated",
  COMMUNITY_VALIDATED: "Community validated",
  OPTIMISED: "Optimised",
  BASELINE: "Baseline",
  TESTING: "Testing",
  NEEDS_VALIDATION: "Needs validation",
  NEEDS_RETEST: "Needs retest",
  NEEDS_VERIFICATION: "Needs verification",
};

/**
 * @param {{
 *   matchType?: string,
 *   isValidated?: boolean,
 *   hasEmptyValues?: boolean,
 *   podiumAdjusted?: boolean,
 *   physicsHistorical?: boolean,
 *   platformValidationState?: string,
 *   dualBothValidated?: boolean,
 * }} input
 * @returns {{
 *   confidence: RecommendationConfidence,
 *   label: string,
 *   note: string,
 * }}
 */
export function resolveRecommendationConfidence(input) {
  const matchType = String(input.matchType ?? "none");

  if (input.hasEmptyValues) {
    return {
      confidence: "NEEDS_VERIFICATION",
      label: CONFIDENCE_LABELS.NEEDS_VERIFICATION,
      note: "Device schema is shown, but recommended values still need verification for this wheel base.",
    };
  }

  if (input.physicsHistorical && input.isValidated) {
    return {
      confidence: "NEEDS_RETEST",
      label: CONFIDENCE_LABELS.NEEDS_RETEST,
      note: "Previously validated under an older physics generation — keep using as a strong starting point, then retest on current GT7.",
    };
  }

  if (
    (matchType === "validated" || matchType === "exact") &&
    input.isValidated &&
    !input.physicsHistorical
  ) {
    if (input.podiumAdjusted) {
      return {
        confidence: "OPTIMISED",
        label: CONFIDENCE_LABELS.OPTIMISED,
        note: "Validated device profile with bounded adjustments for car, track and race conditions.",
      };
    }
    return {
      confidence: "VALIDATED",
      label: CONFIDENCE_LABELS.VALIDATED,
      note: "Supported by validated R79 profile data for this wheel base.",
    };
  }

  if (matchType.startsWith("validated") && input.isValidated) {
    if (input.podiumAdjusted) {
      return {
        confidence: "OPTIMISED",
        label: CONFIDENCE_LABELS.OPTIMISED,
        note: "Validated profile family adapted for this combination and race objective.",
      };
    }
    return {
      confidence: "VALIDATED",
      label: CONFIDENCE_LABELS.VALIDATED,
      note: "Derived from validated class/device data — not an exact car×track lab match.",
    };
  }

  if (
    String(input.platformValidationState ?? "").toUpperCase() === "TESTING" ||
    matchType === "similar" ||
    matchType === "carTrack"
  ) {
    return {
      confidence: "TESTING",
      label: CONFIDENCE_LABELS.TESTING,
      note: "Usable recommendation while this exact combination remains in testing.",
    };
  }

  if (
    matchType === "classStarter" ||
    matchType === "wheelOnly" ||
    matchType === "wheelFamily" ||
    matchType === "validatedClass" ||
    matchType === "validatedWheelOnly" ||
    matchType === "validatedWheelFamily"
  ) {
    return {
      confidence: "BASELINE",
      label: CONFIDENCE_LABELS.BASELINE,
      note: "Safe device-legal baseline for this combination — needs validation for the exact car and track.",
    };
  }

  if (matchType === "none" || !matchType) {
    return {
      confidence: "NEEDS_VALIDATION",
      label: CONFIDENCE_LABELS.NEEDS_VALIDATION,
      note: "No strong profile match — using the best available device-safe fallback.",
    };
  }

  return {
    confidence: "NEEDS_VALIDATION",
    label: CONFIDENCE_LABELS.NEEDS_VALIDATION,
    note: "Needs validation for this exact combination.",
  };
}

/**
 * @param {Record<string, string | number> | null | undefined} values
 */
export function valuesLookEmpty(values) {
  if (!values || typeof values !== "object") {
    return true;
  }
  const entries = Object.entries(values).filter(([key]) => key !== "notes");
  if (entries.length === 0) {
    return true;
  }
  return entries.every(([, value]) => {
    const text = String(value ?? "").trim();
    return text === "" || text === "—";
  });
}
