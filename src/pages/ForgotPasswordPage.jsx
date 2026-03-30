import { useState } from "react";
import { forgotPassword } from "../api/auth";
import { useLanguage } from "../context/LanguageContext";

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await forgotPassword({ email });
    setMessage(response.message);
  };

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="section-eyebrow">{t("resetAccess")}</span>
        <h1>{t("forgotPassword")}</h1>
        <p>{t("forgotPasswordHelp")}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {t("email")}
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {message ? <p className="feedback-note">{message}</p> : null}
        <button type="submit" className="solid-button solid-button--large">
          {t("sendResetLink")}
        </button>
      </form>
    </section>
  );
}

export { ForgotPasswordPage };
