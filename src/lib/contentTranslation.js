import { translateBatch } from "../api/translate";

const translationCache = new Map();
const arabicFallbackPhrases = {
  "Top Selling Products": "المنتجات الأكثر مبيعاً",
  "Best Selling Items": "المنتجات الأكثر مبيعاً",
  "All Products": "كل المنتجات",
  "Home / All Products": "الرئيسية / كل المنتجات",
  "Home / Best Sellers": "الرئيسية / الأكثر مبيعاً",
  "Browse the full catalog with working category, price, rating, and sort filters.": "تصفح كامل الكتالوج مع فلاتر الفئات والسعر والتقييم والترتيب.",
  "Best-performing products displayed with the same professional product cards used across the storefront.": "أفضل المنتجات أداءً المعروضة بنفس بطاقات المنتجات الاحترافية عبر المتجر.",
  "Best-selling beauty products that customers absolutely love": "منتجات الجمال الأكثر مبيعاً التي يحبها العملاء كثيراً",
  "Search best sellers...": "ابحث في الأكثر مبيعاً...",
  "Search": "بحث",
  "Categories": "الفئات",
  "All Categories": "كل الفئات",
  "Price Range": "نطاق السعر",
  "Min": "الأدنى",
  "Max": "الأعلى",
  "Sort By": "الترتيب حسب",
  "Best Selling": "الأكثر مبيعاً",
  "Top Rated": "الأعلى تقييماً",
  "Price Low to High": "السعر من الأقل إلى الأعلى",
  "Price High to Low": "السعر من الأعلى إلى الأقل",
  "Minimum Rating": "الحد الأدنى للتقييم",
  "All Ratings": "كل التقييمات",
  "3+ Stars": "3 نجوم فأكثر",
  "4+ Stars": "4 نجوم فأكثر",
  "Filters": "الفلاتر",
  "Beauty": "الجمال",
};

function getCacheKey(language, text) {
  return `${language}::${text}`;
}

function shouldTranslateText(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return false;
  if (/^[\w-]{16,}$/.test(trimmed)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)) return false;
  return true;
}

async function translateTextsCached(language, texts) {
  if (language === "en") {
    return texts;
  }

  const uniqueTexts = [...new Set(texts.filter(shouldTranslateText))];
  const missingTexts = uniqueTexts.filter((text) => !translationCache.has(getCacheKey(language, text)));

  if (missingTexts.length) {
    try {
      const { translations } = await translateBatch({ target: language, texts: missingTexts });
      missingTexts.forEach((text, index) => {
        const translatedText = translations[index] || text;
        const fallback =
          language === "ar" && translatedText === text
            ? arabicFallbackPhrases[text] || text
            : translatedText;
        translationCache.set(getCacheKey(language, text), fallback);
      });
    } catch {
      missingTexts.forEach((text) => {
        const fallback = language === "ar" ? arabicFallbackPhrases[text] || text : text;
        translationCache.set(getCacheKey(language, text), fallback);
      });
    }
  }

  return texts.map((text) => {
    if (!shouldTranslateText(text)) return text;
    return translationCache.get(getCacheKey(language, text)) || text;
  });
}

async function translateProductCollection(language, products = []) {
  if (language === "en" || !products.length) return products;

  const texts = [];
  products.forEach((product) => {
    texts.push(product.name || "");
    texts.push(product.shortDescription || "");
    texts.push(product.description || "");
    texts.push(product.categoryId?.name || "");
    texts.push(product.badge || "");
  });

  const translated = await translateTextsCached(language, texts);
  let cursor = 0;

  return products.map((product) => {
    const nextProduct = {
      ...product,
      name: translated[cursor++] || product.name,
      shortDescription: translated[cursor++] || product.shortDescription,
      description: translated[cursor++] || product.description,
      categoryId: product.categoryId
        ? { ...product.categoryId, name: translated[cursor++] || product.categoryId.name }
        : product.categoryId,
      badge: translated[cursor++] || product.badge,
    };

    return nextProduct;
  });
}

async function translateCategoryCollection(language, categories = []) {
  if (language === "en" || !categories.length) return categories;

  const texts = [];
  categories.forEach((category) => {
    texts.push(category.name || "");
    texts.push(category.description || "");
  });

  const translated = await translateTextsCached(language, texts);
  let cursor = 0;

  return categories.map((category) => ({
    ...category,
    name: translated[cursor++] || category.name,
    description: translated[cursor++] || category.description,
  }));
}

async function translateBlogPosts(language, posts = []) {
  if (language === "en" || !posts.length) return posts;

  const texts = [];
  posts.forEach((post) => {
    texts.push(post.title || "");
    texts.push(post.excerpt || "");
    texts.push(post.content || "");
  });

  const translated = await translateTextsCached(language, texts);
  let cursor = 0;

  return posts.map((post) => ({
    ...post,
    title: translated[cursor++] || post.title,
    excerpt: translated[cursor++] || post.excerpt,
    content: translated[cursor++] || post.content,
  }));
}

async function translateSingleBlogPost(language, post) {
  if (language === "en" || !post) return post;
  const [title, content] = await translateTextsCached(language, [post.title || "", post.content || ""]);
  return { ...post, title: title || post.title, content: content || post.content };
}

async function translateContentPage(language, page) {
  if (language === "en" || !page) return page;
  const [title, content] = await translateTextsCached(language, [page.title || "", page.content || ""]);
  return { ...page, title: title || page.title, content: content || page.content };
}

async function translateReviews(language, reviews = []) {
  if (language === "en" || !reviews.length) return reviews;

  const texts = [];
  reviews.forEach((review) => {
    texts.push(review.title || "");
    texts.push(review.comment || "");
  });

  const translated = await translateTextsCached(language, texts);
  let cursor = 0;

  return reviews.map((review) => ({
    ...review,
    title: translated[cursor++] || review.title,
    comment: translated[cursor++] || review.comment,
  }));
}

async function translateProductDetailPayload(language, payload) {
  if (language === "en" || !payload?.product) return payload;

  const [products, reviews] = await Promise.all([
    translateProductCollection(language, [payload.product]),
    translateReviews(language, payload.reviews || []),
  ]);

  return {
    ...payload,
    product: products[0] || payload.product,
    reviews,
  };
}

export {
  translateBlogPosts,
  translateCategoryCollection,
  translateContentPage,
  translateProductCollection,
  translateProductDetailPayload,
  translateSingleBlogPost,
};
