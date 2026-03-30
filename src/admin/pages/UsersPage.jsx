import { useEffect, useState } from "react";
import { createUser, deleteUser, getUsers, updateUser } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "customer",
  phone: "",
};

function UsersPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUsers(accessToken).then(setUsers).catch(() => setUsers([]));
  }, [accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await createUser(accessToken, form);
      setUsers((current) => [user, ...current]);
      notify({ type: "success", message: t("userCreatedSuccess") });
      setForm(initialForm);
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotCreateUser") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("users")}</h2>
          <p>{t("usersPageCopy")}</p>
        </div>
        <button type="button" className="admin-button" onClick={() => setShowModal(true)}>
          {t("addUser")}
        </button>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--user">
            <span>{t("name")}</span>
            <span>{t("email")}</span>
            <span>{t("role")}</span>
            <span>{t("addresses")}</span>
            <span>{t("actions")}</span>
          </div>
        {!users.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
        {users.map((user) => (
          <article key={user._id} className="admin-table__row admin-table__row--user">
            <span>{user.firstName} {user.lastName}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
            <span>{t("addressCount", { count: user.addresses?.length || 0 })}</span>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={async () => {
                  const updated = await updateUser(accessToken, user._id, { isActive: !user.isActive });
                  setUsers((current) => current.map((item) => (item._id === user._id ? updated : item)));
                  notify({ type: "success", message: updated.isActive ? t("userUnblockedSuccess") : t("userBlockedSuccess") });
                }}
              >
                {user.isActive ? t("block") : t("unblock")}
              </button>
              <button
                type="button"
                className="admin-button admin-button--ghost admin-button--danger"
                onClick={async () => {
                  const accepted = await confirm({
                    title: t("deleteUserTitle"),
                    message: t("deleteUserConfirm"),
                    confirmLabel: t("delete"),
                    cancelLabel: t("cancel"),
                    danger: true,
                  });
                  if (!accepted) {
                    return;
                  }
                  await deleteUser(accessToken, user._id);
                  setUsers((current) => current.filter((item) => item._id !== user._id));
                  notify({ type: "success", message: t("userDeletedSuccess") });
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
                <h3>{t("addUserTitle")}</h3>
                <p>{t("addUserCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setShowModal(false)}>
                x
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("firstNameLabel")}
                  <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
                </label>
                <label>
                  {t("lastNameLabel")}
                  <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
                </label>
              </div>

              <div className="admin-grid admin-grid--two">
                <label>
                  {t("email")}
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                </label>
                <label>
                  {t("password")}
                  <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                </label>
              </div>

              <div className="admin-grid admin-grid--two">
                <label>
                  {t("phone")}
                  <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label>
                  {t("role")}
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowModal(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : t("createUserCta")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { UsersPage };
