/**
 * R79 Archive — project journal metadata.
 * Append milestones to ARCHIVE_MILESTONES; the Timeline section renders them automatically.
 */

export const ARCHIVE_INTRO =
  "Digital museum and captain's log — preserving the philosophy, history, mission and evolution of R79.";

export const ARCHIVE_PROJECT = {
  name: "R79",
  started: 2026,
  status: "Active Development",
  description:
    "Independent AI-powered racing intelligence platform designed to help drivers understand, analyse and improve.",
};

/** Permanent quote wall — each item is one inscribed passage. */
export const ARCHIVE_WALL = [
  [
    "R79 began as a search for better wheel settings.",
    "It evolved into a search for better racing.",
    "It continues as a search for better understanding.",
  ],
  [
    "The destination was never the goal.",
    "The understanding gained along the journey was always the reward.",
  ],
  [
    "If you want to go fast, go alone.",
    "If you want to go far, go together.",
  ],
  [
    "Every lap teaches something.",
    "Every race leaves data.",
    "Every improvement begins with understanding.",
  ],
  ["Leave the racing community better than you found it."],
];

export const ARCHIVE_IDENTITY = [
  "Built with curiosity.",
  "Driven by community.",
  "Guided by understanding.",
];

/** Permanent values — not editable through the Archive UI. */
export const ARCHIVE_PROMISE = {
  title: "⭐ The Promise",
  lead: "R79 exists to help drivers learn, improve and understand racing.",
  commitments: [
    "Every feature should make racing clearer.",
    "Every update should add value.",
    "Every decision should serve the community.",
  ],
  principles: [
    "Progress over perfection.",
    "Understanding over guessing.",
    "Community over competition.",
  ],
  closing: "Leave the racing community better than you found it.",
  pathfinderRecognition: [
    "Pathfinder exists to recognise contribution, curiosity and community support.",
    "It is not a status symbol.",
    "It is a record of helping build the road for others.",
  ],
  journey: {
    started: 2026,
    status: [
      "☕ Still learning.",
      "🏁 Still racing.",
      "🧠 Still building.",
      "🚀 Still dreaming.",
    ],
  },
  finalLine: "The journey continues...",
};

export const ARCHIVE_MISSION = {
  lead: "R79 exists to help drivers understand racing through data, analysis and AI-assisted insight.",
  goal: "The goal is continuous improvement rather than perfection.",
  principles: ["Race smarter.", "Learn faster.", "Never stop improving."],
};

export const ARCHIVE_ORIGINS = {
  question: "How can I get the best from my wheel?",
  paragraphs: [
    "Every answer created another question.",
    "Every solution revealed another possibility.",
    "The project grew because curiosity refused to stop.",
    "The destination was never the goal.",
    "The understanding gained along the journey was always the reward.",
  ],
};

export const ARCHIVE_PHILOSOPHY = [
  "Every lap teaches something.",
  "Every race leaves data.",
  "Every improvement begins with understanding.",
  "R79 exists to help drivers become the best version of themselves.",
];

export const ARCHIVE_TEAM_MOTTO = [
  "If you want to go fast, go alone.",
  "If you want to go far, go together.",
];

export const ARCHIVE_FOUNDER_NOTE = [
  "This archive exists to preserve the history of R79 and document its evolution over time.",
  "The purpose is not recognition, but remembrance.",
  "Every version represents another lesson learned.",
];

export const ARCHIVE_FOOTER = {
  closing: [
    "Built by curiosity.",
    "Refined by experience.",
    "Shared with the community.",
    "Driven by understanding.",
  ],
  finalLine: "The journey continues...",
};

export const CAPTAINS_LOG_ENTRY_FOOTER = "The journey continues...";

export const ARCHIVE_LEGACY = [
  "Leave the racing community better than you found it.",
  "R79 exists to help drivers learn, improve and understand racing through knowledge, analysis and AI.",
  "Every feature, every database, every line of code and every idea has one purpose:",
  "To help another driver find another tenth.",
  "The destination was never the goal.",
  "The understanding gained along the journey was always the reward.",
  "R79",
  "Built by curiosity.",
  "Refined by experience.",
  "Shared with the community.",
  "Driven by the pursuit of understanding.",
  "The journey continues.",
];

/** @type {Record<string, string>} */
export const CAPTAINS_LOG_TAG_ICONS = {
  project: "🏁",
  origin: "🏁",
  direction: "🏁",
  release: "🚀",
  ai: "🧠",
  database: "📊",
  import: "📦",
  gt: "🎮",
  gt8: "🎮",
  milestone: "🏆",
  inspiration: "☕",
  idea: "💡",
  vision: "💡",
  growth: "🚀",
  archive: "📚",
};

/**
 * @param {{ title?: string, tags?: string[] }} entry
 * @returns {string}
 */
export function getCaptainsLogEntryIcon(entry) {
  for (const tag of entry.tags ?? []) {
    const icon = CAPTAINS_LOG_TAG_ICONS[String(tag).toLowerCase()];
    if (icon) {
      return icon;
    }
  }

  const title = String(entry.title ?? "").toLowerCase();

  if (title.includes("gt8")) {
    return "🎮";
  }

  if (title.includes("import") || title.includes("ocr")) {
    return "📦";
  }

  if (title.includes("ai") || title.includes("engineer")) {
    return "🧠";
  }

  if (title.includes("database") || title.includes("rankings")) {
    return "📊";
  }

  if (title.includes("release")) {
    return "🚀";
  }

  if (title.includes("vision") || title.includes("idea")) {
    return "💡";
  }

  return "🏁";
}

/**
 * Chronological milestones — append new entries; grouped by year on the Archive page.
 * @type {{ year: number, label: string }[]}
 */
export const ARCHIVE_MILESTONES = [
  { year: 2026, label: "R79 concept created" },
  { year: 2026, label: "First wheel settings engine" },
  { year: 2026, label: "T598 database" },
  { year: 2026, label: "OCR Import Engine" },
  { year: 2026, label: "Bulk Import" },
  { year: 2026, label: "Championship ZIP Import" },
  { year: 2026, label: "Historical Rankings" },
  { year: 2026, label: "GT8 Architecture" },
  { year: 2026, label: "AI Race Engineer planning" },
];

/** @type {{ completed: string[], inProgress: string[], planned: string[], future: string[] }} */
export const ARCHIVE_ROADMAP = {
  completed: [
    "OCR Import",
    "Bulk Import",
    "Historical Rankings",
    "Championship ZIP Import",
    "GT8 Architecture",
    "Today's Race Advisor",
    "R79 Archive",
  ],
  inProgress: ["Championship Database"],
  planned: [
    "Car Profiles",
    "AI Race Engineer",
    "Team Advisor",
    "Daily Race Assistant",
  ],
  future: [
    "Replay Coach",
    "Telemetry Analysis",
    "AI Driver Profile",
    "GT8 Data",
  ],
};

/**
 * Group milestones by year for the Timeline section.
 * @returns {{ year: number, items: string[] }[]}
 */
/**
 * Current development focus from the roadmap.
 * @returns {string}
 */
export function getArchiveCurrentFocus() {
  return (
    ARCHIVE_ROADMAP.inProgress[0] ??
    ARCHIVE_ROADMAP.planned[0] ??
    "Active development"
  );
}

/**
 * @param {{ title?: string }[]} journalEntriesNewestFirst
 * @returns {string}
 */
export function getArchiveLastMilestone(journalEntriesNewestFirst) {
  if (journalEntriesNewestFirst.length > 0) {
    return journalEntriesNewestFirst[0].title;
  }

  const last = ARCHIVE_MILESTONES.at(-1);
  return last?.label ?? "—";
}

export function getArchiveTimelineByYear() {
  /** @type {Record<number, string[]>} */
  const grouped = {};

  for (const milestone of ARCHIVE_MILESTONES) {
    if (!grouped[milestone.year]) {
      grouped[milestone.year] = [];
    }
    grouped[milestone.year].push(milestone.label);
  }

  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      items: grouped[year],
    }));
}

/**
 * @param {string} isoDate YYYY-MM-DD
 */
export function formatArchiveJournalDate(isoDate) {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
