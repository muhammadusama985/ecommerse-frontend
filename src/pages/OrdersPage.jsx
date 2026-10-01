import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { getMyOrders, requestReturn } from "../api/orders";
import { trackOrderShipment } from "../api/shipping";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";
import { pickLocalizedItems, translateOrderItems } from "../lib/contentTranslation";

const isDelivered = (order) =>
  order.orderStatus === "delivered" || order.shippingStatus === "delivered";

// A return can only be raised once Aramex has actually delivered the parcel.
// Until then the customer follows the shipment instead of returning it.
const canRequestReturn = (order) => {
  if (!isDelivered(order) || order.orderStatus === "cancelled") {
    return false;
  }

  return !order.returnStatus || order.returnStatus === "none" || order.returnStatus === "rejected";
};

// Aramex returns WCF-style timestamps ("/Date(1790901780000+0200)/"). Parse both
// that and plain ISO so the customer never sees the raw markup.
const parseAramexDate = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const wcf = value.match(/\/Date\((-?\d+)(?:[+-]\d{4})?\)\//);
  const parsed = wcf ? new Date(Number(wcf[1])) : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ARAMEX_STATUS_LABELS = {
  "record created": "Shipment booked with Aramex",
  "shipment information received": "Shipment details received by Aramex",
  "shipment picked up": "Picked up by Aramex",
  "picked up": "Picked up by Aramex",
  "out for delivery": "Out for delivery",
  "attempted delivery": "Delivery attempted",
  delivered: "Delivered",
  returned: "Returned to sender",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  "in transit": "In transit",
};

// The backend publishes a readable line, but tracking saved before that change
// still holds Aramex's terse wording, so fall back to the same map here.
const readableAramexStatus = (event) => {
  if (!event) {
    return "";
  }

  if (event.DisplayDescription) {
    return event.DisplayDescription;
  }

  const raw = (event.UpdateDescription || event.StatusDescription || "").trim();

  if (!raw) {
    return "";
  }

  // Aramex ends most statuses with a period ("Record created."), so the lookup
  // key has to be stripped before it can match.
  const key = raw.toLowerCase().replace(/\.+$/, "");

  return ARAMEX_STATUS_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

const formatTrackingMoment = (event) => {
  if (!event) {
    return "";
  }

  const combined = [event.EventDate, event.EventTime].filter(Boolean).join("T");
  const parsed =
    parseAramexDate(event.UpdateDateTime) ||
    parseAramexDate(combined) ||
    parseAramexDate(event.EventDate);

  if (parsed) {
    return parsed.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return [event.UpdateDateTime, event.EventDate].filter(Boolean).join(" ");
};

const getTrackingEvents = (tracking) => {
  const result = tracking?.TrackingResults?.[0];
  if (Array.isArray(result?.Events) && result.Events.length) {
    return result.Events;
  }
  if (Array.isArray(result?.Value)) {
    return result.Value;
  }
  return result?.UpdateDescription
    ? [
        {
          UpdateDescription: result.UpdateDescription,
          UpdateDateTime: result.UpdateDateTime,
          Location: result.Destination || result.Location,
        },
      ]
    : [];
};

// Aramex does not promise an ordering, so the newest scan is found by date
// rather than by position.
const getLatestTrackingEvent = (tracking) => {
  const events = tracking ? getTrackingEvents(tracking) : [];
  if (!events.length) {
    return null;
  }

  return events
    .slice()
    .sort((a, b) => {
      const aTime = parseAramexDate(a.UpdateDateTime)?.getTime() ?? 0;
      const bTime = parseAramexDate(b.UpdateDateTime)?.getTime() ?? 0;
      return bTime - aTime;
    })[0];
};

// Shows the status Aramex actually reports for the parcel instead of the
// internal shippingStatus enum ("pending", "in_transit", ...), which tells the
// customer nothing. Without an AWB there is genuinely nothing to query yet.
// The detail popup passes showAction={false} because its Aramex Tracking panel
// already owns the single track button, so the two no longer sit together.
function ShippingStatusCell({ order, showAction = true }) {
  const { accessToken } = useShop();
  const [tracking, setTracking] = useState(order.shippingMeta?.tracking || null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const latestEvent = getLatestTrackingEvent(tracking);
  const statusText = readableAramexStatus(latestEvent);

  const handleTrack = async (event) => {
    event.stopPropagation();
    setIsChecking(true);
    setError("");
    try {
      const result = await trackOrderShipment(accessToken, order._id);
      setTracking(result?.tracking || result);
    } catch (trackError) {
      setError(trackError.message || "Could not reach Aramex right now.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="shipping-status">
      <strong className="shipping-status__label">
        {statusText || "Waiting for Aramex to book the shipment"}
      </strong>
      {latestEvent ? <p className="shipping-status__moment">{formatTrackingMoment(latestEvent)}</p> : null}
      {latestEvent?.Location ? <p className="shipping-status__location">{latestEvent.Location}</p> : null}
      {order.trackingNumber ? (
        <p className="shipping-status__awb">
          Tracking number <strong>{order.trackingNumber}</strong>
        </p>
      ) : null}
      {showAction ? (
        <button
          type="button"
          className="ghost-button shipping-status__action"
          onClick={handleTrack}
          disabled={isChecking}
          aria-busy={isChecking}
        >
          {isChecking ? "Checking Aramex..." : "Track the Shipment"}
        </button>
      ) : null}
      {showAction && !latestEvent && !order.trackingNumber ? (
        <p className="order-card__reason">
          The Aramex tracking number is created automatically once your payment is confirmed.
        </p>
      ) : null}
      {error ? <p className="order-card__reason">{error}</p> : null}
    </div>
  );
}

function TrackingPanel({ orderId, initialTracking }) {
  const [tracking, setTracking] = useState(initialTracking || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useShop();

  const handleTrack = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await trackOrderShipment(accessToken, orderId);
      setTracking(result?.tracking || result);
    } catch (trackError) {
      setError(trackError.message || "Could not retrieve Aramex tracking right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const events = tracking ? getTrackingEvents(tracking) : [];
  const result = tracking?.TrackingResults?.[0];

  return (
    <div className="order-detail__section order-detail__section--tracking">
      <div className="tracking-panel__head">
        <strong>Aramex Tracking</strong>
        <button
          type="button"
          className="solid-button solid-button--secondary tracking-panel__action"
          onClick={handleTrack}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Checking Aramex..." : "Track Shipment"}
        </button>
      </div>

      {orderId && result && !result.HasErrors ? (
        <p className="tracking-panel__awb">
          Tracking number <strong>{result.ShipmentNumber || ""}</strong>
        </p>
      ) : null}

      {error ? <p className="feedback-note">{error}</p> : null}

      {result?.HasErrors ? (
        <p className="feedback-note">
          {result.Notifications?.[0]?.Message || "Aramex could not locate this shipment yet."}
        </p>
      ) : null}

      {result && !result.HasErrors && !events.length ? (
        <p className="order-card__reason">No tracking events have been recorded for this shipment yet.</p>
      ) : null}

      {events.length ? (
        <div className="order-detail__items">
          {events
            .slice()
            .sort((a, b) => {
              const aTime = parseAramexDate(a.UpdateDateTime)?.getTime() ?? 0;
              const bTime = parseAramexDate(b.UpdateDateTime)?.getTime() ?? 0;
              return bTime - aTime;
            })
            .map((event, index) => (
              <article key={`${event.UpdateDateTime || event.EventDate || index}-${index}`} className="order-detail__item">
                <div className="order-detail__copy">
                  <strong>{readableAramexStatus(event) || "Status update"}</strong>
                  <p>{formatTrackingMoment(event) || "Date not provided"}</p>
                  {event.Location ? <p>{event.Location}</p> : null}
                </div>
              </article>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function ReturnModal({ order, onClose, onSuccess }) {
  const { t } = useLanguage();
  const { accessToken } = useShop();
  const { notify } = useNotifications();
  const [returnForm, setReturnForm] = useState({
    returnReason: "",
    returnDetails: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmitReturn = canRequestReturn(order);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!returnForm.returnReason.trim()) {
      setMessage("Please provide a return reason.");
      return;
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

          <div className="order-detail__section">
            <strong>Refund Method</strong>
            <p className="order-card__reason">
              For Stripe payments, the refund will be automatically processed back to your original payment method.
            </p>
          </div>

          <div className="order-detail__section">
            <strong>What happens next</strong>
            <p className="order-card__reason">
              Your request needs admin approval. Once it is approved we arrange an Aramex pickup from your delivery
              address and bring the parcel back to our Al Ain store.
            </p>
          </div>

          {message ? <p className="feedback-note">{message}</p> : null}

          <div className="order-detail__actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="solid-button" disabled={isSubmitting || !canSubmitReturn}>
              {isSubmitting ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrdersPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { accessToken, isAuthenticated } = useShop();
  const { notify } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [localizedOrders, setLocalizedOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
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

    let isCancelled = false;
    // Without this the page renders the "no orders" empty panel for the whole
    // request, which reads as "your history is gone".
    setIsLoadingOrders(true);

    getMyOrders(accessToken)
      .then((result) => {
        if (!isCancelled) setOrders(result);
      })
      .catch((error) => {
        if (isCancelled) return;
        setMessage(error.message);
        notify({ type: "error", message: error.message });
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingOrders(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, notify]);

  // Order line items store the product name captured at purchase time, so they
  // need their own pass through the translator to follow the site language.
  useEffect(() => {
    let isCancelled = false;

    if (language === "en") {
      setLocalizedOrders(orders);
      return () => {
        isCancelled = true;
      };
    }

    translateOrderItems(language, orders).then((translated) => {
      if (!isCancelled) setLocalizedOrders(translated);
    });

    return () => {
      isCancelled = true;
    };
  }, [language, orders]);

  const visibleOrders = pickLocalizedItems(localizedOrders, orders);

  const handleReturnSuccess = (updatedOrder) => {
    setOrders((current) => current.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
    setSelectedOrder(updatedOrder);
    setShowReturnModal(false);
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
        <p>Track your orders with live Aramex shipping updates, request a return, and open full order details.</p>
      </div>

      {message ? <p className="feedback-note">{message}</p> : null}

      {isLoadingOrders ? (
        <LoadingState variant="rows" label={t("loadingOrders")} count={4} />
      ) : !visibleOrders.length ? (
        <div className="empty-panel">
          <p>{t("noOrders")}</p>
          <Link to="/best-sellers" className="solid-button empty-panel__button">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="orders-list orders-list--rich">
          {visibleOrders.map((order) => {
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
                  <ShippingStatusCell order={order} />
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
                <ShippingStatusCell order={selectedOrder} showAction={false} />
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

            <TrackingPanel
              orderId={selectedOrder._id}
              initialTracking={selectedOrder.shippingMeta?.tracking}
            />

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
                  <p>You can request a return once Aramex has delivered your order. Tell us the reason and our team will review it.</p>
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