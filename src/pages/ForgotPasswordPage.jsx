import { useState } from "react";
import { forgotPassword } from "../api/auth";
import { useLanguage } from "../context/LanguageContext";

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await forgotPassword({ email });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message || "We could not send the reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-copy">
        <span className="section-eyebrow">{t("resetAccess")}</span>
        <h1>{t("forgotPassword")}</h1>
        <p>{t("forgotPasswordHelp")}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label>
          {t("email")}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>
        {message ? <p className="feedback-note">{message}</p> : null}
        {error ? <p className="feedback-note">{error}</p> : null}
        <button type="submit" className="solid-button solid-button--large" disabled={isSubmitting}>
          {isSubmitting ? "Sending reset link..." : t("sendResetLink")}
        </button>
      </form>
    </section>
  );
}

export { ForgotPasswordPage };
