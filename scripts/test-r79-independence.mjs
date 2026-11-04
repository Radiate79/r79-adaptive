/**
 * Acceptance: R79 recommendation independence.
 * Must not copy / approximate / reverse-engineer external assistants.
 */

import {
  R79_ALLOWED_RECOMMENDATION_SOURCES,
  R79_FORBIDDEN_EXTERNAL_ASSISTANTS,
  R79_FORBIDDEN_INPUT_KEYS,
  R79_QUALITY_OBJECTIVES,
  R79_RECOMMENDATION_AUTHORITY_ID,
  assertR79RecommendationIndependence,
  getR79RecommendationAuthorityStamp,
  stripExternalAssistantTargets,
} from "../src/data/r79RecommendationAuthority.js";
import { getAdvisorCacheVersionStamp } from "../src/data/advisorDataLayer.js";
import { clearRecommendationCache } from "../src/engine/recommendationCache.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";

let passed = 0;
let failed = 0;

function ok(msg) {
  passed += 1;
  console.log(`OK    ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.log(`FAIL  ${msg}`);
}

console.log("═══ R79 independence doctrine ═══");

if (R79_RECOMMENDATION_AUTHORITY_ID === "R79_INDEPENDENT") ok("authority id R79_INDEPENDENT");
else fail(`authority id ${R79_RECOMMENDATION_AUTHORITY_ID}`);

if (R79_FORBIDDEN_EXTERNAL_ASSISTANTS.includes("jucis")) ok("jucis listed as forbidden target");
else fail("jucis missing from forbidden list");

if (R79_FORBIDDEN_EXTERNAL_ASSISTANTS.includes("chatgpt")) ok("chatgpt listed as forbidden target");
else fail("chatgpt missing from forbidden list");

if (!R79_ALLOWED_RECOMMENDATION_SOURCES.includes("jucis")) {
  ok("jucis is not an allowed recommendation source");
} else fail("jucis must not be an allowed source");

if (R79_QUALITY_OBJECTIVES.includes("lap_performance") &&
    R79_QUALITY_OBJECTIVES.includes("race_consistency") &&
    R79_QUALITY_OBJECTIVES.includes("grip_clarity") &&
    !R79_QUALITY_OBJECTIVES.some((o) => /jucis|chatgpt|external/i.test(o))) {
  ok("quality objectives are performance/control based, not external matching");
} else fail("quality objectives incorrect");

const stamp = getR79RecommendationAuthorityStamp();
if (
  stamp.externalAssistantTargeting === "FORBIDDEN" &&
  stamp.finalJudge === "real_driving_performance_and_current_evidence"
) {
  ok("authority stamp forbids external targeting; final judge is driving evidence");
} else fail("authority stamp incorrect");

console.log("\n═══ Input rejection / stripping ═══");

const poisoned = assertR79RecommendationIndependence({
  carId: "ferrari_296_gt3_23",
  jucisSettings: { master: "45%" },
});
if (!poisoned.independent && poisoned.offender === "jucisSettings") {
  ok("detects jucisSettings injection");
} else fail("failed to detect jucisSettings");

const chatgptPoison = assertR79RecommendationIndependence({
  chatGptSettings: { damper: "10%" },
});
if (!chatgptPoison.independent) ok("detects chatGptSettings injection");
else fail("failed to detect chatGptSettings");

const cleaned = stripExternalAssistantTargets({
  carId: "ferrari_296_gt3_23",
  trackId: "dragon_trail_gardens_reverse",
  jucisTarget: { master: "40%" },
  tyreCompound: "M",
});
if (
  cleaned.carId === "ferrari_296_gt3_23" &&
  cleaned.tyreCompound === "M" &&
  cleaned.jucisTarget == null
) {
  ok("strips external targets while preserving legitimate race inputs");
} else fail("stripExternalAssistantTargets failed");

const cleanCheck = assertR79RecommendationIndependence({
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  carId: "ferrari_296_gt3_23",
  trackId: "spa_francorchamps",
  tyreCompound: "M",
});
if (cleanCheck.independent) ok("legitimate race inputs remain independent");
else fail("false positive on clean input");

for (const key of R79_FORBIDDEN_INPUT_KEYS) {
  const hit = assertR79RecommendationIndependence({ [key]: {} });
  if (!hit.independent) continue;
  fail(`forbidden key not detected: ${key}`);
  break;
}
ok("all forbidden input keys are rejected");

console.log("\n═══ Wheel engine ignores external targets ═══");

clearRecommendationCache();
const base = {
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  carId: "ferrari_296_gt3_23",
  trackId: "dragon_trail_gardens_reverse",
  tyreCompound: "M",
  bopOn: true,
  lapCount: 12,
  tyreMultiplier: 4,
  fuelMultiplier: 3,
};

const independent = calculateWheelSettings(base);
const withJucisNoise = calculateWheelSettings({
  ...base,
  jucisSettings: { master: "35%", damper: "50%", inertia: "Extreme" },
});

if (
  independent.provenance?.recommendationAuthority === "R79_INDEPENDENT" &&
  independent.provenance?.externalAssistantTargeting === "FORBIDDEN"
) {
  ok("wheel provenance stamps R79_INDEPENDENT / FORBIDDEN");
} else fail("wheel provenance missing independence stamp");

if (JSON.stringify(independent.settings) === JSON.stringify(withJucisNoise.settings)) {
  ok("injecting jucisSettings does not change R79 output");
} else fail("jucisSettings influenced wheel output — independence broken");

const advisorStamp = getAdvisorCacheVersionStamp();
if (advisorStamp.recommendationAuthority === "R79_INDEPENDENT") {
  ok("advisor cache stamp includes R79_INDEPENDENT");
} else fail("advisor cache stamp missing independence");

console.log("\n════════════════════════════════════════════════════════════");
if (failed === 0) {
  console.log(`R79 independence: ${passed} passed, 0 failed`);
  process.exit(0);
}
console.log(`R79 independence: ${passed} passed, ${failed} failed`);
process.exit(1);
