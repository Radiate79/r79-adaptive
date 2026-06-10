import { useEffect, useMemo, useState } from "react";
import { GAME_CATALOG } from "../data/gameVersions.js";
import { WHEEL_BASE_OPTIONS } from "../data/wheelBases.js";
import {
  NO_EXACT_SETUP_MESSAGE,
  TYRE_COMPOUND_OPTIONS,
  WHEEL_SETUP_REQUEST_STATUSES,
} from "../data/wheelSetupsMeta.js";
import {
  findWheelSetup,
  formatWheelSetupValues,
  searchWheelSetups,
} from "../engine/wheelSettingsEngine.js";
import { useGameVersion } from "../context/GameVersionContext.jsx";
import {
  getCarsForGame,
  getSelectableTracksForClass,
  getTrackDisplayName,
  getTracksForGame,
} from "../utils/gameData.js";
import {
  addWheelSetupRequest,
  exportWheelSetupRequestsJson,
  formatWheelSetupRequestDate,
  loadWheelSettingsPreferences,
  loadWheelSetupRequestsNewestFirst,
  saveWheelSettingsPreferences,
  updateWheelSetupRequestStatus,
} from "../utils/wheelSetupsStorage.js";

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

  const [requestGame, setRequestGame] = useState(filterGame);
  const [requestWheelBase, setRequestWheelBase] = useState(wheelBase);
  const [requestCarId, setRequestCarId] = useState(carId);
  const [requestTrackId, setRequestTrackId] = useState(trackId);
  const [requestTyres, setRequestTyres] = useState(tyreCompound);
  const [requestBopOn, setRequestBopOn] = useState(bopOn);
  const [requestNotes, setRequestNotes] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [requests, setRequests] = useState(() =>
    loadWheelSetupRequestsNewestFirst(),
  );
  const [exportMessage, setExportMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const cars = useMemo(
    () =>
      (getCarsForGame(filterGame) ?? []).filter((car) => car?.class === "Gr.3"),
    [filterGame],
  );
  const allTracks = useMemo(() => getTracksForGame(filterGame), [filterGame]);
  const tracks = useMemo(
    () => getSelectableTracksForClass(filterGame, "Gr.3"),
    [filterGame],
  );
  const searchMatches = useMemo(
    () => searchWheelSetups(searchQuery, filterGame) ?? [],
    [searchQuery, filterGame],
  );
  const filteredCars = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return cars;
    }

    return cars.filter((car) => car.name.toLowerCase().includes(query));
  }, [cars, searchQuery]);
  const filteredTracks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return tracks;
    }

    return tracks.filter((track) =>
      getTrackDisplayName(track).toLowerCase().includes(query),
    );
  }, [tracks, searchQuery]);
  const requestCars = useMemo(
    () => getCarsForGame(requestGame).filter((car) => car.class === "Gr.3"),
    [requestGame],
  );
  const requestTracks = useMemo(
    () => getSelectableTracksForClass(requestGame, "Gr.3"),
    [requestGame],
  );

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
    if (trackId && !tracks.some((track) => track.id === trackId)) {
      setTrackId("");
    }
  }, [trackId, tracks]);

  useEffect(() => {
    if (
      requestTrackId &&
      !requestTracks.some((track) => track.id === requestTrackId)
    ) {
      setRequestTrackId("");
    }
  }, [requestTrackId, requestTracks]);

  useEffect(() => {
    saveWheelSettingsPreferences({
      gameVersion: filterGame,
      wheelBase,
      carId,
      trackId,
      tyreCompound,
      bopOn,
    });
  }, [filterGame, wheelBase, carId, trackId, tyreCompound, bopOn]);

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

  const refreshRequests = () => {
    setRequests(loadWheelSetupRequestsNewestFirst());
  };

  const handleSubmitRequest = (event) => {
    event.preventDefault();

    if (!requestCarId || !requestTrackId) {
      setRequestMessage("Select a car and track before submitting.");
      return;
    }

    addWheelSetupRequest({
      gameVersion: requestGame,
      wheelBase: requestWheelBase,
      carId: requestCarId,
      trackId: requestTrackId,
      tyreCompound: requestTyres,
      bopOn: requestBopOn,
      notes: requestNotes,
    });

    setRequestNotes("");
    setRequestMessage("Request saved locally. Thank you — R79 will review it.");
    refreshRequests();
    window.setTimeout(() => setRequestMessage(""), 4000);
  };

  const handleExportRequests = () => {
    const json = exportWheelSetupRequestsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `r79-wheel-setup-requests-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportMessage(`Exported ${requests.length} request(s).`);
    window.setTimeout(() => setExportMessage(""), 3000);
  };

  const resetWheelSettings = () => {
    setFilterGame(contextGameVersion);
    setWheelBase("thrustmaster_t598");
    setCarId("");
    setTrackId("");
    setTyreCompound("M");
    setBopOn(true);
    setSearchQuery("");
  };

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      WHEEL_SETUP_REQUEST_STATUSES.map((status) => [status, 0]),
    );
    requests.forEach((request) => {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
    });
    return counts;
  }, [requests]);

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <h2 style={styles.title}>Wheel Settings Hub</h2>
        <p style={styles.subtitle}>
          Professional wheel-base settings for Gran Turismo 7.
        </p>
      </div>

      <details style={styles.infoDetails}>
        <summary style={styles.infoSummary}>
          Where does the wheel data come from?
        </summary>
        <p style={styles.infoText}>
          R79 wheel profiles are built from GT7 testing, league racing
          experience, community feedback and continuous refinement. Settings are
          designed as strong starting points and may be adjusted to suit each
          driver&apos;s style, equipment and car choice.
        </p>
      </details>

      <div style={styles.filtersPanel}>
        <div style={styles.filtersHeader}>
          <h3 style={styles.panelTitle}>Filters</h3>
          <button
            type="button"
            onClick={resetWheelSettings}
            style={styles.resetButton}
          >
            Reset
          </button>
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
          {lookup.setup?.isStarter ? (
            <span style={styles.starterBadge}>{lookup.setup.label}</span>
          ) : null}
        </div>

        {!carId || !trackId ? (
          <p style={styles.emptyState}>Select a car and track to load settings.</p>
        ) : lookup.setup ? (
          <>
            <p style={styles.contextLine}>
              {GAME_CATALOG[filterGame]?.shortLabel} · {wheelLabel} ·{" "}
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
                  <span style={styles.valueText}>{String(row.value)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={styles.emptyState}>{NO_EXACT_SETUP_MESSAGE}</p>
        )}
      </div>

      <div style={styles.requestPanel}>
        <h3 style={styles.panelTitle}>Request Wheel Setup</h3>
        <form onSubmit={handleSubmitRequest} style={styles.requestForm}>
          <div style={styles.filtersGrid}>
            <label style={styles.fieldLabel}>
              Game
                <select
                  value={requestGame}
                  onChange={(event) => setRequestGame(event.target.value)}
                  style={styles.controlSelect}
                >
                  {gameOptions.map((version) => (
                    <option key={version} value={version}>
                      {GAME_CATALOG[version].shortLabel}
                    </option>
                  ))}
                </select>
            </label>

            <label style={styles.fieldLabel}>
              Wheel Base
                <select
                  value={requestWheelBase}
                  onChange={(event) => setRequestWheelBase(event.target.value)}
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
                  value={requestCarId}
                  onChange={(event) => setRequestCarId(event.target.value)}
                  style={styles.controlSelect}
                  required
                >
                  <option value="">Select a car…</option>
                  {requestCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name}
                    </option>
                  ))}
                </select>
            </label>

            <label style={styles.fieldLabel}>
              Track
                <select
                  value={requestTrackId}
                  onChange={(event) => setRequestTrackId(event.target.value)}
                  style={styles.controlSelect}
                  required
                >
                  <option value="">Select a track…</option>
                  {requestTracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {getTrackDisplayName(track)}
                    </option>
                  ))}
                </select>
            </label>

            <label style={styles.fieldLabel}>
              Tyres
                <select
                  value={requestTyres}
                  onChange={(event) => setRequestTyres(event.target.value)}
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
                  onClick={() => setRequestBopOn(true)}
                  style={{
                    ...styles.toggleButton,
                    ...(requestBopOn ? styles.toggleButtonActive : null),
                  }}
                >
                  On
                </button>
                <button
                  type="button"
                  onClick={() => setRequestBopOn(false)}
                  style={{
                    ...styles.toggleButton,
                    ...(!requestBopOn ? styles.toggleButtonActive : null),
                  }}
                >
                  Off
                </button>
              </div>
            </label>
          </div>

          <label style={styles.fieldLabel}>
            Notes
            <textarea
              value={requestNotes}
              onChange={(event) => setRequestNotes(event.target.value)}
              rows={3}
              placeholder="Share your current in-game values or what you need tested…"
              style={styles.textarea}
            />
          </label>

          <button type="submit" style={styles.primaryButton}>
            Submit Request
          </button>
          {requestMessage ? (
            <p style={styles.requestMessage}>{requestMessage}</p>
          ) : null}
        </form>
      </div>

      <div style={styles.adminPanel}>
        <div style={styles.adminHeader}>
          <h3 style={styles.panelTitle}>Wheel Setup Requests</h3>
          <div style={styles.adminActions}>
            <button
              type="button"
              onClick={refreshRequests}
              style={styles.secondaryButton}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportRequests}
              style={styles.primaryButton}
            >
              Export JSON
            </button>
          </div>
        </div>

        {exportMessage ? <p style={styles.exportMessage}>{exportMessage}</p> : null}

        <div style={styles.statsRow}>
          {WHEEL_SETUP_REQUEST_STATUSES.map((status) => (
            <div key={status} style={styles.statChip}>
              <span style={styles.statLabel}>{status}</span>
              <strong style={styles.statValue}>{statusCounts[status] ?? 0}</strong>
            </div>
          ))}
        </div>

        {requests.length === 0 ? (
          <p style={styles.emptyState}>No wheel setup requests saved yet.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Game</th>
                  <th style={styles.th}>Wheel Base</th>
                  <th style={styles.th}>Car</th>
                  <th style={styles.th}>Track</th>
                  <th style={styles.th}>Tyres</th>
                  <th style={styles.th}>BOP</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const carName =
                    getCarsForGame(request.gameVersion).find(
                      (car) => car.id === request.carId,
                    )?.name ?? request.carId;
                  const trackName = getTrackDisplayName(
                    getTracksForGame(request.gameVersion).find(
                      (track) => track.id === request.trackId,
                    ) ?? { displayName: request.trackId },
                  );
                  const baseName =
                    WHEEL_BASE_OPTIONS.find(
                      (option) => option.id === request.wheelBase,
                    )?.label ?? request.wheelBase;

                  return (
                    <tr key={request.id} style={styles.tr}>
                      <td style={styles.td}>
                        {formatWheelSetupRequestDate(request.createdAt)}
                      </td>
                      <td style={styles.td}>
                        {GAME_CATALOG[request.gameVersion]?.shortLabel ??
                          request.gameVersion}
                      </td>
                      <td style={styles.td}>{baseName}</td>
                      <td style={styles.td}>{carName}</td>
                      <td style={styles.td}>{trackName}</td>
                      <td style={styles.td}>{request.tyreCompound}</td>
                      <td style={styles.td}>{request.bopOn ? "On" : "Off"}</td>
                      <td style={styles.tdNote}>{request.notes || "—"}</td>
                      <td style={styles.td}>
                          <select
                            value={request.status}
                            onChange={(event) => {
                              updateWheelSetupRequestStatus(
                                request.id,
                                event.target.value,
                              );
                              refreshRequests();
                            }}
                            style={styles.statusSelect}
                          >
                            {WHEEL_SETUP_REQUEST_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
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
    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.35)",
  },
  header: { marginBottom: "14px" },
  title: { margin: 0, fontSize: "1.5rem" },
  subtitle: {
    margin: "6px 0 0",
    color: "rgba(220, 228, 255, 0.85)",
    fontSize: "0.95rem",
    lineHeight: 1.45,
  },
  infoDetails: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.25)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "10px 12px",
  },
  infoSummary: {
    color: "#9bc0ff",
    cursor: "pointer",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  infoText: {
    color: "rgba(205, 217, 255, 0.88)",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    margin: "8px 0 0",
  },
  filtersPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  filtersHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  resetButton: {
    background: "rgba(20, 28, 48, 0.9)",
    border: "1px solid rgba(141, 169, 233, 0.35)",
    borderRadius: "10px",
    color: "#d8e3ff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: "8px 14px",
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
    margin: 0,
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
  resultsPanel: {
    background: "rgba(9, 14, 24, 0.88)",
    border: "1px solid rgba(123, 153, 219, 0.3)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  resultsHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  starterBadge: {
    background: "rgba(56, 44, 18, 0.55)",
    border: "1px solid rgba(220, 180, 90, 0.45)",
    borderRadius: "999px",
    color: "#ffe6a8",
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "5px 10px",
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
  valuesGrid: {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  valueCard: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    padding: "8px 10px",
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
  requestPanel: {
    background: "rgba(12, 18, 31, 0.88)",
    border: "1px solid rgba(128, 160, 229, 0.3)",
    borderRadius: "12px",
    marginBottom: "12px",
    padding: "14px",
  },
  requestForm: { display: "grid", gap: "12px" },
  textarea: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "8px",
    color: "#dbe6ff",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    padding: "8px 10px",
    resize: "vertical",
  },
  primaryButton: {
    background: "linear-gradient(90deg, #2b56c8, #3e79ff)",
    border: "1px solid #77a0ff",
    borderRadius: "999px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
    justifySelf: "start",
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
  requestMessage: {
    color: "#9bc0ff",
    fontSize: "0.88rem",
    margin: 0,
  },
  adminPanel: {
    background: "rgba(12, 16, 27, 0.85)",
    border: "1px solid rgba(140, 166, 224, 0.3)",
    borderRadius: "12px",
    padding: "14px",
  },
  adminHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  adminActions: { display: "flex", flexWrap: "wrap", gap: "8px" },
  exportMessage: {
    color: "#9bc0ff",
    fontSize: "0.86rem",
    margin: "0 0 8px",
  },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
  },
  statChip: {
    background: "rgba(20, 30, 52, 0.45)",
    border: "1px solid rgba(124, 156, 222, 0.2)",
    borderRadius: "8px",
    display: "grid",
    gap: "2px",
    minWidth: "88px",
    padding: "8px 10px",
  },
  statLabel: { color: "#b8cdff", fontSize: "0.74rem", fontWeight: 600 },
  statValue: { color: "#9bc0ff", fontSize: "1rem" },
  tableWrap: { overflowX: "auto" },
  table: {
    borderCollapse: "collapse",
    fontSize: "0.82rem",
    width: "100%",
  },
  th: {
    borderBottom: "1px solid rgba(124, 156, 222, 0.25)",
    color: "#b8cdff",
    padding: "8px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid rgba(124, 156, 222, 0.12)" },
  td: {
    color: "#dce8ff",
    padding: "8px",
    verticalAlign: "top",
  },
  tdNote: {
    color: "#dce8ff",
    maxWidth: "220px",
    padding: "8px",
    verticalAlign: "top",
    whiteSpace: "pre-wrap",
  },
  statusSelect: {
    background: "rgba(17, 22, 35, 0.95)",
    border: "1px solid rgba(138, 159, 212, 0.3)",
    borderRadius: "6px",
    color: "#dbe6ff",
    fontSize: "0.8rem",
    padding: "4px 6px",
  },
  emptyState: {
    color: "rgba(205, 217, 255, 0.8)",
    fontSize: "0.9rem",
    margin: 0,
  },
};
