import { useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { applyCoupon, clearCart, removeCartItem, removeCoupon, updateCartItem } from "../api/cart";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function CartPage() {
  const { t } = useLanguage();
  const { accessToken, cart, isAuthenticated, setCart } = useShop();
  const { notify } = useNotifications();
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");

  if (!isAuthenticated) {
    return (
      <section className="empty-panel">
        <h1>{t("loginRequired")}</h1>
        <p>{t("viewCartLogin")}</p>
        <Link to="/login" className="solid-button">{t("goToLogin")}</Link>
      </section>
    );
  }

  const items = cart?.items || [];
  const hasOutOfStockItems = items.some((item) => Number(item.productId?.stock || 0) <= 0);

  const handleQuantity = async (itemId, quantity) => {
    try {
      const updatedCart = await updateCartItem(accessToken, itemId, { quantity });
      setCart(updatedCart);
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotUpdateCartQuantity") });
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const updatedCart = await removeCartItem(accessToken, itemId);
      setCart(updatedCart);
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotRemoveCartItem") });
    }
  };

  const handleApplyCoupon = async () => {
    try {
      const updatedCart = await applyCoupon(accessToken, { code: couponCode, subtotal: Number(cart?.subtotal || 0) });
      setCart(updatedCart);
      setMessage(t("couponAppliedSuccess"));
      notify({ type: "success", message: t("couponAppliedSuccess") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couponApplyError") });
    }
  };

  const handleClearCart = async () => {
    try {
      const updatedCart = await clearCart(accessToken);
      setCart(updatedCart);
      setMessage(t("cartClearedSuccess"));
      notify({ type: "success", message: t("cartClearedSuccess") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("cartClearError") });
    }
  };

  return (
    <section className="cart-panel cart-panel--compact">
      <div className="section-header section-header--left">
        <span className="section-eyebrow">{t("shoppingCart")}</span>
        <h1>{t("yourSavedItems")}</h1>
        <p>{t("cartReviewCopy")}</p>
      </div>

      {!items.length ? (
        <div className="empty-panel">
          <p>{t("cartEmpty")}</p>
          <Link to="/best-sellers" className="solid-button">{t("exploreProducts")}</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            <div className="cart-list__actions">
              <Link to="/products" className="ghost-button cart-toolbar-button">{t("continueShopping")}</Link>
              <button type="button" className="ghost-button cart-toolbar-button" onClick={handleClearCart}>{t("clearCart")}</button>
            </div>

            {items.map((item) => (
              <article key={item._id} className={`cart-item cart-item--refined ${Number(item.productId?.stock || 0) <= 0 ? "cart-item--danger" : ""}`}>
                <div className="cart-item__media">
                  {item.productId?.images?.[0] ? (
                    <img src={mediaUrl(item.productId.images[0])} alt={item.productId.name} />
                  ) : (
                    <div className="product-image--placeholder">{item.productId?.name || t("product")}</div>
                  )}
                </div>

                <div className="cart-item__copy">
                  <h3>{item.productId?.name}</h3>
                  <p>{item.productId?.categoryId?.name || t("beautyFallback")}</p>
                  <strong>AED {Number(item.unitPrice).toFixed(2)}</strong>
                  <small className={`stock-note ${Number(item.productId?.stock || 0) <= 0 ? "stock-note--danger" : ""}`}>
                    {Number(item.productId?.stock || 0) <= 0
                      ? t("outOfStockNow")
                      : t("availableCount", { count: Number(item.productId?.stock || 0) })}
                  </small>
                </div>

                <div className="qty-picker">
                  <button type="button" onClick={() => handleQuantity(item._id, Math.max(1, item.quantity - 1))}>-</button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= Number(item.productId?.stock || 0)}
                  >
                    +
                  </button>
                </div>

                <strong className="cart-line-total">AED {(item.unitPrice * item.quantity).toFixed(2)}</strong>

                <button type="button" className="ghost-button cart-remove-button" onClick={() => handleRemove(item._id)}>
                  {t("remove")}
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>{t("orderSummary")}</h3>
            <div className="coupon-box">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder={t("couponCode")} />
              <button type="button" className="ghost-button" onClick={handleApplyCoupon}>{t("apply")}</button>
              {cart?.couponCode ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={async () => {
                    try {
                      const updatedCart = await removeCoupon(accessToken);
                      setCart(updatedCart);
                    } catch (error) {
                      setMessage(error.message);
                      notify({ type: "error", message: error.message || t("couldNotRemoveCoupon") });
                    }
                  }}
                >
                  {t("removeCoupon")}
                </button>
              ) : null}
            </div>
            {message ? <p className="feedback-note">{message}</p> : null}
            <div><span>{t("subtotal")}</span><strong>AED {Number(cart?.subtotal || 0).toFixed(2)}</strong></div>
            <div><span>{t("discount")}</span><strong>AED {Number(cart?.discountAmount || 0).toFixed(2)}</strong></div>
            <div className="cart-summary__total"><span>{t("total")}</span><strong>AED {Number(cart?.total || cart?.subtotal || 0).toFixed(2)}</strong></div>
            {hasOutOfStockItems ? (
              <p className="stock-note stock-note--danger">{t("removeOutOfStockBeforeCheckout")}</p>
            ) : null}
            <Link
              to={hasOutOfStockItems ? "#" : "/checkout"}
              className={`solid-button cart-link-button ${hasOutOfStockItems ? "is-disabled" : ""}`}
              onClick={(event) => {
                if (hasOutOfStockItems) {
                  event.preventDefault();
                }
              }}
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

export { CartPage };
