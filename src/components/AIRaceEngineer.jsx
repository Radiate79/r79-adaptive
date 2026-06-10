import { useEffect, useMemo, useState } from "react";
import { AI_ENGINEER_FOOTER_LINES } from "../data/brandingMeta.js";
import { GAME_CATALOG } from "../data/gameVersions.js";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  analyzeAIRaceEngineer,
  DRIVER_STYLE_OPTIONS,
  ENGINEER_NOTES,
  TYRE_COMPOUND_OPTIONS,
  WEATHER_OPTIONS,
} from "../engine/aiRaceEngineerEngine.js";
import {
  addRaceFeedbackEntry,
  formatRaceFeedbackDate,
  getRecommendationHelpLabel,
  loadRaceFeedbackEntriesNewestFirst,
  RECOMMENDATION_HELP_OPTIONS,
} from "../utils/aiRaceFeedbackStorage.js";
import { PERSONALISATION_STATUS } from "../data/driverProfile.js";
import { loadDriverProfile } from "../utils/driverProfileStorage.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import {
  getRecommendableCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  getTracksForGame,
  isGameDataReady,
} from "../utils/gameData.js";
import { TrackSurfaceWarning } from "./TrackSurfaceWarning.jsx";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";
import {
  R79_BTN_ACTIVE,
  R79_BTN_CHIP,
  R79_SECTION_TITLE,
} from "../styles/r79Theme.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

function ConfidenceMeter({ value }) {
  return (
    <div style={styles.confidenceBlock}>
      <div style={styles.confidenceHeader}>
        <span style={styles.confidenceLabel}>Confidence Score</span>
        <span style={styles.confidenceValue}>{value}/100</span>
      </div>
      <div style={styles.confidenceTrack}>
        <div
          style={{
            ...styles.confidenceFill,
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * @param {{ onOpenWheelSettings?: (prefill: {
 *   gameVersion: string,
 *   wheelBase?: string,
 *   carId: string,
 *   trackId: string,
 *   tyreCompound?: string,
 *   bopOn?: boolean,
 * }) => void }} props
 */
export default function AIRaceEngineer({ onOpenWheelSettings }) {
  const { gameVersion, setGameVersion, gameOptions, game } = useGameVersion();
  const allTracks = useMemo(() => getTracksForGame(gameVersion), [gameVersion]);
  const selectableTracks = useMemo(
    () => getSelectableTracksForClass(gameVersion, "Gr.3"),
    [gameVersion],
  );
  const cars = useMemo(
    () => getRecommendableCarsForGame(gameVersion),
    [gameVersion],
  );

  const [trackId, setTrackId] = useState("");
  const [lapInput, setLapInput] = useState("");
  const {
    fuelMultiplier,
    tyreMultiplier,
    setFuelMultiplier,
    setTyreMultiplier,
    raceSettings,
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
  const [weather, setWeather] = useState("current");
  const [bopOn, setBopOn] = useState(true);
  const [tyresAvailable, setTyresAvailable] = useState(["M", "H", "S"]);
  const [availableCarIds, setAvailableCarIds] = useState([]);
  const [driverStyle, setDriverStyle] = useState("balanced");
  const driverProfile = useMemo(() => loadDriverProfile(), []);
  const [feedbackEntries, setFeedbackEntries] = useState(() =>
    loadRaceFeedbackEntriesNewestFirst(),
  );
  const [finishedPosition, setFinishedPosition] = useState("");
  const [fastestLap, setFastestLap] = useState("");
  const [carUsed, setCarUsed] = useState("");
  const [tyresUsed, setTyresUsed] = useState("M");
  const [pitStrategyUsed, setPitStrategyUsed] = useState("");
  const [fuelLeft, setFuelLeft] = useState("");
  const [tyreWearNotes, setTyreWearNotes] = useState("");
  const [recommendationHelpful, setRecommendationHelpful] = useState("partly");
  const [driverNotes, setDriverNotes] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const analysis = useMemo(
    () =>
      analyzeAIRaceEngineer({
        gameVersion,
        trackId,
        ...raceSettings,
        lapCount: effectiveLapCount,
        weather,
        bopOn,
        tyresAvailable,
        availableCarIds,
        driverStyle,
        driverProfile,
      }),
    [
      gameVersion,
      trackId,
      raceSettings,
      effectiveLapCount,
      weather,
      bopOn,
      tyresAvailable,
      availableCarIds,
      driverStyle,
      driverProfile,
    ],
  );

  const toggleTyre = (compound) => {
    setTyresAvailable((current) =>
      current.includes(compound)
        ? current.filter((value) => value !== compound)
        : [...current, compound],
    );
  };

  const toggleCar = (carId) => {
    setAvailableCarIds((current) =>
      current.includes(carId)
        ? current.filter((id) => id !== carId)
        : [...current, carId],
    );
  };

  const selectedTrack =
    allTracks.find((track) => track.id === trackId) ?? null;

  useEffect(() => {
    if (!trackId) {
      return;
    }

    if (!selectableTracks.some((track) => track.id === trackId)) {
      setTrackId("");
    }
  }, [trackId, selectableTracks]);

  useEffect(() => {
    if (!analysis.ready || !analysis.recommendedCar) {
      return;
    }

    setCarUsed(analysis.recommendedCar.name);
    setTyresUsed(analysis.recommendedCar.recommendedCompound ?? "M");
    setPitStrategyUsed(analysis.pitWindow ?? "");
    setFeedbackMessage("");
  }, [
    analysis.ready,
    analysis.recommendedCar?.id,
    analysis.recommendedCar?.recommendedCompound,
    analysis.pitWindow,
    trackId,
  ]);

  const resetFeedbackForm = () => {
    setFinishedPosition("");
    setFastestLap("");
    setTyreWearNotes("");
    setFuelLeft("");
    setDriverNotes("");
    setRecommendationHelpful("partly");
    setFeedbackMessage("");

    if (analysis.ready && analysis.recommendedCar) {
      setCarUsed(analysis.recommendedCar.name);
      setTyresUsed(analysis.recommendedCar.recommendedCompound ?? "M");
      setPitStrategyUsed(analysis.pitWindow ?? "");
    }
  };

  const handleSaveFeedback = () => {
    if (!analysis.ready || !analysis.recommendedCar || !analysis.track) {
      setFeedbackMessage("Generate a recommendation before saving feedback.");
      return;
    }

    const saved = addRaceFeedbackEntry({
      recommendation: {
        trackId: analysis.track.id,
        trackName: analysis.track.name,
        recommendedCarId: analysis.recommendedCar.id,
        recommendedCarName: analysis.recommendedCar.name,
        confidenceScore: analysis.confidenceScore,
        gameVersion,
        driverStyle: analysis.raceContext.driverStyle,
      },
      finishedPosition,
      fastestLap,
      carUsed,
      tyresUsed,
      pitStrategyUsed,
      fuelLeft,
      tyreWearNotes,
      recommendationHelpful,
      driverNotes,
    });

    if (!saved) {
      setFeedbackMessage("Could not save feedback.");
      return;
    }

    setFeedbackEntries(loadRaceFeedbackEntriesNewestFirst());
    setFeedbackMessage("Race feedback saved to Learning Mode.");
    resetFeedbackForm();
  };

  return (
    <section className="r79-page r79-page--wide">
      <R79PageHeader
        title="AI Race Engineer"
        subtitle="AI-assisted race recommendations using R79 car, track and historical ranking data."
      >
        <span style={styles.experimentalBadge}>Experimental</span>
        <p style={styles.personalisationLine}>
          {analysis.personalisation?.label ?? PERSONALISATION_STATUS.label}
        </p>
        {!isGameDataReady(gameVersion) ? (
          <p className="r79-notice">
            {game.shortLabel} data is not fully available yet. GT8 architecture is
            ready — populate <code>src/data/gt8/</code> for full recommendations.
          </p>
        ) : null}
      </R79PageHeader>

      <TrackSurfaceWarning
        warning={analysis.recommendationStatus?.warning}
        message={analysis.recommendationStatus?.message}
      />

      {analysis.wheelSetupMatch?.setup ? (
        <div style={styles.wheelSetupBanner}>
          <p style={styles.wheelSetupBannerText}>
            Recommended Wheel Settings available
            {analysis.wheelSetupMatch.setup.isStarter
              ? " (Starter Setup)"
              : ""}
          </p>
          <button
            type="button"
            onClick={() =>
              onOpenWheelSettings?.({
                gameVersion,
                wheelBase: analysis.wheelSetupMatch.setup.wheelBase,
                carId: analysis.wheelSetupMatch.setup.carId,
                trackId: analysis.wheelSetupMatch.setup.trackId,
                tyreCompound: analysis.wheelSetupMatch.setup.tyreCompound,
                bopOn: analysis.wheelSetupMatch.setup.bopOn,
              })
            }
            style={styles.wheelSetupLink}
          >
            Open Wheel Settings Hub
          </button>
        </div>
      ) : null}

      <div style={styles.dashboardGrid}>
        <div className="r79-card" style={styles.inputPanel}>
          <h3 style={styles.panelTitle}>Race Inputs</h3>

          <label style={styles.fieldLabel}>
            Game
            <div style={styles.toggleRow}>
              {gameOptions.map((version) => {
                const entry = GAME_CATALOG[version];
                const isActive = gameVersion === version;
                return (
                  <button
                    key={version}
                    type="button"
                    onClick={() => setGameVersion(version)}
                    style={{
                      ...styles.toggleButton,
                      ...(isActive ? styles.toggleButtonActive : null),
                    }}
                  >
                    {entry.shortLabel}
                  </button>
                );
              })}
            </div>
          </label>

          <label style={styles.fieldLabel}>
            Track
              <select
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                style={styles.select}
              >
                <option value="">Select a track…</option>
                {selectableTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {getTrackDisplayName(track)}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.fieldLabel}>
            Laps
            <input
              type="text"
              inputMode="numeric"
              value={lapInput}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "" || /^\d{1,3}$/.test(value)) {
                  setLapInput(value);
                }
              }}
              placeholder="Enter laps"
              style={styles.select}
            />
          </label>

          <label style={styles.fieldLabel}>
            Tyre wear multiplier
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={tyreMultiplier}
              onChange={(event) =>
                setTyreMultiplier(Number(event.target.value))
              }
              style={styles.range}
            />
            <span style={styles.rangeValue}>x{tyreMultiplier}</span>
          </label>

          <label style={styles.fieldLabel}>
            Fuel wear multiplier
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={fuelMultiplier}
              onChange={(event) =>
                setFuelMultiplier(Number(event.target.value))
              }
              style={styles.range}
            />
            <span style={styles.rangeValue}>x{fuelMultiplier}</span>
          </label>

          <label style={styles.fieldLabel}>
            Weather
              <select
                value={weather}
                onChange={(event) => setWeather(event.target.value)}
                style={styles.select}
              >
                {WEATHER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.fieldLabel}>
            BOP
            <div style={styles.toggleRow}>
              <button
                type="button"
                onClick={() => setBopOn(true)}
                style={{
                  ...styles.toggleButton,
                  ...(bopOn ? styles.toggleButtonActive : null),
                }}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => setBopOn(false)}
                style={{
                  ...styles.toggleButton,
                  ...(!bopOn ? styles.toggleButtonActive : null),
                }}
              >
                Off
              </button>
            </div>
          </label>

          <label style={styles.fieldLabel}>
            Tyres Available
            <div style={styles.chipRow}>
              {TYRE_COMPOUND_OPTIONS.map((compound) => {
                const isActive = tyresAvailable.includes(compound);
                return (
                  <button
                    key={compound}
                    type="button"
                    onClick={() => toggleTyre(compound)}
                    style={{
                      ...styles.chip,
                      ...(isActive ? styles.chipActive : null),
                    }}
                  >
                    {compound}
                  </button>
                );
              })}
            </div>
          </label>

          <label style={styles.fieldLabel}>
            Driver Style
            <div style={styles.styleGrid}>
              {DRIVER_STYLE_OPTIONS.map((option) => {
                const isActive = driverStyle === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDriverStyle(option.id)}
                    style={{
                      ...styles.styleChip,
                      ...(isActive ? styles.styleChipActive : null),
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </label>

          <label style={styles.fieldLabel}>
            Available Cars
            <p style={styles.fieldHint}>
              Select cars you can use. Leave empty to consider the full database.
            </p>
            <div style={styles.carPicker}>
              {cars.map((car) => {
                const isActive = availableCarIds.includes(car.id);
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => toggleCar(car.id)}
                    style={{
                      ...styles.carChip,
                      ...(isActive ? styles.carChipActive : null),
                    }}
                  >
                    {car.name}
                  </button>
                );
              })}
            </div>
          </label>
        </div>
      </div>

      {!analysis.ready || !analysis.recommendedCar ? (
        <div style={styles.awaitingReport}>
          <p style={styles.emptyState}>
            {!selectedTrack
              ? "Select a track to generate your engineer report."
              : analysis.recommendationStatus?.message ??
                "Preparing engineer report…"}
          </p>
        </div>
      ) : (
        <>
          <article style={styles.engineerReportCard}>
            <div style={styles.reportHeader}>
              <div>
                <p style={styles.reportEyebrow}>R79 AI Race Engineer</p>
                <h3 style={styles.reportTitle}>Engineer Report</h3>
              </div>
              <div style={styles.reportMetaBlock}>
                <span style={styles.reportMetaItem}>
                  Track: {getTrackDisplayName(analysis.track)}
                </span>
                <span style={styles.reportMetaItem}>
                  Distance: {analysis.raceContext.raceDistanceLabel}
                </span>
                <span style={styles.reportMetaItem}>
                  Driving Style: {analysis.raceContext.driverStyle}
                </span>
                <span style={styles.reportMetaConfidence}>
                  Confidence: {analysis.confidenceScore}%
                </span>
              </div>
            </div>

            {analysis.engineerReportSections ? (
              <>
                <div style={styles.reportSummaryBlock}>
                  <h4 style={styles.reportSectionHeading}>Summary</h4>
                  <p style={styles.reportSummaryText}>
                    {analysis.engineerReportSections.summary}
                  </p>
                </div>

                <div style={styles.reportSectionsGrid}>
                  <ReportSection
                    title="Why this car?"
                    items={analysis.engineerReportSections.whyThisCar}
                  />
                  <ReportSection
                    title="Strengths"
                    items={analysis.engineerReportSections.strengths}
                  />
                  <ReportSection
                    title="Weaknesses"
                    items={analysis.engineerReportSections.weaknesses}
                  />
                  <ReportSection
                    title="Tyre Recommendation"
                    text={analysis.engineerReportSections.tyreRecommendation}
                  />
                  <ReportSection
                    title="Fuel Strategy"
                    text={analysis.engineerReportSections.fuelStrategy}
                  />
                  <ReportSection
                    title="Strategy Notes"
                    items={analysis.engineerReportSections.strategyNotes}
                  />
                </div>
              </>
            ) : null}
          </article>

          <section style={styles.detailSection}>
            <div style={styles.detailSectionHeader}>
              <h3 style={styles.detailSectionTitle}>Detailed Recommendations</h3>
              <ReportIssueButton
                sourcePage="AI Race Engineer"
                itemName={analysis.recommendedCar.name}
                defaultIssueType="wrong_recommendation"
                gameVersion={gameVersion}
                compact
              />
            </div>
            <div style={styles.detailGrid}>
              <OutputRow
                icon="🏎"
                label="Recommended Car"
                value={analysis.recommendedCar.name}
                highlight
              />
              <OutputRow
                icon="🌐"
                label="Community Confidence"
                value={`${analysis.recommendedCar.communityConfidence ?? 60}/100`}
              />
              <OutputRow
                icon="⚖"
                label="Recommended Brake Balance"
                value={analysis.brakeBalance}
              />
              <OutputRow
                icon="🛞"
                label="Recommended Wheel Settings"
                value={analysis.wheelSettings}
              />
              <OutputRow
                icon="⏱"
                label="Recommended Pit Window"
                value={analysis.pitWindow}
              />
            </div>

            <div style={styles.reasoningPanel}>
              <h4 style={styles.reasoningTitle}>🧠 AI Reasoning</h4>
              <ul style={styles.reasoningList}>
                {(analysis.aiReasoning ?? []).map((line) => (
                  <li key={line} style={styles.reasoningItem}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {analysis.alternativeChoice ? (
            <div style={styles.summaryCard}>
              <div style={styles.summaryCardHeader}>
                <h3 style={styles.panelTitle}>Alternative Choice</h3>
                <ReportIssueButton
                  sourcePage="AI Race Engineer — Alternative"
                  itemName={analysis.alternativeChoice.car.name}
                  defaultIssueType="wrong_recommendation"
                  gameVersion={gameVersion}
                  compact
                />
              </div>
              <p style={styles.summaryText}>
                <strong>{analysis.alternativeChoice.car.name}</strong> —{" "}
                {analysis.alternativeChoice.summary}
              </p>
              <ul style={styles.reasoningList}>
                {(analysis.alternativeChoice.reasoning ?? []).map((line) => (
                  <li key={line} style={styles.reasoningItem}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div style={styles.engineerNotesCard}>
            <h3 style={styles.panelTitle}>Engineer Notes</h3>
            <div style={styles.engineerNotesBody}>
              {ENGINEER_NOTES.map((line, index) => (
                <p
                  key={line}
                  style={{
                    ...styles.engineerNotesLine,
                    ...(index >= 2 ? styles.engineerNotesMotto : null),
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <LearningModeFeedback
            cars={cars}
            finishedPosition={finishedPosition}
            fastestLap={fastestLap}
            carUsed={carUsed}
            tyresUsed={tyresUsed}
            pitStrategyUsed={pitStrategyUsed}
            fuelLeft={fuelLeft}
            tyreWearNotes={tyreWearNotes}
            recommendationHelpful={recommendationHelpful}
            driverNotes={driverNotes}
            feedbackMessage={feedbackMessage}
            onFinishedPositionChange={setFinishedPosition}
            onFastestLapChange={setFastestLap}
            onCarUsedChange={setCarUsed}
            onTyresUsedChange={setTyresUsed}
            onPitStrategyUsedChange={setPitStrategyUsed}
            onFuelLeftChange={setFuelLeft}
            onTyreWearNotesChange={setTyreWearNotes}
            onRecommendationHelpfulChange={setRecommendationHelpful}
            onDriverNotesChange={setDriverNotes}
            onSave={handleSaveFeedback}
          />
        </>
      )}

      <RaceFeedbackHistory entries={feedbackEntries} />

      <footer style={styles.footer}>
        {AI_ENGINEER_FOOTER_LINES.map((line, index) => (
          <p
            key={line}
            style={
              index === 0
                ? styles.footerMeta
                : index === 1
                  ? styles.footerTagline
                  : styles.footerLine
            }
          >
            {line}
          </p>
        ))}
      </footer>
    </section>
  );
}

function LearningModeFeedback({
  cars,
  finishedPosition,
  fastestLap,
  carUsed,
  tyresUsed,
  pitStrategyUsed,
  fuelLeft,
  tyreWearNotes,
  recommendationHelpful,
  driverNotes,
  feedbackMessage,
  onFinishedPositionChange,
  onFastestLapChange,
  onCarUsedChange,
  onTyresUsedChange,
  onPitStrategyUsedChange,
  onFuelLeftChange,
  onTyreWearNotesChange,
  onRecommendationHelpfulChange,
  onDriverNotesChange,
  onSave,
}) {
  return (
    <div style={styles.learningCard}>
      <div style={styles.learningHeader}>
        <h3 style={styles.panelTitle}>Learning Mode</h3>
        <span style={styles.learningBadge}>Collect feedback</span>
      </div>
      <p style={styles.learningIntro}>
        Record how the race unfolded. Feedback is stored locally and will support
        future learning — recommendation logic is unchanged for now.
      </p>

      <div style={styles.feedbackGrid}>
        <label style={styles.fieldLabel}>
          Finished Position
          <input
            type="text"
            value={finishedPosition}
            onChange={(event) => onFinishedPositionChange(event.target.value)}
            placeholder="e.g. P3"
            style={styles.textInput}
          />
        </label>

        <label style={styles.fieldLabel}>
          Fastest Lap
          <input
            type="text"
            value={fastestLap}
            onChange={(event) => onFastestLapChange(event.target.value)}
            placeholder="e.g. 1:42.318"
            style={styles.textInput}
          />
        </label>

        <label style={styles.fieldLabel}>
          Car Used
            <select
              value={carUsed}
              onChange={(event) => onCarUsedChange(event.target.value)}
              style={styles.select}
            >
              <option value="">Select car…</option>
              {cars.map((car) => (
                <option key={car.id} value={car.name}>
                  {car.name}
                </option>
              ))}
            </select>
        </label>

        <label style={styles.fieldLabel}>
          Tyres Used
            <select
              value={tyresUsed}
              onChange={(event) => onTyresUsedChange(event.target.value)}
              style={styles.select}
            >
              {TYRE_COMPOUND_OPTIONS.map((compound) => (
                <option key={compound} value={compound}>
                  {compound}
                </option>
              ))}
            </select>
        </label>

        <label style={{ ...styles.fieldLabel, ...styles.feedbackFieldWide }}>
          Pit Strategy Used
          <textarea
            value={pitStrategyUsed}
            onChange={(event) => onPitStrategyUsedChange(event.target.value)}
            placeholder="e.g. One stop, lap 16 — Medium to Hard"
            rows={2}
            style={styles.textarea}
          />
        </label>

        <label style={styles.fieldLabel}>
          Fuel Left
          <input
            type="text"
            value={fuelLeft}
            onChange={(event) => onFuelLeftChange(event.target.value)}
            placeholder="e.g. 1.2 laps"
            style={styles.textInput}
          />
        </label>

        <label style={{ ...styles.fieldLabel, ...styles.feedbackFieldWide }}>
          Tyre Wear Notes
          <textarea
            value={tyreWearNotes}
            onChange={(event) => onTyreWearNotesChange(event.target.value)}
            placeholder="e.g. Fronts overheated after lap 8"
            rows={2}
            style={styles.textarea}
          />
        </label>

        <div style={{ ...styles.fieldLabel, ...styles.feedbackFieldWide }}>
          Did the recommendation help?
          <div style={styles.toggleRow}>
            {RECOMMENDATION_HELP_OPTIONS.map((option) => {
              const isActive = recommendationHelpful === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onRecommendationHelpfulChange(option.id)}
                  style={{
                    ...styles.toggleButton,
                    ...(isActive ? styles.toggleButtonActive : null),
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label style={{ ...styles.fieldLabel, ...styles.feedbackFieldWide }}>
          Driver Notes
          <textarea
            value={driverNotes}
            onChange={(event) => onDriverNotesChange(event.target.value)}
            placeholder="Anything else worth remembering from this race…"
            rows={3}
            style={styles.textarea}
          />
        </label>
      </div>

      {feedbackMessage ? (
        <p style={styles.feedbackMessage}>{feedbackMessage}</p>
      ) : null}

      <button type="button" onClick={onSave} style={styles.saveFeedbackButton}>
        Save Race Feedback
      </button>
    </div>
  );
}

function RaceFeedbackHistory({ entries }) {
  return (
    <section style={styles.historyCard}>
      <h3 style={styles.panelTitle}>Race Feedback History</h3>
      <p style={styles.historyIntro}>
        Locally saved sessions from Learning Mode, newest first.
      </p>

      {entries.length === 0 ? (
        <p style={styles.emptyState}>No race feedback saved yet.</p>
      ) : (
        <div style={styles.historyList}>
          {entries.map((entry) => (
            <article key={entry.id} style={styles.historyItem}>
              <div style={styles.historyItemHeader}>
                <div>
                  <p style={styles.historyDate}>
                    {formatRaceFeedbackDate(entry.createdAt)}
                  </p>
                  <h4 style={styles.historyTrack}>{entry.recommendation.trackName}</h4>
                </div>
                <span
                  style={{
                    ...styles.historyHelpBadge,
                    ...(entry.recommendationHelpful === "yes"
                      ? styles.historyHelpYes
                      : entry.recommendationHelpful === "no"
                        ? styles.historyHelpNo
                        : styles.historyHelpPartly),
                  }}
                >
                  {getRecommendationHelpLabel(entry.recommendationHelpful)}
                </span>
              </div>

              <div style={styles.historyMetaGrid}>
                <HistoryMeta label="Recommended" value={entry.recommendation.recommendedCarName} />
                <HistoryMeta label="Car Used" value={entry.carUsed || "—"} />
                <HistoryMeta label="Position" value={entry.finishedPosition || "—"} />
                <HistoryMeta label="Fastest Lap" value={entry.fastestLap || "—"} />
                <HistoryMeta label="Tyres" value={entry.tyresUsed || "—"} />
                <HistoryMeta label="Fuel Left" value={entry.fuelLeft || "—"} />
              </div>

              {entry.pitStrategyUsed ? (
                <p style={styles.historyDetail}>
                  <strong>Pit strategy:</strong> {entry.pitStrategyUsed}
                </p>
              ) : null}
              {entry.tyreWearNotes ? (
                <p style={styles.historyDetail}>
                  <strong>Tyre wear:</strong> {entry.tyreWearNotes}
                </p>
              ) : null}
              {entry.driverNotes ? (
                <p style={styles.historyDetail}>
                  <strong>Driver notes:</strong> {entry.driverNotes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryMeta({ label, value }) {
  return (
    <div style={styles.historyMetaItem}>
      <span style={styles.historyMetaLabel}>{label}</span>
      <span style={styles.historyMetaValue}>{value}</span>
    </div>
  );
}

function ReportSection({ title, items, text }) {
  return (
    <div style={styles.reportSectionCard}>
      <h4 style={styles.reportSectionHeading}>{title}</h4>
      {text ? (
        <p style={styles.reportSectionText}>{text}</p>
      ) : (
        <ul style={styles.reportSectionList}>
          {(items ?? []).map((item) => (
            <li key={item} style={styles.reportSectionItem}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OutputRow({ icon, label, value, highlight = false }) {
  return (
    <div
      style={{
        ...styles.outputRow,
        ...(highlight ? styles.outputRowHighlight : null),
      }}
    >
      <span style={styles.outputIcon} aria-hidden="true">
        {icon}
      </span>
      <div style={styles.outputContent}>
        <span style={styles.outputLabel}>{label}</span>
        <span style={styles.outputValue}>{value}</span>
      </div>
    </div>
  );
}

const styles = {
  experimentalBadge: {
    background: "rgba(56, 44, 18, 0.55)",
    border: "1px solid rgba(220, 180, 90, 0.4)",
    borderRadius: "999px",
    color: "#ffe6a8",
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    margin: "4px 0 0",
    padding: "4px 12px",
    textTransform: "uppercase",
  },
  personalisationLine: {
    color: "#9bc0ff",
    fontSize: "0.84rem",
    fontStyle: "italic",
    fontWeight: 600,
    margin: "6px 0 0",
  },
  gameNotice: {
    background: "rgba(56, 44, 18, 0.45)",
    border: "1px solid rgba(220, 180, 90, 0.35)",
    borderRadius: "10px",
    color: "#ffe6a8",
    fontSize: "0.86rem",
    lineHeight: 1.45,
    margin: "12px auto 0",
    maxWidth: "560px",
    padding: "10px 12px",
  },
  wheelSetupBanner: {
    alignItems: "center",
    background: "rgba(30, 52, 101, 0.55)",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "12px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between",
    margin: "0 auto 14px",
    maxWidth: "980px",
    padding: "12px 14px",
  },
  wheelSetupBannerText: {
    color: "#dce9ff",
    fontSize: "0.92rem",
    fontWeight: 600,
    margin: 0,
  },
  wheelSetupLink: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
    padding: "8px 14px",
  },
  dashboardGrid: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "minmax(0, 1fr)",
    marginBottom: "16px",
  },
  awaitingReport: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px dashed rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "24px 18px",
    textAlign: "center",
  },
  engineerReportCard: {
    background:
      "linear-gradient(180deg, rgba(22, 36, 68, 0.55), rgba(9, 14, 24, 0.92))",
    border: "1px solid rgba(132, 172, 255, 0.38)",
    borderRadius: "14px",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.28)",
    marginBottom: "18px",
    padding: "20px 18px",
    textAlign: "left",
  },
  reportHeader: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between",
    marginBottom: "18px",
    textAlign: "left",
  },
  reportEyebrow: {
    color: "rgba(184, 205, 255, 0.75)",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: "0 0 6px",
    textTransform: "uppercase",
  },
  reportTitle: {
    color: "#f3f7ff",
    fontSize: "1.25rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: 0,
  },
  reportMetaBlock: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  reportMetaItem: {
    background: "rgba(12, 18, 31, 0.75)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "999px",
    color: "#b8cdff",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "5px 12px",
  },
  reportMetaConfidence: {
    background: "rgba(24, 44, 82, 0.65)",
    border: "1px solid rgba(132, 172, 255, 0.4)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "5px 12px",
  },
  reportSummaryBlock: {
    borderBottom: "1px solid rgba(124, 156, 222, 0.2)",
    marginBottom: "16px",
    paddingBottom: "14px",
  },
  reportSummaryText: {
    color: "#e8efff",
    fontSize: "1rem",
    fontStyle: "italic",
    fontWeight: 500,
    lineHeight: 1.6,
    margin: "6px 0 0",
  },
  reportSectionsGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  reportSectionCard: {
    background: "rgba(9, 14, 24, 0.55)",
    border: "1px solid rgba(124, 156, 222, 0.22)",
    borderRadius: "10px",
    padding: "12px",
  },
  reportSectionHeading: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  reportSectionText: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    margin: 0,
  },
  reportSectionList: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    margin: 0,
    paddingLeft: "18px",
  },
  reportSectionItem: {
    marginBottom: "4px",
  },
  detailSection: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    display: "grid",
    gap: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  detailSectionHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
  },
  detailSectionTitle: {
    color: "#e8efff",
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: 0,
    textTransform: "uppercase",
  },
  summaryCardHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  detailGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  inputPanel: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    display: "grid",
    gap: "12px",
    padding: "14px",
  },
  panelTitle: R79_SECTION_TITLE,
  fieldLabel: {
    color: "#dce9ff",
    display: "grid",
    fontSize: "0.85rem",
    fontWeight: 600,
    gap: "6px",
  },
  fieldHint: {
    color: "rgba(184, 205, 255, 0.7)",
    fontSize: "0.78rem",
    fontWeight: 500,
    lineHeight: 1.4,
    margin: 0,
  },
  select: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  toggleRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  toggleButton: {
    ...R79_BTN_CHIP,
    fontSize: "0.82rem",
    padding: "7px 14px",
  },
  toggleButtonActive: {
    ...R79_BTN_ACTIVE,
    fontSize: "0.82rem",
    padding: "7px 14px",
  },
  settingsGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  range: {
    width: "100%",
  },
  rangeValue: {
    color: "#9bc0ff",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  chip: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "5px 12px",
  },
  chipActive: {
    background: "rgba(30, 52, 101, 0.65)",
    borderColor: "rgba(132, 172, 255, 0.55)",
    color: "#ffffff",
  },
  styleGrid: {
    display: "grid",
    gap: "6px",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  },
  styleChip: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "8px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "8px 10px",
  },
  styleChipActive: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    borderColor: "#77a0ff",
    color: "#ffffff",
  },
  carPicker: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxHeight: "160px",
    overflowY: "auto",
    padding: "4px 0",
  },
  carChip: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.25)",
    borderRadius: "8px",
    color: "#c8d8ff",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "5px 8px",
    textAlign: "left",
  },
  carChipActive: {
    background: "rgba(30, 52, 101, 0.55)",
    borderColor: "rgba(132, 172, 255, 0.5)",
    color: "#ffffff",
  },
  outputStack: {
    display: "grid",
    gap: "10px",
  },
  outputRow: {
    alignItems: "flex-start",
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.22)",
    borderRadius: "10px",
    display: "flex",
    gap: "10px",
    padding: "10px 12px",
  },
  outputRowHighlight: {
    borderColor: "rgba(132, 172, 255, 0.45)",
    boxShadow: "inset 0 1px 0 rgba(180, 200, 255, 0.08)",
  },
  outputIcon: {
    flexShrink: 0,
    fontSize: "1.2rem",
    lineHeight: 1.2,
  },
  outputContent: {
    display: "grid",
    gap: "4px",
    minWidth: 0,
  },
  outputLabel: {
    color: "#b8cdff",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  outputValue: {
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  confidenceBlock: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "10px",
    padding: "12px",
  },
  confidenceHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  confidenceLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  confidenceValue: {
    color: "#9bc0ff",
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  confidenceTrack: {
    background: "rgba(20, 30, 52, 0.65)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "999px",
    height: "8px",
    overflow: "hidden",
  },
  confidenceFill: {
    background: "linear-gradient(90deg, #2b56c8, #7dffa8)",
    borderRadius: "999px",
    height: "100%",
  },
  reasoningPanel: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "10px",
    padding: "12px",
  },
  reasoningTitle: {
    color: "#e8efff",
    fontSize: "0.92rem",
    margin: "0 0 8px",
  },
  reasoningList: {
    display: "grid",
    gap: "6px",
    margin: 0,
    paddingLeft: "18px",
  },
  reasoningItem: {
    color: "#dce8ff",
    fontSize: "0.86rem",
    lineHeight: 1.5,
  },
  summaryCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  summaryText: {
    color: "#dce8ff",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: "0 0 10px",
  },
  watchCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  engineerNotesCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
    textAlign: "center",
  },
  engineerNotesBody: {
    display: "grid",
    gap: "8px",
    margin: "0 auto",
    maxWidth: "560px",
  },
  engineerNotesLine: {
    color: "rgba(220, 228, 255, 0.88)",
    fontSize: "0.92rem",
    lineHeight: 1.6,
    margin: 0,
  },
  engineerNotesMotto: {
    color: "#9bc0ff",
    fontStyle: "italic",
    fontWeight: 600,
  },
  learningCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(123, 153, 219, 0.35)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  learningHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  learningBadge: {
    background: "rgba(30, 52, 101, 0.55)",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    padding: "4px 10px",
    textTransform: "uppercase",
  },
  learningIntro: {
    color: "rgba(205, 217, 255, 0.78)",
    fontSize: "0.86rem",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  feedbackGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    marginBottom: "12px",
  },
  feedbackFieldWide: {
    gridColumn: "1 / -1",
  },
  textInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  textarea: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    padding: "8px 10px",
    resize: "vertical",
  },
  feedbackMessage: {
    color: "#9bc0ff",
    fontSize: "0.84rem",
    margin: "0 0 10px",
  },
  saveFeedbackButton: {
    background: "linear-gradient(135deg, #22d3ee 0%, #6366f1 55%, #8b5cf6 100%)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    padding: "9px 18px",
  },
  historyCard: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  historyIntro: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.84rem",
    margin: "0 0 12px",
  },
  historyList: {
    display: "grid",
    gap: "10px",
  },
  historyItem: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "10px",
    padding: "12px",
  },
  historyItemHeader: {
    alignItems: "flex-start",
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  historyDate: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  historyTrack: {
    color: "#f3f7ff",
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: 0,
  },
  historyHelpBadge: {
    borderRadius: "999px",
    flexShrink: 0,
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "4px 10px",
  },
  historyHelpYes: {
    background: "rgba(24, 56, 36, 0.65)",
    border: "1px solid rgba(100, 200, 130, 0.4)",
    color: "#9dffc0",
  },
  historyHelpPartly: {
    background: "rgba(56, 44, 18, 0.55)",
    border: "1px solid rgba(220, 180, 90, 0.4)",
    color: "#ffe6a8",
  },
  historyHelpNo: {
    background: "rgba(56, 24, 24, 0.55)",
    border: "1px solid rgba(220, 120, 120, 0.4)",
    color: "#ffd0d0",
  },
  historyMetaGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    marginBottom: "8px",
  },
  historyMetaItem: {
    background: "rgba(12, 18, 31, 0.75)",
    border: "1px solid rgba(128, 160, 229, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "3px",
    padding: "8px",
  },
  historyMetaLabel: {
    color: "#b8cdff",
    fontSize: "0.68rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  historyMetaValue: {
    color: "#dce8ff",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  historyDetail: {
    color: "#dce8ff",
    fontSize: "0.84rem",
    lineHeight: 1.5,
    margin: "6px 0 0",
  },
  watchList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "8px",
  },
  watchItem: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    color: "#dce8ff",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    padding: "8px 10px",
  },
  emptyState: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    margin: 0,
  },
  footer: {
    borderTop: "1px solid rgba(124, 156, 222, 0.22)",
    paddingTop: "16px",
    textAlign: "center",
  },
  footerMeta: {
    color: "#b8cdff",
    fontSize: "0.88rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  footerTagline: {
    color: "rgba(184, 205, 255, 0.82)",
    fontSize: "0.86rem",
    fontStyle: "italic",
    fontWeight: 600,
    margin: "0 0 10px",
  },
  footerLine: {
    color: "rgba(205, 217, 255, 0.78)",
    fontSize: "0.84rem",
    fontStyle: "italic",
    margin: "0 0 4px",
  },
};
