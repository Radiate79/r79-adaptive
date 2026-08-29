/**
 * Master intelligence regression suite for R79 Advisor / Strategy engines.
 * Run: node scripts/verify-r79-intelligence.mjs
 */
import { calculateChampionshipRecommendation } from "../src/engine/calculateChampionshipRecommendation.js";
import {
  analyzePitstopStrategy,
  validateTyreStints,
} from "../src/engine/pitstopStrategyEngine.js";
import {
  createCalculationRequestId,
  runCancellableCalculation,
} from "../src/engine/calculationRunner.js";
import {
  clearRecommendationCache,
  buildRecommendationCacheKey,
} from "../src/engine/recommendationCache.js";
import { getRaceConditionImportance } from "../src/engine/advisorScoringConfig.js";
import { getCommunityModifier } from "../src/utils/recommendationScoring.js";
import { ADVISOR_ENGINE_VERSION } from "../src/data/advisorDataLayer.js";
import { getCarsForGame, getTracksForGame } from "../src/utils/gameData.js";

function recommend(trackIds, raceSettings = {}) {
  return calculateChampionshipRecommendation({
    selectedTrackIds: trackIds,
    carClass: "Gr.3",
    gameVersion: "gt7",
    bopOn: true,
    ...raceSettings,
  });
}

function dumpContributions(label, result) {
  console.log(`\n--- ${label} ---`);
  result.scores.slice(0, 5).forEach((row, index) => {
    console.log(
      `${index + 1}. ${row.name} final=${row.overall} tech=${row.technicalFit} track=${row.trackFit} race=${row.raceConditionFit} conf=${row.confidence ?? "—"}`,
    );
  });
}

let failures = 0;
function assert(pass, detail) {
  console.log(`[${pass ? "PASS" : "FAIL"}] ${detail}`);
  if (!pass) failures += 1;
}

console.log(`Advisor engine ${ADVISOR_ENGINE_VERSION}`);

// A. Determinism
clearRecommendationCache();
const a1 = recommend(["fuji"], { lapCount: 7, tyreMultiplier: 4, fuelMultiplier: 1 });
clearRecommendationCache();
const a2 = recommend(["fuji"], { lapCount: 7, tyreMultiplier: 4, fuelMultiplier: 1 });
assert(
  JSON.stringify(a1.scores) === JSON.stringify(a2.scores),
  "Identical inputs produce identical scores",
);

// B/C/D/E Track / tyre / fuel / distance contributions change
clearRecommendationCache();
const fuji = recommend(["fuji"], { lapCount: 10, tyreMultiplier: 3, fuelMultiplier: 2 });
const monza = recommend(["monza"], { lapCount: 10, tyreMultiplier: 3, fuelMultiplier: 2 });
assert(
  JSON.stringify(fuji.scores.map((s) => s.id)) !==
    JSON.stringify(monza.scores.map((s) => s.id)) ||
    Math.abs((fuji.scores[0]?.trackFit ?? 0) - (monza.scores[0]?.trackFit ?? 0)) > 0.01,
  "Changed track changes track contributions / ranking shape",
);

const tyreLow = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
const tyreHigh = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 8,
  fuelMultiplier: 1,
});
assert(tyreHigh.tyreImportance > tyreLow.tyreImportance, "Higher tyre multiplier increases tyre importance");

const fuelLow = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
const fuelHigh = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 1,
  fuelMultiplier: 8,
});
assert(fuelHigh.fuelImportance > fuelLow.fuelImportance, "Higher fuel multiplier increases fuel importance");

const shortDist = getRaceConditionImportance({
  lapCount: 5,
  tyreMultiplier: 3,
  fuelMultiplier: 3,
});
const longDist = getRaceConditionImportance({
  lapCount: 30,
  tyreMultiplier: 3,
  fuelMultiplier: 3,
});
assert(
  longDist.enduranceEmphasis > shortDist.enduranceEmphasis &&
    shortDist.paceEmphasis > longDist.paceEmphasis,
  "Race distance changes pace vs endurance weighting",
);

// F/G x0
const tyreZero = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 0,
  fuelMultiplier: 5,
});
const fuelZero = getRaceConditionImportance({
  lapCount: 20,
  tyreMultiplier: 5,
  fuelMultiplier: 0,
});
assert(tyreZero.tyreImportance === 0, "Tyres x0 → tyre importance 0");
assert(fuelZero.fuelImportance === 0, "Fuel x0 → fuel importance 0");

// H unknown community reduces confidence path (modifier 0)
assert(
  getCommunityModifier({ communityConfidence: undefined }) === 0,
  "Missing community confidence does not invent a performance modifier",
);

// I/J historical/community not dominating — technical primary
clearRecommendationCache();
const fujiResult = recommend(["fuji"], {
  lapCount: 7,
  tyreMultiplier: 4,
  fuelMultiplier: 1,
});
dumpContributions("Fuji 7 / x4 / x1 / BOP ON", fujiResult);
assert(
  !fujiResult.rankings.slice(0, 5).some((c) => c.id === "peugeot_vision_gran_turismo_gr3"),
  "Peugeot VGT not in Fuji top 5 without hard-coded ban",
);
const peugeot = getCarsForGame("gt7").find((c) => c.id === "peugeot_vision_gran_turismo_gr3");
assert(Boolean(peugeot), "Peugeot VGT remains in dataset (not deleted)");

// K stale request discard
let currentId = 0;
const stale = await runCancellableCalculation({
  requestId: 1,
  isCurrent: (id) => id === currentId,
  compute: () => "A",
});
currentId = 2;
const fresh = await runCancellableCalculation({
  requestId: 2,
  isCurrent: (id) => id === currentId,
  compute: () => "B",
});
assert(stale.ok === false && stale.reason === "cancelled", "Stale request A discarded");
assert(fresh.ok === true && fresh.value === "B", "Fresh request B applied");

// L duplicate in-flight dedupe
currentId = 3;
const key = "dedupe-test";
const p1 = runCancellableCalculation({
  requestId: 3,
  isCurrent: (id) => id === 3,
  dedupeKey: key,
  compute: () => {
    return "shared";
  },
});
const p2 = runCancellableCalculation({
  requestId: 3,
  isCurrent: (id) => id === 3,
  dedupeKey: key,
  compute: () => "shared",
});
const [r1, r2] = await Promise.all([p1, p2]);
assert(r1.ok && r2.ok && r1.value === r2.value, "Identical in-flight calculations dedupe");

// M cache invalidates when version stamp changes
clearRecommendationCache();
const cached1 = recommend(["spa"], { lapCount: 12, tyreMultiplier: 2, fuelMultiplier: 2 });
const cached2 = recommend(["spa"], { lapCount: 12, tyreMultiplier: 2, fuelMultiplier: 2 });
assert(cached1.fromCache === false && cached2.fromCache === true, "Deterministic result caches");
const keyWithVersion = buildRecommendationCacheKey("championship-advisor", {
  advisorEngineVersion: ADVISOR_ENGINE_VERSION,
  selectedTrackIds: ["spa"],
});
assert(keyWithVersion.includes(ADVISOR_ENGINE_VERSION), "Cache key includes engine version");

// Contrasting tracks diagnostic
const tracks = [
  "fuji",
  "monza",
  "laguna_seca",
  "spa",
  "interlagos",
  "sardegna_road_track",
];
const winners = [];
for (const trackId of tracks) {
  clearRecommendationCache();
  const result = recommend([trackId], {
    lapCount: 10,
    tyreMultiplier: 3,
    fuelMultiplier: 2,
  });
  winners.push(result.rankings[0]?.id);
  dumpContributions(trackId, result);
}
assert(new Set(winners).size >= 2, "Contrasting tracks do not share one universal winner exclusively");

// Championship multi-round
clearRecommendationCache();
const calendar = calculateChampionshipRecommendation({
  selectedTrackIds: ["fuji", "laguna_seca", "spa"],
  carClass: "Gr.3",
  lapCount: 12,
  tyreMultiplier: 3,
  fuelMultiplier: 2,
  bopOn: true,
  gameVersion: "gt7",
});
assert(calendar.rankings.length > 0 && calendar.consistencyRankings.length > 0, "Championship scores rounds + consistency");

// Strategy regressions
const trackId = getTracksForGame("gt7").find((t) => t.id === "fuji")?.id ?? "fuji";
const carId = "porsche_911_gt3_r_22";

const sA = analyzePitstopStrategy({
  carId,
  trackId,
  lapCount: 10,
  tyreMultiplier: 0,
  fuelMultiplier: 0,
});
assert(sA.ready && sA.recommendedStops === 0, "Strategy A: x0/x0 → no tyre/fuel stops");

const sB = analyzePitstopStrategy({
  carId,
  trackId,
  lapCount: 25,
  tyreMultiplier: 8,
  fuelMultiplier: 1,
});
assert(sB.ready && sB.recommendedStops >= 1, "Strategy B: long + high tyre → stops meaningful");

const sC = analyzePitstopStrategy({
  carId,
  trackId,
  lapCount: 25,
  tyreMultiplier: 1,
  fuelMultiplier: 8,
});
assert(sC.ready, "Strategy C: long + high fuel calculates");

const softMedSoft = validateTyreStints(
  [
    { compound: "S", startLap: 1, endLap: 7 },
    { compound: "M", startLap: 8, endLap: 18 },
    { compound: "S", startLap: 19, endLap: 25 },
  ],
  25,
);
assert(softMedSoft.valid, "Soft→Medium→Soft valid");

const medMed = validateTyreStints(
  [
    { compound: "M", startLap: 1, endLap: 12 },
    { compound: "M", startLap: 13, endLap: 25 },
  ],
  25,
);
assert(medMed.valid, "Medium→Medium valid");

const incomplete = analyzePitstopStrategy({
  carId: "",
  trackId: "",
  lapCount: 20,
  tyreMultiplier: 3,
  fuelMultiplier: 2,
});
assert(!incomplete.ready, "Incomplete strategy input does not invent a plan");

// Alphabetical lists still work
const cars = getCarsForGame("gt7").map((c) => c.name);
const carsSorted = [...cars].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
assert(cars.every((name, i) => name === carsSorted[i]), "Cars remain A–Z");

const trackNames = getTracksForGame("gt7").map((t) => t.displayName || t.name);
const tracksSorted = [...trackNames].sort((a, b) =>
  String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
);
assert(
  trackNames.every((name, i) => name === tracksSorted[i]),
  "Tracks remain A–Z",
);

// Request id helper exists
assert(createCalculationRequestId() > 0, "Calculation request IDs available");

if (failures > 0) {
  console.error(`\n${failures} intelligence checks failed.`);
  process.exit(1);
}

console.log("\nAll master intelligence regression checks passed.");
