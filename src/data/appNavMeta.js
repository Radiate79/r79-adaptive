/** Primary navigation — shared labels and mobile card icons. */

/** @type {{ id: string, label: string, shortLabel: string, icon: string }[]} */
export const PRIMARY_NAV_ITEMS = [
  {
    id: "wheel-settings",
    label: "Wheel Settings",
    shortLabel: "Wheel Settings",
    icon: "⚙️",
  },
  {
    id: "todays-race",
    label: "Today's Race",
    shortLabel: "Today's Race",
    icon: "🏎️",
  },
  {
    id: "ai-engineer",
    label: "AI Race Engineer",
    shortLabel: "AI Engineer",
    icon: "🤖",
  },
  {
    id: "advisor",
    label: "Championship Advisor",
    shortLabel: "Championship",
    icon: "🏆",
  },
  {
    id: "pitstop-strategy",
    label: "Pitstop Strategy",
    shortLabel: "Pitstop",
    icon: "⛽",
  },
];

/** Mockup order — feature icon cards in the top mobile row. */
export const MOBILE_FEATURE_CARD_ORDER = [
  "todays-race",
  "ai-engineer",
  "wheel-settings",
  "advisor",
  "pitstop-strategy",
];

/**
 * @param {string} id
 * @returns {{ id: string, label: string, shortLabel: string, icon: string } | undefined}
 */
export function getPrimaryNavItem(id) {
  return PRIMARY_NAV_ITEMS.find((item) => item.id === id);
}

/** Fixed bottom navigation — mobile only. */
export const MOBILE_BOTTOM_NAV_ITEMS = [
  { id: "home", pageId: "wheel-settings", label: "Home", icon: "🏠" },
  { id: "wheels", pageId: "wheel-settings", label: "Wheel Settings", icon: "⚙️" },
  { id: "ai-engineer", pageId: "ai-engineer", label: "AI Engineer", icon: "🤖" },
  { id: "advisor", pageId: "advisor", label: "Advisor", icon: "🏆" },
  { id: "menu", pageId: "menu", label: "Menu", icon: "☰" },
];

/** @type {Record<string, string>} */
export const SECONDARY_NAV_ICONS = {
  shortlist: "📋",
  "alr-performance": "📊",
  alr: "🗂️",
  rankings: "📈",
  profiles: "🚗",
  "alr-corner": "🏁",
  archive: "📦",
  labs: "🧪",
  promise: "✨",
  membership: "⭐",
  pathfinder: "🧭",
  settings: "⚙️",
};

/**
 * @param {string} pageId
 * @returns {string}
 */
export function getSecondaryNavIcon(pageId) {
  return SECONDARY_NAV_ICONS[pageId] ?? "•";
}
