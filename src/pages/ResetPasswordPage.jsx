import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { useLanguage } from "../context/LanguageContext";

function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = searchParams.get("token") || "";
    const response = await resetPassword({ token, password });
    setMessage(response.message);
  };

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="section-eyebrow">{t("resetAccess")}</span>
        <h1>{t("resetPassword")}</h1>
        <p>{t("resetPasswordHelp")}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {t("newPassword")}
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {message ? <p className="feedback-note">{message}</p> : null}
        <button type="submit" className="solid-button solid-button--large">
          {t("resetPassword")}
        </button>
      </form>
    </section>
  );
}

export { ResetPasswordPage };
