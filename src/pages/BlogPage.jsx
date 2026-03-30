import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogPosts } from "../api/content";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { translateBlogPosts } from "../lib/contentTranslation";

function BlogPage() {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getBlogPosts()
      .then(async (items) => setPosts(await translateBlogPosts(language, items)))
      .catch(() => setPosts([]));
  }, [language]);

  return (
    <section className="page-stack">
      <div className="content-page content-page--hero">
        <span className="section-eyebrow">{t("blog")}</span>
        <h1>{t("beautyJournal")}</h1>
        <p>{t("blogPageCopy")}</p>
      </div>
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
    </section>
  );
}

export { BlogPage };
