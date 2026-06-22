/** @typedef {'New' | 'Reviewing' | 'Added' | 'Rejected'} WheelSetupRequestStatus */

/** @type {WheelSetupRequestStatus[]} */
export const WHEEL_SETUP_REQUEST_STATUSES = [
  "New",
  "Reviewing",
  "Added",
  "Rejected",
];

export const STARTER_SETUP_LABEL = "Starter profile";

export const NO_EXACT_SETUP_MESSAGE =
  "No exact wheel setup found yet. Try a similar car/track combination or submit a request.";

export { TYRE_COMPOUND_OPTIONS } from "./tyreCompounds.js";
