import {
  ALR_IMPORT_COMPLETE_MIN_RECORDS,
  ALR_IMPORT_SEASONS,
  ALR_IMPORT_SLOT_DEFINITIONS,
} from "../data/alrImportSlots.js";
import { alrPerformance } from "../data/alrPerformance.js";
import { LEGACY_IMPORT_SOURCE_NAME } from "../data/raceArchiveMeta.js";

const STORAGE_KEY = "r79-alr-performance";

/**
 * @param {ALRPerformanceRecord} record
 * @returns {ALRPerformanceRecord}
 */
function normalizeRecord(record) {
  return {
    ...record,
    sourceName: String(record.sourceName ?? LEGACY_IMPORT_SOURCE_NAME).trim(),
  };
}

/**
 * @typedef {import("../data/alrPerformance.js").ALRPerformanceRecord} ALRPerformanceRecord
 */

/** @returns {ALRPerformanceRecord[]} */
export function loadALRRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((record) => normalizeRecord(record));
      }
    }
  } catch {
    // fall through to seed
  }

  return alrPerformance.map((record) => normalizeRecord(record));
}

/** @param {ALRPerformanceRecord[]} records */
export function saveALRRecords(records) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records.map((record) => normalizeRecord(record))),
  );
}

/** Remove all saved ALR records from localStorage. */
export function clearALRRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

/** Reload from localStorage (or seed), bypassing in-memory React state. */
export function loadAllSavedALRRecords() {
  return loadALRRecords();
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {string} [filename]
 */
export function exportRecordsToJson(records, filename = "race-data.json") {
  const payload = JSON.stringify(records, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return records.length;
}

/**
 * @param {ALRPerformanceRecord[]} records
 */
export function summarizeRecords(records) {
  /** @type {Record<string, number>} */
  const bySeasonTier = {};

  for (const record of records) {
    const key = `S${record.season} T${record.tier}`;
    bySeasonTier[key] = (bySeasonTier[key] ?? 0) + 1;
  }

  return bySeasonTier;
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number[]} [seasons]
 * @param {number[]} [tiers]
 */
export function getStorageSummary(records, seasons = [], tiers = []) {
  /** @type {Record<number, number>} */
  const bySeason = Object.fromEntries(seasons.map((season) => [season, 0]));
  /** @type {Record<number, number>} */
  const byTier = Object.fromEntries(tiers.map((tier) => [tier, 0]));

  for (const record of records) {
    if (record.season in bySeason) {
      bySeason[record.season] += 1;
    }
    if (record.tier in byTier) {
      byTier[record.tier] += 1;
    }
  }

  return {
    total: records.length,
    bySeason,
    byTier,
  };
}

/**
 * @param {ALRPerformanceRecord} a
 * @param {ALRPerformanceRecord} b
 */
export function recordKey(a, b = a) {
  return `${b.season}-${b.tier}-${b.division ?? ""}-${b.car}`;
}

/**
 * @param {ALRPerformanceRecord} record
 * @param {number} season
 * @param {{ tier: number, division?: 'blue' | 'white' }} slot
 */
function recordMatchesImportSlot(record, season, slot) {
  if (record.season !== season || record.tier !== slot.tier) {
    return false;
  }

  if (slot.division) {
    return record.division === slot.division;
  }

  return !record.division;
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number[]} [seasons]
 * @param {typeof ALR_IMPORT_SLOT_DEFINITIONS} [slotDefinitions]
 * @param {number} [minRecords]
 */
export function getImportProgress(
  records,
  seasons = ALR_IMPORT_SEASONS,
  slotDefinitions = ALR_IMPORT_SLOT_DEFINITIONS,
  minRecords = ALR_IMPORT_COMPLETE_MIN_RECORDS,
) {
  return seasons.map((season) => ({
    season,
    slots: slotDefinitions.map((slot) => {
      const count = records.filter((record) =>
        recordMatchesImportSlot(record, season, slot),
      ).length;

      return {
        ...slot,
        count,
        complete: count >= minRecords,
      };
    }),
  }));
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {ALRPerformanceRecord} record
 */
export function findDuplicateIndex(records, record) {
  const key = recordKey(record);
  return records.findIndex((item) => recordKey(item) === key);
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {ALRPerformanceRecord[]} incoming
 * @returns {ALRPerformanceRecord[]}
 */
export function mergeRecords(records, incoming) {
  const next = [...records];
  for (const record of incoming) {
    const duplicateIndex = findDuplicateIndex(next, record);
    if (duplicateIndex >= 0) {
      next[duplicateIndex] = record;
    } else {
      next.push(record);
    }
  }
  return next;
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number} season
 */
export function countRecordsForSeason(records, season) {
  return records.filter((record) => record.season === season).length;
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number} season
 * @param {number} tier
 * @param {'blue' | 'white' | ''} [division]
 */
export function countRecordsForTierSlot(records, season, tier, division = "") {
  return records.filter((record) =>
    recordMatchesTierSlot(record, season, tier, division),
  ).length;
}

/**
 * @param {ALRPerformanceRecord} record
 * @param {number} season
 * @param {number} tier
 * @param {'blue' | 'white' | ''} [division]
 */
function recordMatchesTierSlot(record, season, tier, division = "") {
  if (record.season !== season || record.tier !== tier) {
    return false;
  }

  if (division) {
    return record.division === division;
  }

  return true;
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number} season
 * @returns {ALRPerformanceRecord[]}
 */
export function deleteRecordsBySeason(records, season) {
  return records.filter((record) => record.season !== season);
}

/**
 * @param {ALRPerformanceRecord[]} records
 * @param {number} season
 * @param {number} tier
 * @param {'blue' | 'white' | ''} [division]
 * @returns {ALRPerformanceRecord[]}
 */
export function deleteRecordsByTierSlot(
  records,
  season,
  tier,
  division = "",
) {
  return records.filter(
    (record) => !recordMatchesTierSlot(record, season, tier, division),
  );
}
