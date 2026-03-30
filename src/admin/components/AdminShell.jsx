import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

  return (
    <div className="admin-shell">
      <header className="admin-navbar">
        <div className="admin-navbar__inner">
          <div className="admin-brand">
            <span className="admin-badge">NR</span>
            <div className="admin-brand__copy">
              <strong>Nature Republic</strong>
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
                <span aria-hidden="true">O</span>
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
              className="admin-button admin-button--ghost"
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
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <NavLink to="/admin" end>{t("dashboard")}</NavLink>
            <NavLink to="/admin/users">{t("users")}</NavLink>
            <NavLink to="/admin/products">{t("products")}</NavLink>
            <NavLink to="/admin/orders">{t("orders")}</NavLink>
            <NavLink to="/admin/revenue">{t("revenue")}</NavLink>
            <NavLink to="/admin/categories">{t("categories")}</NavLink>
            <NavLink to="/admin/coupons">{t("coupons")}</NavLink>
            <NavLink to="/admin/blog">{t("blog")}</NavLink>
            <NavLink to="/admin/banners">{t("banners")}</NavLink>
            <NavLink to="/admin/reviews">{t("reviews")}</NavLink>
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
