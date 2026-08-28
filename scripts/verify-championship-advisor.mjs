/**
 * Championship Advisor regression scenarios for GT7 1.71 scoring.
 * Run: node scripts/verify-championship-advisor.mjs
 */
import { recommendCarsForChampionship } from "../src/engine/championshipEngine.js";
import { analyzePitstopStrategy } from "../src/engine/pitstopStrategyEngine.js";
import { getTracksForGame } from "../src/utils/gameData.js";

const SCENARIOS = [
  {
    name: "Fuji regression — Gr.3 / 7 laps / x4 tyres / x1 fuel",
    trackIds: ["fuji"],
    carClass: "Gr.3",
    raceSettings: { lapCount: 7, tyreMultiplier: 4, fuelMultiplier: 1 },
    checks: [
      (results) => {
        const peugeot = results.find((car) =>
          car.id.includes("peugeot_vision"),
        );
        const top5Ids = results.slice(0, 5).map((car) => car.id);
        return {
          pass: !top5Ids.includes("peugeot_vision_gran_turismo_gr3"),
          detail: peugeot
            ? `Peugeot VGT rank ${results.indexOf(peugeot) + 1}, score ${peugeot.score}`
            : "Peugeot VGT not in results (filtered or outside top)",
        };
      },
      (results) => ({
        pass: results.length >= 5,
        detail: `Returned ${results.length} recommendations`,
      }),
    ],
  },
  {
    name: "Short sprint — Tyres x0 / Fuel x0",
    trackIds: ["monza"],
    carClass: "Gr.3",
    raceSettings: { lapCount: 5, tyreMultiplier: 0, fuelMultiplier: 0 },
    checks: [
      (results) => ({
        pass: results.length > 0,
        detail: `Top car: ${results[0]?.name ?? "none"}`,
      }),
    ],
  },
  {
    name: "Long race — high tyre wear",
    trackIds: ["spa"],
    carClass: "Gr.3",
    raceSettings: { lapCount: 30, tyreMultiplier: 8, fuelMultiplier: 3 },
    checks: [
      (results) => ({
        pass: results[0]?.raceConditionFitScore > 50,
        detail: `Race condition fit for #1: ${results[0]?.raceConditionFitScore}`,
      }),
    ],
  },
  {
    name: "Technical circuit — Laguna Seca",
    trackIds: ["laguna_seca"],
    carClass: "Gr.3",
    raceSettings: { lapCount: 10, tyreMultiplier: 2, fuelMultiplier: 1 },
    checks: [],
  },
  {
    name: "Traction circuit — Sardegna Road",
    trackIds: ["sardegna_road_track"],
    carClass: "Gr.3",
    raceSettings: { lapCount: 12, tyreMultiplier: 3, fuelMultiplier: 2 },
    checks: [],
  },
];

function runScenario(scenario) {
  const results = recommendCarsForChampionship(
    scenario.trackIds,
    scenario.carClass,
    scenario.raceSettings,
    "gt7",
  ).slice(0, 10);

  console.log(`\n=== ${scenario.name} ===`);
  results.slice(0, 5).forEach((car, index) => {
    console.log(
      `${index + 1}. ${car.name} — overall ${car.score} | track ${car.trackFitScore} | race ${car.raceConditionFitScore ?? "—"}`,
    );
  });

  let passed = true;
  for (const check of scenario.checks) {
    const outcome = check(results);
    const status = outcome.pass ? "PASS" : "FAIL";
    console.log(`  [${status}] ${outcome.detail}`);
    if (!outcome.pass) {
      passed = false;
    }
  }

  return { name: scenario.name, passed, topId: results[0]?.id };
}

function compareTrackDiversity() {
  const tracks = [
    "fuji",
    "monza",
    "laguna_seca",
    "spa",
    "interlagos",
    "brands_hatch",
    "sardegna_road_track",
  ];
  const winners = tracks.map((trackId) => {
    const results = recommendCarsForChampionship(
      [trackId],
      "Gr.3",
      { lapCount: 10, tyreMultiplier: 3, fuelMultiplier: 2 },
      "gt7",
    );
    return { trackId, winner: results[0]?.id, score: results[0]?.score };
  });

  const uniqueWinners = new Set(winners.map((entry) => entry.winner)).size;
  console.log("\n=== Track diversity (10 lap / x3 tyres / x2 fuel) ===");
  winners.forEach((entry) => {
    console.log(`  ${entry.trackId}: ${entry.winner} (${entry.score})`);
  });

  const pass = uniqueWinners >= 3;
  console.log(
    `[${pass ? "PASS" : "FAIL"}] ${uniqueWinners} distinct winners across ${tracks.length} tracks`,
  );
  return pass;
}

function verifyPitstopZeroMultipliers() {
  const tracks = getTracksForGame("gt7");
  const trackId = tracks.find((track) => track.id === "fuji")?.id ?? "fuji";
  const tyreZero = analyzePitstopStrategy({
    carId: "porsche_911_gt3_r_22",
    trackId,
    lapCount: 10,
    tyreMultiplier: 0,
    fuelMultiplier: 1,
  });
  const fuelZero = analyzePitstopStrategy({
    carId: "porsche_911_gt3_r_22",
    trackId,
    lapCount: 10,
    tyreMultiplier: 3,
    fuelMultiplier: 0,
  });

  const tyrePass = tyreZero.recommendedStops === 0;
  const fuelPass = fuelZero.recommendedStops === 0 || fuelZero.combinedStress === 0;

  console.log("\n=== Pitstop x0 validation ===");
  console.log(
    `[${tyrePass ? "PASS" : "FAIL"}] Tyres x0 → ${tyreZero.recommendedStops} stops`,
  );
  console.log(
    `[${fuelPass ? "PASS" : "FAIL"}] Fuel x0 → ${fuelZero.recommendedStops} stops`,
  );

  return tyrePass && fuelPass;
}

let allPassed = true;
for (const scenario of SCENARIOS) {
  const outcome = runScenario(scenario);
  if (!outcome.passed) {
    allPassed = false;
  }
}

if (!compareTrackDiversity()) {
  allPassed = false;
}

if (!verifyPitstopZeroMultipliers()) {
  allPassed = false;
}

if (!allPassed) {
  console.error("\nChampionship advisor regression checks failed.");
  process.exit(1);
}

console.log("\nAll championship advisor regression checks passed.");
