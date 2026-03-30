import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setSession } = useShop();
  const { notify } = useNotifications();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const session = await register(form);
      setSession(session);
      navigate("/");
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("registrationFailedGeneric") });
    }
  };

  return (
    <section className="auth-panel auth-panel--login">
      <form className="auth-form auth-form--two-col auth-form--login" onSubmit={handleSubmit}>
        <div className="auth-copy auth-copy--centered auth-form__wide">
          <h1>{t("createAccount")}</h1>
        </div>
        <label>
          {t("firstName")}
          <input
            placeholder={t("firstName")}
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
        </label>
        <label>
          {t("lastName")}
          <input
            placeholder={t("lastName")}
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            required
          />
        </label>
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
          {t("phone")}
          <input
            placeholder={t("phone")}
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label className="auth-form__wide">
          {t("password")}
          <input
            type="password"
            placeholder={t("password")}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {message ? <p className="feedback-note auth-form__wide">{message}</p> : null}
        <button type="submit" className="solid-button solid-button--large auth-form__wide auth-form__submit">
          {t("createAccount")}
        </button>
        <div className="auth-form__wide auth-form__wide--centered">
          <SocialAuthButtons
            onSuccess={(session) => {
              setSession(session);
              navigate("/");
            }}
          />
        </div>
        <div className="auth-links auth-links--centered auth-form__wide">
          <p className="auth-switch">
            {t("alreadyRegistered")} <Link to="/login">{t("loginHere")}</Link>
          </p>
        </div>
      </form>
    </section>
  );
}

export { RegisterPage };
