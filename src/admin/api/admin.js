import { request, uploadImage } from "./client";

async function getDashboard(token) {
  const response = await request("/admin/dashboard", { token });
  return response.data;
}

async function getRevenueRecords(token) {
  const response = await request("/admin/revenue", { token });
  return response.data;
}

async function getUsers(token) {
  const response = await request("/admin/users", { token });
  return response.data;
}

async function getProducts(token) {
  const response = await request("/admin/products", { token });
  return response.data;
}

async function createProduct(token, payload) {
  const response = await request("/products", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function updateProduct(token, productId, payload) {
  const response = await request(`/products/${productId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function getCategories(token) {
  const response = await request("/categories", { token });
  return response.data;
}

async function createCategory(token, payload) {
  const response = await request("/categories", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function updateCategory(token, categoryId, payload) {
  const response = await request(`/categories/${categoryId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteCategory(token, categoryId) {
  return request(`/categories/${categoryId}`, {
    method: "DELETE",
    token,
  });
}

async function uploadAdminImage(token, folder, file) {
  const response = await uploadImage(token, folder, file);
  return response.data;
}

async function getCoupons(token) {
  const response = await request("/coupons", { token });
  return response.data;
}

async function createCoupon(token, payload) {
  const response = await request("/coupons", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function updateCoupon(token, couponId, payload) {
  const response = await request(`/coupons/${couponId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteCoupon(token, couponId) {
  return request(`/coupons/${couponId}`, {
    method: "DELETE",
    token,
  });
}

async function getBlogPosts(token) {
  const response = await request("/admin/content/blog", { token });
  return response.data;
}

async function createBlogPost(token, payload) {
  const response = await request("/admin/content/blog", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteBlogPost(token, postId) {
  return request(`/admin/content/blog/${postId}`, {
    method: "DELETE",
    token,
  });
}

async function getPages(token) {
  const response = await request("/admin/content/pages", { token });
  return response.data;
}

async function createPage(token, payload) {
  const response = await request("/admin/content/pages", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function deletePage(token, pageId) {
  return request(`/admin/content/pages/${pageId}`, {
    method: "DELETE",
    token,
  });
}

async function getBanners(token) {
  const response = await request("/admin/content/banners", { token });
  return response.data;
}

async function createBanner(token, payload) {
  const response = await request("/admin/content/banners", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function updateBanner(token, bannerId, payload) {
  const response = await request(`/admin/content/banners/${bannerId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteBanner(token, bannerId) {
  return request(`/admin/content/banners/${bannerId}`, {
    method: "DELETE",
    token,
  });
}

async function getSettings(token) {
  const response = await request("/admin/content/settings", { token });
  return response.data;
}

async function createUser(token, payload) {
  const response = await request("/admin/users", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

async function updateUser(token, userId, payload) {
  const response = await request(`/admin/users/${userId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteUser(token, userId) {
  return request(`/admin/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

async function updateSetting(token, key, value) {
  const response = await request(`/admin/content/settings/${key}`, {
    method: "PUT",
    token,
    body: { value },
  });
  return response.data;
}

async function deleteProduct(token, productId) {
  const response = await request(`/admin/products/${productId}`, {
    method: "DELETE",
    token,
  });
  return response;
}

async function getReviews(token) {
  const response = await request("/admin/reviews", { token });
  return response.data;
}

async function updateReview(token, reviewId, payload) {
  const response = await request(`/admin/reviews/${reviewId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function deleteReview(token, reviewId) {
  return request(`/admin/reviews/${reviewId}`, {
    method: "DELETE",
    token,
  });
}

async function getOrders(token) {
  const response = await request("/orders", { token });
  return response.data;
}

async function updateOrderStatus(token, orderId, payload) {
  const response = await request(`/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function createOrderShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/shipment`, {
    method: "POST",
    token,
    body: {},
  });
  return response.data;
}

async function createOrderReturnShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/return-shipment`, {
    method: "POST",
    token,
    body: {},
  });
  return response.data;
}

async function trackOrderShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/tracking`, {
    token,
  });
  return response.data.order;
}

async function trackOrderReturnShipment(token, orderId) {
  const response = await request(`/shipping/aramex/orders/${orderId}/return-tracking`, {
    token,
  });
  return response.data.order;
}

async function updateOrderShipping(token, orderId, payload) {
  const response = await request(`/orders/${orderId}/shipping`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

async function updateOrderReturnStatus(token, orderId, payload) {
  const response = await request(`/orders/${orderId}/return-status`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return response.data;
}

export {
  getDashboard,
  getRevenueRecords,
  getUsers,
  getProducts,
  createProduct,
  updateProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadAdminImage,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getBlogPosts,
  createBlogPost,
  deleteBlogPost,
  getPages,
  createPage,
  deletePage,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getSettings,
  updateSetting,
  createUser,
  updateUser,
  deleteUser,
  deleteProduct,
  getReviews,
  updateReview,
  deleteReview,
  getOrders,
  updateOrderStatus,
  createOrderShipment,
  createOrderReturnShipment,
  trackOrderShipment,
  trackOrderReturnShipment,
  updateOrderShipping,
  updateOrderReturnStatus,
};
