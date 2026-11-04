/**
 * Development validation for GT7 data snapshots.
 * Detects duplicate IDs, illegal ranges, and missing Mazda Evo — does not scrape live sources.
 */

import { cars as gt7Cars } from "../src/data/gt7/cars.js";
import { getTracksForGame } from "../src/utils/gameData.js";
import {
  GR3_MEDIUM_BOP_172,
  MAZDA_RX_VISION_GT3_EVO_26_ID,
  resolveGr3Measurable,
} from "../src/data/gr3MediumBop172.js";
import { getGr3Measurable } from "../src/data/gr3Measurable171.js";
import { CLASS_BOP_PROFILE_RULES } from "../src/data/bopProfileModel.js";
import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  R79_GT7_DATA_SNAPSHOT_VERSION,
} from "../src/data/gt7PhysicsVersion.js";
import { getGt7SnapshotDiagnostics } from "../src/data/gt7/snapshotMetadata.js";

let failures = 0;

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  failures += 1;
}
function ok(msg) {
  console.log(`OK    ${msg}`);
}

console.log(`Validating snapshot ${R79_GT7_DATA_SNAPSHOT_VERSION}`);
console.log(`Game ${ACTIVE_GT7_GAME_VERSION} / physics ${ACTIVE_PHYSICS_GENERATION}`);

const ids = new Set();
for (const car of gt7Cars) {
  if (ids.has(car.id)) fail(`duplicate car id ${car.id}`);
  else ids.add(car.id);
  for (const field of ["weight", "weightKg", "power", "powerPs"]) {
    if (car[field] != null && Number(car[field]) <= 0) {
      fail(`negative/zero ${field} ${car.id}`);
    }
  }
}
ok(`${gt7Cars.length} cars, no duplicate IDs in scanned fields`);

if (!ids.has(MAZDA_RX_VISION_GT3_EVO_26_ID)) fail("Mazda Evo missing from catalog");
else ok("Mazda Evo present");

for (const [carId, overlay] of Object.entries(GR3_MEDIUM_BOP_172)) {
  if (!Number.isFinite(overlay.powerPs) || overlay.powerPs <= 0) {
    fail(`overlay power invalid ${carId}`);
  }
  if (!Number.isFinite(overlay.weightKg) || overlay.weightKg <= 0) {
    fail(`overlay weight invalid ${carId}`);
  }
  const mid = resolveGr3Measurable(carId, "mid");
  if (!mid) fail(`mid resolve missing ${carId}`);
  if ([mid.powerPs, mid.weightKg, mid.powerToWeightPsPerT].some((v) => Number.isNaN(v))) {
    fail(`NaN in mid row ${carId}`);
  }
}
ok(`${Object.keys(GR3_MEDIUM_BOP_172).length} medium overlays valid`);

// Ensure high values were not silently copied from mid overlays for Ferrari.
const ferrariMid = resolveGr3Measurable("ferrari_296_gt3_23", "mid");
const ferrariHigh = resolveGr3Measurable("ferrari_296_gt3_23", "high");
const ferrariHighBaseline = getGr3Measurable("ferrari_296_gt3_23", "high");
if (
  ferrariMid &&
  ferrariHigh &&
  ferrariHighBaseline &&
  ferrariHigh.weightKg === ferrariHighBaseline.weightKg &&
  ferrariMid.weightKg !== ferrariHigh.weightKg
) {
  ok("Gr.3 high/mid not collapsed into one fabricated table");
} else {
  // Still ok if mid equals high historically — but provenance must differ.
  if (ferrariHigh?.provenance?.status === "AWAITING_1_72_VERIFICATION") {
    ok("Gr.3 high remains awaiting 1.72 verification");
  } else fail("Gr.3 high/mid integrity unclear");
}

for (const cls of Object.keys(CLASS_BOP_PROFILE_RULES)) {
  ok(`${cls}: ${CLASS_BOP_PROFILE_RULES[cls].mode}`);
}

const tracks = getTracksForGame("gt7");
const trackIds = new Set();
for (const track of tracks) {
  if (trackIds.has(track.id)) fail(`duplicate track ${track.id}`);
  trackIds.add(track.id);
}
if (!trackIds.has("dragon_trail_gardens_reverse")) fail("Gardens Reverse missing");
else ok("Gardens Reverse present");
if (!trackIds.has("sugo")) fail("SUGO missing");
else ok("SUGO present");

const diag = getGt7SnapshotDiagnostics();
console.log(JSON.stringify(diag.carCounts, null, 2));

if (failures > 0) {
  console.error(`\nValidation failed: ${failures}`);
  process.exit(1);
}
console.log("\nSnapshot validation passed.");
