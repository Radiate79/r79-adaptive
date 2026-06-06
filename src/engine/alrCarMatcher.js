/**
 * Match OCR car text to cars.js entries.
 */

/** @type {{ pattern: RegExp, carId: string }[]} */
const ALR_DISPLAY_ALIASES = [
  { pattern: /mercedes[\s-]*amg(?:\s*'?20)?/i, carId: "mercedes_amg_gt3_20" },
  { pattern: /^amg\s*'?20$/i, carId: "mercedes_amg_gt3_20" },
  { pattern: /^amg\s*20$/i, carId: "mercedes_amg_gt3_20" },
  { pattern: /mercedes[\s-]*amg\s*'?16/i, carId: "mercedes_amg_gt3_16" },
  { pattern: /porsche\s*911\s*rsr/i, carId: "porsche_911_rsr_991_17" },
  { pattern: /porsche\s*911\s*'?17/i, carId: "porsche_911_rsr_991_17" },
  { pattern: /porsche\s*911\s*'?22/i, carId: "porsche_911_gt3_r_22" },
  { pattern: /porsche\s*911\s*gt3\s*r/i, carId: "porsche_911_gt3_r_22" },
  { pattern: /mazda\s*rx[\s-]*vision/i, carId: "mazda_rx_vision_gt3_concept" },
  { pattern: /jaguar\s*f-?type/i, carId: "jaguar_f_type_gt3" },
  { pattern: /subaru\s*wrx/i, carId: "subaru_wrx_gr3" },
  { pattern: /vw\s*beetle|volkswagen\s*beetle/i, carId: "volkswagen_beetle_gr3" },
  { pattern: /toyota\s*gr\s*supra/i, carId: "toyota_gr_supra_race_car_19" },
  { pattern: /peugeot\s*rcz/i, carId: "peugeot_rcz_gr3" },
  { pattern: /ferrari\s*296(?:\s*gt3)?(?:\s*'?23)?/i, carId: "ferrari_296_gt3_23" },
  { pattern: /ferrari\s*488/i, carId: "ferrari_488_gt3_16" },
  { pattern: /ferrari\s*458/i, carId: "ferrari_458_gt3" },
  { pattern: /genesis\s*x/i, carId: "genesis_x_gr3" },
  { pattern: /mclaren\s*650/i, carId: "mclaren_650s_gt3" },
  { pattern: /lamborghini\s*hurac(?:an)?(?:\s*gt3)?(?:\s*'?15)?/i, carId: "lamborghini_huracan_gt3_15" },
  { pattern: /lamborghini\s*hurac/i, carId: "lamborghini_huracan_gt3_evo_20" },
  { pattern: /lexus\s*rc\s*f(?:\s*'?17)?/i, carId: "lexus_rc_f_gt3" },
  { pattern: /nissan\s*gt-?r\s*'?18/i, carId: "nissan_gtr_gt3_18" },
  { pattern: /bmw\s*m6/i, carId: "bmw_m6_gt3_sprint_model" },
  { pattern: /audi\s*r8/i, carId: "audi_r8_lms_evo" },
  { pattern: /corvette\s*c7/i, carId: "corvette_c7_gr3" },
  { pattern: /ford\s*gt/i, carId: "ford_gt_lm_spec_ii" },
  { pattern: /supra/i, carId: "supra_racing_concept" },
];

/** @param {string} value */
export function normalizeCarText(value) {
  return value
    .toLowerCase()
    .replace(/[''`´]/g, "'")
    .replace(/[|]/g, " ")
    .replace(/[^\w\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} rawText
 * @param {import("../data/cars.js").cars[number][]} carList
 */
export function matchCarFromText(rawText, carList) {
  const normalizedInput = normalizeCarText(rawText);
  if (!normalizedInput) {
    return { carId: "", confidence: 0, matchedName: "" };
  }

  for (const alias of ALR_DISPLAY_ALIASES) {
    if (alias.pattern.test(rawText) || alias.pattern.test(normalizedInput)) {
      const car = carList.find((item) => item.id === alias.carId);
      if (car) {
        return { carId: car.id, confidence: 0.92, matchedName: car.name };
      }
    }
  }

  let best = { carId: "", confidence: 0, matchedName: "" };

  for (const car of carList) {
    const normalizedName = normalizeCarText(car.name);
    let confidence = 0;

    if (normalizedInput === normalizedName) {
      confidence = 1;
    } else if (
      normalizedInput.includes(normalizedName) ||
      normalizedName.includes(normalizedInput)
    ) {
      confidence =
        Math.min(normalizedInput.length, normalizedName.length) /
        Math.max(normalizedInput.length, normalizedName.length);
    } else {
      const tokens = normalizedName.split(" ").filter((token) => token.length > 2);
      if (tokens.length > 0) {
        const matchedTokens = tokens.filter((token) =>
          normalizedInput.includes(token),
        ).length;
        confidence = matchedTokens / tokens.length;
      }
    }

    if (confidence > best.confidence) {
      best = {
        carId: car.id,
        confidence,
        matchedName: car.name,
      };
    }
  }

  if (best.confidence < 0.45) {
    return { carId: "", confidence: best.confidence, matchedName: "" };
  }

  return best;
}
