import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const AdminNotificationContext = createContext(null);

function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const resolverRef = useRef(null);

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

  const confirm = useCallback(({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmation({ title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const closeConfirmation = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setConfirmation(null);
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}

      <div className="admin-toast-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div key={notification.id} className={`admin-toast admin-toast--${notification.type}`}>
            <div className="admin-toast__content">
              <strong className="admin-toast__title">
                {notification.type === "success" ? "Success" : notification.type === "error" ? "Error" : "Notice"}
              </strong>
              <p>{notification.message}</p>
            </div>
            <button type="button" className="admin-toast__close" onClick={() => dismiss(notification.id)} aria-label="Close alert">
              x
            </button>
          </div>
        ))}
      </div>

      {confirmation ? (
        <div className="admin-modal-backdrop" onClick={() => closeConfirmation(false)}>
          <div className="admin-modal admin-modal--confirm" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>{confirmation.title}</h3>
                <p>{confirmation.message}</p>
              </div>
            </div>
            <div className="admin-form__actions">
              <button type="button" className="admin-button admin-button--ghost" onClick={() => closeConfirmation(false)}>
                {confirmation.cancelLabel}
              </button>
              <button
                type="button"
                className={`admin-button${confirmation.danger ? " admin-button--danger-solid" : ""}`}
                onClick={() => closeConfirmation(true)}
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminNotificationContext.Provider>
  );
}

function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationProvider");
  }
  return context;
}

export { AdminNotificationProvider, useAdminNotifications };
