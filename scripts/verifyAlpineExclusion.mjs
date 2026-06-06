/**
 * Audit script — confirms no Alpine appears in any recommendation engine output.
 * Uses the same eligibility rules as isCarEligibleForRecommendations().
 * Run: node scripts/verifyAlpineExclusion.mjs
 */
import { isCarEligibleForRecommendations } from "../src/utils/carClassFilter.js";
import { getCarsForGame, getTracksForGame } from "../src/utils/gameData.js";
import {
  recommendCarsForChampionship,
  rankCarsByChampionshipConsistency,
} from "../src/engine/championshipEngine.js";
import { analyzeTodaysRace } from "../src/engine/todaysRaceAdvisorEngine.js";
import { analyzeAIRaceEngineer } from "../src/engine/aiRaceEngineerEngine.js";
import { recommendTeamCarShortlist } from "../src/engine/shortlistAdvisorEngine.js";

const CAR_CLASSES = ["Gr.3", "Gr.4", "Gr.2", "Gr.1", "N", "Vision GT"];
const gameVersion = "gt7";

function isAlpineRecommendationHit(value) {
  if (!value) {
    return false;
  }

  if (!isCarEligibleForRecommendations(value)) {
    return true;
  }

  if (value.recommendedCar && !isCarEligibleForRecommendations(value.recommendedCar)) {
    return true;
  }

  if (value.car && !isCarEligibleForRecommendations(value.car)) {
    return true;
  }

  return /\balpine\b/i.test(value.name ?? "") || /\balpine\b/i.test(value.id ?? value.carId ?? "");
}

function collectAlpineHits(label, cars) {
  const hits = (cars ?? []).filter((car) => isAlpineRecommendationHit(car));
  return hits.length ? [{ label, hits }] : [];
}

const violations = [];

for (const carClass of CAR_CLASSES) {
  const tracks = getTracksForGame(gameVersion);
  for (const track of tracks) {
    const recs = recommendCarsForChampionship([track.id], carClass, {}, gameVersion);
    violations.push(
      ...collectAlpineHits(`ChampionshipAdvisor ${carClass} @ ${track.id}`, recs),
    );

    const consistency = rankCarsByChampionshipConsistency(
      [track.id],
      carClass,
      {},
      gameVersion,
    );
    violations.push(
      ...collectAlpineHits(
        `Championship consistency ${carClass} @ ${track.id}`,
        consistency,
      ),
    );

    const todays = analyzeTodaysRace({
      trackId: track.id,
      carClass,
      gameVersion,
    });
    if (todays.ready) {
      violations.push(
        ...collectAlpineHits(`Today's Race top10 ${carClass} @ ${track.id}`, todays.recommendations),
      );
      if (todays.topPick && isAlpineRecommendationHit(todays.topPick)) {
        violations.push({
          label: `Today's Race topPick ${carClass} @ ${track.id}`,
          hits: [todays.topPick],
        });
      }
      if (
        todays.alternativeChoice &&
        isAlpineRecommendationHit(todays.alternativeChoice)
      ) {
        violations.push({
          label: `Today's Race alternative ${carClass} @ ${track.id}`,
          hits: [todays.alternativeChoice],
        });
      }
    }

    const engineer = analyzeAIRaceEngineer({
      trackId: track.id,
      gameVersion,
      availableCarIds: getCarsForGame(gameVersion).map((car) => car.id),
    });
    if (engineer.ready) {
      if (
        engineer.recommendedCar &&
        isAlpineRecommendationHit(engineer.recommendedCar)
      ) {
        violations.push({
          label: `AI Engineer recommended @ ${track.id}`,
          hits: [engineer.recommendedCar],
        });
      }
      if (
        engineer.alternativeChoice?.car &&
        isAlpineRecommendationHit(engineer.alternativeChoice.car)
      ) {
        violations.push({
          label: `AI Engineer alternative @ ${track.id}`,
          hits: [engineer.alternativeChoice.car],
        });
      }
    }
  }

  const shortlist = recommendTeamCarShortlist({
    trackIds: tracks.slice(0, 5).map((t) => t.id),
    carClass,
    gameVersion,
    driver1: "balanced",
    driver2: "balanced",
    tier: 1,
  });
  const shortlistCars = Array.isArray(shortlist)
    ? shortlist.map((entry) => entry.car ?? entry)
    : [];
  violations.push(
    ...collectAlpineHits(`Team Shortlist ${carClass}`, shortlistCars),
  );
}

if (violations.length === 0) {
  console.log("PASS: 0 Alpine hits across all recommendation engines.");
  process.exit(0);
}

console.error("FAIL: Alpine found in recommendation outputs:");
for (const v of violations) {
  console.error(`\n${v.label}:`);
  for (const hit of v.hits) {
    console.error(`  - ${hit.name ?? hit.id ?? JSON.stringify(hit)}`);
  }
}
process.exit(1);
