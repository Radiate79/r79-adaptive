import { useMemo, useState } from "react";
import {
  ALR_PERFORMANCE_EVENTS,
  ALR_PERFORMANCE_SESSION_LABELS,
  ALR_PERFORMANCE_SESSION_TYPES,
} from "../data/alrPerformanceData.js";
import {
  getAlrDriverProfile,
  getAlrPerformanceDisplayTime,
  getTopAlrPerformanceResults,
  searchAlrPerformanceDrivers,
} from "../engine/alrPerformanceDataEngine.js";
import {
  R79_BTN_ACTIVE,
  R79_BTN_CHIP,
  R79_INNER_PANEL,
  R79_SECTION_TITLE,
} from "../styles/r79Theme.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

export default function ALRPerformanceHub() {
  const defaultEventId = ALR_PERFORMANCE_EVENTS[0]?.id ?? "";
  const [eventId, setEventId] = useState(defaultEventId);
  const [sessionType, setSessionType] = useState("qualifying");
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");

  const driverSuggestions = useMemo(
    () => searchAlrPerformanceDrivers(driverQuery, eventId),
    [driverQuery, eventId],
  );

  const driverProfile = useMemo(() => {
    const lookup = selectedDriver || driverQuery;
    return getAlrDriverProfile(lookup, eventId);
  }, [selectedDriver, driverQuery, eventId]);

  const leaderboards = useMemo(
    () =>
      Object.fromEntries(
        ALR_PERFORMANCE_SESSION_TYPES.map((type) => [
          type,
          getTopAlrPerformanceResults(eventId, type, 10),
        ]),
      ),
    [eventId],
  );

  return (
    <section className="r79-page r79-page--alr-performance">
      <R79PageHeader
        title="ALR Performance"
        subtitle="Structured race data from ALR PDF exports — expand each round as results arrive."
      />

      <div className="r79-card r79-alr-perf-controls" style={styles.controlsPanel}>
        <div className="r79-alr-perf-controls-grid" style={styles.controlsGrid}>
          <label className="r79-alr-perf-field" style={styles.fieldLabel}>
            Event
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setSelectedDriver("");
              }}
              className="r79-alr-perf-select"
              style={styles.select}
            >
              {ALR_PERFORMANCE_EVENTS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName} — {event.track}
                </option>
              ))}
            </select>
          </label>

          <label className="r79-alr-perf-field" style={styles.fieldLabel}>
            Driver search
            <input
              type="search"
              value={driverQuery}
              onChange={(event) => {
                setDriverQuery(event.target.value);
                setSelectedDriver("");
              }}
              placeholder="Search driver name…"
              className="r79-alr-perf-search"
              style={styles.searchInput}
            />
          </label>
        </div>

        {driverSuggestions.length > 0 && driverQuery && !selectedDriver ? (
          <div className="r79-alr-perf-suggestions" style={styles.suggestions}>
            {driverSuggestions.map((driver) => (
              <button
                key={driver}
                type="button"
                className="r79-alr-perf-suggestion"
                style={styles.suggestionButton}
                onClick={() => {
                  setSelectedDriver(driver);
                  setDriverQuery(driver);
                }}
              >
                {driver}
              </button>
            ))}
          </div>
        ) : null}

        <div className="r79-alr-perf-session-row" style={styles.sessionRow}>
          {ALR_PERFORMANCE_SESSION_TYPES.map((type) => {
            const isActive = sessionType === type;
            return (
              <button
                key={type}
                type="button"
                className={
                  isActive
                    ? "r79-alr-perf-session r79-alr-perf-session--active"
                    : "r79-alr-perf-session"
                }
                style={{
                  ...styles.sessionButton,
                  ...(isActive ? styles.sessionButtonActive : null),
                }}
                onClick={() => setSessionType(type)}
              >
                {ALR_PERFORMANCE_SESSION_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {driverProfile ? (
        <div className="r79-card r79-alr-perf-profile" style={styles.profilePanel}>
          <h3 style={styles.panelTitle}>Driver Profile — {driverProfile.driver}</h3>
          <div className="r79-alr-perf-profile-grid" style={styles.profileGrid}>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Car</span>
              <span style={styles.profileValue}>{driverProfile.car}</span>
            </div>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Tier</span>
              <span style={styles.profileValue}>Tier {driverProfile.tier}</span>
            </div>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Event</span>
              <span style={styles.profileValue}>{driverProfile.eventName}</span>
            </div>
            <div style={styles.profileItem}>
              <span style={styles.profileLabel}>Track</span>
              <span style={styles.profileValue}>{driverProfile.track}</span>
            </div>
          </div>
          <div className="r79-alr-perf-profile-sessions" style={styles.profileSessions}>
            {ALR_PERFORMANCE_SESSION_TYPES.map((type) => {
              const sessionRecords = driverProfile.sessions[type] ?? [];
              const best = sessionRecords[0];
              return (
                <div key={type} style={styles.profileSessionCard}>
                  <span style={styles.profileLabel}>
                    {ALR_PERFORMANCE_SESSION_LABELS[type]}
                  </span>
                  <span style={styles.profileValue}>
                    {best ? getAlrPerformanceDisplayTime(best) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="r79-alr-perf-boards" style={styles.boardsGrid}>
        {ALR_PERFORMANCE_SESSION_TYPES.map((type) => (
          <div
            key={type}
            className={`r79-card r79-alr-perf-board${
              sessionType === type ? " r79-alr-perf-board--active" : ""
            }`}
            style={styles.boardPanel}
          >
            <h3 style={styles.panelTitle}>{ALR_PERFORMANCE_SESSION_LABELS[type]}</h3>
            <p style={styles.boardHint}>Top 10</p>
            <ol className="r79-alr-perf-list" style={styles.list}>
              {(leaderboards[type] ?? []).map((record, index) => (
                <li key={record.id} style={styles.listItem}>
                  <span style={styles.rank}>{index + 1}.</span>
                  <button
                    type="button"
                    className="r79-alr-perf-driver-link"
                    style={styles.driverButton}
                    onClick={() => {
                      setSelectedDriver(record.driver);
                      setDriverQuery(record.driver);
                      setSessionType(type);
                    }}
                  >
                    {record.driver}
                  </button>
                  <span style={styles.time}>{getAlrPerformanceDisplayTime(record)}</span>
                </li>
              ))}
            </ol>
            {(leaderboards[type] ?? []).length === 0 ? (
              <p style={styles.emptyState}>No data for this session yet.</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  controlsPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "12px",
    padding: "12px",
  },
  controlsGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    marginBottom: "10px",
  },
  fieldLabel: {
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  select: {
    minHeight: "42px",
    width: "100%",
  },
  searchInput: {
    minHeight: "42px",
    width: "100%",
  },
  suggestions: {
    display: "grid",
    gap: "6px",
    marginBottom: "10px",
  },
  suggestionButton: {
    background: "rgba(20, 30, 52, 0.9)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#dce9ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.86rem",
    minHeight: "44px",
    padding: "10px 12px",
    textAlign: "left",
    width: "100%",
  },
  sessionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  sessionButton: {
    ...R79_BTN_CHIP,
    flex: "1 1 auto",
    minHeight: "44px",
    padding: "10px 12px",
    textAlign: "center",
  },
  sessionButtonActive: R79_BTN_ACTIVE,
  profilePanel: {
    ...R79_INNER_PANEL,
    marginBottom: "12px",
    padding: "12px",
  },
  panelTitle: {
    ...R79_SECTION_TITLE,
    margin: "0 0 10px",
  },
  profileGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    marginBottom: "10px",
  },
  profileItem: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
  },
  profileLabel: {
    color: "#b8cdff",
    fontSize: "0.76rem",
    fontWeight: 600,
  },
  profileValue: {
    color: "#f3f7ff",
    fontSize: "0.9rem",
    fontWeight: 600,
    wordBreak: "break-word",
  },
  profileSessions: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  },
  profileSessionCard: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
  },
  boardsGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    marginBottom: "12px",
  },
  boardPanel: {
    ...R79_INNER_PANEL,
    padding: "12px",
  },
  boardHint: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 600,
    margin: "0 0 8px",
  },
  list: {
    display: "grid",
    gap: "6px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  listItem: {
    alignItems: "center",
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "6px 8px",
    gridTemplateColumns: "auto 1fr auto",
    padding: "8px 10px",
  },
  rank: {
    color: "#b8cdff",
    fontSize: "0.84rem",
    fontWeight: 700,
  },
  driverButton: {
    background: "transparent",
    border: "none",
    color: "#dce9ff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.86rem",
    fontWeight: 600,
    padding: 0,
    textAlign: "left",
  },
  driverName: {
    color: "#dce9ff",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  time: {
    color: "#9bc0ff",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "0.86rem",
    fontWeight: 700,
  },
  emptyState: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.88rem",
    margin: 0,
  },
};
