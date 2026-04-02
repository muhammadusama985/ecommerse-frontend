import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts } from "../api/products";
import { getBestSellerPageData } from "../api/storefront";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryCollection, translateProductCollection } from "../lib/contentTranslation";

function AllProductsPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    categoryId: searchParams.get("categoryId") || "",
    minRating: searchParams.get("minRating") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const query = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      categoryId: searchParams.get("categoryId") || "",
      minRating: searchParams.get("minRating") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sortBy: searchParams.get("sortBy") || "newest",
    }),
    [searchParams],
  );

  useEffect(() => {
    getBestSellerPageData()
      .then(async (data) => setCategories(await translateCategoryCollection(language, data.categories || [])))
      .catch(() => setCategories([]));
  }, [language]);

  useEffect(() => {
    listProducts(query)
      .then(async (items) => setProducts(await translateProductCollection(language, items)))
      .catch(() => setProducts([]));
  }, [language, query]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("search", search.trim());
    if (filters.categoryId) next.set("categoryId", filters.categoryId);
    if (filters.minRating) next.set("minRating", filters.minRating);
    if (filters.minPrice) next.set("minPrice", filters.minPrice);
    if (filters.maxPrice) next.set("maxPrice", filters.maxPrice);
    if (filters.sortBy) next.set("sortBy", filters.sortBy);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({ categoryId: "", minRating: "", minPrice: "", maxPrice: "", sortBy: "newest" });
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="page-stack">
      <section className="listing-hero listing-hero--compact">
        <div>
          <span className="crumbs">{t("homeAllProductsCrumb")}</span>
          <h1>{t("allProductsTitle")}</h1>
          <p>{t("allProductsCopy")}</p>
        </div>
      </section>

      <section className="listing-layout listing-layout--all-products">
        <aside className="filters-panel">
          <h3>{t("filters")}</h3>
          <div className="filter-group">
            <strong>{t("searchLabel")}</strong>
            <input className="listing-search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="filter-group">
            <strong>{t("categoriesLabel")}</strong>
            <select value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
              <option value="">{t("allCategories")}</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <strong>{t("priceRange")}</strong>
            <div className="price-inputs">
              <input placeholder={t("min")} value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} />
              <input placeholder={t("max")} value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} />
            </div>
          </div>
          <div className="filter-group">
            <strong>{t("sortBy")}</strong>
            <select value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })}>
              <option value="newest">{t("newest")}</option>
              <option value="bestSelling">{t("bestSelling")}</option>
              <option value="priceAsc">{t("priceLowToHigh")}</option>
              <option value="priceDesc">{t("priceHighToLow")}</option>
              <option value="topRated">{t("topRated")}</option>
            </select>
          </div>
          <div className="filter-group">
            <strong>{t("minimumRating")}</strong>
            <select value={filters.minRating} onChange={(event) => setFilters({ ...filters, minRating: event.target.value })}>
              <option value="">{t("allRatings")}</option>
              <option value="3">{t("stars3Plus")}</option>
              <option value="4">{t("stars4Plus")}</option>
            </select>
          </div>
          <button type="button" className="solid-button panel-button" onClick={applyFilters}>{t("applyFilters")}</button>
          <button type="button" className="ghost-button panel-button" onClick={clearFilters}>{t("clearFilters")}</button>
        </aside>
        <div className="listing-content">
          <div className="listing-toolbar">
            <span>{t("showingProductsCount", { count: products.length })}</span>
          </div>
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

export { AllProductsPage };
