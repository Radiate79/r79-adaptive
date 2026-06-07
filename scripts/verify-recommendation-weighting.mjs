import { analyzeTodaysRace } from "../src/engine/todaysRaceAdvisorEngine.js";
import { getTrackProfileWeightPercents } from "../src/engine/championshipEngine.js";
import { getTracksForGame } from "../src/utils/gameData.js";

const WATCH_CAR_IDS = [
  "ferrari_296_gt3_23",
  "jaguar_f_type_gt3",
  "aston_martin_v12_vantage_gt3_12",
  "mercedes_amg_gt3_20",
  "genesis_x_gr3",
  "nissan_gtr_gt3_18",
  "porsche_911_gt3_r_22",
];

const SAMPLE_TRACKS = [
  "spa",
  "suzuka",
  "daytona_road_course",
  "watkins_glen",
  "road_atlanta",
  "fuji",
  "dragon_trail_seaside",
];

const tracks = getTracksForGame("gt7");

console.log("Track profile weighting (percent share per attribute):\n");
for (const trackId of SAMPLE_TRACKS) {
  const track = tracks.find((entry) => entry.id === trackId);
  const weights = getTrackProfileWeightPercents(track);
  const formatted = Object.entries(weights)
    .map(([field, value]) => `${field}:${value}%`)
    .join(", ");
  console.log(`${track.name}: ${formatted}`);
}

console.log("\nTop recommendations per track:\n");
let porscheTopCount = 0;

for (const trackId of SAMPLE_TRACKS) {
  const result = analyzeTodaysRace({ trackId, carClass: "Gr.3" });
  const top3 = result.recommendations
    .slice(0, 3)
    .map((car) => `${car.name} (${car.overallScore})`);
  const watchlist = result.recommendations
    .map((car, index) => ({ car, rank: index + 1 }))
    .filter(({ car }) => WATCH_CAR_IDS.includes(car.id))
    .map(({ car, rank }) => `${car.name.split(" ")[0]} #${rank}`)
    .join(", ");

  if (result.recommendations[0]?.id === "porsche_911_gt3_r_22") {
    porscheTopCount += 1;
  }

  console.log(`${trackId}: ${top3.join(" | ")}`);
  console.log(`  watchlist: ${watchlist}`);
}

console.log(
  `\nPorsche 911 GT3 R '22 is #1 on ${porscheTopCount}/${SAMPLE_TRACKS.length} sample tracks.`,
);
