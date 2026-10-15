import calibration from "../data/alr/alrRaceCalibration.json" with { type: "json" };

/**
 * Real-race ALR driver-pace calibration.
 * Times are event-relative. This module does not rank cars, plan pits, or set wheels.
 */

export const ALR_BENCHMARK_METRICS = Object.freeze([
  "qualifying",
  "sprintFastestLap",
  "sprintTotal",
  "featureFastestLap",
  "featureTotal",
]);

export const ALR_LAP_METRICS = Object.freeze([
  "qualifying",
  "sprintFastestLap",
  "featureFastestLap",
]);

export const ALR_PACE_TRANSITIONS = Object.freeze([
  "qualifyingToSprintFastestLap",
  "qualifyingToFeatureFastestLap",
  "sprintToFeatureFastestLap",
]);

export const ALR_BENCHMARK_SOURCE = "ALR_REAL_RACE_RESULTS";

const ENRICHMENT_KEYS = Object.freeze([
  "trackId",
  "trackName",
  "carId",
  "tyreCompound",
  "laps",
  "fuelMultiplier",
  "tyreMultiplier",
  "pitStrategy",
  "gt7Version",
  "bopProfile",
]);

const events = Array.isArray(calibration.events) ? calibration.events : [];

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function timeSeconds(value) {
  const seconds = finiteNumber(value);
  if (seconds == null || seconds < 0) {
    return null;
  }
  return seconds;
}

function findEvent(eventId) {
  return events.find((event) => event.eventId === eventId) ?? null;
}

function emptyEnrichment() {
  return {
    trackId: null,
    trackName: null,
    carId: null,
    tyreCompound: null,
    laps: null,
    fuelMultiplier: null,
    tyreMultiplier: null,
    pitStrategy: null,
    gt7Version: null,
    bopProfile: null,
  };
}

/**
 * Reads optional enrichment already present on a record.
 * Missing race-condition fields stay null.
 *
 * @param {Record<string, unknown> | null | undefined} record
 */
export function readALREnrichment(record) {
  const enrichment = emptyEnrichment();
  if (!record || typeof record !== "object") {
    return enrichment;
  }
  for (const key of ENRICHMENT_KEYS) {
    if (record[key] != null && record[key] !== "") {
      enrichment[key] = record[key];
    }
  }
  return enrichment;
}

/**
 * @param {number | null} time
 * @param {number | null} leader
 */
export function gapToLeaderPct(time, leader) {
  if (timeSeconds(time) == null || timeSeconds(leader) == null || leader <= 0) {
    return null;
  }
  return ((time - leader) / leader) * 100;
}

/**
 * Time-distribution percentile for one event and tier.
 * 0 is the tier's fastest recorded time and 100 is its slowest.
 *
 * @param {number} time
 * @param {{ fastestSeconds: number, p25Seconds: number, medianSeconds: number, p75Seconds: number, slowestSeconds: number }} benchmark
 */
export function tierTimePercentile(time, benchmark) {
  const seconds = timeSeconds(time);
  if (seconds == null || !benchmark) {
    return null;
  }

  const anchors = [
    [benchmark.fastestSeconds, 0],
    [benchmark.p25Seconds, 25],
    [benchmark.medianSeconds, 50],
    [benchmark.p75Seconds, 75],
    [benchmark.slowestSeconds, 100],
  ];

  if (anchors.some(([anchor]) => anchor == null)) {
    return null;
  }
  if (seconds <= anchors[0][0]) {
    return 0;
  }
  if (seconds >= anchors[anchors.length - 1][0]) {
    return 100;
  }

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const [startTime, startPct] = anchors[index];
    const [endTime, endPct] = anchors[index + 1];
    if (seconds > endTime) {
      continue;
    }
    if (endTime === startTime) {
      return endPct;
    }
    if (endTime < startTime) {
      return null;
    }
    return startPct + ((seconds - startTime) / (endTime - startTime)) * (endPct - startPct);
  }

  return null;
}

/**
 * Bands follow the event/tier distribution. Lower time is faster.
 *
 * @param {number} time
 * @param {{ p25Seconds: number, medianSeconds: number, p75Seconds: number }} benchmark
 */
export function performanceBandForTime(time, benchmark) {
  const seconds = timeSeconds(time);
  if (
    seconds == null ||
    !benchmark ||
    benchmark.p25Seconds == null ||
    benchmark.medianSeconds == null ||
    benchmark.p75Seconds == null
  ) {
    return null;
  }
  if (seconds <= benchmark.p25Seconds) {
    return "front-running";
  }
  if (seconds <= benchmark.medianSeconds) {
    return "strong";
  }
  if (seconds <= benchmark.p75Seconds) {
    return "mid-pack";
  }
  return "developing";
}

/**
 * @param {{ eventId: string, tier: number | string, metric: string }} query
 */
export function getALRTierBenchmark({ eventId, tier, metric } = {}) {
  if (!ALR_BENCHMARK_METRICS.includes(metric)) {
    return null;
  }

  const event = findEvent(eventId);
  const metricData = event?.metrics?.[metric];
  if (!event || !metricData || metricData.available !== true) {
    return null;
  }

  const tierRow = metricData.byTier?.[String(tier)];
  if (!tierRow) {
    return null;
  }

  const fastestSeconds = timeSeconds(tierRow.fastestSeconds);
  const medianSeconds = timeSeconds(tierRow.medianSeconds);
  const p25Seconds = timeSeconds(tierRow.p25Seconds);
  const p75Seconds = timeSeconds(tierRow.p75Seconds);
  const slowestSeconds = timeSeconds(tierRow.slowestSeconds);
  const overallFastestSeconds = timeSeconds(metricData.overall?.fastestSeconds);
  if (
    fastestSeconds == null ||
    medianSeconds == null ||
    p25Seconds == null ||
    p75Seconds == null ||
    slowestSeconds == null
  ) {
    return null;
  }

  const distribution = {
    fastestSeconds,
    medianSeconds,
    p25Seconds,
    p75Seconds,
    slowestSeconds,
  };

  return {
    eventId: event.eventId,
    tier: Number(tier),
    metric,
    available: true,
    count: finiteNumber(tierRow.count),
    ...distribution,
    medianGapTierLeaderSeconds: finiteNumber(tierRow.medianGapTierLeaderSeconds),
    medianGapTierLeaderPct: finiteNumber(tierRow.medianGapTierLeaderPct),
    gapToTierLeaderPct: 0,
    gapToOverallLeaderSeconds:
      overallFastestSeconds == null ? null : fastestSeconds - overallFastestSeconds,
    gapToOverallLeaderPct: gapToLeaderPct(fastestSeconds, overallFastestSeconds),
    overall: {
      count: finiteNumber(metricData.overall?.count),
      fastestSeconds: overallFastestSeconds,
      medianSeconds: timeSeconds(metricData.overall?.medianSeconds),
      p25Seconds: timeSeconds(metricData.overall?.p25Seconds),
      p75Seconds: timeSeconds(metricData.overall?.p75Seconds),
      slowestSeconds: timeSeconds(metricData.overall?.slowestSeconds),
    },
    bands: {
      "front-running": { maxSeconds: p25Seconds },
      strong: { maxSeconds: medianSeconds },
      "mid-pack": { maxSeconds: p75Seconds },
      developing: { slowerThanSeconds: p75Seconds },
    },
    enrichment: readALREnrichment(event),
    source: ALR_BENCHMARK_SOURCE,
    influencesCarRanking: false,
    influencesPitStop: false,
    influencesWheelSettings: false,
  };
}

/**
 * @param {{ eventId: string, tier: number | string, metric: string, timeSeconds: number }} sample
 */
export function assessALRTime(sample) {
  const seconds = timeSeconds(sample?.timeSeconds);
  const benchmark = getALRTierBenchmark(sample ?? {});
  if (seconds == null || !benchmark) {
    return null;
  }

  return {
    eventId: benchmark.eventId,
    tier: benchmark.tier,
    metric: benchmark.metric,
    timeSeconds: seconds,
    tierPercentile: tierTimePercentile(seconds, benchmark),
    performanceBand: performanceBandForTime(seconds, benchmark),
    gapToTierLeaderSeconds: seconds - benchmark.fastestSeconds,
    gapToTierLeaderPct: gapToLeaderPct(seconds, benchmark.fastestSeconds),
    gapToOverallLeaderSeconds:
      benchmark.overall.fastestSeconds == null
        ? null
        : seconds - benchmark.overall.fastestSeconds,
    gapToOverallLeaderPct: gapToLeaderPct(seconds, benchmark.overall.fastestSeconds),
    bonusApplied: false,
  };
}

/**
 * Raw seconds are comparable only inside one event and metric.
 * Across events the result keeps normalized gaps and omits the raw delta.
 *
 * @param {{ eventId: string, tier: number | string, metric: string, timeSeconds: number }} left
 * @param {{ eventId: string, tier: number | string, metric: string, timeSeconds: number }} right
 */
export function compareALRPace(left, right) {
  const assessedLeft = assessALRTime(left);
  const assessedRight = assessALRTime(right);
  if (!assessedLeft || !assessedRight) {
    return null;
  }

  const sameEvent =
    assessedLeft.eventId === assessedRight.eventId &&
    assessedLeft.metric === assessedRight.metric;

  return {
    sameEvent,
    rawDeltaSeconds: sameEvent
      ? assessedLeft.timeSeconds - assessedRight.timeSeconds
      : null,
    left: assessedLeft,
    right: assessedRight,
  };
}

/**
 * @param {{ eventId: string, tier: number | string, transition: string }} query
 */
export function getALRPaceTransition({ eventId, tier, transition } = {}) {
  if (!ALR_PACE_TRANSITIONS.includes(transition)) {
    return null;
  }
  const event = findEvent(eventId);
  const transitionData = event?.transitions?.[transition];
  if (!transitionData || transitionData.available !== true) {
    return null;
  }
  const tierRow = transitionData.byTier?.[String(tier)];
  if (!tierRow) {
    return null;
  }
  const medianPct = finiteNumber(tierRow.medianPct);
  const p25Pct = finiteNumber(tierRow.p25Pct);
  const p75Pct = finiteNumber(tierRow.p75Pct);
  if (medianPct == null || p25Pct == null || p75Pct == null) {
    return null;
  }
  return {
    eventId,
    tier: Number(tier),
    transition,
    available: true,
    count: finiteNumber(tierRow.count),
    medianPct,
    p25Pct,
    p75Pct,
  };
}

/**
 * Same-event lap delta. Race totals are not compared with lap times.
 *
 * @param {number} qualifyingSeconds
 * @param {number} raceLapSeconds
 */
export function qualifyingToRaceDeltaPct(qualifyingSeconds, raceLapSeconds) {
  const qualifying = timeSeconds(qualifyingSeconds);
  const raceLap = timeSeconds(raceLapSeconds);
  if (qualifying == null || raceLap == null || qualifying <= 0) {
    return null;
  }
  return ((raceLap - qualifying) / qualifying) * 100;
}

/**
 * Focus-driver rows use the same pace maths as every other recorded time.
 *
 * @param {{ eventId: string, metric: string, driverId?: string }} query
 */
export function getALRFocusDriverResult({ eventId, metric, driverId = "Radiate79" } = {}) {
  const event = findEvent(eventId);
  const focus = event?.focusDriver;
  const result = focus?.results?.[metric];
  if (!event || !focus || focus.id !== driverId || !result) {
    return null;
  }

  const seconds = timeSeconds(result.timeSeconds);
  const tier = finiteNumber(result.tier);
  if (seconds == null || tier == null) {
    return null;
  }

  const assessed = assessALRTime({
    eventId,
    tier,
    metric,
    timeSeconds: seconds,
  });
  const qualifying = focus.results?.qualifying;
  const paceRetentionPct = ALR_LAP_METRICS.includes(metric)
    ? qualifyingToRaceDeltaPct(qualifying?.timeSeconds, seconds)
    : null;

  return {
    driverId: focus.id,
    eventId,
    metric,
    tier,
    tierRank: finiteNumber(result.tierRank),
    rank: finiteNumber(result.rank),
    time: typeof result.time === "string" ? result.time : null,
    timeSeconds: seconds,
    gapOverallLeaderSeconds: finiteNumber(result.gapOverallLeaderSeconds),
    gapTierLeaderSeconds: finiteNumber(result.gapTierLeaderSeconds),
    tierPercentile: assessed?.tierPercentile ?? null,
    performanceBand: assessed?.performanceBand ?? null,
    gapToTierLeaderPct: assessed?.gapToTierLeaderPct ?? null,
    gapToOverallLeaderPct: assessed?.gapToOverallLeaderPct ?? null,
    qualifyingToRaceDeltaPct: metric === "qualifying" ? 0 : paceRetentionPct,
    enrichment: readALREnrichment({ ...event, ...result }),
    bonusApplied: false,
    source: ALR_BENCHMARK_SOURCE,
  };
}

export function listALRBenchmarkEvents() {
  return events.map((event) => event.eventId);
}

export function getALRCalibrationMetadata() {
  return {
    schemaVersion: calibration.schemaVersion ?? null,
    datasetId: calibration.datasetId ?? null,
    sourceDatasetId: calibration.sourceDatasetId ?? null,
    purpose: calibration.purpose ?? null,
    restrictions: calibration.restrictions ?? null,
    eventCount: events.length,
    source: ALR_BENCHMARK_SOURCE,
  };
}

/**
 * Publishes the benchmark API for the running app.
 * The assignment is what keeps this dataset in the production bundle.
 */
export function loadALRRaceCalibration() {
  const root = globalThis.R79 ?? {};
  root.alrBenchmark = Object.freeze({
    getTierBenchmark: getALRTierBenchmark,
    assessTime: assessALRTime,
    comparePace: compareALRPace,
    getPaceTransition: getALRPaceTransition,
    getFocusDriverResult: getALRFocusDriverResult,
    listEvents: listALRBenchmarkEvents,
    metadata: getALRCalibrationMetadata(),
  });
  globalThis.R79 = root;
  return root.alrBenchmark.metadata;
}

/**
 * @returns {{ ok: boolean, issues: string[] }}
 */
export function auditALRCalibrationDataset() {
  const issues = [];
  if (events.length !== 5) {
    issues.push(`expected 5 events, found ${events.length}`);
  }

  for (const event of events) {
    if (event.trackId != null || event.trackName != null) {
      issues.push(`${event.eventId} has a track mapping that was not in the verified aggregate`);
    }
    for (const metric of ALR_BENCHMARK_METRICS) {
      const metricData = event.metrics?.[metric];
      if (!metricData) {
        issues.push(`${event.eventId} ${metric} missing`);
        continue;
      }
      if (metricData.available !== true) {
        continue;
      }
      const overallTimes = [
        metricData.overall?.fastestSeconds,
        metricData.overall?.medianSeconds,
        metricData.overall?.p25Seconds,
        metricData.overall?.p75Seconds,
        metricData.overall?.slowestSeconds,
      ];
      for (const value of overallTimes) {
        if (timeSeconds(value) == null) {
          issues.push(`${event.eventId} ${metric} overall time invalid`);
        }
      }
      for (const [tier, row] of Object.entries(metricData.byTier ?? {})) {
        const values = [
          row.fastestSeconds,
          row.medianSeconds,
          row.p25Seconds,
          row.p75Seconds,
          row.slowestSeconds,
        ];
        if (values.some((value) => timeSeconds(value) == null)) {
          issues.push(`${event.eventId} ${metric} tier ${tier} time invalid`);
        }
        if (
          row.p25Seconds > row.medianSeconds ||
          row.medianSeconds > row.p75Seconds ||
          row.fastestSeconds > row.slowestSeconds
        ) {
          issues.push(`${event.eventId} ${metric} tier ${tier} percentile order invalid`);
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
