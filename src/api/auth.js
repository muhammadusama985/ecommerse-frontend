import { request } from "./client";

async function login(payload, portal = "customer") {
  const response = await request("/auth/login", {
    method: "POST",
    body: { ...payload, portal },
  });

  return response.data;
}

async function register(payload) {
  const response = await request("/auth/register", {
    method: "POST",
    body: payload,
  });

  return response.data;
}

async function socialLogin(payload, portal = "customer") {
  const response = await request("/auth/social", {
    method: "POST",
    body: { ...payload, portal },
  });

  return response.data;
}

async function getCurrentUser(token) {
  const response = await request("/auth/me", { token });
  return response.data;
}

async function refreshAuthSession(refreshToken, portal = "customer") {
  const response = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken, portal },
  });
  return response.data;
}

async function forgotPassword(payload) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

async function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export { login, register, socialLogin, getCurrentUser, refreshAuthSession, forgotPassword, resetPassword };
