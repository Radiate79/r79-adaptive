/** Primary navigation — shared labels and mobile card icons. */

/** @type {{ id: string, label: string, shortLabel: string, icon: string }[]} */
export const PRIMARY_NAV_ITEMS = [
  {
    id: "wheel-settings",
    label: "Wheel Settings",
    shortLabel: "Wheels",
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
