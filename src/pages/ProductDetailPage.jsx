import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { addCartItem } from "../api/cart";
import { createReview, getProductDetail, listProducts } from "../api/products";
import { addWishlistItem, removeWishlistItem } from "../api/users";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";
import { translateProductCollection, translateProductDetailPayload } from "../lib/contentTranslation";

function ProductDetailPage() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, setCart, wishlist, setWishlist } = useShop();
  const { notify } = useNotifications();
  const [data, setData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", title: "" });

  useEffect(() => {
    let mounted = true;
    getProductDetail(slug)
      .then(async (result) => {
        if (!mounted) return;
        setData(await translateProductDetailPayload(language, result));
        setStatus("success");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, [slug, language]);

  useEffect(() => {
    if (!data?.product?.categoryId?._id) return;
    listProducts({ categoryId: data.product.categoryId._id, sortBy: "bestSelling" })
      .then(async (products) => {
        const translatedProducts = await translateProductCollection(language, products);
        setRelatedProducts(translatedProducts.filter((item) => item._id !== data.product._id).slice(0, 4));
      })
      .catch(() => setRelatedProducts([]));
  }, [data?.product?._id, data?.product?.categoryId?._id, language]);

  if (status === "loading") return <LoadingState label={t("loadingProduct")} />;
  if (status === "error") return <ErrorState message={t("productLoadError")} />;

  const { product, reviews } = data;
  const image = product.images?.[0];
  const isWishlisted = wishlist.some((item) => item._id === product._id);
  const rating = Math.max(1, Math.round(product.averageRating || 4));
  const stockCount = Number(product.stock || 0);
  const isOutOfStock = stockCount <= 0;
  const totalPrice = Number(product.price || 0) * quantity;

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      const stockMessage = t("productOutOfStockNow");
      setMessage(stockMessage);
      notify({ type: "error", message: stockMessage });
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const cart = await addCartItem(accessToken, { productId: product._id, quantity });
      setCart(cart);
      setMessage(t("addedToCartSuccess"));
      notify({ type: "success", message: t("addedToCartSuccess") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotAddToCart") });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const nextWishlist = isWishlisted
        ? await removeWishlistItem(accessToken, product._id)
        : await addWishlistItem(accessToken, product._id);
      setWishlist(nextWishlist);
      setMessage(isWishlisted ? t("removedFromWishlist") : t("addedToWishlist"));
      notify({ type: "success", message: isWishlisted ? t("removedFromWishlist") : t("addedToWishlist") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotUpdateWishlist") });
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      await createReview(accessToken, {
        productId: product._id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      const refreshed = await getProductDetail(slug);
      setData(await translateProductDetailPayload(language, refreshed));
      setReviewForm({ rating: 5, comment: "", title: "" });
      setMessage(t("reviewSubmittedSuccess"));
      notify({ type: "success", message: t("reviewSubmittedSuccess") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotSubmitReview") });
    }
  };

  return (
    <div className="page-stack">
      <section className="detail-panel detail-panel--refined">
        <div className="detail-media">
          {image ? (
            <img src={mediaUrl(image)} alt={product.name} className="detail-image" />
          ) : (
            <div className="detail-image detail-image--placeholder">{product.name}</div>
          )}
        </div>
        <div className="detail-copy">
          <span className="crumbs">
            <Link to="/">{t("homeProductsBreadcrumb")}</Link> / <Link to="/products">{t("productsBreadcrumb")}</Link> / {product.name}
          </span>
          <span className="product-category">{product.categoryId?.name || t("beautyFallback")}</span>
          <h1>{product.name}</h1>
          <div className="product-meta product-meta--detail">
            <span>{"★".repeat(rating)}</span>
            <small>{t("reviewsCountLabel", { count: product.reviewCount || 0 })}</small>
          </div>
          <div className="detail-price-stack">
            <strong className="detail-price">AED {Number(product.price).toFixed(2)}</strong>
            <span className="detail-total-price">{t("totalForQuantity", { quantity, total: totalPrice.toFixed(2) })}</span>
          </div>
          <p className={`stock-note ${isOutOfStock ? "stock-note--danger" : ""}`}>
            {isOutOfStock ? t("outOfStockLabel") : t("availableCount", { count: stockCount })}
          </p>
          <p>{product.description || product.shortDescription}</p>
          <div className="detail-actions">
            <div className="qty-picker">
              <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(stockCount || 1, current + 1))}
                disabled={isOutOfStock || quantity >= stockCount}
              >
                +
              </button>
            </div>
            <button type="button" className="solid-button" onClick={handleAddToCart} disabled={isOutOfStock}>
              {isOutOfStock ? t("outOfStockCta") : t("addToCart")}
            </button>
            <button type="button" className="ghost-button" onClick={handleWishlist}>
              {isWishlisted ? t("saved") : t("wishlistAction")}
            </button>
          </div>
          {message ? <p className="feedback-note">{message}</p> : null}
          <div className="trust-grid">
            <div>{t("fastDispatch")}</div>
            <div>{t("securePayment")}</div>
            <div>{t("qualityAssured")}</div>
          </div>
        </div>
      </section>
      <section className="detail-tabs">
        <div className="tab-card">
          <h2>{t("description")}</h2>
          <p>{product.description || t("premiumProductFallback")}</p>
        </div>
        <div className="tab-card">
          <h2>{t("reviewsCountHeading", { count: reviews.length })}</h2>
          {reviews.length ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <article key={review._id} className="review-card">
                  <strong>
                    {review.userId?.firstName} {review.userId?.lastName}
                  </strong>
                  <span>{"★".repeat(review.rating)}</span>
                  {review.title ? <h3>{review.title}</h3> : null}
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <p>{t("noReviewsYet")}</p>
          )}
          {isAuthenticated ? (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h3>{t("writeAReview")}</h3>
              <input
                placeholder={t("reviewTitlePlaceholder")}
                value={reviewForm.title}
                onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })}
              />
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
              >
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
              <textarea
                placeholder={t("shareYourExperience")}
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
              />
              <button type="submit" className="solid-button">
                {t("submitReview")}
              </button>
            </form>
          ) : null}
        </div>
      </section>
      <section className="content-section">
        <div className="section-header section-header--left">
          <span className="section-eyebrow">{t("relatedProducts")}</span>
          <h2>{t("youMayAlsoLike")}</h2>
        </div>
        <div className="product-grid">
          {relatedProducts.map((item) => (
            <ProductCard key={item._id} product={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

export { ProductDetailPage };
