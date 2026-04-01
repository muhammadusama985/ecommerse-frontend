import { Link } from "react-router-dom";
import { removeWishlistItem } from "../api/users";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function WishlistPage() {
  const { t } = useLanguage();
  const { accessToken, wishlist, isAuthenticated, setWishlist } = useShop();
  const { notify } = useNotifications();

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
    try {
      const nextWishlist = await removeWishlistItem(accessToken, productId);
      setWishlist(nextWishlist);
      notify({ type: "success", message: "Item removed from wishlist." });
    } catch (error) {
      notify({ type: "error", message: error.message || "Could not update wishlist." });
    }
  };

  return (
    <section className="page-stack">
      <div className="content-page content-page--hero wishlist-page-hero">
        <span className="section-eyebrow">{t("wishlist")}</span>
        <h1>{t("savedBeautyPicks")}</h1>
        <p>{t("productsBookmarked")}</p>
      </div>

      {!wishlist.length ? (
        <div className="empty-panel">
          <p>{t("wishlistEmpty")}</p>
          <Link to="/best-sellers" className="solid-button empty-panel__button">
            {t("exploreProducts")}
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div key={product._id} className="wishlist-tile">
              <ProductCard product={product} />
              <button type="button" className="ghost-button wishlist-remove" onClick={() => handleRemove(product._id)}>
                {t("remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export { WishlistPage };
