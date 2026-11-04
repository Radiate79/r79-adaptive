/**
 * Official GT7 catalogue + availability regression tests.
 */

import {
  GT7_OFFICIAL_CAR_COUNT_EXPECTED,
  GT7_OFFICIAL_CATALOGUE_VERSION,
  INVALID_GT7_R79_CAR_IDS,
  getGT7Car,
  getOfficialGt7CatalogueStats,
  isAvailableInGT7,
  searchGT7,
} from "../src/data/gt7/officialCarCatalogue.js";
import { getCarsForGame } from "../src/utils/gameData.js";
import { cars as rawCars } from "../src/data/gt7/cars.js";

let passed = 0;
let failed = 0;
function ok(msg) {
  passed += 1;
  console.log(`OK    ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.log(`FAIL  ${msg}`);
}

console.log("═══ Official catalogue snapshot ═══");
const stats = getOfficialGt7CatalogueStats();
if (stats.count === GT7_OFFICIAL_CAR_COUNT_EXPECTED) {
  ok(`official GT7 catalogue count = ${stats.count}`);
} else fail(`count ${stats.count} != ${GT7_OFFICIAL_CAR_COUNT_EXPECTED}`);

if (stats.duplicateIds === 0) ok("no duplicate canonical IDs");
else fail(`duplicate ids: ${stats.duplicateIds}`);

if (stats.duplicateNames === 0) ok("no duplicate manufacturer+name pairs");
else fail(`duplicate names: ${stats.duplicateNames}`);

if (stats.emptyNames === 0) ok("all required names are non-empty");
else fail(`empty names: ${stats.emptyNames}`);

if (stats.allGt7) ok("all entries have GT7 availability");
else fail("entries missing gt7:true");

if (GT7_OFFICIAL_CATALOGUE_VERSION) ok(`catalogueVersion ${GT7_OFFICIAL_CATALOGUE_VERSION}`);
else fail("missing catalogueVersion");

console.log("\n═══ Required negative tests ═══");
if (searchGT7("Bentley Continental GT3").length === 0) {
  ok('searchGT7("Bentley Continental GT3") returns no selectable car');
} else fail("Bentley search leaked a GT7 car");

if (searchGT7("BMW M4 GT3").length === 0) {
  ok('searchGT7("BMW M4 GT3") returns no selectable car');
} else fail("BMW M4 GT3 search leaked a GT7 car");

if (getGT7Car("Bentley Continental GT3") == null) {
  ok('getGT7Car("Bentley Continental GT3") unavailable/null');
} else fail("Bentley getGT7Car should be null");

if (getGT7Car("BMW M4 GT3") == null) {
  ok('getGT7Car("BMW M4 GT3") unavailable/null');
} else fail("BMW M4 GT3 getGT7Car should be null");

if (isAvailableInGT7("bmw_m4_gt3") === false) ok("bmw_m4_gt3 isAvailableInGT7=false");
else fail("bmw_m4_gt3 still available");

if (isAvailableInGT7("bentley_continental_gt3_18") === false) {
  ok("bentley_continental_gt3_18 isAvailableInGT7=false");
} else fail("bentley still available");

console.log("\n═══ Required positive tests ═══");
const positives = [
  ["BMW M4 Gr.4", "M4 Gr.4"],
  ["BMW M6 GT3 Endurance Model '16", "M6 GT3 Endurance Model '16"],
  ["BMW M6 GT3 Sprint Model '16", "M6 GT3 Sprint Model '16"],
  ["BMW Z4 GT3 '11", "Z4 GT3 '11"],
  ["Audi R8 LMS '15", "R8 LMS '15"],
  ["Audi R8 LMS Evo '19", "R8 LMS Evo '19"],
  ["Ferrari 296 GT3 '23", "296 GT3 '23"],
  ["MAZDA RX-VISION GT3 EVO '26", "RX-VISION GT3 EVO '26"],
];
for (const [query, expectName] of positives) {
  const hit = getGT7Car(query) || searchGT7(query)[0];
  if (hit && hit.name === expectName) ok(`resolves ${query}`);
  else fail(`failed to resolve ${query} → ${hit?.name ?? "null"}`);
}

console.log("\n═══ Selectors exclude invalid cars ═══");
const selectable = getCarsForGame("gt7");
const leaked = selectable.filter((car) => INVALID_GT7_R79_CAR_IDS.includes(car.id));
if (leaked.length === 0) ok("getCarsForGame(gt7) contains zero invalid catalogue cars");
else fail(`leaked: ${leaked.map((c) => c.id).join(", ")}`);

if (!selectable.some((c) => /bentley continental gt3/i.test(c.name))) {
  ok("Bentley Continental GT3 absent from GT7 dropdown pool");
} else fail("Bentley still in dropdown pool");

if (!selectable.some((c) => /^bmw m4 gt3$/i.test(c.name))) {
  ok("BMW M4 GT3 absent from GT7 dropdown pool");
} else fail("BMW M4 GT3 still in dropdown pool");

if (selectable.some((c) => c.id === "bmw_m4_gr4")) ok("BMW M4 Gr.4 remains selectable");
else fail("BMW M4 Gr.4 missing");

if (selectable.some((c) => c.id === "bmw_m6_gt3_endurance_model_16")) {
  ok("BMW M6 GT3 Endurance remains selectable");
} else fail("M6 Endurance missing");

if (selectable.some((c) => c.id === "bmw_m6_gt3_sprint_model")) {
  ok("BMW M6 GT3 Sprint remains selectable");
} else fail("M6 Sprint missing");

if (selectable.some((c) => c.id === "bmw_z4_gt3_11")) ok("BMW Z4 GT3 remains selectable");
else fail("Z4 GT3 missing");

if (selectable.some((c) => c.id === "audi_r8_lms_evo")) ok("Audi R8 LMS Evo remains selectable");
else fail("R8 LMS Evo missing");

if (selectable.some((c) => c.id === "mazda_rx_vision_gt3_evo_26")) {
  ok("Mazda RX-VISION GT3 EVO '26 remains selectable");
} else fail("Mazda Evo missing");

if (selectable.some((c) => c.id === "ferrari_296_gt3_23")) ok("Ferrari 296 GT3 remains selectable");
else fail("296 missing");

// Alias must not map M4 GT3 → M4 Gr.4
const m4gt3Search = searchGT7("BMW M4 GT3");
if (
  m4gt3Search.length === 0 ||
  !m4gt3Search.some((c) => /m4 gr\.?4/i.test(c.name))
) {
  ok("BMW M4 GT3 is not aliased to M4 Gr.4");
} else fail("M4 GT3 incorrectly aliased to Gr.4");

console.log("\n═══ Raw vs selectable ═══");
ok(`raw R79 cars ${rawCars.length}; selectable GT7 ${selectable.length}`);
ok(`invalid ids blocked: ${INVALID_GT7_R79_CAR_IDS.length}`);

console.log("\n════════════════════════════════════════════════════════════");
if (failed === 0) {
  console.log(`GT7 official catalogue: ${passed} passed, 0 failed`);
  process.exit(0);
}
console.log(`GT7 official catalogue: ${passed} passed, ${failed} failed`);
process.exit(1);
