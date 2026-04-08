import { request } from "./client";

async function getHomePageData() {
  const response = await request("/storefront/home");
  return response.data;
}

async function getBestSellerPageData() {
  const response = await request("/storefront/best-sellers");
  return response.data;
}

async function getStoreCategories() {
  const response = await request("/categories");
  return response.data;
}

export { getHomePageData, getBestSellerPageData, getStoreCategories };
