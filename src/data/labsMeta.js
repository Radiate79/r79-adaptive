/**
 * R79 Labs — experimental feature catalogue.
 * Standalone metadata; not wired to recommendation or import engines.
 */

export const LABS_INTRO_QUOTES = [
  "Today's experiment may become tomorrow's feature.",
  "Innovation begins with curiosity.",
  "Every great feature was once just a conversation.",
  "Curiosity is the engine.",
  "Understanding is the destination.",
];

export const LABS_INTRO_DESCRIPTION = [
  "R79 Labs is the experimental division of the R79 platform.",
  "This is where new ideas are imagined, tested and refined before becoming part of the core experience.",
  "Some experiments will become permanent features.",
  "Some will evolve into something entirely different.",
  "Every innovation begins with one simple question:",
];

export const LABS_INTRO_QUESTION = "What if?";

export const LABS_INTRO_CLOSING =
  "R79 exists because curiosity refused to stop.";

/** Permanent Development Mantra — beneath the Labs introduction. */
export const LABS_MANTRA = {
  title: "🔥 Development Mantra",
  lines: ["Let's go.", "Let's do it.", "Let it be so."],
  reflections: [
    "Every great feature begins as an idea.",
    "Every idea begins with curiosity.",
    "Every experiment brings understanding.",
    "Every improvement helps another driver.",
  ],
  footer: "R79 was built one conversation at a time.",
};

export const LABS_FOOTER_LINES = [
  "Innovation begins with curiosity.",
  "Today's experiment may become tomorrow's feature.",
];

/** @typedef {'concept' | 'planning' | 'prototype' | 'development' | 'architecture' | 'future'} LabsStatusKey */

/**
 * @typedef {Object} LabsFeature
 * @property {string} id
 * @property {string} icon
 * @property {string} name
 * @property {string} description
 * @property {string} status
 * @property {LabsStatusKey} statusKey
 * @property {string} versionTarget
 * @property {number} progress
 * @property {string} expectedRelease
 * @property {boolean} comingSoon
 */

/** @type {LabsFeature[]} */
export const LABS_FEATURES = [
  {
    id: "ai-race-engineer",
    icon: "🧠",
    name: "AI Race Engineer",
    description:
      "Conversational race engineer that interprets track DNA, car behaviour and session context to recommend strategy, setup direction and race-day decisions.",
    status: "Planning",
    statusKey: "planning",
    versionTarget: "v1.2",
    progress: 22,
    expectedRelease: "2026 Q3",
    comingSoon: true,
  },
  {
    id: "replay-coach",
    icon: "🎥",
    name: "Replay Coach",
    description:
      "Replay-aware coaching layer that highlights braking points, corner exits and consistency gaps from session footage and lap data.",
    status: "Prototype",
    statusKey: "prototype",
    versionTarget: "v1.3",
    progress: 38,
    expectedRelease: "2026 Q4",
    comingSoon: true,
  },
  {
    id: "championship-advisor",
    icon: "🏆",
    name: "Championship Advisor",
    description:
      "Next-generation championship intelligence — deeper season modelling, multi-round strategy and evolving database-driven recommendations.",
    status: "In Development",
    statusKey: "development",
    versionTarget: "v1.1",
    progress: 68,
    expectedRelease: "2026 Q2",
    comingSoon: false,
  },
  {
    id: "driver-dna",
    icon: "👤",
    name: "Driver DNA",
    description:
      "Personal driving profile that learns your tendencies, strengths and improvement areas across cars, tracks and race formats.",
    status: "Concept",
    statusKey: "concept",
    versionTarget: "v1.4",
    progress: 12,
    expectedRelease: "2027",
    comingSoon: true,
  },
  {
    id: "r79-intelligence",
    icon: "🚀",
    name: "R79 Intelligence",
    description:
      "Unified AI layer connecting advisors, archives and data systems into a single racing intelligence experience across the platform.",
    status: "Future",
    statusKey: "future",
    versionTarget: "v2.0",
    progress: 8,
    expectedRelease: "TBD",
    comingSoon: true,
  },
  {
    id: "gt8-expansion",
    icon: "🎮",
    name: "GT8 Expansion",
    description:
      "Game-version architecture and data scaffolding prepared for Gran Turismo 8 — ready to activate when GT8 content becomes available.",
    status: "Ready Architecture",
    statusKey: "architecture",
    versionTarget: "v1.0+",
    progress: 85,
    expectedRelease: "With GT8 data",
    comingSoon: false,
  },
];

/** @type {Record<LabsStatusKey, string>} */
export const LABS_STATUS_COLORS = {
  concept: "#b8a0ff",
  planning: "#9bc0ff",
  prototype: "#7dd3fc",
  development: "#7dffa8",
  architecture: "#ffd27a",
  future: "#94a3b8",
};
