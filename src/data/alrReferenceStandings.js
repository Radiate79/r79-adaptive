/**
 * Known ALR constructor standings for OCR comparison.
 * Keys: `${season}-${tier}`
 */

/** @type {Record<string, string[]>} */
export const ALR_REFERENCE_STANDINGS = {
  "22-1": [
    "Mercedes AMG '20",
    "Mazda RX Vision",
    "Porsche 911 '22",
    "Jaguar F-Type",
    "Subaru WRX",
    "VW Beetle",
    "Toyota GR Supra",
    "Peugeot RCZ",
    "Ferrari 296",
    "Ferrari 458",
    "Genesis X",
    "McLaren 650S",
    "Lamborghini Huracan",
    "Lexus RC F '17",
    "Porsche 911 '17",
  ],
};

/**
 * @param {number} season
 * @param {number} tier
 */
export function getReferenceStandings(season, tier) {
  return ALR_REFERENCE_STANDINGS[`${season}-${tier}`] ?? null;
}
