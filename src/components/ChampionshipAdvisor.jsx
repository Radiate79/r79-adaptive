import { useMemo, useState } from "react";
import { tracks } from "../data/tracks.js";
import { recommendCarsForChampionship } from "../engine/championshipEngine.js";

export default function ChampionshipAdvisor() {
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [carClass, setCarClass] = useState("Gr.3");

  const recommendations = useMemo(() => {
    if (selectedTrackIds.length === 0) {
      return [];
    }

    return recommendCarsForChampionship(selectedTrackIds, carClass).slice(0, 5);
  }, [selectedTrackIds, carClass]);

  const toggleTrack = (trackId) => {
    setSelectedTrackIds((current) =>
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId],
    );
  };

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>R79 Championship Advisor</h2>
        <p style={styles.subtitle}>
          Select tracks and class to get the strongest championship car.
        </p>
      </div>

      <div style={styles.classRow}>
        {["Gr.3", "Gr.4"].map((value) => {
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

      <div style={styles.trackGrid}>
        {tracks.map((track) => {
          const selected = selectedTrackIds.includes(track.id);
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => toggleTrack(track.id)}
              style={{
                ...styles.trackButton,
                ...(selected ? styles.trackButtonSelected : null),
              }}
            >
              {track.name}
            </button>
          );
        })}
      </div>

      <div style={styles.resultsPanel}>
        <h3 style={styles.resultsTitle}>Top 5 Recommendations</h3>
        {recommendations.length === 0 ? (
          <p style={styles.emptyState}>
            Select one or more tracks to generate recommendations.
          </p>
        ) : (
          <ol style={styles.resultsList}>
            {recommendations.map((car) => (
              <li key={car.id} style={styles.resultItem}>
                <span style={styles.carName}>{car.name}</span>
                <span style={styles.score}>{car.score.toFixed(2)}</span>
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
  trackGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },
  trackButton: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "10px",
    color: "#dbe6ff",
    cursor: "pointer",
    fontSize: "0.88rem",
    minHeight: "42px",
    padding: "8px 10px",
    textAlign: "left",
  },
  trackButtonSelected: {
    background: "linear-gradient(135deg, rgba(45, 85, 180, 0.85), rgba(22, 42, 90, 0.95))",
    borderColor: "#84acff",
    color: "#ffffff",
  },
  resultsPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    paddingBottom: "6px",
  },
  carName: {
    color: "#f3f7ff",
  },
  score: {
    color: "#9bc0ff",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
};
