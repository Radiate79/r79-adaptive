import { cars as gt7Cars } from "../src/data/gt7/cars.js";
import { tracks as gt7Tracks } from "../src/data/gt7/tracks.js";
import { computeCarTrackInteraction } from "../src/engine/carTrackInteraction.js";
import {
  buildRecommendationCacheKey,
  clearRecommendationCache,
  hasCachedRecommendation,
} from "../src/engine/recommendationCache.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";

let failures = 0;

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK ${message}`);
}

const TEST_CARS = [
  "genesis_x_gr3",
  "porsche_911_gt3_r_22",
  "ferrari_296_gt3_23",
  "mazda_rx_vision_gt3_concept",
];

const SHARED_FILTERS = {
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  trackId: "spa",
  tyreCompound: "M",
  bopOn: true,
};

const PODIUM_INPUT = {
  ...SHARED_FILTERS,
  fuelMultiplier: 0,
  tyreMultiplier: 0,
  lapCount: 5,
};

function rowValues(rows) {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function getCarProfile(carId) {
  return gt7Cars.find((car) => car.id === carId) ?? null;
}

clearRecommendationCache();

ok("Regression: same track/conditions, change car only");

/** @type {Map<string, { lookup: ReturnType<typeof findWheelSetup>, presentation: ReturnType<typeof buildWheelSetupPresentation>, profile: ReturnType<typeof getCarProfile>, baseline: ReturnType<typeof applyCarProfileToWheelBaseline> }>} */
const results = new Map();

for (const carId of TEST_CARS) {
  const profile = getCarProfile(carId);
  if (!profile) {
    fail(`Missing car profile for ${carId}`);
    continue;
  }

  const result = calculateWheelSettings({ ...PODIUM_INPUT, carId });
  const lookup = result.lookup;

  if (!lookup.setup) {
    fail(`${carId}: calculateWheelSettings returned no setup`);
    continue;
  }

  const baseline = result.settings ?? {};

  const presentationKey = buildRecommendationCacheKey("wheelSettings", {
    wheelSettingsEngineVersion: "2",
    gt7Version: "1.71",
    physicsGeneration: "GT7_1_71_PHYSICS",
    t598Firmware: "3.08",
    ...PODIUM_INPUT,
    carId,
  });

  clearRecommendationCache();
  calculateWheelSettings({ ...PODIUM_INPUT, carId });
  const presentation = result;

  if (hasCachedRecommendation(presentationKey)) {
    ok(`${carId}: wheel settings cache key includes selected car`);
  } else {
    fail(`${carId}: expected wheel settings cache entry for car-specific key`);
  }

  results.set(carId, { lookup, presentation, profile, baseline });

  ok(
    `${carId}: lookup=${lookup.matchType}, setupCar=${lookup.setup.carId}, profile=${profile.name}`,
  );
  ok(`${carId}: baseline mode=${baseline.mode}, inertia=${baseline.inertia}, damper=${baseline.damper}`);
}

const profiles = TEST_CARS.map((carId) => results.get(carId)?.profile);
const uniqueProfiles = new Set(profiles.map((profile) => JSON.stringify(profile)));
if (uniqueProfiles.size !== TEST_CARS.length) {
  fail("Multiple test cars resolved to the same profile object");
} else {
  ok("Each test car resolves to its own car profile");
}

const baselines = TEST_CARS.map((carId) => JSON.stringify(results.get(carId)?.baseline));
const uniqueBaselines = new Set(baselines);
if (uniqueBaselines.size < 2) {
  fail("Car-specific baselines did not diverge across test cars");
} else {
  ok(`Car baselines independently computed (${uniqueBaselines.size} distinct results)`);
}

const presentationSnapshots = TEST_CARS.map((carId) =>
  JSON.stringify(rowValues(results.get(carId)?.presentation.rows ?? [])),
);
const uniquePresentations = new Set(presentationSnapshots);
if (uniquePresentations.size < 2) {
  fail("Full presentations were identical across all test cars with same track/conditions");
} else {
  ok(`Presentations independently evaluated (${uniquePresentations.size} distinct setups)`);
}

const genesisPresentation = rowValues(results.get("genesis_x_gr3")?.presentation.rows ?? []);
const porschePresentation = rowValues(
  results.get("porsche_911_gt3_r_22")?.presentation.rows ?? [],
);
if (JSON.stringify(genesisPresentation) === JSON.stringify(porschePresentation)) {
  fail("Genesis and Porsche produced identical wheel settings on the same track");
} else {
  ok("Genesis vs Porsche: settings differ on same track (independent evaluation confirmed)");
}

clearRecommendationCache();
ok("Regression: same car, change track only");

const trackA = "spa";
const trackB = "suzuka";
const carId = "porsche_911_gt3_r_22";

const spaLookup = calculateWheelSettings({ ...SHARED_FILTERS, carId, trackId: trackA });
const suzukaLookup = calculateWheelSettings({ ...SHARED_FILTERS, carId, trackId: trackB });

if (!spaLookup.lookup.setup || !suzukaLookup.lookup.setup) {
  fail("Track reverse-case lookup failed");
} else {
  const spaTrackRecord = gt7Tracks.find((track) => track.id === trackA);
  const suzukaTrackRecord = gt7Tracks.find((track) => track.id === trackB);

  const spaTrack = computeCarTrackInteraction(getCarProfile(carId), spaTrackRecord);
  const suzukaTrack = computeCarTrackInteraction(getCarProfile(carId), suzukaTrackRecord);

  const spaPresentation = spaLookup;
  const suzukaPresentation = suzukaLookup;

  const spaValues = rowValues(spaPresentation.rows);
  const suzukaValues = rowValues(suzukaPresentation.rows);

  if (JSON.stringify(spaTrack) === JSON.stringify(suzukaTrack)) {
    fail("Track profiles should differ between Spa and Suzuka");
  } else {
    ok("Track interaction profile changes between Spa and Suzuka");
  }

  if (JSON.stringify(spaValues) === JSON.stringify(suzukaValues)) {
    fail("Same car at different tracks produced identical wheel settings");
  } else {
    ok("Same car / different track: setup recalculates correctly");
  }
}

clearRecommendationCache();
ok("Cache isolation: changing car must not reuse previous presentation");

const firstCarPresentationKey = buildRecommendationCacheKey("wheelSettings", {
  wheelSettingsEngineVersion: "2",
  gt7Version: "1.71",
  physicsGeneration: "GT7_1_71_PHYSICS",
  t598Firmware: "3.08",
  ...PODIUM_INPUT,
  carId: "genesis_x_gr3",
});

const secondCarPresentationKey = buildRecommendationCacheKey("wheelSettings", {
  wheelSettingsEngineVersion: "2",
  gt7Version: "1.71",
  physicsGeneration: "GT7_1_71_PHYSICS",
  t598Firmware: "3.08",
  ...PODIUM_INPUT,
  carId: "porsche_911_gt3_r_22",
});

if (firstCarPresentationKey === secondCarPresentationKey) {
  fail("Presentation cache keys collide across different cars");
} else {
  ok("Presentation cache keys are car-specific");
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}

console.log("\nAll wheel car-independence regression checks passed.");
