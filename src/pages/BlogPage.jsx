import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogPosts } from "../api/content";
import { mediaUrl } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { translateBlogPosts } from "../lib/contentTranslation";

function BlogPage() {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isCancelled = false;
    setStatus("loading");

    getBlogPosts()
      .then(async (items) => {
        if (isCancelled) return;
        setPosts(await translateBlogPosts(language, items));
        setStatus("ready");
      })
      .catch(() => {
        if (isCancelled) return;
        setPosts([]);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [language]);

  return (
    <section className="page-stack">
      <div className="content-page content-page--hero">
        <span className="section-eyebrow">{t("blog")}</span>
        <h1>{t("beautyJournal")}</h1>
        <p>{t("blogPageCopy")}</p>
      </div>
      {status === "loading" ? (
        <LoadingState variant="skeleton" label={t("loadingGeneric")} count={3} />
      ) : status === "error" ? (
        <p className="feedback-note">{t("blogPageCopy")}</p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post._id} className="blog-card">
              {post.coverImage ? (
                <img src={mediaUrl(post.coverImage)} alt={post.title} className="blog-card__image" />
              ) : null}
              <span className="section-eyebrow">{t("article")}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt || post.content.slice(0, 140)}</p>
              <Link to={`/blog/${post.slug}`} className="solid-button">{t("readMore")}</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export { BlogPage };
