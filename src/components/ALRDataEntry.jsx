import { useMemo, useState } from "react";
import { cars } from "../data/cars.js";
import { ALR_TIER_POINTS } from "../data/alrChampionshipWeighting.js";
import {
  formatTierLabel,
  tierUsesDivision,
} from "../data/alrImportSlots.js";
import ALRImageUpload from "./ALRImageUpload.jsx";
import ALRImportProgress from "./ALRImportProgress.jsx";
import {
  clearALRRecords,
  countRecordsForSeason,
  countRecordsForTierSlot,
  deleteRecordsBySeason,
  deleteRecordsByTierSlot,
  exportRecordsToJson,
  findDuplicateIndex,
  getImportProgress,
  loadALRRecords,
  loadAllSavedALRRecords,
  mergeRecords,
  saveALRRecords,
  getStorageSummary,
  summarizeRecords,
} from "../utils/alrStorage.js";

const SEASONS = Array.from({ length: 16 }, (_, index) => 20 + index);
const TIERS = Object.keys(ALR_TIER_POINTS)
  .map(Number)
  .sort((a, b) => a - b);

const sortedCars = [...cars].sort((a, b) => a.name.localeCompare(b.name));

function sortRecords(records) {
  return [...records].sort((a, b) => {
    if (a.season !== b.season) {
      return b.season - a.season;
    }
    if (a.tier !== b.tier) {
      return a.tier - b.tier;
    }
    return a.constructorsPosition - b.constructorsPosition;
  });
}

export default function ALRDataEntry() {
  const [records, setRecords] = useState(() => loadALRRecords());
  const [season, setSeason] = useState(22);
  const [tier, setTier] = useState(1);
  const [division, setDivision] = useState("");
  const [carId, setCarId] = useState(sortedCars[0]?.id ?? "");
  const [constructorsPosition, setConstructorsPosition] = useState(1);
  const [message, setMessage] = useState("");

  const carById = useMemo(
    () => new Map(cars.map((car) => [car.id, car])),
    [],
  );

  const displayRecords = useMemo(() => sortRecords(records), [records]);

  const storageSummary = useMemo(
    () => getStorageSummary(records, SEASONS, TIERS),
    [records],
  );

  const importProgress = useMemo(() => getImportProgress(records), [records]);

  const seasonDeleteCount = useMemo(
    () => countRecordsForSeason(records, season),
    [records, season],
  );

  const tierDeleteCount = useMemo(
    () =>
      countRecordsForTierSlot(
        records,
        season,
        tier,
        /** @type {'blue' | 'white' | ''} */ (division),
      ),
    [records, season, tier, division],
  );

  const tierDeleteLabel = useMemo(() => {
    const base = formatTierLabel(tier, division || undefined);
    if (tierUsesDivision(tier) && !division) {
      return `${base} (all divisions)`;
    }
    return base;
  }, [tier, division]);

  const persist = (nextRecords) => {
    setRecords(nextRecords);
    saveALRRecords(nextRecords);
  };

  const handleSave = () => {
    const position = Number(constructorsPosition);

    if (!carId) {
      setMessage("Select a car.");
      return;
    }

    if (!Number.isInteger(position) || position < 1 || position > 15) {
      setMessage("Constructor position must be between 1 and 15.");
      return;
    }

    const record = {
      season: Number(season),
      tier: Number(tier),
      car: carId,
      constructorsPosition: position,
      ...(tierUsesDivision(Number(tier)) && division
        ? { division }
        : {}),
    };

    const duplicateIndex = findDuplicateIndex(records, record);
    const nextRecords =
      duplicateIndex >= 0
        ? records.map((item, index) =>
            index === duplicateIndex ? record : item,
          )
        : [...records, record];

    persist(nextRecords);
    setMessage(
      duplicateIndex >= 0
        ? "Updated existing record for this season, tier, and car."
        : "Record saved.",
    );
  };

  const handleDelete = (index) => {
    const target = displayRecords[index];
    const nextRecords = records.filter(
      (item) =>
        !(
          item.season === target.season &&
          item.tier === target.tier &&
          item.division === target.division &&
          item.car === target.car
        ),
    );
    persist(nextRecords);
    setMessage("Record removed.");
  };

  const handleBulkSave = (incoming) => {
    const nextRecords = mergeRecords(records, incoming);
    const mergedCount = nextRecords.length;
    const batchDuplicates = incoming.length - (mergedCount - records.length);
    persist(nextRecords);

    const duplicateNote =
      batchDuplicates > 0
        ? ` (${batchDuplicates} duplicate season/tier/car entries merged)`
        : "";

    setMessage(
      `Submitted ${incoming.length} record(s) from review. ${mergedCount} unique record(s) now in storage${duplicateNote}.`,
    );
  };

  const handleExport = () => {
    const count = exportRecordsToJson(displayRecords);
    setMessage(
      `Exported ${count} record(s) from the current table view to JSON.`,
    );
  };

  const handleExportAllSaved = () => {
    const allSaved = sortRecords(loadAllSavedALRRecords());
    const count = exportRecordsToJson(allSaved, "alr-performance-all.json");
    const breakdown = summarizeRecords(allSaved);
    const breakdownText = Object.entries(breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");

    setMessage(
      `Exported ${count} saved record(s) from localStorage. Breakdown: ${breakdownText || "none"}.`,
    );
  };

  const handleClearAll = () => {
    if (records.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${records.length} saved ALR record(s) from localStorage? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    clearALRRecords();
    setRecords([]);
    setMessage("Cleared all saved ALR records.");
  };

  const handleDeleteSeason = () => {
    if (seasonDeleteCount === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${seasonDeleteCount} record(s) for Season ${season}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const nextRecords = deleteRecordsBySeason(records, season);
    persist(nextRecords);
    setMessage(`Deleted ${seasonDeleteCount} record(s) for Season ${season}.`);
  };

  const handleDeleteTier = () => {
    if (tierDeleteCount === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${tierDeleteCount} record(s) for Season ${season} ${tierDeleteLabel}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const nextRecords = deleteRecordsByTierSlot(
      records,
      season,
      tier,
      /** @type {'blue' | 'white' | ''} */ (division),
    );
    persist(nextRecords);
    setMessage(
      `Deleted ${tierDeleteCount} record(s) for Season ${season} ${tierDeleteLabel}.`,
    );
  };

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>ALR Data Entry</h2>
        <p style={styles.subtitle}>
          Enter constructor championship standings manually or import from a
          screenshot. Records are stored locally and can be exported for
          alrPerformance.js.
        </p>
      </div>

      <ALRImageUpload onSaveRecords={handleBulkSave} />

      <ALRImportProgress progress={importProgress} />

      <div style={styles.formPanel}>
        <div style={styles.formGrid}>
          <label style={styles.field}>
            Season
            <select
              value={season}
              onChange={(event) => setSeason(Number(event.target.value))}
              style={styles.select}
            >
              {SEASONS.map((value) => (
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
              onChange={(event) => {
                const nextTier = Number(event.target.value);
                setTier(nextTier);
                if (!tierUsesDivision(nextTier)) {
                  setDivision("");
                }
              }}
              style={styles.select}
            >
              {TIERS.map((value) => (
                <option key={value} value={value}>
                  Tier {value}
                </option>
              ))}
            </select>
          </label>

          {tierUsesDivision(tier) ? (
            <label style={styles.field}>
              Division
              <select
                value={division}
                onChange={(event) => setDivision(event.target.value)}
                style={styles.select}
              >
                <option value="">— Select —</option>
                <option value="blue">Blue</option>
                <option value="white">White</option>
              </select>
            </label>
          ) : null}

          <label style={{ ...styles.field, gridColumn: "1 / -1" }}>
            Car
            <select
              value={carId}
              onChange={(event) => setCarId(event.target.value)}
              style={styles.select}
            >
              {sortedCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name} ({car.class})
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            Constructor Position
            <input
              type="number"
              min="1"
              max="15"
              value={constructorsPosition}
              onChange={(event) =>
                setConstructorsPosition(Number(event.target.value))
              }
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.actionRow}>
          <button type="button" onClick={handleSave} style={styles.primaryButton}>
            Save Record
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={styles.secondaryButton}
            disabled={displayRecords.length === 0}
          >
            Export Table View
          </button>
          <button
            type="button"
            onClick={handleExportAllSaved}
            style={styles.secondaryButton}
          >
            Export All Saved Records
          </button>
          <button
            type="button"
            onClick={handleDeleteSeason}
            style={styles.dangerButton}
            disabled={seasonDeleteCount === 0}
          >
            Delete Season ({seasonDeleteCount})
          </button>
          <button
            type="button"
            onClick={handleDeleteTier}
            style={styles.dangerButton}
            disabled={tierDeleteCount === 0}
          >
            Delete Tier ({tierDeleteCount})
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            style={styles.dangerButton}
            disabled={records.length === 0}
          >
            Clear All Records
          </button>
        </div>

        {message ? <p style={styles.message}>{message}</p> : null}
      </div>

      <div style={styles.summaryPanel}>
        <h3 style={styles.summaryTitle}>Storage Summary</h3>
        <p style={styles.summaryTotal}>
          Total records:{" "}
          <span style={styles.summaryCount}>{storageSummary.total}</span>
        </p>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryColumn}>
            <h4 style={styles.summaryHeading}>Records by season</h4>
            <ul style={styles.summaryList}>
              {SEASONS.map((value) => {
                const count = storageSummary.bySeason[value] ?? 0;
                return (
                  <li
                    key={value}
                    style={{
                      ...styles.summaryItem,
                      ...(count > 0 ? styles.summaryItemActive : {}),
                    }}
                  >
                    <span>Season {value}</span>
                    <span style={styles.summaryItemCount}>{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={styles.summaryColumn}>
            <h4 style={styles.summaryHeading}>Records by tier</h4>
            <ul style={styles.summaryList}>
              {TIERS.map((value) => {
                const count = storageSummary.byTier[value] ?? 0;
                return (
                  <li
                    key={value}
                    style={{
                      ...styles.summaryItem,
                      ...(count > 0 ? styles.summaryItemActive : {}),
                    }}
                  >
                    <span>Tier {value}</span>
                    <span style={styles.summaryItemCount}>{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div style={styles.tablePanel}>
        <h3 style={styles.tableTitle}>
          Entered Records ({displayRecords.length})
        </h3>

        {displayRecords.length === 0 ? (
          <p style={styles.emptyState}>No records yet. Add standings above.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Season</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Car</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.thAction} />
                </tr>
              </thead>
              <tbody>
                {displayRecords.map((record, index) => {
                  const car = carById.get(record.car);
                  return (
                    <tr
                      key={`${record.season}-${record.tier}-${record.division ?? ""}-${record.car}`}
                    >
                      <td style={styles.td}>{record.season}</td>
                      <td style={styles.td}>
                        {formatTierLabel(record.tier, record.division)}
                      </td>
                      <td style={styles.td}>
                        {car?.name ?? record.car}
                        {car ? (
                          <span style={styles.carMeta}> ({car.class})</span>
                        ) : null}
                      </td>
                      <td style={styles.tdNumeric}>
                        {record.constructorsPosition}
                      </td>
                      <td style={styles.tdAction}>
                        <button
                          type="button"
                          onClick={() => handleDelete(index)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
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
      "radial-gradient(circle at top, rgba(30, 63, 120, 0.45), rgba(9, 12, 20, 0.95))",
    border: "1px solid rgba(122, 150, 220, 0.35)",
    borderRadius: "16px",
    color: "#f3f6ff",
    fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
    padding: "20px",
    maxWidth: "960px",
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
  formPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
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
  input: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    padding: "8px 10px",
    width: "100%",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  primaryButton: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 16px",
  },
  secondaryButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "999px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 16px",
  },
  dangerButton: {
    background: "rgba(48, 18, 18, 0.9)",
    border: "1px solid rgba(200, 120, 120, 0.45)",
    borderRadius: "999px",
    color: "#ffb8b8",
    cursor: "pointer",
    fontWeight: 600,
    padding: "8px 16px",
  },
  message: {
    margin: "12px 0 0",
    color: "#9bc0ff",
    fontSize: "0.88rem",
  },
  summaryPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  summaryTitle: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 8px",
  },
  summaryTotal: {
    color: "rgba(220, 228, 255, 0.9)",
    fontSize: "0.9rem",
    margin: "0 0 12px",
  },
  summaryCount: {
    color: "#9bc0ff",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  summaryGrid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  summaryColumn: {
    minWidth: 0,
  },
  summaryHeading: {
    color: "#b8cdff",
    fontSize: "0.82rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  summaryList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  summaryItem: {
    alignItems: "center",
    color: "rgba(205, 217, 255, 0.65)",
    display: "flex",
    fontSize: "0.88rem",
    fontVariantNumeric: "tabular-nums",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  summaryItemActive: {
    color: "#f3f7ff",
  },
  summaryItemCount: {
    fontWeight: 700,
    minWidth: "2ch",
    textAlign: "right",
  },
  tablePanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
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
  thAction: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.35)",
    padding: "8px 4px",
    width: "72px",
  },
  td: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#f3f7ff",
    padding: "8px 10px",
  },
  tdNumeric: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    color: "#9bc0ff",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    padding: "8px 10px",
  },
  tdAction: {
    borderBottom: "1px solid rgba(130, 153, 210, 0.2)",
    padding: "8px 4px",
    textAlign: "right",
  },
  carMeta: {
    color: "rgba(205, 217, 255, 0.65)",
    fontSize: "0.82rem",
  },
  deleteButton: {
    background: "transparent",
    border: "1px solid rgba(200, 120, 120, 0.45)",
    borderRadius: "6px",
    color: "#ffb8b8",
    cursor: "pointer",
    fontSize: "0.78rem",
    padding: "4px 8px",
  },
};
