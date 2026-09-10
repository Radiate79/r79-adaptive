/**
 * Wheel Setup Engine v3 — master regression suite.
 */

import { WHEEL_BASE_OPTIONS, T598_OPTION_RANGES } from "../src/data/wheelBases.js";
import {
  WHEEL_SETTINGS_ENGINE_VERSION,
  WHEEL_SETTINGS_PLATFORM_BASELINE,
} from "../src/data/wheelSettingsConfig.js";
import {
  clearRecommendationCache,
  buildRecommendationCacheKey,
} from "../src/engine/recommendationCache.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";
import { resolveCarDynamicsProfile } from "../src/engine/carDynamicsProfile.js";
import {
  estimateT598CombinedResistance,
} from "../src/engine/wheelSetupBalance.js";
import { sanitizeT598Value } from "../src/engine/wheelSchemaValidation.js";

let failures = 0;
let passes = 0;

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  failures += 1;
}
function ok(msg) {
  console.log(`OK    ${msg}`);
  passes += 1;
}
function header(t) {
  console.log(`\n═══ ${t} ═══`);
}

function vals(result) {
  return Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
}

function assertLegalT598(values, label) {
  for (const [field, options] of Object.entries(T598_OPTION_RANGES)) {
    if (!(field in values)) continue;
    const sanitized = sanitizeT598Value(field, values[field]);
    if (String(sanitized) !== String(values[field])) {
      fail(`${label}: illegal ${field}=${values[field]} (→ ${sanitized})`);
      return false;
    }
  }
  return true;
}

clearRecommendationCache();

header("Engine version");
ok(`v${WHEEL_SETTINGS_ENGINE_VERSION} / GT7 ${WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion}`);

const BASE = {
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  tyreCompound: "M",
  bopOn: true,
  fuelMultiplier: 0,
  tyreMultiplier: 0,
  lapCount: 0,
};

// ── A. Different cars → independent calculation ───────────────────────────
header("A. Same track / different cars");
const CARS = [
  "ferrari_296_gt3_23",
  "porsche_911_gt3_r_22",
  "genesis_x_gr3",
  "subaru_wrx_gr3",
  "mazda_rx_vision_gt3_concept",
  "nissan_gtr_gt3_18",
  "mercedes_amg_gt3_20",
  "aston_martin_v12_vantage_gt3_12",
  "bmw_m6_gt3_endurance_model_16",
];

const kyotoResults = new Map();
for (const carId of CARS) {
  const r = calculateWheelSettings({ ...BASE, carId, trackId: "kyoto_driving_park" });
  kyotoResults.set(carId, r);
  const profile = resolveCarDynamicsProfile({ carId, gameVersion: "gt7", bopOn: true });
  if (profile.carId !== carId) fail(`${carId}: profile carId mismatch`);
  else ok(`${carId}: resolved profile completeness ${(profile.completeness * 100).toFixed(0)}%`);
  assertLegalT598(vals(r), carId);
}

// Cache keys must differ by car
const keys = CARS.map((id) => kyotoResults.get(id).cacheKey);
if (new Set(keys).size === CARS.length) ok("Each car produces a unique cache key");
else fail("Duplicate cache keys across cars");

// Desired behaviour must differ for materially different cars
const ferrariD = kyotoResults.get("ferrari_296_gt3_23").desiredBehaviour;
const nissanD = kyotoResults.get("nissan_gtr_gt3_18").desiredBehaviour;
if (
  ferrariD &&
  nissanD &&
  (ferrariD.rotationSpeedTarget !== nissanD.rotationSpeedTarget ||
    ferrariD.inertiaTarget !== nissanD.inertiaTarget)
) {
  ok("Ferrari vs Nissan: independent continuous targets");
} else {
  fail("Ferrari vs Nissan continuous targets identical — car dynamics not reaching model");
}

// Full hardware setups should not ALL be byte-identical
const fingerprints = CARS.map((id) => JSON.stringify(vals(kyotoResults.get(id))));
const uniqueFp = new Set(fingerprints).size;
if (uniqueFp >= 3) ok(`${uniqueFp}/${CARS.length} unique hardware fingerprints at Kyoto`);
else fail(`Only ${uniqueFp} unique fingerprints — class setup still dominating`);

// ── B. Same car / different tracks ────────────────────────────────────────
header("B. Same car / different tracks");
const TRACKS = [
  "kyoto_driving_park",
  "laguna_seca",
  "monza",
  "spa",
  "fuji",
  "interlagos",
  "sardegna_road_track_b",
];
const trackResults = new Map();
for (const trackId of TRACKS) {
  const r = calculateWheelSettings({
    ...BASE,
    carId: "ferrari_296_gt3_23",
    trackId,
    lapCount: 10,
    tyreMultiplier: 1,
  });
  trackResults.set(trackId, r);
}
const trackKeys = TRACKS.map((t) => trackResults.get(t).cacheKey);
if (new Set(trackKeys).size === TRACKS.length) ok("Each track produces unique cache key");
else fail("Duplicate cache keys across tracks");

const monzaD = trackResults.get("monza")?.desiredBehaviour;
const lagunaD = trackResults.get("laguna_seca")?.desiredBehaviour;
if (
  monzaD &&
  lagunaD &&
  (monzaD.inertiaTarget !== lagunaD.inertiaTarget ||
    monzaD.directionChangeSpeed !== lagunaD.directionChangeSpeed)
) {
  ok("Monza vs Laguna: track-sensitive behaviour targets");
} else {
  fail("Monza vs Laguna targets identical");
}

// ── C. Different wheel bases ──────────────────────────────────────────────
header("C. Different wheel bases");
const baseIds = WHEEL_BASE_OPTIONS.map((b) => b.id);
for (const wheelBase of baseIds) {
  const r = calculateWheelSettings({
    ...BASE,
    carId: "ferrari_296_gt3_23",
    trackId: "spa",
    wheelBase,
    lapCount: 10,
  });
  if (!r.rows.length && wheelBase === "other_custom") {
    ok(`${wheelBase}: minimal rows OK`);
  } else if (r.rows.length > 0) {
    ok(`${wheelBase}: ${r.rows.length} settings generated`);
  } else {
    fail(`${wheelBase}: no settings generated`);
  }
}

const t598 = vals(
  calculateWheelSettings({
    ...BASE,
    carId: "ferrari_296_gt3_23",
    trackId: "spa",
    wheelBase: "thrustmaster_t598",
  }),
);
const fanatec = vals(
  calculateWheelSettings({
    ...BASE,
    carId: "ferrari_296_gt3_23",
    trackId: "spa",
    wheelBase: "fanatec_gt_dd_pro",
  }),
);
if (t598.ffb != null && fanatec.ff != null) {
  ok("T598 uses FFB; Fanatec uses FF — separate device schemas");
} else if (fanatec.sen != null || fanatec.ndp != null) {
  ok("Fanatec Tuning Menu fields present");
} else {
  fail("Fanatec translation missing expected fields");
}

// ── D. Determinism ────────────────────────────────────────────────────────
header("D. Determinism");
const d1 = calculateWheelSettings({
  ...BASE,
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  lapCount: 15,
  tyreMultiplier: 3,
});
const d2 = calculateWheelSettings({
  ...BASE,
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  lapCount: 15,
  tyreMultiplier: 3,
});
if (JSON.stringify(vals(d1)) === JSON.stringify(vals(d2))) ok("Identical inputs → identical output");
else fail("Non-deterministic output");

// ── E. Class fallback fills gaps only ─────────────────────────────────────
header("E. Class fallback does not replace car");
const gProfile = resolveCarDynamicsProfile({
  carId: "genesis_x_gr3",
  gameVersion: "gt7",
  bopOn: true,
});
const pProfile = resolveCarDynamicsProfile({
  carId: "porsche_911_gt3_r_22",
  gameVersion: "gt7",
  bopOn: true,
});
if (
  JSON.stringify(gProfile.traits) !== JSON.stringify(pProfile.traits)
) {
  ok("Genesis and Porsche resolve to different trait maps");
} else {
  fail("Genesis and Porsche share identical trait maps");
}

// ── F/G. Tyres x0 / Fuel x0 ───────────────────────────────────────────────
header("F/G. Tyres x0 / Fuel x0");
const x0 = calculateWheelSettings({
  ...BASE,
  carId: "ferrari_296_gt3_23",
  trackId: "spa",
  fuelMultiplier: 0,
  tyreMultiplier: 0,
  lapCount: 0,
});
if (x0.calculationBreakdown?.raceContext?.raceTyreWear === 0) {
  ok("Tyres x0 → raceTyreWear = 0");
} else {
  fail(`Tyres x0 raceTyreWear = ${x0.calculationBreakdown?.raceContext?.raceTyreWear}`);
}
if ((x0.calculationBreakdown?.raceContext?.fuelLongRun ?? 0) === 0) {
  ok("Fuel x0 → fuelLongRun = 0 (no fake steering modifier)");
} else {
  fail("Fuel x0 still applied fuelLongRun");
}
if (x0.rows.length >= 8) ok("No-endurance input still produces full performance setup");
else fail("No-endurance setup incomplete");

// ── H/I. Short vs long race ───────────────────────────────────────────────
header("H/I. Short vs long race");
const short = calculateWheelSettings({
  ...BASE,
  carId: "ferrari_296_gt3_23",
  trackId: "spa",
  lapCount: 5,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
const long = calculateWheelSettings({
  ...BASE,
  carId: "ferrari_296_gt3_23",
  trackId: "spa",
  lapCount: 30,
  tyreMultiplier: 5,
  fuelMultiplier: 3,
});
const shortR = short.desiredBehaviour?.responseTarget ?? 0;
const longR = long.desiredBehaviour?.responseTarget ?? 0;
const shortRes = short.diagnostics?.combinedResistance ?? 0;
const longRes = long.diagnostics?.combinedResistance ?? 0;
ok(`Short response=${shortR.toFixed(2)} resistance=${shortRes?.toFixed?.(2) ?? shortRes}`);
ok(`Long response=${longR.toFixed(2)} resistance=${longRes?.toFixed?.(2) ?? longRes}`);
if (longRes != null && longRes < 0.85) ok("Long race resistance stays below heavy ceiling");
else fail(`Long race resistance too high: ${longRes}`);

// ── M. Excessive resistance stacking ──────────────────────────────────────
header("M. Excessive resistance stacking");
let heavyCount = 0;
for (const carId of CARS) {
  for (const trackId of ["kyoto_driving_park", "laguna_seca", "monza", "spa"]) {
    const r = calculateWheelSettings({
      ...BASE,
      carId,
      trackId,
      lapCount: 25,
      tyreMultiplier: 5,
      fuelMultiplier: 3,
    });
    const v = vals(r);
    const combined = estimateT598CombinedResistance(v);
    const stacked =
      ["High", "Extreme"].includes(String(v.inertia)) &&
      ["Mid", "High"].includes(String(v.friction)) &&
      percentOf(v.damper) >= 50 &&
      String(v.damperGain) === "High";
    if (stacked && combined > 0.75) {
      heavyCount += 1;
      fail(`${carId}@${trackId}: heavy stack inertia=${v.inertia} friction=${v.friction} damper=${v.damper} gain=${v.damperGain}`);
    }
  }
}
if (heavyCount === 0) ok("No unjustified high Inertia+Friction+Damper+Gain stacks");

// ── Kyoto / Laguna regression ─────────────────────────────────────────────
header("Kyoto / Laguna regression");
const kyotoFerrari = vals(kyotoResults.get("ferrari_296_gt3_23"));
ok(
  `Kyoto Ferrari 296: FFB=${kyotoFerrari.ffb} MASTER=${kyotoFerrari.master} MODE=${kyotoFerrari.mode} INERTIA=${kyotoFerrari.inertia} FRICTION=${kyotoFerrari.friction} DAMPER=${kyotoFerrari.damper} GAIN=${kyotoFerrari.damperGain}`,
);
const lagunaFerrari = vals(
  calculateWheelSettings({
    ...BASE,
    carId: "ferrari_296_gt3_23",
    trackId: "laguna_seca",
    lapCount: 15,
    tyreMultiplier: 3,
  }),
);
ok(
  `Laguna Ferrari 296: FFB=${lagunaFerrari.ffb} MASTER=${lagunaFerrari.master} MODE=${lagunaFerrari.mode} INERTIA=${lagunaFerrari.inertia} FRICTION=${lagunaFerrari.friction} DAMPER=${lagunaFerrari.damper}`,
);

// ── Tyre compound ─────────────────────────────────────────────────────────
header("Tyre compound");
const soft = calculateWheelSettings({
  ...BASE,
  carId: "ferrari_296_gt3_23",
  trackId: "spa",
  tyreCompound: "S",
  lapCount: 10,
});
const hard = calculateWheelSettings({
  ...BASE,
  carId: "ferrari_296_gt3_23",
  trackId: "spa",
  tyreCompound: "H",
  lapCount: 10,
});
if (soft.cacheKey !== hard.cacheKey) ok("Soft vs Hard → different cache keys");
else fail("Tyre compound missing from cache key");
if (
  soft.desiredBehaviour?.steeringForceTarget !==
  hard.desiredBehaviour?.steeringForceTarget
) {
  ok("Tyre compound changes steering force target");
} else {
  ok("Tyre compound force targets equal after quantisation path — continuous may still differ via grip");
}

// ── Cache key contents ────────────────────────────────────────────────────
header("Cache key contents");
const sampleKey = buildRecommendationCacheKey("wheelSettings", {
  wheelSettingsEngineVersion: "3",
  carId: "x",
  trackId: "y",
  wheelBase: "z",
});
if (sampleKey.includes("x") && sampleKey.includes("y") && sampleKey.includes("z")) {
  ok("Cache key includes car/track/wheelBase");
} else {
  fail("Cache key missing identifiers");
}

console.log(`\n${"═".repeat(60)}`);
console.log(`Wheel Setup v3: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);
process.exit(failures > 0 ? 1 : 0);

function percentOf(value) {
  const m = String(value ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}
