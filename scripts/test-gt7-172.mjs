/**
 * GT7 1.72 update checks: medium BoP, high/low provenance, SUGO, Mazda Evo.
 */

import { ACTIVE_GT7_GAME_VERSION } from "../src/data/gt7PhysicsVersion.js";
import { GR_CLASS_HANDLING_VALIDATION } from "../src/data/gt7PhysicsVersion.js";
import {
  describeGr3BopDiagnostics,
  resolveGr3Measurable,
} from "../src/data/gr3MediumBop172.js";
import { getGr3Measurable } from "../src/data/gr3Measurable171.js";
import { getCarsForGame, getTracksForGame } from "../src/utils/gameData.js";
import { filterItemsByNameSearch } from "../src/utils/listSearch.js";
import { getTrackDisplayName } from "../src/data/gt7/trackMetadata.js";
import { recommendCarsForChampionship } from "../src/engine/championshipEngine.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";
import { analyzePitstopStrategy } from "../src/engine/pitstopStrategyEngine.js";
import { getWheelPlatformProfile } from "../src/data/wheelPlatformVersion.js";
import { resolveTrackDynamicsProfile } from "../src/engine/trackDynamicsProfile.js";

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

const EXPECTED_MID = {
  audi_r8_lms_evo: [445, 1310],
  porsche_911_gt3_r_22: [458, 1339],
  mclaren_650s_gt3: [489, 1290],
  subaru_brz_gt300_21: [446, 1315],
  supra_racing_concept: [474, 1243],
  nissan_gtr_gt3_18: [498, 1350],
  ferrari_296_gt3_23: [456, 1360],
  lamborghini_huracan_gt3_15: [456, 1335],
  jaguar_f_type_gt3: [471, 1260],
  bmw_m6_gt3_endurance_model_16: [474, 1350],
  bmw_m6_gt3_sprint_model: [474, 1350],
  lexus_rcf_gt3: [456, 1305],
  mercedes_amg_gt3_20: [467, 1340],
  mazda_rx_vision_gt3_concept: [439, 1260],
  mazda_rx_vision_gt3_evo_26: [439, 1260],
};

console.log("\n═══ GT7 version ═══");
if (ACTIVE_GT7_GAME_VERSION === "1.72") ok("Active GT7 version is 1.72");
else fail(`Active version is ${ACTIVE_GT7_GAME_VERSION}`);

console.log("\n═══ Medium BoP ═══");
for (const [id, [power, weight]] of Object.entries(EXPECTED_MID)) {
  const row = resolveGr3Measurable(id, "mid");
  const p2w = power / (weight / 1000);
  if (!row) {
    fail(`${id} missing medium row`);
    continue;
  }
  const powerOk = row.powerPs === power;
  const weightOk = row.weightKg === weight;
  const p2wOk = Math.abs(row.powerToWeightPsPerT - p2w) < 0.15;
  const statusOk = row.provenance?.status === "CURRENT_1_72_OBSERVED";
  const sourceOk = row.provenance?.sourceVersion === "1.72";
  if (powerOk && weightOk && p2wOk && statusOk && sourceOk) {
    ok(`${id} mid ${power} PS / ${weight} kg / ${row.powerToWeightPsPerT} PS/t`);
  } else {
    fail(
      `${id} mid got ${row.powerPs} PS / ${row.weightKg} kg / ${row.powerToWeightPsPerT} status ${row.provenance?.status}`,
    );
  }
  if ([row.powerPs, row.weightKg, row.powerToWeightPsPerT].some((v) => Number.isNaN(v))) {
    fail(`${id} has NaN`);
  }
}

const ferrariBaseline = getGr3Measurable("ferrari_296_gt3_23", "mid");
const ferrariActive = resolveGr3Measurable("ferrari_296_gt3_23", "mid");
if (ferrariBaseline.weightKg === 1335 && ferrariActive.weightKg === 1360) {
  ok("1.71 Ferrari weight retained in baseline; active medium weight is 1360 kg");
} else {
  fail("Ferrari baseline/active weight split is wrong");
}
if (ferrariActive.rotation60 === ferrariBaseline.rotation60) {
  ok("Ferrari rotation was not invented from the weight change");
} else {
  fail("Ferrari rotation changed");
}

console.log("\n═══ High / Low provenance ═══");
for (const category of ["high", "low"]) {
  const row = resolveGr3Measurable("ferrari_296_gt3_23", category);
  const raw = getGr3Measurable("ferrari_296_gt3_23", category);
  const diag = describeGr3BopDiagnostics("ferrari_296_gt3_23", category);
  if (
    row &&
    row.powerPs === raw.powerPs &&
    row.weightKg === raw.weightKg &&
    row.provenance.sourceVersion === "1.71" &&
    row.provenance.status === "AWAITING_1_72_VERIFICATION" &&
    diag.verificationStatus !== "CONFIRMED_1_72"
  ) {
    ok(`${category} Ferrari stays on 1.71 values and is not labelled confirmed 1.72`);
  } else {
    fail(`${category} Ferrari provenance/values incorrect`);
  }
}

const midRec = recommendCarsForChampionship(
  ["suzuka"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 12, bopOn: true },
  "gt7",
);
const highRec = recommendCarsForChampionship(
  ["monza"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 12, bopOn: true },
  "gt7",
);
const lowRec = recommendCarsForChampionship(
  ["laguna_seca"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 12, bopOn: true },
  "gt7",
);
if (midRec.length > 10 && highRec.length > 10 && lowRec.length > 10) {
  ok(`Recommendations still generate (mid ${midRec.length}, high ${highRec.length}, low ${lowRec.length})`);
} else {
  fail("Recommendation generation returned a short field");
}

console.log("\n═══ SUGO ═══");
const tracks = getTracksForGame("gt7");
const sugo = tracks.find((track) => track.id === "sugo");
if (sugo && getTrackDisplayName(sugo).includes("SUGO")) ok(`SUGO resolves as ${sugo.id}`);
else fail("SUGO missing");

const searched = filterItemsByNameSearch(tracks, "sugo", (track) => getTrackDisplayName(track));
if (searched.some((track) => track.id === "sugo")) ok("SUGO is found by search");
else fail("SUGO search miss");

const names = tracks.map((track) => getTrackDisplayName(track));
const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
if (names.join("|") === sorted.join("|")) ok("Track list is alphabetical");
else fail("Track list is not alphabetical");

const sugoProfile = resolveTrackDynamicsProfile({ trackId: "sugo", gameVersion: "gt7" });
if (sugoProfile.track && sugoProfile.racingProfile && sugoProfile.racingProfile !== "unknown") {
  ok(`SUGO racing profile is ${sugoProfile.racingProfile}, not a generic unknown`);
} else {
  fail("SUGO fell back to an unknown profile");
}
if (sugo?.officialFacts?.lengthM === 3586 && sugo.officialFacts.corners === 13) {
  ok("SUGO keeps official length and corner count");
} else {
  fail("SUGO official facts missing");
}

const sugoAdvice = recommendCarsForChampionship(
  ["sugo"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 1, lapCount: 10, bopOn: true },
  "gt7",
);
if (sugoAdvice.length > 5 && sugoAdvice[0]?.id) ok(`Advisor scores SUGO (top ${sugoAdvice[0].id})`);
else fail("Advisor did not score SUGO");

const wheel = calculateWheelSettings({
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  carId: "ferrari_296_gt3_23",
  trackId: "sugo",
  tyreCompound: "M",
  bopOn: true,
  lapCount: 10,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
if (wheel?.settings && !Object.values(wheel.settings).some((v) => Number.isNaN(v))) {
  ok("Wheel Settings resolves SUGO");
} else {
  fail("Wheel Settings failed on SUGO");
}

const pit = analyzePitstopStrategy({
  carId: "ferrari_296_gt3_23",
  trackId: "sugo",
  gameVersion: "gt7",
  lapCount: 20,
  tyreMultiplier: 3,
  fuelMultiplier: 2,
  bopOn: true,
  carClass: "Gr.3",
});
if (pit && !JSON.stringify(pit).includes("NaN")) ok("PitStop accepts SUGO");
else fail("PitStop failed on SUGO");

console.log("\n═══ Mazda Evo ═══");
const cars = getCarsForGame("gt7").filter((car) => car.class === "Gr.3");
const evoCars = cars.filter((car) => car.id === "mazda_rx_vision_gt3_evo_26");
const concept = cars.find((car) => car.id === "mazda_rx_vision_gt3_concept");
if (evoCars.length === 1 && evoCars[0].class === "Gr.3") ok("Evo '26 is one Gr.3 car");
else fail(`Evo count ${evoCars.length}`);
if (concept && concept.id !== evoCars[0]?.id) ok("Concept car was not overwritten");
else fail("Concept missing or overwritten");

const evoMid = resolveGr3Measurable("mazda_rx_vision_gt3_evo_26", "mid");
const evoHigh = resolveGr3Measurable("mazda_rx_vision_gt3_evo_26", "high");
if (evoMid?.rotation60 == null && evoMid?.stabilityLow == null) {
  ok("Evo handling was not copied");
} else {
  fail("Evo received invented handling");
}
if (evoHigh == null) ok("Evo has no fabricated high-speed BoP");
else fail("Evo high-speed BoP was fabricated");

const evoScore = recommendCarsForChampionship(
  ["suzuka"],
  "Gr.3",
  { fuelMultiplier: 0, tyreMultiplier: 0, lapCount: 10, bopOn: true },
  "gt7",
).find((car) => car.id === "mazda_rx_vision_gt3_evo_26");
if (evoScore && Number.isFinite(evoScore.trackFitScore)) {
  ok(`Evo scores on medium BoP without NaN (${evoScore.trackFitScore})`);
} else {
  fail("Evo could not be scored");
}

const evoWheel = calculateWheelSettings({
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  carId: "mazda_rx_vision_gt3_evo_26",
  trackId: "sugo",
  tyreCompound: "M",
  bopOn: true,
  lapCount: 8,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
if (evoWheel?.settings && !JSON.stringify(evoWheel.settings).includes("NaN")) {
  ok("Wheel Settings resolves the Evo without NaN");
} else {
  fail("Wheel Settings produced NaN for the Evo");
}

console.log("\n═══ Handling and wheels ═══");
const handlingOk = ["Gr.1", "Gr.2", "Gr.3", "Gr.4"].every(
  (carClass) =>
    GR_CLASS_HANDLING_VALIDATION[carClass]?.status === "AWAITING_1_72_VERIFICATION" &&
    GR_CLASS_HANDLING_VALIDATION[carClass]?.lastValidatedGameVersion === "1.71",
);
if (handlingOk) ok("Gr.1–Gr.4 handling remains last validated under 1.71");
else fail("Handling validation metadata missing");

const t598 = getWheelPlatformProfile("thrustmaster_t598");
const rs50 = getWheelPlatformProfile("logitech_rs50");
const r5s = getWheelPlatformProfile("moza_r5s_pro");
if (t598.gt7FfbGameVersion === "1.72" && t598.ffbValidationStatus === "AWAITING_1_72_VERIFICATION") {
  ok("T598 FFB marked for 1.72 revalidation");
} else fail("T598 FFB metadata missing");
if (rs50.gt7FfbGameVersion === "1.72" && rs50.notes !== t598.notes) {
  ok("RS50 FFB marked independently from T598");
} else fail("RS50 metadata was copied from T598 or missing");
if (r5s.setupGeneration === "awaiting_calibration" && r5s.nativeSupportStatus === "CURRENT_1_72_OBSERVED") {
  ok("R5S Pro is recognised and awaiting calibration");
} else fail("R5S Pro metadata missing");

const r5sWheel = calculateWheelSettings({
  gameVersion: "gt7",
  wheelBase: "moza_r5s_pro",
  carId: "ferrari_296_gt3_23",
  trackId: "sugo",
  tyreCompound: "M",
  bopOn: true,
  lapCount: 8,
  tyreMultiplier: 1,
  fuelMultiplier: 1,
});
const r5sKeys = Object.keys(r5sWheel?.settings ?? {}).filter((key) => key !== "notes");
if (r5sKeys.length === 0) ok("R5S Pro does not receive fabricated setting values");
else fail(`R5S Pro generated settings: ${r5sKeys.join(", ")}`);

console.log(`\n${"═".repeat(60)}`);
console.log(`GT7 1.72: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);
if (failures > 0) process.exit(1);
