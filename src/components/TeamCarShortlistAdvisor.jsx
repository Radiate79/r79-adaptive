import { useMemo, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import { ALR_TIER_POINTS } from "../data/alrChampionshipWeighting.js";
import { driverStyles } from "../data/driverStyles.js";
import { recommendTeamCarShortlist } from "../engine/shortlistAdvisorEngine.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import RacePresetControls from "./RacePresetControls.jsx";
import { isGameDataReady } from "../utils/gameData.js";
import { useRacePresetSettings } from "../hooks/useRacePresetSettings.js";
import { CAR_CLASS_OPTIONS } from "../data/carClasses.js";

const TIERS = Object.keys(ALR_TIER_POINTS)
  .map(Number)
  .sort((a, b) => a - b);

const RISK_STYLES = {
  Low: {
    color: "#b8f5c6",
    border: "rgba(120, 200, 140, 0.45)",
    background: "rgba(24, 56, 36, 0.55)",
  },
  Medium: {
    color: "#ffe6a8",
    border: "rgba(220, 180, 90, 0.45)",
    background: "rgba(56, 44, 18, 0.55)",
  },
  High: {
    color: "#ffb8b8",
    border: "rgba(200, 120, 120, 0.45)",
    background: "rgba(56, 24, 24, 0.55)",
  },
};

function getBackupValueLabel(entry) {
  if (entry.rank >= 4 && entry.availabilityRisk === "Low") {
    return "Strong";
  }

  if (entry.rank >= 4) {
    return "Reliable";
  }

  if (entry.consistencyScore >= 72) {
    return "Solid";
  }

  if (entry.availabilityRisk === "High") {
    return "Limited";
  }

  return "Moderate";
}

export default function TeamCarShortlistAdvisor() {
  const { gameVersion, game } = useGameVersion();
  const [inputMode, setInputMode] = useState("team");
  const [teamName, setTeamName] = useState("");
  const [driver1, setDriver1] = useState(driverStyles[0] ?? "");
  const [driver2, setDriver2] = useState(driverStyles[1] ?? "");
  const [tier, setTier] = useState(1);
  const [carClass, setCarClass] = useState("Gr.3");
  const {
    presetId,
    fuelMultiplier,
    tyreMultiplier,
    selectPreset,
    setFuelMultiplier,
    setTyreMultiplier,
    raceSettings,
  } = useRacePresetSettings();

  const teamLabel = useMemo(() => {
    if (inputMode === "team") {
      return teamName.trim() || "Your Team";
    }

    const names = [driver1, driver2].filter(Boolean);
    return names.length > 0 ? names.join(" + ") : "Your Drivers";
  }, [inputMode, teamName, driver1, driver2]);

  const shortlist = useMemo(
    () =>
      recommendTeamCarShortlist({
        tier,
        carClass,
        gameVersion,
        raceSettings,
        teamName: inputMode === "team" ? teamName.trim() : undefined,
        driver1: inputMode === "drivers" ? driver1 : undefined,
        driver2: inputMode === "drivers" ? driver2 : undefined,
      }),
    [
      tier,
      carClass,
      gameVersion,
      raceSettings,
      inputMode,
      teamName,
      driver1,
      driver2,
    ],
  );

  const primaryPick = shortlist[0] ?? null;
  const submissionOrder = shortlist.slice(1);

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>Team Car Shortlist Advisor</h2>
        <p style={styles.subtitle}>
          Teams submit a ranked 5-car list. R79 recommends the best submission
          order using performance, race history, consistency,
          availability risk, and fallback strength.
        </p>
        {!isGameDataReady(gameVersion) ? (
          <p style={styles.gameNotice}>
            {game.shortLabel} car data is not available yet. Historical race
            scores still use GT7 until GT8 data is added.
          </p>
        ) : null}
      </div>

      <div style={styles.formPanel}>
        <div style={styles.modeRow}>
          <button
            type="button"
            onClick={() => setInputMode("team")}
            style={{
              ...styles.modeButton,
              ...(inputMode === "team" ? styles.modeButtonActive : null),
            }}
          >
            Team Name
          </button>
          <button
            type="button"
            onClick={() => setInputMode("drivers")}
            style={{
              ...styles.modeButton,
              ...(inputMode === "drivers" ? styles.modeButtonActive : null),
            }}
          >
            Two Drivers
          </button>
        </div>

        {inputMode === "team" ? (
          <label style={styles.field}>
            Team Name
            <input
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="e.g. Apex Motorsport"
              style={styles.textInput}
            />
          </label>
        ) : (
          <div style={styles.driverGrid}>
            <label style={styles.field}>
              Driver 1
                <select
                  value={driver1}
                  onChange={(event) => setDriver1(event.target.value)}
                  style={styles.select}
                >
                  {driverStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
            </label>
            <label style={styles.field}>
              Driver 2
                <select
                  value={driver2}
                  onChange={(event) => setDriver2(event.target.value)}
                  style={styles.select}
                >
                  {driverStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
            </label>
          </div>
        )}

        <div style={styles.controlsRow}>
          <label style={styles.field}>
            Championship Tier
              <select
                value={tier}
                onChange={(event) => setTier(Number(event.target.value))}
                style={styles.select}
              >
                {TIERS.map((value) => (
                  <option key={value} value={value}>
                    Tier {value}
                  </option>
                ))}
              </select>
          </label>

          <div style={styles.classBlock}>
            <span style={styles.classLabel}>Class</span>
            <div style={styles.classRow}>
              {CAR_CLASS_OPTIONS.map((value) => {
                const isActive = carClass === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCarClass(value)}
                    style={{
                      ...styles.classButton,
                      ...(isActive ? styles.classButtonActive : null),
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <RacePresetControls
          presetId={presetId}
          onPresetChange={selectPreset}
          fuelMultiplier={fuelMultiplier}
          tyreMultiplier={tyreMultiplier}
          onFuelMultiplierChange={setFuelMultiplier}
          onTyreMultiplierChange={setTyreMultiplier}
        />
      </div>

      <div style={styles.summaryPanel}>
        <h3 style={styles.summaryTitle}>5-Car Submission Strategy — {teamLabel}</h3>
        <p style={styles.summaryMeta}>
          Tier {tier} · {carClass} · Tyre x{tyreMultiplier} · Fuel x{fuelMultiplier} ·
          Submit cars in ranked order below
        </p>
      </div>

      {shortlist.length === 0 ? (
        <p style={styles.emptyState}>No cars available for this class.</p>
      ) : primaryPick ? (
        <>
          <div style={styles.heroPanel}>
            <div style={styles.heroHeaderRow}>
              <p style={styles.heroLabel}>Recommended Car</p>
              <ReportIssueButton
                sourcePage="Team Car Shortlist Advisor"
                itemName={primaryPick.name}
                defaultIssueType="wrong_recommendation"
                gameVersion={gameVersion}
                compact
              />
            </div>
            <h3 style={styles.heroTitle}>{primaryPick.name}</h3>
            <p style={styles.heroMeta}>
              {primaryPick.class} · {primaryPick.drivetrain} ·{" "}
              {primaryPick.slotLabel}
            </p>

            <div style={styles.heroGrid}>
              <div style={styles.heroBlock}>
                <p style={styles.heroBlockTitle}>Why position 1</p>
                <p style={styles.heroBlockText}>{primaryPick.whyThisPosition}</p>
              </div>

              <div style={styles.heroBlock}>
                <p style={styles.heroBlockTitle}>Availability risk</p>
                <span
                  style={{
                    ...styles.riskBadge,
                    color: RISK_STYLES[primaryPick.availabilityRisk].color,
                    borderColor: RISK_STYLES[primaryPick.availabilityRisk].border,
                    background: RISK_STYLES[primaryPick.availabilityRisk].background,
                  }}
                >
                  {primaryPick.availabilityRisk}
                </span>
              </div>

              <div style={styles.heroBlock}>
                <p style={styles.heroBlockTitle}>Backup value</p>
                <p style={styles.backupValue}>
                  {getBackupValueLabel(primaryPick)} — {primaryPick.fallbackNotes}
                </p>
              </div>
            </div>

            <ScoreBreakdown entry={primaryPick} />
          </div>

          {submissionOrder.length > 0 ? (
            <div style={styles.submissionSection}>
              <h3 style={styles.submissionTitle}>Positions 2–5</h3>
              <div style={styles.shortlist}>
                {submissionOrder.map((entry) => (
                  <ShortlistCard
                    key={entry.carId}
                    entry={entry}
                    gameVersion={gameVersion}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div style={styles.fullOrderSection}>
            <h3 style={styles.submissionTitle}>Full 5-Car Submission Order</h3>
            <div style={styles.shortlist}>
              {shortlist.map((entry) => (
                <ShortlistCard
                  key={`full-${entry.carId}`}
                  entry={entry}
                  gameVersion={gameVersion}
                  compact
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ScoreBreakdown({ entry }) {
  return (
    <div style={styles.scoreGrid}>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Performance</span>
        <strong style={styles.scoreValue}>{entry.performanceScore.toFixed(1)}</strong>
      </div>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Community Confidence</span>
        <strong style={styles.scoreValue}>{entry.communityConfidence ?? 60}</strong>
      </div>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Historical</span>
        <strong style={styles.scoreValue}>
          {entry.alrHistoricalScore.toFixed(1)}
        </strong>
      </div>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Consistency</span>
        <strong style={styles.scoreValue}>
          {entry.consistencyScore.toFixed(1)}
        </strong>
      </div>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Availability Risk</span>
        <strong style={styles.scoreValue}>{entry.availabilityRisk}</strong>
      </div>
      <div style={styles.scoreItem}>
        <span style={styles.scoreLabel}>Fallback Strength</span>
        <strong style={styles.scoreValue}>{getBackupValueLabel(entry)}</strong>
      </div>
    </div>
  );
}

function ShortlistCard({ entry, compact = false, gameVersion }) {
  const riskStyle = RISK_STYLES[entry.availabilityRisk];

  return (
    <article style={styles.shortlistCard}>
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.rankBadge}>#{entry.rank}</span>
          <h4 style={styles.carTitle}>{entry.name}</h4>
          <p style={styles.carMeta}>
            {entry.class} · {entry.drivetrain} · {entry.slotLabel}
          </p>
        </div>
        <div style={styles.cardHeaderActions}>
          <span
            style={{
              ...styles.riskBadge,
              color: riskStyle.color,
              borderColor: riskStyle.border,
              background: riskStyle.background,
            }}
          >
            {entry.availabilityRisk} Risk
          </span>
          <ReportIssueButton
            sourcePage="Team Car Shortlist Advisor"
            itemName={entry.name}
            defaultIssueType="wrong_recommendation"
            gameVersion={gameVersion}
            compact
          />
        </div>
      </div>

      {!compact ? (
        <>
          <div style={styles.insightGrid}>
            <InsightBlock
              title={`Why position ${entry.rank}`}
              text={entry.whyThisPosition}
            />
            <InsightBlock
              title="Availability risk"
              text={`${entry.availabilityRisk} — ${entry.availabilityRisk === "High" ? "likely to be claimed early by rival teams" : entry.availabilityRisk === "Medium" ? "moderate chance of still being available" : "lower demand improves allocation safety"}`}
            />
            <InsightBlock
              title="Backup value"
              text={`${getBackupValueLabel(entry)} — ${entry.fallbackNotes}`}
            />
          </div>
          <ScoreBreakdown entry={entry} />
        </>
      ) : (
        <ScoreBreakdown entry={entry} />
      )}
    </article>
  );
}

function InsightBlock({ title, text }) {
  return (
    <div style={styles.noteBlock}>
      <p style={styles.noteTitle}>{title}</p>
      <p style={styles.noteText}>{text}</p>
    </div>
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
    lineHeight: 1.45,
  },
  gameNotice: {
    color: "#ffe6a8",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: "10px 0 0",
  },
  formPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  modeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
  },
  modeButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 14px",
  },
  modeButtonActive: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderColor: "#77a0ff",
    color: "#ffffff",
  },
  field: {
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  textInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  select: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  driverGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    marginBottom: "12px",
  },
  controlsRow: {
    alignItems: "end",
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    marginTop: "12px",
  },
  classBlock: {
    display: "grid",
    gap: "6px",
  },
  classLabel: {
    color: "#dce9ff",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  classRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
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
  summaryPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  summaryTitle: {
    margin: "0 0 4px",
    color: "#e8efff",
    fontSize: "1rem",
  },
  summaryMeta: {
    margin: 0,
    color: "#9bc0ff",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  emptyState: {
    margin: 0,
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
  },
  heroPanel: {
    background:
      "linear-gradient(135deg, rgba(45, 85, 180, 0.55), rgba(12, 20, 38, 0.95))",
    border: "1px solid rgba(132, 172, 255, 0.45)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "16px",
  },
  heroHeaderRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  heroLabel: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: 0,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: "1.3rem",
    margin: "0 0 4px",
  },
  heroMeta: {
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.88rem",
    margin: "0 0 14px",
  },
  heroGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    marginBottom: "14px",
  },
  heroBlock: {
    background: "rgba(9, 14, 24, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.25)",
    borderRadius: "10px",
    padding: "12px",
  },
  heroBlockTitle: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: "0 0 6px",
    textTransform: "uppercase",
  },
  heroBlockText: {
    color: "#dce8ff",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: 0,
  },
  backupValue: {
    color: "#dce8ff",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: 0,
  },
  submissionSection: {
    marginBottom: "14px",
  },
  fullOrderSection: {
    marginBottom: "4px",
  },
  submissionTitle: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 10px",
  },
  shortlist: {
    display: "grid",
    gap: "12px",
  },
  shortlistCard: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  cardHeader: {
    alignItems: "flex-start",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  cardHeaderActions: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  rankBadge: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    borderRadius: "999px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "0.78rem",
    fontWeight: 700,
    marginBottom: "6px",
    padding: "4px 10px",
  },
  carTitle: {
    margin: "0 0 4px",
    color: "#f3f7ff",
    fontSize: "1.05rem",
  },
  carMeta: {
    margin: 0,
    color: "rgba(205, 217, 255, 0.7)",
    fontSize: "0.84rem",
  },
  riskBadge: {
    border: "1px solid",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "5px 10px",
    whiteSpace: "nowrap",
  },
  insightGrid: {
    display: "grid",
    gap: "8px",
    marginBottom: "12px",
  },
  scoreGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  },
  scoreItem: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
  },
  scoreLabel: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  scoreValue: {
    color: "#9bc0ff",
    fontSize: "0.95rem",
    fontVariantNumeric: "tabular-nums",
  },
  noteBlock: {
    background: "rgba(18, 26, 45, 0.55)",
    border: "1px solid rgba(113, 143, 209, 0.2)",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  noteTitle: {
    margin: "0 0 4px",
    color: "#b8cdff",
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  noteText: {
    margin: 0,
    color: "#dce8ff",
    fontSize: "0.86rem",
    lineHeight: 1.45,
  },
};
