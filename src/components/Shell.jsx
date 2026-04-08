import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChatbotWidget } from "./ChatbotWidget";
import { Icon } from "./Icon";
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
    setMenuOpen(false);
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
      <header className="site-header">
        <Link to="/" className="brand-mark">
          <img src="/logo.png" alt="Nature Republic" className="brand-logo" />
          <span className="brand-copy">
            <strong>Nature Republic</strong>
            <small>{t("beautyEssentials")}</small>
          </span>
        </Link>

        <nav className="main-nav">
          <NavLink to="/"><Icon name="home" className="nav-icon" />{t("home")}</NavLink>
          <Link to="/#categories"><Icon name="grid" className="nav-icon" />{t("categories")}</Link>
          <NavLink to="/products"><Icon name="grid" className="nav-icon" />{t("allProducts")}</NavLink>
          <NavLink to="/best-sellers"><Icon name="star" className="nav-icon" />{t("bestSellers")}</NavLink>
        </nav>

        <div className="header-actions">
          <form className="header-search header-search--desktop" onSubmit={handleSearch}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchProducts")} />
          </form>

          <div className="account-menu account-menu--language" ref={languageMenuRef}>
            <button
              className="icon-button"
              type="button"
              onClick={() => setLanguageMenuOpen((current) => !current)}
              aria-label={t("openLanguageMenu")}
            >
              <Icon name="globe" className="ui-icon" />
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

          {!isAuthenticated ? <Link className="ghost-button ghost-button--with-icon header-login-button" to="/login"><Icon name="user" className="button-icon" />{t("login")}</Link> : null}

          <Link className="solid-button solid-button--with-icon header-cart-button" to="/cart">
            <Icon name="cart" className="button-icon" />
            {t("cart")} {cartCount ? `(${cartCount})` : ""}
          </Link>

          <div className={`account-menu account-menu--hamburger${isAuthenticated ? " account-menu--desktop" : ""}`} ref={menuRef}>
            <button
              className="icon-button"
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={t("openAccountMenu")}
            >
              <Icon name="menu" className="ui-icon" />
            </button>
            {menuOpen ? (
              <div className="account-dropdown account-dropdown--menu">
                <form className="header-search header-search--menu" onSubmit={handleSearch}>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchProducts")} />
                </form>
                <div className="account-dropdown__section account-dropdown__section--mobile-language">
                  <button type="button" onClick={() => { setLanguage("en"); setMenuOpen(false); }}>
                    {getLanguageLabel("en")}
                  </button>
                  <button type="button" onClick={() => { setLanguage("ar"); setMenuOpen(false); }}>
                    {getLanguageLabel("ar")}
                  </button>
                </div>
                <Link to="/#categories" onClick={() => setMenuOpen(false)}>
                  <Icon name="grid" className="dropdown-icon" />
                  {t("categories")}
                </Link>
                {!isAuthenticated ? (
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Icon name="user" className="dropdown-icon" />
                    {t("login")}
                  </Link>
                ) : (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}><Icon name="user" className="dropdown-icon" />{t("profile")}</Link>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)}><Icon name="heart" className="dropdown-icon" />{t("wishlist")}</Link>
                    <Link to="/orders" onClick={() => setMenuOpen(false)}><Icon name="package" className="dropdown-icon" />{t("orders")}</Link>
                    <button type="button" onClick={() => { setMenuOpen(false); setLogoutConfirmOpen(true); }}><Icon name="logout" className="dropdown-icon" />{t("logout")}</button>
                  </>
                )}
              </div>
            ) : null}
          </div>
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

      <ChatbotWidget />
    </div>
  );
}

export { Shell };
