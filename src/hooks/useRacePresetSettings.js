import { useCallback, useMemo, useState } from "react";
import {
  RACE_CONDITION_PRESET_CUSTOM_ID,
  getRaceConditionPresetValues,
  matchRaceConditionPreset,
} from "../data/racePresets.js";

/**
 * @param {string} [initialPresetId]
 */
export function useRacePresetSettings(
  initialPresetId = RACE_CONDITION_PRESET_CUSTOM_ID,
) {
  const [presetId, setPresetId] = useState(initialPresetId);
  const [fuelMultiplier, setFuelMultiplierState] = useState(1);
  const [tyreMultiplier, setTyreMultiplierState] = useState(1);

  const selectPreset = useCallback((id) => {
    setPresetId(id);
    const values = getRaceConditionPresetValues(id);
    if (values) {
      setFuelMultiplierState(values.fuelMultiplier);
      setTyreMultiplierState(values.tyreMultiplier);
    }
  }, []);

  const setFuelMultiplier = useCallback(
    (value) => {
      const nextFuel = Number(value);
      setFuelMultiplierState(nextFuel);
      setPresetId(matchRaceConditionPreset(nextFuel, tyreMultiplier));
    },
    [tyreMultiplier],
  );

  const setTyreMultiplier = useCallback(
    (value) => {
      const nextTyre = Number(value);
      setTyreMultiplierState(nextTyre);
      setPresetId(matchRaceConditionPreset(fuelMultiplier, nextTyre));
    },
    [fuelMultiplier],
  );

  const reset = useCallback(() => {
    setPresetId(RACE_CONDITION_PRESET_CUSTOM_ID);
    setFuelMultiplierState(1);
    setTyreMultiplierState(1);
  }, []);

  const raceSettings = useMemo(
    () => ({ fuelMultiplier, tyreMultiplier }),
    [fuelMultiplier, tyreMultiplier],
  );

  return {
    presetId,
    fuelMultiplier,
    tyreMultiplier,
    selectPreset,
    setFuelMultiplier,
    setTyreMultiplier,
    reset,
    raceSettings,
  };
}
