/**
 * Championship Advisor + Pitstop strategy intelligence regression checks.
 * Run: node scripts/verify-championship-advisor.mjs
 */
import { calculateChampionshipRecommendation } from "../src/engine/calculateChampionshipRecommendation.js";
import {
  analyzePitstopStrategy,
  validateTyreStints,
} from "../src/engine/pitstopStrategyEngine.js";
import { getTracksForGame } from "../src/utils/gameData.js";
import { clearRecommendationCache } from "../src/engine/recommendationCache.js";

function recommend(trackIds, raceSettings) {
  return calculateChampionshipRecommendation({
    selectedTrackIds: trackIds,
    carClass: "Gr.3",
    gameVersion: "gt7",
    bopOn: true,
    ...raceSettings,
  }).rankings;
}

const SCENARIOS = [
  {
    name: "Fuji regression — Gr.3 / 7 laps / x4 tyres / x1 fuel / BOP On",
    trackIds: ["fuji"],
    raceSettings: { lapCount: 7, tyreMultiplier: 4, fuelMultiplier: 1 },
    checks: [
      (results) => {
        const top5Ids = results.slice(0, 5).map((car) => car.id);
        return {
          pass: !top5Ids.includes("peugeot_vision_gran_turismo_gr3"),
          detail: `Peugeot VGT in top 5: ${top5Ids.includes("peugeot_vision_gran_turismo_gr3")}`,
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
    raceSettings: { lapCount: 10, tyreMultiplier: 2, fuelMultiplier: 1 },
    checks: [],
  },
  {
    name: "Traction circuit — Sardegna Road",
    trackIds: ["sardegna_road_track"],
    raceSettings: { lapCount: 12, tyreMultiplier: 3, fuelMultiplier: 2 },
    checks: [],
  },
];

function runScenario(scenario) {
  clearRecommendationCache();
  const results = recommend(scenario.trackIds, scenario.raceSettings).slice(0, 10);

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
  clearRecommendationCache();
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
    const results = recommend([trackId], {
      lapCount: 10,
      tyreMultiplier: 3,
      fuelMultiplier: 2,
    });
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

function verifyCacheReuse() {
  clearRecommendationCache();
  const input = {
    selectedTrackIds: ["fuji"],
    carClass: "Gr.3",
    lapCount: 7,
    tyreMultiplier: 4,
    fuelMultiplier: 1,
    bopOn: true,
    gameVersion: "gt7",
  };
  const first = calculateChampionshipRecommendation(input);
  const second = calculateChampionshipRecommendation(input);
  const pass = first.fromCache === false && second.fromCache === true;
  console.log("\n=== Cache reuse ===");
  console.log(
    `[${pass ? "PASS" : "FAIL"}] first.fromCache=${first.fromCache} second.fromCache=${second.fromCache}`,
  );
  return pass;
}

function verifyBopSeparation() {
  clearRecommendationCache();
  const withBop = calculateChampionshipRecommendation({
    selectedTrackIds: ["fuji"],
    carClass: "Gr.3",
    lapCount: 7,
    tyreMultiplier: 4,
    fuelMultiplier: 1,
    bopOn: true,
    gameVersion: "gt7",
  });
  const withoutBop = calculateChampionshipRecommendation({
    selectedTrackIds: ["fuji"],
    carClass: "Gr.3",
    lapCount: 7,
    tyreMultiplier: 4,
    fuelMultiplier: 1,
    bopOn: false,
    gameVersion: "gt7",
  });

  const scoresDiffer =
    JSON.stringify(withBop.scores) !== JSON.stringify(withoutBop.scores);
  console.log("\n=== BOP On vs Off separation ===");
  console.log(
    `[${scoresDiffer ? "PASS" : "FAIL"}] BOP modes produce different score sets: ${scoresDiffer}`,
  );
  return scoresDiffer;
}

function verifyPitstopScenarios() {
  const tracks = getTracksForGame("gt7");
  const trackId = tracks.find((track) => track.id === "fuji")?.id ?? "fuji";
  const carId = "porsche_911_gt3_r_22";

  console.log("\n=== Pitstop / strategy regression ===");

  const a = analyzePitstopStrategy({
    carId,
    trackId,
    lapCount: 10,
    tyreMultiplier: 0,
    fuelMultiplier: 0,
  });
  const aPass = a.ready && a.recommendedStops === 0;
  console.log(
    `[${aPass ? "PASS" : "FAIL"}] A 10 laps Tyres x0 Fuel x0 → ${a.recommendedStops} stops`,
  );

  const b = analyzePitstopStrategy({
    carId,
    trackId,
    lapCount: 20,
    tyreMultiplier: 8,
    fuelMultiplier: 1,
  });
  const bPass = b.ready && b.recommendedStops >= 1;
  console.log(
    `[${bPass ? "PASS" : "FAIL"}] B 20 laps high tyre / low fuel → ${b.recommendedStops} stops`,
  );

  const c = analyzePitstopStrategy({
    carId,
    trackId,
    lapCount: 20,
    tyreMultiplier: 1,
    fuelMultiplier: 8,
  });
  const cPass = c.ready;
  console.log(
    `[${cPass ? "PASS" : "FAIL"}] C 20 laps low tyre / high fuel → ${c.recommendedStops} stops`,
  );

  const softMediumSoft = validateTyreStints(
    [
      { compound: "S", startLap: 1, endLap: 7 },
      { compound: "M", startLap: 8, endLap: 18 },
      { compound: "S", startLap: 19, endLap: 25 },
    ],
    25,
  );
  const dPass = softMediumSoft.valid;
  console.log(
    `[${dPass ? "PASS" : "FAIL"}] D Soft→Medium→Soft validation (${softMediumSoft.errors.join("; ") || "ok"})`,
  );

  const mediumMedium = validateTyreStints(
    [
      { compound: "M", startLap: 1, endLap: 12 },
      { compound: "M", startLap: 13, endLap: 25 },
    ],
    25,
  );
  const ePass = mediumMedium.valid;
  console.log(
    `[${ePass ? "PASS" : "FAIL"}] E Medium→Medium validation (${mediumMedium.errors.join("; ") || "ok"})`,
  );

  const userStintStrategy = analyzePitstopStrategy({
    carId,
    trackId,
    lapCount: 25,
    tyreMultiplier: 3,
    fuelMultiplier: 2,
    stints: [
      { compound: "S", startLap: 1, endLap: 7 },
      { compound: "M", startLap: 8, endLap: 18 },
      { compound: "S", startLap: 19, endLap: 25 },
    ],
  });
  const userPass =
    userStintStrategy.ready &&
    userStintStrategy.stints?.length === 3 &&
    userStintStrategy.stints[0].compoundCode === "S" &&
    userStintStrategy.stints[2].compoundCode === "S";
  console.log(
    `[${userPass ? "PASS" : "FAIL"}] User Soft→Medium→Soft stints applied`,
  );

  return aPass && bPass && cPass && dPass && ePass && userPass;
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
if (!verifyCacheReuse()) {
  allPassed = false;
}
if (!verifyBopSeparation()) {
  allPassed = false;
}
if (!verifyPitstopScenarios()) {
  allPassed = false;
}

if (!allPassed) {
  console.error("\nIntelligence regression checks failed.");
  process.exit(1);
}

console.log("\nAll intelligence regression checks passed.");
