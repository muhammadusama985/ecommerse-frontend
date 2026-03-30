import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../api/auth";
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from "../lib/session";

const AdminContext = createContext(null);

function AdminProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getCurrentUser(accessToken)
      .then((result) => {
        if (result.role !== "admin") {
          throw new Error("Admin access required.");
        }
        setUser(result);
      })
      .catch(() => {
        clearStoredSession();
        setAccessToken("");
        setUser(null);
      });
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
    [accessToken, user],
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
