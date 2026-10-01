import { translateBatch } from "../api/translate";

const translationCache = new Map();

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
        translationCache.set(getCacheKey(language, text), translatedText);
      });
    } catch {
      // Deliberately not cached: caching the English source here would pin the
      // page to untranslated text for the rest of the session, so a later retry
      // (after the quota or key is fixed) can still succeed.
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

async function translateCartItems(language, items = []) {
  if (language === "en" || !items.length) return items;

  const products = items.map((item) => item.productId).filter(Boolean);
  const translatedProducts = await translateProductCollection(language, products);
  let cursor = 0;

  return items.map((item) => {
    if (!item.productId) return item;
    return { ...item, productId: translatedProducts[cursor++] || item.productId };
  });
}

async function translateWishlist(language, products = []) {
  return translateProductCollection(language, products);
}

async function translateOrderItems(language, orders = []) {
  if (language === "en" || !orders.length) return orders;

  const texts = [];
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      texts.push(item.name || "");
    });
  });

  const translated = await translateTextsCached(language, texts);
  let cursor = 0;

  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({ ...item, name: translated[cursor++] || item.name })),
  }));
}

function isTranslatableLabel(text) {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Prices, quantities and bare symbols must stay exactly as written, so a
  // label without a single letter is never handed to the translator.
  if (!/[A-Za-z]/.test(trimmed)) return false;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return false;
  if (/^[\w-]{16,}$/.test(trimmed)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed)) return false;
  return true;
}

// While a translation request is in flight the localised list is still empty or
// the wrong length, so fall back to the untranslated source. That keeps the
// first paint (and any "empty" checks) correct instead of flashing a blank
// list until the batch resolves.
function pickLocalizedItems(localized = [], source = []) {
  return localized.length === source.length ? localized : source;
}

export {
  isTranslatableLabel,
  pickLocalizedItems,
  translateBlogPosts,
  translateCartItems,
  translateCategoryCollection,
  translateContentPage,
  translateOrderItems,
  translateProductCollection,
  translateProductDetailPayload,
  translateSingleBlogPost,
  translateTextsCached,
  translateWishlist,
};
