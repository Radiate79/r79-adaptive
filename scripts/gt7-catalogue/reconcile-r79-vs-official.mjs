/**
 * Development reconciliation: R79 GT7 cars vs official catalogue.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cars as r79Cars } from "../../src/data/gt7/cars.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const catalogue = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "src/data/gt7/1.72/officialCarCatalogue.json"),
    "utf8",
  ),
);

function norm(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Explicit R79 id → official catalogue name (manufacturer-relative or full). */
const EXPLICIT_ALIASES = {
  alfa_romeo_155_25_v6_ti_93: "155 2.5 V6 TI '93",
  alfa_romeo_4c_gr3: "4C Gr.3",
  alfa_romeo_4c_gr4: "4C Gr.4",
  alpine_a110_gr4: null, // not in official as Gr.4 A110
  alpine_vision_gt: "Alpine VGT",
  alpine_vision_gt_gr1_17: "Alpine VGT Race",
  aston_martin_dbr9_gt1_10: "DBR9 GT1 '10",
  aston_martin_v12_vantage_gt3_12: "V12 Vantage GT3 '12",
  aston_martin_vantage_amr_gte_18: null,
  aston_martin_vantage_gr4: "V8 Vantage Gr.4",
  aston_martin_vantage_gt3_19: null,
  audi_r18_16: "R18 '16",
  audi_r18_tdi_11: "R18 TDI '11",
  audi_r8_lms_15: "R8 LMS '15",
  audi_r8_lms_evo: "R8 LMS Evo '19",
  audi_rs5_turbo_dtm_19: "RS 5 Turbo DTM '19",
  audi_tt_cup: "TT Cup '16",
  audi_vision_gt_gr1: "Audi VGT",
  bentley_continental_gt3_18: null,
  bmw_m3_gt_11: "M3 GT '11",
  bmw_m4_gr4: "M4 Gr.4",
  bmw_m4_gt3: null,
  bmw_m6_gt3_endurance_model_16: "M6 GT3 Endurance Model '16",
  bmw_m6_gt3_sprint_model: "M6 GT3 Sprint Model '16",
  bmw_m8_gte_18: null,
  bmw_m_hybrid_v8_25: "M Hybrid V8 '25",
  bmw_mclaren_f1_gtr_97: "McLaren F1 GTR Race Car '97",
  bmw_z4_gt3_11: "Z4 GT3 '11",
  bugatti_veyron_gr4: "Veyron Gr.4",
  bugatti_vision_gt_gr1: "Bugatti VGT (Gr.1)",
  cadillac_vseries_r_23: null,
  chevrolet_camaro_gr3: null,
  chevrolet_camaro_gr4: null,
  chevrolet_corvette_c7_gr4: "Corvette C7 Gr.4",
  chevrolet_corvette_c8_r_20: null,
  citroen_gt_gr4: "GT by Citroën Gr.4",
  corvette_c7_gr3: "Corvette C7 Gr.3",
  corvette_gr4: "Corvette C7 Gr.4",
  dodge_challenger_gr4: null,
  dodge_tomahawk_vgt_gr1: "SRT Tomahawk VGT (Gr.1)",
  dodge_viper_gr3: "Viper SRT GT3-R '15",
  dodge_viper_gr4: "Viper Gr.4",
  ferrari_296_gt3_23: "296 GT3 '23",
  ferrari_458_gt3: "458 Italia GT3 '13",
  ferrari_458_italia_gr4: "458 Italia Gr.4",
  ferrari_488_gt3_16: null,
  ferrari_488_gte_evo_20: null,
  ferrari_499p_23: "499P '23",
  ford_focus_rs_gr4: null,
  ford_gt_gte_17: null,
  ford_gt_lm_spec_ii: "Ford GT LM Race Car Spec II",
  ford_gt_lm_spec_ii_test_car: "Ford GT LM Spec II Test Car",
  ford_gt_race_car_18: "Ford GT Race Car '18",
  ford_mustang_gr3: "Mustang Gr.3",
  ford_mustang_gr4: "Mustang Gr.4",
  genesis_g70_gr4: "G70 GR4",
  genesis_gr4: "Genesis Gr.4",
  genesis_x_gr3: "Genesis X GR3",
  genesis_x_gran_racer_vgt_gr1: "Genesis X Gran Racer VGT Concept",
  gt_by_citroen_gr4: "GT by Citroën Gr.4",
  gt_by_citroen_race_car_gr3: "GT by Citroën Race Car (Gr.3)",
  honda_nsx_concept_gt_16: "NSX CONCEPT-GT '16",
  honda_nsx_gr3: "NSX Gr.3",
  honda_nsx_gr4: "NSX Gr.4",
  honda_nsx_gt500_00: "NSX GT500 '00",
  honda_nsx_gt500_08: "NSX GT500 '08",
  hyundai_elantra_n_tc_24: "ELANTRA N TC '24",
  hyundai_genesis_gr3: "Genesis Gr.3",
  hyundai_genesis_gr4: "Genesis Gr.4",
  hyundai_n_2025_vgt_gr1: "HYUNDAI N 2025 VGT (Gr.1)",
  hyundai_veloster_n_gr4: null,
  jaguar_f_type_gr4: "F-type Gr.4",
  jaguar_f_type_gt3: "F-type Gr.3",
  jaguar_xjr9_88: "XJR-9 '88",
  lamborghini_huracan_gr4: "Huracán Gr.4",
  lamborghini_huracan_gt3_15: "Huracán GT3 '15",
  lamborghini_huracan_gt3_evo_20: null,
  lexus_lc500_gr3: null,
  lexus_rc_f_gr4: "RC F Gr.4",
  lexus_rc_f_gt500_16: "RC F GT500 '16",
  lexus_rcf_gt3: "RC F GT3 '17",
  lexus_rcf_gt3_prototype_16: "RC F GT3 prototype '16",
  lexus_sc430_gt500_08: "SC430 GT500 '08",
  mazda3_gr4: "MAZDA3 Gr.4",
  mazda_787b_91: "787B '91",
  mazda_atenza_gr3: "Atenza Gr.3",
  mazda_atenza_gr4: "Atenza Gr.4",
  mazda_lm55_vgt_gr1: "LM55 VGT (Gr.1)",
  mazda_rx_vision_gr4: null,
  mazda_rx_vision_gt3_concept: "RX-VISION GT3 CONCEPT",
  mazda_rx_vision_gt3_concept_stealth: null,
  mazda_rx_vision_gt3_evo_26: "RX-VISION GT3 EVO '26",
  mclaren_570s_gr4: null,
  mclaren_650s_gr4: "650S Gr.4",
  mclaren_650s_gt3: "650S GT3 '15",
  mclaren_720s_gt3: null,
  mclaren_f1_gtr_bmw_95: "McLaren F1 GTR - BMW '95",
  mclaren_ultimate_vgt_gr1: "McLaren VGT (Gr.1)",
  mercedes_amg_gt3_16: "Mercedes-AMG GT3 '16",
  mercedes_amg_gt3_20: "Mercedes-AMG GT3 '20",
  mercedes_amg_gt_gr4: null,
  mercedes_benz_sls_amg_gr4: "SLS AMG Gr.4",
  mercedes_benz_sls_amg_gt3_11: "SLS AMG GT3 '11",
  mercedes_clk_lm_98: "CLK-LM '98",
  mitsubishi_lancer_evolution_final_edition_gr3: "Lancer Evolution Final Gr.3",
  mitsubishi_lancer_evolution_gr4: "Lancer Evolution Final Gr.4",
  nissan_370z_gr4: null,
  nissan_gtr_gr4: "GT-R Gr.4",
  nissan_gtr_gt3_18: "GT-R NISMO GT3 '18",
  nissan_gtr_gt500_08: "GT-R GT500 '08",
  nissan_gtr_gt500_99: "GT-R GT500 '99",
  nissan_gtr_lm_nismo_15: "GT-R LM NISMO '15",
  nissan_gtr_nismo_gt3_13: "GT-R NISMO GT3 '13",
  nissan_gtr_nismo_gt500_16: "GT-R NISMO GT500 '16",
  nissan_r92cp_92: "R92CP '92",
  nissan_silvia_spec_r_aero_s15_touring_car: "Silvia spec-R Aero (S15) Touring Car",
  nissan_skyline_super_silhouette_group5_84: "Skyline Super Silhouette '84",
  peugeot_908_hdi_fap_10: "908 HDi FAP '10",
  peugeot_9x8_22: null,
  peugeot_9x8_25: "9X8 '25",
  peugeot_l750r_hybrid_vgt_17: "L750R HYbrid VGT 2017",
  peugeot_rcz_gr3: "RCZ Gr.3",
  peugeot_rcz_gr4: "RCZ Gr.4",
  peugeot_vision_gran_turismo_gr3: "PEUGEOT VGT (Gr.3)",
  porsche_911_gt3_r_22: "911 GT3 R (992) '22",
  porsche_911_rsr_991_17: "911 RSR (991) '17",
  porsche_911_rsr_gte_17: null,
  porsche_919_hybrid_16: "919 Hybrid '16",
  porsche_962_c_88: "962 C '88",
  porsche_963_23: null,
  porsche_963_24: "963 '24",
  porsche_cayman_gt4_clubsport_gr4: "Cayman GT4 Clubsport '16",
  renault_megane_trophy_gr4: null,
  renault_sport_megane_gr4: "Mégane Gr.4",
  renault_sport_rs01_gt3_16: "R.S.01 GT3 '16",
  sauber_mercedes_c9_89: "Sauber Mercedes C9 '89",
  subaru_brz_gt300_21: "BRZ GT300 '21",
  subaru_wrx_gr3: "WRX Gr.3",
  subaru_wrx_gr4: "WRX Gr.4",
  supra_racing_concept: "GR Supra Racing Concept '18",
  suzuki_swift_sport_katana_edition_gr4: "Swift Sport Gr.4",
  suzuki_vision_gran_turismo_gr3: "SUZUKI VGT (Gr.3)",
  toyota_86_gr4: "86 Gr.4",
  toyota_ft1_vision_gran_turismo_gr3: "FT-1 VGT (Gr.3)",
  toyota_gr010_hybrid_21: "GR010 HYBRID '21",
  toyota_gr_supra_race_car_19: "GR Supra Race Car '19",
  toyota_gt_one_ts020_99: "GT-One (TS020) '99",
  toyota_supra_gr4: null,
  toyota_supra_gt500_97: "Supra GT500 '97",
  toyota_ts030_hybrid_12: "TS030 Hybrid '12",
  toyota_ts050_hybrid_16: "TS050 - Hybrid '16",
  volkswagen_beetle_gr3: "Beetle Gr.3",
  volkswagen_golf_gti_gr4: null,
  volkswagen_gti_vision_gran_turismo_gr3: "Volkswagen GTI VGT (Gr.3)",
  volkswagen_scirocco_gr4: "Scirocco Gr.4",
  volvo_v60_gr4: null,
};

const byNormName = new Map();
for (const car of catalogue.cars) {
  byNormName.set(norm(car.name), car);
  byNormName.set(norm(car.displayName), car);
  byNormName.set(norm(`${car.manufacturer} ${car.name}`), car);
}

function matchOfficial(r79Car) {
  if (Object.prototype.hasOwnProperty.call(EXPLICIT_ALIASES, r79Car.id)) {
    const alias = EXPLICIT_ALIASES[r79Car.id];
    if (alias == null) {
      return { status: "INVALID_NOT_IN_GT7", official: null, reason: "explicit_null" };
    }
    const hit =
      byNormName.get(norm(alias)) ||
      catalogue.cars.find((c) => norm(c.name) === norm(alias));
    if (hit) {
      return { status: "VALID_ALIAS", official: hit, reason: "explicit_alias" };
    }
    return {
      status: "AMBIGUOUS_REQUIRES_REVIEW",
      official: null,
      reason: `alias_missing:${alias}`,
    };
  }

  const candidates = [
    r79Car.name,
    r79Car.name?.replace(/^BMW\s+/i, ""),
    r79Car.name?.replace(/^Audi\s+/i, ""),
    r79Car.name?.replace(/^Mercedes(?:-Benz|-AMG)?\s+/i, ""),
    r79Car.name?.replace(/^Nissan\s+/i, ""),
    r79Car.name?.replace(/^Porsche\s+/i, ""),
    r79Car.name?.replace(/^Ferrari\s+/i, ""),
    r79Car.name?.replace(/^Ford\s+/i, ""),
    r79Car.name?.replace(/^Toyota\s+/i, ""),
    r79Car.name?.replace(/^Mazda\s+/i, ""),
    r79Car.name?.replace(/^Honda\s+/i, ""),
    r79Car.name?.replace(/^Lamborghini\s+/i, ""),
    r79Car.name?.replace(/^McLaren\s+/i, ""),
    r79Car.name?.replace(/^Aston Martin\s+/i, ""),
    r79Car.name?.replace(/^Chevrolet\s+/i, ""),
    r79Car.name?.replace(/^Dodge\s+/i, ""),
    r79Car.name?.replace(/^Volkswagen\s+/i, ""),
    r79Car.name?.replace(/^Peugeot\s+/i, ""),
    r79Car.name?.replace(/^Subaru\s+/i, ""),
    r79Car.name?.replace(/^Lexus\s+/i, ""),
    r79Car.name?.replace(/^Hyundai\s+/i, ""),
    r79Car.name?.replace(/^Genesis\s+/i, ""),
    r79Car.name?.replace(/^Alfa Romeo\s+/i, ""),
    r79Car.name?.replace(/^Renault(?: Sport)?\s+/i, ""),
    r79Car.name?.replace(/^Suzuki\s+/i, ""),
    r79Car.name?.replace(/^Mitsubishi\s+/i, ""),
    r79Car.name?.replace(/^Jaguar\s+/i, ""),
    r79Car.name?.replace(/^Bugatti\s+/i, ""),
    r79Car.name?.replace(/^Citro[eë]n\s+/i, ""),
  ];

  for (const c of candidates) {
    const hit = byNormName.get(norm(c));
    if (hit) return { status: "VALID_EXACT", official: hit, reason: "normalized_name" };
  }

  // soft contains for review
  const soft = catalogue.cars.filter((oc) => {
    const a = norm(oc.name);
    const b = norm(r79Car.name);
    return a.includes(b) || b.includes(a);
  });
  if (soft.length === 1) {
    return { status: "AMBIGUOUS_REQUIRES_REVIEW", official: soft[0], reason: "soft_unique" };
  }
  if (soft.length > 1) {
    return {
      status: "AMBIGUOUS_REQUIRES_REVIEW",
      official: null,
      reason: `soft_multi:${soft.map((s) => s.name).join("|")}`,
    };
  }
  return { status: "INVALID_NOT_IN_GT7", official: null, reason: "no_match" };
}

const results = r79Cars.map((car) => {
  const match = matchOfficial(car);
  return {
    r79Id: car.id,
    r79Name: car.name,
    r79Class: car.class,
    status: match.status,
    officialId: match.official?.id ?? null,
    officialName: match.official
      ? `${match.official.manufacturer} ${match.official.name}`
      : null,
    reason: match.reason,
  };
});

const byStatus = Object.groupBy
  ? Object.groupBy(results, (r) => r.status)
  : results.reduce((acc, r) => {
      (acc[r.status] ??= []).push(r);
      return acc;
    }, {});

const matchedOfficialIds = new Set(
  results.filter((r) => r.officialId).map((r) => r.officialId),
);
const missingFromR79 = catalogue.cars.filter((c) => !matchedOfficialIds.has(c.id));

const report = {
  meta: {
    officialCount: catalogue.meta.carCount,
    r79Count: r79Cars.length,
    generatedAt: new Date().toISOString(),
  },
  summary: Object.fromEntries(
    Object.entries(byStatus).map(([k, v]) => [k, v.length]),
  ),
  results,
  invalid: (byStatus.INVALID_NOT_IN_GT7 ?? []).map((r) => ({
    id: r.r79Id,
    name: r.r79Name,
    class: r.r79Class,
  })),
  ambiguous: byStatus.AMBIGUOUS_REQUIRES_REVIEW ?? [],
  missingFromR79Count: missingFromR79.length,
  missingFromR79Sample: missingFromR79.slice(0, 20).map((c) => c.displayName),
};

fs.writeFileSync(
  path.join(__dirname, "reconciliation-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log("Summary:", report.summary);
console.log("\nINVALID_NOT_IN_GT7:");
for (const row of report.invalid) {
  console.log(` - ${row.id} | ${row.name} | ${row.class}`);
}
console.log(`\nMISSING_FROM_R79: ${report.missingFromR79Count}`);
if (report.ambiguous.length) {
  console.log("\nAMBIGUOUS:");
  for (const row of report.ambiguous) {
    console.log(` - ${row.r79Id} | ${row.r79Name} | ${row.reason} | ${row.officialName}`);
  }
}
