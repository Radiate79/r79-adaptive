import { RACE_FORMATS, resolveRaceFormatId } from "../data/racePresets.js";
/**
 * @param {Object} props
 * @param {string} props.presetId
 * @param {(id: string) => void} props.onPresetChange
 * @param {number} props.fuelMultiplier
 * @param {number} props.tyreMultiplier
 * @param {(value: number) => void} props.onFuelMultiplierChange
 * @param {(value: number) => void} props.onTyreMultiplierChange
 * @param {boolean} [props.distanceMode]
 * @param {number} [props.lapCount]
 * @param {(value: number) => void} [props.onLapCountChange]
 * @param {import("react").CSSProperties} [props.style]
 */
export default function RacePresetControls({
  presetId,
  onPresetChange,
  fuelMultiplier,
  tyreMultiplier,
  onFuelMultiplierChange,
  onTyreMultiplierChange,
  distanceMode = false,
  lapCount = 20,
  onLapCountChange,
  style,
}) {
  const resolvedId = resolveRaceFormatId(presetId);
  const selectedPreset = RACE_FORMATS.find((preset) => preset.id === resolvedId);

  return (
    <div style={{ ...styles.wrap, ...style }}>
      <label style={styles.presetField}>
        {distanceMode ? "Distance" : "Race format"}
        <select
          value={resolvedId}
          onChange={(event) => onPresetChange(event.target.value)}
          style={styles.select}
        >
          {RACE_FORMATS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        {distanceMode ? (
          <>
            <span style={styles.lapLabel}>Number of laps</span>
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              value={lapCount}
              onChange={(event) =>
                onLapCountChange?.(Number(event.target.value))
              }
              style={styles.lapInput}
            />
          </>
        ) : null}
        {selectedPreset?.description ? (
          <span style={styles.presetHint}>{selectedPreset.description}</span>
        ) : null}
      </label>

      <div style={styles.multiplierRow}>
        <label style={styles.multiplierField}>
          Tyre wear multiplier
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={tyreMultiplier}
            onChange={(event) =>
              onTyreMultiplierChange(Number(event.target.value))
            }
            style={styles.range}
          />
          <span style={styles.rangeValue}>x{tyreMultiplier}</span>
        </label>

        <label style={styles.multiplierField}>
          Fuel wear multiplier
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={fuelMultiplier}
            onChange={(event) =>
              onFuelMultiplierChange(Number(event.target.value))
            }
            style={styles.range}
          />
          <span style={styles.rangeValue}>x{fuelMultiplier}</span>
        </label>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: "10px",
    maxWidth: "100%",
    minWidth: 0,
  },
  presetField: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "10px",
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    maxWidth: "100%",
    minWidth: 0,
    padding: "10px",
    fontSize: "0.85rem",
  },
  select: {
    background: "rgba(8, 12, 22, 0.95)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#eef4ff",
    fontSize: "0.88rem",
    padding: "8px 10px",
  },
  presetHint: {
    color: "rgba(180, 200, 240, 0.85)",
    fontSize: "0.8rem",
  },
  lapLabel: {
    color: "#dce9ff",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  lapInput: {
    background: "rgba(8, 12, 22, 0.95)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#eef4ff",
    fontSize: "0.88rem",
    padding: "8px 10px",
  },
  multiplierRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    maxWidth: "100%",
    minWidth: 0,
  },
  multiplierField: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "10px",
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    maxWidth: "100%",
    minWidth: 0,
    padding: "10px",
    fontSize: "0.85rem",
  },
  range: {
    display: "block",
    maxWidth: "100%",
    width: "100%",
  },
  rangeValue: {
    color: "#9bc0ff",
    fontSize: "0.82rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
  },
};
