import { request } from "./client";

async function getCart(token) {
  const response = await request("/cart", { token });
  return response.data;
}

async function addCartItem(token, payload) {
  const response = await request("/cart/items", {
    method: "POST",
    token,
    body: payload,
  });

  return response.data;
}

async function updateCartItem(token, itemId, payload) {
  const response = await request(`/cart/items/${itemId}`, {
    method: "PATCH",
    token,
    body: payload,
  });

  return response.data;
}

async function removeCartItem(token, itemId) {
  const response = await request(`/cart/items/${itemId}`, {
    method: "DELETE",
    token,
  });

  return response.data;
}

async function applyCoupon(token, payload) {
  const response = await request("/cart/coupon", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function removeCoupon(token) {
  const response = await request("/cart/coupon", {
    method: "DELETE",
    token,
  });
  return response.data;
}

async function clearCart(token) {
  const response = await request("/cart", {
    method: "DELETE",
    token,
  });
  return response.data;
}

export { getCart, addCartItem, updateCartItem, removeCartItem, applyCoupon, removeCoupon, clearCart };
