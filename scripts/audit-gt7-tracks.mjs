import { tracks } from "../src/data/gt7/tracks.js";
import {
  DRIVING_STYLES,
  TRACK_TYPES,
} from "../src/data/gt7/trackTypes.js";

const EXAMPLES = {
  autopolis: { trackType: "road", drivingStyle: "technical" },
  monza: { trackType: "road", drivingStyle: "high_speed" },
  suzuka: { trackType: "road", drivingStyle: "balanced" },
  watkins_glen: { trackType: "road", drivingStyle: "balanced" },
  dragon_trail_seaside: { trackType: "road", drivingStyle: "technical" },
  le_mans: { trackType: "road", drivingStyle: "endurance" },
  daytona_road_course: { trackType: "road", drivingStyle: "high_speed" },
  blue_moon_bay: { trackType: "oval", drivingStyle: "high_speed" },
  northern_isle_speedway: { trackType: "oval", drivingStyle: "high_speed" },
  fishermans_ranch: { trackType: "dirt", drivingStyle: "rally" },
  colorado_springs: { trackType: "dirt", drivingStyle: "rally" },
  sardegna_windmills: { trackType: "dirt", drivingStyle: "rally" },
  barcelona_rallycross: { trackType: "dirt", drivingStyle: "rally" },
  lake_louise: { trackType: "snow", drivingStyle: "rally" },
};

let issues = 0;

for (const track of tracks) {
  if (!TRACK_TYPES.includes(track.trackType)) {
    console.error(`Invalid trackType on ${track.id}: ${track.trackType}`);
    issues += 1;
  }

  if (!DRIVING_STYLES.includes(track.drivingStyle)) {
    console.error(`Invalid drivingStyle on ${track.id}: ${track.drivingStyle}`);
    issues += 1;
  }
}

for (const [id, expected] of Object.entries(EXAMPLES)) {
  const track = tracks.find((entry) => entry.id === id);
  if (!track) {
    console.error(`Missing example track: ${id}`);
    issues += 1;
    continue;
  }

  if (
    track.trackType !== expected.trackType ||
    track.drivingStyle !== expected.drivingStyle
  ) {
    console.error(
      `Example mismatch for ${id}: expected ${expected.trackType}/${expected.drivingStyle}, got ${track.trackType}/${track.drivingStyle}`,
    );
    issues += 1;
  }
}

const counts = Object.fromEntries(TRACK_TYPES.map((type) => [type, 0]));
const styleCounts = Object.fromEntries(
  DRIVING_STYLES.map((style) => [style, 0]),
);

for (const track of tracks) {
  counts[track.trackType] += 1;
  styleCounts[track.drivingStyle] += 1;
}

console.log(`Audited ${tracks.length} GT7 tracks`);
console.log("Track types:", counts);
console.log("Driving styles:", styleCounts);

if (issues > 0) {
  console.error(`Audit failed with ${issues} issue(s).`);
  process.exit(1);
}

console.log("GT7 track audit passed.");
