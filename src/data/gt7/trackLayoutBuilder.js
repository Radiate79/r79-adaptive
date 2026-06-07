import { STANDARD_RACE_CLASSES } from "./trackMetadata.js";

/**
 * @typedef {Object} TrackLayoutInput
 * @property {string} id
 * @property {string} trackFamily
 * @property {string} layoutName
 * @property {boolean} [reverse]
 * @property {string} [displayName]
 * @property {string} [trackType]
 * @property {string} [drivingStyle]
 * @property {string} [surface]
 * @property {boolean} [eligibleForStandardRaceCars]
 * @property {string[]} [eligibleClasses]
 * @property {string[]} [alternateNames]
 * @property {string[]} [legacyIds]
 * @property {number} topSpeed
 * @property {number} traction
 * @property {number} fuel
 * @property {number} tyres
 * @property {number} stability
 * @property {number} kerbs
 * @property {number} overtaking
 * @property {string[]} [notes]
 */

/**
 * @param {string} trackFamily
 * @param {string} layoutName
 * @param {boolean} reverse
 */
export function formatTrackDisplayName(trackFamily, layoutName, reverse = false) {
  const normalizedLayout = layoutName.trim();
  const normalizedFamily = trackFamily.trim();

  let base = normalizedLayout;

  if (
    normalizedLayout === "Full Circuit" ||
    normalizedLayout === normalizedFamily
  ) {
    base = normalizedFamily;
  } else if (!normalizedLayout.startsWith(normalizedFamily)) {
    base = `${normalizedFamily} - ${normalizedLayout}`;
  }

  return reverse ? `${base} Reverse` : base;
}

/**
 * @param {TrackLayoutInput} input
 */
export function buildTrackLayout(input) {
  const reverse = Boolean(input.reverse);
  const displayName =
    input.displayName ??
    formatTrackDisplayName(input.trackFamily, input.layoutName, reverse);

  return {
    id: input.id,
    trackFamily: input.trackFamily,
    layoutName: input.layoutName,
    displayName,
    name: displayName,
    reverse,
    trackType: input.trackType ?? "road",
    drivingStyle: input.drivingStyle,
    surface: input.surface,
    eligibleForStandardRaceCars: input.eligibleForStandardRaceCars,
    eligibleClasses: input.eligibleClasses ?? [...STANDARD_RACE_CLASSES],
    alternateNames: input.alternateNames,
    legacyIds: input.legacyIds,
    topSpeed: input.topSpeed,
    traction: input.traction,
    fuel: input.fuel,
    tyres: input.tyres,
    stability: input.stability,
    kerbs: input.kerbs,
    overtaking: input.overtaking,
    notes: input.notes ?? [],
  };
}

/**
 * @param {ReturnType<typeof buildTrackLayout>} layout
 * @param {string} reverseId
 * @param {Partial<TrackLayoutInput>} [overrides]
 */
export function buildReverseLayout(layout, reverseId, overrides = {}) {
  return buildTrackLayout({
    ...layout,
    ...overrides,
    id: reverseId,
    trackFamily: layout.trackFamily,
    layoutName: layout.layoutName,
    reverse: true,
    displayName: undefined,
    topSpeed: overrides.topSpeed ?? layout.topSpeed,
    traction: overrides.traction ?? layout.traction,
    fuel: overrides.fuel ?? layout.fuel,
    tyres: overrides.tyres ?? layout.tyres,
    stability: overrides.stability ?? layout.stability,
    kerbs: overrides.kerbs ?? layout.kerbs,
    overtaking: overrides.overtaking ?? Math.max(3, layout.overtaking - 1),
    notes: overrides.notes ?? layout.notes,
  });
}

/**
 * @param {TrackLayoutInput} input
 * @param {string} reverseId
 * @param {Partial<TrackLayoutInput>} [reverseOverrides]
 */
export function buildLayoutPair(input, reverseId, reverseOverrides = {}) {
  const forward = buildTrackLayout(input);
  const reverse = buildReverseLayout(forward, reverseId, reverseOverrides);
  return [forward, reverse];
}

/**
 * @param {TrackLayoutInput[]} inputs
 * @param {(input: TrackLayoutInput) => string} reverseIdFor
 * @param {(input: TrackLayoutInput) => Partial<TrackLayoutInput>} [reverseOverridesFor]
 */
export function expandLayoutsWithReverse(
  inputs,
  reverseIdFor,
  reverseOverridesFor = () => ({}),
) {
  return inputs.flatMap((input) => {
    const forward = buildTrackLayout(input);
    if (input.reverse) {
      return [forward];
    }

    return [
      forward,
      buildReverseLayout(
        forward,
        reverseIdFor(input),
        reverseOverridesFor(input),
      ),
    ];
  });
}
