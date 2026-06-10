import { useEffect, useRef, useState } from "react";
import { GAME_CATALOG } from "../../data/gameVersions.js";

const PRIMARY_NAV = [
  { id: "todays-race", label: "Today's Race", mobileLabel: "Today" },
  { id: "ai-engineer", label: "AI Race Engineer", mobileLabel: "AI Engineer" },
  { id: "wheel-settings", label: "Wheel Settings", mobileLabel: "Wheels" },
  { id: "advisor", label: "Championship Advisor", mobileLabel: "Champ" },
];

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

  const primaryIds = new Set(PRIMARY_NAV.map((item) => item.id));
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
        {PRIMARY_NAV.map((item) => {
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
              <span className="r79-nav-pill__full">{item.label}</span>
              <span className="r79-nav-pill__short">{item.mobileLabel}</span>
            </button>
          );
        })}

        <div className="r79-nav-more" ref={moreRef}>
          <button
            type="button"
            className={
              moreIsActive || moreOpen
                ? "r79-nav-pill r79-nav-pill--active r79-nav-more__trigger"
                : "r79-nav-pill r79-nav-more__trigger"
            }
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((open) => !open)}
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
