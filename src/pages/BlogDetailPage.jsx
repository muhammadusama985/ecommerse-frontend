import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBlogPost } from "../api/content";
import { mediaUrl } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { translateSingleBlogPost } from "../lib/contentTranslation";

function BlogDetailPage() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isCancelled = false;
    setPost(null);
    setStatus("loading");

    getBlogPost(slug)
      .then(async (item) => {
        if (isCancelled) return;
        setPost(await translateSingleBlogPost(language, item));
        setStatus("ready");
      })
      .catch(() => {
        if (isCancelled) return;
        setPost(null);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [slug, language]);

  // Without a status flag a slow request renders "not found" for a moment,
  // which reads as a broken link to the customer.
  if (status === "loading") {
    return <LoadingState label={t("loadingGeneric")} />;
  }

  if (!post) {
    return <section className="empty-panel">{t("blogNotFound")}</section>;
  }

  return (
    <article className="content-page content-page--article">
      <span className="section-eyebrow">{t("beautyJournal")}</span>
      <h1>{post.title}</h1>
      {post.coverImage ? <img src={mediaUrl(post.coverImage)} alt={post.title} className="blog-detail__image" /> : null}
      <p>{post.content}</p>
    </article>
  );
}

export { BlogDetailPage };
