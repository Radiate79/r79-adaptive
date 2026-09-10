/**
 * Gr.3 measurable scoring regression — GT ENG!NE 1.71 path.
 */

import {
  hasGr3MeasurableData,
  resolveGr3BopCategory,
  resolveGr3PerformanceProfile,
  scoreGr3CarForRace,
  GR3_DATA_VERSION,
  GR3_PICKER_ENGINE_VERSION,
} from "../src/engine/gr3MeasurableScoring.js";
import { GR3_MEASURABLE_171 } from "../src/data/gr3Measurable171.js";
import { getTracksForGame } from "../src/utils/gameData.js";
import { recommendCarsForChampionship } from "../src/engine/championshipEngine.js";

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

console.log(`\n═══ Gr.3 measurable scoring ${GR3_PICKER_ENGINE_VERSION} / ${GR3_DATA_VERSION} ═══`);

const highCount = Object.keys(GR3_MEASURABLE_171.bop.high).length;
const midCount = Object.keys(GR3_MEASURABLE_171.bop.mid).length;
const lowCount = Object.keys(GR3_MEASURABLE_171.bop.low).length;

if (highCount === 52 && midCount === 52 && lowCount === 52) {
  ok(`BoP tables complete: high=${highCount} mid=${midCount} low=${lowCount}`);
} else {
  fail(`BoP table sizes unexpected: high=${highCount} mid=${midCount} low=${lowCount}`);
}

const coreIds = [
  "ferrari_296_gt3_23",
  "genesis_x_gr3",
  "subaru_wrx_gr3",
  "porsche_911_gt3_r_22",
  "bmw_m6_gt3_endurance_model_16",
];

for (const id of coreIds) {
  if (hasGr3MeasurableData(id, "high") && hasGr3MeasurableData(id, "mid") && hasGr3MeasurableData(id, "low")) {
    ok(`${id} present in High/Mid/Low BoP`);
  } else {
    fail(`${id} missing from one or more BoP tables`);
  }
}

const tracks = getTracksForGame("gt7");
const laguna = tracks.find((t) => t.id === "laguna_seca");
const monza = tracks.find((t) => t.id === "monza");

if (resolveGr3BopCategory(laguna) === "low") {
  ok("Laguna resolves to Low-speed BoP");
} else {
  fail(`Laguna BoP category unexpected: ${resolveGr3BopCategory(laguna)}`);
}

if (resolveGr3BopCategory(monza) === "high") {
  ok("Monza resolves to High-speed BoP");
} else {
  fail(`Monza BoP category unexpected: ${resolveGr3BopCategory(monza)}`);
}

const a = scoreGr3CarForRace("ferrari_296_gt3_23", laguna, {
  tyreMultiplier: 0,
  fuelMultiplier: 0,
});
const b = scoreGr3CarForRace("ferrari_296_gt3_23", laguna, {
  tyreMultiplier: 0,
  fuelMultiplier: 0,
});
if (a.score === b.score && a.confidence === "full") {
  ok(`Deterministic Ferrari Laguna score: ${a.score}`);
} else {
  fail("Non-deterministic measurable score");
}

const x0 = scoreGr3CarForRace("bmw_m6_gt3_endurance_model_16", laguna, {
  tyreMultiplier: 0,
  fuelMultiplier: 0,
});
const x5 = scoreGr3CarForRace("bmw_m6_gt3_endurance_model_16", laguna, {
  tyreMultiplier: 5,
  fuelMultiplier: 0,
});
if (Math.abs(x0.score - x5.score) > 0.05) {
  ok(`Tyre x0 vs x5 shifts measurable score (${x0.score} → ${x5.score})`);
} else {
  fail("Tyre multiplier does not shift measurable Technical Fit");
}

const fuelNeutral = scoreGr3CarForRace("ferrari_296_gt3_23", laguna, {
  tyreMultiplier: 0,
  fuelMultiplier: 5,
});
const fuelZero = scoreGr3CarForRace("ferrari_296_gt3_23", laguna, {
  tyreMultiplier: 0,
  fuelMultiplier: 0,
});
if (fuelNeutral.score === fuelZero.score) {
  ok("Fuel multiplier stays neutral when fuel economy is unknown");
} else {
  fail("Fuel multiplier invented a ranking without measured fuel data");
}

const profile = resolveGr3PerformanceProfile("ferrari_296_gt3_23", {
  bopCategory: "low",
});
if (
  profile?.normalized &&
  Object.values(profile.normalized).every((v) => v >= 0 && v <= 100)
) {
  ok("Normalized profile dimensions stay in 0–100");
} else {
  fail("Normalized profile out of range");
}

const field = recommendCarsForChampionship(
  ["laguna_seca"],
  "Gr.3",
  { fuelMultiplier: 0, tyreMultiplier: 0, lapCount: 10, bopOn: true },
  "gt7",
);
const ids = field.map((c) => c.id);
const unique = new Set(ids);
if (unique.size === ids.length && ids.length >= 30) {
  ok(`Full field scored before ranking (${ids.length} cars, deterministic unique ids)`);
} else {
  fail(`Field incomplete or duplicated: ${ids.length} / unique ${unique.size}`);
}

const runA = recommendCarsForChampionship(
  ["monza"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 15, bopOn: true },
  "gt7",
);
const runB = recommendCarsForChampionship(
  ["monza"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 15, bopOn: true },
  "gt7",
);
if (runA.every((c, i) => c.id === runB[i]?.id && c.trackFitScore === runB[i]?.trackFitScore)) {
  ok("Championship recommendation deterministic on Monza");
} else {
  fail("Championship recommendation non-deterministic on Monza");
}

console.log(`\n${"═".repeat(60)}`);
console.log(`Gr.3 Measurable: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);

if (failures > 0) process.exit(1);
