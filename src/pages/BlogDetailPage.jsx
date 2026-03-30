import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBlogPost } from "../api/content";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { translateSingleBlogPost } from "../lib/contentTranslation";

function BlogDetailPage() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    getBlogPost(slug)
      .then(async (item) => setPost(await translateSingleBlogPost(language, item)))
      .catch(() => setPost(null));
  }, [slug, language]);

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
