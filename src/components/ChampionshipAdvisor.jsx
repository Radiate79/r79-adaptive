import { useEffect, useMemo, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  analyzeCalendarDNA,
  analyzeCarBestAndWeakestTracks,
  analyzeDrivetrainSuitability,
  rankCarsByChampionshipConsistency,
  recommendCarsForChampionship,
} from "../engine/championshipEngine.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import {
  getRecommendableCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  getTracksForGame,
  isGameDataReady,
} from "../utils/gameData.js";
import { CAR_CLASS_OPTIONS } from "../data/carClasses.js";
import {
  getCalendarRecommendationStatus,
  isCarClassSelectableForTrack,
} from "../utils/trackClassification.js";
import { TrackSurfaceWarning } from "./TrackSurfaceWarning.jsx";
import RacePresetControls from "./RacePresetControls.jsx";
import { getRaceConditionPreset, resolveRaceFormatId } from "../data/racePresets.js";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";

export default function ChampionshipAdvisor() {
  const { gameVersion, game } = useGameVersion();
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [carClass, setCarClass] = useState("Gr.3");
  const [bannedCarNames, setBannedCarNames] = useState([]);
  const allTracks = useMemo(() => getTracksForGame(gameVersion), [gameVersion]);
  const classCars = useMemo(
    () =>
      [...getRecommendableCarsForGame(gameVersion, carClass)].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [gameVersion, carClass],
  );
  const selectableTracks = useMemo(
    () => getSelectableTracksForClass(gameVersion, carClass),
    [gameVersion, carClass],
  );
  const {
    presetId,
    fuelMultiplier,
    tyreMultiplier,
    selectPreset,
    setFuelMultiplier,
    setTyreMultiplier,
    resetToPreset,
  } = useRacePresetSettings("full_race");
  const selectedTracks = useMemo(
    () => allTracks.filter((track) => selectedTrackIds.includes(track.id)),
    [allTracks, selectedTrackIds],
  );

  useEffect(() => {
    setSelectedTrackIds((current) =>
      current.filter((id) =>
        selectableTracks.some((track) => track.id === id),
      ),
    );
  }, [selectableTracks]);

  useEffect(() => {
    const validNames = new Set(classCars.map((car) => car.name));
    setBannedCarNames((current) =>
      current.filter((name) => validNames.has(name)),
    );
  }, [classCars]);

  const raceSettings = useMemo(
    () => ({
      fuelMultiplier,
      tyreMultiplier,
      bannedCarNames,
    }),
    [fuelMultiplier, tyreMultiplier, bannedCarNames],
  );

  const allCarsBanned =
    classCars.length > 0 &&
    classCars.every((car) => bannedCarNames.includes(car.name));

  const toggleBannedCar = (carName) => {
    setBannedCarNames((current) =>
      current.includes(carName)
        ? current.filter((name) => name !== carName)
        : [...current, carName],
    );
  };

  const championshipSummary = useMemo(() => {
    if (selectedTracks.length === 0) {
      return [
        `Fuel Multiplier x${fuelMultiplier}`,
        `Tyre Multiplier x${tyreMultiplier}`,
      ];
    }

    const average = (field) =>
      selectedTracks.reduce((sum, track) => sum + Number(track[field] ?? 0), 0) /
      selectedTracks.length;

    const avgTopSpeed = average("topSpeed");
    const avgTraction = average("traction");
    const avgTyres = average("tyres");
    const avgFuel = average("fuel");
    const topSpeedSpread =
      Math.max(...selectedTracks.map((track) => track.topSpeed)) -
      Math.min(...selectedTracks.map((track) => track.topSpeed));

    const labels = [];

    if (avgTopSpeed >= 8) {
      labels.push("High Speed Championship");
    }

    if (avgTraction >= 8) {
      labels.push("Technical Championship");
    }

    if (avgTyres >= 7) {
      labels.push("Tyre Management Important");
    }

    if (avgFuel >= 7.5) {
      labels.push("Fuel Management Important");
    }

    if (topSpeedSpread >= 3 || labels.length >= 2) {
      labels.push("Mixed Calendar");
    }

    const preset = getRaceConditionPreset(resolveRaceFormatId(presetId));
    if (preset.id !== "custom") {
      labels.push(preset.label);
    }
    labels.push(`Fuel Multiplier x${fuelMultiplier}`);
    labels.push(`Tyre Multiplier x${tyreMultiplier}`);

    return Array.from(new Set(labels));
  }, [selectedTracks, fuelMultiplier, tyreMultiplier, presetId]);

  const drivetrainRankings = useMemo(
    () => analyzeDrivetrainSuitability(selectedTracks),
    [selectedTracks],
  );

  const recommendations = useMemo(() => {
    if (selectedTrackIds.length === 0) {
      return [];
    }

    return recommendCarsForChampionship(
      selectedTrackIds,
      carClass,
      raceSettings,
      gameVersion,
    ).slice(0, 5);
  }, [selectedTrackIds, carClass, raceSettings, gameVersion]);

  const recommendationsWithTrackAnalysis = useMemo(() => {
    if (recommendations.length === 0 || selectedTracks.length === 0) {
      return [];
    }

    return recommendations.map((car) => ({
      ...car,
      trackAnalysis: analyzeCarBestAndWeakestTracks(
        car,
        selectedTracks,
        raceSettings,
      ),
    }));
  }, [recommendations, selectedTracks, raceSettings]);

  const consistencyRankings = useMemo(() => {
    if (selectedTrackIds.length === 0) {
      return [];
    }

    return rankCarsByChampionshipConsistency(
      selectedTrackIds,
      carClass,
      raceSettings,
      gameVersion,
    ).slice(0, 5);
  }, [selectedTrackIds, carClass, raceSettings, gameVersion]);

  const calendarAnalysis = useMemo(() => {
    const metricConfig = [
      { label: "Top Speed Importance", field: "topSpeed" },
      { label: "Traction Importance", field: "traction" },
      { label: "Fuel Importance", field: "fuel" },
      { label: "Tyre Importance", field: "tyres" },
      { label: "Stability Importance", field: "stability" },
    ];

    if (selectedTracks.length === 0) {
      return metricConfig.map((metric) => ({
        ...metric,
        percent: 0,
      }));
    }

    return metricConfig.map((metric) => {
      const averageValue =
        selectedTracks.reduce(
          (sum, track) => sum + Number(track[metric.field] ?? 0),
          0,
        ) / selectedTracks.length;

      return {
        ...metric,
        percent: Math.round((averageValue / 10) * 100),
      };
    });
  }, [selectedTracks]);

  const calendarDNA = useMemo(
    () => analyzeCalendarDNA(selectedTracks),
    [selectedTracks],
  );

  const calendarRecommendationStatus = useMemo(
    () => getCalendarRecommendationStatus(selectedTracks, carClass),
    [selectedTracks, carClass],
  );

  const toggleTrack = (trackId) => {
    setSelectedTrackIds((current) =>
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId],
    );
  };

  const resetAdvisor = () => {
    setSelectedTrackIds([]);
    setBannedCarNames([]);
    setCarClass("Gr.3");
    resetToPreset("full_race");
  };

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>R79 Championship Advisor</h2>
        <p style={styles.subtitle}>
          Select tracks and class to get the strongest championship car for{" "}
          {game.shortLabel}.
        </p>
        {!isGameDataReady(gameVersion) ? (
          <p style={styles.gameNotice}>
            {game.shortLabel} car and track data is not available yet. Populate{" "}
            <code>src/data/gt8/</code> to enable recommendations.
          </p>
        ) : null}
      </div>

      <TrackSurfaceWarning
        warning={calendarRecommendationStatus.warning}
        message={calendarRecommendationStatus.message}
      />

      <div style={styles.classRow}>
        {CAR_CLASS_OPTIONS.map((value) => {
          const isActive = carClass === value;
          const selectable = selectedTracks.every((track) =>
            isCarClassSelectableForTrack(value, track),
          );
          return (
            <button
              key={value}
              type="button"
              onClick={() => selectable && setCarClass(value)}
              disabled={!selectable}
              style={{
                ...styles.classButton,
                ...(isActive ? styles.classButtonActive : null),
                ...(!selectable ? styles.classButtonDisabled : null),
              }}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div style={styles.controlsRow}>
        <RacePresetControls
          presetId={presetId}
          onPresetChange={selectPreset}
          fuelMultiplier={fuelMultiplier}
          tyreMultiplier={tyreMultiplier}
          onFuelMultiplierChange={setFuelMultiplier}
          onTyreMultiplierChange={setTyreMultiplier}
          style={styles.settingsRow}
        />
        <button type="button" onClick={resetAdvisor} style={styles.resetButton}>
          Reset Advisor
        </button>
      </div>

      <div style={styles.trackPanel}>
        <h3 style={styles.trackTitle}>Championship Tracks</h3>
        <p style={styles.trackHint}>
          Select the tracks in your championship calendar.
        </p>
        {selectableTracks.length === 0 ? (
          <p style={styles.trackEmpty}>
            No tracks available for {carClass} in {game.shortLabel}.
          </p>
        ) : (
          <div className="championship-checkbox-grid">
            {selectableTracks.map((track) => {
              const selected = selectedTrackIds.includes(track.id);
              return (
                <label key={track.id} className="championship-checkbox-option">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleTrack(track.id)}
                  />
                  <span className="championship-checkbox-label">
                    {getTrackDisplayName(track)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.bannedPanel}>
        <h3 style={styles.bannedTitle}>Banned Cars (Optional)</h3>
        <p style={styles.bannedHint}>
          Select cars that are not allowed in this championship.
        </p>
        {classCars.length === 0 ? (
          <p style={styles.bannedEmpty}>No cars available for {carClass}.</p>
        ) : (
          <div className="championship-checkbox-grid">
            {classCars.map((car) => {
              const isBanned = bannedCarNames.includes(car.name);
              return (
                <label key={car.id} className="championship-checkbox-option">
                  <input
                    type="checkbox"
                    checked={isBanned}
                    onChange={() => toggleBannedCar(car.name)}
                  />
                  <span className="championship-checkbox-label">{car.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {championshipSummary.length > 0 ? (
        <div style={styles.summaryPanel}>
          <h3 style={styles.summaryTitle}>Championship Summary</h3>
          <div style={styles.summaryTags}>
            {championshipSummary.map((item) => (
              <span key={item} style={styles.summaryTag}>
                {item}
              </span>
            ))}
          </div>
          {selectedTracks.length > 0 ? (
            <div style={styles.drivetrainBlock}>
              <p style={styles.drivetrainTitle}>Drivetrain Rankings</p>
              <div style={styles.drivetrainGrid}>
                {drivetrainRankings.map((item) => (
                  <div key={item.drivetrain} style={styles.drivetrainRow}>
                    <span style={styles.drivetrainLabel}>{item.drivetrain}</span>
                    <span style={styles.drivetrainScore}>{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={styles.analysisPanel}>
        <h3 style={styles.analysisTitle}>Calendar Analysis</h3>
        <div style={styles.analysisGrid}>
          {calendarAnalysis.map((item) => (
            <div key={item.label} style={styles.analysisRow}>
              <span style={styles.analysisLabel}>{item.label}</span>
              <span style={styles.analysisValue}>{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {calendarDNA ? (
        <div style={styles.dnaPanel}>
          <h3 style={styles.dnaTitle}>Calendar DNA</h3>
          <p style={styles.dnaType}>{calendarDNA.championshipType}</p>
          <div style={styles.dnaGrid}>
            <div style={styles.dnaRow}>
              <span style={styles.dnaLabel}>High Speed</span>
              <span style={styles.dnaValue}>{calendarDNA.highSpeed}%</span>
            </div>
            <div style={styles.dnaRow}>
              <span style={styles.dnaLabel}>Technical</span>
              <span style={styles.dnaValue}>{calendarDNA.technical}%</span>
            </div>
            <div style={styles.dnaRow}>
              <span style={styles.dnaLabel}>Stability</span>
              <span style={styles.dnaValue}>{calendarDNA.stability}%</span>
            </div>
            <div style={styles.dnaRow}>
              <span style={styles.dnaLabel}>Tyre Sensitivity</span>
              <span style={styles.dnaValue}>{calendarDNA.tyreSensitivity}%</span>
            </div>
            <div style={styles.dnaRow}>
              <span style={styles.dnaLabel}>Fuel Importance</span>
              <span style={styles.dnaValue}>{calendarDNA.fuelImportance}%</span>
            </div>
          </div>
        </div>
      ) : null}

      <div style={styles.resultsPanel}>
        <h3 style={styles.resultsTitle}>Top 5 Recommendations</h3>
        {allCarsBanned && selectedTrackIds.length > 0 ? (
          <p style={styles.emptyState}>
            No eligible cars available. Remove at least one banned car.
          </p>
        ) : recommendationsWithTrackAnalysis.length === 0 ? (
          <p style={styles.emptyState}>
            {selectableTracks.length === 0
              ? `No ${game?.shortLabel ?? "GT7"} tracks available yet.`
              : calendarRecommendationStatus.message ??
                "Select one or more tracks to generate recommendations."}
          </p>
        ) : (
          <ol style={styles.resultsList}>
            {recommendationsWithTrackAnalysis.map((car) => (
              <li key={car.id} style={styles.resultItem}>
                <div style={styles.resultHeader}>
                  <span style={styles.carName}>{car.name}</span>
                  <div style={styles.resultActions}>
                    <span style={styles.score}>
                      Overall Score: {car.score.toFixed(2)}
                    </span>
                    <ReportIssueButton
                      sourcePage="Championship Advisor"
                      itemName={car.name}
                      defaultIssueType="wrong_recommendation"
                      gameVersion={gameVersion}
                      compact
                    />
                  </div>
                </div>
                {car.trackAnalysis ? (
                  <div style={styles.trackAnalysisBlock}>
                    <p style={styles.trackAnalysisRow}>
                      <span style={styles.trackAnalysisLabel}>Best Track:</span>
                      <span>{car.trackAnalysis.bestTrack.name}</span>
                    </p>
                    <p style={styles.trackAnalysisRow}>
                      <span style={styles.trackAnalysisLabel}>Weakest Track:</span>
                      <span>{car.trackAnalysis.weakestTrack.name}</span>
                    </p>
                    <p style={styles.trackAnalysisDiff}>
                      Score difference: {car.trackAnalysis.scoreDifference.toFixed(2)}
                    </p>
                  </div>
                ) : null}
                <div style={styles.scoreExplain}>
                  <p style={styles.scoreExplainLine}>
                    <span style={styles.scoreExplainLabel}>Technical Fit:</span>{" "}
                    {car.technicalFitScore ?? car.technicalScore ?? car.score}
                  </p>
                  <p style={styles.scoreExplainLine}>
                    <span style={styles.scoreExplainLabel}>Community Confidence:</span>{" "}
                    {car.communityConfidence ?? 60}
                  </p>
                  <p style={styles.scoreExplainLine}>
                    <span style={styles.scoreExplainLabel}>Track Fit:</span>{" "}
                    {car.trackFitScore ?? car.technicalScore ?? car.score}
                  </p>
                </div>
                <div style={styles.whyBlock}>
                  <p style={styles.whyTitle}>Why this car?</p>
                  <ul style={styles.reasonList}>
                    {(car.reasons ?? []).map((reason) => (
                      <li key={`${car.id}-${reason}`} style={styles.reasonItem}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div style={styles.consistencyPanel}>
        <h3 style={styles.consistencyTitle}>Championship Consistency</h3>
        <p style={styles.consistencyExplanation}>
          Higher scores indicate fewer weak tracks across the championship.
        </p>
        {allCarsBanned && selectedTrackIds.length > 0 ? (
          <p style={styles.emptyState}>
            No eligible cars available. Remove at least one banned car.
          </p>
        ) : consistencyRankings.length === 0 ? (
          <p style={styles.emptyState}>
            Select one or more tracks to rank championship consistency.
          </p>
        ) : (
          <ol style={styles.consistencyList}>
            {consistencyRankings.map((car) => (
              <li key={car.id} style={styles.consistencyItem}>
                <span style={styles.carName}>{car.name}</span>
                <div style={styles.resultActions}>
                  <span style={styles.score}>
                    {car.consistencyScore.toFixed(2)}
                  </span>
                  <ReportIssueButton
                    sourcePage="Championship Advisor — Consistency"
                    itemName={car.name}
                    defaultIssueType="wrong_score"
                    gameVersion={gameVersion}
                    compact
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

const styles = {
  shell: {
    background:
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.45), rgba(9, 12, 20, 0.95))",
    border: "1px solid rgba(122, 150, 220, 0.35)",
    borderRadius: "16px",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    padding: "20px",
    maxWidth: "900px",
    margin: "0 auto",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "1.4rem",
    letterSpacing: "0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.95rem",
  },
  gameNotice: {
    margin: "10px 0 0",
    color: "#ffe6a8",
    fontSize: "0.88rem",
    lineHeight: 1.45,
  },
  classRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
  },
  classButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 14px",
  },
  classButtonActive: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderColor: "#77a0ff",
    color: "#ffffff",
  },
  classButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  controlsRow: {
    display: "grid",
    gap: "10px",
    marginBottom: "14px",
  },
  settingsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },
  resetButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "10px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    justifySelf: "start",
    padding: "8px 14px",
  },
  settingLabel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "10px",
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    padding: "10px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  settingInput: {
    width: "100%",
  },
  settingValue: {
    color: "#9bc0ff",
    fontSize: "0.9rem",
  },
  trackPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "12px",
  },
  trackTitle: {
    color: "#e4edff",
    fontSize: "0.98rem",
    margin: "0 0 6px",
  },
  trackHint: {
    color: "rgba(200, 214, 245, 0.85)",
    fontSize: "0.85rem",
    lineHeight: 1.45,
    margin: "0 0 10px",
  },
  trackEmpty: {
    color: "rgba(200, 214, 245, 0.75)",
    fontSize: "0.85rem",
    margin: 0,
  },
  bannedPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "12px",
    marginBottom: "16px",
    padding: "12px",
  },
  bannedTitle: {
    color: "#e4edff",
    fontSize: "0.98rem",
    margin: "0 0 6px",
  },
  bannedHint: {
    color: "rgba(200, 214, 245, 0.85)",
    fontSize: "0.85rem",
    lineHeight: 1.45,
    margin: "0 0 10px",
  },
  bannedEmpty: {
    color: "rgba(200, 214, 245, 0.75)",
    fontSize: "0.85rem",
    margin: 0,
  },
  resultsPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  summaryPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
  },
  summaryTitle: {
    margin: "0 0 8px",
    fontSize: "0.98rem",
    color: "#e4edff",
  },
  summaryTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  summaryTag: {
    border: "1px solid rgba(134, 169, 240, 0.4)",
    background: "rgba(30, 52, 101, 0.45)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "5px 10px",
  },
  drivetrainBlock: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(130, 153, 210, 0.2)",
  },
  drivetrainTitle: {
    margin: "0 0 8px",
    color: "#b8cdff",
    fontSize: "0.84rem",
    fontWeight: 600,
  },
  drivetrainGrid: {
    display: "grid",
    gap: "6px",
  },
  drivetrainRow: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 10px",
  },
  drivetrainLabel: {
    color: "#d6e4ff",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  drivetrainScore: {
    color: "#9bc0ff",
    fontSize: "0.9rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  analysisPanel: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
  },
  analysisTitle: {
    margin: "0 0 10px",
    fontSize: "0.98rem",
    color: "#e4edff",
  },
  analysisGrid: {
    display: "grid",
    gap: "8px",
  },
  analysisRow: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 10px",
  },
  analysisLabel: {
    color: "#d6e4ff",
    fontSize: "0.86rem",
  },
  analysisValue: {
    color: "#9bc0ff",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  dnaPanel: {
    background: "rgba(10, 16, 28, 0.9)",
    border: "1px solid rgba(136, 168, 236, 0.35)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  dnaTitle: {
    margin: "0 0 6px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  dnaType: {
    margin: "0 0 12px",
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  dnaGrid: {
    display: "grid",
    gap: "8px",
  },
  dnaRow: {
    alignItems: "center",
    background: "rgba(22, 34, 58, 0.5)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 10px",
  },
  dnaLabel: {
    color: "#d6e4ff",
    fontSize: "0.86rem",
  },
  dnaValue: {
    color: "#9bc0ff",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  resultsTitle: {
    margin: "0 0 10px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  emptyState: {
    margin: 0,
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
  },
  resultsList: {
    margin: 0,
    paddingLeft: "18px",
    display: "grid",
    gap: "8px",
  },
  resultItem: {
    display: "grid",
    gap: "6px",
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    paddingBottom: "10px",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  resultActions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  carName: {
    color: "#f3f7ff",
  },
  score: {
    color: "#9bc0ff",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  trackAnalysisBlock: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    padding: "8px 10px",
    display: "grid",
    gap: "4px",
  },
  trackAnalysisRow: {
    margin: 0,
    color: "#dce8ff",
    fontSize: "0.84rem",
    display: "flex",
    gap: "6px",
  },
  trackAnalysisLabel: {
    color: "#b8cdff",
    fontWeight: 600,
    minWidth: "108px",
  },
  trackAnalysisDiff: {
    margin: "2px 0 0",
    color: "#9bc0ff",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  scoreExplain: {
    background: "rgba(18, 26, 45, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "2px",
    margin: "0 0 8px",
    padding: "8px 10px",
  },
  scoreExplainLine: {
    color: "#dce8ff",
    fontSize: "0.8rem",
    margin: 0,
  },
  scoreExplainLabel: {
    color: "#9bc0ff",
    fontWeight: 700,
  },
  whyBlock: {
    background: "rgba(18, 26, 45, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    padding: "8px 10px",
  },
  whyTitle: {
    margin: "0 0 4px",
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  reasonList: {
    margin: 0,
    paddingLeft: "16px",
    display: "grid",
    gap: "2px",
  },
  reasonItem: {
    color: "#dce8ff",
    fontSize: "0.84rem",
  },
  consistencyPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    marginTop: "12px",
    padding: "14px",
  },
  consistencyTitle: {
    margin: "0 0 6px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  consistencyExplanation: {
    margin: "0 0 10px",
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
  },
  consistencyList: {
    margin: 0,
    paddingLeft: "18px",
    display: "grid",
    gap: "8px",
  },
  consistencyItem: {
    alignItems: "center",
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: "6px",
  },
};
