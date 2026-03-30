import { request } from "./client";

async function getProfile(token) {
  const response = await request("/users/me", { token });
  return response.data;
}

async function updateProfile(token, payload) {
  const response = await request("/users/me", {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function addAddress(token, payload) {
  const response = await request("/users/addresses", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function removeAddress(token, addressId) {
  const response = await request(`/users/addresses/${addressId}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}

async function getWishlist(token) {
  const response = await request("/users/wishlist", { token });
  return response.data;
}

async function addWishlistItem(token, productId) {
  const response = await request(`/users/wishlist/${productId}`, {
    method: "POST",
    token,
  });
  return response.data;
}

async function removeWishlistItem(token, productId) {
  const response = await request(`/users/wishlist/${productId}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}

export {
  getProfile,
  updateProfile,
  addAddress,
  removeAddress,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
};
