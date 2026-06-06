import packageJson from "../../package.json";

/** Project creator — not the Pathfinder membership tier. */
export const FOUNDER_NAME = "Radiate79";
export const PROJECT_STARTED_YEAR = 2026;
export const PROJECT_START_DATE = "2026-01-01";

export const APP_VERSION = packageJson.version;

/** Set at build time when git is available; null hides the stat gracefully. */
export const BUILD_COMMIT_COUNT = 2;

export const BUILD_LABEL = `R79 v${APP_VERSION}`;

export const AI_MODULES = [
  "championshipEngine",
  "todaysRaceAdvisorEngine",
  "shortlistAdvisorEngine",
  "carProfileEngine",
  "alrPerformanceEngine",
  "alrRankingsEngine",
  "alrOcr",
  "alrCarMatcher",
  "alrStandingsParser",
];

export const COMPLETED_MILESTONES = [
  { id: "created", label: "R79 Created", year: 2026 },
  { id: "wheel", label: "Wheel Settings Engine", year: 2026 },
  { id: "ocr", label: "OCR Import", year: 2026 },
  { id: "bulk", label: "Bulk Import", year: 2026 },
  { id: "zip", label: "Championship ZIP Import", year: 2026 },
  { id: "rankings", label: "Historical Rankings", year: 2026 },
  { id: "gt8", label: "GT8 Architecture", year: 2026 },
];

export const UPCOMING_MILESTONES = [
  { id: "ai-engineer", label: "AI Race Engineer" },
  { id: "profiles", label: "Car Profiles" },
  { id: "replay", label: "Replay Coach" },
  { id: "team", label: "Team Advisor" },
  { id: "daily", label: "Daily Race Assistant" },
];

export const FOUNDER_CONSOLE_TAGLINE = "Powered by tea ☕ and stubbornness.";
