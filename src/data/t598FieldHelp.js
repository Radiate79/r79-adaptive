/** Current intelligence update stamp for validated T598 profiles. */
export const INTELLIGENCE_UPDATE_DATE = "2026-06-07";

/**
 * @typedef {Object} T598FieldHelp
 * @property {string} label
 * @property {string} description
 * @property {(value: string, carClass?: string) => string} getReason
 */

/** @type {Record<string, T598FieldHelp>} */
export const T598_FIELD_HELP = {
  ffb: {
    label: "FFB",
    description: "Controls overall force feedback strength from the game to the wheel.",
    getReason: (value) =>
      value === "3"
        ? "Level 3 gives clear detail without overpowering the T598 motor on long stints."
        : `${value} is the tested balance for consistent feedback through kerbs and curbs.`,
  },
  master: {
    label: "MASTER",
    description: "Sets the maximum output ceiling for the wheel base.",
    getReason: () =>
      "100% preserves full dynamic range while leaving in-game FFB to shape feel.",
  },
  mode: {
    label: "MODE",
    description: "Selects the T598 force feedback profile (Balance, Sport, Pro, Expert).",
    getReason: (value) =>
      value === "E"
        ? "Expert mode exposes the full tuning stack used in validated ALR testing."
        : `${value} mode matches the validated profile for this car class.`,
  },
  inertia: {
    label: "INERTIA",
    description: "Adds virtual wheel mass — higher values feel heavier and more planted.",
    getReason: (value, carClass) => {
      if (carClass === "Gr.1" && value === "High") {
        return "High inertia stabilises prototype downforce loads at top speed.";
      }
      if (value === "Mid") {
        return "Mid inertia keeps rotation lively without nervous centre feel.";
      }
      return `${value} inertia is the validated compromise for ${carClass ?? "this"} cars.`;
    },
  },
  friction: {
    label: "FRICTION",
    description: "Adds mechanical resistance when the wheel is turning slowly.",
    getReason: (value) =>
      value === "Mid"
        ? "Mid friction reduces dead-zone wander without dulling quick corrections."
        : `${value} friction supports the validated on-centre feel for this setup.`,
  },
  boostLow: {
    label: "BOOST LOW",
    description: "Shapes low-speed force feedback boost around the centre.",
    getReason: () =>
      "0 keeps low-speed response neutral — no artificial snap on turn-in.",
  },
  boostHigh: {
    label: "BOOST HIGH",
    description: "Shapes high-speed force feedback boost under load.",
    getReason: () =>
      "0 avoids extra spike at speed; downforce and kerbs stay readable.",
  },
  speed: {
    label: "SPEED",
    description: "Limits how fast the wheel can rotate under force feedback.",
    getReason: (value) =>
      value === "High"
        ? "High speed lets the base keep up with fast GT catches and slides."
        : `${value} speed matches validated rotation limits for this car class.`,
  },
  damper: {
    label: "Wheel Damper",
    description:
      "Controls how much resistance the wheel applies while steering.",
    getReason: (value) => {
      if (value === "20%") {
        return "Provides good stability while keeping the car responsive.";
      }
      if (value === "25%") {
        return "Slightly softer damper aids traction on shorter, twistier circuits.";
      }
      if (value === "30%" || value === "35%") {
        return "Higher damper adds stability for heavy braking zones and long corners.";
      }
      return `${value} is the validated damper for this profile after track testing.`;
    },
  },
  damperGain: {
    label: "Game Damper Gain",
    description: "Scales in-game damper effects sent to the wheel.",
    getReason: (value) =>
      value === "High"
        ? "High gain keeps weight transfer readable through the wheel rim."
        : `${value} damper gain matches the validated in-game feel.`,
  },
  spring: {
    label: "SPRING",
    description: "Pulls the wheel toward centre when you release it.",
    getReason: () =>
      "0% spring avoids artificial self-centring that fights GT7's native FFB.",
  },
  gearJolt: {
    label: "GEAR JOLT",
    description: "Adds vibration cues on gear changes.",
    getReason: (value) =>
      value === "Medium"
        ? "Medium jolt gives a shift reference without distracting mid-corner."
        : `${value} gear jolt is the validated haptic level for race stints.`,
  },
  endStop: {
    label: "END STOP",
    description: "Sets resistance felt at the steering lock stops.",
    getReason: (value) =>
      value === "Mid"
        ? "Mid end stop protects wrists on full-lock hairpins without harsh clunks."
        : `${value} end stop is the tested lock-stop feel for this profile.`,
  },
  brakeBalance: {
    label: "Brake Balance",
    description: "Suggested in-game brake bias for this car and class.",
    getReason: (_, carClass) =>
      carClass === "Gr.1"
        ? "Slightly forward bias suits prototype downforce and long braking zones."
        : "Validated bias balances entry rotation with rear stability under trail braking.",
  },
  notes: {
    label: "Notes",
    description: "Track-specific guidance from validated testing.",
    getReason: (value) =>
      value && value !== "—"
        ? String(value)
        : "Refine after a few laps if kerb feedback or tyre wear feels off.",
  },
};

/**
 * @param {string} fieldKey
 * @param {string | number} value
 * @param {string} [carClass]
 */
export function getT598FieldMeta(fieldKey, value, carClass) {
  const help = T598_FIELD_HELP[fieldKey];
  const displayValue = value == null || value === "" ? "—" : String(value);

  if (!help) {
    return {
      key: fieldKey,
      label: fieldKey,
      value: displayValue,
      description: "",
      reason: displayValue !== "—" ? `Recommended value: ${displayValue}` : "",
    };
  }

  return {
    key: fieldKey,
    label: help.label,
    value: displayValue,
    description: help.description,
    reason: help.getReason(displayValue, carClass),
  };
}
