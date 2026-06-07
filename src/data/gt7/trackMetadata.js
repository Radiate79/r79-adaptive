/** @typedef {'road' | 'street' | 'oval' | 'dirt' | 'snow' | 'rallycross'} TrackType */
/** @typedef {'tarmac' | 'dirt' | 'snow' | 'mixed'} TrackSurface */

export const STANDARD_RACE_CLASSES = ["Gr.1", "Gr.2", "Gr.3", "Gr.4"];
export const DIRT_RACE_CLASSES = ["Gr.B"];

/** Dirt, snow, and rallycross layouts — hidden from Gr.3/Gr.4 selectors. */
export const NON_STANDARD_TRACK_IDS = [
  "colorado_springs",
  "fishermans_ranch",
  "lake_louise",
  "eiger_nordwand",
  "sardegna_windmills",
  "barcelona_rallycross",
];

/** @type {Record<string, TrackSurface>} */
const SURFACE_BY_TRACK_TYPE = {
  road: "tarmac",
  street: "tarmac",
  oval: "tarmac",
  dirt: "dirt",
  snow: "snow",
  rallycross: "mixed",
};

/** @type {Record<string, boolean>} */
const STANDARD_SURFACE_TYPES = {
  road: true,
  street: true,
  oval: true,
};

/**
 * @param {{ trackType?: string, surface?: string }} track
 * @returns {TrackSurface}
 */
export function resolveTrackSurface(track) {
  if (track.surface) {
    return /** @type {TrackSurface} */ (track.surface);
  }

  return SURFACE_BY_TRACK_TYPE[track.trackType ?? "road"] ?? "tarmac";
}

/**
 * @param {{ trackType?: string, surface?: string, eligibleClasses?: string[] }} track
 * @returns {string[]}
 */
export function resolveEligibleClasses(track) {
  if (Array.isArray(track.eligibleClasses) && track.eligibleClasses.length > 0) {
    return track.eligibleClasses;
  }

  const trackType = track.trackType ?? "road";
  const surface = resolveTrackSurface(track);

  if (trackType === "snow" || surface === "snow") {
    return [];
  }

  if (
    trackType === "dirt" ||
    trackType === "rallycross" ||
    surface === "dirt" ||
    surface === "mixed"
  ) {
    return [...DIRT_RACE_CLASSES];
  }

  return [...STANDARD_RACE_CLASSES];
}

/**
 * @param {{ displayName?: string, name?: string }} track
 */
export function getTrackDisplayName(track) {
  if (!track) {
    return "";
  }

  return track.displayName ?? track.name ?? "";
}

/**
 * @param {{ id?: string, eligibleForStandardRaceCars?: boolean, trackType?: string, surface?: string }} track
 */
export function isStandardRaceTrack(track) {  if (!track) {
    return false;
  }

  if (track.eligibleForStandardRaceCars === false) {
    return false;
  }

  if (NON_STANDARD_TRACK_IDS.includes(track.id ?? "")) {
    return false;
  }

  const trackType = track.trackType ?? "road";
  if (trackType === "dirt" || trackType === "snow" || trackType === "rallycross") {
    return false;
  }

  const surface = resolveTrackSurface(track);
  return surface === "tarmac";
}

export function enrichTrackRecord(track) {
  const surface = resolveTrackSurface(track);
  const eligibleClasses = resolveEligibleClasses(track);
  const eligibleForStandardRaceCars =
    track.eligibleForStandardRaceCars ??
    isStandardRaceTrack({
      ...track,
      surface,
      eligibleClasses,
    });
  const displayName = getTrackDisplayName(track);

  return {
    ...track,
    surface,
    eligibleClasses,
    eligibleForStandardRaceCars,
    displayName,
    name: displayName || track.name,
    reverse: Boolean(track.reverse),
    trackFamily: track.trackFamily ?? displayName,
    layoutName: track.layoutName ?? "Full Circuit",
  };
}

/**
 * @param {Array<Record<string, unknown>>} records
 */
export function enrichTrackRecords(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter((track) => track && typeof track === "object")
    .map((track) => enrichTrackRecord(track));
}
