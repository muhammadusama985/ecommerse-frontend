import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback(({ type = "info", message }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((current) => [...current, { id, type, message }]);

    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notify,
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div key={notification.id} className={`toast toast--${notification.type}`}>
            <div className="toast__content">
              <strong className="toast__title">
                {notification.type === "success" ? "Success" : notification.type === "error" ? "Error" : "Notice"}
              </strong>
              <p>{notification.message}</p>
            </div>
            <button type="button" className="toast__close" onClick={() => dismiss(notification.id)} aria-label="Close alert">
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export { NotificationProvider, useNotifications };
