import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../api/auth";
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from "../lib/session";

const AdminContext = createContext(null);

function AdminProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  // The dashboard and every list wait on this identity check before fetching
  // their own data, so a stale session never renders a flash of empty tables.
  const [isVerifyingSession, setIsVerifyingSession] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    if (!accessToken) {
      setIsVerifyingSession(false);
      return;
    }

    let isCancelled = false;
    setIsVerifyingSession(true);

    getCurrentUser(accessToken)
      .then((result) => {
        if (isCancelled) return;
        if (result.role !== "admin") {
          throw new Error("Admin access required.");
        }
        setUser(result);
      })
      .catch(() => {
        if (isCancelled) return;
        clearStoredSession();
        setAccessToken("");
        setUser(null);
      })
      .finally(() => {
        if (!isCancelled) setIsVerifyingSession(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredSession();
      setAccessToken("");
      setUser(null);
    };

    const handleSessionRefresh = (event) => {
      const session = event.detail;
      if (!session?.accessToken) {
        return;
      }

      setAccessToken(session.accessToken);
      setUser(session.user || null);
    };

    window.addEventListener("admin:unauthorized", handleUnauthorized);
    window.addEventListener("admin:session-refreshed", handleSessionRefresh);
    return () => {
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
      window.removeEventListener("admin:session-refreshed", handleSessionRefresh);
    };
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user?.role === "admin"),
      isVerifyingSession,
      setSession(session) {
        setStoredSession(session);
        setAccessToken(session.accessToken);
        setUser(session.user);
      },
      logout() {
        clearStoredSession();
        setAccessToken("");
        setUser(null);
      },
    }),
    [accessToken, user, isVerifyingSession],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }

  return context;
}

export { AdminProvider, useAdmin };
