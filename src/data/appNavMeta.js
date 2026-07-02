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

/** Top feature row — horizontal scroll on mobile. */
export const MOBILE_FEATURE_CARD_ORDER = [
  "wheel-settings",
  "todays-race",
  "ai-engineer",
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
  { id: "wheel-settings", pageId: "wheel-settings", label: "Wheel", icon: "⚙️" },
  { id: "ai-engineer", pageId: "ai-engineer", label: "AI", icon: "🤖" },
  { id: "advisor", pageId: "advisor", label: "Advisor", icon: "🏆" },
  { id: "pitstop-strategy", pageId: "pitstop-strategy", label: "Pitstop", icon: "⛽" },
  { id: "more", pageId: "more", label: "More", icon: "☰" },
];

/** Pages reachable from the bottom bar — everything else lives under More. */
export const MOBILE_BOTTOM_NAV_PAGE_IDS = new Set(
  MOBILE_BOTTOM_NAV_ITEMS.filter((item) => item.pageId !== "more").map(
    (item) => item.pageId,
  ),
);

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
