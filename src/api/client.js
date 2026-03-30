import { clearStoredSession, getStoredRefreshToken, getStoredUser, setStoredSession } from "../lib/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE_URL = API_URL.replace(/\/api$/, "");
let refreshPromise = null;

function mediaUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  const createHeaders = (token) => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  });

  const runRequest = (token) =>
    fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: createHeaders(token),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

  const refreshSession = async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      const refreshToken = getStoredRefreshToken();
      const currentUser = getStoredUser();

      if (!refreshToken) {
        throw new Error("Session expired. Please login again.");
      }

      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken,
          portal: currentUser?.role === "admin" ? "admin" : "customer",
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Session expired. Please login again.");
      }

      const payload = await refreshResponse.json();
      setStoredSession(payload.data);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shop:session-refreshed", { detail: payload.data }));
      }

      return payload.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  };

  let response = await runRequest(options.token);

  if (response.status === 401 && !path.startsWith("/auth/") && options.allowRefresh !== false) {
    try {
      const nextAccessToken = await refreshSession();
      response = await runRequest(nextAccessToken);
    } catch {
      clearStoredSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shop:unauthorized"));
      }
    }
  }

  if (!response.ok) {
    let message = `Request failed for ${path}`;

    try {
      const errorPayload = await response.json();
      message = errorPayload.message || message;
    } catch {
      // Keep fallback message if parsing fails.
    }

    throw new Error(message);
  }

  return response.json();
}

export { API_URL, API_BASE_URL, mediaUrl, request };
