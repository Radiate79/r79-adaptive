import { useMemo, useState } from "react";
import R79PageHeader from "./branding/R79PageHeader.jsx";
import {
  ALR_HISTORICAL_SEASONS,
  ALR_TIER_POINTS,
} from "../data/alrChampionshipWeighting.js";
import {
  getALRHistoricalRankings,
  getAvailableRankingManufacturers,
} from "../engine/alrRankingsEngine.js";
const TIERS = Object.keys(ALR_TIER_POINTS)
  .map(Number)
  .sort((a, b) => a - b);
const DRIVETRAINS = ["FR", "MR", "4WD", "FF"];

const TREND_STYLES = {
  Up: { color: "#b8f5c6", label: "Up" },
  Down: { color: "#ffb8b8", label: "Down" },
  Stable: { color: "#ffe6a8", label: "Stable" },
};

export default function ALRHistoricalRankings() {
  const [season, setSeason] = useState("");
  const [tier, setTier] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [drivetrain, setDrivetrain] = useState("");

  const filters = useMemo(
    () => ({
      season,
      tier,
      manufacturer,
      drivetrain,
    }),
    [season, tier, manufacturer, drivetrain],
  );

  const rankings = useMemo(
    () => getALRHistoricalRankings(filters, 25),
    [filters],
  );

  const manufacturerOptions = useMemo(
    () =>
      getAvailableRankingManufacturers({
        season,
        tier,
        drivetrain,
      }),
    [season, tier, drivetrain],
  );

  const activeFilterLabels = useMemo(() => {
    const labels = [];
    if (season !== "") {
      labels.push(`Season ${season}`);
    } else {
      labels.push("Seasons 20–22");
    }
    if (tier !== "") {
      labels.push(`Tier ${tier}`);
    }
    if (manufacturer) {
      labels.push(manufacturer);
    }
    if (drivetrain) {
      labels.push(drivetrain);
    }
    return labels;
  }, [season, tier, manufacturer, drivetrain]);

  return (
    <section className="r79-page r79-page--wide">
      <R79PageHeader
        title="Historical Rankings"
        subtitle="Explore car and constructor trends from imported race data."
      />

      <div style={styles.filtersPanel}>
        <div style={styles.filtersGrid}>
          <label style={styles.field}>
            Season
              <select
                value={season}
                onChange={(event) =>
                  setSeason(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                style={styles.select}
              >
                <option value="">All (20–22)</option>
                {ALR_HISTORICAL_SEASONS.map((value) => (
                  <option key={value} value={value}>
                    Season {value}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.field}>
            Tier
              <select
                value={tier}
                onChange={(event) =>
                  setTier(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                style={styles.select}
              >
                <option value="">All Tiers</option>
                {TIERS.map((value) => (
                  <option key={value} value={value}>
                    Tier {value}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.field}>
            Manufacturer
              <select
                value={manufacturer}
                onChange={(event) => setManufacturer(event.target.value)}
                style={styles.select}
              >
                <option value="">All Manufacturers</option>
                {manufacturerOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.field}>
            Drivetrain
              <select
                value={drivetrain}
                onChange={(event) => setDrivetrain(event.target.value)}
                style={styles.select}
              >
                <option value="">All Drivetrains</option>
                {DRIVETRAINS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
          </label>
        </div>

        <div style={styles.filterTags}>
          {activeFilterLabels.map((label) => (
            <span key={label} style={styles.filterTag}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.tablePanel}>
        <h3 style={styles.tableTitle}>
          Top 25 Cars ({rankings.length} shown)
        </h3>

        {rankings.length === 0 ? (
          <p style={styles.emptyState}>
            No historical race records match these filters. Import standings in
            Race Archive to populate rankings.
          </p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thRank}>#</th>
                  <th style={styles.th}>Car</th>
                  <th style={styles.thNumeric}>Historical Score</th>
                  <th style={styles.thNumeric}>Wins</th>
                  <th style={styles.thNumeric}>Podiums</th>
                  <th style={styles.thNumeric}>Avg Pos</th>
                  <th style={styles.thNumeric}>Seasons</th>
                  <th style={styles.thTrend}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((row, index) => {
                  const trendStyle = TREND_STYLES[row.trend];
                  return (
                    <tr key={row.carId}>
                      <td style={styles.tdRank}>{index + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.carName}>{row.name}</span>
                        <span style={styles.carMeta}>
                          {row.manufacturer}
                          {row.drivetrain ? ` · ${row.drivetrain}` : ""}
                          {row.class ? ` · ${row.class}` : ""}
                        </span>
                      </td>
                      <td style={styles.tdNumeric}>
                        {row.historicalScore.toFixed(1)}
                      </td>
                      <td style={styles.tdNumeric}>{row.championshipWins}</td>
                      <td style={styles.tdNumeric}>{row.podiums}</td>
                      <td style={styles.tdNumeric}>
                        {row.averagePosition?.toFixed(2) ?? "—"}
                      </td>
                      <td style={styles.tdNumeric}>{row.seasonsEntered}</td>
                      <td style={styles.tdTrend}>
                        <span
                          style={{
                            ...styles.trendBadge,
                            color: trendStyle.color,
                            borderColor: trendStyle.color,
                          }}
                        >
                          {trendStyle.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

const styles = {
  shell: {
    background:
      "radial-gradient(circle at top, rgba(34, 211, 238, 0.1), rgba(8, 11, 18, 0.98))",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    borderRadius: "16px",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    padding: "20px",
    boxShadow: "0 10px 36px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 28px rgba(34, 211, 238, 0.06)",
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
  filtersPanel: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.18)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  filtersGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    marginBottom: "12px",
  },
  field: {
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
  filterTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  filterTag: {
    background: "rgba(30, 52, 101, 0.45)",
    border: "1px solid rgba(134, 169, 240, 0.4)",
    borderRadius: "999px",
    color: "#dce9ff",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "5px 10px",
  },
  tablePanel: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.16)",
    borderRadius: "12px",
    padding: "14px",
  },
  tableTitle: {
    margin: "0 0 10px",
    fontSize: "1rem",
    color: "#e8efff",
  },
  emptyState: {
    margin: 0,
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: "0.88rem",
  },
  th: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontWeight: 600,
    padding: "8px 10px",
    textAlign: "left",
  },
  thRank: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontWeight: 600,
    padding: "8px 8px",
    textAlign: "center",
    width: "40px",
  },
  thNumeric: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontWeight: 600,
    padding: "8px 10px",
    textAlign: "right",
  },
  thTrend: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    color: "#b8cdff",
    fontWeight: 600,
    padding: "8px 10px",
    textAlign: "center",
    width: "80px",
  },
  td: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#f3f7ff",
    padding: "10px",
    verticalAlign: "top",
  },
  tdRank: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#9bc0ff",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    padding: "10px 8px",
    textAlign: "center",
  },
  tdNumeric: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#9bc0ff",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    padding: "10px",
    textAlign: "right",
  },
  tdTrend: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    padding: "10px",
    textAlign: "center",
  },
  carName: {
    display: "block",
    fontWeight: 600,
  },
  carMeta: {
    color: "rgba(205, 217, 255, 0.65)",
    display: "block",
    fontSize: "0.8rem",
    marginTop: "3px",
  },
  trendBadge: {
    border: "1px solid",
    borderRadius: "999px",
    display: "inline-block",
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "4px 10px",
  },
};
