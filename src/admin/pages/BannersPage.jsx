import { useEffect, useState } from "react";
import { mediaUrl } from "../api/client";
import { createBanner, deleteBanner, getBanners, updateBanner, uploadAdminImage } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  placement: "hero",
  sortOrder: "",
  startDate: "",
  endDate: "",
};

function BannersPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState("");

  useEffect(() => {
    getBanners(accessToken).then(setBanners).catch(() => setBanners([]));
  }, [accessToken]);

  useEffect(() => {
    if (!selectedImage) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedImage(null);
    setPreview("");
    setEditingBannerId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let image = "";
      if (selectedImage) {
        const uploaded = await uploadAdminImage(accessToken, "banners", selectedImage);
        image = uploaded.path;
      }

      const payload = {
        ...form,
        ...(image ? { image } : {}),
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      const banner = editingBannerId
        ? await updateBanner(accessToken, editingBannerId, payload)
        : await createBanner(accessToken, payload);

      setBanners((current) => (
        editingBannerId ? current.map((item) => (item._id === editingBannerId ? banner : item)) : [...current, banner]
      ));
      notify({ type: "success", message: editingBannerId ? t("bannerUpdatedSuccess") : t("bannerCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotSaveBanner") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("banners")}</h2>
          <p>{t("bannersPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addBanner")}
        </button>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--banners">
            <span>{t("image")}</span>
            <span>{t("bannerLabel")}</span>
            <span>{t("placement")}</span>
            <span>{t("sort")}</span>
            <span>{t("actions")}</span>
          </div>
          {!banners.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {banners.map((banner) => (
            <article key={banner._id} className="admin-table__row admin-table__row--banners">
              {banner.image ? (
                <img src={mediaUrl(banner.image)} alt={banner.title} className="admin-thumb" />
              ) : (
                <div className="admin-thumb admin-thumb--placeholder">{t("noImage")}</div>
              )}
              <div className="admin-row-copy">
                <strong>{banner.title}</strong>
                <p>{banner.subtitle || t("noSubtitleAddedYet")}</p>
              </div>
              <span>{banner.placement}</span>
              <span>{t("orderCountLabel", { count: banner.sortOrder || 0 })}</span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => {
                    setEditingBannerId(banner._id);
                    setForm({
                      title: banner.title || "",
                      subtitle: banner.subtitle || "",
                      ctaLabel: banner.ctaLabel || "",
                      ctaHref: banner.ctaHref || "",
                      placement: banner.placement || "hero",
                      sortOrder: banner.sortOrder ?? "",
                      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : "",
                      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
                    });
                    setSelectedImage(null);
                    setPreview(banner.image ? mediaUrl(banner.image) : "");
                    setShowModal(true);
                  }}
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--danger"
                  onClick={async () => {
                    const accepted = await confirm({
                      title: t("deleteBannerTitle"),
                      message: t("deleteBannerConfirm"),
                      confirmLabel: t("delete"),
                      cancelLabel: t("cancel"),
                      danger: true,
                    });
                    if (!accepted) {
                      return;
                    }
                    await deleteBanner(accessToken, banner._id);
                    setBanners((current) => current.filter((item) => item._id !== banner._id));
                    notify({ type: "success", message: t("bannerDeletedSuccess") });
                  }}
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
                <h3>{editingBannerId ? t("editBanner") : t("addBannerTitle")}</h3>
                <p>{editingBannerId ? t("editBannerCopy") : t("addBannerCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("title")}
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
                </label>
                <label>
                  {t("placement")}
                  <select value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
                    <option value="hero">hero</option>
                    <option value="promo">promo</option>
                    <option value="category">category</option>
                    <option value="footer">footer</option>
                  </select>
                </label>
              </div>

              <label>
                {t("subtitle")}
                <input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
              </label>

              <div className="admin-grid admin-grid--two">
                <label>
                  {t("ctaLabel")}
                  <input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} />
                </label>
                <label>
                  {t("ctaHref")}
                  <input value={form.ctaHref} onChange={(event) => setForm({ ...form, ctaHref: event.target.value })} />
                </label>
              </div>

              <div className="admin-grid admin-grid--two">
                <label>
                  {t("sortOrder")}
                  <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
                </label>
                <label>
                  {t("startDate")}
                  <input type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                </label>
              </div>

              <label>
                {t("endDate")}
                <input type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </label>

              <div className="admin-upload">
                <label>
                  {t("bannerImage")}
                  <input type="file" accept="image/*" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
                </label>
                <small className="admin-field-hint">{t("bannerImageHint")}</small>
                {preview ? (
                  <img src={preview} alt={t("imagePreview")} className="admin-upload__preview" />
                ) : (
                  <div className="admin-upload__preview admin-upload__preview--placeholder">{t("imagePreview")}</div>
                )}
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowModal(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : editingBannerId ? t("updateBanner") : t("createBanner")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { BannersPage };
