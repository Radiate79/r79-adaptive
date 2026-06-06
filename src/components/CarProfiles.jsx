import { useEffect, useMemo, useState } from "react";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  compareCarProfiles,
  getCarProfile,
  searchCarProfiles,
} from "../engine/carProfileEngine.js";
import { ReportIssueButton } from "./ReportIssue.jsx";
import { isGameDataReady } from "../utils/gameData.js";

const TREND_STYLES = {
  Rising: { color: "#b8f5c6", background: "rgba(24, 56, 36, 0.55)" },
  Stable: { color: "#ffe6a8", background: "rgba(56, 44, 18, 0.55)" },
  Falling: { color: "#ffb8b8", background: "rgba(56, 24, 24, 0.55)" },
};

function formatCompareValue(key, value) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (key === "averageFinish") {
    return Number(value).toFixed(2);
  }
  if (key === "historicalScore") {
    return Number(value).toFixed(1);
  }
  return String(value);
}

export default function CarProfiles() {
  const { gameVersion, game } = useGameVersion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarId, setSelectedCarId] = useState("porsche_911_gt3_r_22");
  const [compareMode, setCompareMode] = useState(false);
  const [compareCarId, setCompareCarId] = useState("mercedes_amg_gt3_20");

  const searchResults = useMemo(
    () => searchCarProfiles(searchQuery, gameVersion),
    [searchQuery, gameVersion],
  );

  useEffect(() => {
    if (searchResults.length === 0) {
      setSelectedCarId("");
      setCompareCarId("");
      return;
    }

    if (!searchResults.some((car) => car.id === selectedCarId)) {
      setSelectedCarId(searchResults[0].id);
    }

    if (!searchResults.some((car) => car.id === compareCarId)) {
      setCompareCarId(searchResults[1]?.id ?? searchResults[0].id);
    }
  }, [searchResults, selectedCarId, compareCarId]);

  const profile = useMemo(
    () =>
      selectedCarId ? getCarProfile(selectedCarId, gameVersion) : null,
    [selectedCarId, gameVersion],
  );

  const comparison = useMemo(() => {
    if (!compareMode || !selectedCarId || !compareCarId) {
      return null;
    }
    return compareCarProfiles(selectedCarId, compareCarId, gameVersion);
  }, [compareMode, selectedCarId, compareCarId, gameVersion]);

  return (
    <section style={styles.shell}>
      <style>{`
        @media (max-width: 860px) {
          .car-profiles-layout {
            grid-template-columns: 1fr !important;
          }
          .car-profiles-sidebar {
            max-height: 260px !important;
          }
          .car-profiles-hero {
            grid-template-columns: 1fr !important;
          }
          .car-profiles-toolbar {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={styles.header}>
        <h2 style={styles.title}>Car Profiles</h2>
        <p style={styles.subtitle}>
          Complete historical and performance profiles for {game.shortLabel} cars
          using championship ratings. ALR constructor history remains linked to
          GT7 for now.
        </p>
        {!isGameDataReady(gameVersion) ? (
          <p style={styles.gameNotice}>
            {game.shortLabel} profiles will appear once car and track data is
            added under <code>src/data/gt8/</code>.
          </p>
        ) : null}
      </div>

      <div className="car-profiles-toolbar" style={styles.toolbar}>
        <label style={styles.searchField}>
          Search cars
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name, manufacturer, drivetrain..."
            style={styles.searchInput}
          />
        </label>

        <label style={styles.compareToggle}>
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(event) => setCompareMode(event.target.checked)}
          />
          Compare Mode
        </label>
      </div>

      <div className="car-profiles-layout" style={styles.layout}>
        <aside className="car-profiles-sidebar" style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>
            Cars ({searchResults.length})
          </h3>
          <div style={styles.carList}>
            {searchResults.map((car) => {
              const isActive = car.id === selectedCarId;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => setSelectedCarId(car.id)}
                  style={{
                    ...styles.carListItem,
                    ...(isActive ? styles.carListItemActive : null),
                  }}
                >
                  <span style={styles.carListName}>{car.name}</span>
                  <span style={styles.carListMeta}>
                    {car.manufacturer} · {car.drivetrain} · {car.category}
                    {car.hasALRHistory ? " · ALR" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div style={styles.main}>
          {!profile ? (
            <p style={styles.emptyState}>Select a car to view its profile.</p>
          ) : (
            <>
              <div className="car-profiles-hero" style={styles.heroCard}>
                <div style={styles.imagePlaceholder}>
                  <span style={styles.placeholderLabel}>Car Image</span>
                  <span style={styles.placeholderSub}>
                    {profile.manufacturer}
                  </span>
                </div>
                <div style={styles.heroContent}>
                  <div style={styles.heroTitleRow}>
                    <h3 style={styles.heroTitle}>{profile.name}</h3>
                    <ReportIssueButton
                      sourcePage="Car Profiles"
                      itemName={profile.name}
                      defaultIssueType="incorrect_car_class"
                      gameVersion={gameVersion}
                      compact
                    />
                  </div>
                  <div style={styles.heroTags}>
                    <span style={styles.tag}>{profile.manufacturer}</span>
                    <span style={styles.tag}>{profile.category}</span>
                    <span style={styles.tag}>{profile.drivetrain}</span>
                    {profile.year ? (
                      <span style={styles.tag}>{profile.year}</span>
                    ) : null}
                  </div>
                  <p style={styles.heroHint}>
                    {profile.hasALRHistory
                      ? `${profile.seasonsEntered} ALR season(s) on record`
                      : "No ALR constructor history imported yet"}
                  </p>
                </div>
              </div>

              <div style={styles.statsGrid}>
                <StatCard label="ALR Historical Score" value={profile.historicalScore.toFixed(1)} />
                <StatCard label="Championship Wins" value={profile.championshipWins} />
                <StatCard label="Constructors Podiums" value={profile.podiums} />
                <StatCard
                  label="Average Finish"
                  value={
                    profile.averageFinish !== null
                      ? profile.averageFinish.toFixed(2)
                      : "—"
                  }
                />
                <StatCard label="Seasons Entered" value={profile.seasonsEntered} />
                <StatCard
                  label="Highest Tier"
                  value={
                    profile.highestTierCompeted !== null
                      ? `Tier ${profile.highestTierCompeted}`
                      : "—"
                  }
                />
                <StatCard
                  label="Trend"
                  value={profile.trend}
                  accent={TREND_STYLES[profile.trend]}
                />
              </div>

              <Panel title="Performance Breakdown">
                <div style={styles.breakdownGrid}>
                  {profile.performanceBreakdown.map((metric) => (
                    <div key={metric.key} style={styles.breakdownItem}>
                      <div style={styles.breakdownHeader}>
                        <span>{metric.label}</span>
                        <strong>{metric.value.toFixed(1)}/10</strong>
                      </div>
                      <div style={styles.progressTrack}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${metric.percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div style={styles.twoColumn}>
                <Panel title="Strengths">
                  <ul style={styles.bulletList}>
                    {profile.strengths.map((item) => (
                      <li key={item} style={styles.strengthItem}>
                        ✔ {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="Weaknesses">
                  <ul style={styles.bulletList}>
                    {profile.weaknesses.map((item) => (
                      <li key={item} style={styles.weaknessItem}>
                        ✖ {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <Panel title="Recommended Tracks">
                <div style={styles.trackGroups}>
                  <TrackGroup label="Excellent" tracks={profile.recommendedTracks.excellent} tone="excellent" />
                  <TrackGroup label="Good" tracks={profile.recommendedTracks.good} tone="good" />
                  <TrackGroup label="Average" tracks={profile.recommendedTracks.average} tone="average" />
                </div>
              </Panel>

              <Panel title="Historical Timeline">
                {profile.timeline.length === 0 ? (
                  <p style={styles.panelEmpty}>
                    No ALR season entries recorded for this car.
                  </p>
                ) : (
                  <div style={styles.timeline}>
                    {profile.timeline.map((entry) => (
                      <div
                        key={`${entry.season}-${entry.tierLabel}-${entry.position}`}
                        style={styles.timelineItem}
                      >
                        <span style={styles.timelineSeason}>
                          Season {entry.season}
                        </span>
                        <span style={styles.timelineTier}>{entry.tierLabel}</span>
                        <span style={styles.timelinePosition}>
                          Position {entry.position}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {compareMode ? (
                <Panel title="Compare Mode">
                  <div style={styles.comparePicker}>
                    <label style={styles.field}>
                      Compare against
                      <select
                        value={compareCarId}
                        onChange={(event) => setCompareCarId(event.target.value)}
                        style={styles.select}
                      >
                        {searchResults.map((car) => (
                          <option key={car.id} value={car.id}>
                            {car.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {comparison ? (
                    <div style={styles.compareTableWrap}>
                      <table style={styles.compareTable}>
                        <thead>
                          <tr>
                            <th style={styles.compareTh}>Metric</th>
                            <th style={styles.compareTh}>{comparison.carA.name}</th>
                            <th style={styles.compareTh}>{comparison.carB.name}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.rows.map((row) => (
                            <tr key={row.key}>
                              <td style={styles.compareTd}>{row.label}</td>
                              <td
                                style={{
                                  ...styles.compareTd,
                                  ...(row.winner === "a"
                                    ? styles.compareWinner
                                    : null),
                                }}
                              >
                                {formatCompareValue(row.key, row.valueA)}
                              </td>
                              <td
                                style={{
                                  ...styles.compareTd,
                                  ...(row.winner === "b"
                                    ? styles.compareWinner
                                    : null),
                                }}
                              >
                                {formatCompareValue(row.key, row.valueB)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </Panel>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong
        style={{
          ...styles.statValue,
          ...(accent
            ? {
                color: accent.color,
                background: accent.background,
                borderRadius: "999px",
                display: "inline-block",
                padding: "4px 10px",
              }
            : null),
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      {children}
    </section>
  );
}

function TrackGroup({ label, tracks, tone }) {
  const toneStyle =
    tone === "excellent"
      ? styles.trackExcellent
      : tone === "good"
        ? styles.trackGood
        : styles.trackAverage;

  return (
    <div style={styles.trackGroup}>
      <h4 style={styles.trackGroupTitle}>{label}</h4>
      {tracks.length === 0 ? (
        <p style={styles.panelEmpty}>None in this band.</p>
      ) : (
        <ul style={styles.trackList}>
          {tracks.map((track) => (
            <li key={track} style={{ ...styles.trackItem, ...toneStyle }}>
              {track}
            </li>
          ))}
        </ul>
      )}
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
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "1.4rem",
  },
  subtitle: {
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.95rem",
    lineHeight: 1.45,
    margin: "6px 0 0",
  },
  gameNotice: {
    color: "#ffe6a8",
    fontSize: "0.88rem",
    lineHeight: 1.45,
    margin: "10px 0 0",
  },
  toolbar: {
    alignItems: "end",
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    marginBottom: "14px",
  },
  searchField: {
    color: "#dce9ff",
    display: "grid",
    fontSize: "0.85rem",
    fontWeight: 600,
    gap: "6px",
  },
  searchInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.95rem",
    padding: "10px 12px",
    width: "100%",
  },
  compareToggle: {
    alignItems: "center",
    color: "#dce9ff",
    display: "flex",
    fontSize: "0.88rem",
    fontWeight: 600,
    gap: "8px",
    whiteSpace: "nowrap",
  },
  layout: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
  },
  sidebar: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    maxHeight: "72vh",
    overflow: "hidden",
    padding: "12px",
  },
  sidebarTitle: {
    color: "#e8efff",
    fontSize: "0.95rem",
    margin: "0 0 10px",
  },
  carList: {
    display: "grid",
    gap: "8px",
    maxHeight: "calc(72vh - 48px)",
    overflowY: "auto",
  },
  carListItem: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.25)",
    borderRadius: "10px",
    color: "#dbe6ff",
    cursor: "pointer",
    display: "grid",
    gap: "4px",
    padding: "10px",
    textAlign: "left",
    width: "100%",
  },
  carListItemActive: {
    background: "linear-gradient(135deg, rgba(45, 85, 180, 0.85), rgba(22, 42, 90, 0.95))",
    borderColor: "#84acff",
    color: "#ffffff",
  },
  carListName: {
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  carListMeta: {
    fontSize: "0.78rem",
    opacity: 0.8,
  },
  main: {
    display: "grid",
    gap: "14px",
    minWidth: 0,
  },
  emptyState: {
    color: "rgba(205, 217, 255, 0.8)",
    margin: 0,
  },
  heroCard: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "minmax(140px, 180px) minmax(0, 1fr)",
    padding: "14px",
  },
  imagePlaceholder: {
    alignItems: "center",
    background: "linear-gradient(145deg, rgba(24, 38, 72, 0.9), rgba(12, 18, 31, 0.95))",
    border: "1px dashed rgba(138, 159, 212, 0.35)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "140px",
    padding: "12px",
    textAlign: "center",
  },
  placeholderLabel: {
    color: "#b8cdff",
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  placeholderSub: {
    color: "rgba(205, 217, 255, 0.65)",
    fontSize: "0.8rem",
    marginTop: "6px",
  },
  heroContent: {
    minWidth: 0,
  },
  heroTitleRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  heroTitle: {
    color: "#f3f7ff",
    fontSize: "1.3rem",
    margin: 0,
  },
  heroTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  tag: {
    background: "rgba(30, 52, 101, 0.45)",
    border: "1px solid rgba(134, 169, 240, 0.4)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "5px 10px",
  },
  heroHint: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.86rem",
    margin: 0,
  },
  statsGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  },
  statCard: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "10px",
    display: "grid",
    gap: "6px",
    padding: "12px",
  },
  statLabel: {
    color: "#b8cdff",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  statValue: {
    color: "#9bc0ff",
    fontSize: "1.05rem",
    fontVariantNumeric: "tabular-nums",
  },
  panel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  panelTitle: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 12px",
  },
  panelEmpty: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.88rem",
    margin: 0,
  },
  breakdownGrid: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  breakdownItem: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    padding: "10px",
  },
  breakdownHeader: {
    alignItems: "center",
    color: "#d6e4ff",
    display: "flex",
    fontSize: "0.86rem",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  progressTrack: {
    background: "rgba(20, 30, 52, 0.65)",
    borderRadius: "999px",
    height: "8px",
    overflow: "hidden",
  },
  progressFill: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    height: "100%",
  },
  twoColumn: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  bulletList: {
    display: "grid",
    gap: "8px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  strengthItem: {
    color: "#b8f5c6",
    fontSize: "0.88rem",
    lineHeight: 1.45,
  },
  weaknessItem: {
    color: "#ffb8b8",
    fontSize: "0.88rem",
    lineHeight: 1.45,
  },
  trackGroups: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  trackGroup: {
    minWidth: 0,
  },
  trackGroupTitle: {
    color: "#b8cdff",
    fontSize: "0.86rem",
    margin: "0 0 8px",
  },
  trackList: {
    display: "grid",
    gap: "6px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  trackItem: {
    borderRadius: "8px",
    fontSize: "0.84rem",
    padding: "7px 10px",
  },
  trackExcellent: {
    background: "rgba(24, 56, 36, 0.55)",
    border: "1px solid rgba(120, 200, 140, 0.35)",
    color: "#b8f5c6",
  },
  trackGood: {
    background: "rgba(30, 52, 101, 0.45)",
    border: "1px solid rgba(134, 169, 240, 0.35)",
    color: "#dce9ff",
  },
  trackAverage: {
    background: "rgba(56, 44, 18, 0.45)",
    border: "1px solid rgba(220, 180, 90, 0.3)",
    color: "#ffe6a8",
  },
  timeline: {
    display: "grid",
    gap: "8px",
  },
  timelineItem: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    padding: "10px 12px",
  },
  timelineSeason: {
    color: "#f3f7ff",
    fontWeight: 700,
  },
  timelineTier: {
    color: "#9bc0ff",
  },
  timelinePosition: {
    color: "#dce9ff",
    fontVariantNumeric: "tabular-nums",
  },
  comparePicker: {
    marginBottom: "12px",
  },
  field: {
    color: "#dce9ff",
    display: "grid",
    fontSize: "0.85rem",
    fontWeight: 600,
    gap: "6px",
  },
  select: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
  },
  compareTableWrap: {
    overflowX: "auto",
  },
  compareTable: {
    borderCollapse: "collapse",
    width: "100%",
  },
  compareTh: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontSize: "0.84rem",
    padding: "8px 10px",
    textAlign: "left",
  },
  compareTd: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#f3f7ff",
    fontSize: "0.88rem",
    fontVariantNumeric: "tabular-nums",
    padding: "8px 10px",
  },
  compareWinner: {
    background: "rgba(30, 52, 101, 0.45)",
    color: "#b8f5c6",
    fontWeight: 700,
  },
};
