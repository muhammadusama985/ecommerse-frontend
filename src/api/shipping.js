import { request } from "./client";

async function getAramexRate(token, payload) {
  const response = await request("/shipping/aramex/rate", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function trackOrderShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/tracking`, { token });
  return response.data;
}

async function trackOrderReturnShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/return-tracking`, { token });
  return response.data;
}

export { getAramexRate, trackOrderShipment, trackOrderReturnShipment };
