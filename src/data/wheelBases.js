/** @typedef {'t598' | 'logitech_g923' | 'logitech_g_pro' | 'fanatec' | 'moza' | 'other'} WheelTemplateFamily */

/**
 * @typedef {Object} WheelBaseOption
 * @property {string} id
 * @property {string} label
 * @property {WheelTemplateFamily} templateFamily
 */

/** @type {WheelBaseOption[]} */
export const WHEEL_BASE_OPTIONS = [
  { id: "thrustmaster_t598", label: "Thrustmaster T598", templateFamily: "t598" },
  { id: "logitech_g923", label: "Logitech G923", templateFamily: "logitech_g923" },
  {
    id: "logitech_g_pro",
    label: "Logitech G Pro Racing Wheel",
    templateFamily: "logitech_g_pro",
  },
  { id: "fanatec_gt_dd_pro", label: "Fanatec GT DD Pro", templateFamily: "fanatec" },
  { id: "fanatec_csl_dd", label: "Fanatec CSL DD", templateFamily: "fanatec" },
  {
    id: "fanatec_clubsport_dd",
    label: "Fanatec ClubSport DD",
    templateFamily: "fanatec",
  },
  { id: "moza_r3", label: "Moza R3", templateFamily: "moza" },
  { id: "moza_r5", label: "Moza R5", templateFamily: "moza" },
  { id: "moza_r9", label: "Moza R9", templateFamily: "moza" },
  { id: "other_custom", label: "Other / Custom", templateFamily: "other" },
];

/** @type {Record<WheelTemplateFamily, { key: string, label: string }[]>} */
export const WHEEL_TEMPLATE_FIELDS = {
  t598: [
    { key: "ffb", label: "FFB" },
    { key: "master", label: "MASTER" },
    { key: "mode", label: "MODE" },
    { key: "inertia", label: "INERTIA" },
    { key: "friction", label: "FRICTION" },
    { key: "boostLow", label: "BOOST LOW" },
    { key: "boostHigh", label: "BOOST HIGH" },
    { key: "speed", label: "SPEED" },
    { key: "damper", label: "DAMPER" },
    { key: "damperGain", label: "DAMPER GAIN" },
    { key: "spring", label: "SPRING" },
    { key: "gearJolt", label: "GEAR JOLT" },
    { key: "endStop", label: "END STOP" },
  ],
  logitech_g923: [
    { key: "forceFeedbackMaxTorque", label: "Force Feedback Max Torque" },
    { key: "forceFeedbackSensitivity", label: "Force Feedback Sensitivity" },
    {
      key: "controllerSteeringSensitivity",
      label: "Controller Steering Sensitivity",
    },
    { key: "vibrationStrength", label: "Vibration Strength" },
    { key: "brakeBalance", label: "Brake Balance suggestion" },
    { key: "notes", label: "Notes" },
  ],
  logitech_g_pro: [
    { key: "trueforceAudio", label: "Trueforce Audio" },
    { key: "trueforceStrength", label: "Trueforce Strength" },
    { key: "ffbStrength", label: "FFB Strength" },
    { key: "filter", label: "Filter" },
    { key: "dampener", label: "Dampener" },
    { key: "angle", label: "Angle" },
    { key: "brakeForce", label: "Brake Force" },
    { key: "brakeBalance", label: "Brake Balance suggestion" },
    { key: "notes", label: "Notes" },
  ],
  fanatec: [
    { key: "sen", label: "SEN" },
    { key: "ff", label: "FF" },
    { key: "ffs", label: "FFS" },
    { key: "ndp", label: "NDP" },
    { key: "nfr", label: "NFR" },
    { key: "nin", label: "NIN" },
    { key: "int", label: "INT" },
    { key: "fei", label: "FEI" },
    { key: "for", label: "FOR" },
    { key: "spr", label: "SPR" },
    { key: "dpr", label: "DPR" },
    { key: "brf", label: "BRF" },
    { key: "brakeBalance", label: "Brake Balance suggestion" },
    { key: "notes", label: "Notes" },
  ],
  moza: [
    { key: "steeringAngle", label: "Steering Angle" },
    { key: "roadSensitivity", label: "Road Sensitivity" },
    { key: "gameFfbIntensity", label: "Game Force Feedback Intensity" },
    { key: "maximumWheelSpeed", label: "Maximum Wheel Speed" },
    { key: "wheelSpringStrength", label: "Wheel Spring Strength" },
    { key: "wheelDamper", label: "Wheel Damper" },
    { key: "naturalInertia", label: "Natural Inertia" },
    { key: "mechanicalFriction", label: "Mechanical Friction" },
    { key: "brakeBalance", label: "Brake Balance suggestion" },
    { key: "notes", label: "Notes" },
  ],
  other: [
    { key: "brakeBalance", label: "Brake Balance suggestion" },
    { key: "notes", label: "Notes" },
  ],
};

/**
 * @param {string} wheelBaseId
 */
export function getWheelBaseOption(wheelBaseId) {
  return WHEEL_BASE_OPTIONS.find((option) => option.id === wheelBaseId) ?? null;
}

/**
 * @param {string} wheelBaseId
 * @returns {WheelTemplateFamily}
 */
export function getTemplateFamilyForWheelBase(wheelBaseId) {
  return getWheelBaseOption(wheelBaseId)?.templateFamily ?? "other";
}

/**
 * @param {string} wheelBaseId
 */
export function getTemplateFieldsForWheelBase(wheelBaseId) {
  const family = getTemplateFamilyForWheelBase(wheelBaseId);
  return WHEEL_TEMPLATE_FIELDS[family] ?? WHEEL_TEMPLATE_FIELDS.other;
}
