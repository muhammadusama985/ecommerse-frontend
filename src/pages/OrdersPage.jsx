import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cancelOrder, getMyOrders, requestReturn } from "../api/orders";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function ReturnModal({ order, onClose, onSuccess }) {
  const { t } = useLanguage();
  const { accessToken } = useShop();
  const { notify } = useNotifications();
  const [returnForm, setReturnForm] = useState({
    returnReason: "",
    returnDetails: "",
    refundAccountHolderName: "",
    refundBankName: "",
    refundAccountNumber: "",
    refundIban: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const canRequestReturn = order.orderStatus === "delivered" && 
    (!order.returnStatus || order.returnStatus === "none" || order.returnStatus === "rejected");

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!returnForm.returnReason.trim()) {
      setMessage("Please provide a return reason.");
      return;
    }

    // Validate bank details for COD
    if (order.paymentMethod === "cod") {
      if (!returnForm.refundAccountHolderName.trim() || !returnForm.refundBankName.trim() || !returnForm.refundAccountNumber.trim()) {
        setMessage("For Cash on Delivery orders, please provide bank account details for refund.");
        return;
      }
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const updatedOrder = await requestReturn(accessToken, order._id, returnForm);
      notify({ type: "success", message: "Return request submitted successfully." });
      onSuccess(updatedOrder);
    } catch (error) {
      setMessage(error.message || "Could not submit return request.");
      notify({ type: "error", message: error.message || "Could not submit return request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal confirm-modal--return" onClick={(event) => event.stopPropagation()}>
        <div className="order-detail__header">
          <div>
            <span className="section-eyebrow">Request Return</span>
            <h3>Order #{order.orderNumber}</h3>
            <p>Please provide details for your return request.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="order-detail__section">
            <strong>Return Reason *</strong>
            <select
              value={returnForm.returnReason}
              onChange={(event) => setReturnForm({ ...returnForm, returnReason: event.target.value })}
              required
            >
              <option value="">Select a reason</option>
              <option value="Wrong item received">Wrong item received</option>
              <option value="Item defective/damaged">Item defective/damaged</option>
              <option value="Item not as described">Item not as described</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Wrong size">Wrong size</option>
              <option value="Quality not as expected">Quality not as expected</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="order-detail__section">
            <strong>Additional Details</strong>
            <textarea
              value={returnForm.returnDetails}
              onChange={(event) => setReturnForm({ ...returnForm, returnDetails: event.target.value })}
              placeholder="Provide any additional details about your return..."
              rows={3}
            />
          </div>

          {order.paymentMethod === "cod" && (
            <div className="order-detail__section">
              <strong>Refund Bank Account *</strong>
              <p className="order-card__reason">
                For Cash on Delivery orders, please provide your bank details so we can process your refund.
              </p>
              <div className="return-bank-form">
                <label>
                  Account Holder Name
                  <input
                    type="text"
                    value={returnForm.refundAccountHolderName}
                    onChange={(event) => setReturnForm({ ...returnForm, refundAccountHolderName: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Bank Name
                  <input
                    type="text"
                    value={returnForm.refundBankName}
                    onChange={(event) => setReturnForm({ ...returnForm, refundBankName: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Account Number
                  <input
                    type="text"
                    value={returnForm.refundAccountNumber}
                    onChange={(event) => setReturnForm({ ...returnForm, refundAccountNumber: event.target.value })}
                    required
                  />
                </label>
                <label>
                  IBAN (Optional)
                  <input
                    type="text"
                    value={returnForm.refundIban}
                    onChange={(event) => setReturnForm({ ...returnForm, refundIban: event.target.value })}
                  />
                </label>
              </div>
            </div>
          )}

          {order.paymentMethod === "stripe" && (
            <div className="order-detail__section">
              <strong>Refund Method</strong>
              <p className="order-card__reason">
                For Stripe payments, the refund will be automatically processed back to your original payment method.
              </p>
            </div>
          )}

          {message ? <p className="feedback-note">{message}</p> : null}

          <div className="order-detail__actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="solid-button" disabled={isSubmitting || !canRequestReturn}>
              {isSubmitting ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrdersPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const { accessToken, isAuthenticated } = useShop();
  const { notify } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage) {
      notify({ type: "success", message: location.state.successMessage });
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.successMessage, notify]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getMyOrders(accessToken)
      .then((result) => setOrders(result))
      .catch((error) => {
        setMessage(error.message);
        notify({ type: "error", message: error.message });
      });
  }, [accessToken, notify]);

  const handleCancelOrder = async (event, orderId) => {
    event.stopPropagation();

    const accepted = window.confirm("Are you sure you want to cancel this order?");
    if (!accepted) {
      return;
    }

    setBusyOrderId(orderId);
    try {
      const updatedOrder = await cancelOrder(accessToken, orderId);
      setOrders((current) => current.map((order) => (order._id === orderId ? updatedOrder : order)));
      setSelectedOrder((current) => (current?._id === orderId ? updatedOrder : current));
      notify({
        type: "success",
        message:
          updatedOrder.paymentStatus === "refunded"
            ? "Order cancelled. Your Stripe payment will be refunded automatically to your original payment method."
            : "Order cancelled successfully.",
      });
    } catch (error) {
      notify({ type: "error", message: error.message || "Could not cancel order." });
    } finally {
      setBusyOrderId("");
    }
  };

  const handleReturnSuccess = (updatedOrder) => {
    setOrders((current) => current.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
    setSelectedOrder(updatedOrder);
    setShowReturnModal(false);
  };

  const canRequestReturn = (order) => {
    return order.orderStatus === "delivered" && 
      (!order.returnStatus || order.returnStatus === "none" || order.returnStatus === "rejected");
  };

  if (!isAuthenticated) {
    return (
      <section className="empty-panel">
        <h1>{t("loginRequired")}</h1>
        <p>{t("yourOrderHistory")}</p>
        <Link to="/login" className="solid-button">
          {t("goToLogin")}
        </Link>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="content-page content-page--hero">
        <span className="section-eyebrow">{t("orders")}</span>
        <h1>{t("yourOrderHistory")}</h1>
        <p>Track previously placed orders, cancel eligible orders, and open full order details.</p>
      </div>

      {message ? <p className="feedback-note">{message}</p> : null}

      {!orders.length ? (
        <div className="empty-panel">
          <p>{t("noOrders")}</p>
          <Link to="/best-sellers" className="solid-button empty-panel__button">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="orders-list orders-list--rich">
          {orders.map((order) => {
            const canCancel = !["delivered", "cancelled"].includes(order.orderStatus);

            return (
              <article
                key={order._id}
                className="order-card order-card--rich order-card--interactive"
                onClick={() => setSelectedOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedOrder(order);
                  }
                }}
              >
                <div>
                  <span>Order</span>
                  <strong>{order.orderNumber}</strong>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span>{t("status")}</span>
                  <strong>{order.orderStatus}</strong>
                </div>
                <div>
                  <span>{t("payment")}</span>
                  <strong>{order.paymentMethod}</strong>
                  <p>{order.paymentStatus}</p>
                </div>
                <div>
                  <span>{t("total")}</span>
                  <strong>AED {Number(order.totalAmount).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>{order.shippingStatus}</strong>
                  {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
                  {order.cancelledBy ? (
                    <p className="order-card__reason">
                      Cancelled by: {order.cancelledBy === "admin" ? "Admin" : "Customer"}
                    </p>
                  ) : null}
                  {order.cancellationReason ? <p className="order-card__reason">Reason: {order.cancellationReason}</p> : null}
                </div>
                <div className="order-card__actions">
                  <div className="cart-list__actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={(event) => handleCancelOrder(event, order._id)}
                      disabled={!canCancel || busyOrderId === order._id}
                    >
                      {order.orderStatus === "cancelled"
                        ? "Cancelled"
                        : order.orderStatus === "delivered"
                          ? "Delivered"
                          : busyOrderId === order._id
                            ? "Cancelling..."
                            : "Cancel Order"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedOrder ? (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="confirm-modal confirm-modal--order-detail" onClick={(event) => event.stopPropagation()}>
            <div className="order-detail__header">
              <div>
                <span className="section-eyebrow">Order Details</span>
                <h3>{selectedOrder.orderNumber}</h3>
                <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>

            <div className="order-detail__summary">
              <div className="order-detail__card">
                <span>Status</span>
                <strong>{selectedOrder.orderStatus}</strong>
              </div>
              <div className="order-detail__card">
                <span>Payment</span>
                <strong>{selectedOrder.paymentMethod}</strong>
                <p>{selectedOrder.paymentStatus}</p>
              </div>
              <div className="order-detail__card">
                <span>Shipping</span>
                <strong>{selectedOrder.shippingStatus}</strong>
                {selectedOrder.trackingNumber ? <p>{selectedOrder.trackingNumber}</p> : null}
                {selectedOrder.shipmentLabelUrl ? (
                  <a href={selectedOrder.shipmentLabelUrl} target="_blank" rel="noopener noreferrer" className="order-detail__link">
                    Download Shipping Label
                  </a>
                ) : null}
              </div>
              <div className="order-detail__card">
                <span>Total</span>
                <strong>AED {Number(selectedOrder.totalAmount || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className="order-detail__section">
              <strong>Products</strong>
              <div className="order-detail__items">
                {(selectedOrder.items || []).map((item, index) => (
                  <article key={`${item.productId}-${index}`} className="order-detail__item">
                    {item.image ? (
                      <img src={mediaUrl(item.image)} alt={item.name} className="order-detail__image" />
                    ) : (
                      <div className="order-detail__image order-detail__image--placeholder">{item.name}</div>
                    )}
                    <div className="order-detail__copy">
                      <strong>{item.name}</strong>
                      <p>Qty {item.quantity}</p>
                      <p>AED {Number(item.unitPrice || 0).toFixed(2)} each</p>
                    </div>
                    <strong className="order-detail__line-total">AED {Number(item.lineTotal || 0).toFixed(2)}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="order-detail__section">
              <strong>Shipping Address</strong>
              <p>
                {selectedOrder.shippingAddress?.fullName || "N/A"}
                <br />
                {selectedOrder.shippingAddress?.addressLine1 || ""}
                {selectedOrder.shippingAddress?.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}
                {selectedOrder.shippingAddress?.city ? `, ${selectedOrder.shippingAddress.city}` : ""}
                {selectedOrder.shippingAddress?.country ? `, ${selectedOrder.shippingAddress.country}` : ""}
                {selectedOrder.shippingAddress?.phone ? (
                  <>
                    <br />
                    Phone: {selectedOrder.shippingAddress.phone}
                  </>
                ) : null}
              </p>
            </div>

            <div className="order-detail__totals">
              <div>
                <span>Subtotal</span>
                <strong>AED {Number(selectedOrder.subtotal || 0).toFixed(2)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>AED {Number(selectedOrder.shippingAmount || 0).toFixed(2)}</strong>
              </div>
              <div>
                <span>Discount</span>
                <strong>AED {Number(selectedOrder.discountAmount || 0).toFixed(2)}</strong>
              </div>
              <div className="order-detail__total">
                <span>Total</span>
                <strong>AED {Number(selectedOrder.totalAmount || 0).toFixed(2)}</strong>
              </div>
            </div>

            {/* Return Status Section */}
            {selectedOrder.returnStatus && selectedOrder.returnStatus !== "none" ? (
              <div className="order-detail__section order-detail__section--return">
                <strong>Return Status</strong>
                <p><strong>Status:</strong> {selectedOrder.returnStatus}</p>
                {selectedOrder.returnReason ? <p><strong>Reason:</strong> {selectedOrder.returnReason}</p> : null}
                {selectedOrder.returnDetails ? <p><strong>Details:</strong> {selectedOrder.returnDetails}</p> : null}
                {selectedOrder.returnTrackingNumber ? (
                  <p><strong>Return Tracking:</strong> {selectedOrder.returnTrackingNumber}</p>
                ) : null}
                {selectedOrder.returnShipmentLabelUrl ? (
                  <a href={selectedOrder.returnShipmentLabelUrl} target="_blank" rel="noopener noreferrer" className="order-detail__link">
                    Download Return Label
                  </a>
                ) : null}
                {selectedOrder.returnResolutionNote ? (
                  <p><strong>Admin Note:</strong> {selectedOrder.returnResolutionNote}</p>
                ) : null}
              </div>
            ) : (
              canRequestReturn(selectedOrder) && (
                <div className="order-detail__section order-detail__section--return-action">
                  <strong>Need to Return?</strong>
                  <p>If you need to return this order, you can request a return.</p>
                  <button
                    type="button"
                    className="solid-button solid-button--secondary"
                    onClick={() => setShowReturnModal(true)}
                  >
                    Request Return
                  </button>
                </div>
              )
            )}

            {selectedOrder.paymentMethod === "stripe" && selectedOrder.paymentStatus === "refunded" ? (
              <div className="order-detail__section">
                <strong>Refund Status</strong>
                <p className="order-card__reason">
                  This Stripe payment has been refunded automatically to the original payment method used for this order.
                </p>
              </div>
            ) : null}

            {selectedOrder.cancelledBy || selectedOrder.cancellationReason ? (
              <div className="order-detail__section">
                {selectedOrder.cancelledBy ? (
                  <>
                    <strong>Cancelled By</strong>
                    <p className="order-card__reason">
                      {selectedOrder.cancelledBy === "admin" ? "Admin" : "Customer"}
                    </p>
                  </>
                ) : null}
                {selectedOrder.cancellationReason ? (
                  <>
                    <strong>Cancellation Reason</strong>
                    <p className="order-card__reason">{selectedOrder.cancellationReason}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="order-detail__actions">
              <button type="button" className="ghost-button" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              {canRequestReturn(selectedOrder) && (
                <button
                  type="button"
                  className="solid-button solid-button--secondary"
                  onClick={() => setShowReturnModal(true)}
                >
                  Request Return
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showReturnModal && selectedOrder ? (
        <ReturnModal
          order={selectedOrder}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      ) : null}
    </section>
  );
}

export { OrdersPage };