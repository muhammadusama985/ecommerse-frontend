import { request } from "./client";

async function login(payload, portal = "admin") {
  const response = await request("/auth/login", {
    method: "POST",
    body: { ...payload, portal },
  });

  return response.data;
}

async function getCurrentUser(token) {
  const response = await request("/auth/me", { token });
  return response.data;
}

async function refreshAuthSession(refreshToken, portal = "admin") {
  const response = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken, portal },
  });
  return response.data;
}

export { login, getCurrentUser, refreshAuthSession };
