import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

function AdminShell({ children }) {
  const { t, setLanguage, getLanguageLabel } = useLanguage();
  const { user, logout } = useAdmin();
  const { confirm } = useAdminNotifications();
  const location = useLocation();
  const languageMenuRef = useRef(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titleMap = {
    "/admin": t("dashboard"),
    "/admin/products": t("products"),
    "/admin/orders": t("orders"),
    "/admin/revenue": t("revenue"),
    "/admin/categories": t("categories"),
    "/admin/coupons": t("coupons"),
    "/admin/blog": t("blog"),
    "/admin/banners": t("banners"),
    "/admin/users": t("users"),
    "/admin/reviews": t("reviews"),
  };

  const currentTitle = titleMap[location.pathname] || t("dashboard");
  const navItems = [
    { to: "/admin", label: t("dashboard"), icon: "chart", end: true },
    { to: "/admin/users", label: t("users"), icon: "user" },
    { to: "/admin/products", label: t("products"), icon: "grid" },
    { to: "/admin/orders", label: t("orders"), icon: "package" },
    { to: "/admin/revenue", label: t("revenue"), icon: "chart" },
    { to: "/admin/categories", label: t("categories"), icon: "tag" },
    { to: "/admin/coupons", label: t("coupons"), icon: "tag" },
    { to: "/admin/blog", label: t("blog"), icon: "fileText" },
    { to: "/admin/banners", label: t("banners"), icon: "image" },
    { to: "/admin/reviews", label: t("reviews"), icon: "message" },
  ];

  return (
    <div className="admin-shell">
      <header className="admin-navbar">
        <div className="admin-navbar__inner">
          <div className="admin-brand">
            <img src="/logo.png" alt="Konjo" className="admin-brand__logo" />
            <div className="admin-brand__copy">
              <strong>Konjo</strong>
              <small>{t("adminDashboard")}</small>
            </div>
          </div>

          <div className="admin-navbar__actions">
            <div className="admin-navbar__user">
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>{currentTitle}</small>
            </div>

            <div className="admin-account-menu" ref={languageMenuRef}>
              <button
                type="button"
                className="admin-icon-button"
                onClick={() => setLanguageMenuOpen((current) => !current)}
                aria-label={t("openLanguageMenu")}
              >
                <Icon name="globe" className="admin-ui-icon" />
              </button>
              {languageMenuOpen ? (
                <div className="admin-account-dropdown">
                  <button type="button" onClick={() => { setLanguage("en"); setLanguageMenuOpen(false); }}>
                    {getLanguageLabel("en")}
                  </button>
                  <button type="button" onClick={() => { setLanguage("ar"); setLanguageMenuOpen(false); }}>
                    {getLanguageLabel("ar")}
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--with-icon"
              onClick={async () => {
                const accepted = await confirm({
                  title: t("logout"),
                  message: t("logoutAdminConfirm"),
                  confirmLabel: t("logout"),
                  cancelLabel: t("stayHere"),
                });

                if (accepted) {
                  logout();
                }
              }}
            >
              <Icon name="logout" className="admin-button__icon" />
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                <Icon name={item.icon} className="admin-nav__icon" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="admin-main">
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

export { AdminShell };
