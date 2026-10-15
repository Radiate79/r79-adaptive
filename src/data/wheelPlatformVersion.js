import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
} from "./gt7PhysicsVersion.js";

/**
 * Wheel platform version awareness — separate from GT7 physics generation.
 *
 * A recommendation can eventually be validated against BOTH:
 * - GT7 physics generation
 * - wheel firmware / manufacturer software generation
 *
 * Do NOT assume every firmware/software update changes FFB behaviour.
 */

/** @typedef {'CURRENT' | 'VALIDATED' | 'TESTING' | 'HISTORICAL' | 'UNVALIDATED' | 'UNKNOWN'} WheelValidationStatus */
/** @typedef {'CURRENT' | 'HISTORICAL' | 'UNKNOWN' | 'UNVERIFIED'} FirmwareStatus */

export const UNKNOWN_FIRMWARE_VERSION = "UNKNOWN";
export const UNVERIFIED_FIRMWARE_VERSION = "UNVERIFIED";

/**
 * @typedef {Object} WheelPlatformProfile
 * @property {string} wheelBaseId
 * @property {string} manufacturer
 * @property {string} model
 * @property {string} shortLabel
 * @property {string} templateFamily
 * @property {boolean} [directDrive]
 * @property {boolean} [trueforceCapable]
 * @property {boolean} [fullForceCapable]
 * @property {string} firmwareVersion
 * @property {FirmwareStatus} firmwareStatus
 * @property {string | null} [softwarePlatform]
 * @property {string | null} [softwareVersion]
 * @property {WheelValidationStatus} validationStatus
 * @property {string} physicsGenerationTarget
 * @property {boolean} requiresRevalidationUnderCurrentPhysics
 * @property {string} [notes]
 */

/**
 * Structured metadata for R79's supported wheel ecosystem.
 * Firmware/software versions use UNKNOWN/UNVERIFIED when not verified —
 * never invent version numbers.
 *
 * @type {Record<string, WheelPlatformProfile>}
 */
export const WHEEL_PLATFORM_PROFILES = {
  thrustmaster_t598: {
    wheelBaseId: "thrustmaster_t598",
    manufacturer: "Thrustmaster",
    model: "T598 PlayStation",
    shortLabel: "T598",
    templateFamily: "t598",
    directDrive: true,
    firmwareVersion: "3.08",
    firmwareStatus: "CURRENT",
    softwarePlatform: null,
    softwareVersion: null,
    validationStatus: "TESTING",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    gt7FfbGameVersion: "1.72",
    ffbValidationStatus: "AWAITING_1_72_VERIFICATION",
    lastValidatedFfbGameVersion: "1.71",
    setupGeneration: "available",
    notes:
      "Firmware 3.08 is current. GT7 1.72 changed game-side T598 force feedback. Existing setting values remain 1.71 calibration evidence and are not auto-changed. They are not fully 1.72-validated.",
  },
  logitech_rs50: {
    wheelBaseId: "logitech_rs50",
    manufacturer: "Logitech",
    model: "RS50",
    shortLabel: "RS50",
    templateFamily: "logitech_rs50",
    directDrive: true,
    trueforceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "G HUB",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    gt7FfbGameVersion: "1.72",
    ffbValidationStatus: "AWAITING_1_72_VERIFICATION",
    lastValidatedFfbGameVersion: null,
    setupGeneration: "available",
    notes:
      "Independent RS50 profile. GT7 1.72 changed game-side RS50 force feedback. No T598 adjustments are copied here. Existing RS50 values, where present, are not fully 1.72-validated.",
  },
  logitech_g_pro: {
    wheelBaseId: "logitech_g_pro",
    manufacturer: "Logitech",
    model: "G PRO Racing Wheel",
    shortLabel: "G PRO",
    templateFamily: "logitech_g_pro",
    directDrive: true,
    trueforceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "G HUB",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    notes: "Independent G PRO profile. Firmware not verified in R79 metadata.",
  },
  logitech_g923: {
    wheelBaseId: "logitech_g923",
    manufacturer: "Logitech",
    model: "G923",
    shortLabel: "G923",
    templateFamily: "logitech_g923",
    directDrive: false,
    trueforceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "G HUB",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    notes: "Independent G923 profile. Firmware not verified in R79 metadata.",
  },
  fanatec_gt_dd_pro: {
    wheelBaseId: "fanatec_gt_dd_pro",
    manufacturer: "Fanatec",
    model: "Gran Turismo DD Pro",
    shortLabel: "GT DD Pro",
    templateFamily: "fanatec",
    directDrive: true,
    fullForceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Fanatec App",
    softwareVersion: "1.5.2.3",
    validationStatus: "TESTING",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    notes:
      "Fanatec App 1.5.2.3 generation includes FullForce support. Existing GT DD Pro tuning values are preserved and marked for validation — not auto-changed.",
  },
  fanatec_csl_dd: {
    wheelBaseId: "fanatec_csl_dd",
    manufacturer: "Fanatec",
    model: "CSL DD",
    shortLabel: "CSL DD",
    templateFamily: "fanatec",
    directDrive: true,
    fullForceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Fanatec App",
    softwareVersion: "1.5.2.3",
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
  fanatec_clubsport_dd: {
    wheelBaseId: "fanatec_clubsport_dd",
    manufacturer: "Fanatec",
    model: "ClubSport DD+",
    shortLabel: "CS DD+",
    templateFamily: "fanatec",
    directDrive: true,
    fullForceCapable: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Fanatec App",
    softwareVersion: "1.5.2.3",
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
  moza_r3: {
    wheelBaseId: "moza_r3",
    manufacturer: "Moza",
    model: "R3",
    shortLabel: "R3",
    templateFamily: "moza",
    directDrive: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Moza Pit House",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
  moza_r5: {
    wheelBaseId: "moza_r5",
    manufacturer: "Moza",
    model: "R5",
    shortLabel: "R5",
    templateFamily: "moza",
    directDrive: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Moza Pit House",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
  moza_r5s_pro: {
    wheelBaseId: "moza_r5s_pro",
    manufacturer: "Moza",
    model: "R5S Pro",
    shortLabel: "R5S Pro",
    templateFamily: "awaiting_calibration",
    directDrive: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Moza Pit House",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
    gt7FfbGameVersion: "1.72",
    ffbValidationStatus: "AWAITING_1_72_VERIFICATION",
    lastValidatedFfbGameVersion: null,
    setupGeneration: "awaiting_calibration",
    nativeSupportStatus: "CURRENT_1_72_OBSERVED",
    notes:
      "Recognised: GT7 1.72 adds native MOZA R5S Pro support. Control ranges and GT7 behaviour are not verified, so R79 does not generate recommended settings.",
  },
  moza_r9: {
    wheelBaseId: "moza_r9",
    manufacturer: "Moza",
    model: "R9",
    shortLabel: "R9",
    templateFamily: "moza",
    directDrive: true,
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: "Moza Pit House",
    softwareVersion: UNVERIFIED_FIRMWARE_VERSION,
    validationStatus: "UNVALIDATED",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
  other_custom: {
    wheelBaseId: "other_custom",
    manufacturer: "Other",
    model: "Custom",
    shortLabel: "Other",
    templateFamily: "other",
    firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: "UNKNOWN",
    softwarePlatform: null,
    softwareVersion: null,
    validationStatus: "UNKNOWN",
    physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
    requiresRevalidationUnderCurrentPhysics: true,
  },
};

/**
 * @param {string} wheelBaseId
 * @returns {WheelPlatformProfile}
 */
export function getWheelPlatformProfile(wheelBaseId) {
  return (
    WHEEL_PLATFORM_PROFILES[wheelBaseId] ?? {
      wheelBaseId: wheelBaseId || "unknown",
      manufacturer: "Unknown",
      model: wheelBaseId || "Unknown",
      shortLabel: wheelBaseId || "Unknown",
      templateFamily: "other",
      firmwareVersion: UNKNOWN_FIRMWARE_VERSION,
      firmwareStatus: "UNKNOWN",
      softwarePlatform: null,
      softwareVersion: null,
      validationStatus: "UNKNOWN",
      physicsGenerationTarget: ACTIVE_PHYSICS_GENERATION,
      requiresRevalidationUnderCurrentPhysics: true,
    }
  );
}

/**
 * Backwards-compatible defaults for recommendation records missing firmware meta.
 *
 * @param {string} wheelBaseId
 * @param {Partial<{
 *   firmwareVersion?: string,
 *   softwareVersion?: string,
 *   softwarePlatform?: string,
 *   validationStatus?: WheelValidationStatus,
 *   wheelValidationStatus?: WheelValidationStatus,
 * }>} [record]
 */
export function normalizeWheelPlatformMeta(wheelBaseId, record = {}) {
  const profile = getWheelPlatformProfile(wheelBaseId);

  return {
    manufacturer: profile.manufacturer,
    model: profile.model,
    shortLabel: profile.shortLabel,
    templateFamily: profile.templateFamily,
    firmwareVersion: record.firmwareVersion ?? profile.firmwareVersion ?? UNKNOWN_FIRMWARE_VERSION,
    firmwareStatus: profile.firmwareStatus ?? "UNKNOWN",
    softwarePlatform:
      record.softwarePlatform ?? profile.softwarePlatform ?? null,
    softwareVersion:
      record.softwareVersion ?? profile.softwareVersion ?? null,
    validationStatus:
      record.wheelValidationStatus ??
      record.validationStatus ??
      profile.validationStatus ??
      "UNVALIDATED",
    physicsGenerationTarget: profile.physicsGenerationTarget,
    gt7GameVersion: ACTIVE_GT7_GAME_VERSION,
    requiresRevalidationUnderCurrentPhysics:
      profile.requiresRevalidationUnderCurrentPhysics,
  };
}

/**
 * Compact optional status lines for the selected wheel base.
 * Not mandatory for users to understand firmware architecture.
 *
 * @param {string} wheelBaseId
 * @returns {{ title: string, lines: string[], summary: string }}
 */
export function formatWheelPlatformStatus(wheelBaseId) {
  const meta = normalizeWheelPlatformMeta(wheelBaseId);
  const validationLabel =
    meta.validationStatus.charAt(0) +
    meta.validationStatus.slice(1).toLowerCase();

  const lines = [meta.shortLabel];

  if (
    meta.firmwareVersion &&
    meta.firmwareVersion !== UNKNOWN_FIRMWARE_VERSION &&
    meta.firmwareVersion !== UNVERIFIED_FIRMWARE_VERSION
  ) {
    lines.push(`FW ${meta.firmwareVersion}`);
  } else if (
    meta.softwarePlatform &&
    meta.softwareVersion &&
    meta.softwareVersion !== UNKNOWN_FIRMWARE_VERSION &&
    meta.softwareVersion !== UNVERIFIED_FIRMWARE_VERSION
  ) {
    lines.push(`${meta.softwarePlatform} ${meta.softwareVersion}`);
  } else if (
    meta.firmwareStatus === "UNKNOWN" ||
    meta.firmwareStatus === "UNVERIFIED"
  ) {
    lines.push("Needs verification");
  }

  lines.push(`GT7 ${ACTIVE_GT7_GAME_VERSION}`);
  lines.push(validationLabel);

  return {
    title: meta.shortLabel,
    lines,
    summary: lines.join(" · "),
  };
}

/**
 * Dual validation: GT7 physics + wheel firmware/software generation.
 * Existing recommendations without metadata remain usable via defaults.
 *
 * @param {{
 *   physicsGeneration?: string,
 *   validatedAfterUpdate?: boolean,
 *   physicsValidationStatus?: string,
 *   wheelBaseId?: string,
 *   firmwareVersion?: string,
 *   wheelValidationStatus?: WheelValidationStatus,
 * }} [input]
 */
export function resolveDualValidationState(input = {}) {
  const platform = normalizeWheelPlatformMeta(input.wheelBaseId ?? "", input);
  const physicsValidated =
    input.validatedAfterUpdate === true &&
    input.physicsGeneration === ACTIVE_PHYSICS_GENERATION;
  const wheelValidated = platform.validationStatus === "VALIDATED";

  return {
    physicsGeneration: input.physicsGeneration ?? ACTIVE_PHYSICS_GENERATION,
    physicsValidated,
    wheelFirmwareVersion: platform.firmwareVersion,
    wheelSoftwareVersion: platform.softwareVersion,
    wheelValidated,
    dualValidated: physicsValidated && wheelValidated,
    overallStatus: wheelValidated && physicsValidated
      ? "VALIDATED"
      : platform.validationStatus,
  };
}
