import { useEffect, useRef } from "react";
import { GAME_CATALOG } from "../../data/gameVersions.js";
import {
  getPrimaryNavItem,
  getSecondaryNavIcon,
  MOBILE_FEATURE_CARD_ORDER,
  PRIMARY_NAV_ITEMS,
} from "../../data/appNavMeta.js";

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
  const mobileMoreRef = useRef(null);

  const primaryIds = new Set(PRIMARY_NAV_ITEMS.map((item) => item.id));
  const secondaryPages = allPages.filter((item) => !primaryIds.has(item.id));
  const moreIsActive = secondaryPages.some((item) => item.id === page);

  const mobileFeatureCards = MOBILE_FEATURE_CARD_ORDER.map((id) =>
    getPrimaryNavItem(id),
  ).filter(Boolean);

  useEffect(() => {
    if (!moreOpen) {
      return undefined;
    }

    const handlePointer = (event) => {
      const inDesktop = desktopMoreRef.current?.contains(event.target);
      const inMobile = mobileMoreRef.current?.contains(event.target);
      if (!inDesktop && !inMobile) {
        onMoreOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
    };
  }, [moreOpen, onMoreOpenChange]);

  const navigate = (id) => {
    setPage(id);
    onMoreOpenChange(false);
  };

  return (
    <div className="r79-app-nav-shell">
      {/* Desktop navigation — unchanged */}
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
              moreIsActive || moreOpen
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

      {/* Mobile approved layout: nav → More → game → content */}
      <div className="r79-mobile-chrome">
        <div className="r79-mobile-feature-cards" role="navigation" aria-label="Features">
          {mobileFeatureCards.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={
                  isActive
                    ? "r79-mobile-feature-card r79-mobile-feature-card--active"
                    : "r79-mobile-feature-card"
                }
                aria-current={isActive ? "page" : undefined}
              >
                <span className="r79-mobile-feature-card__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="r79-mobile-feature-card__label">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="r79-mobile-more-wrap" ref={mobileMoreRef}>
          <button
            type="button"
            className={
              moreIsActive || moreOpen
                ? "r79-mobile-more-btn r79-mobile-more-btn--active"
                : "r79-mobile-more-btn"
            }
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => onMoreOpenChange(!moreOpen)}
          >
            <span className="r79-mobile-more-btn__icon" aria-hidden="true">
              ☰
            </span>
            <span>More</span>
          </button>

          {moreOpen ? (
            <div className="r79-mobile-menu-sheet" role="menu">
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
                        ? "r79-mobile-menu-sheet__item r79-mobile-menu-sheet__item--active"
                        : "r79-mobile-menu-sheet__item"
                    }
                  >
                    <span className="r79-mobile-menu-sheet__icon" aria-hidden="true">
                      {getSecondaryNavIcon(item.id)}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
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
