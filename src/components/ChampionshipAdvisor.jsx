import { useEffect, useMemo, useRef, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  analyzeCalendarDNA,
  analyzeDrivetrainSuitability,
} from "../engine/championshipEngine.js";
import { calculateChampionshipRecommendation } from "../engine/calculateChampionshipRecommendation.js";
import {
  createCalculationRequestId,
  runCancellableCalculation,
} from "../engine/calculationRunner.js";
import { formatAdvisorDataStatusLine } from "../engine/advisorConfidenceEngine.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import {
  getRecommendableCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  getTracksForGame,
  isGameDataReady,
} from "../utils/gameData.js";
import { filterItemsByNameSearch } from "../utils/listSearch.js";
import { buildRecommendationCacheKey } from "../engine/recommendationCache.js";
import { CAR_CLASS_OPTIONS } from "../data/carClasses.js";
import {
  getCalendarRecommendationStatus,
  isCarClassSelectableForTrack,
} from "../utils/trackClassification.js";
import { TrackSurfaceWarning } from "./TrackSurfaceWarning.jsx";
import RacePresetControls from "./RacePresetControls.jsx";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";
import {
  R79_BTN_ACTIVE,
  R79_BTN_CHIP,
  R79_INNER_PANEL,
  R79_SECTION_TITLE,
} from "../styles/r79Theme.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

export default function ChampionshipAdvisor() {
  const { gameVersion, game } = useGameVersion();
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [carClass, setCarClass] = useState("Gr.3");
  const [bannedCarNames, setBannedCarNames] = useState([]);
  const [trackSearchQuery, setTrackSearchQuery] = useState("");
  const [bopOn, setBopOn] = useState(true);
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
  const filteredSelectableTracks = useMemo(
    () =>
      filterItemsByNameSearch(selectableTracks, trackSearchQuery, (track) =>
        getTrackDisplayName(track),
      ),
    [selectableTracks, trackSearchQuery],
  );
  const [lapInput, setLapInput] = useState("");
  const {
    fuelMultiplier,
    tyreMultiplier,
    setFuelMultiplier,
    setTyreMultiplier,
    resetToPreset,
  } = useRacePresetSettings();
  const effectiveLapCount = useMemo(() => {
    if (lapInput.trim() === "") {
      return undefined;
    }

    const parsed = Number(lapInput);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return Math.max(1, Math.min(999, Math.round(parsed)));
  }, [lapInput]);
  const selectedTracks = useMemo(
    () => allTracks.filter((track) => selectedTrackIds.includes(track.id)),
    [allTracks, selectedTrackIds],
  );

  const [recommendationsWithTrackAnalysis, setRecommendationsWithTrackAnalysis] =
    useState([]);
  const [consistencyRankings, setConsistencyRankings] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [confirmedInputKey, setConfirmedInputKey] = useState(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(/** @type {AbortController | null} */ (null));

  const draftInputKey = useMemo(
    () =>
      buildRecommendationCacheKey("advisor-draft", {
        gameVersion,
        carClass,
        selectedTrackIds: [...selectedTrackIds].sort(),
        fuelMultiplier,
        tyreMultiplier,
        lapCount: effectiveLapCount ?? null,
        bopOn,
        bannedCarNames: [...bannedCarNames].sort(),
      }),
    [
      gameVersion,
      carClass,
      selectedTrackIds,
      fuelMultiplier,
      tyreMultiplier,
      effectiveLapCount,
      bopOn,
      bannedCarNames,
    ],
  );

  const inputsChanged =
    confirmedInputKey != null &&
    confirmedInputKey !== draftInputKey &&
    !isGenerating;

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
        bopOn ? "BOP On" : "BOP Off",
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

    if (effectiveLapCount) {
      labels.push(`${effectiveLapCount} Laps`);
    }
    labels.push(`Fuel Multiplier x${fuelMultiplier}`);
    labels.push(`Tyre Multiplier x${tyreMultiplier}`);
    labels.push(bopOn ? "BOP On" : "BOP Off");

    return Array.from(new Set(labels));
  }, [
    selectedTracks,
    fuelMultiplier,
    tyreMultiplier,
    effectiveLapCount,
    bopOn,
  ]);

  const drivetrainRankings = useMemo(
    () => analyzeDrivetrainSuitability(selectedTracks),
    [selectedTracks],
  );

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
    abortRef.current?.abort();
    requestIdRef.current = createCalculationRequestId();
    setSelectedTrackIds([]);
    setBannedCarNames([]);
    setCarClass("Gr.3");
    setLapInput("");
    setBopOn(true);
    resetToPreset("custom");
    setRecommendationsWithTrackAnalysis([]);
    setConsistencyRankings([]);
    setConfirmedInputKey(null);
    setGenerationError(null);
    setIsGenerating(false);
  };

  const generateRecommendations = async () => {
    if (isGenerating) {
      return;
    }

    if (selectedTrackIds.length === 0) {
      setGenerationError("Select one or more tracks before generating recommendations.");
      return;
    }

    if (allCarsBanned) {
      setGenerationError("No eligible cars available. Remove at least one banned car.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = createCalculationRequestId();
    requestIdRef.current = requestId;

    const inputSnapshot = {
      selectedTrackIds: [...selectedTrackIds],
      carClass,
      fuelMultiplier,
      tyreMultiplier,
      lapCount: effectiveLapCount,
      bopOn,
      bannedCarNames: [...bannedCarNames],
      gameVersion,
    };
    const snapshotKey = draftInputKey;

    setIsGenerating(true);
    setGenerationError(null);

    const outcome = await runCancellableCalculation({
      requestId,
      isCurrent: (id) => id === requestIdRef.current,
      signal: controller.signal,
      compute: () => calculateChampionshipRecommendation(inputSnapshot),
    });

    if (!outcome.ok) {
      if (outcome.reason === "cancelled") {
        return;
      }
      setIsGenerating(false);
      setGenerationError(
        "Recommendation calculation failed. Check your inputs and try again.",
      );
      return;
    }

    setRecommendationsWithTrackAnalysis(outcome.value.rankings);
    setConsistencyRankings(outcome.value.consistencyRankings);
    setConfirmedInputKey(snapshotKey);
    setIsGenerating(false);
    if (outcome.value.warnings?.length && outcome.value.rankings.length === 0) {
      setGenerationError(outcome.value.warnings[0]);
    }
  };

  return (
    <section className="r79-page">
      <R79PageHeader
        title="Championship Advisor"
        subtitle={`Select tracks and class to get the strongest championship car for ${game.shortLabel}.`}
      >
        {!isGameDataReady(gameVersion) ? (
          <p className="r79-notice">
            {game.shortLabel} car and track data is not available yet. Populate{" "}
            <code>src/data/gt8/</code> to enable recommendations.
          </p>
        ) : null}
      </R79PageHeader>

      <p className="r79-advisor-data-status">{formatAdvisorDataStatusLine()}</p>

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
          lapsOnly
          lapInput={lapInput}
          onLapInputChange={setLapInput}
          fuelMultiplier={fuelMultiplier}
          tyreMultiplier={tyreMultiplier}
          onFuelMultiplierChange={setFuelMultiplier}
          onTyreMultiplierChange={setTyreMultiplier}
          style={styles.settingsRow}
        />
        <div style={styles.bopRow}>
          <span style={styles.bopLabel}>BOP</span>
          <div className="r79-wheel-chip-row">
            <button
              type="button"
              className={bopOn ? "r79-wheel-chip r79-wheel-chip--active" : "r79-wheel-chip"}
              onClick={() => setBopOn(true)}
            >
              On
            </button>
            <button
              type="button"
              className={!bopOn ? "r79-wheel-chip r79-wheel-chip--active" : "r79-wheel-chip"}
              onClick={() => setBopOn(false)}
            >
              Off
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={generateRecommendations}
          className="r79-btn-primary"
          disabled={isGenerating || selectedTrackIds.length === 0}
        >
          {isGenerating ? "Generating…" : "Generate Recommendations"}
        </button>
        <button type="button" onClick={resetAdvisor} className="r79-btn-secondary">
          Reset Advisor
        </button>
      </div>

      {inputsChanged ? (
        <p className="r79-notice r79-notice--wide" style={styles.inputsChangedNotice}>
          Inputs changed since the last result. Press Generate Recommendations to update.
        </p>
      ) : null}

      <div className="r79-card" style={styles.trackPanel}>
        <h3 style={styles.trackTitle}>Championship Tracks</h3>
        <p style={styles.trackHint}>
          Select the tracks in your championship calendar.
        </p>
        <label className="r79-wheel-search r79-wheel-car-search" style={styles.trackSearch}>
          <span className="r79-wheel-search__label">Search tracks</span>
          <span className="r79-wheel-search__shell">
            <input
              type="search"
              value={trackSearchQuery}
              onChange={(event) => setTrackSearchQuery(event.target.value)}
              placeholder="e.g. Fuji, Spa, Monza"
              className="r79-wheel-search-input"
              aria-label="Search championship tracks"
            />
          </span>
        </label>
        {selectableTracks.length === 0 ? (
          <p style={styles.trackEmpty}>
            No tracks available for {carClass} in {game.shortLabel}.
          </p>
        ) : (
          <div className="championship-checkbox-grid">
            {filteredSelectableTracks.map((track) => {
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

      <div className="r79-card" style={styles.bannedPanel}>
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
        <details className="r79-details">
          <summary>
            How are these recommendations chosen?
          </summary>
          <p>
            R79 evaluates every eligible car independently against your confirmed
            championship inputs — selected tracks, BOP mode, fuel wear, tyre wear
            and lap count. Press Generate Recommendations after adjusting inputs.
            Track suitability is primary; community confidence and historical
            evidence adjust confidence, not raw performance.
          </p>
        </details>
        {isGenerating ? (
          <p style={styles.emptyState}>Calculating recommendations…</p>
        ) : null}
        {generationError && !isGenerating ? (
          <div style={styles.errorBlock}>
            <p style={styles.emptyState}>{generationError}</p>
            <button
              type="button"
              className="r79-btn-secondary"
              onClick={generateRecommendations}
            >
              Retry
            </button>
          </div>
        ) : null}
        {allCarsBanned && selectedTrackIds.length > 0 ? (
          <p style={styles.emptyState}>
            No eligible cars available. Remove at least one banned car.
          </p>
        ) : !isGenerating &&
          !generationError &&
          recommendationsWithTrackAnalysis.length === 0 ? (
          <p style={styles.emptyState}>
            {selectableTracks.length === 0
              ? `No ${game?.shortLabel ?? "GT7"} tracks available yet.`
              : calendarRecommendationStatus.message ??
                "Select tracks, adjust race conditions, then press Generate Recommendations."}
          </p>
        ) : !isGenerating && recommendationsWithTrackAnalysis.length > 0 ? (
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
                    {car.communityConfidence ?? "—"}
                  </p>
                  <p style={styles.scoreExplainLine}>
                    <span style={styles.scoreExplainLabel}>Track Fit:</span>{" "}
                    {car.trackFitScore ?? car.technicalScore ?? car.score}
                  </p>
                  {car.raceConditionFitScore != null ? (
                    <p style={styles.scoreExplainLine}>
                      <span style={styles.scoreExplainLabel}>Race Condition Fit:</span>{" "}
                      {car.raceConditionFitScore}
                    </p>
                  ) : null}
                  {car.advisorConfidence ? (
                    <p style={styles.scoreExplainLine}>
                      <span style={styles.scoreExplainLabel}>Confidence:</span>{" "}
                      {car.advisorConfidence.label}
                    </p>
                  ) : null}
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
        ) : null}
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
        ) : isGenerating ? (
          <p style={styles.emptyState}>Calculating consistency…</p>
        ) : consistencyRankings.length === 0 ? (
          <p style={styles.emptyState}>
            Generate recommendations to see championship consistency rankings.
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
  classRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
  },
  classButton: R79_BTN_CHIP,
  classButtonActive: R79_BTN_ACTIVE,
  classButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  controlsRow: {
    display: "grid",
    gap: "10px",
    marginBottom: "14px",
  },
  bopRow: {
    display: "grid",
    gap: "6px",
  },
  bopLabel: {
    color: "rgba(200, 214, 245, 0.9)",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  inputsChangedNotice: {
    marginBottom: "12px",
  },
  errorBlock: {
    display: "grid",
    gap: "10px",
    justifyItems: "start",
  },
  settingsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },
  settingLabel: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
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
    ...R79_INNER_PANEL,
    marginBottom: "14px",
    padding: "14px",
  },
  trackTitle: {
    ...R79_SECTION_TITLE,
    fontSize: "0.98rem",
    margin: "0 0 8px",
  },
  trackHint: {
    color: "rgba(200, 214, 245, 0.85)",
    fontSize: "0.85rem",
    lineHeight: 1.45,
    margin: "0 0 10px",
  },
  trackSearch: {
    display: "block",
    marginBottom: "12px",
  },
  trackEmpty: {
    color: "rgba(200, 214, 245, 0.75)",
    fontSize: "0.85rem",
    margin: 0,
  },
  bannedPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "14px",
    padding: "14px",
  },
  bannedTitle: {
    ...R79_SECTION_TITLE,
    fontSize: "0.98rem",
    margin: "0 0 8px",
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
    ...R79_INNER_PANEL,
    padding: "16px",
  },
  summaryPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "14px",
    padding: "14px",
  },
  summaryTitle: {
    ...R79_SECTION_TITLE,
    fontSize: "0.98rem",
    margin: "0 0 10px",
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
    ...R79_INNER_PANEL,
    marginBottom: "14px",
    padding: "14px",
  },
  analysisTitle: {
    ...R79_SECTION_TITLE,
    fontSize: "0.98rem",
    margin: "0 0 10px",
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
    ...R79_INNER_PANEL,
    marginBottom: "14px",
    padding: "16px",
  },
  dnaTitle: {
    ...R79_SECTION_TITLE,
    margin: "0 0 8px",
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
  resultsTitle: R79_SECTION_TITLE,
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
    ...R79_INNER_PANEL,
    marginTop: "14px",
    padding: "16px",
  },
  consistencyTitle: R79_SECTION_TITLE,
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
