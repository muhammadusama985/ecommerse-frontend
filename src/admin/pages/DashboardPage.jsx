import { useEffect, useState } from "react";
import { getDashboard } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";

function DashboardPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard(accessToken).then(setData).catch(() => setData(null));
  }, [accessToken]);

  if (!data) {
    return <div className="admin-panel">{t("loadingDashboard")}</div>;
  }

  return (
    <div className="admin-stack">
      <section className="stats-grid">
        <article className="stat-card">
          <span>{t("users")}</span>
          <strong>{data.usersCount}</strong>
          <small className="stat-card__meta">{t("totalRegisteredUsers")}</small>
        </article>
        <article className="stat-card">
          <span>{t("products")}</span>
          <strong>{data.productsCount}</strong>
          <small className="stat-card__meta">{t("totalCatalogProducts")}</small>
        </article>
        <article className="stat-card">
          <span>{t("orders")}</span>
          <strong>{data.ordersCount}</strong>
          <small className="stat-card__meta">{t("totalOrdersReceived")}</small>
        </article>
        <article className="stat-card">
          <span>{t("revenue")}</span>
          <strong>AED {Number(data.totalRevenue || 0).toFixed(2)}</strong>
          <small className="stat-card__meta">{t("totalRecognizedRevenue")}</small>
        </article>
        <article className="stat-card stat-card--success">
          <span>{t("stripeRevenue")}</span>
          <strong>AED {Number(data.stripeRevenue || 0).toFixed(2)}</strong>
          <small className="stat-card__meta">{t("revenueFromOnlinePayments")}</small>
        </article>
        <article className="stat-card">
          <span>{t("codRevenue")}</span>
          <strong>AED {Number(data.codRevenue || 0).toFixed(2)}</strong>
          <small className="stat-card__meta">{t("revenueFromDeliveredCodOrders")}</small>
        </article>
        <article className="stat-card stat-card--danger">
          <span>{t("cancelledOrders")}</span>
          <strong>{data.cancelledOrdersCount || 0}</strong>
          <small className="stat-card__meta">{t("totalCancelledOrders")}</small>
        </article>
        <article className="stat-card stat-card--danger">
          <span>{t("cancelledByAdmin")}</span>
          <strong>{data.cancelledByAdminCount || 0}</strong>
          <small className="stat-card__meta">{t("cancelledFromAdminDashboard")}</small>
        </article>
        <article className="stat-card stat-card--danger">
          <span>{t("cancelledByCustomer")}</span>
          <strong>{data.cancelledByCustomerCount || 0}</strong>
          <small className="stat-card__meta">{t("cancelledByCustomers")}</small>
        </article>
        <article className="stat-card stat-card--warning">
          <span>{t("outOfStock")}</span>
          <strong>{data.outOfStockCount || 0}</strong>
          <small className="stat-card__meta">{t("productsBlockedFromCheckout")}</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h3>{t("lowInventoryAlerts")}</h3>
            <p>{t("inventoryAlertsCopy")}</p>
          </div>
        </div>
        {!data.outOfStockProducts?.length ? (
          <div className="admin-table__empty">{t("noProductsOutOfStock")}</div>
        ) : (
          <div className="admin-scroll-region admin-scroll-region--alerts">
            <div className="admin-alert-list">
              {data.outOfStockProducts.map((product) => (
                <article key={product._id} className="admin-alert-card">
                  <strong>{product.name}</strong>
                  <span>{t("stockZero")}</span>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="admin-panel admin-table-card">
        <div className="admin-table__head admin-table__row admin-table__row--dashboard-order">
          <span>{t("order")}</span>
          <span>{t("customer")}</span>
          <span>{t("status")}</span>
          <span>{t("total")}</span>
        </div>

        <div className="admin-scroll-region admin-scroll-region--orders">
          <div className="admin-table admin-table--dashboard">
            {!data.recentOrders.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
            {data.recentOrders.map((order) => (
              <article key={order._id} className="admin-table__row admin-table__row--dashboard-order">
                <span>{order.orderNumber}</span>
                <span>{order.userId?.email}</span>
                <span>{order.orderStatus}</span>
                <strong>AED {Number(order.totalAmount).toFixed(2)}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export { DashboardPage };
