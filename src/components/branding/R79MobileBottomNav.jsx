import { MOBILE_BOTTOM_NAV_ITEMS } from "../../data/appNavMeta.js";

/**
 * @param {Object} props
 * @param {string} props.page
 * @param {(id: string) => void} props.setPage
 * @param {() => void} props.onOpenMenu
 */
export default function R79MobileBottomNav({ page, setPage, onOpenMenu }) {
  const handleNav = (item) => {
    if (item.pageId === "menu") {
      onOpenMenu();
      return;
    }

    setPage(item.pageId);

    if (item.id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (item) => {
    if (item.pageId === "menu") {
      return false;
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
            aria-current={active ? "page" : undefined}
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
