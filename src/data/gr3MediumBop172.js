/**
 * GT7 1.72 Medium-speed Gr.3 BoP overlay.
 * High-speed and Low-speed tables are not replaced.
 * The 1.71 measurable file remains the stored baseline.
 */

import { DATA_VERIFICATION_STATUS } from "./dataVerificationStatus.js";
import {
  GR3_MEASURABLE_171,
  getGr3Measurable,
} from "./gr3Measurable171.js";

export const GR3_DATA_VERSION = "GT7-1.72";
export const GR3_PICKER_ENGINE_VERSION = "3.1.0";
export const GT7_DATA_VERSION = "1.72";

export const MAZDA_RX_VISION_GT3_EVO_26_ID = "mazda_rx_vision_gt3_evo_26";

/**
 * Absolute Medium-speed values supplied as current 1.72 information.
 * Status is CURRENT_1_72_OBSERVED — not an independent confirmed scrape.
 * @type {Record<string, { powerPs: number, weightKg: number, reportedChange: string }>}
 */
export const GR3_MEDIUM_BOP_172 = {
  audi_r8_lms_evo: {
    powerPs: 445,
    weightKg: 1310,
    reportedChange: "unchanged",
  },
  porsche_911_gt3_r_22: {
    powerPs: 458,
    weightKg: 1339,
    reportedChange: "+4 kg",
  },
  mclaren_650s_gt3: {
    powerPs: 489,
    weightKg: 1290,
    reportedChange: "+4 PS / -15 kg",
  },
  subaru_brz_gt300_21: {
    powerPs: 446,
    weightKg: 1315,
    reportedChange: "+5 PS / +4 kg",
  },
  supra_racing_concept: {
    powerPs: 474,
    weightKg: 1243,
    reportedChange: "+6 PS",
  },
  nissan_gtr_gt3_18: {
    powerPs: 498,
    weightKg: 1350,
    reportedChange: "-5 kg",
  },
  ferrari_296_gt3_23: {
    powerPs: 456,
    weightKg: 1360,
    reportedChange: "+25 kg",
  },
  lamborghini_huracan_gt3_15: {
    powerPs: 456,
    weightKg: 1335,
    reportedChange: "unchanged",
  },
  jaguar_f_type_gt3: {
    powerPs: 471,
    weightKg: 1260,
    reportedChange: "-5 PS",
  },
  bmw_m6_gt3_endurance_model_16: {
    powerPs: 474,
    weightKg: 1350,
    reportedChange: "+10 kg",
  },
  bmw_m6_gt3_sprint_model: {
    powerPs: 474,
    weightKg: 1350,
    reportedChange: "+10 kg",
  },
  lexus_rcf_gt3: {
    powerPs: 456,
    weightKg: 1305,
    reportedChange: "-5 PS / -5 kg",
  },
  mercedes_amg_gt3_20: {
    powerPs: 467,
    weightKg: 1340,
    reportedChange: "unchanged",
  },
  mazda_rx_vision_gt3_concept: {
    powerPs: 439,
    weightKg: 1260,
    reportedChange: "-5 kg",
  },
  [MAZDA_RX_VISION_GT3_EVO_26_ID]: {
    powerPs: 439,
    weightKg: 1260,
    reportedChange: "observed medium-speed figure shared with listed RX-VISION GT3",
  },
};

const AWAITING = DATA_VERIFICATION_STATUS.AWAITING_1_72_VERIFICATION;
const OBSERVED = DATA_VERIFICATION_STATUS.CURRENT_1_72_OBSERVED;
const UNKNOWN = DATA_VERIFICATION_STATUS.UNKNOWN;

function round1(value) {
  return Number(value.toFixed(1));
}

function round2(value) {
  return Number(value.toFixed(2));
}

function carriedField(value) {
  if (!Number.isFinite(value)) {
    return { value: null, sourceVersion: null, status: UNKNOWN };
  }
  return { value, sourceVersion: "1.71", status: AWAITING };
}

/**
 * @param {Record<string, number | string | null>} baseline
 * @param {'high'|'mid'|'low'} bopCategory
 */
function annotateUnreplaced(baseline, bopCategory) {
  return {
    ...baseline,
    provenance: {
      bopCategory,
      sourceVersion: "1.71",
      status: AWAITING,
      power: carriedField(baseline.powerPs),
      weight: carriedField(baseline.weightKg),
      powerToWeight: carriedField(baseline.powerToWeightPsPerT),
      acceleration: {
        sourceVersion: "1.71",
        status: AWAITING,
        derivation: null,
      },
      handling: {
        sourceVersion: "1.71",
        status: AWAITING,
        note: "Rotation and stability measurements were not rewritten for 1.72.",
      },
    },
  };
}

/**
 * Scale last-measured accel times by the power-to-weight ratio.
 * This is a derived input, not a new timed measurement, and it is not a ranking bonus.
 * @param {number | null} baselineValue
 * @param {number} baselineP2w
 * @param {number} nextP2w
 */
function deriveAccel(baselineValue, baselineP2w, nextP2w) {
  if (!Number.isFinite(baselineValue)) {
    return { value: null, sourceVersion: null, status: UNKNOWN, derivation: null };
  }
  if (
    !Number.isFinite(baselineP2w) ||
    !Number.isFinite(nextP2w) ||
    nextP2w === 0 ||
    Math.abs(baselineP2w - nextP2w) < 0.05
  ) {
    return {
      value: baselineValue,
      sourceVersion: "1.71",
      status: AWAITING,
      derivation: null,
    };
  }
  return {
    value: round2(baselineValue * (baselineP2w / nextP2w)),
    sourceVersion: "1.72",
    status: OBSERVED,
    derivation: "scaled_from_1_71_accel_by_power_to_weight_ratio",
  };
}

/**
 * @param {Record<string, number | string | null> | null} baseline
 * @param {{ powerPs: number, weightKg: number, reportedChange: string }} overlay
 * @param {string} carId
 */
function applyMediumOverlay(baseline, overlay, carId) {
  const powerPs = overlay.powerPs;
  const weightKg = overlay.weightKg;
  const powerToWeightPsPerT = round1(powerPs / (weightKg / 1000));
  const baselineP2w = Number(baseline?.powerToWeightPsPerT);
  const accel400 = deriveAccel(baseline?.accel400, baselineP2w, powerToWeightPsPerT);
  const accel1000 = deriveAccel(baseline?.accel1000, baselineP2w, powerToWeightPsPerT);
  const accel100_150 = deriveAccel(
    baseline?.accel100_150,
    baselineP2w,
    powerToWeightPsPerT,
  );

  return {
    pp: baseline?.pp ?? null,
    powerPs,
    torqueKgfm: baseline?.torqueKgfm ?? null,
    weightKg,
    powerToWeightPsPerT,
    weightBalanceFront: baseline?.weightBalanceFront ?? null,
    accel400: accel400.value,
    accel1000: accel1000.value,
    accel100_150: accel100_150.value,
    stabilityLow: baseline?.stabilityLow ?? null,
    stabilityLowClass: baseline?.stabilityLowClass ?? null,
    stabilityHigh: baseline?.stabilityHigh ?? null,
    stabilityHighClass: baseline?.stabilityHighClass ?? null,
    rotation60: baseline?.rotation60 ?? null,
    rotation120: baseline?.rotation120 ?? null,
    rotation240: baseline?.rotation240 ?? null,
    provenance: {
      bopCategory: "mid",
      carId,
      sourceVersion: "1.72",
      status: OBSERVED,
      reportedChange: overlay.reportedChange,
      baselineSourceVersion: baseline ? "1.71" : null,
      power: { value: powerPs, sourceVersion: "1.72", status: OBSERVED },
      weight: { value: weightKg, sourceVersion: "1.72", status: OBSERVED },
      powerToWeight: {
        value: powerToWeightPsPerT,
        sourceVersion: "1.72",
        status: OBSERVED,
        derivation: "power_ps_per_tonne_from_current_power_and_weight",
      },
      acceleration: {
        accel400,
        accel1000,
        accel100_150,
      },
      handling: baseline
        ? {
            sourceVersion: "1.71",
            status: AWAITING,
            note: "Rotation and stability kept from the 1.71 measurement. Weight change did not invent new handling.",
          }
        : {
            sourceVersion: null,
            status: UNKNOWN,
            note: "No handling measurement. Values were not copied from another car.",
          },
      unchangedFields: {
        pp: carriedField(baseline?.pp),
        torqueKgfm: carriedField(baseline?.torqueKgfm),
        weightBalanceFront: carriedField(baseline?.weightBalanceFront),
      },
    },
  };
}

/**
 * Active measurable row for scoring. 1.72 medium power/weight overrides 1.71.
 * High and low stay on the 1.71 table.
 *
 * @param {string} carId
 * @param {'high'|'mid'|'low'} [bopCategory='high']
 */
export function resolveGr3Measurable(carId, bopCategory = "high") {
  const baseline = getGr3Measurable(carId, bopCategory);
  if (bopCategory !== "mid") {
    return baseline ? annotateUnreplaced(baseline, bopCategory) : null;
  }

  const overlay = GR3_MEDIUM_BOP_172[carId];
  if (overlay) {
    return applyMediumOverlay(baseline, overlay, carId);
  }
  return baseline ? annotateUnreplaced(baseline, "mid") : null;
}

/**
 * @param {'high'|'mid'|'low'} [bopCategory='high']
 */
export function listResolvedGr3BopEntries(bopCategory = "high") {
  const ids = new Set(Object.keys(GR3_MEASURABLE_171.bop?.[bopCategory] ?? {}));
  if (bopCategory === "mid") {
    ids.add(MAZDA_RX_VISION_GT3_EVO_26_ID);
  }
  return [...ids]
    .map((carId) => resolveGr3Measurable(carId, bopCategory))
    .filter(Boolean);
}

/**
 * Development diagnostic. Not a visible production panel.
 * @param {string} carId
 * @param {'high'|'mid'|'low'} [bopCategory='mid']
 */
export function describeGr3BopDiagnostics(carId, bopCategory = "mid") {
  const row = resolveGr3Measurable(carId, bopCategory);
  return {
    gt7Version: GT7_DATA_VERSION,
    gr3DataVersion: GR3_DATA_VERSION,
    gr3PickerEngineVersion: GR3_PICKER_ENGINE_VERSION,
    carId,
    bopCategory,
    bopSourceVersion: row?.provenance?.sourceVersion ?? null,
    verificationStatus: row?.provenance?.status ?? DATA_VERIFICATION_STATUS.UNKNOWN,
    powerPs: row?.powerPs ?? null,
    weightKg: row?.weightKg ?? null,
    powerToWeightPsPerT: row?.powerToWeightPsPerT ?? null,
    handlingValidationVersion:
      row?.provenance?.handling?.sourceVersion ?? LAST_HANDLING_PLACEHOLDER(),
    handlingStatus: row?.provenance?.handling?.status ?? DATA_VERIFICATION_STATUS.UNKNOWN,
    confidenceBand: row?.provenance?.status ?? DATA_VERIFICATION_STATUS.UNKNOWN,
  };
}

function LAST_HANDLING_PLACEHOLDER() {
  return "1.71";
}
