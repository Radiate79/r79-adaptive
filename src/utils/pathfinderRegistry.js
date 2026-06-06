import registrySeed from "../data/pathfinderRegistry.json";
import { PATHFINDER_REGISTRY_MAX } from "../data/pathfinderRegistryMeta.js";

/**
 * @typedef {Object} PathfinderRegistryEntry
 * @property {number} number
 * @property {string} name
 * @property {string} [awarded]
 * @property {string} [recognition]
 */

/**
 * Read-only Pathfinder Registry snapshot.
 * @returns {{
 *   pathfinders: PathfinderRegistryEntry[],
 *   count: number,
 *   max: number,
 *   isComplete: boolean,
 *   remaining: number,
 * }}
 */
export function getPathfinderRegistry() {
  const pathfinders = [...registrySeed.pathfinders]
    .filter(
      (entry) =>
        Number.isFinite(entry.number) &&
        entry.number >= 1 &&
        entry.number <= PATHFINDER_REGISTRY_MAX &&
        String(entry.name ?? "").trim(),
    )
    .sort((a, b) => a.number - b.number);

  const count = pathfinders.length;
  const max = PATHFINDER_REGISTRY_MAX;

  return {
    pathfinders,
    count,
    max,
    isComplete: count >= max,
    remaining: Math.max(0, max - count),
  };
}

/**
 * @param {number} number
 */
export function formatPathfinderNumber(number) {
  return String(number).padStart(3, "0");
}
