import { useEffect, useState } from "react";
import { getStoreCategories } from "../api/storefront";
import { CategoryCard } from "../components/CategoryCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { SectionHeader } from "../components/SectionHeader";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryCollection } from "../lib/contentTranslation";

function CategoriesPage() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;

    getStoreCategories()
      .then(async (result) => {
        if (!mounted) return;
        setCategories(await translateCategoryCollection(language, result || []));
        setStatus("success");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  if (status === "loading") {
    return <LoadingState label={t("loadingGeneric")} />;
  }

  if (status === "error") {
    return <ErrorState message={t("categoriesLoadError")} />;
  }

  return (
    <div className="page-stack">
      <section className="listing-hero listing-hero--compact">
        <div>
          <span className="section-eyebrow">{t("categories")}</span>
          <h1>{t("categoriesPageTitle")}</h1>
          <p>{t("categoriesPageCopy")}</p>
        </div>
      </section>

      <section className="categories-page-section">
        <div className="categories-page-shell">
          <SectionHeader
            title={t("shopByCategory")}
            description={t("shopByCategoryCopy")}
            align="center"
          />
          <div className="category-grid category-grid--page">
            {categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export { CategoriesPage };
