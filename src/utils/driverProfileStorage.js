import { DEFAULT_DRIVER_PROFILE } from "../data/driverProfile.js";

const STORAGE_KEY = "r79-driver-profile";

/**
 * @param {number} value
 * @param {number} fallback
 */
function clampRating(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(10, Math.max(1, Math.round(numeric)));
}

/**
 * @param {Partial<DriverProfile>} profile
 * @returns {import("../data/driverProfile.js").DriverProfile}
 */
function normalizeDriverProfile(profile) {
  const base = DEFAULT_DRIVER_PROFILE;

  return {
    driverName: String(profile.driverName ?? base.driverName).trim() || base.driverName,
    preferredDrivingStyle:
      profile.preferredDrivingStyle ?? base.preferredDrivingStyle,
    tyreManagementRating: clampRating(
      profile.tyreManagementRating,
      base.tyreManagementRating,
    ),
    fuelSavingRating: clampRating(profile.fuelSavingRating, base.fuelSavingRating),
    brakingStyle: profile.brakingStyle ?? base.brakingStyle,
    rotationPreference: clampRating(
      profile.rotationPreference,
      base.rotationPreference,
    ),
    stabilityPreference: clampRating(
      profile.stabilityPreference,
      base.stabilityPreference,
    ),
    favouriteCars: Array.isArray(profile.favouriteCars)
      ? profile.favouriteCars.map((id) => String(id).trim()).filter(Boolean)
      : [...base.favouriteCars],
    avoidedCars: Array.isArray(profile.avoidedCars)
      ? profile.avoidedCars.map((id) => String(id).trim()).filter(Boolean)
      : [...base.avoidedCars],
  };
}

/**
 * Load the driver profile from localStorage, falling back to defaults.
 * @returns {import("../data/driverProfile.js").DriverProfile}
 */
export function loadDriverProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeDriverProfile(parsed);
    }
  } catch {
    // fall through to defaults
  }

  return normalizeDriverProfile(DEFAULT_DRIVER_PROFILE);
}

/**
 * Persist a driver profile for future personalisation.
 * @param {Partial<import("../data/driverProfile.js").DriverProfile>} profile
 */
export function saveDriverProfile(profile) {
  const normalized = normalizeDriverProfile({
    ...loadDriverProfile(),
    ...profile,
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
