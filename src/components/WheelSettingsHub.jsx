import { useEffect, useMemo, useState } from "react";
import { GAME_CATALOG } from "../data/gameVersions.js";
import { WHEEL_BASE_OPTIONS } from "../data/wheelBases.js";
import {
  NO_EXACT_SETUP_MESSAGE,
  TYRE_COMPOUND_OPTIONS,
} from "../data/wheelSetupsMeta.js";
import {
  buildWheelSetupPresentation,
  findWheelSetup,
  searchWheelSetups,
} from "../engine/wheelSettingsEngine.js";
import { isPodiumInputComplete } from "../engine/podiumEngine.js";
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
 * @param {{ icon: string, label: string, value: string, children: import("react").ReactNode }} props
 */
function MobileFilterRow({ icon, label, value, children }) {
  return (
    <div className="r79-mobile-filter-row">
      <span className="r79-mobile-filter-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="r79-mobile-filter-row__label">{label}</span>
      <span className="r79-mobile-filter-row__value">{value}</span>
      <span className="r79-mobile-filter-row__arrow" aria-hidden="true">
        ›
      </span>
      {children}
    </div>
  );
}

/**
 * @param {{
 *   fuelMultiplier: number,
 *   tyreMultiplier: number,
 *   lapCount: number,
 *   onFuelChange: (value: number) => void,
 *   onTyreChange: (value: number) => void,
 *   onLapCountChange: (value: number) => void,
 * }} props
 */
function MobileWearMultiplierRow({
  fuelMultiplier,
  tyreMultiplier,
  lapCount,
  onFuelChange,
  onTyreChange,
  onLapCountChange,
}) {
  const [open, setOpen] = useState(false);
  const valueText = `${lapCount} laps · Fuel x${fuelMultiplier} · Tyres x${tyreMultiplier}`;

  return (
    <div
      className={
        open
          ? "r79-mobile-filter-row-wrap r79-mobile-filter-row-wrap--open"
          : "r79-mobile-filter-row-wrap"
      }
    >
      <button
        type="button"
        className="r79-mobile-filter-row r79-mobile-filter-row--toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="r79-mobile-filter-row__icon" aria-hidden="true">
          ⛽
        </span>
        <span className="r79-mobile-filter-row__label">Race Conditions</span>
        <span className="r79-mobile-filter-row__value">{valueText}</span>
        <span
          className={
            open
              ? "r79-mobile-filter-row__arrow r79-mobile-filter-row__arrow--open"
              : "r79-mobile-filter-row__arrow"
          }
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {open ? (
        <div className="r79-mobile-filter-panel">
          <label className="r79-mobile-filter-panel__field">
            <span className="r79-mobile-filter-panel__label">Number of Laps</span>
            <div className="r79-mobile-filter-panel__control">
              <input
                type="number"
                className="r79-mobile-filter-panel__number"
                min="1"
                max="999"
                step="1"
                value={lapCount}
                onChange={(event) =>
                  onLapCountChange(
                    Math.max(1, Math.min(999, Number(event.target.value) || 1)),
                  )
                }
              />
              <span className="r79-mobile-filter-panel__value">{lapCount} laps</span>
            </div>
          </label>

          <label className="r79-mobile-filter-panel__field">
            <span className="r79-mobile-filter-panel__label">Fuel Multiplier</span>
            <div className="r79-mobile-filter-panel__control">
              <input
                type="range"
                className="r79-mobile-filter-panel__range"
                min="1"
                max="10"
                step="1"
                value={fuelMultiplier}
                onChange={(event) => onFuelChange(Number(event.target.value))}
              />
              <span className="r79-mobile-filter-panel__value">x{fuelMultiplier}</span>
            </div>
          </label>

          <label className="r79-mobile-filter-panel__field">
            <span className="r79-mobile-filter-panel__label">Tyre Wear Multiplier</span>
            <div className="r79-mobile-filter-panel__control">
              <input
                type="range"
                className="r79-mobile-filter-panel__range"
                min="1"
                max="10"
                step="1"
                value={tyreMultiplier}
                onChange={(event) => onTyreChange(Number(event.target.value))}
              />
              <span className="r79-mobile-filter-panel__value">x{tyreMultiplier}</span>
            </div>
          </label>
        </div>
      ) : null}
    </div>
  );
}

/**
 * @typedef {Object} WheelSettingsPrefill
 * @property {string} [gameVersion]
 * @property {string} [wheelBase]
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {string} [tyreCompound]
 * @property {boolean} [bopOn]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 * @property {number} [lapCount]
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
  const [fuelMultiplier, setFuelMultiplier] = useState(
    prefill?.fuelMultiplier ?? savedPrefs.fuelMultiplier ?? 1,
  );
  const [tyreMultiplier, setTyreMultiplier] = useState(
    prefill?.tyreMultiplier ?? savedPrefs.tyreMultiplier ?? 1,
  );
  const [lapCount, setLapCount] = useState(
    prefill?.lapCount ?? savedPrefs.lapCount ?? 1,
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
    if (prefill.fuelMultiplier !== undefined) {
      setFuelMultiplier(prefill.fuelMultiplier);
    }
    if (prefill.tyreMultiplier !== undefined) {
      setTyreMultiplier(prefill.tyreMultiplier);
    }
    if (prefill.lapCount !== undefined) {
      setLapCount(prefill.lapCount);
    }

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
      fuelMultiplier,
      tyreMultiplier,
      lapCount,
    });
  }, [
    filterGame,
    carClass,
    wheelBase,
    carId,
    trackId,
    tyreCompound,
    bopOn,
    fuelMultiplier,
    tyreMultiplier,
    lapCount,
  ]);

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

  const podiumInput = useMemo(
    () => ({
      gameVersion: filterGame,
      wheelBase,
      carId,
      trackId,
      tyreCompound,
      bopOn,
      fuelMultiplier,
      tyreMultiplier,
      lapCount,
    }),
    [
      filterGame,
      wheelBase,
      carId,
      trackId,
      tyreCompound,
      bopOn,
      fuelMultiplier,
      tyreMultiplier,
      lapCount,
    ],
  );

  const podiumReady = isPodiumInputComplete(podiumInput);

  const canShowSetup = Boolean(carId && trackId && wheelBase);

  const presentation = useMemo(() => {
    if (!lookup.setup || !canShowSetup) {
      return { rows: [], podium: null };
    }

    return buildWheelSetupPresentation(
      lookup.setup,
      podiumReady ? podiumInput : { wheelBase },
    );
  }, [lookup.setup, canShowSetup, podiumReady, podiumInput, wheelBase]);

  const setupRows = presentation.rows;
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
    setFuelMultiplier(1);
    setTyreMultiplier(1);
    setLapCount(1);
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

  const wheelDataSourceDetails = (
    <>
      <summary>Where does the wheel data come from?</summary>
      <p>
        R79 wheel profiles are built from GT7 testing, league racing experience,
        community feedback and continuous refinement. Settings are designed as
        strong starting points and may be adjusted to suit each driver&apos;s
        style, equipment and car choice.
      </p>
    </>
  );

  return (
    <section className="r79-page r79-page--wheel-settings">
      <div className="r79-wheel-page-header-wrap">
        <R79PageHeader
          title="Wheel Settings"
          subtitle="Professional wheel-base settings for Gran Turismo 7."
        />
      </div>

      <details className="r79-details r79-wheel-details r79-wheel-details--desktop">
        {wheelDataSourceDetails}
      </details>

      <div className="r79-card r79-wheel-intro-card" style={styles.introPanel}>
        <h2 className="r79-wheel-mobile-heading">Wheel Settings</h2>
        <p className="r79-wheel-mobile-subtitle">
          Professional wheel-base settings for Gran Turismo 7.
        </p>
        <details className="r79-details r79-wheel-details r79-wheel-details--mobile">
          {wheelDataSourceDetails}
        </details>
      </div>

      <div className="r79-card r79-wheel-filters" style={styles.filtersPanel}>
        <div style={styles.filtersHeader}>
          <h3 className="r79-section-title r79-wheel-filters-title" style={styles.panelTitle}>
            Filters
          </h3>
        </div>
        <label className="r79-wheel-search r79-wheel-search--mobile" style={styles.searchField}>
          <span className="r79-wheel-search__label">Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="e.g. Ferrari, Spa, T598"
            className="r79-wheel-search-input"
            style={styles.searchInput}
          />
        </label>
        {searchQuery.trim() && searchMatches.length > 0 ? (
          <div className="r79-wheel-search-results" style={styles.searchResults}>
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
                  className="r79-wheel-search-hit"
                  style={styles.searchResultButton}
                >
                  {carName} · {trackName} · {wheelName}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="r79-wheel-filters-mobile">
          <div className="r79-wheel-mobile-class-row">
            <span className="r79-wheel-mobile-class-label">Car Class</span>
            <div className="r79-wheel-chip-row" style={styles.toggleRow}>
              {CAR_CLASS_OPTIONS.map((value) => {
                const isActive = carClass === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={
                      isActive
                        ? "r79-wheel-chip r79-wheel-chip--active"
                        : "r79-wheel-chip"
                    }
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
          </div>

          <MobileFilterRow
            icon="🚗"
            label="Car"
            value={selectedCar?.name ?? "Select a car…"}
          >
            <select
              value={carId}
              onChange={(event) => setCarId(event.target.value)}
              className="r79-mobile-filter-row__select"
              aria-label="Car"
            >
              <option value="">Select a car…</option>
              {filteredCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </MobileFilterRow>

          <MobileFilterRow
            icon="🏁"
            label="Track"
            value={
              selectedTrack
                ? getTrackDisplayName(selectedTrack)
                : "Select a track…"
            }
          >
            <select
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
              className="r79-mobile-filter-row__select"
              aria-label="Track"
            >
              <option value="">Select a track…</option>
              {filteredTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {getTrackDisplayName(track)}
                </option>
              ))}
            </select>
          </MobileFilterRow>

          <MobileFilterRow icon="🛞" label="Tyre" value={tyreCompound}>
            <select
              value={tyreCompound}
              onChange={(event) => setTyreCompound(event.target.value)}
              className="r79-mobile-filter-row__select"
              aria-label="Tyre compound"
            >
              {TYRE_COMPOUND_OPTIONS.map((compound) => (
                <option key={compound} value={compound}>
                  {compound}
                </option>
              ))}
            </select>
          </MobileFilterRow>

          <MobileWearMultiplierRow
            fuelMultiplier={fuelMultiplier}
            tyreMultiplier={tyreMultiplier}
            lapCount={lapCount}
            onFuelChange={setFuelMultiplier}
            onTyreChange={setTyreMultiplier}
            onLapCountChange={setLapCount}
          />

          <MobileFilterRow icon="⚖️" label="BOP" value={bopOn ? "On" : "Off"}>
            <select
              value={bopOn ? "on" : "off"}
              onChange={(event) => setBopOn(event.target.value === "on")}
              className="r79-mobile-filter-row__select"
              aria-label="BOP"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </MobileFilterRow>

          <MobileFilterRow icon="🎮" label="Wheel Base" value={wheelLabel}>
            <select
              value={wheelBase}
              onChange={(event) => setWheelBase(event.target.value)}
              className="r79-mobile-filter-row__select"
              aria-label="Wheel base"
            >
              {WHEEL_BASE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </MobileFilterRow>
        </div>

        <div className="r79-wheel-filters-desktop">
        <div className="r79-wheel-filters-grid" style={styles.filtersGrid}>
          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Game
            <div className="r79-wheel-chip-row" style={styles.toggleRow}>
              {gameOptions.map((version) => {
                const entry = GAME_CATALOG[version];
                const isActive = filterGame === version;
                return (
                  <button
                    key={version}
                    type="button"
                    className={
                      isActive
                        ? "r79-wheel-chip r79-wheel-chip--active"
                        : "r79-wheel-chip"
                    }
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

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Car Class
            <div className="r79-wheel-chip-row" style={styles.toggleRow}>
              {CAR_CLASS_OPTIONS.map((value) => {
                const isActive = carClass === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={
                      isActive
                        ? "r79-wheel-chip r79-wheel-chip--active"
                        : "r79-wheel-chip"
                    }
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

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Wheel Base
              <select
                value={wheelBase}
                onChange={(event) => setWheelBase(event.target.value)}
                className="r79-wheel-control-select"
                style={styles.controlSelect}
              >
                {WHEEL_BASE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
          </label>

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Car
              <select
                value={carId}
                onChange={(event) => setCarId(event.target.value)}
                className="r79-wheel-control-select"
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

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Track
              <select
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                className="r79-wheel-control-select"
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

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Tyre Compound
              <select
                value={tyreCompound}
                onChange={(event) => setTyreCompound(event.target.value)}
                className="r79-wheel-control-select"
                style={styles.controlSelect}
              >
                {TYRE_COMPOUND_OPTIONS.map((compound) => (
                  <option key={compound} value={compound}>
                    {compound}
                  </option>
                ))}
              </select>
          </label>

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            BOP
            <div className="r79-wheel-chip-row" style={styles.toggleRow}>
              <button
                type="button"
                className={
                  bopOn
                    ? "r79-wheel-chip r79-wheel-chip--active"
                    : "r79-wheel-chip"
                }
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
                className={
                  !bopOn
                    ? "r79-wheel-chip r79-wheel-chip--active"
                    : "r79-wheel-chip"
                }
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

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Number of Laps
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              value={lapCount}
              onChange={(event) =>
                setLapCount(
                  Math.max(1, Math.min(999, Number(event.target.value) || 1)),
                )
              }
              className="r79-wheel-control-select"
              style={styles.controlSelect}
            />
          </label>

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Fuel Multiplier
            <div style={styles.rangeField}>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={fuelMultiplier}
                onChange={(event) => setFuelMultiplier(Number(event.target.value))}
                style={styles.rangeInput}
              />
              <span style={styles.rangeValue}>x{fuelMultiplier}</span>
            </div>
          </label>

          <label className="r79-wheel-field" style={styles.fieldLabel}>
            Tyre Wear Multiplier
            <div style={styles.rangeField}>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={tyreMultiplier}
                onChange={(event) => setTyreMultiplier(Number(event.target.value))}
                style={styles.rangeInput}
              />
              <span style={styles.rangeValue}>x{tyreMultiplier}</span>
            </div>
          </label>
        </div>
        </div>
      </div>

      <div className="r79-wheel-results" style={styles.resultsPanel}>
        <div style={styles.resultsHeader}>
          <h3 style={styles.panelTitle}>Wheel Setup</h3>
        </div>

        {!canShowSetup ? (
          <p style={styles.emptyState}>Select a car, track and wheel base to load settings.</p>
        ) : lookup.setup ? (
          <>
            <p className="r79-wheel-context" style={styles.contextLine}>
              {GAME_CATALOG[filterGame]?.shortLabel} · {carClass} · {wheelLabel} ·{" "}
              {selectedCar?.name} · {getTrackDisplayName(selectedTrack)} · {tyreCompound} · BOP{" "}
              {bopOn ? "On" : "Off"} · {lapCount} laps · Tyre x{tyreMultiplier} · Fuel x
              {fuelMultiplier}
            </p>
            {lookup.message ? (
              <p style={styles.matchNotice}>{lookup.message}</p>
            ) : null}
            {setupRows[0]?.narrative ? (
              <div className="r79-wheel-podium-summary" style={styles.podiumSummary}>
                <span style={styles.podiumExplanationLabel}>Recommendation based on:</span>
                <ul className="r79-wheel-podium-context" style={styles.podiumContextList}>
                  {setupRows[0].contextLines.map((line) => (
                    <li key={line} style={styles.podiumContextItem}>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="r79-wheel-podium-narrative" style={styles.podiumNarrative}>
                  {setupRows[0].narrative}
                </p>
              </div>
            ) : null}
            <div className="r79-wheel-values-grid" style={styles.valuesGrid}>
              {setupRows.map((row) => (
                <div
                  key={row.key}
                  className={
                    row.adjusted
                      ? "r79-wheel-value-card r79-wheel-value-card--adjusted"
                      : "r79-wheel-value-card"
                  }
                  style={{
                    ...styles.valueCard,
                    ...(row.adjusted ? styles.valueCardAdjusted : null),
                  }}
                >
                  <span style={styles.valueLabel}>{row.label}</span>
                  {row.description ? (
                    <p className="r79-wheel-field-description" style={styles.fieldDescription}>
                      {row.description}
                    </p>
                  ) : null}
                  <div style={styles.recommendedBlock}>
                    <span style={styles.recommendedLabel}>Recommended value:</span>
                    <span className="r79-wheel-value-text" style={styles.valueText}>
                      {String(row.value)}
                    </span>
                  </div>
                  {row.reason ? (
                    <div style={styles.reasonBlock}>
                      <span style={styles.reasonLabel}>Reason:</span>
                      <p className="r79-wheel-reason-text" style={styles.reasonText}>
                        {row.reason}
                      </p>
                    </div>
                  ) : null}
                  {row.podiumReason ? (
                    <div style={styles.podiumExplanation}>
                      <span style={styles.podiumExplanationLabel}>Podium Engine:</span>
                      <p className="r79-wheel-podium-field-reason" style={styles.podiumFieldReason}>
                        {row.podiumReason}
                      </p>
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

      <div className="r79-wheel-reset-row" style={styles.resetRow}>
        <button
          type="button"
          onClick={handleResetWheelSettings}
          className="r79-btn-secondary r79-wheel-reset-btn"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

const styles = {
  introPanel: {
    ...R79_INNER_PANEL,
    marginBottom: "10px",
    padding: "18px",
  },
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
  podiumSummary: {
    background: "rgba(20, 30, 52, 0.55)",
    border: "1px solid rgba(124, 156, 222, 0.28)",
    borderRadius: "8px",
    display: "grid",
    gap: "6px",
    marginBottom: "10px",
    padding: "10px 12px",
  },
  podiumInsight: {
    background: "rgba(20, 30, 52, 0.55)",
    border: "1px solid rgba(124, 156, 222, 0.28)",
    borderRadius: "8px",
    color: "#dce9ff",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: "0 0 10px",
    padding: "8px 10px",
  },
  podiumExplanation: {
    borderTop: "1px solid rgba(124, 156, 222, 0.18)",
    display: "grid",
    gap: "6px",
    marginTop: "4px",
    paddingTop: "8px",
  },
  podiumExplanationLabel: {
    color: "#9bc0ff",
    fontSize: "0.76rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  podiumContextList: {
    color: "#c5d8ff",
    fontSize: "0.82rem",
    lineHeight: 1.4,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  podiumContextItem: {
    margin: 0,
    padding: 0,
  },
  podiumNarrative: {
    color: "#e8f0ff",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: 0,
  },
  podiumFieldReason: {
    color: "#dce9ff",
    fontSize: "0.82rem",
    lineHeight: 1.45,
    margin: 0,
  },
  podiumLabel: {
    color: "#9bc0ff",
    display: "block",
    fontSize: "0.74rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    marginBottom: "2px",
    textTransform: "uppercase",
  },
  rangeField: {
    alignItems: "center",
    display: "flex",
    gap: "10px",
  },
  rangeInput: {
    flex: 1,
  },
  rangeValue: {
    color: "#9bc0ff",
    fontSize: "0.84rem",
    fontWeight: 600,
    minWidth: "36px",
  },
  valueCardAdjusted: {
    borderColor: "rgba(90, 220, 255, 0.35)",
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
