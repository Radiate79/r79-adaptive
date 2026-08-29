import { CHAMPIONSHIP_ADVISOR_VERSION } from "../data/championshipAdvisor171.js";
import { isHistoricalPhysicsGeneration } from "../data/gt7PhysicsVersion.js";
import { getCommunityConfidence } from "../utils/recommendationScoring.js";

/** @typedef {'HIGH' | 'MEDIUM' | 'LOW'} AdvisorConfidenceLevel */

/**
 * @param {{
 *   car?: { communityConfidence?: number, competitiveUse?: string },
 *   trackFitScore?: number,
 *   historicalScore?: number,
 *   hasCurrent171Profile?: boolean,
 *   hasTrackEvidence?: boolean,
 * }} input
 * @returns {{ level: AdvisorConfidenceLevel, label: string, note: string }}
 */
export function resolveAdvisorConfidence(input) {
  const community = getCommunityConfidence(input.car ?? {});
  const trackFit = Number(input.trackFitScore ?? 0);
  const historical = Number(input.historicalScore ?? 0);
  const has171 = input.hasCurrent171Profile !== false;
  const hasEvidence = Boolean(input.hasTrackEvidence) || historical > 0;
  const unknownDimensions = Number(input.unknownDimensionCount ?? 0);

  let score = 40;

  if (has171) {
    score += 18;
  }

  if (trackFit >= 82) {
    score += 16;
  } else if (trackFit >= 74) {
    score += 10;
  } else if (trackFit >= 65) {
    score += 4;
  }

  if (community == null) {
    score -= 10;
  } else if (community >= 85) {
    score += 12;
  } else if (community >= 70) {
    score += 6;
  } else if (community < 50) {
    score -= 6;
  }

  if (hasEvidence) {
    score += 8;
  }

  if (unknownDimensions > 0) {
    score -= Math.min(12, unknownDimensions * 3);
  }

  if (input.car?.competitiveUse === "low") {
    score -= 14;
  }

  if (!has171) {
    score -= 12;
  }

  /** @type {AdvisorConfidenceLevel} */
  let level = "LOW";
  if (score >= 78) {
    level = "HIGH";
  } else if (score >= 58) {
    level = "MEDIUM";
  }

  const note =
    level === "HIGH"
      ? "Current 1.71 model with strong track fit and validated competitive evidence."
      : level === "MEDIUM"
        ? "Based on current 1.71 data — limited real-world validation for this exact scenario."
        : community == null
          ? "Limited evidence / unknown community data — treat as a modelled estimate."
          : "Largely modelled from limited or legacy evidence — treat as exploratory.";

  return {
    level,
    label: level === "HIGH" ? "High confidence" : level === "MEDIUM" ? "Medium confidence" : "Low confidence",
    note,
  };
}

/**
 * Compact data-status line for Championship Advisor UI.
 * @returns {string}
 */
export function formatAdvisorDataStatusLine() {
  return `GT7 Data: v${CHAMPIONSHIP_ADVISOR_VERSION.GT7_VERSION} · Updated ${formatAdvisorUpdateDate(CHAMPIONSHIP_ADVISOR_VERSION.UPDATED)}`;
}

/**
 * @param {string} isoDate
 */
function formatAdvisorUpdateDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * @param {string} [physicsGeneration]
 */
export function getHistoricalEvidenceWeight(physicsGeneration) {
  if (isHistoricalPhysicsGeneration(physicsGeneration)) {
    return 0.45;
  }

  return 1;
}
