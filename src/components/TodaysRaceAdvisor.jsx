import { useEffect, useMemo, useState } from "react";
import { GAME_CATALOG } from "../data/gameVersions.js";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  analyzeTodaysRace,
  CAR_CLASS_OPTIONS,
  RACE_LENGTH_OPTIONS,
  TYRE_COMPOUND_OPTIONS,
} from "../engine/todaysRaceAdvisorEngine.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import { getTracksForGame, isGameDataReady } from "../utils/gameData.js";
import {
  isCarClassSelectableForTrack,
  isDirtTrack,
} from "../utils/trackClassification.js";
import { TrackSurfaceWarning } from "./TrackSurfaceWarning.jsx";
import RacePresetControls from "./RacePresetControls.jsx";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";

function ScoreExplanation({ car }) {
  if (!car?.scoreBreakdown && car?.technicalFitScore === undefined) {
    return null;
  }

  const breakdown = car.scoreBreakdown ?? {
    technicalFit: car.technicalFitScore ?? car.technicalScore,
    communityConfidence: car.communityConfidence ?? 60,
    trackFit: car.trackFitScore ?? car.technicalScore,
  };

  return (
    <div style={styles.scoreExplain}>
      <p style={styles.scoreExplainLine}>
        <span style={styles.scoreExplainLabel}>Technical Fit:</span>{" "}
        {breakdown.technicalFit}
      </p>
      <p style={styles.scoreExplainLine}>
        <span style={styles.scoreExplainLabel}>Community Confidence:</span>{" "}
        {breakdown.communityConfidence}
      </p>
      <p style={styles.scoreExplainLine}>
        <span style={styles.scoreExplainLabel}>Track Fit:</span>{" "}
        {breakdown.trackFit}
      </p>
    </div>
  );
}

function RatingBar({ label, value }) {
  return (
    <div style={styles.ratingRow}>
      <span style={styles.ratingLabel}>{label}</span>
      <div style={styles.ratingTrack}>
        <div
          style={{
            ...styles.ratingFill,
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
      <span style={styles.ratingValue}>{value}</span>
    </div>
  );
}

export default function TodaysRaceAdvisor() {
  const { gameVersion, setGameVersion, gameOptions, game } = useGameVersion();
  const tracks = useMemo(() => getTracksForGame(gameVersion), [gameVersion]);

  const [trackId, setTrackId] = useState("");
  const [carClass, setCarClass] = useState("Gr.3");
  const [bopOn, setBopOn] = useState(true);
  const [tyreCompound, setTyreCompound] = useState("M");
  const {
    presetId,
    fuelMultiplier,
    tyreMultiplier,
    selectPreset,
    setFuelMultiplier,
    setTyreMultiplier,
    raceSettings,
  } = useRacePresetSettings();
  const [raceLength, setRaceLength] = useState("medium");
  const [unavailableCarIds, setUnavailableCarIds] = useState([]);

  const analysis = useMemo(
    () =>
      analyzeTodaysRace({
        gameVersion,
        trackId,
        carClass,
        bopOn,
        tyreCompound,
        ...raceSettings,
        raceLength,
        unavailableCarIds,
      }),
    [
      gameVersion,
      trackId,
      carClass,
      bopOn,
      tyreCompound,
      raceSettings,
      raceLength,
      unavailableCarIds,
    ],
  );

  const toggleUnavailable = (carId) => {
    setUnavailableCarIds((current) =>
      current.includes(carId)
        ? current.filter((id) => id !== carId)
        : [...current, carId],
    );
  };

  const selectedTrack = tracks.find((track) => track.id === trackId) ?? null;

  useEffect(() => {
    if (!selectedTrack) {
      return;
    }

    if (isDirtTrack(selectedTrack)) {
      setCarClass("Gr.B");
    }
  }, [selectedTrack?.id]);

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>Today&apos;s Race Advisor</h2>
        <p style={styles.subtitle}>
          Complete race engineer dashboard — car selection, strategy, and setup
          guidance for your next race.
        </p>
        {!isGameDataReady(gameVersion) ? (
          <p style={styles.gameNotice}>
            {game.shortLabel} car and track data is not available yet. Populate{" "}
            <code>src/data/gt8/</code> to enable recommendations.
          </p>
        ) : null}
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.inputPanel}>
          <h3 style={styles.panelTitle}>Race Setup</h3>

          <label style={styles.fieldLabel}>
            Game Version
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
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.fieldLabel}>
            Car Class
            <div style={styles.toggleRow}>
              {CAR_CLASS_OPTIONS.map((value) => {
                const isActive = carClass === value;
                const isSelectable = isCarClassSelectableForTrack(value, selectedTrack);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => isSelectable && setCarClass(value)}
                    disabled={!isSelectable}
                    style={{
                      ...styles.classChip,
                      ...(isActive ? styles.classChipActive : null),
                      ...(!isSelectable ? styles.classChipDisabled : null),
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </label>

          <div style={styles.settingsGrid}>
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
              Tyre Compound
              <select
                value={tyreCompound}
                onChange={(event) => setTyreCompound(event.target.value)}
                style={styles.select}
              >
                {TYRE_COMPOUND_OPTIONS.map((compound) => (
                  <option key={compound} value={compound}>
                    {compound}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.fieldLabel}>
              Race Length
              <select
                value={raceLength}
                onChange={(event) => setRaceLength(event.target.value)}
                style={styles.select}
              >
                {RACE_LENGTH_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <RacePresetControls
              presetId={presetId}
              onPresetChange={selectPreset}
              fuelMultiplier={fuelMultiplier}
              tyreMultiplier={tyreMultiplier}
              onFuelMultiplierChange={setFuelMultiplier}
              onTyreMultiplierChange={setTyreMultiplier}
            />
          </div>
        </div>

        {selectedTrack && analysis.ready ? (
          <div style={styles.analysisPanel}>
            <h3 style={styles.panelTitle}>Track Analysis — {selectedTrack.name}</h3>
            {analysis.trackAnalysis?.trackTypeLabel ? (
              <div style={styles.tagRow}>
                <span style={styles.tag}>{analysis.trackAnalysis.trackTypeLabel}</span>
                <span style={styles.tag}>{analysis.trackAnalysis.drivingStyleLabel}</span>
              </div>
            ) : null}
            <TrackSurfaceWarning
              warning={analysis.recommendationStatus?.warning}
              message={analysis.recommendationStatus?.message}
            />
            {analysis.trackAnalysis?.keyDemands?.length ? (
              <div style={styles.tagRow}>
                {analysis.trackAnalysis.keyDemands.map((item) => (
                  <span key={item} style={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
            <div style={styles.metricGrid}>
              {analysis.trackAnalysis?.attributes?.map((metric) => (
                <div key={metric.key} style={styles.metricCard}>
                  <span style={styles.metricLabel}>{metric.label}</span>
                  <span style={styles.metricValue}>{metric.percent}%</span>
                </div>
              ))}
            </div>
            {analysis.trackAnalysis?.dna ? (
              <p style={styles.dnaType}>
                {analysis.trackAnalysis.dna.championshipType}
              </p>
            ) : null}
            {analysis.trackAnalysis?.drivetrainRankings ? (
              <div style={styles.drivetrainList}>
                {analysis.trackAnalysis.drivetrainRankings.map((item) => (
                  <div key={item.drivetrain} style={styles.drivetrainRow}>
                    <span>{item.drivetrain}</span>
                    <span style={styles.drivetrainScore}>{item.score}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.analysisPanel}>
            <h3 style={styles.panelTitle}>Track Analysis</h3>
            <p style={styles.emptyState}>Select a track to analyse race demands.</p>
          </div>
        )}
      </div>

      {analysis.ready && analysis.strategyNotes.length > 0 ? (
        <div style={styles.strategyPanel}>
          <h3 style={styles.panelTitle}>Strategy Notes</h3>
          <ul style={styles.strategyList}>
            {analysis.strategyNotes.map((note) => (
              <li key={note} style={styles.strategyItem}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.ready && analysis.topPick ? (
        <div style={styles.heroPanel}>
          <div style={styles.heroHeader}>
            <div>
              <p style={styles.heroLabel}>Recommended Car</p>
              <h3 style={styles.heroTitle}>{analysis.topPick.name}</h3>
            </div>
            <div style={styles.cardActions}>
              <span style={styles.heroScore}>
                {analysis.topPick.overallScore.toFixed(1)}
              </span>
              <ReportIssueButton
                sourcePage="Today's Race Advisor"
                itemName={analysis.topPick.name}
                defaultIssueType="wrong_recommendation"
                gameVersion={gameVersion}
              />
            </div>
          </div>
          <ScoreExplanation car={analysis.topPick} />
          <div style={styles.heroRatings}>
            <RatingBar label="Strength" value={analysis.topPick.strengthRating} />
            <RatingBar label="Fuel" value={analysis.topPick.fuelRating} />
            <RatingBar label="Tyre" value={analysis.topPick.tyreRating} />
            <RatingBar label="Stability" value={analysis.topPick.stabilityRating} />
            <RatingBar label="Rotation" value={analysis.topPick.rotationRating} />
            <RatingBar
              label="Community Confidence"
              value={analysis.topPick.communityConfidence ?? 60}
            />
          </div>
          <div style={styles.whyBlock}>
            <p style={styles.whyTitle}>Why this car?</p>
            <ul style={styles.reasonList}>
              {analysis.topPick.reasons.map((reason) => (
                <li key={reason} style={styles.reasonItem}>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {analysis.ready && analysis.alternativeChoice ? (
        <div style={styles.altPanel}>
          <div style={styles.panelTitleRow}>
            <h3 style={styles.panelTitle}>Alternative Choice</h3>
            <ReportIssueButton
              sourcePage="Today's Race Advisor"
              itemName={analysis.alternativeChoice.name}
              defaultIssueType="wrong_recommendation"
              gameVersion={gameVersion}
              compact
            />
          </div>
          <p style={styles.altLead}>
            If <strong>{analysis.topPick?.name}</strong> is unavailable, consider{" "}
            <strong>{analysis.alternativeChoice.name}</strong>.
          </p>
          <div style={styles.altMeta}>
            <span>Overall: {analysis.alternativeChoice.overallScore.toFixed(1)}</span>
            <span>
              Historical: {analysis.alternativeChoice.historicalScore.toFixed(0)}
            </span>
            <span>
              Strength: {analysis.alternativeChoice.strengthRating}
            </span>
            <span>
              Community: {analysis.alternativeChoice.communityConfidence ?? 60}
            </span>
          </div>
          <ul style={styles.reasonList}>
            {analysis.alternativeChoice.reasons.slice(0, 3).map((reason) => (
              <li key={reason} style={styles.reasonItem}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={styles.resultsPanel}>
        <h3 style={styles.panelTitle}>Top 10 Recommended Cars</h3>
        {!analysis.ready || analysis.recommendations.length === 0 ? (
          <p style={styles.emptyState}>
            {tracks.length === 0
              ? `No ${game.shortLabel} tracks available yet.`
              : analysis.recommendationStatus?.message ??
                "Select a track and class to generate recommendations."}
          </p>
        ) : (
          <div style={styles.resultsGrid}>
            {analysis.recommendations.map((car, index) => (
              <article key={car.id} style={styles.carCard}>
                <div style={styles.carCardHeader}>
                  <div>
                    <span style={styles.carRank}>#{index + 1}</span>
                    <h4 style={styles.carName}>{car.name}</h4>
                  </div>
                  <div style={styles.cardActions}>
                    <ReportIssueButton
                      sourcePage="Today's Race Advisor — Top 10"
                      itemName={car.name}
                      defaultIssueType="wrong_recommendation"
                      gameVersion={gameVersion}
                      compact
                    />
                    <button
                      type="button"
                      onClick={() => toggleUnavailable(car.id)}
                      style={{
                        ...styles.unavailButton,
                        ...(car.unavailable ? styles.unavailButtonActive : null),
                      }}
                    >
                      {car.unavailable ? "Unavailable" : "Mark unavailable"}
                    </button>
                  </div>
                </div>

                <div style={styles.scoreRow}>
                  <div style={styles.scoreCell}>
                    <span style={styles.scoreLabel}>Overall</span>
                    <span style={styles.scoreValue}>
                      {car.overallScore.toFixed(1)}
                    </span>
                  </div>
                  <div style={styles.scoreCell}>
                    <span style={styles.scoreLabel}>Historical</span>
                    <span style={styles.scoreValue}>
                      {car.historicalScore.toFixed(0)}
                    </span>
                  </div>
                </div>

                <ScoreExplanation car={car} />

                <div style={styles.ratingsCompact}>
                  <RatingBar label="Strength" value={car.strengthRating} />
                  <RatingBar label="Fuel" value={car.fuelRating} />
                  <RatingBar label="Tyre" value={car.tyreRating} />
                  <RatingBar label="Stability" value={car.stabilityRating} />
                  <RatingBar label="Rotation" value={car.rotationRating} />
                </div>

                <div style={styles.whyBlock}>
                  <p style={styles.whyTitle}>Why this car?</p>
                  <ul style={styles.reasonList}>
                    {car.reasons.map((reason) => (
                      <li key={reason} style={styles.reasonItem}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
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
    maxWidth: "980px",
    margin: "0 auto",
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    letterSpacing: "0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.95rem",
    lineHeight: 1.45,
  },
  gameNotice: {
    margin: "10px 0 0",
    color: "#ffe6a8",
    fontSize: "0.88rem",
    lineHeight: 1.45,
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
    marginBottom: "12px",
  },
  inputPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  analysisPanel: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  panelTitle: {
    margin: "0 0 10px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  fieldLabel: {
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
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
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "7px 14px",
  },
  toggleButtonActive: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderColor: "#77a0ff",
    color: "#ffffff",
  },
  classChip: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 600,
    padding: "6px 12px",
  },
  classChipActive: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderColor: "#77a0ff",
    color: "#ffffff",
  },
  classChipDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  settingsGrid: {
    display: "grid",
    gap: "10px",
  },
  range: {
    width: "100%",
  },
  rangeValue: {
    color: "#9bc0ff",
    fontSize: "0.88rem",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  tag: {
    border: "1px solid rgba(134, 169, 240, 0.4)",
    background: "rgba(30, 52, 101, 0.45)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "5px 10px",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "8px",
    marginBottom: "10px",
  },
  metricCard: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
  },
  metricLabel: {
    color: "#b8cdff",
    fontSize: "0.78rem",
  },
  metricValue: {
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  dnaType: {
    margin: "0 0 10px",
    color: "#9bc0ff",
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  drivetrainList: {
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
    fontSize: "0.86rem",
  },
  drivetrainScore: {
    color: "#9bc0ff",
    fontWeight: 700,
  },
  strategyPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  strategyList: {
    margin: 0,
    paddingLeft: "18px",
    display: "grid",
    gap: "6px",
  },
  strategyItem: {
    color: "#dce8ff",
    fontSize: "0.88rem",
    lineHeight: 1.4,
  },
  heroPanel: {
    background:
      "linear-gradient(135deg, rgba(45, 85, 180, 0.55), rgba(12, 20, 38, 0.95))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "16px",
  },
  heroHeader: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  cardActions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "flex-end",
  },
  panelTitleRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  heroLabel: {
    margin: 0,
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  heroTitle: {
    margin: "4px 0 0",
    fontSize: "1.25rem",
    color: "#ffffff",
  },
  heroScore: {
    background: "rgba(9, 14, 24, 0.65)",
    border: "1px solid rgba(132, 172, 255, 0.35)",
    borderRadius: "10px",
    color: "#9bc0ff",
    fontSize: "1.4rem",
    fontWeight: 700,
    padding: "8px 14px",
  },
  heroRatings: {
    display: "grid",
    gap: "6px",
    marginBottom: "12px",
  },
  altPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  altLead: {
    margin: "0 0 8px",
    color: "#dce8ff",
    fontSize: "0.9rem",
    lineHeight: 1.45,
  },
  altMeta: {
    color: "#9bc0ff",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.86rem",
    fontWeight: 600,
    gap: "12px",
    marginBottom: "8px",
  },
  resultsPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
  },
  carCard: {
    background: "rgba(16, 24, 42, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "10px",
    display: "grid",
    gap: "10px",
    padding: "12px",
  },
  carCardHeader: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
  carRank: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 700,
  },
  carName: {
    margin: "2px 0 0",
    fontSize: "0.98rem",
    color: "#f3f7ff",
  },
  unavailButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "5px 10px",
    whiteSpace: "nowrap",
  },
  unavailButtonActive: {
    background: "rgba(120, 40, 40, 0.65)",
    borderColor: "rgba(220, 120, 120, 0.5)",
    color: "#ffd0d0",
  },
  scoreRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  scoreExplain: {
    background: "rgba(18, 26, 45, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "2px",
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
  scoreCell: {
    background: "rgba(9, 14, 24, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "2px",
    padding: "8px",
  },
  scoreLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  scoreValue: {
    color: "#9bc0ff",
    fontSize: "1rem",
    fontWeight: 700,
  },
  ratingsCompact: {
    display: "grid",
    gap: "4px",
  },
  ratingRow: {
    alignItems: "center",
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "72px 1fr 32px",
  },
  ratingLabel: {
    color: "#b8cdff",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  ratingTrack: {
    background: "rgba(9, 14, 24, 0.65)",
    borderRadius: "999px",
    height: "6px",
    overflow: "hidden",
  },
  ratingFill: {
    background: "linear-gradient(90deg, #2b56c8, #5b9dff)",
    borderRadius: "999px",
    height: "100%",
  },
  ratingValue: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 700,
    textAlign: "right",
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
  emptyState: {
    margin: 0,
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
  },
};
