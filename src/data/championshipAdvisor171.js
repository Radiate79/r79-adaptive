import { ACTIVE_GT7_GAME_VERSION, ACTIVE_PHYSICS_GENERATION } from "./gt7PhysicsVersion.js";

/** @typedef {'power' | 'technical' | 'highSpeedCorner' | 'tractionHeavy' | 'tyreSensitive' | 'balanced'} TrackRacingProfile */

export const CHAMPIONSHIP_ADVISOR_VERSION = {
  GT7_VERSION: ACTIVE_GT7_GAME_VERSION,
  BOP_VERSION: "1.71",
  PHYSICS_GENERATION: ACTIVE_PHYSICS_GENERATION,
  UPDATED: "2026-08-20",
};

const SCORE_FIELDS = [
  "topSpeed",
  "traction",
  "fuel",
  "tyres",
  "stability",
  "rotation",
];

/**
 * GT7 1.71 Gr.3 BoP attribute deltas applied on top of base car records.
 * Cars without an entry keep their base R79 attributes.
 *
 * @type {Record<string, Partial<Record<(typeof SCORE_FIELDS)[number], number>>>}
 */
export const GR3_171_ATTRIBUTE_DELTAS = {
  ferrari_296_gt3_23: {
    traction: 0.5,
    rotation: 0.5,
    tyres: -0.5,
    stability: 0.5,
  },
  porsche_911_gt3_r_22: {
    topSpeed: -0.5,
    traction: 0.5,
    stability: 0.5,
    rotation: 0.5,
  },
  genesis_x_gr3: {
    topSpeed: 0.5,
    traction: -0.5,
    fuel: 0.5,
    tyres: -0.5,
  },
  mercedes_amg_gt3_20: {
    stability: 0.5,
    traction: 0.5,
    tyres: 0.5,
    rotation: -0.5,
  },
  nissan_gtr_gt3_18: {
    topSpeed: 0.5,
    traction: -0.5,
    rotation: -0.5,
    stability: 0.5,
  },
  bmw_m6_gt3_sprint_model: {
    traction: 0.5,
    stability: 0.5,
    tyres: 0.5,
  },
  aston_martin_v12_vantage_gt3_12: {
    tyres: 0.5,
    stability: 0.5,
    traction: 0.5,
    topSpeed: -0.5,
  },
  lexus_rc_f_gt3: {
    stability: 0.5,
    tyres: 0.5,
    traction: 0.5,
    topSpeed: -0.5,
  },
  jaguar_f_type_gt3: {
    rotation: 0.5,
    traction: 0.5,
    tyres: -0.5,
  },
  audi_r8_lms_evo: {
    traction: 0.5,
    stability: 0.5,
    rotation: 0.5,
  },
  corvette_c7_gr3: {
    topSpeed: 0.5,
    stability: 0.5,
    traction: -0.5,
  },
  mclaren_650s_gt3: {
    rotation: 0.5,
    traction: 0.5,
    tyres: -0.5,
  },
  lamborghini_huracan_gt3_evo_20: {
    topSpeed: 0.5,
    traction: -0.5,
    rotation: -0.5,
    stability: 0.5,
  },
  peugeot_vision_gran_turismo_gr3: {
    topSpeed: -1,
    traction: -1,
    tyres: -1.5,
    stability: -0.5,
    rotation: -0.5,
  },
  gt_by_citroen_race_car_gr3: {
    traction: -0.5,
    tyres: -0.5,
    topSpeed: -0.5,
  },
  supra_racing_concept: {
    traction: 0.5,
    stability: 0.5,
    tyres: -0.5,
  },
  toyota_ft1_vision_gran_turismo_gr3: {
    topSpeed: -0.5,
    traction: -1,
    tyres: -1,
  },
  volkswagen_gti_vision_gran_turismo_gr3: {
    topSpeed: -1,
    traction: -0.5,
    tyres: -0.5,
  },
};

/**
 * @param {number} value
 * @returns {number}
 */
function clampScore(value) {
  return Math.min(10, Math.max(1, Number(value.toFixed(2))));
}

/**
 * Resolve championship scoring attributes for the active GT7 1.71 advisor model.
 * When bopOn is false, return base car attributes without BoP deltas.
 *
 * @param {{ id?: string, class?: string, topSpeed?: number, traction?: number, fuel?: number, tyres?: number, stability?: number, rotation?: number, drivetrain?: string, [key: string]: unknown }} car
 * @param {{ bopOn?: boolean }} [options]
 */
export function resolveChampionshipCarAttributes(car, options = {}) {
  if (!car || car.class !== "Gr.3") {
    return car;
  }

  if (options.bopOn === false) {
    return car;
  }

  const deltas = GR3_171_ATTRIBUTE_DELTAS[car.id];
  if (!deltas) {
    return car;
  }

  const resolved = { ...car };

  SCORE_FIELDS.forEach((field) => {
    if (deltas[field] == null) {
      return;
    }

    resolved[field] = clampScore(Number(car[field] ?? 0) + deltas[field]);
  });

  return resolved;
}

/**
 * @param {{ drivingStyle?: string, topSpeed?: number, traction?: number, tyres?: number, stability?: number }} track
 * @returns {TrackRacingProfile}
 */
export function getTrackRacingProfile(track) {
  const topSpeed = Number(track?.topSpeed ?? 5);
  const traction = Number(track?.traction ?? 5);
  const tyres = Number(track?.tyres ?? 5);
  const stability = Number(track?.stability ?? 5);
  const style = track?.drivingStyle ?? "balanced";

  if (style === "high_speed" || topSpeed >= 9) {
    return "power";
  }

  if (tyres >= 8) {
    return "tyreSensitive";
  }

  if (style === "technical" || (traction >= 8.5 && topSpeed <= 7.5)) {
    return "technical";
  }

  if (topSpeed >= 8.5 && traction <= 7) {
    return "power";
  }

  if (topSpeed >= 7.5 && stability >= 7.5 && traction >= 7) {
    return "highSpeedCorner";
  }

  if (traction >= 8) {
    return "tractionHeavy";
  }

  return "balanced";
}

/**
 * @param {TrackRacingProfile} profile
 * @returns {Partial<Record<(typeof SCORE_FIELDS)[number], number>>}
 */
export function getTrackProfileDemandBoosts(profile) {
  switch (profile) {
    case "power":
      return { topSpeed: 1.35, traction: 0.88, stability: 1.05 };
    case "technical":
      return { traction: 1.35, rotation: 1.25, topSpeed: 0.85 };
    case "highSpeedCorner":
      return { stability: 1.25, topSpeed: 1.15, traction: 1.1 };
    case "tractionHeavy":
      return { traction: 1.3, rotation: 1.15, stability: 1.05 };
    case "tyreSensitive":
      return { tyres: 1.4, traction: 1.1, stability: 1.05 };
    default:
      return { topSpeed: 1.05, traction: 1.05, stability: 1.05 };
  }
}
