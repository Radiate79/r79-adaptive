/**
 * Whole-setup balance guard.
 * Evaluates combined resistance / responsiveness / stability AFTER individual
 * desired targets are computed, then adjusts overlapping channels so they do
 * not stack into an overly heavy or overly nervous setup.
 *
 * Behaviour-based — NOT hard-coded forbidden combinations.
 */

/**
 * @typedef {import("./wheelDesiredBehaviour.js").DesiredSteeringBehaviour} DesiredSteeringBehaviour
 */

/**
 * Soft envelope for combined resistance channels.
 * resistanceBudget ≈ 0.35·inertia + 0.30·friction + 0.35·damping
 */
const RESISTANCE_MAX = 0.62;
const RESISTANCE_MIN = 0.22;
const RESPONSE_MIN = 0.38;
const STABILITY_MIN = 0.32;
const DIRECTION_CHANGE_MIN = 0.34;

/**
 * Apply whole-setup balance corrections to desired behaviour targets.
 * Deterministic, bounded adjustments only.
 *
 * @param {DesiredSteeringBehaviour} desired
 * @returns {{
 *   desired: DesiredSteeringBehaviour,
 *   corrections: Array<{ channel: string, from: number, to: number, reason: string }>,
 *   diagnostics: {
 *     resistanceBefore: number,
 *     resistanceAfter: number,
 *     responseBefore: number,
 *     responseAfter: number,
 *     stabilityBefore: number,
 *     stabilityAfter: number,
 *   },
 * }}
 */
export function applyWholeSetupBalance(desired) {
  /** @type {DesiredSteeringBehaviour} */
  const out = { ...desired };
  /** @type {Array<{ channel: string, from: number, to: number, reason: string }>} */
  const corrections = [];

  const resistanceBefore =
    out.inertiaTarget * 0.35 + out.frictionTarget * 0.3 + out.dampingTarget * 0.35;
  const responseBefore = out.responseTarget;
  const stabilityBefore = out.stabilityTarget;

  // ── Excess resistance stacking ──────────────────────────────────────────
  if (resistanceBefore > RESISTANCE_MAX) {
    const excess = resistanceBefore - RESISTANCE_MAX;
    // Prefer reducing friction first (secondary catchability), then inertia,
    // then damper — keep the primary oscillation channel when possible.
    const frictionCut = Math.min(out.frictionTarget * 0.55, excess * 1.4);
    const afterFriction = Math.max(0.08, out.frictionTarget - frictionCut);
    if (afterFriction !== out.frictionTarget) {
      corrections.push({
        channel: "frictionTarget",
        from: out.frictionTarget,
        to: afterFriction,
        reason:
          "Reduced friction because inertia and damper already supply enough combined resistance.",
      });
      out.frictionTarget = afterFriction;
    }

    const resistanceMid =
      out.inertiaTarget * 0.35 + out.frictionTarget * 0.3 + out.dampingTarget * 0.35;

    if (resistanceMid > RESISTANCE_MAX) {
      const stillExcess = resistanceMid - RESISTANCE_MAX;
      const inertiaCut = Math.min(out.inertiaTarget * 0.4, stillExcess * 1.2);
      const afterInertia = Math.max(0.12, out.inertiaTarget - inertiaCut);
      if (afterInertia !== out.inertiaTarget) {
        corrections.push({
          channel: "inertiaTarget",
          from: out.inertiaTarget,
          to: afterInertia,
          reason:
            "Trimmed inertia to preserve rotation speed while meeting the stability target with less total resistance.",
        });
        out.inertiaTarget = afterInertia;
      }
    }

    const resistanceLate =
      out.inertiaTarget * 0.35 + out.frictionTarget * 0.3 + out.dampingTarget * 0.35;

    if (resistanceLate > RESISTANCE_MAX) {
      const stillExcess = resistanceLate - RESISTANCE_MAX;
      const damperCut = Math.min(out.dampingTarget * 0.35, stillExcess * 1.1);
      const afterDamper = Math.max(0.12, out.dampingTarget - damperCut);
      if (afterDamper !== out.dampingTarget) {
        corrections.push({
          channel: "dampingTarget",
          from: out.dampingTarget,
          to: afterDamper,
          reason:
            "Softened damper slightly so overlapping resistance channels do not make the wheel overly heavy.",
        });
        out.dampingTarget = afterDamper;
      }
    }
  }

  // ── Too light / nervous ─────────────────────────────────────────────────
  const resistanceAfterStack =
    out.inertiaTarget * 0.35 + out.frictionTarget * 0.3 + out.dampingTarget * 0.35;

  if (resistanceAfterStack < RESISTANCE_MIN && out.stabilityTarget >= STABILITY_MIN) {
    const deficit = RESISTANCE_MIN - resistanceAfterStack;
    // Prefer damper as primary catchability channel
    const damperBoost = Math.min(0.18, deficit * 1.3);
    const afterDamper = Math.min(0.72, out.dampingTarget + damperBoost);
    if (afterDamper !== out.dampingTarget) {
      corrections.push({
        channel: "dampingTarget",
        from: out.dampingTarget,
        to: afterDamper,
        reason:
          "Raised damper to prevent an overly light / nervous setup while keeping friction low.",
      });
      out.dampingTarget = afterDamper;
    }
  }

  // ── Responsiveness floor — soft boost, preserve relative ordering ────────
  if (out.responseTarget < RESPONSE_MIN) {
    const after = out.responseTarget + (RESPONSE_MIN - out.responseTarget) * 0.6;
    corrections.push({
      channel: "responseTarget",
      from: out.responseTarget,
      to: after,
      reason: "Restored minimum response so the front end stays informative.",
    });
    out.responseTarget = after;
  }

  if (out.rotationSpeedTarget < DIRECTION_CHANGE_MIN && out.directionChangeSpeed < 0.4) {
    const after =
      out.rotationSpeedTarget +
      (DIRECTION_CHANGE_MIN - out.rotationSpeedTarget) * 0.55;
    if (after !== out.rotationSpeedTarget) {
      corrections.push({
        channel: "rotationSpeedTarget",
        from: out.rotationSpeedTarget,
        to: after,
        reason:
          "Preserved direction-change speed so stability controls do not make the wheel sluggish.",
      });
      out.rotationSpeedTarget = after;
    }
  }

  // ── Stability floor (high-speed / high stability demand) ────────────────
  if (out.stabilityTarget < STABILITY_MIN && desired.stabilityTarget >= 0.45) {
    // Original desire was high but balance may have eroded it — restore softly via damper
    const afterDamper = Math.min(0.7, Math.max(out.dampingTarget, 0.28));
    if (afterDamper > out.dampingTarget) {
      corrections.push({
        channel: "dampingTarget",
        from: out.dampingTarget,
        to: afterDamper,
        reason: "Restored minimum damping for high-speed stability without stacking all resistance channels.",
      });
      out.dampingTarget = afterDamper;
    }
  }

  // Recalculate derived phase metrics after corrections
  out.resistanceBudget = n(
    out.inertiaTarget * 0.35 + out.frictionTarget * 0.3 + out.dampingTarget * 0.35,
  );
  out.exitControl = n(
    mix(out.exitControl, out.rotationSpeedTarget * 0.55 + out.responseTarget * 0.45) -
      out.dampingTarget * 0.05 -
      out.inertiaTarget * 0.05,
  );
  out.directionChangeSpeed = n(
    out.rotationSpeedTarget * 0.55 + out.responseTarget * 0.3 - out.inertiaTarget * 0.15,
  );
  out.midCornerReadability = n(
    out.lowForceDetailTarget * 0.45 +
      out.stabilityTarget * 0.3 -
      out.frictionTarget * 0.12,
  );

  return {
    desired: out,
    corrections,
    diagnostics: {
      resistanceBefore,
      resistanceAfter: out.resistanceBudget,
      responseBefore,
      responseAfter: out.responseTarget,
      stabilityBefore,
      stabilityAfter: out.stabilityTarget,
    },
  };
}

/**
 * Estimate combined resistance from already-quantised T598 hardware values.
 * Used by regression tests / diagnostics — not for scoring cars.
 *
 * @param {Record<string, string | number>} values
 */
export function estimateT598CombinedResistance(values) {
  const inertia = enumIndex(["Off", "Mid", "High", "Extreme"], values.inertia);
  const friction = enumIndex(["Off", "Low", "Mid", "High"], values.friction);
  const damper = percentValue(values.damper) / 100;
  const damperGain = enumIndex(["Low", "Mid", "High"], values.damperGain);

  return n(inertia * 0.3 + friction * 0.25 + damper * 0.3 + damperGain * 0.15);
}

/**
 * @param {string[]} options
 * @param {string | number | undefined} value
 */
function enumIndex(options, value) {
  const index = options.findIndex(
    (option) => String(option).toLowerCase() === String(value ?? "").toLowerCase(),
  );
  if (index < 0) return 0.5;
  return options.length <= 1 ? 0.5 : index / (options.length - 1);
}

/**
 * @param {string | number | undefined} value
 */
function percentValue(value) {
  const match = String(value ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : 50;
}

/**
 * @param {number} value
 */
function n(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

/**
 * @param {...number} parts
 */
function mix(...parts) {
  const values = parts.filter((v) => Number.isFinite(v));
  if (!values.length) return 0.5;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
