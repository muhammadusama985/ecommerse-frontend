import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setSession } = useShop();
  const { notify } = useNotifications();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const session = await login(form, "customer");
      if (session.user.role === "admin") {
        throw new Error(t("adminLoginOnly"));
      }
      setSession(session);
      navigate("/");
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("loginFailedGeneric") });
    }
  };

  return (
    <section className="auth-panel auth-panel--login">
      <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
        <div className="auth-copy auth-copy--centered">
          <h1>{t("login")}</h1>
        </div>

        <label>
          {t("email")}
          <input
            type="email"
            placeholder={t("email")}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          {t("password")}
          <input
            type="password"
            placeholder={t("password")}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {message ? <p className="feedback-note">{message}</p> : null}
        <button type="submit" className="solid-button solid-button--large auth-form__submit">
          {t("login")}
        </button>
        <div className="auth-form__wide auth-form__wide--centered">
          <SocialAuthButtons
            portal="customer"
            onSuccess={(session) => {
              if (session.user.role === "admin") {
                notify({ type: "error", message: t("adminLoginOnly") });
                return;
              }
              setSession(session);
              navigate("/");
            }}
          />
        </div>
        <div className="auth-links auth-links--centered">
          <p className="auth-switch">
            <Link to="/forgot-password">{t("forgotPassword")}</Link>
          </p>
          <p className="auth-switch">
            {t("noAccount")} <Link to="/register">{t("createOne")}</Link>
          </p>
        </div>
      </form>
    </section>
  );
}

export { LoginPage };
