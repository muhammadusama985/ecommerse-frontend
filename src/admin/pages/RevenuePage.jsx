import { useEffect, useMemo, useState } from "react";
import { getRevenueRecords } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";

function RevenuePage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueRecords(accessToken)
      .then((data) => setRecords(data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const summary = useMemo(
    () =>
      records.reduce(
        (accumulator, record) => {
          if (record.type === "recognized") {
            accumulator.recognized += Number(record.amount || 0);
          }

          if (record.type === "cancelled") {
            accumulator.cancelled += Number(record.amount || 0);
          }

          accumulator.net = accumulator.recognized - accumulator.cancelled;
          return accumulator;
        },
        { recognized: 0, cancelled: 0, net: 0 },
      ),
    [records],
  );

  if (loading) {
    return <div className="admin-panel">{t("loadingRevenue")}</div>;
  }

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("revenue")}</h2>
          <p>{t("revenuePageCopy")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card stat-card--success">
          <span>{t("revenueAdded")}</span>
          <strong>AED {summary.recognized.toFixed(2)}</strong>
        </article>
        <article className="stat-card stat-card--danger">
          <span>{t("revenueRemoved")}</span>
          <strong>AED {summary.cancelled.toFixed(2)}</strong>
        </article>
        <article className="stat-card">
          <span>{t("netRevenue")}</span>
          <strong>AED {summary.net.toFixed(2)}</strong>
        </article>
      </section>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--revenue">
            <span>{t("date")}</span>
            <span>{t("type")}</span>
            <span>{t("order")}</span>
            <span>{t("customer")}</span>
            <span>{t("method")}</span>
            <span>{t("amount")}</span>
          </div>
          {!records.length ? <div className="admin-table__empty">{t("noRevenueActivity")}</div> : null}
          {records.map((record) => (
            <article key={record.id} className="admin-table__row admin-table__row--revenue">
              <span>{new Date(record.date).toLocaleString()}</span>
              <span>
                <strong className={record.type === "recognized" ? "admin-revenue-type admin-revenue-type--positive" : "admin-revenue-type admin-revenue-type--negative"}>
                  {record.type === "recognized" ? t("revenueAdded") : t("revenueRemoved")}
                </strong>
                {record.cancelledBy ? <p>{t("cancelledByLine", { actor: record.cancelledBy })}</p> : null}
              </span>
              <span>{record.orderNumber}</span>
              <span>{record.customer}</span>
              <span>{record.paymentMethod}</span>
              <span>
                <strong>{record.type === "recognized" ? "+" : "-"}AED {Number(record.amount || 0).toFixed(2)}</strong>
                <p>
                  {record.type === "recognized"
                    ? record.paymentMethod === "stripe"
                      ? t("revenueRecordedStripe")
                      : t("revenueRecordedCod")
                    : record.paymentMethod === "stripe"
                      ? t("revenueRemovedStripe")
                      : t("revenueRemovedCod")}
                </p>
              </span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export { RevenuePage };
