import { useEffect, useMemo, useState } from "react";
import { GAME_CATALOG } from "../data/gameVersions.js";
import { WHEEL_BASE_OPTIONS } from "../data/wheelBases.js";
import {
  NO_EXACT_SETUP_MESSAGE,
  TYRE_COMPOUND_OPTIONS,
} from "../data/wheelSetupsMeta.js";
import {
  findWheelSetup,
  formatWheelSetupValues,
  searchWheelSetups,
} from "../engine/wheelSettingsEngine.js";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  CAR_CLASS_OPTIONS,
  DEFAULT_CAR_CLASS,
} from "../data/carClasses.js";
import {
  getCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  getTracksForGame,
} from "../utils/gameData.js";
import {
  loadWheelSettingsPreferences,
  saveWheelSettingsPreferences,
} from "../utils/wheelSetupsStorage.js";
import {
  R79_BTN_ACTIVE,
  R79_BTN_CHIP,
  R79_BTN_SECONDARY,
  R79_INNER_PANEL,
  R79_SECTION_TITLE,
} from "../styles/r79Theme.js";
import R79PageHeader from "./branding/R79PageHeader.jsx";

/**
 * @typedef {Object} WheelSettingsPrefill
 * @property {string} [gameVersion]
 * @property {string} [wheelBase]
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {string} [tyreCompound]
 * @property {boolean} [bopOn]
 */

/**
 * @param {{ prefill?: WheelSettingsPrefill | null, onPrefillConsumed?: () => void }} props
 */
export default function WheelSettingsHub({
  prefill = null,
  onPrefillConsumed,
}) {
  const { gameVersion: contextGameVersion, gameOptions } = useGameVersion();
  const savedPrefs = useMemo(() => loadWheelSettingsPreferences(), []);

  const [filterGame, setFilterGame] = useState(
    prefill?.gameVersion ?? savedPrefs.gameVersion ?? contextGameVersion,
  );
  const [carClass, setCarClass] = useState(
    prefill?.carClass ?? savedPrefs.carClass ?? DEFAULT_CAR_CLASS,
  );
  const [wheelBase, setWheelBase] = useState(
    prefill?.wheelBase ?? savedPrefs.wheelBase ?? "thrustmaster_t598",
  );
  const [carId, setCarId] = useState(prefill?.carId ?? savedPrefs.carId ?? "");
  const [trackId, setTrackId] = useState(
    prefill?.trackId ?? savedPrefs.trackId ?? "",
  );
  const [tyreCompound, setTyreCompound] = useState(
    prefill?.tyreCompound ?? savedPrefs.tyreCompound ?? "M",
  );
  const [bopOn, setBopOn] = useState(
    prefill?.bopOn ?? savedPrefs.bopOn ?? true,
  );

  const [searchQuery, setSearchQuery] = useState("");

  const cars = useMemo(
    () =>
      (getCarsForGame(filterGame) ?? []).filter(
        (car) => car?.class === carClass,
      ),
    [filterGame, carClass],
  );
  const allTracks = useMemo(() => getTracksForGame(filterGame), [filterGame]);
  const tracks = useMemo(
    () => getSelectableTracksForClass(filterGame, carClass),
    [filterGame, carClass],
  );
  const searchMatches = useMemo(
    () => searchWheelSetups(searchQuery, filterGame) ?? [],
    [searchQuery, filterGame],
  );
  const filteredCars = useMemo(() => cars, [cars]);
  const filteredTracks = useMemo(() => tracks, [tracks]);

  useEffect(() => {
    if (!prefill) {
      return;
    }

    if (prefill.gameVersion) setFilterGame(prefill.gameVersion);
    if (prefill.wheelBase) setWheelBase(prefill.wheelBase);
    if (prefill.carId) setCarId(prefill.carId);
    if (prefill.trackId) setTrackId(prefill.trackId);
    if (prefill.tyreCompound) setTyreCompound(prefill.tyreCompound);
    if (prefill.bopOn !== undefined) setBopOn(prefill.bopOn);

    onPrefillConsumed?.();
  }, [prefill, onPrefillConsumed]);

  useEffect(() => {
    if (carId && !cars.some((car) => car.id === carId)) {
      setCarId("");
    }
  }, [carId, cars]);

  useEffect(() => {
    if (trackId && !tracks.some((track) => track.id === trackId)) {
      setTrackId("");
    }
  }, [trackId, tracks]);

  useEffect(() => {
    saveWheelSettingsPreferences({
      gameVersion: filterGame,
      carClass,
      wheelBase,
      carId,
      trackId,
      tyreCompound,
      bopOn,
    });
  }, [filterGame, carClass, wheelBase, carId, trackId, tyreCompound, bopOn]);

  const lookup = useMemo(
    () =>
      findWheelSetup({
        gameVersion: filterGame,
        wheelBase,
        carId,
        trackId,
        tyreCompound,
        bopOn,
      }),
    [filterGame, wheelBase, carId, trackId, tyreCompound, bopOn],
  );

  const setupRows = lookup.setup ? formatWheelSetupValues(lookup.setup) : [];
  const selectedCar = cars.find((car) => car.id === carId) ?? null;
  const selectedTrack = tracks.find((track) => track.id === trackId) ?? null;
  const wheelLabel =
    WHEEL_BASE_OPTIONS.find((option) => option.id === wheelBase)?.label ??
    wheelBase;

  const resetWheelSettings = () => {
    setFilterGame(contextGameVersion);
    setCarClass(DEFAULT_CAR_CLASS);
    setWheelBase("thrustmaster_t598");
    setCarId("");
    setTrackId("");
    setTyreCompound("M");
    setBopOn(true);
    setSearchQuery("");
  };

  const handleResetWheelSettings = () => {
    if (
      !window.confirm("Reset all wheel settings to their default values?")
    ) {
      return;
    }

    resetWheelSettings();
  };

  return (
    <section className="r79-page">
      <R79PageHeader
        title="Wheel Settings"
        subtitle="Professional wheel-base settings for Gran Turismo 7."
      />

      <details className="r79-details">
        <summary>
          Where does the wheel data come from?
        </summary>
        <p>
          R79 wheel profiles are built from GT7 testing, league racing
          experience, community feedback and continuous refinement. Settings are
          designed as strong starting points and may be adjusted to suit each
          driver&apos;s style, equipment and car choice.
        </p>
      </details>

      <div className="r79-card" style={styles.filtersPanel}>
        <div style={styles.filtersHeader}>
          <h3 className="r79-section-title" style={styles.panelTitle}>
            Filters
          </h3>
        </div>
        <label style={styles.searchField}>
          Search setups, cars, or tracks
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="e.g. Ferrari, Spa, T598"
            style={styles.searchInput}
          />
        </label>
        {searchQuery.trim() && searchMatches.length > 0 ? (
          <div style={styles.searchResults}>
            {searchMatches.map((setup) => {
              const carName =
                cars.find((car) => car.id === setup.carId)?.name ?? setup.carId;
              const trackName = getTrackDisplayName(
                tracks.find((track) => track.id === setup.trackId) ?? {
                  displayName: setup.trackId,
                },
              );
              const wheelName =
                WHEEL_BASE_OPTIONS.find((option) => option.id === setup.wheelBase)
                  ?.label ?? setup.wheelBase;

              return (
                <button
                  key={setup.id}
                  type="button"
                  onClick={() => {
                    if (!tracks.some((entry) => entry.id === setup.trackId)) {
                      return;
                    }

                    setWheelBase(setup.wheelBase);
                    setCarId(setup.carId);
                    setTrackId(setup.trackId);
                    setTyreCompound(setup.tyreCompound);
                    setBopOn(setup.bopOn);
                  }}
                  style={styles.searchResultButton}
                >
                  {carName} · {trackName} · {wheelName}
                </button>
              );
            })}
          </div>
        ) : null}
        <div style={styles.filtersGrid}>
          <label style={styles.fieldLabel}>
            Game
            <div style={styles.toggleRow}>
              {gameOptions.map((version) => {
                const entry = GAME_CATALOG[version];
                const isActive = filterGame === version;
                return (
                  <button
                    key={version}
                    type="button"
                    onClick={() => setFilterGame(version)}
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
            Car Class
            <div style={styles.toggleRow}>
              {CAR_CLASS_OPTIONS.map((value) => {
                const isActive = carClass === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCarClass(value);
                      setCarId("");
                      setTrackId("");
                    }}
                    style={{
                      ...styles.toggleButton,
                      ...(isActive ? styles.toggleButtonActive : null),
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </label>

          <label style={styles.fieldLabel}>
            Wheel Base
              <select
                value={wheelBase}
                onChange={(event) => setWheelBase(event.target.value)}
                style={styles.controlSelect}
              >
                {WHEEL_BASE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.fieldLabel}>
            Car
              <select
                value={carId}
                onChange={(event) => setCarId(event.target.value)}
                style={styles.controlSelect}
              >
                <option value="">Select a car…</option>
                {filteredCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.fieldLabel}>
            Track
              <select
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                style={styles.controlSelect}
              >
                <option value="">Select a track…</option>
                {filteredTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {getTrackDisplayName(track)}
                  </option>
                ))}
              </select>
          </label>

          <label style={styles.fieldLabel}>
            Tyre Compound
              <select
                value={tyreCompound}
                onChange={(event) => setTyreCompound(event.target.value)}
                style={styles.controlSelect}
              >
                {TYRE_COMPOUND_OPTIONS.map((compound) => (
                  <option key={compound} value={compound}>
                    {compound}
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
        </div>
      </div>

      <div style={styles.resultsPanel}>
        <div style={styles.resultsHeader}>
          <h3 style={styles.panelTitle}>Wheel Setup</h3>
        </div>

        {!carId || !trackId ? (
          <p style={styles.emptyState}>Select a car and track to load settings.</p>
        ) : lookup.setup ? (
          <>
            <p style={styles.contextLine}>
              {GAME_CATALOG[filterGame]?.shortLabel} · {carClass} · {wheelLabel} ·{" "}
              {selectedCar?.name} · {getTrackDisplayName(selectedTrack)} · {tyreCompound} · BOP{" "}
              {bopOn ? "On" : "Off"}
            </p>
            {lookup.message ? (
              <p style={styles.matchNotice}>{lookup.message}</p>
            ) : null}
            <div style={styles.valuesGrid}>
              {setupRows.map((row) => (
                <div key={row.key} style={styles.valueCard}>
                  <span style={styles.valueLabel}>{row.label}</span>
                  {row.description ? (
                    <p style={styles.fieldDescription}>{row.description}</p>
                  ) : null}
                  <div style={styles.recommendedBlock}>
                    <span style={styles.recommendedLabel}>Recommended value:</span>
                    <span style={styles.valueText}>{String(row.value)}</span>
                  </div>
                  {row.reason ? (
                    <div style={styles.reasonBlock}>
                      <span style={styles.reasonLabel}>Reason:</span>
                      <p style={styles.reasonText}>{row.reason}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {lookup.setup.lastUpdated ? (
              <p style={styles.lastUpdated}>
                Last Updated: {lookup.setup.lastUpdated}
              </p>
            ) : null}
          </>
        ) : (
          <p style={styles.emptyState}>{NO_EXACT_SETUP_MESSAGE}</p>
        )}
      </div>

      <div style={styles.resetRow}>
        <button
          type="button"
          onClick={handleResetWheelSettings}
          className="r79-btn-secondary"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

const styles = {
  filtersPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "12px",
    padding: "12px",
  },
  filtersHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  resetRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: "4px",
    paddingTop: "8px",
  },
  searchField: {
    color: "#dce9ff",
    display: "grid",
    gap: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "10px",
  },
  searchInput: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#f3f7ff",
    fontSize: "0.9rem",
    padding: "9px 10px",
  },
  searchResults: {
    display: "grid",
    gap: "6px",
    marginBottom: "10px",
  },
  searchResultButton: {
    background: "rgba(20, 30, 52, 0.9)",
    border: "1px solid rgba(128, 160, 229, 0.35)",
    borderRadius: "8px",
    color: "#dce9ff",
    cursor: "pointer",
    fontSize: "0.84rem",
    padding: "8px 10px",
    textAlign: "left",
  },
  filtersGrid: {
    alignItems: "end",
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  panelTitle: {
    ...R79_SECTION_TITLE,
    margin: 0,
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
  controlSelect: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "#dbe6ff",
    fontSize: "0.9rem",
    minHeight: "42px",
    padding: "8px 10px",
    width: "100%",
  },
  toggleRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  toggleButton: {
    ...R79_BTN_CHIP,
    padding: "7px 14px",
  },
  toggleButtonActive: R79_BTN_ACTIVE,
  resultsPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "12px",
    padding: "12px",
  },
  resultsHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  valuesGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  valueCard: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
  },
  fieldDescription: {
    color: "#c5d8ff",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: 0,
  },
  recommendedBlock: {
    display: "grid",
    gap: "2px",
  },
  recommendedLabel: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  reasonBlock: {
    display: "grid",
    gap: "2px",
  },
  reasonLabel: {
    color: "#9bc0ff",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  reasonText: {
    color: "#e8f0ff",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: 0,
  },
  lastUpdated: {
    color: "#9bc0ff",
    fontSize: "0.84rem",
    margin: "12px 0 0",
  },
  valueLabel: {
    color: "#b8cdff",
    fontSize: "0.76rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  valueText: {
    color: "#f3f7ff",
    fontSize: "0.95rem",
    fontWeight: 600,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  contextLine: {
    color: "#9bc0ff",
    fontSize: "0.86rem",
    margin: "0 0 10px",
  },
  matchNotice: {
    color: "#ffe6a8",
    fontSize: "0.86rem",
    margin: "0 0 10px",
  },
  emptyState: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
    margin: 0,
  },
};
