import {
  WHEEL_BASE_OPTIONS,
  getTemplateFamilyForWheelBase,
  getTemplateFieldsForWheelBase,
} from "../src/data/wheelBases.js";
import { cars as gt7Cars } from "../src/data/gt7/cars.js";
import { tracks as gt7Tracks } from "../src/data/gt7/tracks.js";
import { TYRE_COMPOUND_OPTIONS } from "../src/data/tyreCompounds.js";
import {
  findWheelSetup,
  buildWheelSetupPresentation,
} from "../src/engine/wheelSettingsEngine.js";
import {
  findIllegalPresentationRows,
  sanitizeT598Value,
} from "../src/engine/wheelSchemaValidation.js";
import { isInvalidWheelReason } from "../src/data/wheelFieldHelp.js";
import { commitLapCountInput } from "../src/utils/raceDistance.js";

let failures = 0;

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK ${message}`);
}

const classes = [...new Set(gt7Cars.map((car) => car.class))];
ok(`GT7 car inventory: ${gt7Cars.length} cars across ${classes.join(", ")}`);
ok(`GT7 track inventory: ${gt7Tracks.length} layouts`);
ok(`Tyre compounds: ${TYRE_COMPOUND_OPTIONS.join(", ")}`);
ok(`Wheel bases: ${WHEEL_BASE_OPTIONS.map((option) => option.label).join(", ")}`);

if (sanitizeT598Value("master", "97") !== "95%") {
  fail(`T598 MASTER 97 should snap to 95%, got ${sanitizeT598Value("master", "97")}`);
} else {
  ok("T598 MASTER snaps to 5% increments");
}

if (sanitizeT598Value("damper", "22%") !== "20%") {
  fail(`T598 DAMPER 22% should snap to 20%, got ${sanitizeT598Value("damper", "22%")}`);
} else {
  ok("T598 DAMPER snaps to 10% increments");
}

if (sanitizeT598Value("inertia", "EXT") !== "Extreme") {
  fail(`T598 INERTIA EXT should map to Extreme`);
} else {
  ok("T598 INERTIA aliases EXT → Extreme");
}

if (sanitizeT598Value("boostLow", "1") !== "+1") {
  fail(`T598 BOOST LOW 1 should map to +1`);
} else {
  ok("T598 BOOST signs are legal");
}

const representativeCars = classes
  .map((carClass) => gt7Cars.find((car) => car.class === carClass))
  .filter(Boolean);

const representativeTracks = [
  gt7Tracks.find((track) => track.id === "spa"),
  gt7Tracks.find((track) => track.id === "suzuka"),
  gt7Tracks.find((track) => track.id === "dragon_trail_seaside"),
  gt7Tracks.find((track) => track.id === "brands_hatch"),
  gt7Tracks.find((track) => track.id === "daytona_road_course"),
].filter(Boolean);

const conditionMatrix = [
  { tyreCompound: "S", bopOn: true, lapCount: 1, fuelMultiplier: 1, tyreMultiplier: 1 },
  { tyreCompound: "M", bopOn: true, lapCount: 21, fuelMultiplier: 1, tyreMultiplier: 1 },
  { tyreCompound: "H", bopOn: false, lapCount: 40, fuelMultiplier: 3, tyreMultiplier: 5 },
  { tyreCompound: "IM", bopOn: true, lapCount: 0, fuelMultiplier: 1, tyreMultiplier: 1 },
  { tyreCompound: "W", bopOn: false, lapCount: 12, fuelMultiplier: 2, tyreMultiplier: 2 },
];

let combinationCount = 0;

for (const option of WHEEL_BASE_OPTIONS) {
  const allowedKeys = new Set(
    getTemplateFieldsForWheelBase(option.id).map((field) => field.key),
  );

  for (const car of representativeCars) {
    for (const track of representativeTracks) {
      for (const conditions of conditionMatrix) {
        combinationCount += 1;
        const filters = {
          gameVersion: "gt7",
          wheelBase: option.id,
          carId: car.id,
          trackId: track.id,
          ...conditions,
        };

        let lookup;
        let presentation;
        try {
          lookup = findWheelSetup(filters);
          presentation = buildWheelSetupPresentation(lookup.setup, filters);
        } catch (error) {
          fail(`${option.id} / ${car.id} / ${track.id}: threw ${error.message}`);
          continue;
        }

        if (!lookup.setup) {
          fail(`${option.label}: no setup for ${car.id} @ ${track.id}`);
          continue;
        }

        const rows = presentation.rows;
        if (!rows.length) {
          fail(`${option.label}: empty rows for ${car.id} @ ${track.id}`);
          continue;
        }

        const leaked = rows.find((row) => !allowedKeys.has(row.key));
        if (leaked) {
          fail(
            `${option.label}: leaked field ${leaked.key} (${leaked.label}) from another schema`,
          );
          continue;
        }

        const illegal = findIllegalPresentationRows(option.id, rows);
        if (illegal.length) {
          fail(
            `${option.label}: illegal ${illegal
              .map((item) => `${item.key}=${item.value} (${item.reason})`)
              .join("; ")}`,
          );
          continue;
        }

        const undefinedRow = rows.find(
          (row) =>
            row.value == null ||
            Number.isNaN(row.value) ||
            String(row.value) === "undefined",
        );
        if (undefinedRow) {
          fail(`${option.label}: undefined/NaN on ${undefinedRow.key}`);
        }

        const badReason = rows.find((row) =>
          isInvalidWheelReason(row.reason, row.label, row.value),
        );
        if (badReason && badReason.value !== "—") {
          fail(
            `${option.label}: invalid reason for ${badReason.label} (${badReason.reason})`,
          );
        }
      }
    }
  }
}

ok(`Programmatic combinations checked: ${combinationCount}`);

const allCarsT598 = [];
for (const car of gt7Cars) {
  const lookup = findWheelSetup({
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: car.id,
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
  });
  if (!lookup.setup) {
    allCarsT598.push(car.id);
  }
}

if (allCarsT598.length) {
  fail(`T598 missing setup for cars: ${allCarsT598.join(", ")}`);
} else {
  ok(`T598 produced a setup for every GT7 car (${gt7Cars.length}) at Spa`);
}

const allTracksT598 = [];
for (const track of gt7Tracks) {
  const lookup = findWheelSetup({
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId: "mercedes_amg_gt3_20",
    trackId: track.id,
    tyreCompound: "M",
    bopOn: true,
  });
  if (!lookup.setup) {
    allTracksT598.push(track.id);
  }
}

if (allTracksT598.length) {
  fail(`T598 missing setup for tracks: ${allTracksT598.join(", ")}`);
} else {
  ok(`T598 produced a setup for every GT7 track (${gt7Tracks.length}) with Mercedes AMG GT3`);
}

const switchAll = WHEEL_BASE_OPTIONS.map((option) => option.id);
let previousFamily = null;
let previousFirst = null;

for (const wheelBaseId of [
  ...switchAll,
  "thrustmaster_t598",
  "logitech_rs50",
  "logitech_g_pro",
  "logitech_g923",
  "fanatec_gt_dd_pro",
  "thrustmaster_t598",
]) {
  const lookup = findWheelSetup({
    gameVersion: "gt7",
    wheelBase: wheelBaseId,
    carId: "mercedes_amg_gt3_20",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
  });
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  const rows = buildWheelSetupPresentation(lookup.setup, {
    gameVersion: "gt7",
    wheelBase: wheelBaseId,
    carId: "mercedes_amg_gt3_20",
    trackId: "spa",
    tyreCompound: "M",
    bopOn: true,
    fuelMultiplier: 1,
    tyreMultiplier: 1,
    lapCount: 20,
  }).rows;
  const first = rows[0]?.label;
  const expected = getTemplateFieldsForWheelBase(wheelBaseId)[0]?.label;

  if (first !== expected) {
    fail(`switch ${wheelBaseId}: first field ${first}, expected ${expected}`);
  }

  if (wheelBaseId !== "thrustmaster_t598" && first === "FFB") {
    fail(`switch ${wheelBaseId}: leaked T598 FFB field`);
  }

  if (previousFamily && family !== previousFamily && first === previousFirst) {
    fail(`switch ${wheelBaseId}: schema did not change from ${previousFamily}`);
  }

  previousFamily = family;
  previousFirst = first;
}

ok("Wheel switch across every supported base did not leak T598 controls");

if (commitLapCountInput("") !== 0 || commitLapCountInput("21") !== 21) {
  fail("lap commit regression inside coverage script");
} else {
  ok("Lap commit still allows 0 and 21");
}

if (failures > 0) {
  console.error(`\n${failures} coverage test(s) failed.`);
  process.exit(1);
}

console.log("\nWheel coverage, schema, and switch tests passed.");
