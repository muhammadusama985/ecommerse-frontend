import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../api/client";
import { getHomePageData } from "../api/storefront";
import { CategoryCard } from "../components/CategoryCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { ProductCard } from "../components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryCollection, translateProductCollection } from "../lib/contentTranslation";

function HomeCarousel({ items, renderItem, className, previousLabel, nextLabel }) {
  const railRef = useRef(null);

  const handleScroll = (direction) => {
    const rail = railRef.current;
    if (!rail) return;

    const scrollAmount = Math.max(rail.clientWidth * 0.8, 280);
    rail.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="home-carousel">
      <button
        type="button"
        className="home-carousel__button home-carousel__button--prev"
        onClick={() => handleScroll("prev")}
        aria-label={previousLabel}
      >
        &lt;
      </button>
      <div ref={railRef} className={`home-carousel__rail ${className}`}>
        {items.map(renderItem)}
      </div>
      <button
        type="button"
        className="home-carousel__button home-carousel__button--next"
        onClick={() => handleScroll("next")}
        aria-label={nextLabel}
      >
        &gt;
      </button>
    </div>
  );
}

function HomePage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    getHomePageData()
      .then(async (result) => {
        if (!mounted) return;
        const [categories, featuredProducts, bestSellingProducts] = await Promise.all([
          translateCategoryCollection(language, result.categories || []),
          translateProductCollection(language, result.featuredProducts || []),
          translateProductCollection(language, result.bestSellingProducts || []),
        ]);
        setData({ ...result, categories, featuredProducts, bestSellingProducts });
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
    if (!data?.banners?.length || data.banners.filter((banner) => banner.placement === "hero").length <= 1) {
      return undefined;
    }

    const heroBanners = data.banners.filter((banner) => banner.placement === "hero");
    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % heroBanners.length);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [data]);

  if (status === "loading") {
    return <LoadingState label={t("loadingGeneric")} />;
  }

  if (status === "error") {
    return <ErrorState message={t("homepageDataError")} />;
  }

  const heroBanners = data.banners.filter((banner) => banner.placement === "hero");
  const heroBanner = heroBanners[activeBannerIndex] || heroBanners[0] || null;

  return (
    <div className="page-stack">
      <section className="hero-banner">
        {heroBanner?.image ? (
          <img src={mediaUrl(heroBanner.image)} alt={heroBanner.title || data.hero.title} className="hero-banner__image" />
        ) : null}
        <div className="hero-banner__overlay">
          <h1>{heroBanner?.title || data.hero.title}</h1>
        </div>
        {heroBanners.length > 1 ? (
          <div className="hero-banner__meta">
            <div className="hero-banner__dots" aria-label={t("bannerIndicators")}>
              {heroBanners.map((banner, index) => (
                <button
                  key={banner._id || banner.title || index}
                  type="button"
                  className={`hero-banner__dot ${index === activeBannerIndex ? "is-active" : ""}`}
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={t("showBannerNumber", { index: index + 1 })}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section id="categories" className="content-section content-section--floral">
        <SectionHeader
          title={t("shopByCategory")}
          description={t("shopByCategoryCopy")}
        />
        <HomeCarousel
          items={data.categories}
          className="home-carousel__rail--categories"
          previousLabel={t("carouselPrevCategories")}
          nextLabel={t("carouselNextCategories")}
          renderItem={(category) => (
            <div key={category._id} className="home-carousel__item home-carousel__item--category">
              <CategoryCard category={category} />
            </div>
          )}
        />
      </section>

      <section id="featured" className="content-section content-section--floral">
        <SectionHeader
          title={t("featuredProducts")}
          description={t("featuredProductsCopy")}
        />
        <HomeCarousel
          items={data.featuredProducts}
          className="home-carousel__rail--products"
          previousLabel={t("carouselPrevFeatured")}
          nextLabel={t("carouselNextFeatured")}
          renderItem={(product) => (
            <div key={product._id} className="home-carousel__item home-carousel__item--product">
              <ProductCard product={product} />
            </div>
          )}
        />
      </section>

      <section className="content-section content-section--floral">
        <SectionHeader
          title={t("topSellingProducts")}
          description={t("topSellingProductsCopy")}
        />
        <HomeCarousel
          items={data.bestSellingProducts}
          className="home-carousel__rail--products"
          previousLabel={t("carouselPrevTopSelling")}
          nextLabel={t("carouselNextTopSelling")}
          renderItem={(product) => (
            <div key={product._id} className="home-carousel__item home-carousel__item--product">
              <ProductCard product={product} />
            </div>
          )}
        />
      </section>
    </div>
  );
}

export { HomePage };
