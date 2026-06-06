import { alrPerformance } from "../src/data/alrPerformance.js";
import {
  ALR_HISTORICAL_SEASON_FROM,
  ALR_HISTORICAL_SEASON_TO,
} from "../src/data/alrChampionshipWeighting.js";
import {
  getALRResultScore,
  getAllCarsALRHistoricalScores,
  getConstructorPositionPoints,
  getTierPoints,
} from "../src/engine/alrPerformanceEngine.js";

console.log("=== ALR Championship Weighting ===");
console.log("Tier 1:", getTierPoints(1), "| Tier 6:", getTierPoints(6));
console.log("P1:", getConstructorPositionPoints(1), "| P10:", getConstructorPositionPoints(10));
console.log(
  "Example T1+P1 result:",
  getALRResultScore({ season: 21, tier: 1, car: "example", constructorsPosition: 1 }),
);

console.log(
  `\n=== ALR Historical Scores (Seasons ${ALR_HISTORICAL_SEASON_FROM}–${ALR_HISTORICAL_SEASON_TO}) ===`,
);
console.log(`Records in database: ${alrPerformance.length}`);

const rankings = getAllCarsALRHistoricalScores();

if (rankings.length === 0) {
  console.log("No car results in season range. Populate src/data/alrPerformance.js.");
} else {
  rankings.forEach((row, index) => {
    console.log(
      `${index + 1}. ${row.name} — ${row.historicalScore} pts (${row.entries} entries, avg pos ${row.averagePosition})`,
    );
    row.results.forEach((result) => {
      console.log(
        `     S${result.season} T${result.tier} P${result.position} → ${result.resultScore}`,
      );
    });
  });
}
