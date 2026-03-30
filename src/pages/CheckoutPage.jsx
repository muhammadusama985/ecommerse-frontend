import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createOrder, createStripePaymentIntent } from "../api/orders";
import { getAramexRate } from "../api/shipping";
import { useLanguage } from "../context/LanguageContext";
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
  isStripeFormComplete,
  isStripeReady,
  isSubmitting,
  items,
  message,
  onSubmit,
  paymentMethod,
  shippingAmount,
  shippingCurrency,
  selectedAddressId,
  setPaymentMethod,
  setSelectedAddressId,
  setStripeFormComplete,
  t,
}) {
  const checkoutTotal = Number((Number(cart?.total || cart?.subtotal || 0) + Number(shippingAmount || 0)).toFixed(2));
  const isSubmitDisabled =
    !canCheckout ||
    !selectedAddressId ||
    isSubmitting ||
    isCreatingIntent ||
    (paymentMethod === "stripe" && (!isStripeReady || !clientSecret || !isStripeFormComplete));

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
                          {address.addressLine1}, {address.city}, {address.country}
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

              <div className="checkout-payment-list">
                <label className="address-card">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <div>
                    <strong>{t("cashOnDelivery")}</strong>
                    <p>{t("codAvailable")}</p>
                  </div>
                </label>

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
                      {isCreatingIntent ? "Preparing secure payment form..." : "Select an address to continue with card payment."}
                    </p>
                  )
                ) : (
                  <p className="feedback-note">Stripe publishable key is missing from the web environment.</p>
                )
              ) : null}
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
                <strong>AED {Number(cart?.subtotal || 0).toFixed(2)}</strong>
              </div>
              <div>
                <span>{t("discount")}</span>
                <strong>AED {Number(cart?.discountAmount || 0).toFixed(2)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>{shippingCurrency} {Number(shippingAmount || 0).toFixed(2)}</strong>
              </div>
              <div className="cart-summary__total">
                <span>{t("total")}</span>
                <strong>{shippingCurrency} {checkoutTotal.toFixed(2)}</strong>
              </div>
            </div>

            <button type="submit" form="checkout-form" className="solid-button solid-button--large checkout-summary__button" disabled={isSubmitDisabled}>
              {isSubmitting ? "Processing..." : paymentMethod === "stripe" ? "Pay Now" : t("placeOrder")}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}

function StandardCheckoutContent(props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    accessToken,
    navigate,
    notify,
    paymentMethod,
    refreshSessionData,
    selectedAddressId,
    setCart,
    setMessage,
  } = props;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!props.canCheckout || !selectedAddressId) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const order = await createOrder(accessToken, {
        addressId: selectedAddressId,
        paymentMethod,
      });

      await refreshSessionData();
      setCart({ items: [], subtotal: 0, discountAmount: 0, total: 0 });
      notify({ type: "success", message: `Order ${order.orderNumber} placed successfully.` });
      navigate("/orders", { state: { successMessage: `Order ${order.orderNumber} placed successfully.` } });
    } catch (error) {
      const errorMessage = error.message || "Checkout could not be completed.";
      setMessage(errorMessage);
      notify({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CheckoutView {...props} isSubmitting={isSubmitting} onSubmit={handleSubmit} />;
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
    stripeIntentId,
  } = props;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!props.canCheckout || !selectedAddressId) {
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
      notify({ type: "success", message: `Order ${order.orderNumber} placed successfully.` });
      navigate("/orders", { state: { successMessage: `Order ${order.orderNumber} placed successfully.` } });
    } catch (error) {
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
  const { t } = useLanguage();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const { accessToken, cart, user, isAuthenticated, setCart, refreshSessionData } = useShop();
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.find((item) => item.isDefault)?._id || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [stripeIntentId, setStripeIntentId] = useState("");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isStripeFormComplete, setStripeFormComplete] = useState(false);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [shippingCurrency, setShippingCurrency] = useState("AED");
  const addresses = user?.addresses || [];
  const items = cart?.items || [];
  const stripePromise = useMemo(() => {
    if (paymentMethod !== "stripe" || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      return null;
    }

    return loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }, [paymentMethod]);

  const canCheckout = useMemo(() => Boolean(addresses.length && items.length), [addresses.length, items.length]);

  useEffect(() => {
    let isCancelled = false;

    async function loadShippingRate() {
      if (!accessToken || !selectedAddressId || !items.length) {
        setShippingAmount(0);
        setShippingCurrency("AED");
        return;
      }

      try {
        const quote = await getAramexRate(accessToken, { addressId: selectedAddressId });
        if (!isCancelled) {
          setShippingAmount(Number(quote.shippingAmount || 0));
          setShippingCurrency(quote.currency || "AED");
        }
      } catch {
        if (!isCancelled) {
          setShippingAmount(0);
          setShippingCurrency("AED");
        }
      }
    }

    async function setupStripeIntent() {
      if (
        paymentMethod !== "stripe" ||
        !accessToken ||
        !selectedAddressId ||
        !items.length
      ) {
        setClientSecret("");
        setStripeIntentId("");
        setStripeFormComplete(false);
        return;
      }

      setIsCreatingIntent(true);
      setMessage("");

      try {
        const intent = await createStripePaymentIntent(accessToken, { addressId: selectedAddressId });
        if (!isCancelled) {
          setClientSecret(intent.clientSecret || "");
          setStripeIntentId(intent.paymentIntentId || "");
          setStripeFormComplete(false);
        }
      } catch (error) {
        if (!isCancelled) {
          const errorMessage = error.message || "Unable to prepare Stripe payment.";
          setMessage(errorMessage);
          setClientSecret("");
          setStripeIntentId("");
          setStripeFormComplete(false);
          notify({ type: "error", message: errorMessage });
        }
      } finally {
        if (!isCancelled) {
          setIsCreatingIntent(false);
        }
      }
    }

    loadShippingRate();
    setupStripeIntent();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, items.length, notify, paymentMethod, selectedAddressId]);

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
    isStripeFormComplete,
    isStripeReady: Boolean(stripePromise),
    items,
    message,
    navigate,
    notify,
    paymentMethod,
    refreshSessionData,
    selectedAddressId,
    setCart,
    setMessage,
    setPaymentMethod,
    setSelectedAddressId,
    setStripeFormComplete,
    shippingAmount,
    shippingCurrency,
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
