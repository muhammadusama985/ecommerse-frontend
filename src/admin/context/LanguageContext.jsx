import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translateBatch } from "../../api/translate.js";

const baseTranslations = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  coupons: "Coupons",
  blog: "Blog",
  pages: "Pages",
  banners: "Banners",
  settings: "Settings",
  users: "Users",
  reviews: "Reviews",
  orders: "Orders",
  revenue: "Revenue",
  logout: "Logout",
  adminAccess: "Admin Access",
  login: "Login",
  language: "Language",
  english: "English",
  arabic: "Arabic",
  adminDashboard: "Admin Dashboard",
  openLanguageMenu: "Open language menu",
  logoutAdminConfirm: "Are you sure you want to logout from the admin dashboard?",
  stayHere: "Stay here",
  loadingDashboard: "Loading dashboard...",
  loadingRevenue: "Loading revenue...",
  totalRegisteredUsers: "Total registered users",
  totalCatalogProducts: "Total catalog products",
  totalOrdersReceived: "Total orders received",
  totalRecognizedRevenue: "Total recognized revenue",
  revenueFromOnlinePayments: "Revenue from online payments",
  revenueFromDeliveredCodOrders: "Revenue from delivered COD orders",
  totalCancelledOrders: "Total cancelled orders",
  cancelledFromAdminDashboard: "Cancelled from admin dashboard",
  cancelledByCustomers: "Cancelled by customers",
  productsBlockedFromCheckout: "Products blocked from checkout",
  stripeRevenue: "Stripe Revenue",
  codRevenue: "COD Revenue",
  cancelledOrders: "Cancelled Orders",
  cancelledByAdmin: "Cancelled By Admin",
  cancelledByCustomer: "Cancelled By Customer",
  outOfStock: "Out Of Stock",
  lowInventoryAlerts: "Low Inventory Alerts",
  inventoryAlertsCopy: "Products at zero stock are blocked from checkout until inventory is replenished.",
  noProductsOutOfStock: "No products are out of stock.",
  stockZero: "Stock 0",
  customer: "Customer",
  total: "Total",
  status: "Status",
  order: "Order",
  noDataFound: "No data found.",
  loginToDashboard: "Login To Dashboard",
  adminLoginCopy: "Use an admin account to manage products, users, reviews, and order operations.",
  accountNotAllowedAdmin: "This account is not allowed to access the admin dashboard.",
  deleteProduct: "Delete Product",
  deleteProductConfirm: "Are you sure you want to delete this product?",
  delete: "Delete",
  productDeletedSuccess: "Product deleted successfully.",
  productUpdatedSuccess: "Product updated successfully.",
  productCreatedSuccess: "Product created successfully.",
  saveProductError: "Could not save product.",
  manageProductCatalog: "Manage the product catalog, pricing, inventory, and storefront visibility.",
  addProduct: "Add Product",
  image: "Image",
  product: "Product",
  price: "Price",
  stock: "Stock",
  actions: "Actions",
  noImage: "No image",
  noDescriptionAddedYet: "No description added yet.",
  uncategorized: "Uncategorized",
  outOfStockLabel: "Out of stock",
  stockCountLabel: "Stock {count}",
  edit: "Edit",
  editProduct: "Edit Product",
  addProductTitle: "Add Product",
  editProductCopy: "Update product details and replace the image if needed.",
  addProductCopy: "Create a new product and upload its main image directly to the backend.",
  close: "Close",
  productName: "Product name",
  selectCategory: "Select category",
  shortDescription: "Short description",
  fullDescription: "Full description",
  compareAtPrice: "Compare at price",
  badge: "Badge",
  productImage: "Product image",
  productImages: "Product images",
  imagePreview: "Image preview",
  featuredProduct: "Featured product",
  showOnFeaturedSection: "Show this product in featured sections",
  bestSeller: "Best seller",
  prioritizeInBestSellers: "Prioritize this product in best seller placements",
  saveChanges: "Save Changes",
  createProductCta: "Create Product",
  saving: "Saving...",
  ordersPageCopy: "Track customer orders, open full details, update statuses, and trigger shipments.",
  cancellationReasonRequiredAdmin: "Cancellation reason is required when admin cancels an order.",
  orderCancelledRefundedSuccess: "Order cancelled, stock restored, and the Stripe payment will be refunded automatically to the customer's original payment method.",
  orderCancelledStockRestored: "Order cancelled and stock restored.",
  orderUpdatedToStatus: "Order updated to {status}.",
  orderUpdateError: "Could not update order status.",
  shipmentCreatedSuccess: "Shipment created successfully.",
  shipmentCreateError: "Could not create shipment.",
  tracking: "Tracking",
  viewDetails: "View Details",
  orderDetails: "Order Details",
  paymentLabel: "Payment",
  shipping: "Shipping",
  na: "N/A",
  shippingAddress: "Shipping Address",
  items: "Items",
  quantityShort: "Qty {count}",
  updateStatus: "Update Status",
  cancellationReason: "Cancellation Reason",
  cancellationReasonPlaceholder: "Why is this order being cancelled?",
  saveStatus: "Save Status",
  shipmentReady: "Shipment Ready",
  cancelled: "Cancelled",
  delivered: "Delivered",
  createShipment: "Create Shipment",
  orderCancelRulesNote: "Cancel is allowed only until the order is delivered. If a paid Stripe order is cancelled, the refund is processed automatically back to the customer's original payment method.",
  refundStatus: "Refund Status",
  stripeRefundAutoCustomer: "This Stripe payment has been refunded automatically to the customer's original payment method.",
  revenuePageCopy: "Track when revenue was recognized and when it was removed because an order was cancelled.",
  revenueAdded: "Revenue Added",
  revenueRemoved: "Revenue Removed",
  netRevenue: "Net Revenue",
  date: "Date",
  type: "Type",
  method: "Method",
  amount: "Amount",
  noRevenueActivity: "No revenue activity found yet.",
  cancelledByLine: "Cancelled by {actor}",
  revenueRecordedStripe: "Revenue recorded automatically after Stripe payment.",
  revenueRecordedCod: "Revenue recorded after COD order was delivered.",
  revenueRemovedStripe: "Revenue removed because the order was cancelled and the Stripe payment was refunded automatically.",
  revenueRemovedCod: "Revenue removed because the COD order was cancelled.",
  categoriesPageCopy: "Create main categories, subcategories, and upload artwork for navigation cards.",
  addCategory: "Add Category",
  parent: "Parent",
  sort: "Sort",
  categoryCreatedSuccess: "Category created successfully.",
  categoryUpdatedSuccess: "Category updated successfully.",
  couldNotCreateCategory: "Could not create category.",
  couldNotUpdateCategory: "Could not update category.",
  deleteCategoryTitle: "Delete Category",
  deleteCategoryConfirm: "Are you sure you want to delete this category?",
  categoryRemovedSuccess: "Category removed successfully.",
  mainCategory: "Main category",
  orderCountLabel: "Order {count}",
  addCategoryTitle: "Add Category",
  editCategoryTitle: "Edit Category",
  addCategoryCopy: "Create a main category or assign a parent category to create a subcategory.",
  editCategoryCopy: "Update category details and replace the artwork if needed.",
  categoryName: "Category name",
  parentCategory: "Parent category",
  noParentMainCategory: "No parent (main category)",
  sortOrder: "Sort order",
  categoryImage: "Category image",
  mainCategoryToggle: "Main category",
  parentSelected: "Parent selected",
  yes: "Yes",
  no: "No",
  createCategoryCta: "Create Category",
  couponsPageCopy: "Create discount codes and manage the offer type and value in one place.",
  addCoupon: "Add Coupon",
  code: "Code",
  value: "Value",
  couponCreatedSuccess: "Coupon created successfully.",
  couponUpdatedSuccess: "Coupon updated successfully.",
  couldNotCreateCoupon: "Could not create coupon.",
  couldNotUpdateCoupon: "Could not update coupon.",
  deleteCouponTitle: "Delete Coupon",
  deleteCouponConfirm: "Are you sure you want to delete this coupon?",
  couponRemovedSuccess: "Coupon removed successfully.",
  percentageDiscount: "Percentage discount",
  fixedDiscount: "Fixed discount",
  addCouponTitle: "Add Coupon",
  editCouponTitle: "Edit Coupon",
  addCouponCopy: "Create a new discount code for cart and checkout promotions.",
  editCouponCopy: "Update the coupon settings and expiry date.",
  couponCodeLabel: "Coupon code",
  discountType: "Discount type",
  percentage: "percentage",
  fixed: "fixed",
  discountValue: "Discount value",
  expiresAtLabel: "Expires at",
  noExpiry: "No expiry",
  createCouponCta: "Create Coupon",
  remove: "Remove",
  usersPageCopy: "View registered users, their roles, and saved address counts.",
  addUser: "Add User",
  name: "Name",
  role: "Role",
  userCreatedSuccess: "User created successfully.",
  couldNotCreateUser: "Could not create user.",
  addressCount: "{count} addresses",
  userUnblockedSuccess: "User unblocked successfully.",
  userBlockedSuccess: "User blocked successfully.",
  block: "Block",
  unblock: "Unblock",
  deleteUserTitle: "Delete User",
  deleteUserConfirm: "Are you sure you want to delete this user?",
  userDeletedSuccess: "User deleted successfully.",
  addUserTitle: "Add User",
  addUserCopy: "Create a new customer or admin account directly from the dashboard.",
  firstNameLabel: "First name",
  lastNameLabel: "Last name",
  createUserCta: "Create User",
  reviewsPageCopy: "Monitor product feedback and edit or remove reviews when moderation is needed.",
  reviewUpdatedSuccess: "Review updated successfully.",
  couldNotUpdateReview: "Could not update review.",
  deleteReviewTitle: "Delete Review",
  deleteReviewConfirm: "Are you sure you want to delete this review?",
  reviewDeletedSuccess: "Review deleted successfully.",
  couldNotDeleteReview: "Could not delete review.",
  reviewLabel: "Review",
  unknownProduct: "Unknown product",
  unknownUser: "Unknown user",
  editReview: "Edit Review",
  editReviewCopy: "Update the review content, rating, or approval state.",
  rating: "Rating",
  approvedReview: "Approved review",
  comment: "Comment",
  updateReview: "Update Review",
  bannersPageCopy: "Manage hero, promo, and footer banners with uploaded artwork and CTA links.",
  addBanner: "Add Banner",
  bannerUpdatedSuccess: "Banner updated successfully.",
  bannerCreatedSuccess: "Banner created successfully.",
  couldNotSaveBanner: "Could not save banner.",
  bannerLabel: "Banner",
  placement: "Placement",
  noSubtitleAddedYet: "No subtitle added yet.",
  deleteBannerTitle: "Delete Banner",
  deleteBannerConfirm: "Are you sure you want to delete this banner?",
  bannerDeletedSuccess: "Banner deleted successfully.",
  editBanner: "Edit Banner",
  addBannerTitle: "Add Banner",
  editBannerCopy: "Update banner details, artwork, and visibility dates.",
  addBannerCopy: "Create a new banner with uploaded artwork and CTA metadata.",
  subtitle: "Subtitle",
  ctaLabel: "CTA label",
  ctaHref: "CTA href",
  startDate: "Start date",
  endDate: "End date",
  bannerImage: "Banner image",
  bannerImageHint: "Recommended size: 1600 x 640 px for the best banner fit.",
  updateBanner: "Update Banner",
  createBanner: "Create Banner",
  blogPosts: "Blog Posts",
  blogPageCopy: "Publish editorial content with uploaded cover images and article excerpts.",
  addBlogPost: "Add Blog Post",
  post: "Post",
  slug: "Slug",
  blogContentMinLength: "Blog content must be at least 10 characters long.",
  blogPostCreatedSuccess: "Blog post created successfully.",
  couldNotCreateBlogPost: "Could not create blog post.",
  noExcerptAddedYet: "No excerpt added yet.",
  published: "Published",
  draft: "Draft",
  deleteBlogPostTitle: "Delete Blog Post",
  deleteBlogPostConfirm: "Are you sure you want to delete this blog post?",
  blogPostDeletedSuccess: "Blog post deleted successfully.",
  addBlogPostTitle: "Add Blog Post",
  addBlogPostCopy: "Create a published article with excerpt, content, and cover image.",
  excerpt: "Excerpt",
  content: "Content",
  coverImage: "Cover image",
  publishPost: "Publish Post",
  pagesPageCopy: "Manage static content pages for about, contact, policies, and other storefront sections.",
  addPage: "Add Page",
  pageCreatedSuccess: "Page created successfully.",
  couldNotCreatePage: "Could not create page.",
  deletePageTitle: "Delete Page",
  deletePageConfirm: "Are you sure you want to delete this page?",
  pageRemovedSuccess: "Page removed successfully.",
  noContentAddedYet: "No content added yet.",
  addPageTitle: "Add Page",
  addPageCopy: "Create a new CMS page with a title and rich content body.",
  pageTitle: "Page title",
  pageContent: "Page content",
  createPageCta: "Create Page",
  settingsPageCopy: "Update storefront text, config values, and saved CMS keys from one place.",
  key: "Key",
  save: "Save",
};

const fallbackArabicTranslations = {
  adminAccess: "دخول الإدارة",
  login: "تسجيل الدخول",
  language: "اللغة",
  english: "الإنجليزية",
  arabic: "العربية",
  adminDashboard: "لوحة التحكم",
  openLanguageMenu: "فتح قائمة اللغة",
  loginToDashboard: "تسجيل الدخول إلى لوحة التحكم",
  adminLoginCopy: "استخدم حساب المدير لإدارة المنتجات والمستخدمين والمراجعات وعمليات الطلبات.",
  accountNotAllowedAdmin: "هذا الحساب غير مسموح له بالدخول إلى لوحة التحكم.",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  close: "إغلاق",
  logout: "تسجيل الخروج",
  stayHere: "البقاء هنا",
};

const STORAGE_KEY = "nr-admin-language";
const CACHE_PREFIX = "nr-admin-language-cache-";
const LANGUAGE_VERSION_KEY = "nr-admin-language-version";
const LANGUAGE_VERSION = "3";
const DEFAULT_LANGUAGE = "ar";
const LanguageContext = createContext(null);

function mapTranslations(keys, values) {
  return keys.reduce((accumulator, key, index) => {
    accumulator[key] = values[index] || baseTranslations[key];
    return accumulator;
  }, {});
}

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const storedVersion = localStorage.getItem(LANGUAGE_VERSION_KEY);
    const storedLanguage = localStorage.getItem(STORAGE_KEY);

    if (storedVersion !== LANGUAGE_VERSION) {
      localStorage.setItem(LANGUAGE_VERSION_KEY, LANGUAGE_VERSION);
      localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
      return DEFAULT_LANGUAGE;
    }

    return storedLanguage || DEFAULT_LANGUAGE;
  });
  const [dynamicTranslations, setDynamicTranslations] = useState({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    let isCancelled = false;

    async function loadTranslations() {
      if (language === "en") {
        setDynamicTranslations({});
        return;
      }

      const cacheKey = `${CACHE_PREFIX}${language}`;
      const cachedTranslations = localStorage.getItem(cacheKey);
      if (cachedTranslations) {
        try {
          const parsed = JSON.parse(cachedTranslations);
          if (!isCancelled) {
            setDynamicTranslations(parsed);
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }

      setIsLoadingTranslations(true);

      try {
        const keys = Object.keys(baseTranslations);
        const { translations } = await translateBatch({
          target: language,
          texts: keys.map((key) => baseTranslations[key]),
        });

        const mappedTranslations = mapTranslations(keys, translations);
        localStorage.setItem(cacheKey, JSON.stringify(mappedTranslations));

        if (!isCancelled) {
          setDynamicTranslations(mappedTranslations);
        }
      } catch {
        if (!isCancelled && cachedTranslations) {
          try {
            setDynamicTranslations(JSON.parse(cachedTranslations));
          } catch {
            setDynamicTranslations({});
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTranslations(false);
        }
      }
    }

    loadTranslations();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      isRtl: language === "ar",
      isLoadingTranslations,
      setLanguage,
      t(key, variables = {}) {
        const template =
          language === "en"
            ? baseTranslations[key] || key
            : dynamicTranslations[key] || fallbackArabicTranslations[key] || baseTranslations[key] || key;

        return Object.entries(variables).reduce(
          (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
          template,
        );
      },
      getLanguageLabel(code) {
        return code === "ar" ? baseTranslations.arabic : baseTranslations.english;
      },
      toggleLanguage() {
        setLanguage((current) => (current === "en" ? "ar" : "en"));
      },
    }),
    [dynamicTranslations, isLoadingTranslations, language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export { LanguageProvider, useLanguage };
