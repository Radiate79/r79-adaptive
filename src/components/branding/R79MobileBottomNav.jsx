import { MOBILE_BOTTOM_NAV_ITEMS, MOBILE_MORE_PINNED_ITEMS } from "../../data/appNavMeta.js";

/**
 * @param {Object} props
 * @param {string} props.page
 * @param {(id: string) => void} props.setPage
 * @param {() => void} props.onOpenMenu
 * @param {boolean} [props.moreOpen]
 */
export default function R79MobileBottomNav({
  page,
  setPage,
  onOpenMenu,
  moreOpen = false,
}) {
  const handleNav = (item) => {
    if (item.pageId === "more") {
      onOpenMenu();
      return;
    }

    setPage(item.pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isMoreRoute = (pageId) => {
    if (pageId === "settings") {
      return true;
    }

    if (MOBILE_MORE_PINNED_ITEMS.some((item) => item.pageId === pageId)) {
      return true;
    }

    return !MOBILE_BOTTOM_NAV_ITEMS.some(
      (item) => item.pageId !== "more" && item.pageId === pageId,
    );
  };

  const isActive = (item) => {
    if (item.pageId === "more") {
      return moreOpen || isMoreRoute(page);
    }

    return page === item.pageId;
  };

  return (
    <nav className="r79-mobile-bottom-nav" aria-label="Mobile bottom navigation">
      {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.id}
            type="button"
            className={
              active
                ? "r79-mobile-bottom-nav__item r79-mobile-bottom-nav__item--active"
                : "r79-mobile-bottom-nav__item"
            }
            onClick={() => handleNav(item)}
            aria-current={active && item.pageId !== "more" ? "page" : undefined}
          >
            <span className="r79-mobile-bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="r79-mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
