/**
 * Canonical GT7 racing-class assignment tests.
 * Class filters must use verified metadata — never name matching.
 */

import {
  BMW_CLASS_VALIDATION_CASES,
  auditGt7ClassAssignments,
  filterCarsByCanonicalGt7Class,
  getCanonicalGt7RacingClass,
  isCarInCanonicalGt7RacingClass,
} from "../src/data/gt7/gt7CanonicalClasses.js";
import {
  getAllCarsForGame,
  getCarsForGame,
  getSelectableCarsForClass,
} from "../src/utils/gameData.js";
import { isCarInClass } from "../src/utils/carClassFilter.js";
import { getGT7Car, isAvailableInGT7 } from "../src/data/gt7/officialCarCatalogue.js";

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

const selectable = getCarsForGame("gt7");
const all = getAllCarsForGame("gt7");
const gr3 = getSelectableCarsForClass("gt7", "Gr.3");
const gr4 = getSelectableCarsForClass("gt7", "Gr.4");

console.log("═══ Explicit BMW validation ═══");
for (const spec of BMW_CLASS_VALIDATION_CASES) {
  const inSelectable = selectable.find((c) => c.id === spec.id) ?? null;
  const inAll = all.find((c) => c.id === spec.id) ?? null;

  if (spec.availableInGT7) {
    if (inSelectable && inSelectable.availableInGT7 === true) {
      ok(`${spec.id} availableInGT7=true`);
    } else fail(`${spec.id} should be available/selectable`);

    if (getCanonicalGt7RacingClass(inSelectable) === spec.class) {
      ok(`${spec.id} canonical class = ${spec.class}`);
    } else {
      fail(
        `${spec.id} class=${getCanonicalGt7RacingClass(inSelectable)} expected ${spec.class}`,
      );
    }

    for (const bucket of spec.mustAppearIn) {
      const list = getSelectableCarsForClass("gt7", bucket);
      if (list.some((c) => c.id === spec.id)) ok(`${spec.id} appears in ${bucket}`);
      else fail(`${spec.id} missing from ${bucket}`);
    }
    for (const bucket of spec.mustNotAppearIn) {
      const list = getSelectableCarsForClass("gt7", bucket);
      if (!list.some((c) => c.id === spec.id)) ok(`${spec.id} absent from ${bucket}`);
      else fail(`${spec.id} leaked into ${bucket}`);
    }
  } else {
    if (!inSelectable && isAvailableInGT7(spec.id) === false) {
      ok(`${spec.id} availableInGT7=false / not in any GT7 selector pool`);
    } else fail(`${spec.id} still selectable`);
    if (inAll && inAll.gt7RacingClass == null) {
      ok(`${spec.id} has no active gt7RacingClass eligibility`);
    } else fail(`${spec.id} still has gt7RacingClass=${inAll?.gt7RacingClass}`);
    for (const bucket of ["Gr.1", "Gr.2", "Gr.3", "Gr.4"]) {
      if (!getSelectableCarsForClass("gt7", bucket).some((c) => c.id === spec.id)) {
        continue;
      }
      fail(`${spec.id} appeared in ${bucket}`);
    }
    ok(`${spec.id} absent from all racing-class selectors`);
  }
}

console.log("\n═══ Cross-class leakage ═══");
const gr3Leaks = gr3.filter((c) => c.class !== "Gr.3" || c.gt7RacingClass !== "Gr.3");
const gr4Leaks = gr4.filter((c) => c.class !== "Gr.4" || c.gt7RacingClass !== "Gr.4");
if (gr3Leaks.length === 0) ok("no non-Gr.3 cars in Gr.3 selector");
else fail(`Gr.3 leaks: ${gr3Leaks.map((c) => c.id).join(", ")}`);

if (gr4Leaks.length === 0) ok("no non-Gr.4 cars in Gr.4 selector");
else fail(`Gr.4 leaks: ${gr4Leaks.map((c) => c.id).join(", ")}`);

const gr3HasGr4 = gr3.some((c) => c.id === "bmw_m4_gr4" || c.class === "Gr.4");
const gr4HasGr3 = gr4.some((c) => c.class === "Gr.3");
if (!gr3HasGr4) ok("Gr.4 cars do not appear in Gr.3 selector");
else fail("Gr.4 car found in Gr.3");
if (!gr4HasGr3) ok("Gr.3 cars do not appear in Gr.4 selector");
else fail("Gr.3 car found in Gr.4");

console.log("\n═══ Road cars excluded from racing selectors ═══");
const roadish = selectable.filter(
  (c) => c.class === "N" || c.class === "Vision GT" || c.gt7RacingClass == null,
);
let roadLeak = false;
for (const car of roadish) {
  for (const bucket of ["Gr.1", "Gr.2", "Gr.3", "Gr.4"]) {
    if (getSelectableCarsForClass("gt7", bucket).some((c) => c.id === car.id)) {
      fail(`road/non-racing ${car.id} in ${bucket}`);
      roadLeak = true;
    }
  }
}
if (!roadLeak) ok("road / non-racing cars excluded from racing-class selectors");

const rxVision = selectable.find((c) => c.id === "mazda_rx_vision_gr4");
if (!rxVision || rxVision.class === "N") {
  if (!gr3.some((c) => c.id === "mazda_rx_vision_gr4") && !gr4.some((c) => c.id === "mazda_rx_vision_gr4")) {
    ok("Mazda RX-Vision '15 (road) not in Gr.3/Gr.4 selectors");
  } else fail("RX-Vision road car leaked into racing selector");
}

console.log("\n═══ Invalid cars must not receive active GT7 racing class ═══");
const invalidActive = all.filter(
  (c) => c.availableInGT7 === false && c.gt7RacingClass != null,
);
if (invalidActive.length === 0) {
  ok("no invalid/non-GT7 car retains active gt7RacingClass");
} else {
  fail(`invalid with racing class: ${invalidActive.map((c) => c.id).join(", ")}`);
}

console.log("\n═══ Class filter ignores name tokens ═══");
const fakeByName = {
  id: "fake_gt3_named_gr4",
  name: "Something GT3 Gr.3",
  class: "Gr.4",
  availableInGT7: true,
  gt7RacingClass: "Gr.4",
};
if (isCarInCanonicalGt7RacingClass(fakeByName, "Gr.4") && !isCarInCanonicalGt7RacingClass(fakeByName, "Gr.3")) {
  ok("class membership follows canonical class field, not GT3/Gr.3 in the name");
} else fail("name-based class inference detected");

if (!isCarInClass({ id: "x", name: "BMW M4 Gr.4", class: "Gr.4", availableInGT7: true, gt7RacingClass: "Gr.4" }, "Gr.3")) {
  ok("isCarInClass does not place Gr.4 into Gr.3 via name");
} else fail("isCarInClass name leak");

console.log("\n═══ Full selectable audit ═══");
const audit = auditGt7ClassAssignments(selectable);
const critical = audit.filter(
  (row) =>
    row.issue.includes("selector_") ||
    row.issue.includes("road_or_non_racing") ||
    row.issue.includes("invalid_gt7_car"),
);
if (critical.length === 0) ok(`full race-car class audit clean (${selectable.length} selectable)`);
else {
  fail(`audit issues: ${critical.map((i) => `${i.id}:${i.issue}`).join("; ")}`);
}

// Positive official presence still holds
if (getGT7Car("BMW M4 Gr.4") || getGT7Car("M4 Gr.4")) ok("official catalogue still has M4 Gr.4");
else fail("M4 Gr.4 missing from official catalogue");

console.log("\n════════════════════════════════════════════════════════════");
if (failed === 0) {
  console.log(`GT7 class assignment: ${passed} passed, 0 failed`);
  process.exit(0);
}
console.log(`GT7 class assignment: ${passed} passed, ${failed} failed`);
process.exit(1);
