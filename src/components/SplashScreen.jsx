import {
  BRAND_TAGLINE,
  R79_APP_TAGLINE,
  SPLASH_COPY,
  formatVersionLabel,
} from "../data/brandingMeta.js";
import { APP_VERSION } from "../data/founderMeta.js";
import { markSplashSeen } from "../utils/splashStorage.js";
import R79Emblem from "./branding/R79Emblem.jsx";
import R79Wordmark from "./branding/R79Wordmark.jsx";

export default function SplashScreen({ onEnter }) {
  const handleEnter = () => {
    markSplashSeen();
    onEnter();
  };

  return (
    <div className="r79-splash">
      <style>{`
        @keyframes splashFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="r79-splash__panel">
        <div className="r79-splash__emblem">
          <R79Emblem variant="splash" pulse />
        </div>

        <div className="r79-splash__wordmark">
          <R79Wordmark variant="hero" />
        </div>

        <p className="r79-splash__tagline">{R79_APP_TAGLINE}</p>

        <div className="r79-splash__motto">
          {SPLASH_COPY.motto.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="r79-splash__mantra">
          {SPLASH_COPY.mantra.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={handleEnter}
          className="r79-btn-primary r79-splash__enter"
        >
          {SPLASH_COPY.enterLabel}
        </button>
      </div>

      <div className="r79-splash__footer">
        <p>{formatVersionLabel(APP_VERSION)}</p>
        <p>{BRAND_TAGLINE}</p>
      </div>
    </div>
  );
}
