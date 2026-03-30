import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

function ProductCard({ product, compact = false }) {
  const { t } = useLanguage();
  const image = product.images?.[0];
  const rating = Math.max(1, Math.round(product.averageRating || 4));
  const isOutOfStock = Number(product.stock || 0) <= 0;

  return (
    <article className={`product-card ${compact ? "product-card--compact" : ""}`}>
      <div className="product-image-wrap">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        {isOutOfStock ? <span className="product-stock-badge">{t("outOfStockLabel")}</span> : null}
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
