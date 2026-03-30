import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCart as fetchCart } from "../api/cart";
import { getCurrentUser } from "../api/auth";
import { getWishlist as fetchWishlist } from "../api/users";
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from "../lib/session";

const ShopContext = createContext(null);

function ShopProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  const refreshSessionData = async (token = accessToken) => {
    if (!token) {
      return;
    }

    const [userResponse, cartResponse, wishlistResponse] = await Promise.all([
      getCurrentUser(token),
      fetchCart(token),
      fetchWishlist(token),
    ]);

    setUser(userResponse);
    setCart(cartResponse);
    setWishlist(wishlistResponse);
  };

  useEffect(() => {
    if (!accessToken) {
      setCart(null);
      setWishlist([]);
      return;
    }

    refreshSessionData(accessToken)
      .catch(() => {
        clearStoredSession();
        setAccessToken("");
        setUser(null);
        setCart(null);
        setWishlist([]);
      });
  }, [accessToken]);

  useEffect(() => {
    const handleSessionRefresh = (event) => {
      const session = event.detail;
      if (!session?.accessToken) {
        return;
      }

      setAccessToken(session.accessToken);
      setUser(session.user || null);
    };

    const handleUnauthorized = () => {
      clearStoredSession();
      setAccessToken("");
      setUser(null);
      setCart(null);
      setWishlist([]);
    };

    window.addEventListener("shop:session-refreshed", handleSessionRefresh);
    window.addEventListener("shop:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("shop:session-refreshed", handleSessionRefresh);
      window.removeEventListener("shop:unauthorized", handleUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      cart,
      wishlist,
      isAuthenticated: Boolean(accessToken && user),
      setSession(session) {
        setStoredSession(session);
        setAccessToken(session.accessToken);
        setUser(session.user);
      },
      clearSession() {
        clearStoredSession();
        setAccessToken("");
        setUser(null);
        setCart(null);
        setWishlist([]);
      },
      setCart,
      setUser,
      setWishlist,
      refreshSessionData,
    }),
    [accessToken, user, cart, wishlist],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }

  return context;
}

export { ShopProvider, useShop };
