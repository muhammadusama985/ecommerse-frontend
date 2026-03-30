import { useEffect, useState } from "react";
import { createCoupon, deleteCoupon, getCoupons } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
};

function CouponsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCoupons(accessToken).then(setCoupons).catch(() => setCoupons([]));
  }, [accessToken]);

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const coupon = await createCoupon(accessToken, {
        ...form,
        discountValue: Number(form.discountValue),
      });

      setCoupons((current) => [coupon, ...current]);
      notify({ type: "success", message: t("couponCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotCreateCoupon") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    const accepted = await confirm({
      title: t("deleteCouponTitle"),
      message: t("deleteCouponConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!accepted) return;

    await deleteCoupon(accessToken, couponId);
    setCoupons((current) => current.filter((coupon) => coupon._id !== couponId));
    notify({ type: "success", message: t("couponRemovedSuccess") });
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("coupons")}</h2>
          <p>{t("couponsPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addCoupon")}
        </button>
      </div>
      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--coupon">
            <span>{t("code")}</span>
            <span>{t("type")}</span>
            <span>{t("value")}</span>
            <span>{t("actions")}</span>
          </div>
          {!coupons.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {coupons.map((coupon) => (
            <article key={coupon._id} className="admin-table__row admin-table__row--coupon">
              <div className="admin-row-copy">
                <strong>{coupon.code}</strong>
                <p>{coupon.discountType === "percentage" ? t("percentageDiscount") : t("fixedDiscount")}</p>
              </div>
              <span>{coupon.discountType}</span>
              <span>
                {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `AED ${Number(coupon.discountValue).toFixed(2)}`}
              </span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--danger"
                  onClick={() => handleDelete(coupon._id)}
                >
                  {t("delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showModal ? (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>{t("addCouponTitle")}</h3>
                <p>{t("addCouponCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("couponCodeLabel")}
                  <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} required />
                </label>
                <label>
                  {t("discountType")}
                  <select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}>
                    <option value="percentage">{t("percentage")}</option>
                    <option value="fixed">{t("fixed")}</option>
                  </select>
                </label>
              </div>

              <label>
                {t("discountValue")}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                  required
                />
              </label>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowModal(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("createCouponCta")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CouponsPage };
