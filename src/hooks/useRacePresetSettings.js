import { useCallback, useMemo, useState } from "react";
import {
  RACE_CONDITION_PRESET_CUSTOM_ID,
  getRaceConditionPresetValues,
  getRaceFormatDefaultLaps,
  matchRaceConditionPreset,
  resolveRaceFormatId,
} from "../data/racePresets.js";

/**
 * @param {string} [initialPresetId]
 */
export function useRacePresetSettings(
  initialPresetId = RACE_CONDITION_PRESET_CUSTOM_ID,
) {
  const initialValues = getRaceConditionPresetValues(initialPresetId);

  const [presetId, setPresetId] = useState(initialPresetId);
  const [lapCount, setLapCountState] = useState(
    getRaceFormatDefaultLaps(initialPresetId),
  );
  const [fuelMultiplier, setFuelMultiplierState] = useState(
    initialValues?.fuelMultiplier ?? 0,
  );
  const [tyreMultiplier, setTyreMultiplierState] = useState(
    initialValues?.tyreMultiplier ?? 0,
  );

  const selectPreset = useCallback((id) => {
    setPresetId(id);
    const values = getRaceConditionPresetValues(id);
    if (values) {
      setFuelMultiplierState(values.fuelMultiplier);
      setTyreMultiplierState(values.tyreMultiplier);
    }
    setLapCountState(getRaceFormatDefaultLaps(id));
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

  const setLapCount = useCallback(
    (value) => {
      const nextLaps = Math.max(1, Math.min(999, Math.round(Number(value) || 1)));
      setLapCountState(nextLaps);

      if (nextLaps !== getRaceFormatDefaultLaps(presetId)) {
        setPresetId(RACE_CONDITION_PRESET_CUSTOM_ID);
      }
    },
    [presetId],
  );

  const reset = useCallback(() => {
    setPresetId(RACE_CONDITION_PRESET_CUSTOM_ID);
    setLapCountState(getRaceFormatDefaultLaps(RACE_CONDITION_PRESET_CUSTOM_ID));
    setFuelMultiplierState(0);
    setTyreMultiplierState(0);
  }, []);

  const resetToPreset = useCallback((id = "full_race") => {
    const resolvedId = resolveRaceFormatId(id);
    setPresetId(resolvedId);
    const values = getRaceConditionPresetValues(resolvedId);
    if (values) {
      setFuelMultiplierState(values.fuelMultiplier);
      setTyreMultiplierState(values.tyreMultiplier);
    } else {
      setFuelMultiplierState(0);
      setTyreMultiplierState(0);
    }
    setLapCountState(getRaceFormatDefaultLaps(resolvedId));
  }, []);

  const raceSettings = useMemo(
    () => ({
      fuelMultiplier,
      tyreMultiplier,
      lapCount,
      raceFormatId: presetId,
    }),
    [fuelMultiplier, tyreMultiplier, lapCount, presetId],
  );

  return {
    presetId,
    lapCount,
    fuelMultiplier,
    tyreMultiplier,
    selectPreset,
    setLapCount,
    setFuelMultiplier,
    setTyreMultiplier,
    reset,
    resetToPreset,
    raceSettings,
  };
}
