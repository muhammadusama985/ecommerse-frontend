import { useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { applyCoupon, clearCart, removeCartItem, removeCoupon, updateCartItem } from "../api/cart";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function CartPage() {
  const { t } = useLanguage();
  const { accessToken, cart, isAuthenticated, isSessionLoading, setCart } = useShop();
  const { notify } = useNotifications();
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  // Keyed by intent so each control only shows busy for its own request, and a
  // rapid double-click on qty +/- cannot stack two updates for the same line.
  const [busyAction, setBusyAction] = useState("");

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
  const isCartBusy = Boolean(busyAction);

  const runCartAction = async (key, action, onErrorKey) => {
    if (busyAction) {
      return;
    }

    setBusyAction(key);

    try {
      await action();
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t(onErrorKey) });
    } finally {
      setBusyAction("");
    }
  };

  const handleQuantity = (itemId, quantity) =>
    runCartAction(`qty:${itemId}`, async () => {
      const updatedCart = await updateCartItem(accessToken, itemId, { quantity });
      setCart(updatedCart);
    }, "couldNotUpdateCartQuantity");

  const handleRemove = (itemId) =>
    runCartAction(`remove:${itemId}`, async () => {
      const updatedCart = await removeCartItem(accessToken, itemId);
      setCart(updatedCart);
    }, "couldNotRemoveCartItem");

  const handleApplyCoupon = () =>
    runCartAction("coupon", async () => {
      const updatedCart = await applyCoupon(accessToken, { code: couponCode, subtotal: Number(cart?.subtotal || 0) });
      setCart(updatedCart);
      setMessage(t("couponAppliedSuccess"));
      notify({ type: "success", message: t("couponAppliedSuccess") });
    }, "couponApplyError");

  const handleClearCart = () =>
    runCartAction("clear", async () => {
      const updatedCart = await clearCart(accessToken);
      setCart(updatedCart);
      setMessage(t("cartClearedSuccess"));
      notify({ type: "success", message: t("cartClearedSuccess") });
    }, "cartClearError");

  const handleRemoveCoupon = () =>
    runCartAction("removeCoupon", async () => {
      const updatedCart = await removeCoupon(accessToken);
      setCart(updatedCart);
    }, "couldNotRemoveCoupon");

  return (
    <section className="cart-panel cart-panel--compact">
      <div className="section-header section-header--left">
        <span className="section-eyebrow">{t("shoppingCart")}</span>
        <h1>{t("yourSavedItems")}</h1>
        <p>{t("cartReviewCopy")}</p>
      </div>

      {isSessionLoading ? (
        <LoadingState label={t("loadingCart")} />
      ) : !items.length ? (
        <div className="empty-panel">
          <p>{t("cartEmpty")}</p>
          <Link to="/best-sellers" className="solid-button">{t("exploreProducts")}</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            <div className="cart-list__actions">
              <Link to="/products" className="ghost-button cart-toolbar-button">{t("continueShopping")}</Link>
              <button
                type="button"
                className="ghost-button cart-toolbar-button"
                onClick={handleClearCart}
                disabled={busyAction === "clear"}
                aria-busy={busyAction === "clear"}
              >
                {busyAction === "clear" ? "Clearing..." : t("clearCart")}
              </button>
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
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, Math.max(1, item.quantity - 1))}
                    disabled={isCartBusy}
                    aria-busy={busyAction === `qty:${item._id}`}
                  >
                    {busyAction === `qty:${item._id}` ? <span className="mini-spinner" /> : "-"}
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, item.quantity + 1)}
                    disabled={isCartBusy || item.quantity >= Number(item.productId?.stock || 0)}
                    aria-busy={busyAction === `qty:${item._id}`}
                  >
                    +
                  </button>
                </div>

                <strong className="cart-line-total">AED {(item.unitPrice * item.quantity).toFixed(2)}</strong>

                <button
                  type="button"
                  className="ghost-button cart-remove-button"
                  onClick={() => handleRemove(item._id)}
                  disabled={isCartBusy}
                  aria-busy={busyAction === `remove:${item._id}`}
                >
                  {busyAction === `remove:${item._id}` ? "Removing..." : t("remove")}
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>{t("orderSummary")}</h3>
            <div className="coupon-box">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder={t("couponCode")}
                disabled={isCartBusy}
              />
              <button
                type="button"
                className="ghost-button"
                onClick={handleApplyCoupon}
                disabled={isCartBusy || !couponCode.trim()}
                aria-busy={busyAction === "coupon"}
              >
                {busyAction === "coupon" ? "Applying..." : t("apply")}
              </button>
              {cart?.couponCode ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleRemoveCoupon}
                  disabled={isCartBusy}
                  aria-busy={busyAction === "removeCoupon"}
                >
                  {busyAction === "removeCoupon" ? "Removing..." : t("removeCoupon")}
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
            {isCartBusy ? <LoadingState compact label={t("savingBasket")} /> : null}
            <Link
              to={hasOutOfStockItems || isCartBusy ? "#" : "/checkout"}
              className={`solid-button cart-link-button ${hasOutOfStockItems || isCartBusy ? "is-disabled" : ""}`}
              aria-disabled={hasOutOfStockItems || isCartBusy}
              onClick={(event) => {
                if (hasOutOfStockItems || isCartBusy) {
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
