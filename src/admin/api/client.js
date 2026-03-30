import { clearStoredSession, getStoredRefreshToken, setStoredSession } from "../lib/session";

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
      if (!refreshToken) {
        throw new Error("Session expired. Please login again.");
      }

      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken,
          portal: "admin",
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Session expired. Please login again.");
      }

      const payload = await refreshResponse.json();
      setStoredSession(payload.data);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("admin:session-refreshed", { detail: payload.data }));
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
        window.dispatchEvent(new CustomEvent("admin:unauthorized"));
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin:unauthorized"));
    }

    let message = `Request failed for ${path}`;

    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // fall back to default message
    }

    throw new Error(message);
  }

  return response.json();
}

async function uploadImage(token, folder, file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/uploads/${folder}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    let message = `Image upload failed for ${folder}`;

    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // keep fallback
    }

    throw new Error(message);
  }

  return response.json();
}

export { API_URL, API_BASE_URL, mediaUrl, request, uploadImage };
