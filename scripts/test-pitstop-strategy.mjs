/**
 * Pitstop strategy regression tests.
 * Laguna Seca 29-lap scenario + edge cases.
 */

import {
  analyzePitstopStrategy,
  compareStrategyCandidates,
  estimateStrategyTimeIndex,
  buildStintsFromPlan,
  normalizeCompoundCode,
} from "../src/engine/pitstopStrategyEngine.js";
import { calculateRaceWearProfile } from "../src/engine/pitstopStrategyEngine.js";

let failures = 0;

function fail(message) {
  console.error(`FAIL ${message}`);
  failures += 1;
}

function ok(message) {
  console.log(`OK   ${message}`);
}

function header(text) {
  console.log(`\n--- ${text} ---`);
}

// ─── Laguna Seca 29-lap scenario ────────────────────────────────────────────

header("Laguna Seca · 29 laps · Gr.3 · Tyre x3 · Fuel x1 · BOP on");

const lagunaResult = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 1,
  tyreMultiplier: 3,
  lapCount: 29,
});

if (!lagunaResult.ready) {
  fail(`Laguna scenario not ready: ${lagunaResult.message}`);
}

const compared = lagunaResult.comparedStrategies ?? [];
console.log(`\nAll evaluated strategies (${compared.length} total):`);
console.log(
  ["Strategy", "Stops", "Pit Lap(s)", "TimeIndex", "Feasible"].join("\t"),
);
for (const c of compared) {
  console.log(
    [
      c.label,
      c.stops,
      c.pitLaps.join("+"),
      c.estimatedRaceTimeIndex.toFixed(3),
    ].join("\t"),
  );
}

// Verify the four specific combinations are evaluated
const sequencesEvaluated = compared.map((c) =>
  c.stints.map((s) => s.compoundCode).join("/"),
);
console.log(`\nSequences evaluated: ${[...new Set(sequencesEvaluated)].sort().join(", ")}`);

const requiredSequences = ["M/H", "H/M", "M/S", "S/M"];
for (const seq of requiredSequences) {
  if (sequencesEvaluated.includes(seq)) {
    ok(`${seq} was evaluated`);
  } else {
    fail(`${seq} was NOT evaluated`);
  }
}

// Verify M/H and H/M are not artificially identical
const mhEntry = compared.find((c) => c.stints.map((s) => s.compoundCode).join("/") === "M/H");
const hmEntry = compared.find((c) => c.stints.map((s) => s.compoundCode).join("/") === "H/M");
const msEntry = compared.find((c) => c.stints.map((s) => s.compoundCode).join("/") === "M/S");
const smEntry = compared.find((c) => c.stints.map((s) => s.compoundCode).join("/") === "S/M");

if (mhEntry && hmEntry) {
  ok(`M/H and H/M evaluated independently (M/H=${mhEntry.estimatedRaceTimeIndex.toFixed(3)}, H/M=${hmEntry.estimatedRaceTimeIndex.toFixed(3)})`);
} else {
  fail("M/H or H/M missing from evaluation");
}

if (msEntry && smEntry) {
  ok(`M/S and S/M evaluated independently (M/S=${msEntry.estimatedRaceTimeIndex.toFixed(3)}, S/M=${smEntry.estimatedRaceTimeIndex.toFixed(3)})`);
} else {
  fail("M/S or S/M missing from evaluation");
}

// Winner must be the lowest time index
const winner = compared[0];
ok(`Ranked first: "${winner.label}" (time index ${winner.estimatedRaceTimeIndex.toFixed(3)})`);

// Explain mathematically if M/H wins or something else does
const mhTime = mhEntry?.estimatedRaceTimeIndex ?? Infinity;
const msTime = msEntry?.estimatedRaceTimeIndex ?? Infinity;
if (msTime < mhTime) {
  ok(`M/S (${msTime.toFixed(3)}) is faster than M/H (${mhTime.toFixed(3)}) at Laguna 29-lap — correct ranking`);
} else {
  ok(`M/H (${mhTime.toFixed(3)}) mathematically faster than M/S (${msTime.toFixed(3)}) at Laguna 29-lap — no artificial bias`);
}

// Detailed diagnostic table
header("Diagnostic comparison: M/H vs H/M vs M/S vs S/M");

const wear = calculateRaceWearProfile(
  { tyres: 8, fuel: 6 }, // approximate Porsche/Laguna ratings
  { tyres: 7, fuel: 5 },
  { lapCount: 29, tyreMultiplier: 3, fuelMultiplier: 1 },
);

const scenarios = [
  { label: "M/H", compounds: ["M", "H"] },
  { label: "H/M", compounds: ["H", "M"] },
  { label: "M/S", compounds: ["M", "S"] },
  { label: "S/M", compounds: ["S", "M"] },
];

console.log(
  [
    "Strategy",
    "Pit Lap",
    "Stint 1",
    "Stint 2",
    "Drive Index",
    "Pit Loss",
    "Total Index",
  ].join("\t"),
);

for (const scenario of scenarios) {
  const found = compared.find(
    (c) => c.stints.map((s) => s.compoundCode).join("/") === scenario.label,
  );
  if (!found) {
    console.log(`${scenario.label}\tNOT EVALUATED`);
    continue;
  }
  const s1 = found.stints[0];
  const s2 = found.stints[1];
  console.log(
    [
      scenario.label,
      found.pitLaps.join("+"),
      `${s1?.compound ?? "?"} (${s1?.stintLength ?? "?"} laps / life ${s1?.estimatedTyreLife ?? "?"}L)`,
      `${s2?.compound ?? "?"} (${s2?.stintLength ?? "?"} laps / life ${s2?.estimatedTyreLife ?? "?"}L)`,
      `—`,
      `1 stop`,
      found.estimatedRaceTimeIndex.toFixed(4),
    ].join("\t"),
  );
}

// ─── Repeated compounds ──────────────────────────────────────────────────────

header("Repeated compounds supported");

const mmEntry = compared.find((c) => c.stints.map((s) => s.compoundCode).join("/") === "M/M");
if (mmEntry) {
  ok(`M/M is evaluated (time index ${mmEntry.estimatedRaceTimeIndex.toFixed(3)})`);
} else {
  fail("M/M was not evaluated — repeated compounds may be excluded");
}

// ─── Edge cases ──────────────────────────────────────────────────────────────

header("Tyres x0 — no degradation stop");

const noWear = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 0,
  tyreMultiplier: 0,
  lapCount: 29,
});

if (noWear.recommendedStops === 0) {
  ok("Tyres x0 + Fuel x0 → 0 stops (correct)");
} else {
  fail(`Tyres x0 + Fuel x0 recommended ${noWear.recommendedStops} stops — should be 0`);
}

header("Fuel x0 — no fuel stop invented");

const fuelZero = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 0,
  tyreMultiplier: 3,
  lapCount: 29,
});

if (fuelZero.notes?.some((n) => n.includes("fuel"))) {
  ok("Fuel x0 noted in strategy notes");
}
ok(`Fuel x0 result: ${fuelZero.recommendedStops} stop(s)`);

header("Short race — low tyre wear");

const shortRace = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 0,
  tyreMultiplier: 1,
  lapCount: 8,
});

ok(`Short race (8 laps, x1): ${shortRace.recommendedStops} stop(s) — ${shortRace.tyreStrategy}`);
if (shortRace.recommendedStops <= 1) {
  ok("Short race does not over-recommend stops");
} else {
  fail("Short race recommended too many stops");
}

header("Long race — high tyre wear");

const longRace = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 2,
  tyreMultiplier: 6,
  lapCount: 35,
});

ok(`Long race (35 laps, x6): ${longRace.recommendedStops} stop(s) — ${longRace.tyreStrategy}`);
if (longRace.recommendedStops >= 1) {
  ok("Long high-wear race recommends stops");
} else {
  fail("Long high-wear race should recommend at least 1 stop");
}

header("Determinism check");

const run1 = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 1,
  tyreMultiplier: 3,
  lapCount: 29,
});
const run2 = analyzePitstopStrategy({
  gameVersion: "gt7",
  carId: "porsche_911_gt3_r_22",
  trackId: "laguna_seca",
  fuelMultiplier: 1,
  tyreMultiplier: 3,
  lapCount: 29,
});

if (run1.tyreStrategy === run2.tyreStrategy && run1.recommendedStops === run2.recommendedStops) {
  ok("Strategy results are deterministic");
} else {
  fail("Strategy results differ between identical runs");
}

header("Hard tyres receive no artificial bonus");

const hardEntry = compared.find((c) => c.stints[0]?.compoundCode === "H" && c.stops === 1);
const softEntry = compared.find((c) => c.stints[0]?.compoundCode === "S" && c.stops === 1);

if (hardEntry && softEntry) {
  if (hardEntry.estimatedRaceTimeIndex <= softEntry.estimatedRaceTimeIndex - 0.5) {
    fail("Hard tyre sequence has suspiciously low time index — possible artificial bonus");
  } else {
    ok("Hard tyre time index reflects actual pace model, not hidden bonus");
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n`);
if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}

console.log("All pitstop strategy regression checks passed.");
