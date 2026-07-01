import { useEffect, useRef, useState } from "react";
import { GAME_CATALOG } from "../../data/gameVersions.js";
import {
  getSecondaryNavIcon,
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
 */
export default function R79AppNav({
  page,
  setPage,
  gameVersion,
  setGameVersion,
  gameOptions,
  allPages,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const primaryIds = new Set(PRIMARY_NAV_ITEMS.map((item) => item.id));
  const secondaryPages = allPages.filter((item) => !primaryIds.has(item.id));
  const moreIsActive = secondaryPages.some((item) => item.id === page);

  useEffect(() => {
    if (!moreOpen) {
      return undefined;
    }

    const handlePointer = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
    };
  }, [moreOpen]);

  const navigate = (id) => {
    setPage(id);
    setMoreOpen(false);
  };

  return (
    <div className="r79-app-nav-shell">
      <nav className="r79-app-nav" aria-label="Primary navigation">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={
                isActive
                  ? "r79-nav-pill r79-nav-pill--active r79-nav-card"
                  : "r79-nav-pill r79-nav-card"
              }
            >
              <span className="r79-nav-card__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="r79-nav-card__label r79-nav-card__label--desktop">
                {item.label}
              </span>
              <span className="r79-nav-card__label r79-nav-card__label--mobile">
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        <div className="r79-nav-more" ref={moreRef}>
          <button
            type="button"
            className={
              moreIsActive || moreOpen
                ? "r79-nav-pill r79-nav-pill--active r79-nav-more__trigger r79-nav-card"
                : "r79-nav-pill r79-nav-more__trigger r79-nav-card"
            }
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((open) => !open)}
          >
            <span className="r79-nav-card__icon" aria-hidden="true">
              ☰
            </span>
            <span className="r79-nav-card__label r79-nav-card__label--desktop">
              More
            </span>
            <span className="r79-nav-card__label r79-nav-card__label--mobile">
              More
            </span>
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
                    <span className="r79-nav-more__icon" aria-hidden="true">
                      {getSecondaryNavIcon(item.id)}
                    </span>
                    <span className="r79-nav-more__text">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="r79-app-game-selector">
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
    </div>
  );
}
