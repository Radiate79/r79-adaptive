const STORAGE_KEY = "r79-race-archive-entries";

/**
 * @typedef {Object} RaceArchiveEntry
 * @property {string} id
 * @property {number} createdAt
 * @property {string} sourceName
 * @property {string} championshipLeague
 * @property {string} track
 * @property {string} car
 * @property {string} winner
 * @property {string} p2
 * @property {string} p3
 * @property {string} notes
 * @property {string} [racePresetId]
 * @property {number} [fuelMultiplier]
 * @property {number} [tyreMultiplier]
 */

/**
 * @param {Partial<RaceArchiveEntry>} entry
 * @returns {RaceArchiveEntry}
 */
function normalizeEntry(entry) {
  return {
    id:
      entry.id ??
      `race-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt ?? Date.now(),
    sourceName: String(entry.sourceName ?? "").trim(),
    championshipLeague: String(entry.championshipLeague ?? "").trim(),
    track: String(entry.track ?? "").trim(),
    car: String(entry.car ?? "").trim(),
    winner: String(entry.winner ?? "").trim(),
    p2: String(entry.p2 ?? "").trim(),
    p3: String(entry.p3 ?? "").trim(),
    notes: String(entry.notes ?? "").trim(),
    racePresetId: String(entry.racePresetId ?? "custom").trim() || "custom",
    fuelMultiplier: Number(entry.fuelMultiplier ?? 1) || 1,
    tyreMultiplier: Number(entry.tyreMultiplier ?? 1) || 1,
  };
}

/** @returns {RaceArchiveEntry[]} */
export function loadRaceArchiveEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => normalizeEntry(entry));
      }
    }
  } catch {
    // fall through
  }

  return [];
}

/** Newest first. */
export function loadRaceArchiveEntriesNewestFirst() {
  return [...loadRaceArchiveEntries()].sort((a, b) => b.createdAt - a.createdAt);
}

/** @param {RaceArchiveEntry[]} entries */
function saveRaceArchiveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * @param {Omit<RaceArchiveEntry, 'id' | 'createdAt'>} entry
 * @returns {RaceArchiveEntry | null}
 */
export function addRaceArchiveEntry(entry) {
  if (!entry.championshipLeague && !entry.track && !entry.car) {
    return null;
  }

  const normalized = normalizeEntry(entry);
  const updated = [...loadRaceArchiveEntries(), normalized];
  saveRaceArchiveEntries(updated);
  return normalized;
}

/**
 * @param {string} entryId
 * @returns {boolean}
 */
export function deleteRaceArchiveEntry(entryId) {
  const updated = loadRaceArchiveEntries().filter((entry) => entry.id !== entryId);
  if (updated.length === loadRaceArchiveEntries().length) {
    return false;
  }

  saveRaceArchiveEntries(updated);
  return true;
}

/**
 * @param {number} timestamp
 */
export function formatRaceArchiveDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
