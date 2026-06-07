import { analyzeTodaysRace } from "../src/engine/todaysRaceAdvisorEngine.js";
import { analyzeAIRaceEngineer } from "../src/engine/aiRaceEngineerEngine.js";
import { getTracksForGame } from "../src/utils/gameData.js";

const WATCH_CAR_IDS = [
  "ferrari_296_gt3_23",
  "jaguar_f_type_gt3",
  "aston_martin_v12_vantage_gt3_12",
  "suzuki_vision_gran_turismo_gr3",
  "porsche_911_gt3_r_22",
  "mercedes_amg_gt3_20",
];

const tracks = getTracksForGame("gt7");
const tarmacTracks = tracks.filter(
  (track) => track.trackType !== "dirt" && track.trackType !== "snow",
);

const watchStats = Object.fromEntries(
  WATCH_CAR_IDS.map((id) => [id, { top10: 0, top1: 0, aiTop10: 0 }]),
);

let suzukiTop10 = 0;
let porscheTop1 = 0;

for (const track of tarmacTracks) {
  const result = analyzeTodaysRace({ trackId: track.id, carClass: "Gr.3" });
  const top10 = result.recommendations.slice(0, 10);

  top10.forEach((car, index) => {
    if (watchStats[car.id]) {
      watchStats[car.id].top10 += 1;
      if (index === 0) {
        watchStats[car.id].top1 += 1;
      }
    }
  });

  if (top10.some((car) => car.id === "suzuki_vision_gran_turismo_gr3")) {
    suzukiTop10 += 1;
  }

  if (result.recommendations[0]?.id === "porsche_911_gt3_r_22") {
    porscheTop1 += 1;
  }

  const aiResult = analyzeAIRaceEngineer({
    trackId: track.id,
    raceLength: "medium",
    fuelMultiplier: 3,
    tyreMultiplier: 5,
  });

  const aiPicks = [
    aiResult.recommendedCar,
    aiResult.alternativeChoice,
  ].filter(Boolean);

  aiPicks.forEach((car) => {
    if (watchStats[car.id]) {
      watchStats[car.id].aiTop10 += 1;
    }
  });
}

console.log(`Tracks audited: ${tarmacTracks.length}\n`);
console.log("Today's Race Advisor — top-10 appearances:");
for (const [id, stats] of Object.entries(watchStats)) {
  console.log(`  ${id}: ${stats.top10}/${tarmacTracks.length} (wins: ${stats.top1})`);
}

console.log(`\nSuzuki VGT Gr.3 in top-10: ${suzukiTop10}/${tarmacTracks.length}`);
console.log(`Porsche 911 GT3 R '22 #1: ${porscheTop1}/${tarmacTracks.length}`);

console.log("\nAI Race Engineer (Full Race settings) — primary/alternate picks:");
for (const [id, stats] of Object.entries(watchStats)) {
  console.log(`  ${id}: ${stats.aiTop10}/${tarmacTracks.length}`);
}
