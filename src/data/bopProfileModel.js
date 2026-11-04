/**
 * BoP speed-profile structural model for GT7 1.72.
 *
 * Current evidence:
 * - Gr.1 / Gr.2 / Gr.4: High / Mid / Low BoP are commonly identical.
 * - Gr.3: High / Mid / Low BoP are NOT commonly identical — keep separate tables.
 *
 * Never copy High into Mid/Low unless verified common.
 */

/** @typedef {'high' | 'mid' | 'low'} BopSpeedCategory */
/** @typedef {'separate' | 'common'} BopProfileMode */

/**
 * @type {Record<string, {
 *   mode: BopProfileMode,
 *   profiles: BopSpeedCategory[],
 *   note: string,
 * }>}
 */
export const CLASS_BOP_PROFILE_RULES = {
  "Gr.1": {
    mode: "common",
    profiles: ["high", "mid", "low"],
    note: "High / Mid / Low BoP are commonly the same for Gr.1 under current 1.72 evidence.",
  },
  "Gr.2": {
    mode: "common",
    profiles: ["high", "mid", "low"],
    note: "High / Mid / Low BoP are commonly the same for Gr.2 under current 1.72 evidence.",
  },
  "Gr.3": {
    mode: "separate",
    profiles: ["high", "mid", "low"],
    note: "Gr.3 High / Mid / Low BoP differ. Do not treat them as interchangeable.",
  },
  "Gr.4": {
    mode: "common",
    profiles: ["high", "mid", "low"],
    note: "High / Mid / Low BoP are commonly the same for Gr.4 under current 1.72 evidence.",
  },
};

/**
 * @param {string} carClass
 * @returns {{ mode: BopProfileMode, profiles: BopSpeedCategory[], note: string }}
 */
export function getClassBopProfileRule(carClass) {
  return (
    CLASS_BOP_PROFILE_RULES[carClass] ?? {
      mode: "separate",
      profiles: ["high", "mid", "low"],
      note: "Unknown class — keep BoP profiles separate until verified.",
    }
  );
}

/**
 * Resolve which BoP category key to read for a class.
 * For common-profile classes, scoring may use a single shared profile when
 * separate measurements do not exist. For Gr.3, always honour the requested category.
 *
 * @param {string} carClass
 * @param {BopSpeedCategory} [requested]
 * @returns {BopSpeedCategory}
 */
export function resolveBopCategoryForClass(carClass, requested = "mid") {
  const rule = getClassBopProfileRule(carClass);
  const category = ["high", "mid", "low"].includes(requested)
    ? requested
    : "mid";

  if (rule.mode === "common") {
    // Common classes still accept the requested label for diagnostics,
    // but callers should not invent divergent high/mid/low numbers.
    return category;
  }

  return category;
}

/**
 * @param {string} carClass
 * @returns {boolean}
 */
export function classUsesSeparateBopProfiles(carClass) {
  return getClassBopProfileRule(carClass).mode === "separate";
}
