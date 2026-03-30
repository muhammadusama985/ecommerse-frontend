import { request } from "./client";

async function getBlogPosts() {
  const response = await request("/content/blog");
  return response.data;
}

async function getBlogPost(slug) {
  const response = await request(`/content/blog/${slug}`);
  return response.data;
}

async function getPage(slug) {
  const response = await request(`/content/pages/${slug}`);
  return response.data;
}

async function getBanners() {
  const response = await request("/content/banners");
  return response.data;
}

export { getBlogPosts, getBlogPost, getPage, getBanners };
