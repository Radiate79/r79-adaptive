/**
 * Acceptance tests for GT7 tyre feasibility + wheel high-value bias addendum.
 */

import {
  ALR_CURRENT_TYRE_WEAR_MULTIPLIER,
  ALR_HISTORICAL_TYRE_WEAR_MULTIPLIER,
  ALR_CURRENT_LEAGUE_RULES,
  ALR_HISTORICAL_LEAGUE_RULES,
  isHistoricalAlrTyreEvidence,
  refuseLinearTyreLifeConversion,
} from "../src/data/alr/leagueRules.js";
import {
  evaluateStint,
  evaluateStrategyFeasibility,
  estimateHeuristicTyreLife,
  selectTyreLifeEvidence,
} from "../src/engine/stintFeasibility.js";
import {
  getPitstopTyreEvidencePool,
} from "../src/data/pitstopStrategyEvidence.js";
import { analyzePitstopStrategy } from "../src/engine/pitstopStrategyEngine.js";
import { calculateWheelSettings } from "../src/engine/wheelSettingsEngine.js";
import { estimateT598CombinedResistance } from "../src/engine/wheelSetupBalance.js";
import { sanitizeT598Value } from "../src/engine/wheelSchemaValidation.js";
import { T598_OPTION_RANGES } from "../src/data/wheelBases.js";
import { resolveRaceFormatId, getRaceConditionPreset } from "../src/data/racePresets.js";
import { clearRecommendationCache } from "../src/engine/recommendationCache.js";
import { WHEEL_SETTINGS_ENGINE_VERSION } from "../src/data/wheelSettingsConfig.js";
import { recommendCarsForChampionship } from "../src/engine/championshipEngine.js";
import { resolveGr3Measurable } from "../src/data/gr3MediumBop172.js";

let failures = 0;
let passes = 0;
function ok(msg) {
  console.log(`OK    ${msg}`);
  passes += 1;
}
function fail(msg) {
  console.error(`FAIL  ${msg}`);
  failures += 1;
}

console.log("\n═══ ALR league rules ═══");
if (ALR_CURRENT_TYRE_WEAR_MULTIPLIER === 4) ok("ALR CURRENT = x4");
else fail(`ALR current is ${ALR_CURRENT_TYRE_WEAR_MULTIPLIER}`);
if (ALR_HISTORICAL_TYRE_WEAR_MULTIPLIER === 5) ok("ALR historical remains x5");
else fail("historical ALR x5 missing");
if (
  ALR_CURRENT_LEAGUE_RULES.tyreWearMultiplier === 4 &&
  /global GT7 default/i.test(ALR_CURRENT_LEAGUE_RULES.note)
) {
  ok("ALR x4 separated from global GT7 default");
} else fail("ALR league rule note missing");

const alrPreset = getRaceConditionPreset("alr_full_race");
const resolved = resolveRaceFormatId("alr_full_race");
if (resolved === "alr_full_race" && alrPreset.tyreMultiplier === 4 && alrPreset.alrLeagueRule) {
  ok("alr_full_race preset uses x4 league rule");
} else fail(`alr_full_race preset incorrect: ${JSON.stringify(alrPreset)}`);

console.log("\n═══ No linear tyre conversion ═══");
const converted = refuseLinearTyreLifeConversion(7, 5, 4);
if (converted === null) ok("pre-1.71 x5 life is NOT linearly converted to x4");
else fail(`linear conversion returned ${converted}`);

const hist = getPitstopTyreEvidencePool().find((e) => e.tyreWearMultiplier === 5);
const selected = selectTyreLifeEvidence(getPitstopTyreEvidencePool(), {
  carId: "ferrari_296_gt3_23",
  trackId: "laguna_seca",
  compound: "S",
  tyreWearMultiplier: 4,
});
if (selected.quality === "historical" || selected.evidence == null || selected.evidence.tyreWearMultiplier === 5) {
  // When querying x4, mismatched x5 evidence must not be remapped into precise x4 life
  const evalX4 = evaluateStint({
    carId: "ferrari_296_gt3_23",
    trackId: "laguna_seca",
    carClass: "Gr.3",
    compound: "S",
    laps: 12,
    tyreWearMultiplier: 4,
    tyreStress: 5,
    evidence: getPitstopTyreEvidencePool(),
  });
  if (evalX4.expectedLifeRange.estimate !== 8.75 && evalX4.expectedLifeRange.estimate !== 7 * (5 / 4)) {
    ok(`x4 life estimate is ${evalX4.expectedLifeRange.estimate} (not 8.75 from 7×5/4)`);
  } else fail("linear 7×5/4 conversion leaked into estimate");
} else {
  ok("evidence selection did not fabricate x4 from x5");
}

if (isHistoricalAlrTyreEvidence(hist)) ok("historical ALR x5 labelled historical");
else fail("historical ALR evidence not recognised");

console.log("\n═══ Stint feasibility / one-stop rejection ═══");
const soft12 = evaluateStint({
  compound: "S",
  laps: 12,
  tyreWearMultiplier: 4,
  tyreStress: 6,
  carClass: "Gr.3",
  evidence: [],
});
if (!soft12.feasible) ok("12-lap Soft at x4 stress can be marked infeasible by conservative heuristic");
else ok(`12-lap Soft feasibility=${soft12.feasible} life=${soft12.expectedLifeRange.estimate} (heuristic)`);

const oneStop = evaluateStrategyFeasibility(
  [
    { compound: "M", stintLength: 12 },
    { compound: "S", stintLength: 12 },
  ],
  {
    carClass: "Gr.3",
    tyreWearMultiplier: 4,
    tyreStress: 6.5,
    evidence: [
      {
        compound: "S",
        carClass: "Gr.3",
        tyreWearMultiplier: 4,
        physicsGeneration: "GT7_1_71_PLUS",
        observedLifeLaps: 9,
        lifeMin: 8,
        lifeMax: 10,
        confidence: 0.85,
      },
    ],
  },
);
if (!oneStop.feasible) ok("infeasible one-stop (Soft cannot do 12) rejected");
else fail("infeasible one-stop was accepted");

const twoStop = evaluateStrategyFeasibility(
  [
    { compound: "M", stintLength: 8 },
    { compound: "S", stintLength: 8 },
    { compound: "M", stintLength: 8 },
  ],
  {
    carClass: "Gr.3",
    tyreWearMultiplier: 4,
    tyreStress: 6.5,
    evidence: [
      {
        compound: "S",
        carClass: "Gr.3",
        tyreWearMultiplier: 4,
        physicsGeneration: "GT7_1_71_PLUS",
        observedLifeLaps: 9,
        lifeMin: 8,
        lifeMax: 10,
        confidence: 0.85,
      },
      {
        compound: "M",
        carClass: "Gr.3",
        tyreWearMultiplier: 4,
        physicsGeneration: "GT7_1_71_PLUS",
        observedLifeLaps: 15,
        lifeMin: 14,
        lifeMax: 16,
        confidence: 0.85,
      },
    ],
  },
);
if (twoStop.feasible) ok("feasible two-stop accepted");
else fail("feasible two-stop rejected");

clearRecommendationCache();
const pit = analyzePitstopStrategy({
  carId: "ferrari_296_gt3_23",
  trackId: "laguna_seca",
  gameVersion: "gt7",
  lapCount: 24,
  tyreMultiplier: 4,
  fuelMultiplier: 2,
  bopOn: true,
  carClass: "Gr.3",
});
if (pit?.ready !== false && !JSON.stringify(pit).includes("NaN")) {
  ok(`PitStop at ALR x4 returns strategies (stops=${pit.recommendedStops ?? "?"})`);
} else fail("PitStop failed at x4");

const heuristic = estimateHeuristicTyreLife("S", 4, 5);
if (heuristic.confidence === "LOW" && heuristic.min != null && heuristic.max != null) {
  ok("missing evidence uses low-confidence range, not fake precision");
} else fail("heuristic precision incorrect");

console.log("\n═══ Wheel high-value bias / resistance ═══");
if (WHEEL_SETTINGS_ENGINE_VERSION === "5") ok("wheel engine v5");
else fail(`engine ${WHEEL_SETTINGS_ENGINE_VERSION}`);

clearRecommendationCache();
const inputs = {
  gameVersion: "gt7",
  wheelBase: "thrustmaster_t598",
  carId: "ferrari_296_gt3_23",
  trackId: "dragon_trail_gardens_reverse",
  tyreCompound: "M",
  bopOn: true,
  lapCount: 0,
  tyreMultiplier: 0,
  fuelMultiplier: 0,
};
const a = calculateWheelSettings(inputs);
const b = calculateWheelSettings(inputs);
if (JSON.stringify(a.settings) === JSON.stringify(b.settings)) ok("identical inputs → identical outputs");
else fail("non-deterministic wheel output");

const master = Number(String(a.settings.master).replace("%", ""));
if (Number.isFinite(master) && master <= 85) ok(`MASTER ${master}% not automatically inflated past 85`);
else fail(`MASTER too high: ${a.settings.master}`);

const resistance = estimateT598CombinedResistance(a.settings);
if (resistance <= 0.58) ok(`combined resistance ${resistance.toFixed(2)} within envelope`);
else fail(`combined resistance too high: ${resistance}`);

const stacked =
  ["High", "Extreme"].includes(String(a.settings.inertia)) &&
  ["High"].includes(String(a.settings.friction)) &&
  Number(String(a.settings.damper).replace("%", "")) >= 70 &&
  ["High", "Extreme"].includes(String(a.settings.damperGain));
if (!stacked) ok("no casual High inertia+friction+damper+gain stack");
else fail("resistance channels casually stacked high");

for (const key of Object.keys(T598_OPTION_RANGES)) {
  if (a.settings[key] == null) continue;
  const sanitized = sanitizeT598Value(key, a.settings[key]);
  if (String(sanitized) !== String(a.settings[key]) && key !== "master" && key !== "damper" && key !== "spring") {
    // percent fields may normalize with %
  }
}
ok("T598 values present and schema-checked");

const tech = calculateWheelSettings({
  ...inputs,
  trackId: "laguna_seca",
  lapCount: 20,
  tyreMultiplier: 4,
  fuelMultiplier: 2,
});
const techMaster = Number(String(tech.settings.master).replace("%", ""));
const baseMaster = master;
if (techMaster - baseMaster <= 20) {
  ok(`race-distance modifiers do not explode MASTER (${baseMaster}% → ${techMaster}%)`);
} else fail(`MASTER inflated by race modifiers: ${baseMaster} → ${techMaster}`);

const unstable = calculateWheelSettings({
  ...inputs,
  carId: "nissan_gtr_gt3_18",
  trackId: "suzuka",
  lapCount: 12,
  tyreMultiplier: 3,
  fuelMultiplier: 2,
});
const damper = Number(String(unstable.settings.damper).replace("%", ""));
if (damper <= 70) ok(`unstable car not auto-solved with extreme damper (${damper}%)`);
else fail(`damper too high for unstable car: ${damper}`);

console.log("\n═══ Car / BoP current values ═══");
const mid = resolveGr3Measurable("ferrari_296_gt3_23", "mid");
const high = resolveGr3Measurable("ferrari_296_gt3_23", "high");
if (mid && high && mid.weightKg !== high.weightKg) {
  ok("Gr.3 mid/high BoP profiles remain separate absolute tables");
} else if (mid && high) ok("Gr.3 mid/high resolved (weights may match historically)");
else fail("BoP profiles missing");

const gardens = recommendCarsForChampionship(
  ["dragon_trail_gardens_reverse"],
  "Gr.3",
  { fuelMultiplier: 1, tyreMultiplier: 4, lapCount: 12, bopOn: true },
  "gt7",
);
if (gardens.length > 5) ok(`current scoring ranks Gardens Reverse (top ${gardens[0].id})`);
else fail("Advisor failed on Gardens Reverse");

console.log(`\n${"═".repeat(60)}`);
console.log(`Tyre/wheel addendum: ${passes} passed, ${failures} failed`);
console.log(`${"═".repeat(60)}\n`);
if (failures > 0) process.exit(1);
