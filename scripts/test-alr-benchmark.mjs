/**
 * ALR real-race benchmark calibration.
 * Confirms pace bands stay event-relative and isolated from car, pit, and wheel engines.
 */

import fs from "node:fs";
import {
  ALR_BENCHMARK_METRICS,
  assessALRTime,
  auditALRCalibrationDataset,
  compareALRPace,
  gapToLeaderPct,
  getALRFocusDriverResult,
  getALRPaceTransition,
  getALRTierBenchmark,
  listALRBenchmarkEvents,
  readALREnrichment,
} from "../src/engine/alrBenchmarkService.js";

let failures = 0;
let passes = 0;

function fail(message) {
  console.error(`FAIL  ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK    ${message}`);
  passes += 1;
}

function assert(condition, message) {
  if (condition) ok(message);
  else fail(message);
}

const events = listALRBenchmarkEvents();
assert(
  events.join(",") === "ALR-BENCH-A,ALR-BENCH-B,ALR-BENCH-C,ALR-BENCH-D,ALR-BENCH-E",
  "all five benchmark events load",
);

const audit = auditALRCalibrationDataset();
assert(audit.ok, audit.ok ? "dataset audit clean" : audit.issues.join("; "));

const tierOneQualifying = getALRTierBenchmark({
  eventId: "ALR-BENCH-A",
  tier: 1,
  metric: "qualifying",
});
assert(
  tierOneQualifying?.available === true &&
    tierOneQualifying.count > 0 &&
    tierOneQualifying.fastestSeconds > 0 &&
    tierOneQualifying.medianGapTierLeaderPct != null,
  "tier information resolves for an available metric",
);

for (const metric of ALR_BENCHMARK_METRICS) {
  const benchmark = getALRTierBenchmark({
    eventId: "ALR-BENCH-A",
    tier: 1,
    metric,
  });
  assert(benchmark?.metric === metric && benchmark.p25Seconds <= benchmark.p75Seconds, `${metric} parses`);
}

const missingFastest = getALRTierBenchmark({
  eventId: "ALR-BENCH-E",
  tier: 1,
  metric: "featureFastestLap",
});
const missingTier = getALRTierBenchmark({
  eventId: "ALR-BENCH-E",
  tier: 1,
  metric: "featureTotal",
});
const unknownMetric = getALRTierBenchmark({
  eventId: "ALR-BENCH-A",
  tier: 1,
  metric: "tyreLife",
});
assert(missingFastest === null && missingTier === null && unknownMetric === null, "missing metrics stay unavailable");

const transition = getALRPaceTransition({
  eventId: "ALR-BENCH-C",
  tier: 8,
  transition: "qualifyingToFeatureFastestLap",
});
const missingTransition = getALRPaceTransition({
  eventId: "ALR-BENCH-E",
  tier: 8,
  transition: "qualifyingToFeatureFastestLap",
});
assert(
  transition?.medianPct != null && Number.isFinite(transition.medianPct) && missingTransition === null,
  "qualifying-to-race transition is used only when recorded",
);

const leader = assessALRTime({
  eventId: "ALR-BENCH-C",
  tier: 8,
  metric: "featureTotal",
  timeSeconds: tierBenchmarkSeconds("ALR-BENCH-C", 8, "featureTotal"),
});
assert(
  leader?.gapToTierLeaderPct === 0 &&
    leader.gapToOverallLeaderPct != null &&
    leader.gapToOverallLeaderPct > 0 &&
    leader.performanceBand === "front-running",
  "gap-to-tier-leader and gap-to-overall-leader calculate inside one event",
);

const eventA = getALRTierBenchmark({ eventId: "ALR-BENCH-A", tier: 1, metric: "qualifying" });
const eventB = getALRTierBenchmark({ eventId: "ALR-BENCH-B", tier: 1, metric: "qualifying" });
const crossEvent = compareALRPace(
  { eventId: "ALR-BENCH-A", tier: 1, metric: "qualifying", timeSeconds: eventA.fastestSeconds },
  { eventId: "ALR-BENCH-B", tier: 1, metric: "qualifying", timeSeconds: eventB.fastestSeconds },
);
assert(
  crossEvent?.rawDeltaSeconds === null &&
    crossEvent.left.gapToTierLeaderPct === 0 &&
    crossEvent.right.gapToTierLeaderPct === 0 &&
    eventA.fastestSeconds !== eventB.fastestSeconds,
  "cross-event comparison uses normalized gaps and drops raw time",
);

const withinEvent = compareALRPace(
  { eventId: "ALR-BENCH-A", tier: 1, metric: "qualifying", timeSeconds: eventA.medianSeconds },
  { eventId: "ALR-BENCH-A", tier: 1, metric: "qualifying", timeSeconds: eventA.fastestSeconds },
);
assert(
  withinEvent?.sameEvent === true && withinEvent.rawDeltaSeconds > 0,
  "raw time comparison stays available inside one event",
);

const radiate = getALRFocusDriverResult({
  eventId: "ALR-BENCH-C",
  metric: "featureTotal",
  driverId: "Radiate79",
});
assert(
  radiate?.tier === 8 &&
    radiate.tierRank === 1 &&
    radiate.rank === 29 &&
    radiate.time === "42:11.315" &&
    radiate.timeSeconds === 2531.315 &&
    radiate.bonusApplied === false &&
    radiate.performanceBand === "front-running" &&
    radiate.enrichment.carId == null &&
    radiate.enrichment.trackId == null &&
    radiate.enrichment.tyreCompound == null &&
    radiate.enrichment.pitStrategy == null,
  "Radiate79 ALR-BENCH-C feature total is Tier 8 P1, overall P29, 42:11.315",
);

const otherDriver = getALRFocusDriverResult({
  eventId: "ALR-BENCH-C",
  metric: "featureTotal",
  driverId: "SomeoneElse",
});
assert(otherDriver === null, "unnamed drivers are not invented");

const strong = assessALRTime({
  eventId: "ALR-BENCH-C",
  tier: 8,
  metric: "featureTotal",
  timeSeconds: (getALRTierBenchmark({
    eventId: "ALR-BENCH-C",
    tier: 8,
    metric: "featureTotal",
  }).p25Seconds +
    getALRTierBenchmark({
      eventId: "ALR-BENCH-C",
      tier: 8,
      metric: "featureTotal",
    }).medianSeconds) /
    2,
});
assert(strong?.performanceBand === "strong", "performance bands follow the tier distribution");

assert(gapToLeaderPct(-1, 10) === null && assessALRTime({
  eventId: "ALR-BENCH-A",
  tier: 1,
  metric: "qualifying",
  timeSeconds: Number.NaN,
}) === null, "negative and non-finite times stay unavailable");

const enrichment = readALREnrichment({ trackId: null });
assert(
  enrichment.trackId == null &&
    enrichment.carId == null &&
    enrichment.fuelMultiplier == null &&
    enrichment.bopProfile == null,
  "unknown track, car, and strategy fields stay unknown",
);

const isolatedFiles = [
  "src/engine/championshipEngine.js",
  "src/engine/gr3MeasurableScoring.js",
  "src/utils/recommendationScoring.js",
  "src/engine/pitstopStrategyEngine.js",
  "src/engine/wheelSettingsEngine.js",
  "src/engine/alrLapEvidenceEngine.js",
];
const leaked = isolatedFiles.filter((file) => {
  const source = fs.readFileSync(file, "utf8");
  return source.includes("alrBenchmarkService") || source.includes("alrRaceCalibration");
});
assert(leaked.length === 0, leaked.length === 0 ? "benchmark data is isolated from car, pit, and wheel engines" : `leaked into ${leaked.join(", ")}`);

function tierBenchmarkSeconds(eventId, tier, metric) {
  return getALRTierBenchmark({ eventId, tier, metric }).fastestSeconds;
}

console.log(`\n${"═".repeat(60)}`);
console.log(`ALR benchmark: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);
if (failures > 0) process.exit(1);
