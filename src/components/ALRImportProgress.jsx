import { ALR_IMPORT_COMPLETE_MIN_RECORDS } from "../data/alrImportSlots.js";

/**
 * @param {{
 *   progress: ReturnType<import("../utils/alrStorage.js").getImportProgress>;
 * }} props
 */
export default function ALRImportProgress({ progress }) {
  const completeSlots = progress.reduce(
    (total, season) => total + season.slots.filter((slot) => slot.complete).length,
    0,
  );
  const totalSlots = progress.reduce(
    (total, season) => total + season.slots.length,
    0,
  );

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Import Progress</h3>
      <p style={styles.subtitle}>
        {completeSlots} of {totalSlots} slots complete. A slot is marked complete
        when it has {ALR_IMPORT_COMPLETE_MIN_RECORDS}+ constructor records.
        Tier 2 and Tier 4 require a Blue or White division when saving.
      </p>

      <div style={styles.seasonList}>
        {progress.map((seasonBlock) => (
          <section key={seasonBlock.season} style={styles.seasonBlock}>
            <h4 style={styles.seasonTitle}>Season {seasonBlock.season}</h4>
            <ul style={styles.slotList}>
              {seasonBlock.slots.map((slot) => (
                <li
                  key={`${seasonBlock.season}-${slot.tier}-${slot.division ?? "none"}`}
                  style={{
                    ...styles.slotItem,
                    ...(slot.complete ? styles.slotItemComplete : styles.slotItemIncomplete),
                  }}
                >
                  <span style={styles.slotStatus}>
                    {slot.complete ? "✓" : "✗"}
                  </span>
                  <span style={styles.slotLabel}>{slot.label}</span>
                  <span style={styles.slotCount}>{slot.count}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: "rgba(6, 10, 20, 0.72)",
    border: "1px solid rgba(34, 211, 238, 0.18)",
    borderRadius: "12px",
    marginBottom: "14px",
    padding: "14px",
  },
  title: {
    color: "#e8efff",
    fontSize: "1rem",
    margin: "0 0 6px",
  },
  subtitle: {
    color: "rgba(205, 217, 255, 0.75)",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: "0 0 14px",
  },
  seasonList: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  seasonBlock: {
    minWidth: 0,
  },
  seasonTitle: {
    color: "#b8cdff",
    fontSize: "0.92rem",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  slotList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  slotItem: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.88rem",
    gap: "8px",
    padding: "4px 0",
  },
  slotItemComplete: {
    color: "#b8f5c6",
  },
  slotItemIncomplete: {
    color: "rgba(205, 217, 255, 0.55)",
  },
  slotStatus: {
    fontWeight: 700,
    width: "1.2ch",
  },
  slotLabel: {
    flex: 1,
  },
  slotCount: {
    color: "rgba(205, 217, 255, 0.65)",
    fontVariantNumeric: "tabular-nums",
    fontSize: "0.8rem",
    minWidth: "2ch",
    textAlign: "right",
  },
};
