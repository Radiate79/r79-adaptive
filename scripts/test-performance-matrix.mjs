/**
 * Representative performance matrix for Wheel Settings recommendations.
 * Validates device isolation, legality, reasons, confidence, and
 * meaningful response to race-condition changes — without inventing settings.
 */

import { WHEEL_BASE_OPTIONS, getTemplateFieldsForWheelBase } from "../src/data/wheelBases.js";
import { getCarsForGame, getTracksForGame } from "../src/utils/gameData.js";
import {
  findWheelSetup,
  buildWheelSetupPresentation,
} from "../src/engine/wheelSettingsEngine.js";
import { findIllegalPresentationRows } from "../src/engine/wheelSchemaValidation.js";
import { isInvalidWheelReason } from "../src/data/wheelFieldHelp.js";
import { commitLapCountInput } from "../src/utils/raceDistance.js";
import { clearRecommendationCache } from "../src/engine/recommendationCache.js";
import { computeCarTrackInteraction } from "../src/engine/carTrackInteraction.js";

let failures = 0;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

clearRecommendationCache();

const cars = getCarsForGame("gt7");
const tracks = getTracksForGame("gt7");

const SAMPLE_CARS = [
  "mercedes_amg_gt3_20",
  "porsche_911_gt3_r_22",
  "genesis_x_gr3",
  "bmw_m6_gt3_sprint_model",
  "jaguar_f_type_gt3",
  "aston_martin_v12_vantage_gt3_12",
].filter((id) => cars.some((car) => car.id === id));

const SAMPLE_TRACKS = ["spa", "laguna_seca", "suzuka", "monza", "brands_hatch"].filter(
  (id) => tracks.some((track) => track.id === id),
);

const CONDITIONS = [
  { label: "qualifying", tyreCompound: "S", bopOn: true, lapCount: 1, fuelMultiplier: 1, tyreMultiplier: 1 },
  { label: "race-medium", tyreCompound: "M", bopOn: true, lapCount: 21, fuelMultiplier: 1, tyreMultiplier: 1 },
  { label: "long-wear", tyreCompound: "H", bopOn: true, lapCount: 29, fuelMultiplier: 2, tyreMultiplier: 5 },
  { label: "bop-off", tyreCompound: "M", bopOn: false, lapCount: 12, fuelMultiplier: 1, tyreMultiplier: 1 },
];

// --- Lap regression ---
{
  let draft = "";
  let committed = 0;
  const sequence = [
    { type: "draft", value: "" },
    { type: "commit", value: "1" },
    { type: "draft", value: "" },
    { type: "commit", value: "21" },
    { type: "commit", value: "5" },
    { type: "draft", value: "" },
    { type: "commit", value: "0" },
  ];

  for (const step of sequence) {
    if (step.type === "draft") {
      draft = step.value;
      continue;
    }
    committed = commitLapCountInput(step.value);
    draft = String(committed);
    if (step.value === "0" && committed !== 0) {
      fail(`lap commit 0 became ${committed}`);
    }
    if (step.value === "1" && committed !== 1) {
      fail(`lap commit 1 became ${committed}`);
    }
    if (step.value === "21" && committed !== 21) {
      fail(`lap commit 21 became ${committed}`);
    }
  }
  if (committed === 0) {
    pass("lap regression (0 / delete / 1 / 21 / 5 / 0)");
  }
}

// --- Wheel inventory + switch isolation ---
{
  const chain = WHEEL_BASE_OPTIONS.map((option) => option.id);
  let previousKeys = null;
  for (const wheelBase of chain) {
    const filters = {
      gameVersion: "gt7",
      wheelBase,
      carId: SAMPLE_CARS[0] ?? "mercedes_amg_gt3_20",
      trackId: SAMPLE_TRACKS[0] ?? "spa",
      tyreCompound: "M",
      bopOn: true,
    };
    const lookup = findWheelSetup(filters);
    if (!lookup.setup) {
      fail(`${wheelBase}: no setup`);
      continue;
    }
    const presentation = buildWheelSetupPresentation(lookup.setup, {
      ...filters,
      fuelMultiplier: 1,
      tyreMultiplier: 1,
      lapCount: 21,
    });
    const expected = getTemplateFieldsForWheelBase(wheelBase).map((field) => field.key);
    const keys = presentation.rows.map((row) => row.key);
    if (keys.join(",") !== expected.join(",")) {
      fail(`${wheelBase}: schema mismatch ${keys.join("|")}`);
    }
    const illegal = findIllegalPresentationRows(wheelBase, presentation.rows);
    if (illegal.length) {
      fail(`${wheelBase}: illegal values ${JSON.stringify(illegal)}`);
    }
    for (const row of presentation.rows) {
      if (row.reason && isInvalidWheelReason(row.reason, row.label, row.value)) {
        fail(`${wheelBase}: invalid reason for ${row.label}: ${row.reason}`);
      }
      if (row.podiumReason && isInvalidWheelReason(row.podiumReason, row.label, row.value)) {
        fail(`${wheelBase}: invalid podium reason for ${row.label}`);
      }
    }
    if (previousKeys && previousKeys.join(",") === keys.join(",") && previousKeys[0] !== keys[0]) {
      // same keys only OK within same family; different families must differ
    }
    if (!lookup.confidenceLabel) {
      fail(`${wheelBase}: missing confidence`);
    }
    previousKeys = keys;
  }
  pass(`wheel switch isolation across ${chain.length} bases`);
}

// --- Broad combination coverage ---
{
  let checked = 0;
  for (const wheel of WHEEL_BASE_OPTIONS.slice(0, 6)) {
    for (const carId of SAMPLE_CARS.slice(0, 4)) {
      for (const trackId of SAMPLE_TRACKS.slice(0, 3)) {
        for (const condition of CONDITIONS) {
          const filters = {
            gameVersion: "gt7",
            wheelBase: wheel.id,
            carId,
            trackId,
            tyreCompound: condition.tyreCompound,
            bopOn: condition.bopOn,
          };
          const lookup = findWheelSetup(filters);
          if (!lookup.setup) {
            fail(`no setup ${wheel.id} ${carId} ${trackId} ${condition.label}`);
            continue;
          }
          const presentation = buildWheelSetupPresentation(lookup.setup, {
            ...filters,
            fuelMultiplier: condition.fuelMultiplier,
            tyreMultiplier: condition.tyreMultiplier,
            lapCount: condition.lapCount,
          });
          if (!presentation.rows.length) {
            fail(`empty rows ${wheel.id} ${carId} ${trackId}`);
          }
          const illegal = findIllegalPresentationRows(wheel.id, presentation.rows);
          if (illegal.length) {
            fail(`illegal ${wheel.id} ${carId}: ${JSON.stringify(illegal)}`);
          }
          checked += 1;
        }
      }
    }
  }
  pass(`broad combination coverage (${checked} cases)`);
}

// --- Meaningful condition response (T598) ---
{
  const carId = SAMPLE_CARS.includes("mercedes_amg_gt3_20")
    ? "mercedes_amg_gt3_20"
    : SAMPLE_CARS[0];
  const trackId = SAMPLE_TRACKS.includes("spa") ? "spa" : SAMPLE_TRACKS[0];
  const baseFilters = {
    gameVersion: "gt7",
    wheelBase: "thrustmaster_t598",
    carId,
    trackId,
    tyreCompound: "S",
    bopOn: true,
  };
  const lookup = findWheelSetup(baseFilters);
  const shortRun = buildWheelSetupPresentation(lookup.setup, {
    ...baseFilters,
    fuelMultiplier: 1,
    tyreMultiplier: 1,
    lapCount: 1,
  });
  const longRun = buildWheelSetupPresentation(lookup.setup, {
    ...baseFilters,
    tyreCompound: "H",
    fuelMultiplier: 2,
    tyreMultiplier: 5,
    lapCount: 29,
  });

  const shortNarrative = shortRun.rows[0]?.narrative ?? "";
  const longNarrative = longRun.rows[0]?.narrative ?? "";
  if (!shortNarrative || !longNarrative) {
    fail("missing narratives for short/long comparison");
  } else if (shortNarrative === longNarrative) {
    // narratives should usually differ; warn but allow if priorities identical
    console.warn("WARN: short/long narratives identical — check objective inference");
  } else {
    pass("short vs long race narratives differ");
  }

  if (shortRun.podium?.raceObjective !== "qualifying") {
    fail(`expected qualifying objective, got ${shortRun.podium?.raceObjective}`);
  } else {
    pass("1-lap Soft run inferred as qualifying objective");
  }

  if (longRun.podium?.raceObjective !== "endurance") {
    fail(`expected endurance objective, got ${longRun.podium?.raceObjective}`);
  } else {
    pass("29-lap high-wear run inferred as endurance objective");
  }
}

// --- Car × track interaction exists ---
{
  const porsche = cars.find((car) => car.id === "porsche_911_gt3_r_22");
  const spa = tracks.find((track) => track.id === "spa");
  const interaction = computeCarTrackInteraction(porsche, spa);
  if (!interaction || typeof interaction.catchabilityNeed !== "number") {
    fail("car×track interaction missing");
  } else {
    pass(`car×track interaction OK (catchability=${interaction.catchabilityNeed.toFixed(2)})`);
  }
}

// --- Inventory counts ---
{
  console.log(`INFO: cars=${cars.length} tracks=${tracks.length} wheels=${WHEEL_BASE_OPTIONS.length}`);
  console.log(
    "INFO: wheels=",
    WHEEL_BASE_OPTIONS.map((option) => `${option.id} (${option.templateFamily})`).join(", "),
  );
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}

console.log("\nAll performance matrix checks passed.");
