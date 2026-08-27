import {
  ACTIVE_GT7_GAME_VERSION,
  ACTIVE_PHYSICS_GENERATION,
  formatGt7PhysicsStatusLine,
  getGt7PhysicsStatusDetails,
} from "../../data/gt7PhysicsVersion.js";
import { useId, useState } from "react";

/**
 * Small unobtrusive GT7 physics status chip for app chrome.
 * Does not alter navigation layout.
 */
export default function Gt7PhysicsStatus() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const details = getGt7PhysicsStatusDetails();

  return (
    <div className="r79-gt7-physics-status">
      <button
        type="button"
        className="r79-gt7-physics-status__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        title={`${formatGt7PhysicsStatusLine()} — tap for details`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="r79-gt7-physics-status__text">
          GT7 Physics: {ACTIVE_GT7_GAME_VERSION} ✓ Current
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="r79-gt7-physics-status__panel"
          role="region"
          aria-label="GT7 physics details"
        >
          {details.map((row) => (
            <div key={row.label} className="r79-gt7-physics-status__row">
              <span className="r79-gt7-physics-status__label">{row.label}</span>
              <span className="r79-gt7-physics-status__value">{row.value}</span>
            </div>
          ))}
          <p className="r79-gt7-physics-status__note">
            Active generation: {ACTIVE_PHYSICS_GENERATION}. Historical data is
            retained and never silently overrides newer validated results.
          </p>
        </div>
      ) : null}
    </div>
  );
}
