/**
 * Internal verification labels for GT7 data.
 * These never add or subtract recommendation points.
 */

export const DATA_VERIFICATION_STATUS = {
  CONFIRMED_1_72: "CONFIRMED_1_72",
  CURRENT_1_72_OBSERVED: "CURRENT_1_72_OBSERVED",
  LAST_VERIFIED_1_71: "LAST_VERIFIED_1_71",
  AWAITING_1_72_VERIFICATION: "AWAITING_1_72_VERIFICATION",
  UNKNOWN: "UNKNOWN",
};

/**
 * Confidence band for provenance only. Do not multiply into a performance score.
 * @param {string} status
 */
export function verificationConfidenceBand(status) {
  switch (status) {
    case DATA_VERIFICATION_STATUS.CONFIRMED_1_72:
      return "normal";
    case DATA_VERIFICATION_STATUS.CURRENT_1_72_OBSERVED:
      return "slightly_reduced";
    case DATA_VERIFICATION_STATUS.LAST_VERIFIED_1_71:
    case DATA_VERIFICATION_STATUS.AWAITING_1_72_VERIFICATION:
      return "reduced";
    default:
      return "none";
  }
}
