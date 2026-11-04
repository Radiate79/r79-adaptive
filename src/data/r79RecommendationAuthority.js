/**
 * R79 recommendation authority — independence doctrine.
 *
 * R79 must think for itself. Recommendations are derived only from R79's own
 * evidence model. External assistants (including Jucis / ChatGPT) are NEVER
 * a target dataset, never a numerical agreement objective, and must not be
 * copied, approximated, or reverse-engineered.
 *
 * Quality target: competitive, balanced, explainable, useful advice.
 * Final judge: real driving performance + current GT7 evidence.
 */

export const R79_RECOMMENDATION_AUTHORITY_VERSION = "1.0.0";

/** Stable authority id stamped on recommendation provenance. */
export const R79_RECOMMENDATION_AUTHORITY_ID = "R79_INDEPENDENT";

/**
 * Allowed inputs that may influence a recommendation.
 * Anything outside this list is not a scoring target.
 */
export const R79_ALLOWED_RECOMMENDATION_SOURCES = Object.freeze([
  "current_gt7_physics",
  "current_car_data",
  "current_bop",
  "track_requirements",
  "tyres",
  "race_conditions",
  "wheel_base_behaviour",
  "verified_empirical_testing",
  "r79_internal_model",
]);

/**
 * Outcomes R79 optimizes for — never numerical agreement with an external assistant.
 */
export const R79_QUALITY_OBJECTIVES = Object.freeze([
  "lap_performance",
  "race_consistency",
  "driver_control",
  "grip_clarity",
  "stability",
  "rotation",
  "traction",
  "tyre_behaviour",
  "repeatability",
]);

/**
 * Explicitly forbidden external recommendation targets.
 * Names are matched case-insensitively against keys/values that try to inject targets.
 */
export const R79_FORBIDDEN_EXTERNAL_ASSISTANTS = Object.freeze([
  "jucis",
  "chatgpt",
  "chat_gpt",
  "openai",
  "external_assistant",
  "external_expert_target",
  "match_external_settings",
  "copy_external_recommendation",
]);

/**
 * Keys that must never appear on recommendation input as numerical targets.
 */
export const R79_FORBIDDEN_INPUT_KEYS = Object.freeze([
  "jucisSettings",
  "jucisTarget",
  "chatGptSettings",
  "chatgptSettings",
  "externalAssistantSettings",
  "externalTargetSettings",
  "matchExternalMaster",
  "matchExternalDamper",
  "reproduceExternalRecommendation",
  "approximateExternalRecommendation",
]);

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Detect forbidden external-assistant targeting on a recommendation input bag.
 * Does not mutate input. Returns the first offending key/token if found.
 *
 * @param {Record<string, unknown> | null | undefined} input
 * @returns {{ independent: true } | { independent: false, reason: string, offender: string }}
 */
export function assertR79RecommendationIndependence(input) {
  if (input == null || typeof input !== "object") {
    return { independent: true };
  }

  for (const key of Object.keys(input)) {
    const normalizedKey = normalizeToken(key);
    if (R79_FORBIDDEN_INPUT_KEYS.some((k) => normalizeToken(k) === normalizedKey)) {
      return {
        independent: false,
        reason:
          "External assistant target keys are forbidden. R79 derives settings from its own evidence model only.",
        offender: key,
      };
    }
    if (
      R79_FORBIDDEN_EXTERNAL_ASSISTANTS.some(
        (name) =>
          normalizedKey === name ||
          normalizedKey.includes(`${name}_`) ||
          normalizedKey.endsWith(`_${name}`),
      )
    ) {
      return {
        independent: false,
        reason:
          "External assistant identifiers are not allowed as recommendation targets.",
        offender: key,
      };
    }
  }

  return { independent: true };
}

/**
 * Strip forbidden external-target fields from an input bag.
 * R79 never blends remaining values toward an external assistant.
 *
 * @template {Record<string, unknown>} T
 * @param {T} input
 * @returns {T}
 */
export function stripExternalAssistantTargets(input) {
  if (input == null || typeof input !== "object") {
    return input;
  }
  /** @type {Record<string, unknown>} */
  const cleaned = { ...input };
  for (const key of Object.keys(cleaned)) {
    const check = assertR79RecommendationIndependence({ [key]: cleaned[key] });
    if (!check.independent) {
      delete cleaned[key];
    }
  }
  return /** @type {T} */ (cleaned);
}

/**
 * Provenance fragment stamped onto advisor / wheel / strategy outputs.
 */
export function getR79RecommendationAuthorityStamp() {
  return {
    recommendationAuthority: R79_RECOMMENDATION_AUTHORITY_ID,
    recommendationAuthorityVersion: R79_RECOMMENDATION_AUTHORITY_VERSION,
    allowedSources: R79_ALLOWED_RECOMMENDATION_SOURCES,
    qualityObjectives: R79_QUALITY_OBJECTIVES,
    finalJudge: "real_driving_performance_and_current_evidence",
    externalAssistantTargeting: "FORBIDDEN",
    note:
      "R79 recommendations are independent. Different numerical values from other assistants are acceptable when technically justified. Do not optimize for numerical agreement with any external assistant.",
  };
}
