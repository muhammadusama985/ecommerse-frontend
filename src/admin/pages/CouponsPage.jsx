import { useEffect, useState } from "react";
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  expiresAt: "",
};

function CouponsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState("");

  useEffect(() => {
    getCoupons(accessToken).then(setCoupons).catch(() => setCoupons([]));
  }, [accessToken]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCouponId("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCouponId(coupon._id);
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? 10,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      const coupon = editingCouponId
        ? await updateCoupon(accessToken, editingCouponId, payload)
        : await createCoupon(accessToken, payload);

      setCoupons((current) =>
        editingCouponId ? current.map((item) => (item._id === editingCouponId ? coupon : item)) : [coupon, ...current],
      );
      notify({ type: "success", message: editingCouponId ? t("couponUpdatedSuccess") : t("couponCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || (editingCouponId ? t("couldNotUpdateCoupon") : t("couldNotCreateCoupon")) });
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
        <button type="button" className="admin-button" onClick={openCreateModal}>
          {t("addCoupon")}
        </button>
      </div>
      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--coupon">
            <span>{t("code")}</span>
            <span>{t("type")}</span>
            <span>{t("value")}</span>
            <span>{t("expiresAtLabel")}</span>
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
              <span>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : t("noExpiry")}</span>
              <div className="admin-actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => openEditModal(coupon)}>
                  {t("edit")}
                </button>
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
                <h3>{editingCouponId ? t("editCouponTitle") : t("addCouponTitle")}</h3>
                <p>{editingCouponId ? t("editCouponCopy") : t("addCouponCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => { resetForm(); setShowModal(false); }}>
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

              <label>
                {t("expiresAtLabel")}
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                />
              </label>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => { resetForm(); setShowModal(false); }}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : editingCouponId ? t("saveChanges") : t("createCouponCta")}
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
