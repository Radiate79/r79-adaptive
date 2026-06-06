const STORAGE_KEY = "r79-splash-seen";

export function hasSeenSplash() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markSplashSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
}
