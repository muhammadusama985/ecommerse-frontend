import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

function CategoryCard({ category }) {
  const { t } = useLanguage();
  return (
    <article className="category-card">
      {category.image ? (
        <img src={mediaUrl(category.image)} alt={category.name} className="category-card__image" />
      ) : (
        <div className="category-icon">{category.name.slice(0, 1)}</div>
      )}
      <h3>{category.name}</h3>
      <p>{category.description || t("categoryFallbackCopy")}</p>
      <Link to={`/products?categoryId=${category._id}`} className="outline-pill">
        {t("viewProducts")}
      </Link>
    </article>
  );
}

export { CategoryCard };
