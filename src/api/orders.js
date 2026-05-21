import { request } from "./client";

async function getMyOrders(token) {
  const response = await request("/orders/mine", { token });
  return response.data;
}

async function createStripePaymentIntent(token, payload) {
  const response = await request("/orders/stripe/payment-intent", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function createOrder(token, payload) {
  const response = await request("/orders", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function cancelOrder(token, orderId) {
  const response = await request(`/orders/${orderId}/cancel`, {
    method: "PATCH",
    token,
    body: {},
  });
  return response.data;
}

async function requestReturn(token, orderId, payload) {
  const response = await request(`/orders/${orderId}/return-status`, {
    method: "PATCH",
    token,
    body: {
      returnStatus: "requested",
      returnReason: payload.returnReason,
      returnDetails: payload.returnDetails || undefined,
      refundAccountHolderName: payload.refundAccountHolderName || undefined,
      refundBankName: payload.refundBankName || undefined,
      refundAccountNumber: payload.refundAccountNumber || undefined,
      refundIban: payload.refundIban || undefined,
    },
  });
  return response.data;
}

export { getMyOrders, createOrder, createStripePaymentIntent, cancelOrder, requestReturn };
