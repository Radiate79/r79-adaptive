import { getRaceConditionImportance } from "./advisorScoringConfig.js";
import { getTrackRacingProfile } from "../data/championshipAdvisor171.js";
import { getTrackDisplayName } from "../utils/gameData.js";

const ATTRIBUTE_LABELS = {
  topSpeed: "top speed",
  traction: "traction",
  fuel: "fuel efficiency",
  tyres: "tyre preservation",
  stability: "braking stability",
  rotation: "rotation and agility",
};

const PROFILE_PHRASES = {
  power: "straight-line pace suits this power-biased circuit",
  technical: "rotation and medium-speed performance suit the technical layout",
  highSpeedCorner: "high-speed stability and cornering suit this circuit",
  tractionHeavy: "traction and corner-exit grip matter on this layout",
  tyreSensitive: "tyre management is critical on this surface",
  balanced: "balanced pace across sectors suits this circuit",
};

/**
 * @param {Array<{ field: string, contribution: number, carValue?: number, demand?: number }>} contributions
 * @param {{ fuelMultiplier?: number, tyreMultiplier?: number, lapCount?: number }} raceSettings
 * @param {Array<{ name?: string, id?: string, [key: string]: unknown }>} tracks
 */
export function generateAdvisorReasons(
  contributions,
  raceSettings = {},
  tracks = [],
) {
  const raceImportance = getRaceConditionImportance(raceSettings);
  const primaryTrack = tracks[0];
  const profile = primaryTrack ? getTrackRacingProfile(primaryTrack) : "balanced";
  const trackLabel =
    tracks.length === 1
      ? getTrackDisplayName(primaryTrack)
      : `${tracks.length}-round calendar`;

  const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution);
  const strengths = sorted.slice(0, 2);
  const compromises = sorted
    .filter((entry) => Number(entry.carValue ?? 0) < Number(entry.demand ?? 0) - 1)
    .slice(0, 1);

  /** @type {string[]} */
  const reasons = [];

  if (strengths[0]) {
    const label = ATTRIBUTE_LABELS[strengths[0].field] ?? strengths[0].field;
    reasons.push(
      `Strong ${label} aligns with ${trackLabel} — ${PROFILE_PHRASES[profile] ?? PROFILE_PHRASES.balanced}.`,
    );
  }

  if (strengths[1] && strengths[1].field !== strengths[0]?.field) {
    const label = ATTRIBUTE_LABELS[strengths[1].field] ?? strengths[1].field;
    reasons.push(`Secondary edge in ${label} supports this combination.`);
  }

  const tyreMult = Number(raceSettings.tyreMultiplier ?? 0);
  const fuelMult = Number(raceSettings.fuelMultiplier ?? 0);
  const laps = raceImportance.profile.laps;

  if (tyreMult === 0) {
    reasons.push("Tyre wear disabled — preservation carries no scoring weight.");
  } else if (tyreMult >= 4) {
    reasons.push(
      `Tyre preservation weighted heavily at x${tyreMult} wear${laps <= 10 ? " over this shorter race" : ""}.`,
    );
  } else if (tyreMult <= 1 && laps <= 10) {
    reasons.push(
      `Tyres x${tyreMult} over ${laps} laps — outright pace matters more than tyre life.`,
    );
  }

  if (fuelMult === 0) {
    reasons.push("Fuel consumption disabled — efficiency is not a constraint.");
  } else if (fuelMult >= 3 && laps >= 15) {
    reasons.push(`Fuel x${fuelMult} adds meaningful efficiency pressure over ${laps} laps.`);
  } else if (fuelMult <= 1 && laps <= 12) {
    reasons.push(`Fuel x${fuelMult} has limited influence over this ${laps}-lap distance.`);
  }

  if (compromises[0]) {
    const label = ATTRIBUTE_LABELS[compromises[0].field] ?? compromises[0].field;
    reasons.push(
      `Compromise: ${label} is weaker relative to what this track demands.`,
    );
  }

  return reasons.slice(0, 4);
}
