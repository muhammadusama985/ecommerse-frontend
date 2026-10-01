import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { removeWishlistItem } from "../api/users";
import { LoadingState } from "../components/LoadingState";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";
import { pickLocalizedItems, translateWishlist } from "../lib/contentTranslation";

function WishlistPage() {
  const { t, language } = useLanguage();
  const { accessToken, wishlist, isAuthenticated, isSessionLoading, setWishlist } = useShop();
  const { notify } = useNotifications();
  const [busyProductId, setBusyProductId] = useState("");
  const [localizedWishlist, setLocalizedWishlist] = useState([]);

  // Saved product names follow the site language so the grid switches with it.
  useEffect(() => {
    let isCancelled = false;
    const source = wishlist || [];

    if (language === "en") {
      setLocalizedWishlist(source);
      return () => {
        isCancelled = true;
      };
    }

    translateWishlist(language, source).then((products) => {
      if (!isCancelled) setLocalizedWishlist(products);
    });

    return () => {
      isCancelled = true;
    };
  }, [language, wishlist]);

  if (!isAuthenticated) {
    return (
      <section className="empty-panel">
        <h1>{t("loginRequired")}</h1>
        <p>{t("productsBookmarked")}</p>
        <Link to="/login" className="solid-button">
          {t("goToLogin")}
        </Link>
      </section>
    );
  }

  const handleRemove = async (productId) => {
    if (busyProductId) {
      return;
    }

    setBusyProductId(productId);

    try {
      const nextWishlist = await removeWishlistItem(accessToken, productId);
      setWishlist(nextWishlist);
      notify({ type: "success", message: "Item removed from wishlist." });
    } catch (error) {
      notify({ type: "error", message: error.message || "Could not update wishlist." });
    } finally {
      setBusyProductId("");
    }
  };

  return (
    <section className="page-stack">
      <div className="content-page content-page--hero wishlist-page-hero">
        <span className="section-eyebrow">{t("wishlist")}</span>
        <h1>{t("savedBeautyPicks")}</h1>
        <p>{t("productsBookmarked")}</p>
      </div>

      {isSessionLoading ? (
        <LoadingState variant="skeleton" label={t("loadingWishlist")} count={4} />
      ) : !wishlist.length ? (
        <div className="empty-panel">
          <p>{t("wishlistEmpty")}</p>
          <Link to="/best-sellers" className="solid-button empty-panel__button">
            {t("exploreProducts")}
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {pickLocalizedItems(localizedWishlist, wishlist).map((product) => (
            <div key={product._id} className="wishlist-tile">
              <ProductCard product={product} />
              <button
                type="button"
                className="ghost-button wishlist-remove"
                onClick={() => handleRemove(product._id)}
                disabled={Boolean(busyProductId)}
                aria-busy={busyProductId === product._id}
              >
                {busyProductId === product._id ? "Removing..." : t("remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export { WishlistPage };
