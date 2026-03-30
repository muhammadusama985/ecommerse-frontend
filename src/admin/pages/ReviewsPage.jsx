import { useEffect, useState } from "react";
import { deleteReview, getReviews, updateReview } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  rating: "5",
  title: "",
  comment: "",
  isApproved: true,
};

function ReviewsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [reviews, setReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getReviews(accessToken).then(setReviews).catch(() => setReviews([]));
  }, [accessToken]);

  const resetForm = () => {
    setEditingReviewId("");
    setForm(initialForm);
  };

  const openEditModal = (review) => {
    setEditingReviewId(review._id);
    setForm({
      rating: String(review.rating ?? 5),
      title: review.title || "",
      comment: review.comment || "",
      isApproved: Boolean(review.isApproved),
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedReview = await updateReview(accessToken, editingReviewId, {
        rating: Number(form.rating),
        title: form.title,
        comment: form.comment,
        isApproved: form.isApproved,
      });

      setReviews((current) =>
        current.map((review) => (review._id === editingReviewId ? updatedReview : review)),
      );
      notify({ type: "success", message: t("reviewUpdatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotUpdateReview") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const accepted = await confirm({
      title: t("deleteReviewTitle"),
      message: t("deleteReviewConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteReview(accessToken, reviewId);
      setReviews((current) => current.filter((review) => review._id !== reviewId));
      notify({ type: "success", message: t("reviewDeletedSuccess") });
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotDeleteReview") });
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("reviews")}</h2>
          <p>{t("reviewsPageCopy")}</p>
        </div>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--review">
            <span>{t("reviewLabel")}</span>
            <span>{t("customer")}</span>
            <span>{t("rating")}</span>
            <span>{t("actions")}</span>
          </div>
          {!reviews.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {reviews.map((review) => (
            <article key={review._id} className="admin-table__row admin-table__row--review">
              <div className="admin-row-copy">
                <strong>{review.productId?.name || t("unknownProduct")}</strong>
                <p>{review.comment}</p>
              </div>
              <span>{review.userId?.email || t("unknownUser")}</span>
              <span>{review.rating}/5</span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => openEditModal(review)}
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--danger"
                  onClick={() => handleDelete(review._id)}
                >
                  {t("delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>{t("editReview")}</h3>
                <p>{t("editReviewCopy")}</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("rating")}
                  <select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.isApproved}
                    onChange={(event) => setForm({ ...form, isApproved: event.target.checked })}
                  />
                  {t("approvedReview")}
                </label>
              </div>

              <label>
                {t("title")}
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>

              <label>
                {t("comment")}
                <textarea
                  value={form.comment}
                  onChange={(event) => setForm({ ...form, comment: event.target.value })}
                  required
                />
              </label>

              <div className="admin-form__actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("updateReview")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { ReviewsPage };
