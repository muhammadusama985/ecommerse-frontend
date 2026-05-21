import { useEffect, useState } from "react";
import { getOrders, updateOrderReturnStatus, updateOrderStatus, createOrderShipment, trackOrderShipment, createOrderReturnShipment, trackOrderReturnShipment } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const statusOptions = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const returnStatusOptions = ["approved", "rejected", "in_transit", "received", "refunded", "completed"];

function OrdersPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { notify } = useAdminNotifications();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [returnDraft, setReturnDraft] = useState({ returnStatus: "approved", returnResolutionNote: "" });
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [isTrackingShipment, setIsTrackingShipment] = useState(false);
  const [isCreatingReturnShipment, setIsCreatingReturnShipment] = useState(false);
  const [isTrackingReturnShipment, setIsTrackingReturnShipment] = useState(false);

  useEffect(() => {
    getOrders(accessToken).then(setOrders).catch(() => setOrders([]));
  }, [accessToken]);

  const updateOrderInState = (updated) => {
    setOrders((current) => current.map((order) => (order._id === updated._id ? updated : order)));
    setSelectedOrder(updated);
    setStatusDraft(updated.orderStatus);
    setCancelReason(updated.cancellationReason || "");
    setReturnDraft({
      returnStatus: updated.returnStatus && updated.returnStatus !== "none" ? updated.returnStatus : "approved",
      returnResolutionNote: updated.returnResolutionNote || "",
    });
  };

  const handleStatusChange = async (orderId) => {
    if (statusDraft === "cancelled" && !cancelReason.trim()) {
      notify({ type: "error", message: t("cancellationReasonRequiredAdmin") });
      return;
    }

    // Validate: Cannot skip directly to processing/shipped without confirming first
    const currentStatus = orders.find(o => o._id === orderId)?.orderStatus;
    if (statusDraft === "processing" && currentStatus === "placed") {
      notify({ type: "error", message: "Please confirm the order before moving to processing." });
      return;
    }
    if (statusDraft === "shipped" && !["confirmed", "processing"].includes(currentStatus)) {
      notify({ type: "error", message: "Please confirm and process the order before shipping." });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateOrderStatus(accessToken, orderId, {
        orderStatus: statusDraft,
        ...(statusDraft === "cancelled" ? { cancellationReason: cancelReason.trim() } : {}),
      });
      updateOrderInState(updated);
      
      // Show special message for COD orders reaching delivered
      if (statusDraft === "delivered" && selectedOrder?.paymentMethod === "cod" && updated.paymentStatus === "pending") {
        notify({
          type: "success",
          message: "Order marked as delivered. Remember to update payment status to 'Paid' after collecting COD.",
        });
      } else {
        notify({
          type: "success",
          message:
            statusDraft === "cancelled"
              ? updated.paymentStatus === "refunded"
                ? t("orderCancelledRefundedSuccess")
                : t("orderCancelledStockRestored")
              : t("orderUpdatedToStatus", { status: statusDraft }),
        });
      }
    } catch (error) {
      notify({ type: "error", message: error.message || t("orderUpdateError") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnUpdate = async (orderId) => {
    setIsSubmitting(true);
    try {
      const updated = await updateOrderReturnStatus(accessToken, orderId, returnDraft);
      updateOrderInState(updated);
      notify({ type: "success", message: "Return status updated successfully." });
    } catch (error) {
      notify({ type: "error", message: "Could not update return status." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateShipment = async (orderId) => {
    setIsCreatingShipment(true);
    try {
      const updated = await createOrderShipment(accessToken, orderId);
      updateOrderInState(updated);
      notify({ type: "success", message: `Shipment created. Tracking: ${updated.trackingNumber || "N/A"}` });
    } catch (error) {
      notify({ type: "error", message: error.message || "Failed to create Aramex shipment." });
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleRecreateShipment = async (orderId) => {
    const confirmed = window.confirm(
      "This will create a new shipment and may replace the existing tracking number. Are you sure you want to continue?"
    );
    if (!confirmed) {
      return;
    }
    await handleCreateShipment(orderId);
  };

  const handleTrackShipment = async (orderId) => {
    setIsTrackingShipment(true);
    try {
      const updated = await trackOrderShipment(accessToken, orderId);
      updateOrderInState(updated);
      notify({ type: "success", message: "Tracking info updated." });
    } catch (error) {
      notify({ type: "error", message: error.message || "Failed to track shipment." });
    } finally {
      setIsTrackingShipment(false);
    }
  };

  const handleCreateReturnShipment = async (orderId) => {
    setIsCreatingReturnShipment(true);
    try {
      const updated = await createOrderReturnShipment(accessToken, orderId);
      updateOrderInState(updated);
      notify({ type: "success", message: `Return shipment created. Tracking: ${updated.returnTrackingNumber || "N/A"}` });
    } catch (error) {
      notify({ type: "error", message: error.message || "Failed to create return shipment." });
    } finally {
      setIsCreatingReturnShipment(false);
    }
  };

  const handleTrackReturnShipment = async (orderId) => {
    setIsTrackingReturnShipment(true);
    try {
      const updated = await trackOrderReturnShipment(accessToken, orderId);
      updateOrderInState(updated);
      notify({ type: "success", message: "Return tracking info updated." });
    } catch (error) {
      notify({ type: "error", message: error.message || "Failed to track return shipment." });
    } finally {
      setIsTrackingReturnShipment(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("orders")}</h2>
          <p>{t("ordersPageCopy")}</p>
        </div>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--order">
            <span>{t("order")}</span>
            <span>{t("customer")}</span>
            <span>{t("status")}</span>
            <span>{t("total")}</span>
            <span>{t("tracking")}</span>
            <span>{t("actions")}</span>
          </div>
          {!orders.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {orders.map((order) => (
            <article key={order._id} className="admin-table__row admin-table__row--order">
              <span>{order.orderNumber}</span>
              <span>{order.userId?.email}</span>
              <span className="admin-order-status">{order.orderStatus}</span>
              <strong>AED {Number(order.totalAmount).toFixed(2)}</strong>
              <span>{order.trackingNumber || order.shippingStatus}</span>
              <div className="admin-order-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => {
                    setSelectedOrder(order);
                    setStatusDraft(order.orderStatus);
                    setCancelReason(order.cancellationReason || "");
                    setReturnDraft({
                      returnStatus: order.returnStatus && order.returnStatus !== "none" ? order.returnStatus : "approved",
                      returnResolutionNote: order.returnResolutionNote || "",
                    });
                  }}
                >
                  {t("viewDetails")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedOrder ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            setSelectedOrder(null);
            setStatusDraft("");
            setCancelReason("");
          }}
        >
          <div className="admin-modal admin-modal--order" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>{t("orderDetails")}</h3>
                <p>{selectedOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => {
                  setSelectedOrder(null);
                  setStatusDraft("");
                  setCancelReason("");
                  setReturnDraft({ returnStatus: "approved", returnResolutionNote: "" });
                }}
              >
                {t("close")}
              </button>
            </div>

            <div className="admin-order-detail">
              {/* Workflow Progress Indicator */}
              <div className="admin-order-workflow">
                <div className={`workflow-step ${["placed", "confirmed", "processing", "shipped", "delivered"].includes(selectedOrder.orderStatus) ? "completed" : ""}`}>
                  <span className="workflow-step__number">1</span>
                  <span className="workflow-step__label">Placed</span>
                </div>
                <div className={`workflow-step ${["confirmed", "processing", "shipped", "delivered"].includes(selectedOrder.orderStatus) ? "completed" : ""}`}>
                  <span className="workflow-step__number">2</span>
                  <span className="workflow-step__label">Confirmed</span>
                </div>
                <div className={`workflow-step ${["processing", "shipped", "delivered"].includes(selectedOrder.orderStatus) ? "completed" : ""}`}>
                  <span className="workflow-step__number">3</span>
                  <span className="workflow-step__label">Processing</span>
                </div>
                <div className={`workflow-step ${["shipped", "delivered"].includes(selectedOrder.orderStatus) ? "completed" : ""}`}>
                  <span className="workflow-step__number">4</span>
                  <span className="workflow-step__label">Shipped</span>
                </div>
                <div className={`workflow-step ${selectedOrder.orderStatus === "delivered" ? "completed" : ""}`}>
                  <span className="workflow-step__number">5</span>
                  <span className="workflow-step__label">Delivered</span>
                </div>
              </div>

              <div className="admin-order-detail__grid">
                <div className="admin-order-detail__card">
                  <strong>{t("customer")}</strong>
                  <p>{selectedOrder.userId?.email || t("na")}</p>
                </div>
                <div className="admin-order-detail__card">
                  <strong>{t("paymentLabel")}</strong>
                  <p>
                    <span className={`payment-method ${selectedOrder.paymentMethod}`}>{selectedOrder.paymentMethod?.toUpperCase()}</span>
                    <span> / </span>
                    <span className={`payment-status ${selectedOrder.paymentStatus}`}>{selectedOrder.paymentStatus}</span>
                  </p>
                </div>
                <div className="admin-order-detail__card">
                  <strong>{t("shipping")}</strong>
                  <p>{selectedOrder.shippingProvider || t("na")} / {selectedOrder.shippingStatus || t("na")}</p>
                </div>
                <div className="admin-order-detail__card">
                  <strong>{t("total")}</strong>
                  <p>AED {Number(selectedOrder.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="admin-order-detail__section">
                <strong>{t("shippingAddress")}</strong>
                <p>
                  {selectedOrder.shippingAddress?.fullName || t("na")}
                  <br />
                  {selectedOrder.shippingAddress?.addressLine1 || ""}
                  {selectedOrder.shippingAddress?.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}
                  {selectedOrder.shippingAddress?.city ? `, ${selectedOrder.shippingAddress.city}` : ""}
                  {selectedOrder.shippingAddress?.country ? `, ${selectedOrder.shippingAddress.country}` : ""}
                </p>
              </div>

              <div className="admin-order-detail__section">
                <strong>{t("items")}</strong>
                <div className="admin-order-items">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={`${item.productId || item.name}-${index}`} className="admin-order-item">
                      <span>{item.name}</span>
                      <span>{t("quantityShort", { count: item.quantity })}</span>
                      <strong>AED {Number(item.lineTotal || 0).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aramex Shipping Actions */}
              <div className={`admin-order-detail__section ${selectedOrder.orderStatus !== "placed" ? "admin-order-detail__section--shipping enabled" : ""}`}>
                <strong>Aramex Shipping</strong>
                <div className="aramex-shipping-actions">
                  <div className="aramex-shipping-status">
                    <div className="aramex-shipping-status__item">
                      <span>Provider:</span>
                      <strong>{selectedOrder.shippingProvider || "N/A"}</strong>
                    </div>
                    <div className="aramex-shipping-status__item">
                      <span>Shipping Status:</span>
                      <strong>{selectedOrder.shippingStatus || "N/A"}</strong>
                    </div>
                    <div className="aramex-shipping-status__item">
                      <span>Tracking Number:</span>
                      <strong>{selectedOrder.trackingNumber || "Not created yet"}</strong>
                    </div>
                    {selectedOrder.shipmentLabelUrl ? (
                      <div className="aramex-shipping-status__item">
                        <span>Label URL:</span>
                        <a href={selectedOrder.shipmentLabelUrl} target="_blank" rel="noopener noreferrer">
                          Download Label
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <div className="aramex-shipping-buttons">
                    {!selectedOrder.trackingNumber ? (
                      <button
                        type="button"
                        className="admin-button admin-button--primary"
                        onClick={() => handleCreateShipment(selectedOrder._id)}
                        disabled={isCreatingShipment || selectedOrder.orderStatus === "placed"}
                        title={selectedOrder.orderStatus === "placed" ? "Please confirm the order first" : "Create Aramex shipment"}
                      >
                        {isCreatingShipment ? "Creating Shipment..." : "Create Shipment"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-button"
                          onClick={() => handleTrackShipment(selectedOrder._id)}
                          disabled={isTrackingShipment}
                        >
                          {isTrackingShipment ? "Tracking..." : "Track Shipment"}
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button--secondary"
                          onClick={() => handleRecreateShipment(selectedOrder._id)}
                          disabled={isCreatingShipment}
                        >
                          Re-create Shipment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Helper text for shipping */}
              {selectedOrder.orderStatus === "placed" && !selectedOrder.trackingNumber ? (
                <div className="admin-order-helper">
                  <p>⚠ Please click "Confirm Order" below to verify the order details before creating the shipment.</p>
                </div>
              ) : null}

              <div className="admin-order-detail__actions">
                <label>
                  {t("updateStatus")}
                  <select
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value)}
                    disabled={isSubmitting}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {statusDraft === "cancelled" ? (
                  <label>
                    {t("cancellationReason")}
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      placeholder={t("cancellationReasonPlaceholder")}
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </label>
                ) : null}

                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => handleStatusChange(selectedOrder._id)}
                  disabled={isSubmitting || statusDraft === selectedOrder.orderStatus}
                >
                  {isSubmitting ? t("saving") : t("saveStatus")}
                </button>
              </div>

              {/* Payment Status Update - Important for COD orders */}
              <div className="admin-order-detail__section admin-order-detail__section--payment">
                <strong>Payment Status</strong>
                <p className="payment-info">
                  {selectedOrder.paymentMethod === "stripe" ? (
                    selectedOrder.paymentStatus === "paid" ? (
                      <span className="payment-note payment-note--success">✓ Stripe payment already collected</span>
                    ) : (
                      <span className="payment-note">Stripe payment status: {selectedOrder.paymentStatus}</span>
                    )
                  ) : selectedOrder.paymentStatus === "paid" ? (
                    <span className="payment-note payment-note--success">✓ COD payment collected</span>
                  ) : (
                    <span className="payment-note payment-note--warning">⚠ COD payment not collected yet</span>
                  )}
                </p>
                {selectedOrder.paymentMethod === "cod" && selectedOrder.paymentStatus !== "paid" ? (
                  <div className="payment-update-hint">
                    <p>For COD orders: After delivering the package and collecting payment, update payment status to "paid" to complete the order.</p>
                  </div>
                ) : null}
              </div>

              {selectedOrder.returnStatus && selectedOrder.returnStatus !== "none" ? (
                <div className="admin-order-detail__section">
                  <strong>Return Management</strong>
                  <p>
                    Current return status: <strong>{selectedOrder.returnStatus}</strong>
                  </p>
                  {selectedOrder.returnReason ? <p>Reason: {selectedOrder.returnReason}</p> : null}
                  {selectedOrder.returnDetails ? <p>Details: {selectedOrder.returnDetails}</p> : null}
                  {selectedOrder.paymentMethod === "cod" ? (
                    <div className="admin-order-detail__subsection">
                      <strong>Refund Account Details</strong>
                      {selectedOrder.returnRefundAccount?.accountNumber ? (
                        <p>
                          Holder: {selectedOrder.returnRefundAccount.accountHolderName || "N/A"}
                          <br />
                          Bank: {selectedOrder.returnRefundAccount.bankName || "N/A"}
                          <br />
                          Account: {selectedOrder.returnRefundAccount.accountNumber}
                          {selectedOrder.returnRefundAccount?.iban ? (
                            <>
                              <br />
                              IBAN: {selectedOrder.returnRefundAccount.iban}
                            </>
                          ) : null}
                        </p>
                      ) : (
                        <p>No refund account details have been submitted yet.</p>
                      )}
                    </div>
                  ) : (
                    <div className="admin-order-detail__subsection">
                      <strong>Refund Method</strong>
                      <p>Stripe returns should be refunded back automatically to the original payment method. Separate bank account details are not required.</p>
                    </div>
                  )}

                  {/* Return Shipment Actions */}
                  <div className="aramex-shipping-actions">
                    <div className="aramex-shipping-status">
                      <div className="aramex-shipping-status__item">
                        <span>Return Tracking:</span>
                        <strong>{selectedOrder.returnTrackingNumber || "Not created yet"}</strong>
                      </div>
                      {selectedOrder.returnShipmentLabelUrl ? (
                        <div className="aramex-shipping-status__item">
                          <span>Return Label URL:</span>
                          <a href={selectedOrder.returnShipmentLabelUrl} target="_blank" rel="noopener noreferrer">
                            Download Return Label
                          </a>
                        </div>
                      ) : null}
                    </div>
                    <div className="aramex-shipping-buttons">
                      {!selectedOrder.returnTrackingNumber ? (
                        <button
                          type="button"
                          className="admin-button admin-button--primary"
                          onClick={() => handleCreateReturnShipment(selectedOrder._id)}
                          disabled={isCreatingReturnShipment}
                        >
                          {isCreatingReturnShipment ? "Creating..." : "Create Return Shipment"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-button"
                            onClick={() => handleTrackReturnShipment(selectedOrder._id)}
                            disabled={isTrackingReturnShipment}
                          >
                            {isTrackingReturnShipment ? "Tracking..." : "Track Return"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="admin-order-detail__actions">
                    <label>
                      Return status
                      <select
                        value={returnDraft.returnStatus}
                        onChange={(event) => setReturnDraft((current) => ({ ...current, returnStatus: event.target.value }))}
                        disabled={isSubmitting}
                      >
                        {returnStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Admin return note
                      <textarea
                        rows={3}
                        value={returnDraft.returnResolutionNote}
                        onChange={(event) => setReturnDraft((current) => ({ ...current, returnResolutionNote: event.target.value }))}
                        disabled={isSubmitting}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-button admin-button--ghost"
                      onClick={() => handleReturnUpdate(selectedOrder._id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("saving") : "Save Return"}
                    </button>
                  </div>
                </div>
              ) : null}

              <p className="admin-order-detail__note">
                {t("orderCancelRulesNote")}
              </p>

              {selectedOrder.trackingNumber ? (
                <div className="admin-order-detail__section">
                  <strong>{t("tracking")}</strong>
                  <p>{selectedOrder.trackingNumber}</p>
                </div>
              ) : null}

              {selectedOrder.cancellationReason ? (
                <div className="admin-order-detail__section">
                  <strong>{t("cancellationReason")}</strong>
                  <p>{selectedOrder.cancellationReason}</p>
                </div>
              ) : null}

              {selectedOrder.paymentMethod === "stripe" && selectedOrder.paymentStatus === "refunded" ? (
                <div className="admin-order-detail__section">
                  <strong>{t("refundStatus")}</strong>
                  <p>{t("stripeRefundAutoCustomer")}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { OrdersPage };