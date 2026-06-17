import { useEffect, useMemo, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import { analyzePitstopStrategy } from "../engine/pitstopStrategyEngine.js";
import {
  getCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  isGameDataReady,
} from "../utils/gameData.js";
import { isTrackEligibleForClass } from "../utils/trackClassification.js";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";
import RacePresetControls from "./RacePresetControls.jsx";
import R79PageHeader from "./branding/R79PageHeader.jsx";
import {
  R79_INNER_PANEL,
  R79_SECTION_TITLE,
} from "../styles/r79Theme.js";

function StrategyRow({ label, value }) {
  return (
    <div style={styles.strategyRow}>
      <span style={styles.strategyLabel}>{label}</span>
      <span style={styles.strategyValue}>{value}</span>
    </div>
  );
}

export default function PitstopStrategy() {
  const { gameVersion, game } = useGameVersion();
  const [carId, setCarId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [lapInput, setLapInput] = useState("20");
  const {
    fuelMultiplier,
    tyreMultiplier,
    setFuelMultiplier,
    setTyreMultiplier,
    reset,
  } = useRacePresetSettings();

  const cars = useMemo(
    () =>
      [...getCarsForGame(gameVersion)].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [gameVersion],
  );

  const selectedCar = cars.find((car) => car.id === carId) ?? null;

  const selectableTracks = useMemo(
    () =>
      selectedCar
        ? getSelectableTracksForClass(gameVersion, selectedCar.class)
        : [],
    [gameVersion, selectedCar],
  );

  const effectiveLapCount = useMemo(() => {
    if (lapInput.trim() === "") {
      return 20;
    }

    const parsed = Number(lapInput);
    if (!Number.isFinite(parsed)) {
      return 20;
    }

    return Math.max(1, Math.min(999, Math.round(parsed)));
  }, [lapInput]);

  const strategy = useMemo(
    () =>
      analyzePitstopStrategy({
        gameVersion,
        carId,
        trackId,
        fuelMultiplier,
        tyreMultiplier,
        lapCount: effectiveLapCount,
      }),
    [
      gameVersion,
      carId,
      trackId,
      fuelMultiplier,
      tyreMultiplier,
      effectiveLapCount,
    ],
  );

  useEffect(() => {
    if (!trackId || !selectedCar) {
      return;
    }

    const track = selectableTracks.find((entry) => entry.id === trackId);
    if (!track || !isTrackEligibleForClass(track, selectedCar.class)) {
      setTrackId("");
    }
  }, [trackId, selectedCar, selectableTracks]);

  const resetPage = () => {
    if (!window.confirm("Reset Pitstop Strategy inputs to defaults?")) {
      return;
    }

    setCarId("");
    setTrackId("");
    setLapInput("20");
    reset();
  };

  return (
    <section className="r79-page r79-page--wide">
      <R79PageHeader
        title="Pitstop Strategy"
        subtitle={`Plan pit windows and tyre stints for ${game.shortLabel} races using car characteristics, wear multipliers and race distance.`}
      >
        {!isGameDataReady(gameVersion) ? (
          <p className="r79-notice">
            {game.shortLabel} car and track data is not available yet. Populate{" "}
            <code>src/data/gt8/</code> to enable strategy planning.
          </p>
        ) : null}
      </R79PageHeader>

      <div style={styles.layout}>
        <div className="r79-card" style={styles.inputPanel}>
          <h3 style={R79_SECTION_TITLE}>Race Setup</h3>

          <label style={styles.fieldLabel}>
            Car
            <select
              value={carId}
              onChange={(event) => {
                setCarId(event.target.value);
                setTrackId("");
              }}
              style={styles.select}
            >
              <option value="">Select car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name} ({car.class})
                </option>
              ))}
            </select>
          </label>

          <label style={styles.fieldLabel}>
            Track
            <select
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
              disabled={!selectedCar}
              style={styles.select}
            >
              <option value="">
                {selectedCar ? "Select track" : "Select a car first"}
              </option>
              {selectableTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {getTrackDisplayName(track)}
                </option>
              ))}
            </select>
          </label>

          <RacePresetControls
            lapsOnly
            lapInput={lapInput}
            onLapInputChange={setLapInput}
            fuelMultiplier={fuelMultiplier}
            tyreMultiplier={tyreMultiplier}
            onFuelMultiplierChange={setFuelMultiplier}
            onTyreMultiplierChange={setTyreMultiplier}
          />

          <button
            type="button"
            onClick={resetPage}
            className="r79-btn-secondary"
            style={styles.resetButton}
          >
            Reset
          </button>
        </div>

        <div className="r79-card" style={styles.outputPanel}>
          <h3 style={R79_SECTION_TITLE}>Recommended Strategy</h3>

          {!strategy.ready ? (
            <p style={styles.placeholder}>{strategy.message}</p>
          ) : (
            <>
              <div style={R79_INNER_PANEL}>
                <StrategyRow
                  label="Strategy"
                  value={strategy.recommendedStrategy}
                />
                <StrategyRow
                  label="Recommended Stops"
                  value={String(strategy.recommendedStops)}
                />
                <StrategyRow label="Pit Lap" value={strategy.pitLapsLabel} />
                <StrategyRow label="Tyres" value={strategy.tyreStrategy} />
              </div>

              <div style={styles.altPanel}>
                <h4 style={styles.altTitle}>Alternative Strategy</h4>
                <StrategyRow
                  label="Strategy"
                  value={strategy.alternativeStrategy}
                />
                <StrategyRow
                  label="Pit Lap"
                  value={
                    strategy.alternativePitLaps?.length
                      ? strategy.alternativePitLaps.join(", ")
                      : "No pit stop required"
                  }
                />
                <StrategyRow
                  label="Tyres"
                  value={strategy.alternativeTyreStrategy}
                />
              </div>

              <div style={styles.confidencePanel}>
                <span style={styles.confidenceLabel}>Confidence</span>
                <span
                  style={{
                    ...styles.confidenceValue,
                    ...(strategy.confidence === "High"
                      ? styles.confidenceHigh
                      : strategy.confidence === "Low"
                        ? styles.confidenceLow
                        : styles.confidenceMedium),
                  }}
                >
                  {strategy.confidence}
                </span>
                <span style={styles.confidenceScore}>
                  {strategy.confidenceScore}%
                </span>
              </div>

              {strategy.notes?.length ? (
                <ul style={styles.notesList}>
                  {strategy.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  layout: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    marginTop: "16px",
  },
  inputPanel: {
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },
  outputPanel: {
    display: "grid",
    gap: "14px",
    alignContent: "start",
  },
  fieldLabel: {
    color: "#dce9ff",
    display: "grid",
    fontSize: "0.85rem",
    gap: "6px",
    fontWeight: 600,
  },
  select: {
    background: "rgba(8, 12, 22, 0.95)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#eef4ff",
    fontSize: "0.88rem",
    padding: "8px 10px",
  },
  resetButton: {
    justifySelf: "start",
    marginTop: "4px",
  },
  placeholder: {
    color: "rgba(196, 210, 240, 0.82)",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    margin: 0,
  },
  strategyRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 0",
  },
  strategyLabel: {
    color: "rgba(196, 210, 240, 0.88)",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  strategyValue: {
    color: "#f4f8ff",
    fontSize: "0.92rem",
    fontWeight: 700,
    textAlign: "right",
  },
  altPanel: {
    background: "rgba(8, 12, 22, 0.55)",
    border: "1px solid rgba(139, 92, 246, 0.22)",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  altTitle: {
    color: "#c4b5fd",
    fontSize: "0.88rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  confidencePanel: {
    alignItems: "center",
    background: "rgba(8, 12, 22, 0.55)",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "12px",
    display: "flex",
    gap: "10px",
    padding: "12px 14px",
  },
  confidenceLabel: {
    color: "rgba(196, 210, 240, 0.88)",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  confidenceValue: {
    fontSize: "1rem",
    fontWeight: 800,
  },
  confidenceHigh: {
    color: "#8ee8ff",
  },
  confidenceMedium: {
    color: "#f5c842",
  },
  confidenceLow: {
    color: "#fca5a5",
  },
  confidenceScore: {
    color: "rgba(196, 210, 240, 0.75)",
    fontSize: "0.82rem",
    marginLeft: "auto",
  },
  notesList: {
    color: "rgba(196, 210, 240, 0.82)",
    fontSize: "0.84rem",
    lineHeight: 1.5,
    margin: 0,
    paddingLeft: "18px",
  },
};
