import { RACE_FORMATS, resolveRaceFormatId } from "../data/racePresets.js";

/**
 * @param {Object} props
 * @param {string} props.presetId
 * @param {(id: string) => void} props.onPresetChange
 * @param {number} props.fuelMultiplier
 * @param {number} props.tyreMultiplier
 * @param {(value: number) => void} props.onFuelMultiplierChange
 * @param {(value: number) => void} props.onTyreMultiplierChange
 * @param {import("react").CSSProperties} [props.style]
 */
export default function RacePresetControls({
  presetId,
  onPresetChange,
  fuelMultiplier,
  tyreMultiplier,
  onFuelMultiplierChange,
  onTyreMultiplierChange,
  style,
}) {
  const resolvedId = resolveRaceFormatId(presetId);
  const selectedPreset = RACE_FORMATS.find((preset) => preset.id === resolvedId);

  return (
    <div style={{ ...styles.wrap, ...style }}>
      <label style={styles.presetField}>
        Race format
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
        {selectedPreset?.description ? (
          <span style={styles.presetHint}>{selectedPreset.description}</span>
        ) : null}
      </label>

      <div style={styles.multiplierRow}>
        <label style={styles.multiplierField}>
          Tyre wear multiplier
          <input
            type="range"
            min="1"
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
            min="1"
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
  },
  presetField: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "10px",
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
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
  multiplierRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },
  multiplierField: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "10px",
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    padding: "10px",
    fontSize: "0.85rem",
  },
  range: {
    width: "100%",
  },
  rangeValue: {
    color: "#9bc0ff",
    fontSize: "0.82rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
  },
};
