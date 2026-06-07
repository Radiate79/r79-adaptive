import { tracks } from "../src/data/gt7/tracks.js";
import {
  DRIVING_STYLES,
  TRACK_SURFACES,
  TRACK_TYPES,
} from "../src/data/gt7/trackTypes.js";
import {
  getSelectableTracksForClass,
  isTrackEligibleForClass,
} from "../src/utils/trackClassification.js";

const EXAMPLES = {
  autopolis: { trackType: "road", drivingStyle: "technical" },
  dragon_trail_gardens: { trackType: "road", drivingStyle: "technical" },
  dragon_trail_gardens_reverse: { reverse: true },
  sardegna_road_track: { layoutName: "Layout A" },
  tokyo_expressway: { trackType: "street" },
  kyoto_driving_park: { layoutName: "Yamagiwa" },
  lago_maggiore: { layoutName: "Centre" },
  nurburgring_nordschleife: { layoutName: "Nordschleife" },
  fishermans_ranch: { trackType: "dirt", drivingStyle: "rally" },
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

  if (!TRACK_SURFACES.includes(track.surface)) {
    console.error(`Invalid surface on ${track.id}: ${track.surface}`);
    issues += 1;
  }

  if (
    typeof track.eligibleForStandardRaceCars !== "boolean" ||
    !Array.isArray(track.eligibleClasses) ||
    !track.trackFamily ||
    !track.layoutName ||
    !track.displayName
  ) {
    console.error(`Missing layout/eligibility metadata on ${track.id}`);
    issues += 1;
  }

  if (track.name !== track.displayName) {
    console.error(`name/displayName mismatch on ${track.id}`);
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

  if (expected.trackType && track.trackType !== expected.trackType) {
    console.error(`trackType mismatch for ${id}`);
    issues += 1;
  }

  if (expected.drivingStyle && track.drivingStyle !== expected.drivingStyle) {
    console.error(`drivingStyle mismatch for ${id}`);
    issues += 1;
  }

  if (expected.layoutName && track.layoutName !== expected.layoutName) {
    console.error(`layoutName mismatch for ${id}`);
    issues += 1;
  }

  if (expected.reverse !== undefined && track.reverse !== expected.reverse) {
    console.error(`reverse mismatch for ${id}`);
    issues += 1;
  }
}

const gr3Tracks = getSelectableTracksForClass(tracks, "Gr.3");
const gr4Tracks = getSelectableTracksForClass(tracks, "Gr.4");
const grBTracks = getSelectableTracksForClass(tracks, "Gr.B");
const hiddenFromStandard = tracks.filter(
  (track) =>
    track.eligibleForStandardRaceCars === false ||
    !isTrackEligibleForClass(track, "Gr.3"),
);

const REQUIRED_NON_STANDARD = [
  { id: "colorado_springs", surface: "dirt", trackType: "dirt" },
  { id: "fishermans_ranch", surface: "dirt", trackType: "dirt" },
  { id: "lake_louise", surface: "snow", trackType: "snow" },
  { id: "sardegna_windmills", surface: "dirt", trackType: "dirt" },
];

for (const expected of REQUIRED_NON_STANDARD) {
  const track = tracks.find((entry) => entry.id === expected.id);
  if (!track) {
    console.error(`Missing required track: ${expected.id}`);
    issues += 1;
    continue;
  }

  if (
    track.eligibleForStandardRaceCars !== false ||
    track.surface !== expected.surface ||
    track.trackType !== expected.trackType
  ) {
    console.error(
      `Eligibility mismatch for ${expected.id}: standard=${track.eligibleForStandardRaceCars}, surface=${track.surface}, type=${track.trackType}`,
    );
    issues += 1;
  }

  if (gr3Tracks.some((entry) => entry.id === expected.id)) {
    console.error(`${expected.id} still appears in Gr.3 selector`);
    issues += 1;
  }
}

const reverseLayouts = tracks.filter((track) => track.reverse);
const families = new Set(tracks.map((track) => track.trackFamily));

console.log(`Audited ${tracks.length} GT7 track layouts across ${families.size} families`);
console.log(`Reverse layouts: ${reverseLayouts.length}`);
console.log(`Gr.3 selectable: ${gr3Tracks.length}`);
console.log(`Gr.4 selectable: ${gr4Tracks.length}`);
console.log(`Gr.B selectable: ${grBTracks.length}`);
console.log(
  `Hidden from Gr.3/Gr.4 (${hiddenFromStandard.length}):`,
  hiddenFromStandard.map((track) => track.displayName).join(", "),
);

if (issues > 0) {
  console.error(`Audit failed with ${issues} issue(s).`);
  process.exit(1);
}

console.log("GT7 track layout audit passed.");
