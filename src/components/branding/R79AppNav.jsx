import { useEffect, useRef } from "react";
import { GAME_CATALOG } from "../../data/gameVersions.js";
import {
  getPrimaryNavItem,
  MOBILE_FEATURE_CARD_ORDER,
  MOBILE_WHEEL_HERO_ID,
  PRIMARY_NAV_ITEMS,
} from "../../data/appNavMeta.js";
import R79Icon, { R79_FEATURE_ICONS } from "./R79Icon.jsx";
import R79HeroWheel from "./R79HeroWheel.jsx";

/**
 * @param {Object} props
 * @param {string} props.page
 * @param {(id: string) => void} props.setPage
 * @param {string} props.gameVersion
 * @param {(version: string) => void} props.setGameVersion
 * @param {string[]} props.gameOptions
 * @param {{ id: string, label: string }[]} props.allPages
 * @param {boolean} props.moreOpen
 * @param {(open: boolean) => void} props.onMoreOpenChange
 */
export default function R79AppNav({
  page,
  setPage,
  gameVersion,
  setGameVersion,
  gameOptions,
  allPages,
  moreOpen,
  onMoreOpenChange,
}) {
  const desktopMoreRef = useRef(null);

  const primaryIds = new Set(PRIMARY_NAV_ITEMS.map((item) => item.id));
  const secondaryPages = allPages.filter((item) => !primaryIds.has(item.id));
  const desktopMoreIsActive = secondaryPages.some((item) => item.id === page);

  const wheelHero = getPrimaryNavItem(MOBILE_WHEEL_HERO_ID);
  const mobileFeatureCards = MOBILE_FEATURE_CARD_ORDER.map((id) =>
    getPrimaryNavItem(id),
  ).filter(Boolean);

  useEffect(() => {
    if (!moreOpen) {
      return undefined;
    }

    const handlePointer = (event) => {
      if (!window.matchMedia("(min-width: 769px)").matches) {
        return;
      }

      if (desktopMoreRef.current?.contains(event.target)) {
        return;
      }

      onMoreOpenChange(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointer);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointer);
    };
  }, [moreOpen, onMoreOpenChange]);

  const navigate = (id) => {
    setPage(id);
    onMoreOpenChange(false);
  };

  const wheelHeroActive = page === "wheel-settings" || page === "podium";

  return (
    <div className="r79-app-nav-shell">
      <nav className="r79-app-nav r79-app-nav--desktop" aria-label="Primary navigation">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={
                isActive ? "r79-nav-pill r79-nav-pill--active" : "r79-nav-pill"
              }
            >
              {item.label}
            </button>
          );
        })}

        <div className="r79-nav-more" ref={desktopMoreRef}>
          <button
            type="button"
            className={
              desktopMoreIsActive || moreOpen
                ? "r79-nav-pill r79-nav-pill--active r79-nav-more__trigger"
                : "r79-nav-pill r79-nav-more__trigger"
            }
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => onMoreOpenChange(!moreOpen)}
          >
            More
          </button>

          {moreOpen ? (
            <div className="r79-nav-more__menu" role="menu">
              {secondaryPages.map((item) => {
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => navigate(item.id)}
                    className={
                      isActive
                        ? "r79-nav-more__item r79-nav-more__item--active"
                        : "r79-nav-more__item"
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="r79-app-game-selector r79-app-game-selector--desktop">
        <span className="r79-app-game-label">Game</span>
        <div className="r79-app-game-buttons">
          {gameOptions.map((version) => {
            const entry = GAME_CATALOG[version];
            const isActive = gameVersion === version;
            return (
              <button
                key={version}
                type="button"
                onClick={() => setGameVersion(version)}
                className={
                  isActive ? "r79-nav-pill r79-nav-pill--active" : "r79-nav-pill"
                }
              >
                {entry.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="r79-mobile-chrome">
        {wheelHero ? (
          <button
            type="button"
            className={
              wheelHeroActive
                ? "r79-wheel-hero-nav r79-wheel-hero-nav--active"
                : "r79-wheel-hero-nav"
            }
            onClick={() => navigate(MOBILE_WHEEL_HERO_ID)}
            aria-current={page === "wheel-settings" ? "page" : undefined}
          >
            <span className="r79-wheel-hero-nav__rim" aria-hidden="true" />
            <span className="r79-wheel-hero-nav__trails" aria-hidden="true" />
            <span className="r79-wheel-hero-nav__visual r79-holo-object r79-holo-object--hero" aria-hidden="true">
              <span className="r79-holo-object__ring" />
              <R79HeroWheel size={124} />
            </span>
            <span className="r79-wheel-hero-nav__copy">
              <span className="r79-wheel-hero-nav__title">
                <span>Wheel</span>
                <span>Settings</span>
              </span>
              <span className="r79-wheel-hero-nav__subtitle">
                Precision setup for your race
              </span>
              <span className="r79-wheel-hero-nav__accent" />
            </span>
            <span className="r79-wheel-hero-nav__chevron" aria-hidden="true">
              <R79Icon name="chevron" size={28} accent="magenta" />
            </span>
          </button>
        ) : null}

        <div
          className="r79-mobile-feature-scroll"
          role="navigation"
          aria-label="Features"
        >
          {mobileFeatureCards.map((item) => {
            const isActive = page === item.id;
            const iconMeta = R79_FEATURE_ICONS[item.id] ?? {
              name: "more",
              accent: "spectrum",
            };
            const accentClass =
              item.id === "podium"
                ? "r79-mobile-feature-card--podium"
                : item.id === "todays-race"
                  ? "r79-mobile-feature-card--today"
                  : item.id === "ai-engineer"
                    ? "r79-mobile-feature-card--ai"
                    : item.id === "advisor"
                      ? "r79-mobile-feature-card--champ"
                      : item.id === "pitstop-strategy"
                        ? "r79-mobile-feature-card--pit"
                        : "";
            const featureClass = [
              "r79-mobile-feature-card",
              isActive ? "r79-mobile-feature-card--active" : "",
              accentClass,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={featureClass}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="r79-mobile-feature-card__icon r79-holo-object r79-icon-shell r79-icon-shell--feature" aria-hidden="true">
                  <span className="r79-holo-object__ring" />
                  <R79Icon
                    name={iconMeta.name}
                    accent={iconMeta.accent}
                    size={62}
                    withBase
                  />
                </span>
                <span className="r79-mobile-feature-card__label">
                  {item.shortLabel}
                </span>
                {item.secondaryLabel ? (
                  <span className="r79-mobile-feature-card__sub">
                    {item.secondaryLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="r79-mobile-more-wrap">
          <button
            type="button"
            className={
              moreOpen
                ? "r79-mobile-more-btn r79-mobile-more-btn--active"
                : "r79-mobile-more-btn"
            }
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => onMoreOpenChange(!moreOpen)}
          >
            <span className="r79-mobile-more-btn__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>More</span>
          </button>
        </div>

        <div className="r79-mobile-game-panel">
          <span className="r79-mobile-game-panel__label">Game</span>
          <div className="r79-mobile-game-panel__pills">
            {gameOptions.map((version) => {
              const entry = GAME_CATALOG[version];
              const isActive = gameVersion === version;
              return (
                <button
                  key={version}
                  type="button"
                  onClick={() => setGameVersion(version)}
                  className={
                    isActive
                      ? "r79-mobile-game-pill r79-mobile-game-pill--active"
                      : "r79-mobile-game-pill"
                  }
                >
                  {entry.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

