/**
 * Explanation text for non-T598 wheel template fields.
 * @type {Record<string, { description: string, getReason: (value: string, label?: string, carClass?: string) => string }>}
 */
export const WHEEL_FIELD_HELP = {
  forceFeedbackMaxTorque: {
    description: "Sets the peak force feedback torque on the G923 motor.",
    getReason: (value) =>
      `Torque level ${value} balances steering detail with manageable resistance through long stints.`,
  },
  forceFeedbackSensitivity: {
    description: "Controls how strongly surface detail is transmitted to the wheel.",
    getReason: (value) =>
      `Sensitivity ${value} keeps kerb and load feedback readable without spikes that disturb your inputs.`,
  },
  controllerSteeringSensitivity: {
    description: "Adjusts how quickly the wheel responds to steering input.",
    getReason: (value) =>
      `Steering sensitivity ${value} matches the validated response for stable turn-in on this circuit.`,
  },
  vibrationStrength: {
    description: "Sets vibration strength for collisions, kerbs and off-track cues.",
    getReason: (value) =>
      `Vibration strength ${value} gives useful warnings without distracting mid-corner corrections.`,
  },
  trueforceAudio: {
    description: "Controls Trueforce audio intensity on the G Pro wheel.",
    getReason: (value) =>
      `Trueforce audio at ${value} adds engine and surface cues without masking core force feedback.`,
  },
  trueforceStrength: {
    description: "Sets the strength of Trueforce audio effects.",
    getReason: (value) =>
      `Trueforce strength ${value} supports situational awareness while keeping focus on wheel load.`,
  },
  ffbStrength: {
    description: "Sets overall force feedback strength on the G Pro wheel.",
    getReason: (value) =>
      `FFB strength ${value} preserves detail and control for this car and track combination.`,
  },
  filter: {
    description: "Smooths high-frequency force feedback spikes.",
    getReason: (value) =>
      `Filter ${value} reduces harsh spikes while keeping weight transfer readable.`,
  },
  dampener: {
    description: "Adds mechanical damping to on-centre steering feel.",
    getReason: (value) =>
      `Dampener ${value} steadies the wheel between inputs for more consistent lap times.`,
  },
  angle: {
    description: "Sets the usable steering angle range.",
    getReason: (value) =>
      `A ${value}° angle matches GT7 lock and keeps full rotation available when required.`,
  },
  brakeForce: {
    description: "Sets the load-cell brake pedal force curve.",
    getReason: (value) =>
      `Brake force ${value} gives predictable pedal travel for repeatable threshold braking.`,
  },
  sen: {
    description: "Fanatec steering sensitivity — degrees of rotation.",
    getReason: (value) =>
      `SEN ${value} matches the tested rotation range for this car on this circuit.`,
  },
  ff: {
    description: "Fanatec force feedback strength.",
    getReason: (value) =>
      `FF ${value} keeps feedback strong enough for detail without overpowering the DD motor.`,
  },
  ffs: {
    description: "Fanatec force feedback scaling.",
    getReason: (value) =>
      `FFS ${value} preserves dynamic range across low- and high-load corners.`,
  },
  ndp: {
    description: "Natural damper — on-wheel mechanical damping.",
    getReason: (value) =>
      `NDP ${value} calms on-centre movement and supports stable inputs through long corners.`,
  },
  nfr: {
    description: "Natural friction — mechanical resistance at low steering speeds.",
    getReason: (value) =>
      `NFR ${value} reduces dead-zone wander without dulling quick corrections.`,
  },
  nin: {
    description: "Natural inertia — virtual wheel mass.",
    getReason: (value) =>
      `NIN ${value} adds planted feel under load without making turn-in sluggish.`,
  },
  int: {
    description: "Fanatec interpolation smoothing.",
    getReason: (value) =>
      `INT ${value} smooths force feedback steps for a cleaner feel at the limit.`,
  },
  fei: {
    description: "Fanatec effects intensity.",
    getReason: (value) =>
      `FEI ${value} keeps shift and surface cues present without distracting from tyre feel.`,
  },
  for: {
    description: "Fanatec force feedback output range.",
    getReason: (value) =>
      `FOR ${value} uses the tested output range for this direct-drive base.`,
  },
  spr: {
    description: "Fanatec spring effect returning the wheel to centre.",
    getReason: (value) =>
      `SPR ${value} avoids artificial self-centring that fights GT7's native feedback.`,
  },
  dpr: {
    description: "Fanatec damper effect on wheel movement.",
    getReason: (value) =>
      `DPR ${value} supports stable steering inputs through high-load sections.`,
  },
  brf: {
    description: "Fanatec brake force on the load-cell pedal.",
    getReason: (value) =>
      `BRF ${value} gives consistent pedal pressure for repeatable braking markers.`,
  },
  steeringAngle: {
    description: "Maximum steering angle on Moza bases.",
    getReason: (value) =>
      `Steering angle ${value} matches GT7 lock while keeping enough rotation for hairpins.`,
  },
  roadSensitivity: {
    description: "How strongly road surface detail is felt through the wheel.",
    getReason: (value) =>
      `Road sensitivity ${value} keeps surface cues readable without constant noise.`,
  },
  gameFfbIntensity: {
    description: "In-game force feedback intensity scaling.",
    getReason: (value) =>
      `Game FFB intensity ${value} is the validated balance for this wheel and car.`,
  },
  maximumWheelSpeed: {
    description: "Limits how fast the wheel can rotate under force feedback.",
    getReason: (value) =>
      `Maximum wheel speed ${value} lets the base keep up with fast corrections and slides.`,
  },
  wheelSpringStrength: {
    description: "Pulls the wheel back toward centre when released.",
    getReason: (value) =>
      `Spring strength ${value} avoids fighting GT7's natural self-aligning torque.`,
  },
  wheelDamper: {
    description: "Mechanical damping applied by the wheel base.",
    getReason: (value) =>
      `Wheel damper ${value} adds stability without making the wheel feel sluggish.`,
  },
  naturalInertia: {
    description: "Virtual wheel mass on Moza bases.",
    getReason: (value) =>
      `Natural inertia ${value} keeps the car feeling planted through sustained load.`,
  },
  mechanicalFriction: {
    description: "Resistance when turning the wheel slowly.",
    getReason: (value) =>
      `Mechanical friction ${value} steadies on-centre feel for consistent inputs.`,
  },
  brakeBalance: {
    description: "Suggested in-game brake bias for this car and class.",
    getReason: (_, __, carClass) =>
      carClass === "Gr.1"
        ? "Slightly forward bias suits prototype downforce and long braking zones."
        : "Validated bias balances entry rotation with rear stability under trail braking.",
  },
  notes: {
    description: "Track-specific guidance from validated testing.",
    getReason: (value) =>
      value && value !== "—"
        ? String(value)
        : "Refine after a few laps if kerb feedback or tyre wear feels off.",
  },
};

/**
 * @param {string} fieldKey
 * @param {string} label
 * @param {string | number} value
 * @param {string} [carClass]
 */
export function getWheelFieldMeta(fieldKey, label, value, carClass) {
  const displayValue = value == null || value === "" ? "—" : String(value);
  const help = WHEEL_FIELD_HELP[fieldKey];

  if (!help) {
    return {
      label,
      value: displayValue,
      description: "",
      reason:
        displayValue !== "—"
          ? `${label} at ${displayValue} is the tested setting for this wheel base and car combination.`
          : "",
    };
  }

  return {
    label: help.description ? label : label,
    value: displayValue,
    description: help.description,
    reason:
      displayValue !== "—"
        ? help.getReason(displayValue, label, carClass)
        : "",
  };
}

/**
 * @param {string} reason
 * @param {string} label
 * @param {string | number} value
 */
export function isInvalidWheelReason(reason, label, value) {
  const text = String(reason ?? "").trim();
  const displayValue = String(value ?? "").trim();

  if (!text) {
    return true;
  }

  if (/^recommended value:/i.test(text)) {
    return true;
  }

  if (displayValue && text === displayValue) {
    return true;
  }

  if (displayValue && text === `Recommended value: ${displayValue}`) {
    return true;
  }

  return false;
}
