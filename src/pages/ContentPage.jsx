import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPage } from "../api/content";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { translateContentPage } from "../lib/contentTranslation";

function ContentPage() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isCancelled = false;
    setPage(null);
    setStatus("loading");

    getPage(slug)
      .then(async (item) => {
        if (isCancelled) return;
        setPage(await translateContentPage(language, item));
        setStatus("ready");
      })
      .catch(() => {
        if (isCancelled) return;
        setPage(null);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [slug, language]);

  if (status === "loading") {
    return <LoadingState label={t("loadingGeneric")} />;
  }

  if (!page) {
    return <section className="empty-panel">{t("pageNotFound")}</section>;
  }

  return (
    <article className={`content-page ${slug === "contact" ? "content-page--contact" : "content-page--article"}`}>
      <span className="section-eyebrow">{t("information")}</span>
      <h1>{page.title}</h1>
      <p>{page.content}</p>
      {slug === "contact" ? (
        <div className="content-contact-grid">
          <div className="content-contact-card">
            <strong>Email Support</strong>
            <p>support@naturerepublic.com</p>
          </div>
          <div className="content-contact-card">
            <strong>Customer Care</strong>
            <p>+971 50 000 0000</p>
          </div>
          <div className="content-contact-card">
            <strong>Working Hours</strong>
            <p>Monday to Saturday, 9 AM to 6 PM</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export { ContentPage };
