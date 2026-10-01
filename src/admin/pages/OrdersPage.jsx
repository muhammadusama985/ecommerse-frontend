import { useEffect, useState } from "react";
import { getOrders, updateOrderReturnStatus, updateOrderStatus } from "../api/admin";
import { AdminLoading } from "../components/LoadingState";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const statusOptions = ["placed", "confirmed", "processing", "shipped", "delivered"];
const returnStatusOptions = ["approved", "rejected", "in_transit", "received", "refunded", "completed"];

function OrdersPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { notify } = useAdminNotifications();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [returnDraft, setReturnDraft] = useState({ returnStatus: "approved", returnResolutionNote: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    setIsLoading(true);
    getOrders(accessToken)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const updateOrderInState = (updated) => {
    setOrders((current) => current.map((order) => (order._id === updated._id ? updated : order)));
    setSelectedOrder(updated);
    setStatusDraft(updated.orderStatus);
    setReturnDraft({
      returnStatus: updated.returnStatus && updated.returnStatus !== "none" ? updated.returnStatus : "approved",
      returnResolutionNote: updated.returnResolutionNote || "",
    });
  };

  const handleStatusChange = async (orderId) => {
    if (busyAction) return;

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

    setBusyAction(`${orderId}:status`);
    setIsSubmitting(true);
    try {
      const updated = await updateOrderStatus(accessToken, orderId, {
        orderStatus: statusDraft,
      });
      updateOrderInState(updated);

      notify({
        type: "success",
        message: t("orderUpdatedToStatus", { status: statusDraft }),
      });
    } catch (error) {
      notify({ type: "error", message: error.message || t("orderUpdateError") });
    } finally {
      setIsSubmitting(false);
      setBusyAction("");
    }
  };

  const handleReturnUpdate = async (orderId) => {
    if (busyAction) return;

    if (returnDraft.returnStatus === "rejected" && !returnDraft.returnResolutionNote.trim()) {
      notify({ type: "error", message: "Please add a note explaining why the return is rejected." });
      return;
    }

    setBusyAction(`${orderId}:return`);
    setIsSubmitting(true);
    try {
      const updated = await updateOrderReturnStatus(accessToken, orderId, returnDraft);
      updateOrderInState(updated);
      notify({
        type: "success",
        message:
          returnDraft.returnStatus === "approved" && updated.returnTrackingNumber
            ? `Return approved. Aramex pickup booked (tracking: ${updated.returnTrackingNumber}).`
            : "Return status updated successfully.",
      });
    } catch (error) {
      notify({ type: "error", message: error.message || "Could not update return status." });
    } finally {
      setIsSubmitting(false);
      setBusyAction("");
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
          {isLoading ? (
            <AdminLoading variant="table" label={t("loadingOrders")} count={5} />
          ) : !orders.length ? (
            <div className="admin-table__empty">{t("noDataFound")}</div>
          ) : null}
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

              {selectedOrder.trackingNumber || selectedOrder.returnTrackingNumber ? (
                <div className="admin-order-detail__section">
                  <strong>{t("tracking")}</strong>
                  {selectedOrder.trackingNumber ? <p>{selectedOrder.trackingNumber}</p> : null}
                  {selectedOrder.returnTrackingNumber ? (
                    <p>Return: {selectedOrder.returnTrackingNumber}</p>
                  ) : null}
                  {selectedOrder.shipmentLabelUrl ? (
                    <p>
                      <a href={selectedOrder.shipmentLabelUrl} target="_blank" rel="noopener noreferrer">
                        Download Label
                      </a>
                    </p>
                  ) : null}
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

                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => handleStatusChange(selectedOrder._id)}
                  disabled={isSubmitting || statusDraft === selectedOrder.orderStatus || Boolean(busyAction)}
                  aria-busy={busyAction === `${selectedOrder._id}:status`}
                >
                  {isSubmitting ? t("saving") : t("saveStatus")}
                </button>
              </div>

              {/* Payment Status Update */}
              <div className="admin-order-detail__section admin-order-detail__section--payment">
                <strong>Payment Status</strong>
                <p className="payment-info">
                  {selectedOrder.paymentStatus === "paid" ? (
                    <span className="payment-note payment-note--success">✓ Stripe payment already collected</span>
                  ) : (
                    <span className="payment-note">Stripe payment status: {selectedOrder.paymentStatus}</span>
                  )}
                </p>
              </div>

              {selectedOrder.returnStatus && selectedOrder.returnStatus !== "none" ? (
                <div className="admin-order-detail__section">
                  <strong>Return Management</strong>
                  <p>
                    Current return status: <strong>{selectedOrder.returnStatus}</strong>
                  </p>
                  {selectedOrder.returnReason ? <p>Reason: {selectedOrder.returnReason}</p> : null}
                  {selectedOrder.returnDetails ? <p>Details: {selectedOrder.returnDetails}</p> : null}
                  {selectedOrder.returnStatus === "requested" ? (
                    <div className="admin-order-detail__subsection">
                      <strong>Awaiting your approval</strong>
                      <p>
                        The customer has submitted a return request. Set the status to <strong>approved</strong> to
                        accept it — the Aramex return pickup from the customer's address is booked automatically. Set it
                        to <strong>rejected</strong> with a note to decline it.
                      </p>
                    </div>
                  ) : null}
                  <div className="admin-order-detail__subsection">
                    <strong>Return Pickup</strong>
                    <p>
                      Once approved, Aramex collects from the customer's delivery address and delivers to the store in
                      Al Ain.
                    </p>
                  </div>
                  <div className="admin-order-detail__subsection">
                    <strong>Refund Method</strong>
                    <p>Stripe returns should be refunded back automatically to the original payment method. Separate bank account details are not required.</p>
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
                      disabled={isSubmitting || returnDraft.returnStatus === selectedOrder.returnStatus || Boolean(busyAction)}
                      aria-busy={busyAction === `${selectedOrder._id}:return`}
                    >
                      {isSubmitting ? t("saving") : "Save Return"}
                    </button>
                  </div>
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