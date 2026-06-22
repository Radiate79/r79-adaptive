import { WHEEL_SETUP_REQUEST_STATUSES } from "../data/wheelSetupsMeta.js";

const REQUESTS_STORAGE_KEY = "r79-wheel-setup-requests";
const PREFERENCES_STORAGE_KEY = "r79-wheel-settings-preferences";

/**
 * @typedef {import("../data/wheelSetupsMeta.js").WheelSetupRequestStatus} WheelSetupRequestStatus
 */

/**
 * @typedef {Object} WheelSetupRequest
 * @property {string} id
 * @property {number} createdAt
 * @property {string} gameVersion
 * @property {string} wheelBase
 * @property {string} carId
 * @property {string} trackId
 * @property {string} tyreCompound
 * @property {boolean} bopOn
 * @property {string} notes
 * @property {WheelSetupRequestStatus} status
 */

/**
 * @typedef {Object} WheelSettingsPreferences
 * @property {string} [gameVersion]
 * @property {string} [carClass]
 * @property {string} [wheelBase]
 * @property {string} [carId]
 * @property {string} [trackId]
 * @property {string} [tyreCompound]
 * @property {boolean} [bopOn]
 */

/**
 * @param {Partial<WheelSetupRequest>} entry
 * @returns {WheelSetupRequest}
 */
function normalizeRequest(entry) {
  const status = WHEEL_SETUP_REQUEST_STATUSES.includes(entry.status)
    ? entry.status
    : "New";

  return {
    id:
      entry.id ??
      `wheel-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt ?? Date.now(),
    gameVersion: String(entry.gameVersion ?? "gt7").trim(),
    wheelBase: String(entry.wheelBase ?? "").trim(),
    carId: String(entry.carId ?? "").trim(),
    trackId: String(entry.trackId ?? "").trim(),
    tyreCompound: String(entry.tyreCompound ?? "M").trim(),
    bopOn: Boolean(entry.bopOn),
    notes: String(entry.notes ?? "").trim(),
    status,
  };
}

/** @returns {WheelSetupRequest[]} */
export function loadWheelSetupRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => normalizeRequest(entry));
      }
    }
  } catch {
    // fall through
  }

  return [];
}

export function loadWheelSetupRequestsNewestFirst() {
  return [...loadWheelSetupRequests()].sort((a, b) => b.createdAt - a.createdAt);
}

/** @param {WheelSetupRequest[]} entries */
function saveWheelSetupRequests(entries) {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(entries));
}

/**
 * @param {Omit<WheelSetupRequest, "id" | "createdAt" | "status"> & { status?: WheelSetupRequestStatus }} request
 */
export function addWheelSetupRequest(request) {
  const normalized = normalizeRequest({
    ...request,
    status: request.status ?? "New",
  });
  const entries = loadWheelSetupRequests();
  entries.push(normalized);
  saveWheelSetupRequests(entries);
  return normalized;
}

/**
 * @param {string} requestId
 * @param {WheelSetupRequestStatus} status
 */
export function updateWheelSetupRequestStatus(requestId, status) {
  if (!WHEEL_SETUP_REQUEST_STATUSES.includes(status)) {
    return null;
  }

  const entries = loadWheelSetupRequests();
  const index = entries.findIndex((entry) => entry.id === requestId);
  if (index < 0) {
    return null;
  }

  entries[index] = normalizeRequest({ ...entries[index], status });
  saveWheelSetupRequests(entries);
  return entries[index];
}

export function exportWheelSetupRequestsJson() {
  return JSON.stringify(loadWheelSetupRequestsNewestFirst(), null, 2);
}

/**
 * @param {number} createdAt
 */
export function formatWheelSetupRequestDate(createdAt) {
  return new Date(createdAt).toLocaleString();
}

/**
 * @param {Partial<WheelSettingsPreferences>} preferences
 */
export function saveWheelSettingsPreferences(preferences) {
  const current = loadWheelSettingsPreferences();
  const merged = { ...current, ...preferences };
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/** @returns {WheelSettingsPreferences} */
export function loadWheelSettingsPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch {
    // fall through
  }

  return {};
}
