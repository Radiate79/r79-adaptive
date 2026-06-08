/** Supported GT7 race classes for R79 selectors and recommendations. */
export const CAR_CLASS_OPTIONS = ["Gr.1", "Gr.2", "Gr.3", "Gr.4"];

export const DEFAULT_CAR_CLASS = "Gr.3";

/**
 * @param {string} [carClass]
 * @returns {boolean}
 */
export function isSupportedCarClass(carClass) {
  return CAR_CLASS_OPTIONS.includes(carClass ?? "");
}
