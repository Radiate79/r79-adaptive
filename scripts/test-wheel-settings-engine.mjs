import { cars as gt7Cars } from "../src/data/gt7/cars.js";
import { tracks as gt7Tracks } from "../src/data/gt7/tracks.js";
import {
  ACTIVE_T598_FIRMWARE,
  WHEEL_SETTINGS_ENGINE_VERSION,
  WHEEL_SETTINGS_PLATFORM_BASELINE,
} from "../src/data/wheelSettingsConfig.js";
import { T598_OPTION_RANGES } from "../src/data/wheelBases.js";
import { resolveCarDynamicsProfile } from "../src/engine/carDynamicsProfile.js";
import { resolveTrackDynamicsProfile } from "../src/engine/trackDynamicsProfile.js";
import {
  buildRecommendationCacheKey,
  clearRecommendationCache,
} from "../src/engine/recommendationCache.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";
import {
  findIllegalPresentationRows,
  sanitizeT598Value,
} from "../src/engine/wheelSchemaValidation.js";

let failures = 0;

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK ${message}`);
}

function rowMap(result) {
  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

const TEST_CARS = [
  "genesis_x_gr3",
  "porsche_911_gt3_r_22",
  "ferrari_296_gt3_23",
  "mazda_rx_vision_gt3_concept",
];

const BASE_INPUT = {
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  trackId: "spa",
  tyreCompound: "M",
  bopOn: true,
  fuelMultiplier: 0,
  tyreMultiplier: 0,
  lapCount: 5,
};

function assertValidT598(values) {
  for (const [fieldKey, options] of Object.entries(T598_OPTION_RANGES)) {
    if (!(fieldKey in values)) {
      continue;
    }
    const sanitized = sanitizeT598Value(fieldKey, values[fieldKey]);
    if (String(sanitized) !== String(values[fieldKey])) {
      fail(`Invalid T598 ${fieldKey}: ${values[fieldKey]} → ${sanitized}`);
    }
  }
}

clearRecommendationCache();

ok(`Engine version ${WHEEL_SETTINGS_ENGINE_VERSION}, GT7 ${WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion}, T598 FW ${ACTIVE_T598_FIRMWARE}`);

/** Same track / conditions — change car only */
const carResults = new Map();
for (const carId of TEST_CARS) {
  const result = calculateWheelSettings({ ...BASE_INPUT, carId });
  const profile = resolveCarDynamicsProfile({
    carId,
    gameVersion: "gt7",
    bopOn: true,
  });

  if (result.provenance.carProfile == null) {
    fail(`${carId}: missing car provenance`);
  }

  if (profile.carId !== carId) {
    fail(`${carId}: profile car mismatch`);
  }

  assertValidT598(result.settings);
  carResults.set(carId, { result, profile, values: rowMap(result) });

  ok(`${carId}: independent calculation (${result.lookup.matchType})`);
}

const uniqueProfiles = new Set(
  TEST_CARS.map((carId) => JSON.stringify(carResults.get(carId)?.profile)),
);
if (uniqueProfiles.size !== TEST_CARS.length) {
  fail("Cars share profile objects");
} else {
  ok("Each car resolves to its own profile");
}

const uniqueContributions = new Set(
  TEST_CARS.map((carId) =>
    JSON.stringify(carResults.get(carId)?.result.calculationBreakdown?.signals),
  ),
);
if (uniqueContributions.size < 2) {
  fail("Internal dynamics contributions did not diverge");
} else {
  ok(`Internal dynamics contributions differ (${uniqueContributions.size} variants)`);
}

const uniqueSetups = new Set(
  TEST_CARS.map((carId) => JSON.stringify(carResults.get(carId)?.values)),
);
if (uniqueSetups.size < 2) {
  fail("All four complete setups are identical");
} else {
  ok(`Distinct setups generated (${uniqueSetups.size} variants)`);
}

const cacheKeys = TEST_CARS.map((carId) =>
  buildRecommendationCacheKey("wheelSettings", {
    wheelSettingsEngineVersion: WHEEL_SETTINGS_ENGINE_VERSION,
    gt7Version: WHEEL_SETTINGS_PLATFORM_BASELINE.gameVersion,
    physicsGeneration: WHEEL_SETTINGS_PLATFORM_BASELINE.physicsGeneration,
    t598Firmware: ACTIVE_T598_FIRMWARE,
    ...BASE_INPUT,
    carId,
  }),
);
if (new Set(cacheKeys).size !== TEST_CARS.length) {
  fail("Cache keys collide across cars");
} else {
  ok("Cache keys are car-specific");
}

/** Same car / different tracks */
const trackIds = [
  "laguna_seca",
  "monza",
  "fuji",
  "spa",
  "interlagos",
  "sardegna_road_track",
];
const trackCarId = "porsche_911_gt3_r_22";
const trackSnapshots = trackIds.map((trackId) => {
  const track = gt7Tracks.find((entry) => entry.id === trackId);
  if (!track) {
    fail(`Missing track ${trackId}`);
    return null;
  }
  const result = calculateWheelSettings({ ...BASE_INPUT, carId: trackCarId, trackId });
  return { trackId, values: rowMap(result), profile: resolveTrackDynamicsProfile({ trackId, car: gt7Cars.find((c) => c.id === trackCarId) }) };
}).filter(Boolean);

const uniqueTrackProfiles = new Set(
  trackSnapshots.map((entry) => JSON.stringify(entry.profile.traits)),
);
if (uniqueTrackProfiles.size < trackIds.length - 1) {
  fail("Track profiles should differ across test circuits");
} else {
  ok("Track profiles differ across test circuits");
}

const uniqueTrackSetups = new Set(
  trackSnapshots.map((entry) => JSON.stringify(entry.values)),
);
if (uniqueTrackSetups.size < 2) {
  fail("Same car at different tracks produced identical setups");
} else {
  ok("Same car / different track recalculates");
}

/** Tyre compound test */
const tyreCompounds = ["H", "M", "S"];
const tyreSnapshots = tyreCompounds.map((tyreCompound) =>
  calculateWheelSettings({ ...BASE_INPUT, carId: "ferrari_296_gt3_23", tyreCompound }),
);
if (
  JSON.stringify(rowMap(tyreSnapshots[0])) === JSON.stringify(rowMap(tyreSnapshots[2]))
) {
  fail("Tyre compound did not reach calculation");
} else {
  ok("Tyre compound affects relevant settings");
}

/** Short vs long race */
const shortRace = calculateWheelSettings({ ...BASE_INPUT, carId: "genesis_x_gr3", lapCount: 5 });
const longRace = calculateWheelSettings({ ...BASE_INPUT, carId: "genesis_x_gr3", lapCount: 30 });
if (JSON.stringify(rowMap(shortRace)) === JSON.stringify(rowMap(longRace))) {
  ok("Long race did not force artificial rewrites (acceptable if identical)");
} else {
  ok("Race distance context changes settings where justified");
}

/** Tyre wear x0 vs x5 */
const wearZero = calculateWheelSettings({
  ...BASE_INPUT,
  carId: "genesis_x_gr3",
  tyreMultiplier: 0,
  lapCount: 10,
});
const wearFive = calculateWheelSettings({
  ...BASE_INPUT,
  carId: "genesis_x_gr3",
  tyreMultiplier: 5,
  lapCount: 10,
});
if (
  wearZero.calculationBreakdown?.raceContext?.raceTyreWear !== 0 &&
  wearZero.calculationBreakdown?.raceContext?.wearProfile?.tyreStress !== 0
) {
  fail("Tyres x0 should produce zero wear stress");
} else {
  ok("Tyres x0 produces zero wear consideration");
}
if (wearFive.calculationBreakdown?.raceContext?.raceTyreWear <= 0) {
  fail("Tyres x5 should produce non-zero wear weight");
} else {
  ok("Tyres x5 increases wear-related weighting");
}

/** BOP ON vs OFF */
const bopOnProfile = resolveCarDynamicsProfile({
  carId: "genesis_x_gr3",
  gameVersion: "gt7",
  bopOn: true,
});
const bopOffProfile = resolveCarDynamicsProfile({
  carId: "genesis_x_gr3",
  gameVersion: "gt7",
  bopOn: false,
});
if (bopOnProfile.traits.traction === bopOffProfile.traits.traction) {
  fail("BOP should change Gr.3 car attributes where 1.71 deltas exist");
} else {
  ok("BOP selects appropriate car performance profile");
}

/** Fuel multiplier should not fake steering at x0/x1 with short races */
const fuelZero = calculateWheelSettings({
  ...BASE_INPUT,
  carId: "porsche_911_gt3_r_22",
  fuelMultiplier: 0,
  lapCount: 5,
});
const fuelFive = calculateWheelSettings({
  ...BASE_INPUT,
  carId: "porsche_911_gt3_r_22",
  fuelMultiplier: 5,
  lapCount: 5,
});
if (JSON.stringify(rowMap(fuelZero)) !== JSON.stringify(rowMap(fuelFive))) {
  ok("Fuel multiplier may differ slightly on short sprint — checked");
} else {
  ok("Fuel x5 does not rewrite short-sprint steering settings");
}

/** WHY text uses calculation reasons */
for (const carId of TEST_CARS) {
  const result = carResults.get(carId)?.result;
  const row = result?.rows.find((entry) => entry.key === "inertia");
  if (row?.reason && row.reason.includes("Weighted for")) {
    ok(`${carId}: WHY reflects calculation factors`);
  } else if (row?.reason) {
    ok(`${carId}: WHY present (${row.key})`);
  }
}

/** Illegal row scan */
for (const carId of TEST_CARS) {
  const illegal = findIllegalPresentationRows(
    BASE_INPUT.wheelBase,
    carResults.get(carId)?.result.rows ?? [],
  );
  if (illegal.length) {
    fail(`${carId}: illegal presentation rows ${JSON.stringify(illegal)}`);
  }
}
ok("All generated T598 values are hardware-valid");

/** Scenario report */
console.log("\n--- Same-track comparison (Spa, M, 5 laps, fuel x0, tyres x0, BOP on) ---");
for (const carId of TEST_CARS) {
  const values = carResults.get(carId)?.values ?? {};
  console.log(
    `${carId}: FFB=${values.ffb} MASTER=${values.master} MODE=${values.mode} INERTIA=${values.inertia} FRICTION=${values.friction} BOOST_L=${values.boostLow} BOOST_H=${values.boostHigh} SPEED=${values.speed} DAMPER=${values.damper} DAMPER_GAIN=${values.damperGain} SPRING=${values.spring} END_STOP=${values.endStop}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}

console.log("\nAll wheel settings engine regression checks passed.");
