/**
 * Parse GT ENG!NE Gr.3 BoP tables (GT7 1.71) into src/data/gr3Measurable171.js
 *
 * Usage: node scripts/parse-gr3-measurable-171.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cars } from "../src/data/gt7/cars.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE =
  process.env.GR3_MEASURABLE_SOURCE ??
  "C:/Users/Radia/.cursor/projects/c-Project-R79-ProjectR79-R79-V1/agent-tools/88ab9598-01b4-4f3a-a237-aad33da21d65.txt";
const OUTPUT_FILE = path.join(__dirname, "../src/data/gr3Measurable171.js");

/** @type {Record<string, string>} GT ENG!NE full car name → R79 id */
const EXPLICIT_SOURCE_TO_ID = {
  "4C Gr.3": "alfa_romeo_4c_gr3",
  "Mercedes-AMG GT3 '16": "mercedes_amg_gt3_16",
  "Mercedes-AMG GT3 '20": "mercedes_amg_gt3_20",
  "SLS AMG GT3 '11": "mercedes_benz_sls_amg_gt3_11",
  "DBR9 GT1 '10": "aston_martin_dbr9_gt1_10",
  "V12 Vantage GT3 '12": "aston_martin_v12_vantage_gt3_12",
  "R8 LMS '15": "audi_r8_lms_15",
  "R8 LMS Evo '19": "audi_r8_lms_evo",
  "M3 GT3 '11": "bmw_m3_gt_11",
  "M6 GT3 Endurance Model '16": "bmw_m6_gt3_endurance_model_16",
  "M6 GT3 Sprint Model '16": "bmw_m6_gt3_sprint_model",
  "Z4 GT3 '11": "bmw_z4_gt3_11",
  "Corvette C7 Gr.3": "corvette_c7_gr3",
  "GT by Citroën Race Car (Gr.3)": "gt_by_citroen_race_car_gr3",
  "Viper SRT GT3-R '15": "dodge_viper_gr3",
  "296 GT3 '23": "ferrari_296_gt3_23",
  "458 Italia GT3 '13": "ferrari_458_gt3",
  "GT LM Race Car Spec II": "ford_gt_lm_spec_ii",
  "GT LM Spec II Test Car": "ford_gt_lm_spec_ii_test_car",
  "GT Race Car '18": "ford_gt_race_car_18",
  "Mustang Gr.3": "ford_mustang_gr3",
  "Genesis X GR3": "genesis_x_gr3",
  "NSX Gr.3": "honda_nsx_gr3",
  "NSX GT500 '00": "honda_nsx_gt500_00",
  "Genesis Gr.3": "hyundai_genesis_gr3",
  "F-type Gr.3": "jaguar_f_type_gt3",
  "Huracán GT3 '15": "lamborghini_huracan_gt3_15",
  "RC F GT3 '17": "lexus_rcf_gt3",
  "RC F GT3 prototype '16": "lexus_rcf_gt3_prototype_16",
  "Atenza Gr.3": "mazda_atenza_gr3",
  "RX-Vision GT3 Concept": "mazda_rx_vision_gt3_concept",
  "RX-Vision GT3 Concept Stealth Model":
    "mazda_rx_vision_gt3_concept_stealth",
  "650S GT3 '15": "mclaren_650s_gt3",
  "McLaren F1 GTR - BMW '95": "mclaren_f1_gtr_bmw_95",
  "Lancer Evolution Final Edition Gr.3":
    "mitsubishi_lancer_evolution_final_edition_gr3",
  "GT-R GT500 '99": "nissan_gtr_gt500_99",
  "GT-R NISMO GT3 '13": "nissan_gtr_nismo_gt3_13",
  "GT-R NISMO GT3 '18": "nissan_gtr_gt3_18",
  "Skyline Super Silhouette Group 5 '84":
    "nissan_skyline_super_silhouette_group5_84",
  "PEUGEOT VGT Gr.3": "peugeot_vision_gran_turismo_gr3",
  "RCZ Gr.3": "peugeot_rcz_gr3",
  "911 GT3 R (992) '22": "porsche_911_gt3_r_22",
  "911 RSR (991) '17": "porsche_911_rsr_991_17",
  "R.S.01 GT3 '16": "renault_sport_rs01_gt3_16",
  "BRZ GT300 '21": "subaru_brz_gt300_21",
  "WRX Gr.3": "subaru_wrx_gr3",
  "SUZUKI VGT (Gr.3)": "suzuki_vision_gran_turismo_gr3",
  "FT-1 VGT (Gr.3)": "toyota_ft1_vision_gran_turismo_gr3",
  "GR Supra Racing Concept '18": "supra_racing_concept",
  "SUPRA GT500 '97": "toyota_supra_gt500_97",
  "Beetle Gr.3": "volkswagen_beetle_gr3",
  "Volkswagen GTI VGT Gr.3": "volkswagen_gti_vision_gran_turismo_gr3",
};

/** Column indices for NEW values (Old/New/Δ triplets through rotation G). */
const COL = {
  PP_NEW: 6,
  POWER_PS_NEW: 9,
  TORQUE_KGFM_NEW: 12,
  WEIGHT_KG_NEW: 15,
  PWR_TO_WT_PS_T_NEW: 21,
  WEIGHT_BALANCE_NEW: 54,
  ACCEL_400_NEW: 57,
  ACCEL_1000_NEW: 60,
  ACCEL_100_150_NEW: 63,
  STAB_LOW_NEW: 67,
  STAB_LOW_CLASS_NEW: 68,
  STAB_HIGH_NEW: 72,
  STAB_HIGH_CLASS_NEW: 73,
  ROT_60_NEW: 76,
  ROT_120_NEW: 79,
  ROT_240_NEW: 82,
};

const BOP_SECTIONS = [
  { marker: "BoP: High-speed", key: "high" },
  { marker: "BoP: Mid-speed", key: "mid" },
  { marker: "BoP: Low-speed", key: "low" },
];

function parseNum(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).trim().replace(/,/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "—") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseWeightBalanceFront(raw) {
  if (!raw || raw === "-" || raw.includes(":") === false) return null;
  const [front] = String(raw).split(":");
  return parseNum(front);
}

function parseStabilityClass(raw) {
  const token = String(raw ?? "").trim().toUpperCase();
  if (token === "N" || token === "U") return token;
  return null;
}

function splitRow(line) {
  return line.split("|").map((cell) => cell.trim());
}

function isDataRow(cells) {
  const rank = cells[1];
  return /^\d+$/.test(rank) && rank !== "100";
}

function parseEntry(cells) {
  const sourceName = cells[cells.length - 2];
  if (
    !sourceName ||
    sourceName.includes("Average") ||
    sourceName === "Car" ||
    sourceName === "Manufac- turer"
  ) {
    return null;
  }

  return {
    sourceName,
    pp: parseNum(cells[COL.PP_NEW]),
    powerPs: parseNum(cells[COL.POWER_PS_NEW]),
    torqueKgfm: parseNum(cells[COL.TORQUE_KGFM_NEW]),
    weightKg: parseNum(cells[COL.WEIGHT_KG_NEW]),
    powerToWeightPsPerT: parseNum(cells[COL.PWR_TO_WT_PS_T_NEW]),
    weightBalanceFront: parseWeightBalanceFront(cells[COL.WEIGHT_BALANCE_NEW]),
    accel400: parseNum(cells[COL.ACCEL_400_NEW]),
    accel1000: parseNum(cells[COL.ACCEL_1000_NEW]),
    accel100_150: parseNum(cells[COL.ACCEL_100_150_NEW]),
    stabilityLow: parseNum(cells[COL.STAB_LOW_NEW]),
    stabilityLowClass: parseStabilityClass(cells[COL.STAB_LOW_CLASS_NEW]),
    stabilityHigh: parseNum(cells[COL.STAB_HIGH_NEW]),
    stabilityHighClass: parseStabilityClass(cells[COL.STAB_HIGH_CLASS_NEW]),
    rotation60: parseNum(cells[COL.ROT_60_NEW]),
    rotation120: parseNum(cells[COL.ROT_120_NEW]),
    rotation240: parseNum(cells[COL.ROT_240_NEW]),
  };
}

function extractSection(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;

  const slice = text.slice(start);
  const nextBoP = slice.indexOf("\nBoP:", marker.length);
  const sectionText = nextBoP >= 0 ? slice.slice(0, nextBoP) : slice;

  const uniqueRows = [
    ...new Set(
      sectionText
        .split("\n")
        .filter(
          (line) =>
            line.startsWith("|") &&
            /^\|\s*\d+\s*\|/.test(line) &&
            !line.includes("(Average)"),
        ),
    ),
  ];
  const parsed = [];

  for (const line of uniqueRows) {
    const cells = splitRow(line);
    if (!isDataRow(cells)) continue;
    const entry = parseEntry(cells);
    if (entry) parsed.push(entry);
  }

  return parsed;
}

function normalizeForMatch(name) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\(gr\.3\)/g, " gr.3")
    .replace(/gr3/g, "gr.3")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildR79Lookup() {
  const gr3Cars = cars.filter((car) => car.class === "Gr.3");
  const byNormalized = new Map();
  for (const car of gr3Cars) {
    byNormalized.set(normalizeForMatch(car.name), car.id);
  }
  return { gr3Cars, byNormalized };
}

function resolveCarId(sourceName, lookup) {
  if (EXPLICIT_SOURCE_TO_ID[sourceName]) {
    return EXPLICIT_SOURCE_TO_ID[sourceName];
  }

  const normalizedSource = normalizeForMatch(sourceName);
  if (lookup.byNormalized.has(normalizedSource)) {
    return lookup.byNormalized.get(normalizedSource);
  }

  for (const [normalizedName, id] of lookup.byNormalized.entries()) {
    if (
      normalizedSource.includes(normalizedName) ||
      normalizedName.includes(normalizedSource)
    ) {
      return id;
    }
  }

  return null;
}

function main() {
  const text = fs.readFileSync(SOURCE_FILE, "utf8");
  const lookup = buildR79Lookup();
  const bop = { high: {}, mid: {}, low: {} };
  const nameToId = {};
  const unmapped = new Set();

  for (const section of BOP_SECTIONS) {
    const rows = extractSection(text, section.marker);
    if (!rows?.length) continue;

    for (const row of rows) {
      const carId = resolveCarId(row.sourceName, lookup);
      if (!carId) {
        unmapped.add(row.sourceName);
        continue;
      }

      nameToId[row.sourceName] = carId;
      const { sourceName, ...metrics } = row;
      bop[section.key][carId] = metrics;
    }
  }

  const highCount = Object.keys(bop.high).length;
  const midCount = Object.keys(bop.mid).length;
  const lowCount = Object.keys(bop.low).length;

  const measurable = {
    metadata: {
      gt7Version: "1.71",
      source: "GT_ENGINE",
      updatedAt: "2026-08-20",
      gr3DataVersion: "GT7-1.71",
    },
    bop: {
      high: highCount ? bop.high : null,
      mid: midCount ? bop.mid : null,
      low: lowCount ? bop.low : null,
    },
  };

  const fileBody = `/**
 * GT ENG!NE Gr.3 measurable BoP data — GT7 v1.71 (2026-08-20).
 * Generated by scripts/parse-gr3-measurable-171.mjs — do not hand-edit car metrics.
 */

export const GR3_DATA_VERSION = "GT7-1.71";

/** @type {Record<string, string>} GT ENG!NE source name → R79 car id */
export const GR3_NAME_TO_ID = ${JSON.stringify(nameToId, null, 2)};

/** @type {string[]} GT ENG!NE names with no R79 Gr.3 mapping */
export const GR3_UNMAPPED_SOURCE_NAMES = ${JSON.stringify([...unmapped].sort(), null, 2)};

/** @type {{ metadata: object, bop: { high: Record<string, object>|null, mid: Record<string, object>|null, low: Record<string, object>|null } }} */
export const GR3_MEASURABLE_171 = ${JSON.stringify(measurable, null, 2)};

/**
 * @param {string} carId
 * @param {'high'|'mid'|'low'} [bopCategory='high']
 */
export function getGr3Measurable(carId, bopCategory = "high") {
  const table = GR3_MEASURABLE_171.bop?.[bopCategory];
  if (!table) return null;
  return table[carId] ?? null;
}
`;

  fs.writeFileSync(OUTPUT_FILE, fileBody, "utf8");

  console.log(
    JSON.stringify(
      {
        output: OUTPUT_FILE,
        parsedHigh: highCount,
        parsedMid: midCount,
        parsedLow: lowCount,
        mapped: Object.keys(nameToId).length,
        unmapped: [...unmapped],
        coveragePct: Number(
          ((Object.keys(nameToId).length / highCount) * 100).toFixed(1),
        ),
      },
      null,
      2,
    ),
  );
}

main();
