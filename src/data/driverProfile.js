/**
 * Personal Recommendation layer — driver profile foundation.
 * Default placeholders until profile editing and personalised scoring are added.
 */

/** @typedef {'aggressive' | 'balanced' | 'tyreSaver' | 'fuelSaver' | 'lateBraker' | 'smooth'} PreferredDrivingStyle */

/** @typedef {'early' | 'balanced' | 'late'} BrakingStyle */

/**
 * @typedef {Object} DriverProfile
 * @property {string} driverName
 * @property {PreferredDrivingStyle} preferredDrivingStyle
 * @property {number} tyreManagementRating 1–10
 * @property {number} fuelSavingRating 1–10
 * @property {BrakingStyle} brakingStyle
 * @property {number} rotationPreference 1–10
 * @property {number} stabilityPreference 1–10
 * @property {string[]} favouriteCars Car IDs
 * @property {string[]} avoidedCars Car IDs
 */

/** Default placeholder profile — replaced when user profile storage is implemented. */
export const DEFAULT_DRIVER_PROFILE = {
  driverName: "R79 Driver",
  preferredDrivingStyle: "balanced",
  tyreManagementRating: 6,
  fuelSavingRating: 6,
  brakingStyle: "balanced",
  rotationPreference: 6,
  stabilityPreference: 7,
  favouriteCars: ["porsche_911_gt3_r_22", "genesis_x_gr3"],
  avoidedCars: [],
};

export const PERSONALISATION_STATUS = {
  active: true,
  label: "Personalisation: Basic profile active",
};
