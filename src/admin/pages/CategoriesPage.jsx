import { useEffect, useState } from "react";
import { mediaUrl } from "../api/client";
import { createCategory, deleteCategory, getCategories, uploadAdminImage } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = { name: "", description: "", sortOrder: "", parentId: "" };

function CategoriesPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCategories(accessToken).then(setCategories).catch(() => setCategories([]));
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let image = "";
      if (selectedImage) {
        const uploaded = await uploadAdminImage(accessToken, "categories", selectedImage);
        image = uploaded.path;
      }

      const category = await createCategory(accessToken, {
        name: form.name,
        description: form.description,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
        parentId: form.parentId || undefined,
        image: image || undefined,
      });

      setCategories((current) => [...current, category]);
      notify({ type: "success", message: t("categoryCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotCreateCategory") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("categories")}</h2>
          <p>{t("categoriesPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addCategory")}
        </button>
      </div>
      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--categories">
            <span>{t("image")}</span>
            <span>{t("categories")}</span>
            <span>{t("parent")}</span>
            <span>{t("sort")}</span>
            <span>{t("actions")}</span>
          </div>
          {!categories.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {categories.map((category) => (
            <article key={category._id} className="admin-table__row admin-table__row--categories">
              {category.image ? (
                <img src={mediaUrl(category.image)} alt={category.name} className="admin-thumb" />
              ) : (
                <div className="admin-thumb admin-thumb--placeholder">{t("noImage")}</div>
              )}
              <div className="admin-row-copy">
                <strong>{category.name}</strong>
                <p>{category.description || t("noDescriptionAddedYet")}</p>
              </div>
              <span>{categories.find((item) => item._id === category.parentId)?.name || t("mainCategory")}</span>
              <span>{t("orderCountLabel", { count: category.sortOrder || 0 })}</span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--danger"
                  onClick={async () => {
                    const accepted = await confirm({
                      title: t("deleteCategoryTitle"),
                      message: t("deleteCategoryConfirm"),
                      confirmLabel: t("delete"),
                      cancelLabel: t("cancel"),
                      danger: true,
                    });
                    if (!accepted) return;

                    await deleteCategory(accessToken, category._id);
                    setCategories((current) => current.filter((item) => item._id !== category._id));
                    notify({ type: "success", message: t("categoryRemovedSuccess") });
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
                <h3>{t("addCategoryTitle")}</h3>
                <p>{t("addCategoryCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("categoryName")}
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </label>
                <label>
                  {t("parentCategory")}
                  <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
                    <option value="">{t("noParentMainCategory")}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                {t("description")}
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>

              <label>
                {t("sortOrder")}
                <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
              </label>

              <div className="admin-upload">
                <label>
                  {t("categoryImage")}
                  <input type="file" accept="image/*" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
                </label>
                {preview ? (
                  <img src={preview} alt={t("imagePreview")} className="admin-upload__preview" />
                ) : (
                  <div className="admin-upload__preview admin-upload__preview--placeholder">{t("imagePreview")}</div>
                )}
              </div>

              <div className="admin-grid admin-grid--two">
                <label className="checkbox-row checkbox-row--muted">
                  <input
                    type="checkbox"
                    checked={!form.parentId}
                    onChange={() => setForm({ ...form, parentId: "" })}
                  />
                  {t("mainCategoryToggle")}
                </label>
                <label>
                  {t("parentSelected")}
                  <input value={form.parentId ? t("yes") : t("no")} readOnly />
                </label>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowModal(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("createCategoryCta")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { CategoriesPage };
