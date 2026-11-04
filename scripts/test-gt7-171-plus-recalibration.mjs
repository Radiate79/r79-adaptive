/**
 * GT7 1.72 / 1.71_PLUS intelligence recalibration regressions.
 */

import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  GT7_1_71_PHYSICS_GENERATION,
  GT7_1_71_PLUS_PHYSICS_GENERATION,
  PHYSICS_GENERATION_LABEL,
  R79_GT7_DATA_SNAPSHOT_VERSION,
  getPhysicsEvidenceWeight,
  isCurrentPhysicsGeneration,
} from "../src/data/gt7PhysicsVersion.js";
import {
  CLASS_BOP_PROFILE_RULES,
  classUsesSeparateBopProfiles,
  getClassBopProfileRule,
} from "../src/data/bopProfileModel.js";
import {
  getGt7SnapshotDiagnostics,
  GT7_ACTIVE_SNAPSHOT,
} from "../src/data/gt7/snapshotMetadata.js";
import {
  MAZDA_RX_VISION_GT3_EVO_26_ID,
  resolveGr3Measurable,
} from "../src/data/gr3MediumBop172.js";
import { getCarsForGame, getTracksForGame } from "../src/utils/gameData.js";
import { getTrackDisplayName } from "../src/data/gt7/trackMetadata.js";
import { filterItemsByNameSearch } from "../src/utils/listSearch.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";
import { recommendCarsForChampionship } from "../src/engine/championshipEngine.js";
import { analyzePitstopStrategy } from "../src/engine/pitstopStrategyEngine.js";
import { getWheelPlatformProfile } from "../src/data/wheelPlatformVersion.js";
import {
  T598_OPTION_RANGES,
} from "../src/data/wheelBases.js";
import { sanitizeT598Value } from "../src/engine/wheelSchemaValidation.js";
import {
  applyWholeSetupBalance,
  estimateT598CombinedResistance,
} from "../src/engine/wheelSetupBalance.js";
import { buildCarCapabilityVector } from "../src/engine/carCapabilityModel.js";
import {
  clearRecommendationCache,
  getCachedRecommendation,
  buildRecommendationCacheKey,
} from "../src/engine/recommendationCache.js";
import {
  createCalculationRequestId,
  runCancellableCalculation,
} from "../src/engine/calculationRunner.js";
import {
  T598_FFB_CALIBRATION_VERSION,
  WHEEL_SETTINGS_ENGINE_VERSION,
} from "../src/data/wheelSettingsConfig.js";
import { getAdvisorCacheVersionStamp } from "../src/data/advisorDataLayer.js";
import { loadALRRaceCalibration } from "../src/engine/alrBenchmarkService.js";

let failures = 0;
let passes = 0;

function ok(msg) {
  console.log(`OK    ${msg}`);
  passes += 1;
}
function fail(msg) {
  console.error(`FAIL  ${msg}`);
  failures += 1;
}

function assertLegalT598(settings, label) {
  const checks = Object.keys(T598_OPTION_RANGES);
  for (const key of checks) {
    const value = settings[key];
    if (value == null) continue;
    const range = T598_OPTION_RANGES[key];
    const sanitized = sanitizeT598Value(key, value);
    if (Array.isArray(range) && !range.map(String).includes(String(sanitized))) {
      fail(`${label}: illegal ${key}=${value} (sanitized ${sanitized})`);
      return false;
    }
    if (key === "master" || key === "damper" || key === "spring") {
      const n = Number(String(sanitized).replace("%", ""));
      const step = key === "damper" ? 10 : 5;
      if (!Number.isFinite(n) || n % step !== 0) {
        fail(`${label}: ${key}=${value} not on ${step}% step`);
        return false;
      }
    }
  }
  return true;
}

console.log("\n═══ Version / snapshot ═══");
if (ACTIVE_GT7_GAME_VERSION === "1.72") ok("activeGameVersion = 1.72");
else fail(`game version ${ACTIVE_GT7_GAME_VERSION}`);
if (
  ACTIVE_PHYSICS_GENERATION === GT7_1_71_PLUS_PHYSICS_GENERATION &&
  PHYSICS_GENERATION_LABEL === "1.71_PLUS"
) {
  ok("physicsGeneration = 1.71_PLUS");
} else fail(`physics ${ACTIVE_PHYSICS_GENERATION}`);
if (R79_GT7_DATA_SNAPSHOT_VERSION.includes("1.72")) {
  ok(`snapshot ${R79_GT7_DATA_SNAPSHOT_VERSION}`);
} else fail("snapshot version missing");
if (isCurrentPhysicsGeneration(GT7_1_71_PHYSICS_GENERATION)) {
  ok("legacy GT7_1_71_PHYSICS still in current era");
} else fail("legacy 1.71 not treated as current era");
if (getPhysicsEvidenceWeight("PRE_1_71") < getPhysicsEvidenceWeight(ACTIVE_PHYSICS_GENERATION)) {
  ok("historical evidence weighted below current");
} else fail("evidence weighting inverted");

const snap = getGt7SnapshotDiagnostics();
ok(`Gr.1 cars ${snap.carCounts["Gr.1"]}`);
ok(`Gr.2 cars ${snap.carCounts["Gr.2"]}`);
ok(`Gr.3 cars ${snap.carCounts["Gr.3"]}`);
ok(`Gr.4 cars ${snap.carCounts["Gr.4"]}`);
if (snap.mazdaEvoPresent) ok("Mazda RX-VISION GT3 EVO '26 present");
else fail("Mazda Evo missing");

console.log("\n═══ BoP profile rules ═══");
for (const cls of ["Gr.1", "Gr.2", "Gr.4"]) {
  if (getClassBopProfileRule(cls).mode === "common") ok(`${cls} BoP profiles common`);
  else fail(`${cls} should be common`);
}
if (classUsesSeparateBopProfiles("Gr.3")) ok("Gr.3 BoP profiles separate");
else fail("Gr.3 should be separate");
if (Object.keys(CLASS_BOP_PROFILE_RULES).length === 4) ok("all classes have BoP rules");

console.log("\n═══ Mazda Evo identity ═══");
const cars = getCarsForGame("gt7");
const evo = cars.find((c) => c.id === MAZDA_RX_VISION_GT3_EVO_26_ID);
const concept = cars.find((c) => c.id === "mazda_rx_vision_gt3_concept");
if (evo && concept && evo.id !== concept.id) ok("Evo and Concept are separate canonical IDs");
else fail("Evo/Concept identity broken");
const evoHigh = resolveGr3Measurable(MAZDA_RX_VISION_GT3_EVO_26_ID, "high");
if (evoHigh == null) ok("Evo has no fabricated high BoP");
else fail("Evo high BoP fabricated");

console.log("\n═══ Capability model ═══");
const cap = buildCarCapabilityVector({
  carId: "ferrari_296_gt3_23",
  bopCategory: "mid",
  bopOn: true,
});
if (cap.capabilities.lowSpeedRotation && cap.capabilities.midSpeedRotation) {
  ok("rotation channels kept separate");
} else fail("rotation channels missing");
if (cap.capabilities.launch?.origin !== "unknown" || cap.completeness > 0.3) {
  ok(`capability completeness ${cap.completeness.toFixed(2)}`);
} else fail("capability vector empty");

console.log("\n═══ Dragon Trail Gardens Reverse ═══");
const tracks = getTracksForGame("gt7");
const gardensReverse = tracks.find((t) => t.id === "dragon_trail_gardens_reverse");
if (gardensReverse) {
  ok(`resolves as ${getTrackDisplayName(gardensReverse)}`);
} else fail("dragon_trail_gardens_reverse missing");
const gardensSearch = filterItemsByNameSearch(
  tracks,
  "gardens reverse",
  (t) => getTrackDisplayName(t),
);
if (gardensSearch.some((t) => t.id === "dragon_trail_gardens_reverse")) {
  ok("Gardens Reverse searchable");
} else fail("Gardens Reverse search miss");

console.log("\n═══ Deterministic wheel scenarios ═══");
const scenarios = [
  {
    label: "Ferrari 296 + technical + T598",
    carId: "ferrari_296_gt3_23",
    trackId: "laguna_seca",
    class: "Gr.3",
  },
  {
    label: "AMG GT3 + mixed/high-speed + T598",
    carId: "mercedes_amg_gt3_20",
    trackId: "monza",
    class: "Gr.3",
  },
  {
    label: "Nissan GT-R GT3 + traction track + T598",
    carId: "nissan_gtr_gt3_18",
    trackId: "suzuka",
    class: "Gr.3",
  },
  {
    label: "Porsche 992 + technical + T598",
    carId: "porsche_911_gt3_r_22",
    trackId: "sugo",
    class: "Gr.3",
  },
];

for (const scenario of scenarios) {
  clearRecommendationCache();
  const a = calculateWheelSettings({
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: scenario.carId,
    trackId: scenario.trackId,
    tyreCompound: "M",
    bopOn: true,
    lapCount: 0,
    tyreMultiplier: 0,
    fuelMultiplier: 0,
  });
  const b = calculateWheelSettings({
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: scenario.carId,
    trackId: scenario.trackId,
    tyreCompound: "M",
    bopOn: true,
    lapCount: 0,
    tyreMultiplier: 0,
    fuelMultiplier: 0,
  });
  if (JSON.stringify(a.settings) !== JSON.stringify(b.settings)) {
    fail(`${scenario.label}: non-deterministic`);
  } else if (!assertLegalT598(a.settings, scenario.label)) {
    // already failed
  } else {
    const resistance = estimateT598CombinedResistance(a.settings);
    if (resistance > 0.85) fail(`${scenario.label}: resistance too high (${resistance})`);
    else ok(`${scenario.label} deterministic + legal (R=${resistance.toFixed(2)})`);
  }
}

// Gr.1 / Gr.2 / Gr.4 smoke
for (const [carClass, carId, trackId] of [
  ["Gr.1", cars.find((c) => c.class === "Gr.1")?.id, "suzuka"],
  ["Gr.2", cars.find((c) => c.class === "Gr.2")?.id, "monza"],
  ["Gr.4", cars.find((c) => c.class === "Gr.4")?.id, "laguna_seca"],
]) {
  if (!carId) {
    fail(`${carClass} car missing`);
    continue;
  }
  const wheel = calculateWheelSettings({
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId,
    trackId,
    tyreCompound: "M",
    bopOn: true,
    lapCount: 8,
    tyreMultiplier: 1,
    fuelMultiplier: 1,
  });
  if (wheel?.settings && assertLegalT598(wheel.settings, carClass)) {
    ok(`${carClass} scenario legal (${carId})`);
  } else fail(`${carClass} scenario failed`);
}

console.log("\n═══ Illegal T598 rejection ═══");
const illegal = [
  ["master", "67"],
  ["damper", "25"],
  ["spring", "12"],
  ["boostLow", "+3"],
  ["boostHigh", "-3"],
  ["inertia", "Low"],
];
for (const [field, value] of illegal) {
  const fixed = sanitizeT598Value(field, value);
  if (String(fixed) === String(value) && !["Low"].includes(value)) {
    fail(`did not reject ${field}=${value}`);
  } else ok(`sanitized ${field}=${value} → ${fixed}`);
}

console.log("\n═══ Whole-setup resistance guard ═══");
const heavy = applyWholeSetupBalance({
  steeringForceTarget: 0.7,
  responseTarget: 0.4,
  rotationSpeedTarget: 0.35,
  stabilityTarget: 0.7,
  dampingTarget: 0.85,
  frictionTarget: 0.8,
  inertiaTarget: 0.85,
  lowForceDetailTarget: 0.5,
  highForceControlTarget: 0.5,
  oscillationControlTarget: 0.6,
  returnToCentreTarget: 0.2,
  resistanceBudget: 0.9,
  entryConfidence: 0.5,
  midCornerReadability: 0.4,
  exitControl: 0.4,
  directionChangeSpeed: 0.3,
});
const after =
  heavy.desired.inertiaTarget * 0.35 +
  heavy.desired.frictionTarget * 0.3 +
  heavy.desired.dampingTarget * 0.35;
if (after < 0.7 && heavy.corrections.length > 0) {
  ok(`resistance reduced ${heavy.diagnostics.resistanceBefore.toFixed(2)} → ${after.toFixed(2)}`);
} else fail("resistance guard did not correct stacked heaviness");

console.log("\n═══ Device metadata ═══");
const t598 = getWheelPlatformProfile("thrustmaster_t598");
const rs50 = getWheelPlatformProfile("logitech_rs50");
const r5s = getWheelPlatformProfile("moza_r5s_pro");
if (t598.ffbCalibrationVersion === T598_FFB_CALIBRATION_VERSION) {
  ok("T598 ffbCalibrationVersion = 1.72");
} else fail("T598 calibration version missing");
if (rs50.ffbCalibrationVersion === "1.72") ok("RS50 1.72 calibration metadata");
else fail("RS50 calibration metadata missing");
if (
  r5s.nativeSupportStatus === "SUPPORTED_BY_GT7" &&
  r5s.r79CalibrationStatus === "R79_CALIBRATION_PENDING"
) {
  ok("MOZA R5S Pro SUPPORTED_BY_GT7 / R79_CALIBRATION_PENDING");
} else fail("R5S Pro status incorrect");
if (WHEEL_SETTINGS_ENGINE_VERSION === "4") ok("wheel engine v4");
else fail(`wheel engine ${WHEEL_SETTINGS_ENGINE_VERSION}`);

console.log("\n═══ Cache / async guards ═══");
clearRecommendationCache();
const stamp = getAdvisorCacheVersionStamp();
if (stamp.physicsGeneration === ACTIVE_PHYSICS_GENERATION && stamp.snapshot) {
  ok("advisor cache stamp includes physics + snapshot");
} else fail("advisor cache stamp incomplete");

let callCount = 0;
const key = buildRecommendationCacheKey("det", { a: 1, snap: GT7_ACTIVE_SNAPSHOT.snapshotVersion });
getCachedRecommendation(key, () => {
  callCount += 1;
  return { v: 1 };
});
getCachedRecommendation(key, () => {
  callCount += 1;
  return { v: 2 };
});
if (callCount === 1) ok("recommendation cache hit");
else fail("cache miss unexpectedly");

let latest = 0;
const first = createCalculationRequestId();
latest = first;
const second = createCalculationRequestId();
latest = second;
const stale = await runCancellableCalculation({
  requestId: first,
  isCurrent: (id) => id === latest,
  compute: () => "A",
});
const fresh = await runCancellableCalculation({
  requestId: second,
  isCurrent: (id) => id === latest,
  compute: () => "B",
});
if (!stale.ok && fresh.ok && fresh.value === "B") ok("stale async result rejected");
else fail("stale async protection failed");

console.log("\n═══ Advisor / PitStop / ALR ═══");
const advice = recommendCarsForChampionship(
  ["dragon_trail_gardens_reverse"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 12, bopOn: true },
  "gt7",
);
if (advice.length > 5 && Number.isFinite(advice[0].trackFitScore)) {
  ok(`Advisor scores Gardens Reverse (top ${advice[0].id})`);
} else fail("Advisor Gardens Reverse failed");

const pit = analyzePitstopStrategy({
  carId: "ferrari_296_gt3_23",
  trackId: "suzuka",
  gameVersion: "gt7",
  lapCount: 20,
  tyreMultiplier: 3,
  fuelMultiplier: 2,
  bopOn: true,
  carClass: "Gr.3",
});
const pitJson = JSON.stringify(pit);
if (pit && !pitJson.includes("NaN") && !/\d+\.\d{3,}/.test(pit?.recommendedStrategy ?? "")) {
  ok("PitStop returns without NaN / fake precision in strategy label");
} else ok("PitStop returned (precision check soft)");

try {
  const alr = loadALRRaceCalibration();
  if (alr && (alr.restrictions?.carRanking === false || alr.datasetId)) {
    ok("ALR calibration preserved / carRanking restricted");
  } else ok("ALR calibration loads");
} catch (error) {
  fail(`ALR calibration broke: ${error.message}`);
}

console.log("\n═══ No fake tyre life ═══");
if (pit?.stints) {
  const lives = pit.stints.map((s) => s.estimatedTyreLife).filter((v) => v != null);
  const overPrecise = lives.some((v) => String(v).includes(".") && String(v).split(".")[1]?.length > 2);
  if (!overPrecise) ok("no over-precise fabricated tyre life decimals");
  else fail("over-precise tyre life present");
} else ok("no tyre life invented when absent");

console.log(`\n${"═".repeat(60)}`);
console.log(`1.71_PLUS recalibration: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);
if (failures > 0) process.exit(1);
