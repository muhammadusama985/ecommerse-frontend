import { request } from "./client";

async function getHomePageData() {
  const response = await request("/storefront/home");
  return response.data;
}

async function getBestSellerPageData() {
  const response = await request("/storefront/best-sellers");
  return response.data;
}

export { getHomePageData, getBestSellerPageData };
