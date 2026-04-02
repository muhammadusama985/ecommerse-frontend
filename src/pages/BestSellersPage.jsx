import { useEffect, useState } from "react";
import { getBestSellerPageData } from "../api/storefront";
import { listProducts } from "../api/products";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryCollection, translateProductCollection } from "../lib/contentTranslation";

function BestSellersPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    minRating: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "bestSelling",
  });

  useEffect(() => {
    let mounted = true;
    getBestSellerPageData()
      .then(async (result) => {
        if (!mounted) return;
        const [categories, products] = await Promise.all([
          translateCategoryCollection(language, result.categories || []),
          translateProductCollection(language, result.products || []),
        ]);
        setData({ ...result, categories, products });
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

  useEffect(() => {
    if (!data) return;
    listProducts({
      bestSeller: true,
      search: filters.search,
      categoryId: filters.categoryId,
      minRating: filters.minRating,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
    })
      .then(async (products) => {
        const translatedProducts = await translateProductCollection(language, products);
        setData((current) => ({ ...current, products: translatedProducts }));
      })
      .catch(() => {});
  }, [data?.categories, filters, language]);

  if (status === "loading") return <LoadingState label={t("loadingGeneric")} />;
  if (status === "error") return <ErrorState message={t("bestSellerDataError")} />;

  return (
    <div className="page-stack">
      <section className="listing-hero listing-hero--compact">
        <div>
          <span className="crumbs">{t("homeBestSellersCrumb")}</span>
          <h1>{data.heading}</h1>
          <p>{data.description}</p>
        </div>
      </section>

      <section className="listing-layout listing-layout--all-products">
        <aside className="filters-panel">
          <h3>{t("filters")}</h3>
          <div className="filter-group">
            <strong>{t("searchLabel")}</strong>
            <input className="listing-search" placeholder={t("searchBestSellers")} value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          </div>
          <div className="filter-group">
            <strong>{t("categoriesLabel")}</strong>
            <select value={filters.categoryId} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}>
              <option value="">{t("allCategories")}</option>
              {data.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <strong>{t("priceRange")}</strong>
            <div className="price-inputs">
              <input placeholder={t("min")} value={filters.minPrice} onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))} />
              <input placeholder={t("max")} value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} />
            </div>
          </div>
          <div className="filter-group">
            <strong>{t("sortBy")}</strong>
            <select value={filters.sortBy} onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}>
              <option value="bestSelling">{t("bestSelling")}</option>
              <option value="topRated">{t("topRated")}</option>
              <option value="priceAsc">{t("priceLowToHigh")}</option>
              <option value="priceDesc">{t("priceHighToLow")}</option>
            </select>
          </div>
          <div className="filter-group">
            <strong>{t("minimumRating")}</strong>
            <select value={filters.minRating} onChange={(event) => setFilters((current) => ({ ...current, minRating: event.target.value }))}>
              <option value="">{t("allRatings")}</option>
              <option value="3">{t("stars3Plus")}</option>
              <option value="4">{t("stars4Plus")}</option>
            </select>
          </div>
          <button type="button" className="ghost-button panel-button" onClick={() => setFilters({ search: "", categoryId: "", minRating: "", minPrice: "", maxPrice: "", sortBy: "bestSelling" })}>
            {t("clearFilters")}
          </button>
        </aside>
        <div className="listing-content">
          <div className="listing-toolbar">
            <span>{t("showingBestSellersCount", { count: data.products.length })}</span>
          </div>
          <div className="product-grid">
            {data.products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

export { BestSellersPage };
