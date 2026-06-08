import { getRaceConditionPreset } from "../data/racePresets.js";

const LEGACY_RACE_LENGTH_LAPS = {
  sprint: 10,
  medium: 20,
  endurance: 40,
};

/**
 * @param {{ lapCount?: number, raceLength?: string }} [input]
 * @returns {number}
 */
export function resolveLapCount(input = {}) {
  if (input.lapCount != null && Number.isFinite(Number(input.lapCount))) {
    return Math.max(1, Math.min(999, Math.round(Number(input.lapCount))));
  }

  if (input.raceLength && LEGACY_RACE_LENGTH_LAPS[input.raceLength]) {
    return LEGACY_RACE_LENGTH_LAPS[input.raceLength];
  }

  return 20;
}

/**
 * @param {number} lapCount
 * @returns {{ fuelWeight: number, tyreWeight: number, strategyBias: string }}
 */
export function getLapCountModifiers(lapCount) {
  const laps = resolveLapCount({ lapCount });

  if (laps <= 5) {
    return { fuelWeight: 0.8, tyreWeight: 0.85, strategyBias: "qualifying" };
  }

  if (laps <= 12) {
    return { fuelWeight: 0.85, tyreWeight: 0.9, strategyBias: "sprint" };
  }

  if (laps <= 25) {
    return { fuelWeight: 1, tyreWeight: 1, strategyBias: "medium" };
  }

  return { fuelWeight: 1.25, tyreWeight: 1.2, strategyBias: "endurance" };
}

/**
 * @param {number} lapCount
 * @param {string} [raceFormatId]
 * @returns {string}
 */
export function formatRaceDistanceLabel(lapCount, raceFormatId) {
  const laps = resolveLapCount({ lapCount });
  const preset = getRaceConditionPreset(raceFormatId);
  const formatLabel =
    preset.id === "custom" ? null : preset.label;

  return formatLabel ? `${formatLabel} · ${laps} laps` : `${laps} laps`;
}
