import archiveJournalSeed from "../data/archiveJournal.json";
import { APP_VERSION } from "../data/founderMeta.js";
import { getArchiveStats } from "./archiveStats.js";

const STORAGE_KEY = "r79-archive-journal";

/**
 * @typedef {Object} CaptainsLogSnapshot
 * @property {number} carsIndexed
 * @property {number} tracksSupported
 * @property {number} historicalRecords
 * @property {number} gamesSupported
 * @property {number} aiModulesCount
 */

/**
 * @typedef {Object} ArchiveJournalEntry
 * @property {string} id
 * @property {string} date ISO date YYYY-MM-DD
 * @property {string} title
 * @property {string} text
 * @property {string} buildVersion
 * @property {string[]} tags
 * @property {CaptainsLogSnapshot} snapshot
 * @property {number} [createdAt]
 * @property {number} [updatedAt]
 */

/** @returns {CaptainsLogSnapshot} */
export function buildLogSnapshot() {
  const stats = getArchiveStats();

  return {
    carsIndexed: stats.carsIndexed,
    tracksSupported: stats.tracksSupported,
    historicalRecords: stats.historicalRecords,
    gamesSupported: stats.gamesSupported,
    aiModulesCount: stats.aiModulesCount,
  };
}

/**
 * @param {string} value
 * @returns {string[]}
 */
export function parseLogTags(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * @param {string[] | undefined} tags
 * @returns {string}
 */
export function formatLogTags(tags) {
  return (tags ?? []).join(", ");
}

/**
 * @param {Partial<CaptainsLogSnapshot>} snapshot
 * @returns {CaptainsLogSnapshot}
 */
function normalizeSnapshot(snapshot) {
  const live = buildLogSnapshot();

  return {
    carsIndexed: Number(snapshot?.carsIndexed ?? live.carsIndexed),
    tracksSupported: Number(snapshot?.tracksSupported ?? live.tracksSupported),
    historicalRecords: Number(snapshot?.historicalRecords ?? live.historicalRecords),
    gamesSupported: Number(snapshot?.gamesSupported ?? live.gamesSupported),
    aiModulesCount: Number(snapshot?.aiModulesCount ?? live.aiModulesCount),
  };
}

/** @returns {ArchiveJournalEntry[]} */
function getSeedEntries() {
  return archiveJournalSeed.map((entry) => normalizeJournalEntry(entry));
}

/**
 * @param {Partial<ArchiveJournalEntry>} entry
 * @returns {ArchiveJournalEntry}
 */
function normalizeJournalEntry(entry) {
  const tags = Array.isArray(entry.tags)
    ? entry.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  return {
    id: entry.id ?? `journal-${Date.now()}`,
    date: entry.date ?? "",
    title: String(entry.title ?? "Untitled").trim() || "Untitled",
    text: String(entry.text ?? "").trim(),
    buildVersion: String(entry.buildVersion ?? `v${APP_VERSION}`).trim(),
    tags,
    snapshot: normalizeSnapshot(entry.snapshot),
    createdAt:
      entry.createdAt ??
      (Date.parse(`${entry.date ?? ""}T12:00:00`) || 0),
    updatedAt: entry.updatedAt,
  };
}

/**
 * @param {unknown[]} parsed
 * @returns {ArchiveJournalEntry[]}
 */
function migrateJournalEntries(parsed) {
  const seedById = Object.fromEntries(
    getSeedEntries().map((entry) => [entry.id, entry]),
  );

  return parsed.map((entry) => {
    const raw = /** @type {Partial<ArchiveJournalEntry>} */ (entry);

    if (raw.id === "seed-2026-06-06" && seedById["journal-2026-06-06"]) {
      return seedById["journal-2026-06-06"];
    }

    if (seedById[raw.id ?? ""]) {
      return normalizeJournalEntry({
        ...seedById[raw.id ?? ""],
        ...raw,
        snapshot: raw.snapshot ?? seedById[raw.id ?? ""].snapshot,
      });
    }

    return normalizeJournalEntry({
      ...raw,
      title: raw.title ?? "Untitled",
      buildVersion: raw.buildVersion ?? `v${APP_VERSION}`,
      tags: raw.tags ?? [],
      snapshot: raw.snapshot ?? buildLogSnapshot(),
    });
  });
}

function entryNeedsMigration(entry) {
  return (
    !entry.title ||
    !entry.buildVersion ||
    !entry.snapshot ||
    entry.id === "seed-2026-06-06"
  );
}

/**
 * Stored in chronological order (oldest first, newest appended at end).
 * @returns {ArchiveJournalEntry[]}
 */
export function loadArchiveJournalEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated = migrateJournalEntries(parsed);
        if (parsed.some(entryNeedsMigration)) {
          saveArchiveJournalEntries(migrated);
        }
        return migrated;
      }
    }
  } catch {
    // fall through to seed
  }

  return getSeedEntries();
}

/** Newest entries first for display. */
export function loadArchiveJournalEntriesNewestFirst() {
  return [...loadArchiveJournalEntries()].reverse();
}

/** @param {ArchiveJournalEntry[]} entries */
export function saveArchiveJournalEntries(entries) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries.map((entry) => normalizeJournalEntry(entry))),
  );
}

/**
 * @param {{ date: string, title: string, text: string, buildVersion?: string, tags?: string[] }} entry
 * @returns {ArchiveJournalEntry | null}
 */
export function addArchiveJournalEntry(entry) {
  const title = entry.title.trim();
  const text = entry.text.trim();

  if (!title || !text) {
    return null;
  }

  const newEntry = normalizeJournalEntry({
    id: `journal-${Date.now()}`,
    date: entry.date,
    title,
    text,
    buildVersion: entry.buildVersion?.trim() || `v${APP_VERSION}`,
    tags: entry.tags ?? [],
    snapshot: buildLogSnapshot(),
    createdAt: Date.now(),
  });

  const updated = [...loadArchiveJournalEntries(), newEntry];
  saveArchiveJournalEntries(updated);
  return newEntry;
}

/**
 * @param {string} id
 * @param {{ date?: string, title?: string, text?: string, buildVersion?: string, tags?: string[] }} updates
 * @returns {ArchiveJournalEntry | null}
 */
export function updateArchiveJournalEntry(id, updates) {
  const entries = loadArchiveJournalEntries();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index < 0) {
    return null;
  }

  const current = entries[index];
  const title = updates.title !== undefined ? updates.title.trim() : current.title;
  const text = updates.text !== undefined ? updates.text.trim() : current.text;

  if (!title || !text) {
    return null;
  }

  const updatedEntry = normalizeJournalEntry({
    ...current,
    date: updates.date ?? current.date,
    title,
    text,
    buildVersion:
      updates.buildVersion !== undefined
        ? updates.buildVersion.trim()
        : current.buildVersion,
    tags: updates.tags !== undefined ? updates.tags : current.tags,
    snapshot: current.snapshot,
    updatedAt: Date.now(),
  });

  const next = [...entries];
  next[index] = updatedEntry;
  saveArchiveJournalEntries(next);
  return updatedEntry;
}

/** Export current journal as formatted JSON string. */
export function exportArchiveJournalJson() {
  return JSON.stringify(loadArchiveJournalEntries(), null, 2);
}
