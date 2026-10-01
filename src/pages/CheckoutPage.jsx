import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createOrder, createStripePaymentIntent } from "../api/orders";
import { getAramexRate } from "../api/shipping";
import { useLanguage } from "../context/LanguageContext";
import { pickLocalizedItems, translateCartItems } from "../lib/contentTranslation";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function StripePaymentBlock({ onCompleteChange }) {
  return (
    <div className="checkout-stripe-block">
      <PaymentElement onChange={(event) => onCompleteChange(Boolean(event.complete))} />
    </div>
  );
}

function CheckoutView({
  addresses,
  canCheckout,
  cart,
  clientSecret,
  isCreatingIntent,
  isLoadingShipping,
  isStripeFormComplete,
  isStripeReady,
  isSubmitting,
  items,
  message,
  onSubmit,
  paymentMethod,
  quote,
  retryShipping,
  selectedAddressId,
  setPaymentMethod,
  setSelectedAddressId,
  setStripeFormComplete,
  shippingState,
  t,
}) {
  // The PaymentIntent is priced server-side with delivery included, so its
  // breakdown is the single source of truth. Falling back to the cart only
  // happens before the quote resolves, and the pay button stays disabled then.
  const subtotal = Number(quote?.subtotal ?? cart?.subtotal ?? 0);
  const shippingCharge = Number(quote?.shippingAmount ?? 0);
  const discount = Number(quote?.discountAmount ?? cart?.discountAmount ?? 0);
  const checkoutTotal = Number(
    (quote?.totalAmount ?? Number(cart?.total || cart?.subtotal || 0) + Number(shippingCharge || 0)).toFixed(2),
  );
  const shippingCurrency = quote?.currency || "AED";

  // Payment is impossible until the delivery charge has been calculated and
  // folded into the amount, so the button is locked for the whole pricing step.
  const isShippingPending = shippingState === "loading" || shippingState === "idle";
  const isSubmitDisabled =
    !canCheckout ||
    !selectedAddressId ||
    isSubmitting ||
    isCreatingIntent ||
    isLoadingShipping ||
    shippingState !== "ready" ||
    (paymentMethod === "stripe" && (!isStripeReady || !clientSecret || !isStripeFormComplete));

  const submitLabel = isSubmitting
    ? "Processing payment..."
    : isLoadingShipping || shippingState === "idle"
      ? t("calculatingDelivery")
      : isCreatingIntent
        ? "Preparing secure payment..."
        : shippingState === "error"
          ? "Delivery charge unavailable"
          : "Pay & Place Order";

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-shell__top">
          <div className="section-header section-header--left">
            <span className="section-eyebrow">{t("checkout")}</span>
            <h1>{t("confirmOrder")}</h1>
            <p>{t("checkoutMessage")}</p>
          </div>
        </div>

        <div className="checkout-unified">
          <form id="checkout-form" className="checkout-panel checkout-panel--unified" onSubmit={onSubmit}>
            <div className="checkout-section-card">
              <div className="checkout-section-card__header">
                <span className="checkout-step">01</span>
                <div>
                  <strong>{t("shippingAddress")}</strong>
                  <p>Select the address you want to use for this order.</p>
                </div>
              </div>

              {addresses.length ? (
                <div className="address-list">
                  {addresses.map((address) => (
                    <label key={address._id} className="address-card">
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddressId === address._id}
                        onChange={(event) => setSelectedAddressId(event.target.value)}
                      />
                      <div>
                        <strong>{address.fullName}</strong>
                        <p>
                          {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.country}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="checkout-note">
                  {t("noSavedAddress")} <Link to="/profile">{t("profile")}</Link>.
                </p>
              )}
            </div>

            <div className="checkout-section-card">
              <div className="checkout-section-card__header">
                <span className="checkout-step">02</span>
                <div>
                  <strong>{t("paymentMethod")}</strong>
                  <p>Choose how you would like to complete this purchase.</p>
                </div>
              </div>

              <div className="shipping-quote" data-state={shippingState}>
                <div className="shipping-quote__icon" aria-hidden="true">
                  {shippingState === "ready" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : shippingState === "error" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16h.01" />
                    </svg>
                  ) : (
                    <span className="mini-spinner" />
                  )}
                </div>
                <div className="shipping-quote__body">
                  {shippingState === "ready" ? (
                    <>
                      <strong>Delivery charges calculated</strong>
                      <p>
                        {shippingCharge > 0
                          ? `AED ${shippingCharge.toFixed(2)} has been added to your total. Your parcel ships from our Al Ain store via Aramex.`
                          : "Delivery is free for this order. Your parcel ships from our Al Ain store via Aramex."}
                      </p>
                    </>
                  ) : shippingState === "error" ? (
                    <>
                      <strong>We could not calculate delivery charges</strong>
                      <p>
                        The Aramex rate service did not respond. Checkout is paused so you are never charged an
                        unconfirmed amount.{" "}
                        <button type="button" className="link-button" onClick={retryShipping}>
                          Try again
                        </button>
                      </p>
                    </>
                  ) : isLoadingShipping ? (
                    <>
                      <strong>Calculating delivery charges...</strong>
                      <p>Asking Aramex for the rate to your address. Payment unlocks once it is added to your total.</p>
                    </>
                  ) : (
                    <>
                      <strong>Select a delivery address</strong>
                      <p>We calculate the Aramex delivery charge for your address before you pay.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="checkout-payment-list">
                <label className="address-card">
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <div>
                    <strong>{t("stripeCard")}</strong>
                    <p>
                      {isStripeReady
                        ? "Pay securely with your card using Stripe."
                        : "Add a Stripe publishable key to enable card payments."}
                    </p>
                  </div>
                </label>
              </div>

              {paymentMethod === "stripe" ? (
                isStripeReady ? (
                  clientSecret ? (
                    <StripePaymentBlock onCompleteChange={setStripeFormComplete} />
                  ) : (
                    <p className="checkout-note">
                      {isCreatingIntent
                        ? "Preparing secure payment form..."
                        : isLoadingShipping
                          ? "Calculating delivery charges before we open the payment form..."
                          : "Select an address to continue with card payment."}
                    </p>
                  )
                ) : (
                  <p className="feedback-note">Stripe publishable key is missing from the web environment.</p>
                )
              ) : null}

              <p className="checkout-note">
                Your order is only created once the payment succeeds. Nothing is reserved or charged if the payment fails.
                Orders ship from our Al Ain store via Aramex straight after payment.
              </p>
            </div>

            {message ? <p className="feedback-note">{message}</p> : null}
          </form>

          <aside className="cart-summary checkout-summary checkout-summary--unified">
            <div className="checkout-summary__header">
              <h3>{t("orderSummary")}</h3>
              <span>{items.length} items</span>
            </div>

            <div className="checkout-summary__items">
              {items.map((item) => (
                <div key={item._id} className="checkout-summary__item">
                  <div>
                    <strong>{item.productId?.name}</strong>
                    <span>Qty {item.quantity}</span>
                  </div>
                  <strong>AED {(item.unitPrice * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className="checkout-summary__totals">
              <div>
                <span>{t("subtotal")}</span>
                <strong>{shippingCurrency} {subtotal.toFixed(2)}</strong>
              </div>
              <div>
                <span>{t("discount")}</span>
                <strong>{shippingCurrency} {discount.toFixed(2)}</strong>
              </div>
              <div className={isShippingPending ? "is-pending" : ""}>
                <span>Delivery</span>
                <strong>
                  {isShippingPending
                    ? "Calculating..."
                    : `${shippingCurrency} ${shippingCharge.toFixed(2)}`}
                </strong>
              </div>
              <div className="cart-summary__total">
                <span>{t("total")}</span>
                <strong>{shippingCurrency} {checkoutTotal.toFixed(2)}</strong>
              </div>
            </div>

            <button type="submit" form="checkout-form" className="solid-button solid-button--large checkout-summary__button" disabled={isSubmitDisabled}>
              {submitLabel}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}

// Fallback shell used while the Stripe form is still being prepared. Checkout is
// Stripe-only, so this never places an order: it only explains why payment is
// not available yet.
function StandardCheckoutContent(props) {
  const handleBlockedSubmit = (event) => {
    event.preventDefault();
  };

  return <CheckoutView {...props} isSubmitting={false} onSubmit={handleBlockedSubmit} />;
}

function StripeCheckoutContent(props) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    accessToken,
    clientSecret,
    navigate,
    notify,
    refreshSessionData,
    selectedAddressId,
    setCart,
    setMessage,
    shippingState,
    stripeIntentId,
  } = props;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // The delivery charge must be known and folded into the amount before any
    // payment is attempted, otherwise the customer would be charged a total
    // they never saw.
    if (!props.canCheckout || !selectedAddressId || shippingState !== "ready") {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      if (!clientSecret || !stripeIntentId) {
        throw new Error("Stripe payment form is not ready yet.");
      }

      if (!stripe || !elements) {
        throw new Error("Stripe is still loading. Please wait a moment and try again.");
      }

      const submitResult = await elements.submit();
      if (submitResult?.error) {
        throw new Error(submitResult.error.message || "Stripe payment details are incomplete.");
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Stripe payment could not be completed.");
      }

      if (!result.paymentIntent || result.paymentIntent.status !== "succeeded") {
        throw new Error("Stripe payment is not completed yet.");
      }

      const order = await createOrder(accessToken, {
        addressId: selectedAddressId,
        paymentMethod: "stripe",
        paymentIntentId: result.paymentIntent.id,
      });

      await refreshSessionData();
      setCart({ items: [], subtotal: 0, discountAmount: 0, total: 0 });

      const trackingNumber = order?.trackingNumber;
      const successMessage = trackingNumber
        ? `Payment received. Order ${order.orderNumber} placed and shipped via Aramex. Tracking: ${trackingNumber}`
        : `Payment received. Order ${order.orderNumber} placed and ready to ship.`;

      notify({ type: "success", message: successMessage });
      navigate("/orders", { state: { successMessage } });
    } catch (error) {
      // The order only exists once the payment succeeded, so a failure here
      // leaves the cart and any authorised payment untouched.
      const errorMessage = error.message || "Checkout could not be completed.";
      setMessage(errorMessage);
      notify({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CheckoutView {...props} isSubmitting={isSubmitting} onSubmit={handleSubmit} />;
}

function CheckoutPage() {
  const { t, language } = useLanguage();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const { accessToken, cart, user, isAuthenticated, setCart, refreshSessionData } = useShop();
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.find((item) => item.isDefault)?._id || "");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [stripeIntentId, setStripeIntentId] = useState("");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isStripeFormComplete, setIsStripeFormComplete] = useState(false);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  // "idle" -> no address yet, "loading" -> asking Aramex, "ready" -> the charge
  // is known and folded into the total, "error" -> the rate call failed.
  const [shippingState, setShippingState] = useState("idle");
  const [quote, setQuote] = useState(null);
  const [shippingAttempt, setShippingAttempt] = useState(0);
  const addresses = user?.addresses || [];
  const cartItems = cart?.items;
  const [localizedItems, setLocalizedItems] = useState([]);
  const items = pickLocalizedItems(localizedItems, cartItems);

  // Order summary product names follow the site language.
  useEffect(() => {
    let isCancelled = false;
    const source = cartItems || [];

    if (language === "en") {
      setLocalizedItems(source);
      return () => {
        isCancelled = true;
      };
    }

    translateCartItems(language, source).then((items) => {
      if (!isCancelled) setLocalizedItems(items);
    });

    return () => {
      isCancelled = true;
    };
  }, [language, cartItems]);

  const stripePromise = useMemo(() => {
    if (paymentMethod !== "stripe" || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      return null;
    }

    return loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }, [paymentMethod]);

  const canCheckout = useMemo(() => Boolean(addresses.length && items.length), [addresses.length, items.length]);

  const retryShipping = useCallback(() => {
    setShippingAttempt((attempt) => attempt + 1);
  }, []);

  // Pricing runs strictly in order: Aramex delivery charge first, then the
  // Stripe PaymentIntent. They used to fire in parallel, which let the customer
  // reach the pay button while the summary still showed a zero delivery charge
  // and let the displayed total drift from the amount Stripe actually asked for.
  useEffect(() => {
    let isCancelled = false;

    const resetPricing = () => {
      setClientSecret("");
      setStripeIntentId("");
      setIsStripeFormComplete(false);
      setIsCreatingIntent(false);
      setQuote(null);
    };

    async function priceCheckout() {
      if (paymentMethod !== "stripe" || !accessToken || !selectedAddressId || !items.length) {
        resetPricing();
        setShippingState("idle");
        return;
      }

      setMessage("");
      setIsLoadingShipping(true);
      setShippingState("loading");
      resetPricing();

      try {
        // Step 1: delivery charge. A failure here stops the flow on purpose
        // rather than letting the customer pay an unconfirmed total.
        await getAramexRate(accessToken, { addressId: selectedAddressId });
        if (isCancelled) return;

        // Step 2: only now is the payment form worth opening. The rate call
        // above is the gate; this call re-prices server-side and returns the
        // exact breakdown the PaymentIntent will be charged.
        setIsCreatingIntent(true);
        const intent = await createStripePaymentIntent(accessToken, { addressId: selectedAddressId });
        if (isCancelled) return;

        setClientSecret(intent.clientSecret || "");
        setStripeIntentId(intent.paymentIntentId || "");
        setIsStripeFormComplete(false);
        setQuote({
          subtotal: intent.subtotal,
          shippingAmount: intent.shippingAmount,
          discountAmount: intent.discountAmount,
          totalAmount: intent.totalAmount ?? intent.amount,
          currency: intent.currency || "AED",
        });
        // Flipped only once the amount is in hand, so the Delivery row never
        // flashes a zero charge while the intent is still being created.
        setIsLoadingShipping(false);
        setShippingState("ready");
      } catch (error) {
        if (isCancelled) return;
        setIsLoadingShipping(false);
        setShippingState("error");
        resetPricing();
        const errorMessage = error.message || "Unable to prepare Stripe payment.";
        setMessage(errorMessage);
        notify({ type: "error", message: errorMessage });
      } finally {
        if (!isCancelled) {
          setIsCreatingIntent(false);
        }
      }
    }

    priceCheckout();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, items.length, notify, paymentMethod, selectedAddressId, shippingAttempt]);

  if (!isAuthenticated) {
    return (
      <section className="empty-panel">
        <h1>{t("loginRequired")}</h1>
        <p>{t("viewCartLogin")}</p>
        <Link to="/login" className="solid-button">
          {t("goToLogin")}
        </Link>
      </section>
    );
  }

  const contentProps = {
    accessToken,
    addresses,
    canCheckout,
    cart,
    clientSecret,
    isCreatingIntent,
    isLoadingShipping,
    isStripeFormComplete,
    isStripeReady: Boolean(stripePromise),
    items,
    message,
    navigate,
    notify,
    paymentMethod,
    quote,
    refreshSessionData,
    retryShipping,
    selectedAddressId,
    setCart,
    setMessage,
    setPaymentMethod,
    setSelectedAddressId,
    setStripeFormComplete: setIsStripeFormComplete,
    shippingState,
    stripeIntentId,
    t,
  };

  if (paymentMethod === "stripe" && stripePromise && clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#ec4b8f",
              borderRadius: "14px",
            },
          },
        }}
      >
        <StripeCheckoutContent {...contentProps} />
      </Elements>
    );
  }

  return <StandardCheckoutContent {...contentProps} />;
}

export { CheckoutPage };
