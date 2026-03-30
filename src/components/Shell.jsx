import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function Shell({ children }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const languageMenuRef = useRef(null);
  const { setLanguage, t, getLanguageLabel } = useLanguage();
  const { notify } = useNotifications();
  const { cart, isAuthenticated, clearSession } = useShop();
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(`/products?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    clearSession();
    setLogoutConfirmOpen(false);
    setMenuOpen(false);
    notify({ type: "success", message: t("loggedOutSuccess") });
    navigate("/");
  };

  return (
    <div className="site-shell">
      <div className="promo-bar">{t("promoBar")}</div>
      <header className="site-header">
        <Link to="/" className="brand-mark">
          <span className="brand-badge">NR</span>
          <span className="brand-copy">
            <strong>Nature Republic</strong>
            <small>{t("beautyEssentials")}</small>
          </span>
        </Link>

        <nav className="main-nav">
          <NavLink to="/">{t("home")}</NavLink>
          <NavLink to="/products">{t("allProducts")}</NavLink>
          <NavLink to="/best-sellers">{t("bestSellers")}</NavLink>
        </nav>

        <div className="header-actions">
          <form className="header-search" onSubmit={handleSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchProducts")} />
          </form>

          <div className="account-menu" ref={languageMenuRef}>
            <button
              className="icon-button"
              type="button"
              onClick={() => setLanguageMenuOpen((current) => !current)}
              aria-label={t("openLanguageMenu")}
            >
              <span aria-hidden="true">O</span>
            </button>
            {languageMenuOpen ? (
              <div className="account-dropdown">
                <button type="button" onClick={() => { setLanguage("en"); setLanguageMenuOpen(false); }}>
                  {getLanguageLabel("en")}
                </button>
                <button type="button" onClick={() => { setLanguage("ar"); setLanguageMenuOpen(false); }}>
                  {getLanguageLabel("ar")}
                </button>
              </div>
            ) : null}
          </div>

          {!isAuthenticated ? <Link className="ghost-button" to="/login">{t("login")}</Link> : null}

          <Link className="solid-button" to="/cart">
            {t("cart")} {cartCount ? `(${cartCount})` : ""}
          </Link>

          {isAuthenticated ? (
            <div className="account-menu" ref={menuRef}>
              <button
                className="icon-button"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                aria-label={t("openAccountMenu")}
              >
                <span aria-hidden="true">=</span>
              </button>
              {menuOpen ? (
                <div className="account-dropdown">
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>{t("profile")}</Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)}>{t("wishlist")}</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)}>{t("orders")}</Link>
                  <button type="button" onClick={() => { setMenuOpen(false); setLogoutConfirmOpen(true); }}>{t("logout")}</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-brand">
          <strong>Nature Republic</strong>
          <p>{t("footerBlurb")}</p>
        </div>
        <div>
          <strong>{t("shop")}</strong>
          <div className="footer-links">
            <Link to="/products">{t("allProducts")}</Link>
            <Link to="/best-sellers">{t("bestSellers")}</Link>
            <Link to="/wishlist">{t("wishlist")}</Link>
            <Link to="/orders">{t("orders")}</Link>
          </div>
        </div>
        <div>
          <strong>{t("company")}</strong>
          <div className="footer-links">
            <Link to="/blog">{t("blog")}</Link>
            <Link to="/pages/about">{t("about")}</Link>
            <Link to="/pages/contact">{t("contact")}</Link>
          </div>
        </div>
        <div>
          <strong>{t("support")}</strong>
          <div className="footer-links">
            <Link to="/profile">{t("myAccount")}</Link>
            <Link to="/cart">{t("cart")}</Link>
            <Link to="/checkout">{t("checkout")}</Link>
          </div>
        </div>
      </footer>

      {logoutConfirmOpen ? (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <span className="section-eyebrow">{t("confirmAction")}</span>
            <h3>{t("logoutConfirmTitle")}</h3>
            <p>{t("logoutConfirmCopy")}</p>
            <div className="confirm-modal__actions">
              <button type="button" className="ghost-button" onClick={() => setLogoutConfirmOpen(false)}>
                {t("cancel")}
              </button>
              <button type="button" className="solid-button" onClick={handleLogout}>
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { Shell };
