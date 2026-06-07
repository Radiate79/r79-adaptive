import {
  DRIVING_STYLE_LABELS,
  TRACK_TYPE_LABELS,
} from "../data/gt7/trackTypes.js";

export const NON_TARMAC_TRACK_TYPES = ["dirt", "snow"];

export const STANDARD_RACE_CAR_CLASSES = ["Gr.1", "Gr.2", "Gr.3", "Gr.4"];

export const NON_TARMAC_SURFACE_WARNING =
  "This circuit uses a non-tarmac surface. Standard race-car recommendations are disabled.";

const DIRT_RECOMMENDATION_CLASS = "Gr.B";

/**
 * @param {{ trackType?: string } | null | undefined} track
 */
export function isNonTarmacTrack(track) {
  return NON_TARMAC_TRACK_TYPES.includes(track?.trackType ?? "");
}

/**
 * @param {{ trackType?: string } | null | undefined} track
 */
export function isDirtTrack(track) {
  return track?.trackType === "dirt";
}

/**
 * @param {{ trackType?: string } | null | undefined} track
 */
export function isSnowTrack(track) {
  return track?.trackType === "snow";
}

/**
 * @param {{ trackType?: string } | null | undefined} track
 * @param {string} [carClass]
 */
export function isCarClassSupportedOnTrack(track, carClass) {
  if (!track || !carClass) {
    return false;
  }

  if (isSnowTrack(track)) {
    return false;
  }

  if (isDirtTrack(track)) {
    return carClass === DIRT_RECOMMENDATION_CLASS;
  }

  return true;
}

/**
 * @param {{ trackType?: string } | null | undefined} track
 * @param {string} [carClass]
 */
export function getTrackRecommendationStatus(track, carClass) {
  if (!track) {
    return {
      enabled: false,
      warning: null,
      message: "Select a track to generate recommendations.",
      recommendedClass: null,
      trackTypeLabel: null,
      drivingStyleLabel: null,
    };
  }

  const trackTypeLabel = TRACK_TYPE_LABELS[track.trackType] ?? track.trackType;
  const drivingStyleLabel =
    DRIVING_STYLE_LABELS[track.drivingStyle] ?? track.drivingStyle;

  if (isSnowTrack(track)) {
    return {
      enabled: false,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: "Coming Soon",
      recommendedClass: null,
      trackTypeLabel,
      drivingStyleLabel,
    };
  }

  if (isDirtTrack(track)) {
    const supported = carClass === DIRT_RECOMMENDATION_CLASS;

    return {
      enabled: supported,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: supported ? null : "No supported recommendation yet",
      recommendedClass: DIRT_RECOMMENDATION_CLASS,
      trackTypeLabel,
      drivingStyleLabel,
    };
  }

  return {
    enabled: true,
    warning: null,
    message: null,
    recommendedClass: carClass ?? "Gr.3",
    trackTypeLabel,
    drivingStyleLabel,
  };
}

/**
 * @param {Array<{ trackType?: string }>} tracks
 */
export function getNonTarmacTracks(tracks) {
  if (!Array.isArray(tracks)) {
    return [];
  }

  return tracks.filter((track) => isNonTarmacTrack(track));
}

/**
 * @param {Array<{ trackType?: string }>} tracks
 * @param {string} [carClass]
 */
export function getCalendarRecommendationStatus(tracks, carClass) {
  const nonTarmac = getNonTarmacTracks(tracks);

  if (nonTarmac.length === 0) {
    return {
      enabled: true,
      warning: null,
      message: null,
      recommendedClass: carClass ?? "Gr.3",
    };
  }

  const hasSnow = nonTarmac.some((track) => isSnowTrack(track));
  const hasDirt = nonTarmac.some((track) => isDirtTrack(track));

  if (hasSnow) {
    return {
      enabled: false,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: "Coming Soon",
      recommendedClass: null,
    };
  }

  if (hasDirt) {
    const supported = carClass === DIRT_RECOMMENDATION_CLASS;

    return {
      enabled: supported,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: supported ? null : "No supported recommendation yet",
      recommendedClass: DIRT_RECOMMENDATION_CLASS,
    };
  }

  return {
    enabled: true,
    warning: null,
    message: null,
    recommendedClass: carClass ?? "Gr.3",
  };
}

/**
 * @param {string} carClass
 * @param {{ trackType?: string } | null | undefined} track
 */
export function isCarClassSelectableForTrack(carClass, track) {
  if (!track) {
    return true;
  }

  if (isSnowTrack(track)) {
    return false;
  }

  if (isDirtTrack(track)) {
    return carClass === DIRT_RECOMMENDATION_CLASS;
  }

  return true;
}

/**
 * Surface-aware demand modifiers for track scoring.
 *
 * @param {{ trackType?: string, drivingStyle?: string } | null | undefined} track
 * @returns {Partial<Record<string, number>>}
 */
export function getTrackSurfaceModifiers(track) {
  if (!track) {
    return {};
  }

  if (track.trackType === "street") {
    return {
      stability: 1.12,
      traction: 1.08,
      topSpeed: 0.92,
      kerbs: 1.1,
    };
  }

  if (track.trackType === "oval") {
    return {
      topSpeed: 1.22,
      traction: 0.88,
      stability: 1.05,
      rotation: 0.85,
    };
  }

  if (track.drivingStyle === "high_speed") {
    return { topSpeed: 1.1, stability: 1.05 };
  }

  if (track.drivingStyle === "technical") {
    return { traction: 1.1, rotation: 1.08, stability: 1.05 };
  }

  if (track.drivingStyle === "endurance") {
    return { fuel: 1.12, tyres: 1.1 };
  }

  return {};
}
