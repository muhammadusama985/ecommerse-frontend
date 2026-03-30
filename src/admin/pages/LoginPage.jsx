import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

function LoginPage() {
  const { t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const { setSession } = useAdmin();
  const { notify } = useAdminNotifications();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const session = await login(form, "admin");
      if (session.user.role !== "admin") {
        throw new Error(t("accountNotAllowedAdmin"));
      }
      setSession(session);
      navigate("/admin");
    } catch (error) {
      notify({ type: "error", message: error.message });
    }
  };

  return (
    <section className="admin-login">
      <div className="admin-login__card">
        <span className="admin-eyebrow">{t("adminAccess")}</span>
        <h1>{t("loginToDashboard")}</h1>
        <p>{t("adminLoginCopy")}</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            {t("email")}
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <button type="submit" className="admin-button">
            {t("login")}
          </button>
          <button type="button" className="admin-button admin-button--ghost" onClick={toggleLanguage}>
            {t("language")}
          </button>
        </form>
      </div>
    </section>
  );
}

export { LoginPage };
