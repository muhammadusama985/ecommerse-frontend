import { request } from "./client";

async function listProducts(query = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const response = await request(`/products${suffix}`);
  return response.data;
}

async function getProductDetail(slug) {
  const response = await request(`/products/${slug}`);
  return response.data;
}

async function createReview(token, payload) {
  const response = await request("/reviews", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export { listProducts, getProductDetail, createReview };
