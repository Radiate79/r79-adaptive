import {
  ALR_LAP_EVIDENCE,
  formatAlrLapTime,
} from "../data/alrLapEvidence.js";
import { getCarsForGame } from "../utils/gameData.js";

/** @type {Record<string, number>} */
const SESSION_WEIGHTS = {
  qualifying: 1,
  sprint: 1.05,
  feature: 1.1,
};

/** @type {Record<number, number>} */
const SESSION_RANK_POINTS = {
  1: 100,
  2: 85,
  3: 70,
  4: 55,
  5: 45,
  6: 35,
  7: 28,
  8: 22,
};

export const ALR_LAP_EVIDENCE_REASON =
  "ALR race lap evidence supports this car at this track.";

export const ALR_LAP_EVIDENCE_MAX_MODIFIER = 4;

/**
 * @param {number} sessionRank
 */
function getSessionRankPoints(sessionRank) {
  return SESSION_RANK_POINTS[sessionRank] ?? Math.max(10, 20 - sessionRank);
}

/**
 * @param {string} trackId
 * @param {string} [carClass]
 */
function getTrackEvidence(trackId, carClass = "Gr.3") {
  return ALR_LAP_EVIDENCE.filter(
    (record) =>
      record.trackId === trackId &&
      (!carClass || record.carClass === carClass),
  );
}

/**
 * Weighted ranking — repeated strong sessions score higher than one fast lap.
 *
 * @param {string} trackId
 * @param {string} [carClass]
 * @param {import("../data/gameVersions.js").GameVersion | string} [gameVersion]
 */
export function getTrackCarRankings(trackId, carClass = "Gr.3", gameVersion = "gt7") {
  const evidence = getTrackEvidence(trackId, carClass);
  if (!evidence.length) {
    return [];
  }

  const carsById = new Map(
    getCarsForGame(gameVersion).map((car) => [car.id, car]),
  );

  /** @type {Map<string, { carId: string, weightedScore: number, bestLapMs: number, sessionCount: number, topThreeCount: number }>} */
  const aggregates = new Map();

  for (const record of evidence) {
    const sessionWeight = SESSION_WEIGHTS[record.sessionType] ?? 1;
    const rankPoints = getSessionRankPoints(record.sessionRank);
    const contribution = sessionWeight * rankPoints;

    const existing = aggregates.get(record.carId) ?? {
      carId: record.carId,
      weightedScore: 0,
      bestLapMs: Number.POSITIVE_INFINITY,
      sessionCount: 0,
      topThreeCount: 0,
    };

    existing.weightedScore += contribution;
    existing.sessionCount += 1;
    if (record.sessionRank <= 3) {
      existing.topThreeCount += 1;
    }
    if (record.lapTimeMs < existing.bestLapMs) {
      existing.bestLapMs = record.lapTimeMs;
    }

    aggregates.set(record.carId, existing);
  }

  const ranked = [...aggregates.values()]
    .map((entry) => {
      const consistencyMultiplier =
        entry.topThreeCount >= 3
          ? 1.25
          : entry.topThreeCount === 2
            ? 1.12
            : 1;
      const carMeta = carsById.get(entry.carId);

      return {
        carId: entry.carId,
        carName: carMeta?.name ?? entry.carId,
        bestLapMs: entry.bestLapMs,
        bestLap: formatAlrLapTime(entry.bestLapMs),
        weightedScore: entry.weightedScore * consistencyMultiplier,
        sessionCount: entry.sessionCount,
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.weightedScore - a.weightedScore;
      if (Math.abs(scoreDiff) > 0.01) {
        return scoreDiff;
      }
      return a.bestLapMs - b.bestLapMs;
    });

  return ranked.map((entry, index) => ({
    rank: index + 1,
    carId: entry.carId,
    carName: entry.carName,
    bestLap: entry.bestLap,
    bestLapMs: entry.bestLapMs,
    weightedScore: Number(entry.weightedScore.toFixed(2)),
    sessionCount: entry.sessionCount,
  }));
}

/**
 * @param {string} trackId
 * @param {string} [carClass]
 */
export function hasAlrLapEvidence(trackId, carClass = "Gr.3") {
  return getTrackEvidence(trackId, carClass).length > 0;
}

/**
 * @param {string} carId
 * @param {string} trackId
 * @param {string} [carClass]
 */
export function getAlrLapEvidenceBonus(carId, trackId, carClass = "Gr.3") {
  const rankings = getTrackCarRankings(trackId, carClass);
  if (!rankings.length) {
    return 0;
  }

  const entry = rankings.find((row) => row.carId === carId);
  if (!entry) {
    return 0;
  }

  const leaderScore = rankings[0].weightedScore;
  if (!leaderScore) {
    return 0;
  }

  const normalized = entry.weightedScore / leaderScore;
  return Number((normalized * ALR_LAP_EVIDENCE_MAX_MODIFIER).toFixed(2));
}

/**
 * @param {string} trackId
 * @param {string} [carClass]
 * @param {import("../data/gameVersions.js").GameVersion | string} [gameVersion]
 */
export function getTrackAlrPaceSummary(trackId, carClass = "Gr.3", gameVersion = "gt7") {
  const rankings = getTrackCarRankings(trackId, carClass, gameVersion);
  if (!rankings.length) {
    return null;
  }

  const fastest = rankings[0];

  return {
    trackId,
    carClass,
    fastestCar: fastest.carName,
    fastestCarId: fastest.carId,
    fastestLap: fastest.bestLap,
    rankings,
  };
}
