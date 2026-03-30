import { useEffect, useState } from "react";
import { createPage, deletePage, getPages } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  title: "",
  content: "",
};

function PagesPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPages(accessToken).then(setPages).catch(() => setPages([]));
  }, [accessToken]);

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const page = await createPage(accessToken, form);
      setPages((current) => [page, ...current]);
      notify({ type: "success", message: t("pageCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotCreatePage") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pageId) => {
    const accepted = await confirm({
      title: t("deletePageTitle"),
      message: t("deletePageConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!accepted) return;

    await deletePage(accessToken, pageId);
    setPages((current) => current.filter((page) => page._id !== pageId));
    notify({ type: "success", message: t("pageRemovedSuccess") });
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("pages")}</h2>
          <p>{t("pagesPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addPage")}
        </button>
      </div>
      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--page">
            <span>{t("pages")}</span>
            <span>{t("slug")}</span>
            <span>{t("status")}</span>
            <span>{t("actions")}</span>
          </div>
          {!pages.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {pages.map((page) => (
            <article key={page._id} className="admin-table__row admin-table__row--page">
              <div className="admin-row-copy">
                <strong>{page.title}</strong>
                <p>{page.content?.slice(0, 120) || t("noContentAddedYet")}</p>
              </div>
              <span>{page.slug}</span>
              <span>{page.isPublished ? t("published") : t("draft")}</span>
              <div className="admin-actions">
                <button type="button" className="admin-button admin-button--ghost admin-button--danger" onClick={() => handleDelete(page._id)}>
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
                <h3>{t("addPageTitle")}</h3>
                <p>{t("addPageCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                {t("pageTitle")}
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>

              <label>
                {t("pageContent")}
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
              </label>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowModal(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("createPageCta")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { PagesPage };
