import { useEffect, useMemo, useRef, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  analyzePitstopStrategy,
  COMPOUND_LABELS,
} from "../engine/pitstopStrategyEngine.js";
import {
  createCalculationRequestId,
  runCancellableCalculation,
} from "../engine/calculationRunner.js";
import { buildRecommendationCacheKey } from "../engine/recommendationCache.js";
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

const COMPOUND_OPTIONS = ["S", "M", "H", "IM", "W"];

function StrategyRow({ label, value }) {
  return (
    <div style={styles.strategyRow}>
      <span style={styles.strategyLabel}>{label}</span>
      <span style={styles.strategyValue}>{value}</span>
    </div>
  );
}

function createDefaultStints(laps) {
  const total = Math.max(1, Number(laps) || 20);
  return [
    {
      id: "stint-1",
      compound: "S",
      startLap: 1,
      endLap: Math.max(1, Math.floor(total / 2)),
    },
    {
      id: "stint-2",
      compound: "M",
      startLap: Math.max(2, Math.floor(total / 2) + 1),
      endLap: total,
    },
  ];
}

export default function PitstopStrategy() {
  const { gameVersion, game } = useGameVersion();
  const [carId, setCarId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [lapInput, setLapInput] = useState("20");
  const [useCustomStints, setUseCustomStints] = useState(false);
  const [stints, setStints] = useState(() => createDefaultStints(20));
  const {
    fuelMultiplier,
    tyreMultiplier,
    setFuelMultiplier,
    setTyreMultiplier,
    reset,
  } = useRacePresetSettings();

  const [strategy, setStrategy] = useState(/** @type {object | null} */ (null));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [confirmedInputKey, setConfirmedInputKey] = useState(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(/** @type {AbortController | null} */ (null));

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

  const draftInputKey = useMemo(
    () =>
      buildRecommendationCacheKey("pitstop-draft", {
        gameVersion,
        carId,
        trackId,
        fuelMultiplier,
        tyreMultiplier,
        lapCount: effectiveLapCount,
        useCustomStints,
        stints: useCustomStints ? stints : null,
      }),
    [
      gameVersion,
      carId,
      trackId,
      fuelMultiplier,
      tyreMultiplier,
      effectiveLapCount,
      useCustomStints,
      stints,
    ],
  );

  const inputsChanged =
    confirmedInputKey != null &&
    confirmedInputKey !== draftInputKey &&
    !isGenerating;

  useEffect(() => {
    if (!trackId || !selectedCar) {
      return;
    }

    const track = selectableTracks.find((entry) => entry.id === trackId);
    if (!track || !isTrackEligibleForClass(track, selectedCar.class)) {
      setTrackId("");
    }
  }, [trackId, selectedCar, selectableTracks]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetPage = () => {
    if (!window.confirm("Reset Pitstop Strategy inputs to defaults?")) {
      return;
    }

    abortRef.current?.abort();
    requestIdRef.current = createCalculationRequestId();
    setCarId("");
    setTrackId("");
    setLapInput("20");
    setUseCustomStints(false);
    setStints(createDefaultStints(20));
    reset();
    setStrategy(null);
    setConfirmedInputKey(null);
    setGenerationError(null);
    setIsGenerating(false);
  };

  const updateStint = (id, field, value) => {
    setStints((current) =>
      current.map((stint) =>
        stint.id === id ? { ...stint, [field]: value } : stint,
      ),
    );
  };

  const addStint = () => {
    setStints((current) => {
      const last = current[current.length - 1];
      const nextStart = last ? Number(last.endLap) + 1 : 1;
      return [
        ...current,
        {
          id: `stint-${Date.now()}`,
          compound: "M",
          startLap: Math.min(effectiveLapCount, nextStart),
          endLap: effectiveLapCount,
        },
      ];
    });
  };

  const removeStint = (id) => {
    setStints((current) =>
      current.length <= 1 ? current : current.filter((stint) => stint.id !== id),
    );
  };

  const calculateStrategy = async () => {
    if (isGenerating) {
      return;
    }

    if (!carId || !trackId) {
      setGenerationError("Select a car and track before calculating strategy.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = createCalculationRequestId();
    requestIdRef.current = requestId;
    const snapshotKey = draftInputKey;

    setIsGenerating(true);
    setGenerationError(null);

    const outcome = await runCancellableCalculation({
      requestId,
      isCurrent: (id) => id === requestIdRef.current,
      signal: controller.signal,
      compute: () =>
        analyzePitstopStrategy({
          gameVersion,
          carId,
          trackId,
          fuelMultiplier,
          tyreMultiplier,
          lapCount: effectiveLapCount,
          stints: useCustomStints
            ? stints.map((stint) => ({
                compound: stint.compound,
                startLap: Number(stint.startLap),
                endLap: Number(stint.endLap),
              }))
            : undefined,
        }),
    });

    if (!outcome.ok) {
      if (outcome.reason === "cancelled") {
        return;
      }
      setIsGenerating(false);
      setGenerationError(
        "Strategy calculation failed. Check your inputs and try again.",
      );
      return;
    }

    setStrategy(outcome.value);
    setConfirmedInputKey(snapshotKey);
    setIsGenerating(false);

    if (!outcome.value.ready && outcome.value.message) {
      setGenerationError(outcome.value.message);
    }
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

          <div style={styles.stintPanel}>
            <div style={styles.stintHeader}>
              <h4 style={styles.stintTitle}>Tyre Stints</h4>
              <label style={styles.stintToggle}>
                <input
                  type="checkbox"
                  checked={useCustomStints}
                  onChange={(event) => setUseCustomStints(event.target.checked)}
                />
                Define stints manually
              </label>
            </div>
            <p style={styles.stintHint}>
              Repeated compounds are allowed (e.g. Soft → Medium → Soft).
            </p>
            {useCustomStints ? (
              <div style={styles.stintList}>
                {stints.map((stint, index) => (
                  <div key={stint.id} style={styles.stintRow}>
                    <span style={styles.stintLabel}>Stint {index + 1}</span>
                    <select
                      value={stint.compound}
                      onChange={(event) =>
                        updateStint(stint.id, "compound", event.target.value)
                      }
                      style={styles.stintSelect}
                      aria-label={`Stint ${index + 1} compound`}
                    >
                      {COMPOUND_OPTIONS.map((code) => (
                        <option key={code} value={code}>
                          {COMPOUND_LABELS[code]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={effectiveLapCount}
                      value={stint.startLap}
                      onChange={(event) =>
                        updateStint(stint.id, "startLap", event.target.value)
                      }
                      style={styles.stintInput}
                      aria-label={`Stint ${index + 1} start lap`}
                    />
                    <span style={styles.stintDash}>–</span>
                    <input
                      type="number"
                      min={1}
                      max={effectiveLapCount}
                      value={stint.endLap}
                      onChange={(event) =>
                        updateStint(stint.id, "endLap", event.target.value)
                      }
                      style={styles.stintInput}
                      aria-label={`Stint ${index + 1} end lap`}
                    />
                    <button
                      type="button"
                      className="r79-btn-secondary"
                      onClick={() => removeStint(stint.id)}
                      disabled={stints.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="r79-btn-secondary"
                  onClick={addStint}
                >
                  Add Stint
                </button>
              </div>
            ) : (
              <p style={styles.stintHint}>
                R79 will calculate stint compounds automatically when you press
                Calculate Strategy.
              </p>
            )}
          </div>

          {inputsChanged ? (
            <p className="r79-notice">
              Inputs changed since the last result. Press Calculate Strategy to
              update.
            </p>
          ) : null}

          <div style={styles.actionRow}>
            <button
              type="button"
              onClick={calculateStrategy}
              className="r79-btn-primary"
              disabled={isGenerating || !carId || !trackId}
            >
              {isGenerating ? "Calculating…" : "Calculate Strategy"}
            </button>
            <button
              type="button"
              onClick={resetPage}
              className="r79-btn-secondary"
              style={styles.resetButton}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="r79-card" style={styles.outputPanel}>
          <h3 style={R79_SECTION_TITLE}>Recommended Strategy</h3>

          {isGenerating ? (
            <p style={styles.placeholder}>Calculating strategy…</p>
          ) : null}

          {generationError && !isGenerating ? (
            <div style={styles.errorBlock}>
              <p style={styles.placeholder}>{generationError}</p>
              <button
                type="button"
                className="r79-btn-secondary"
                onClick={calculateStrategy}
              >
                Retry
              </button>
            </div>
          ) : null}

          {!isGenerating && !strategy ? (
            <p style={styles.placeholder}>
              Adjust race setup, then press Calculate Strategy.
            </p>
          ) : null}

          {!isGenerating && strategy?.ready ? (
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
                <StrategyRow
                  label="Pit Lane Loss"
                  value={strategy.pitLaneLoss ?? "TBC"}
                />
              </div>

              {strategy.stints?.length ? (
                <div style={styles.altPanel}>
                  <h4 style={styles.altTitle}>Stint Plan</h4>
                  {strategy.stints.map((stint) => (
                    <StrategyRow
                      key={`stint-${stint.stintNumber}`}
                      label={`Stint ${stint.stintNumber}`}
                      value={`${stint.compound} · Laps ${stint.startLap}–${stint.endLap}`}
                    />
                  ))}
                </div>
              ) : null}

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

              {strategy.comparedStrategies?.length ? (
                <div style={styles.altPanel}>
                  <h4 style={styles.altTitle}>Strategy Comparison</h4>
                  {strategy.comparedStrategies.slice(0, 4).map((candidate) => (
                    <StrategyRow
                      key={candidate.label}
                      label={candidate.label}
                      value={`Index ${candidate.estimatedRaceTimeIndex}`}
                    />
                  ))}
                </div>
              ) : null}

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
          ) : null}
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
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
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
  errorBlock: {
    display: "grid",
    gap: "10px",
    justifyItems: "start",
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
  stintPanel: {
    background: "rgba(8, 12, 22, 0.45)",
    border: "1px solid rgba(34, 211, 238, 0.18)",
    borderRadius: "12px",
    display: "grid",
    gap: "8px",
    padding: "12px",
  },
  stintHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
  },
  stintTitle: {
    color: "#8ee8ff",
    fontSize: "0.9rem",
    fontWeight: 700,
    margin: 0,
  },
  stintToggle: {
    alignItems: "center",
    color: "rgba(196, 210, 240, 0.9)",
    display: "flex",
    fontSize: "0.82rem",
    gap: "6px",
  },
  stintHint: {
    color: "rgba(196, 210, 240, 0.75)",
    fontSize: "0.8rem",
    lineHeight: 1.4,
    margin: 0,
  },
  stintList: {
    display: "grid",
    gap: "8px",
  },
  stintRow: {
    alignItems: "center",
    display: "grid",
    gap: "6px",
    gridTemplateColumns: "auto minmax(90px, 1fr) 58px auto 58px auto",
  },
  stintLabel: {
    color: "#dce9ff",
    fontSize: "0.78rem",
    fontWeight: 700,
  },
  stintSelect: {
    background: "rgba(8, 12, 22, 0.95)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#eef4ff",
    fontSize: "0.8rem",
    padding: "6px",
  },
  stintInput: {
    background: "rgba(8, 12, 22, 0.95)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#eef4ff",
    fontSize: "0.8rem",
    padding: "6px",
    width: "100%",
  },
  stintDash: {
    color: "rgba(196, 210, 240, 0.7)",
  },
};
