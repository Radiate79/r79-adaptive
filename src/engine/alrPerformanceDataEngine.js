import {
  ALR_PERFORMANCE_DATA,
  ALR_PERFORMANCE_EVENTS,
  ALR_PERFORMANCE_SESSION_TYPES,
  parseAlrPerformanceTime,
} from "../data/alrPerformanceData.js";

/**
 * @param {string} eventId
 * @returns {import("../data/alrPerformanceData.js").AlrPerformanceEvent | null}
 */
export function getAlrPerformanceEvent(eventId) {
  return ALR_PERFORMANCE_EVENTS.find((event) => event.id === eventId) ?? null;
}

/**
 * @param {string} eventId
 * @param {import("../data/alrPerformanceData.js").AlrPerformanceSessionType} sessionType
 * @param {number} [limit]
 */
export function getTopAlrPerformanceResults(eventId, sessionType, limit = 10) {
  return ALR_PERFORMANCE_DATA.filter(
    (record) => record.eventId === eventId && record.sessionType === sessionType,
  )
    .sort((a, b) => {
      const timeA =
        sessionType === "feature_total_time"
          ? parseAlrPerformanceTime(a.totalTime)
          : parseAlrPerformanceTime(a.lapTime);
      const timeB =
        sessionType === "feature_total_time"
          ? parseAlrPerformanceTime(b.totalTime)
          : parseAlrPerformanceTime(b.lapTime);

      if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }

      return (a.position ?? 999) - (b.position ?? 999);
    })
    .slice(0, limit);
}

/**
 * @param {string} query
 * @param {string} [eventId]
 */
export function searchAlrPerformanceDrivers(query, eventId) {
  const normalized = String(query ?? "").trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const pool = eventId
    ? ALR_PERFORMANCE_DATA.filter((record) => record.eventId === eventId)
    : ALR_PERFORMANCE_DATA;

  const seen = new Set();
  const matches = [];

  for (const record of pool) {
    if (
      !record.driver.toLowerCase().includes(normalized) ||
      seen.has(record.driver)
    ) {
      continue;
    }

    seen.add(record.driver);
    matches.push(record.driver);
  }

  return matches.sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} driver
 * @param {string} [eventId]
 */
export function getAlrDriverProfile(driver, eventId) {
  const normalized = String(driver ?? "").trim();
  if (!normalized) {
    return null;
  }

  const records = ALR_PERFORMANCE_DATA.filter((record) => {
    if (record.driver.toLowerCase() !== normalized.toLowerCase()) {
      return false;
    }

    return eventId ? record.eventId === eventId : true;
  });

  if (!records.length) {
    return null;
  }

  const bySession = Object.fromEntries(
    ALR_PERFORMANCE_SESSION_TYPES.map((sessionType) => [
      sessionType,
      records.filter((record) => record.sessionType === sessionType),
    ]),
  );

  const primary = records[0];

  return {
    driver: primary.driver,
    car: primary.car ?? "—",
    tier: primary.tier,
    eventName: primary.eventName,
    track: primary.track,
    season: primary.season,
    round: primary.round,
    sessions: bySession,
    recordCount: records.length,
  };
}

/**
 * @param {import("../data/alrPerformanceData.js").AlrPerformanceRecord} record
 */
export function getAlrPerformanceDisplayTime(record) {
  if (record.sessionType === "feature_total_time") {
    return record.totalTime ?? "—";
  }

  return record.lapTime ?? "—";
}
