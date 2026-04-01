import { Link, useNavigate } from "react-router-dom";
import { addCartItem } from "../api/cart";
import { mediaUrl } from "../api/client";
import { Icon } from "./Icon";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function ProductCard({ product, compact = false, allowQuickAdd = false }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { accessToken, isAuthenticated, setCart } = useShop();
  const image = product.images?.[0];
  const rating = Math.max(1, Math.round(product.averageRating || 4));
  const isOutOfStock = Number(product.stock || 0) <= 0;

  const handleQuickAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfStock) {
      notify({ type: "error", message: t("productOutOfStockNow") });
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const cart = await addCartItem(accessToken, { productId: product._id, quantity: 1 });
      setCart(cart);
      notify({ type: "success", message: t("addedToCartSuccess") });
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotAddToCart") });
    }
  };

  return (
    <article className={`product-card ${compact ? "product-card--compact" : ""}`}>
      <div className="product-image-wrap">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        {isOutOfStock ? <span className="product-stock-badge">{t("outOfStockLabel")}</span> : null}
        {allowQuickAdd && isAuthenticated && !isOutOfStock ? (
          <button
            type="button"
            className="product-quick-add"
            onClick={handleQuickAdd}
            aria-label={t("addToCart")}
            title={t("addToCart")}
          >
            <Icon name="cart" className="product-quick-add__icon" />
          </button>
        ) : null}
        {image ? (
          <img src={mediaUrl(image)} alt={product.name} className="product-image" />
        ) : (
          <div className="product-image product-image--placeholder">{product.name}</div>
        )}
      </div>

      <div className="product-body">
        <span className="product-category">{product.categoryId?.name || t("beautyFallback")}</span>
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="product-meta">
          <span>{"★".repeat(rating)}</span>
          <small>({product.reviewCount || 0})</small>
        </div>
        <div className="product-footer">
          <strong>AED {Number(product.price).toFixed(2)}</strong>
          <small>{isOutOfStock ? t("unavailable") : t("soldCount", { count: product.soldCount || 0 })}</small>
        </div>
      </div>
    </article>
  );
}

export { ProductCard };
