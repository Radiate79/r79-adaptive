/**
 * R79 Membership tiers — informational display.
 */

export const MEMBERSHIP_INTRO =
  "Three tiers designed to keep meaningful tools available to every driver while accelerating future development.";

export const MEMBERSHIP_FOOTER = [
  "Every membership helps R79 evolve.",
  "Every driver helps R79 improve.",
];

/** @type {Record<'free' | 'pro' | 'pathfinder', string>} */
export const MEMBERSHIP_TIER_SUMMARIES = {
  free: "Free gives meaningful tools to every driver.",
  pro: "Pro unlocks advanced intelligence.",
  pathfinder: "Pathfinder recognises early contributors and testers.",
};

/** @typedef {Object} MembershipTier
 * @property {string} id
 * @property {string} title
 * @property {string[]} features
 * @property {'free' | 'pro' | 'pathfinder'} variant
 */

/** @type {MembershipTier[]} */
export const MEMBERSHIP_TIERS = [
  {
    id: "free",
    title: "🆓 Free",
    variant: "free",
    features: [
      "Wheel Settings",
      "Car Database",
      "Track Database",
      "OCR Import",
      "Historical Rankings",
      "Archive",
      "Basic AI Race Engineer",
      "Community Features",
    ],
  },
  {
    id: "pro",
    title: "⭐ Pro",
    variant: "pro",
    features: [
      "Advanced AI Race Engineer",
      "Replay Coach",
      "Driver DNA",
      "Championship Advisor",
      "Advanced Analytics",
      "Unlimited Saved Setups",
      "Cloud Sync",
      "Early Labs Access",
    ],
  },
  {
    id: "pathfinder",
    title: "🌟 Pathfinder",
    variant: "pathfinder",
    features: [
      "Invitation-only — not bought",
      "Early access to experimental features",
      "Priority beta testing",
      "Direct feedback opportunities",
      "Special Pathfinder badge",
      "Help shape future development",
    ],
  },
];
