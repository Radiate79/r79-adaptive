import { getTrackRacingProfile } from "../data/championshipAdvisor171.js";
import { getTrackDisplayName } from "../data/gt7/trackMetadata.js";
import { getTracksForGame } from "../utils/gameData.js";
import { computeCarTrackInteraction } from "./carTrackInteraction.js";

/**
 * @param {number | undefined} value
 */
function normalizeTrait(value) {
  const numeric = Number(value ?? 5);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(1, Math.max(0, numeric / 10));
}

/**
 * @param {{ trackId?: string, gameVersion?: string, car?: import("../data/gt7/cars.js").CarRecord | null }} input
 */
export function resolveTrackDynamicsProfile(input) {
  const gameVersion = input.gameVersion ?? "gt7";
  const track =
    getTracksForGame(gameVersion).find((entry) => entry.id === input.trackId) ??
    null;

  if (!track) {
    return {
      trackId: input.trackId ?? "",
      track: null,
      traits: {},
      racingProfile: "balanced",
      displayName: "",
      completeness: 0,
      interaction: computeCarTrackInteraction(input.car ?? null, null),
    };
  }

  const traits = {
    topSpeed: normalizeTrait(track.topSpeed),
    traction: normalizeTrait(track.traction),
    tyres: normalizeTrait(track.tyres),
    stability: normalizeTrait(track.stability),
    kerbs: normalizeTrait(track.kerbs),
    fuel: normalizeTrait(track.fuel),
  };

  const knownCount = Object.values(traits).filter((value) => value != null).length;
  const racingProfile = getTrackRacingProfile(track);
  const interaction = computeCarTrackInteraction(input.car ?? null, track);

  return {
    trackId: track.id,
    track,
    traits,
    racingProfile,
    displayName: getTrackDisplayName(track),
    completeness: knownCount / Object.keys(traits).length,
    interaction,
  };
}

/**
 * @param {ReturnType<typeof resolveTrackDynamicsProfile>} profile
 */
export function buildTrackDynamicsSignals(profile) {
  const { traits, interaction, racingProfile } = profile;

  const technical =
    racingProfile === "technical" || racingProfile === "tractionHeavy" ? 1 : 0.45;

  return {
    trackLoad:
      traits.topSpeed != null && traits.traction != null
        ? traits.topSpeed * 0.55 + traits.traction * 0.45
        : traits.topSpeed ?? traits.traction,
    trackSteeringLoad: interaction?.detailNeed ?? traits.traction,
    trackRotationNeed: interaction?.rotationNeed ?? traits.traction,
    trackHighSpeed: interaction?.highSpeedNeed ?? traits.topSpeed,
    trackKerb: interaction?.kerbLoad ?? traits.kerbs,
    trackDetail: interaction?.detailNeed ?? traits.traction,
    trackTechnical: technical,
  };
}
