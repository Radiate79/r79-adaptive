import { useEffect, useRef } from "react";
import {
  getMobileMoreSecondaryItems,
  getSecondaryNavIcon,
  MOBILE_MORE_PINNED_ITEMS,
} from "../../data/appNavMeta.js";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.page
 * @param {(id: string) => void} props.setPage
 * @param {(view: string | null) => void} props.setSettingsBootView
 * @param {{ id: string, label: string }[]} props.allPages
 */
export default function R79MobileMoreMenu({
  open,
  onClose,
  page,
  setPage,
  setSettingsBootView,
  allPages,
}) {
  const panelRef = useRef(null);
  const secondaryItems = getMobileMoreSecondaryItems(allPages);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointer = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointer);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointer);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handlePinned = (item) => {
    if (item.action === "page") {
      setPage(item.pageId);
      onClose();
      return;
    }

    if (item.action === "settings") {
      setSettingsBootView(item.settingsView);
      setPage("settings");
      onClose();
    }
  };

  const handlePage = (pageId) => {
    setPage(pageId);
    onClose();
  };

  const isPinnedActive = (item) => {
    if (item.action === "page") {
      return page === item.pageId;
    }

    if (item.action === "settings") {
      return page === "settings";
    }

    return false;
  };

  return (
    <div className="r79-mobile-more-root" role="presentation">
      <button
        type="button"
        className="r79-mobile-more-root__backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="r79-mobile-more-panel"
        role="menu"
        aria-label="More features"
      >
        <div className="r79-mobile-more-panel__header">
          <span className="r79-mobile-more-panel__title">More</span>
          <button
            type="button"
            className="r79-mobile-more-panel__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="r79-mobile-more-panel__body">
          {MOBILE_MORE_PINNED_ITEMS.map((item) => {
            const active = isPinnedActive(item);
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={
                  active
                    ? "r79-mobile-more-panel__item r79-mobile-more-panel__item--active"
                    : "r79-mobile-more-panel__item"
                }
                onClick={() => handlePinned(item)}
              >
                <span className="r79-mobile-more-panel__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="r79-mobile-more-panel__label">{item.label}</span>
              </button>
            );
          })}

          {secondaryItems.length > 0 ? (
            <>
              <div className="r79-mobile-more-panel__divider" role="separator">
                More features
              </div>

              {secondaryItems.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={
                      active
                        ? "r79-mobile-more-panel__item r79-mobile-more-panel__item--active"
                        : "r79-mobile-more-panel__item"
                    }
                    onClick={() => handlePage(item.id)}
                  >
                    <span className="r79-mobile-more-panel__icon" aria-hidden="true">
                      {getSecondaryNavIcon(item.id)}
                    </span>
                    <span className="r79-mobile-more-panel__label">{item.label}</span>
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
