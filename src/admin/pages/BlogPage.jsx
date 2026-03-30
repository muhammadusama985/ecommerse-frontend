import { useEffect, useState } from "react";
import { mediaUrl } from "../api/client";
import { createBlogPost, deleteBlogPost, getBlogPosts, uploadAdminImage } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = { title: "", excerpt: "", content: "" };

function BlogPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBlogPosts(accessToken).then(setPosts).catch(() => setPosts([]));
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
      if (form.content.trim().length < 10) {
        throw new Error(t("blogContentMinLength"));
      }

      let coverImage = "";
      if (selectedImage) {
        const uploaded = await uploadAdminImage(accessToken, "blog", selectedImage);
        coverImage = uploaded.path;
      }

      const post = await createBlogPost(accessToken, {
        ...form,
        isPublished: true,
        coverImage: coverImage || undefined,
      });

      setPosts((current) => [post, ...current]);
      notify({ type: "success", message: t("blogPostCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotCreateBlogPost") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("blogPosts")}</h2>
          <p>{t("blogPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addBlogPost")}
        </button>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--blog">
            <span>{t("image")}</span>
            <span>{t("post")}</span>
            <span>{t("slug")}</span>
            <span>{t("status")}</span>
            <span>{t("actions")}</span>
          </div>
          {!posts.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {posts.map((post) => (
            <article key={post._id} className="admin-table__row admin-table__row--blog">
              {post.coverImage ? (
                <img src={mediaUrl(post.coverImage)} alt={post.title} className="admin-thumb" />
              ) : (
                <div className="admin-thumb admin-thumb--placeholder">{t("noImage")}</div>
              )}
              <div className="admin-row-copy">
                <strong>{post.title}</strong>
                <p>{post.excerpt || t("noExcerptAddedYet")}</p>
              </div>
              <span>{post.slug}</span>
              <span>{post.isPublished ? t("published") : t("draft")}</span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--danger"
                  onClick={async () => {
                    const accepted = await confirm({
                      title: t("deleteBlogPostTitle"),
                      message: t("deleteBlogPostConfirm"),
                      confirmLabel: t("delete"),
                      cancelLabel: t("cancel"),
                      danger: true,
                    });
                    if (!accepted) {
                      return;
                    }
                    await deleteBlogPost(accessToken, post._id);
                    setPosts((current) => current.filter((item) => item._id !== post._id));
                    notify({ type: "success", message: t("blogPostDeletedSuccess") });
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
                <h3>{t("addBlogPostTitle")}</h3>
                <p>{t("addBlogPostCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                {t("title")}
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>

              <label>
                {t("excerpt")}
                <input value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
              </label>

              <label>
                {t("content")}
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
              </label>

              <div className="admin-upload">
                <label>
                  {t("coverImage")}
                  <input type="file" accept="image/*" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
                </label>
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
                  {isSubmitting ? t("saving") : t("publishPost")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { BlogPage };
