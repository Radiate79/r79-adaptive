/** Primary navigation — shared labels and mobile card icons. */

/** @type {{ id: string, label: string, shortLabel: string, secondaryLabel?: string, icon: string, eyebrow?: string }[]} */
export const PRIMARY_NAV_ITEMS = [
  {
    id: "wheel-settings",
    label: "Wheel Settings",
    shortLabel: "Wheel Settings",
    icon: "wheel",
    eyebrow: "Primary R79 feature",
  },
  {
    id: "podium",
    label: "Podium",
    shortLabel: "Podium",
    secondaryLabel: "Performance",
    icon: "podium",
  },
  {
    id: "todays-race",
    label: "Today's Race",
    shortLabel: "Today's Race",
    secondaryLabel: "Live Event",
    icon: "today",
  },
  {
    id: "ai-engineer",
    label: "AI Race Engineer",
    shortLabel: "AI Engineer",
    secondaryLabel: "Data analysis",
    icon: "ai",
  },
  {
    id: "advisor",
    label: "Championship Advisor",
    shortLabel: "Championship",
    secondaryLabel: "Standings",
    icon: "championship",
  },
  {
    id: "pitstop-strategy",
    label: "Pitstop Strategy",
    shortLabel: "Pitstop",
    secondaryLabel: "Strategy",
    icon: "pitstop",
  },
];

/** Full-width hero control above the mobile feature carousel. */
export const MOBILE_WHEEL_HERO_ID = "wheel-settings";

/** Top feature row — horizontal scroll on mobile (Wheel Settings is the hero above). */
export const MOBILE_FEATURE_CARD_ORDER = [
  "podium",
  "todays-race",
  "ai-engineer",
  "advisor",
  "pitstop-strategy",
];

/**
 * @param {string} id
 * @returns {{ id: string, label: string, shortLabel: string, icon: string, eyebrow?: string } | undefined}
 */
export function getPrimaryNavItem(id) {
  return PRIMARY_NAV_ITEMS.find((item) => item.id === id);
}

/** Fixed bottom navigation — mobile only. */
export const MOBILE_BOTTOM_NAV_ITEMS = [
  { id: "wheel-settings", pageId: "wheel-settings", label: "Wheel", icon: "wheel" },
  { id: "ai-engineer", pageId: "ai-engineer", label: "AI", icon: "ai" },
  { id: "advisor", pageId: "advisor", label: "Advisor", icon: "championship" },
  { id: "pitstop-strategy", pageId: "pitstop-strategy", label: "Pitstop", icon: "pitstop" },
  { id: "more", pageId: "more", label: "More", icon: "more" },
];

/** Pages reachable from the bottom bar — everything else lives under More. */
export const MOBILE_BOTTOM_NAV_PAGE_IDS = new Set(
  MOBILE_BOTTOM_NAV_ITEMS.filter((item) => item.pageId !== "more").map(
    (item) => item.pageId,
  ),
);

/** Pinned entries at the top of the mobile More menu. */
export const MOBILE_MORE_PINNED_ITEMS = [
  {
    id: "alr-performance",
    action: "page",
    pageId: "alr-performance",
    label: "ALR Performance Hub",
  },
  {
    id: "about-r79",
    action: "settings",
    settingsView: "about",
    label: "About R79",
  },
  {
    id: "data-sources",
    action: "settings",
    settingsView: "dataReports",
    label: "Data Sources",
  },
  {
    id: "feedback",
    action: "settings",
    settingsView: "feedback",
    label: "Feedback / Request Feature",
  },
];

const MOBILE_MORE_PINNED_PAGE_IDS = new Set(
  MOBILE_MORE_PINNED_ITEMS.filter((item) => item.action === "page").map(
    (item) => item.pageId,
  ),
);

/**
 * @param {{ id: string, label: string }[]} allPages
 * @returns {{ id: string, label: string }[]}
 */
export function getMobileMoreSecondaryItems(allPages) {
  const exclude = new Set([
    ...MOBILE_BOTTOM_NAV_PAGE_IDS,
    ...MOBILE_FEATURE_CARD_ORDER,
    MOBILE_WHEEL_HERO_ID,
    "podium",
    ...MOBILE_MORE_PINNED_PAGE_IDS,
    "settings",
  ]);

  return allPages.filter((item) => !exclude.has(item.id));
}

/** @type {Record<string, { name: string, accent: string }>} */
export const R79_NAV_ICON_META = {
  shortlist: { name: "car", accent: "cyan" },
  "alr-performance": { name: "pulse", accent: "cyan" },
  alr: { name: "folder", accent: "violet" },
  rankings: { name: "chart", accent: "cyan" },
  profiles: { name: "car", accent: "violet" },
  "alr-corner": { name: "track", accent: "gold" },
  archive: { name: "archive", accent: "violet" },
  labs: { name: "labs", accent: "magenta" },
  promise: { name: "info", accent: "gold" },
  membership: { name: "star", accent: "gold" },
  pathfinder: { name: "compass", accent: "champ" },
  settings: { name: "settings", accent: "cyan" },
  podium: { name: "podium", accent: "gold" },
  "about-r79": { name: "info", accent: "spectrum" },
  "data-sources": { name: "conditions", accent: "cyan" },
  feedback: { name: "feedback", accent: "violet" },
};

/**
 * @param {string} pageId
 * @returns {{ name: string, accent: string }}
 */
export function getSecondaryNavIconMeta(pageId) {
  return R79_NAV_ICON_META[pageId] ?? { name: "more", accent: "violet" };
}

/**
 * @param {string} itemId
 * @returns {{ name: string, accent: string }}
 */
export function getMorePinnedIconMeta(itemId) {
  return R79_NAV_ICON_META[itemId] ?? { name: "more", accent: "violet" };
}
