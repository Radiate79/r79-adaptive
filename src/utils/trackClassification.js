import {
  isStandardRaceTrack,
  resolveEligibleClasses,
  resolveTrackSurface,
} from "../data/gt7/trackMetadata.js";
import {
  DRIVING_STYLE_LABELS,
  TRACK_TYPE_LABELS,
} from "../data/gt7/trackTypes.js";

export const NON_TARMAC_TRACK_TYPES = ["dirt", "snow", "rallycross"];
export const NON_STANDARD_RACE_SURFACES = ["dirt", "snow", "mixed"];

export const STANDARD_RACE_CAR_CLASSES = ["Gr.1", "Gr.2", "Gr.3", "Gr.4"];

export const NON_TARMAC_SURFACE_WARNING =
  "This circuit uses a non-tarmac surface. Standard race-car recommendations are disabled.";

/**
 * @param {{ trackType?: string, surface?: string } | null | undefined} track
 */
export function isNonTarmacTrack(track) {
  if (!track) {
    return false;
  }

  if (NON_TARMAC_TRACK_TYPES.includes(track.trackType ?? "")) {
    return true;
  }

  return NON_STANDARD_RACE_SURFACES.includes(resolveTrackSurface(track));
}

/**
 * @param {{ eligibleClasses?: string[], trackType?: string, surface?: string } | null | undefined} track
 * @param {string} selectedClass
 */
export function isTrackEligibleForClass(track, selectedClass) {
  if (!track || !selectedClass) {
    return false;
  }

  return resolveEligibleClasses(track).includes(selectedClass);
}

/**
 * @param {{ eligibleForStandardRaceCars?: boolean, id?: string, trackType?: string, surface?: string } | null | undefined} track
 */
export function isTrackSelectableForStandardRaceCars(track) {
  return isStandardRaceTrack(track);
}

/**
 * @param {Array<{ id?: string, eligibleClasses?: string[], eligibleForStandardRaceCars?: boolean, trackType?: string, surface?: string }>} tracks
 * @param {string} selectedClass
 */
export function getSelectableTracksForClass(tracks, selectedClass) {
  if (!Array.isArray(tracks) || !selectedClass) {
    return [];
  }

  const requiresStandardSurface = STANDARD_RACE_CAR_CLASSES.includes(selectedClass);

  return tracks.filter((track) => {
    if (!isTrackEligibleForClass(track, selectedClass)) {
      return false;
    }

    if (requiresStandardSurface && track.eligibleForStandardRaceCars === false) {
      return false;
    }

    if (requiresStandardSurface && !isStandardRaceTrack(track)) {
      return false;
    }

    return true;
  });
}

/**
 * @param {{ trackType?: string, surface?: string } | null | undefined} track
 */
export function isDirtTrack(track) {
  if (!track) {
    return false;
  }

  return (
    track.trackType === "dirt" ||
    track.trackType === "rallycross" ||
    resolveTrackSurface(track) === "dirt" ||
    resolveTrackSurface(track) === "mixed"
  );
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
  return isTrackEligibleForClass(track, carClass);
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
    return {
      enabled: false,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: "No supported recommendation yet",
      recommendedClass: null,
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
    return {
      enabled: false,
      warning: NON_TARMAC_SURFACE_WARNING,
      message: "No supported recommendation yet",
      recommendedClass: null,
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

  return isTrackEligibleForClass(track, carClass);
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
