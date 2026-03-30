import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translateBatch } from "../api/translate";

const baseTranslations = {
  promoBar: "Free shipping on orders over AED 50 | Use code BEAUTY20 for your first order",
  home: "Home",
  allProducts: "All Products",
  bestSellers: "Best Sellers",
  blog: "Blog",
  wishlist: "Wishlist",
  orders: "Orders",
  about: "About",
  contact: "Contact",
  login: "Login",
  logout: "Logout",
  profile: "Profile",
  cart: "Cart",
  searchProducts: "Search products...",
  beautyStorefront: "Beauty Storefront",
  collections: "Collections",
  highlights: "Highlights",
  shopByCategory: "Shop By Category",
  featuredProducts: "Featured Products",
  lovedByCustomers: "Loved By Returning Customers",
  exploreBestSellers: "Explore Best Sellers",
  shopNow: "Shop Now",
  loading: "Loading...",
  search: "Search",
  categories: "Categories",
  minRating: "Minimum Rating",
  shoppingCart: "Shopping Cart",
  orderSummary: "Order Summary",
  checkout: "Checkout",
  forgotPassword: "Forgot Password",
  sendResetLink: "Send Reset Link",
  resetPassword: "Reset Password",
  createAccount: "Create Account",
  yourAccount: "Your Account",
  yourOrderHistory: "Your Order History",
  savedBeautyPicks: "Saved Beauty Picks",
  beautyJournal: "Beauty Journal",
  article: "Article",
  readMore: "Read More",
  information: "Information",
  writeReview: "Write A Review",
  submitReview: "Submit Review",
  welcomeBack: "Welcome Back",
  loginToContinue: "Login To Continue Shopping",
  signInMessage: "Sign in to access your cart, wishlist, addresses, and order history.",
  email: "Email",
  password: "Password",
  noAccount: "No account yet?",
  createOne: "Create one",
  joinStore: "Join The Store",
  createBeautyAccount: "Create Your Beauty Account",
  registerMessage: "Register to save addresses, manage your wishlist, and place secure orders.",
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  alreadyRegistered: "Already registered?",
  loginHere: "Login here",
  loginRequired: "Login Required",
  goToLogin: "Go To Login",
  viewCartLogin: "Please login to view your cart and continue with checkout.",
  yourSavedItems: "Your Saved Items",
  guestCheckoutDisabled: "Guest checkout is disabled, so all orders will be placed from your logged-in customer account.",
  cartEmpty: "Your cart is empty right now.",
  exploreProducts: "Explore Products",
  couponCode: "Coupon code",
  apply: "Apply",
  removeCoupon: "Remove Coupon",
  subtotal: "Subtotal",
  discount: "Discount",
  total: "Total",
  confirmOrder: "Confirm Your Order",
  checkoutMessage: "Select your shipping address and payment method before placing the order.",
  shippingAddress: "Shipping Address",
  noSavedAddress: "No saved address yet. Please add one from your profile.",
  paymentMethod: "Payment Method",
  cashOnDelivery: "Cash On Delivery",
  codAvailable: "Available now for the current phase.",
  stripeCard: "Stripe Card Payment",
  stripeNote: "Backend support exists, but it needs real Stripe configuration to complete live card flow.",
  placeOrder: "Place Order",
  profileUpdated: "Profile updated successfully.",
  addressAdded: "Address added successfully.",
  manageDetails: "Manage your customer details and shipping information.",
  remove: "Remove",
  productsBookmarked: "Products you've bookmarked for later.",
  wishlistEmpty: "Your wishlist is empty right now.",
  noOrders: "No orders found yet.",
  startShopping: "Start Shopping",
  status: "Status",
  payment: "Payment",
  resetAccess: "Reset Access",
  forgotPasswordHelp: "Enter your email and we'll send a reset link if your account exists.",
  newPassword: "New Password",
  resetPasswordHelp: "Use the reset link sent to your email to set a new password.",
  pageNotFound: "Page not found.",
  blogNotFound: "Blog post not found.",
  blogPageCopy: "Editorial beauty stories, skincare routines, and product education managed from your backend CMS.",
  language: "Language",
  english: "English",
  arabic: "Arabic",
  beautyEssentials: "Beauty Essentials",
  shop: "Shop",
  company: "Company",
  support: "Support",
  myAccount: "My Account",
  footerBlurb: "A modern beauty storefront for skincare, makeup, haircare, and fragrance with a refined shopping experience across every screen.",
  confirmAction: "Confirm Action",
  logoutConfirmTitle: "Log out of your account?",
  logoutConfirmCopy: "You can log back in anytime to access your cart, wishlist, and order history.",
  cancel: "Cancel",
  loggedOutSuccess: "You have been logged out successfully.",
  openLanguageMenu: "Open language menu",
  openAccountMenu: "Open account menu",
  adminLoginOnly: "Admin accounts must use the admin login.",
  loginFailedGeneric: "Login failed. Please check your email and password.",
  registrationFailedGeneric: "Registration failed. Please check your details and try again.",
  couldNotUpdateCartQuantity: "Could not update cart quantity.",
  couldNotRemoveCartItem: "Could not remove cart item.",
  couponAppliedSuccess: "Coupon applied successfully.",
  couponApplyError: "Coupon could not be applied.",
  cartClearedSuccess: "Cart cleared successfully.",
  cartClearError: "Could not clear cart.",
  continueShopping: "Continue Shopping",
  clearCart: "Clear Cart",
  noImageLabel: "No image",
  beautyFallback: "Beauty",
  outOfStockNow: "Out of stock",
  availableCount: "{count} available",
  removeOutOfStockBeforeCheckout: "Remove out-of-stock items before checkout.",
  couldNotRemoveCoupon: "Could not remove coupon.",
  cartReviewCopy: "Review your beauty picks, update quantities, and continue to secure checkout.",
  homeAllProductsCrumb: "Home / All Products",
  allProductsTitle: "All Products",
  allProductsCopy: "Browse the full catalog with working category, price, rating, and sort filters.",
  searchLabel: "Search",
  categoriesLabel: "Categories",
  allCategories: "All Categories",
  priceRange: "Price Range",
  min: "Min",
  max: "Max",
  sortBy: "Sort By",
  newest: "Newest",
  bestSelling: "Best Selling",
  priceLowToHigh: "Price Low to High",
  priceHighToLow: "Price High to Low",
  topRated: "Top Rated",
  minimumRating: "Minimum Rating",
  allRatings: "All Ratings",
  stars3Plus: "3+ Stars",
  stars4Plus: "4+ Stars",
  showingProductsCount: "Showing {count} products",
  loadingGeneric: "Loading...",
  bestSellerDataError: "Best seller data could not be loaded. Make sure the backend is running.",
  homeBestSellersCrumb: "Home / Best Sellers",
  searchBestSellers: "Search best sellers...",
  showingBestSellersCount: "Showing {count} best selling products",
  homepageDataError: "Homepage data could not be loaded. Make sure the backend is running.",
  bannerIndicators: "Banner indicators",
  showBannerNumber: "Show banner {index}",
  shopByCategoryCopy: "Explore categories created from the admin dashboard and browse products with live filtering.",
  featuredProductsCopy: "Curated beauty picks highlighted from your admin-managed catalog.",
  topSellingProducts: "Top Selling Products",
  topSellingProductsCopy: "Best-performing products displayed with the same professional product cards used across the storefront.",
  viewProducts: "View Products",
  categoryFallbackCopy: "Explore premium beauty essentials curated for everyday confidence.",
  unavailable: "Unavailable",
  soldCount: "{count}+ sold",
  loadingProduct: "Loading product...",
  productLoadError: "Product details could not be loaded.",
  homeProductsBreadcrumb: "Home",
  productsBreadcrumb: "Products",
  reviewsCountLabel: "({count} reviews)",
  totalForQuantity: "Total for {quantity}: AED {total}",
  itemsAvailable: "{count} {itemWord} available",
  outOfStockLabel: "Out of stock",
  outOfStockCta: "Out Of Stock",
  wishlistAction: "Wishlist",
  writeAReview: "Write A Review",
  reviewTitlePlaceholder: "Title",
  reviewsCountHeading: "Customer Reviews ({count})",
  quantityShort: "Qty {count}",
  manageProfileCopy: "Manage your customer details and shipping information.",
  addresses: "Addresses",
  savedAddresses: "Saved Addresses",
  saveProfile: "Save Profile",
  profileUpdatedSuccess: "Profile updated successfully.",
  couldNotUpdateProfile: "Could not update profile.",
  addressAddedSuccess: "Address added successfully.",
  couldNotAddAddress: "Could not add address.",
  addressRemovedSuccess: "Address removed successfully.",
  couldNotRemoveAddress: "Could not remove address.",
  defaultAddress: "(Default)",
  label: "Label",
  fullName: "Full Name",
  city: "City",
  addressLine1: "Address Line 1",
  area: "Area",
  postalCode: "Postal Code",
  makeDefaultAddress: "Make this my default address",
  addAddress: "Add Address",
  productOutOfStockNow: "This product is out of stock right now.",
  addedToCartSuccess: "Product added to cart successfully.",
  couldNotAddToCart: "Could not add product to cart.",
  removedFromWishlist: "Removed from wishlist.",
  addedToWishlist: "Added to wishlist.",
  couldNotUpdateWishlist: "Could not update wishlist.",
  reviewSubmittedSuccess: "Review submitted successfully.",
  couldNotSubmitReview: "Could not submit review.",
  addToCart: "Add To Cart",
  saved: "Saved",
  fastDispatch: "Fast dispatch",
  securePayment: "Secure payment",
  qualityAssured: "Quality assured",
  description: "Description",
  premiumProductFallback: "Premium beauty product details will be managed from the admin dashboard.",
  customerReviews: "Customer Reviews ({count})",
  noReviewsYet: "No reviews yet.",
  title: "Title",
  shareYourExperience: "Share your experience",
  relatedProducts: "Related Products",
  youMayAlsoLike: "You May Also Like",
  socialContinueWith: "Or continue with",
  googleLoginFailed: "Google login failed.",
  facebookLoginFailed: "Facebook login failed.",
  appleLoginFailed: "Apple login failed.",
  googleClientIdMissing: "Google Client ID is missing.",
  googleSigninLoadError: "Google Sign In could not be loaded.",
  facebookAppIdMissing: "Facebook App ID is missing.",
  facebookLoginCancelled: "Facebook login was cancelled.",
  appleSigninConfigMissing: "Apple Sign In is not configured yet.",
  appleSigninLoadError: "Apple Sign In could not be loaded.",
  continueWithGoogle: "Continue with Google",
  continueWithFacebook: "Continue with Facebook",
  continueWithApple: "Continue with Apple",
  carouselPrevCategories: "Scroll categories left",
  carouselNextCategories: "Scroll categories right",
  carouselPrevFeatured: "Scroll featured products left",
  carouselNextFeatured: "Scroll featured products right",
  carouselPrevTopSelling: "Scroll top selling products left",
  carouselNextTopSelling: "Scroll top selling products right",
};

const fallbackArabicTranslations = {
  carouselPrevCategories: "تحريك الفئات نحو اليسار",
  carouselNextCategories: "تحريك الفئات نحو اليمين",
  carouselPrevFeatured: "تحريك المنتجات المميزة نحو اليسار",
  carouselNextFeatured: "تحريك المنتجات المميزة نحو اليمين",
  carouselPrevTopSelling: "تحريك المنتجات الأكثر مبيعاً نحو اليسار",
  carouselNextTopSelling: "تحريك المنتجات الأكثر مبيعاً نحو اليمين",
  promoBar: "شحن مجاني للطلبات فوق 50 درهم | استخدم كود BEAUTY20 لأول طلب لك",
  home: "الرئيسية",
  allProducts: "كل المنتجات",
  bestSellers: "الأكثر مبيعاً",
  blog: "المدونة",
  wishlist: "المفضلة",
  orders: "الطلبات",
  about: "من نحن",
  contact: "اتصل بنا",
  login: "تسجيل الدخول",
  logout: "تسجيل الخروج",
  profile: "الملف الشخصي",
  cart: "السلة",
  searchProducts: "ابحث عن المنتجات...",
  shopByCategory: "تسوق حسب الفئة",
  featuredProducts: "منتجات مميزة",
  loading: "جاري التحميل...",
  search: "بحث",
  categories: "الفئات",
  minRating: "الحد الأدنى للتقييم",
  shoppingCart: "سلة التسوق",
  orderSummary: "ملخص الطلب",
  checkout: "إتمام الطلب",
  forgotPassword: "نسيت كلمة المرور",
  sendResetLink: "إرسال رابط إعادة التعيين",
  resetPassword: "إعادة تعيين كلمة المرور",
  createAccount: "إنشاء حساب",
  yourAccount: "حسابك",
  yourOrderHistory: "سجل طلباتك",
  savedBeautyPicks: "اختياراتك المحفوظة",
  beautyJournal: "مجلة الجمال",
  article: "مقال",
  readMore: "اقرأ المزيد",
  information: "معلومات",
  writeReview: "اكتب تقييماً",
  submitReview: "إرسال التقييم",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  firstName: "الاسم الأول",
  lastName: "اسم العائلة",
  phone: "الهاتف",
  loginRequired: "تسجيل الدخول مطلوب",
  goToLogin: "اذهب إلى تسجيل الدخول",
  exploreProducts: "استكشف المنتجات",
  couponCode: "رمز القسيمة",
  apply: "تطبيق",
  removeCoupon: "إزالة القسيمة",
  subtotal: "الإجمالي الفرعي",
  discount: "الخصم",
  total: "الإجمالي",
  shippingAddress: "عنوان الشحن",
  paymentMethod: "طريقة الدفع",
  cashOnDelivery: "الدفع عند الاستلام",
  placeOrder: "تأكيد الطلب",
  remove: "إزالة",
  status: "الحالة",
  payment: "الدفع",
  pageNotFound: "الصفحة غير موجودة.",
  blogNotFound: "المقال غير موجود.",
  language: "اللغة",
  english: "الإنجليزية",
  arabic: "العربية",
  beautyEssentials: "أساسيات الجمال",
  shop: "التسوق",
  company: "الشركة",
  support: "الدعم",
  myAccount: "حسابي",
  footerBlurb: "متجر جمال عصري للعناية بالبشرة والمكياج والعناية بالشعر والعطور مع تجربة تسوق أنيقة عبر جميع الشاشات.",
  cancel: "إلغاء",
  continueShopping: "متابعة التسوق",
  clearCart: "تفريغ السلة",
  beautyFallback: "الجمال",
  outOfStockNow: "نفد من المخزون",
  homeAllProductsCrumb: "الرئيسية / كل المنتجات",
  allProductsTitle: "كل المنتجات",
  allProductsCopy: "تصفح كامل الكتالوج مع فلاتر الفئات والسعر والتقييم والترتيب.",
  searchLabel: "بحث",
  categoriesLabel: "الفئات",
  allCategories: "كل الفئات",
  priceRange: "نطاق السعر",
  min: "الأدنى",
  max: "الأعلى",
  sortBy: "الترتيب حسب",
  newest: "الأحدث",
  bestSelling: "الأكثر مبيعاً",
  priceLowToHigh: "السعر من الأقل إلى الأعلى",
  priceHighToLow: "السعر من الأعلى إلى الأقل",
  topRated: "الأعلى تقييماً",
  minimumRating: "الحد الأدنى للتقييم",
  allRatings: "كل التقييمات",
  stars3Plus: "3 نجوم فأكثر",
  stars4Plus: "4 نجوم فأكثر",
  applyFilters: "تطبيق الفلاتر",
  clearFilters: "مسح الفلاتر",
  showingProductsCount: "عرض {count} منتج",
  loadingGeneric: "جاري التحميل...",
  bestSellerDataError: "تعذر تحميل بيانات الأكثر مبيعاً. تأكد من تشغيل الخادم.",
  homeBestSellersCrumb: "الرئيسية / الأكثر مبيعاً",
  searchBestSellers: "ابحث في الأكثر مبيعاً...",
  showingBestSellersCount: "عرض {count} من المنتجات الأكثر مبيعاً",
  homepageDataError: "تعذر تحميل الصفحة الرئيسية. تأكد من تشغيل الخادم.",
  bannerIndicators: "مؤشرات البنرات",
  showBannerNumber: "عرض البنر {index}",
  shopByCategoryCopy: "استكشف الفئات التي تم إنشاؤها من لوحة التحكم وتصفح المنتجات مع فلاتر مباشرة.",
  featuredProductsCopy: "اختيارات جمالية مميزة من الكتالوج المُدار من لوحة التحكم.",
  topSellingProducts: "المنتجات الأكثر مبيعاً",
  topSellingProductsCopy: "أفضل المنتجات أداءً المعروضة بنفس بطاقات المنتجات الاحترافية عبر المتجر.",
  viewProducts: "عرض المنتجات",
  unavailable: "غير متوفر",
  loadingProduct: "جاري تحميل المنتج...",
  productLoadError: "تعذر تحميل تفاصيل المنتج.",
  homeProductsBreadcrumb: "الرئيسية",
  productsBreadcrumb: "المنتجات",
  outOfStockLabel: "نفد من المخزون",
  outOfStockCta: "نفد المخزون",
  wishlistAction: "المفضلة",
  manageProfileCopy: "قم بإدارة بياناتك وعناوين الشحن الخاصة بك.",
  addresses: "العناوين",
  savedAddresses: "العناوين المحفوظة",
  saveProfile: "حفظ الملف الشخصي",
  defaultAddress: "(افتراضي)",
  label: "الاسم",
  fullName: "الاسم الكامل",
  city: "المدينة",
  addressLine1: "العنوان 1",
  area: "المنطقة",
  postalCode: "الرمز البريدي",
  addAddress: "إضافة عنوان",
  addToCart: "أضف إلى السلة",
  saved: "محفوظ",
  fastDispatch: "شحن سريع",
  securePayment: "دفع آمن",
  qualityAssured: "جودة مضمونة",
  description: "الوصف",
  noReviewsYet: "لا توجد تقييمات بعد.",
  title: "العنوان",
  shareYourExperience: "شارك تجربتك",
  relatedProducts: "منتجات ذات صلة",
  youMayAlsoLike: "قد يعجبك أيضاً",
};

const STORAGE_KEY = "nr-language";
const CACHE_PREFIX = "nr-language-cache-v4-";
const LANGUAGE_VERSION_KEY = "nr-language-version";
const LANGUAGE_VERSION = "4";
const DEFAULT_LANGUAGE = "ar";
const LanguageContext = createContext(null);

function mapTranslations(keys, values) {
  return keys.reduce((accumulator, key, index) => {
    const translatedValue = values[index] || baseTranslations[key];
    accumulator[key] =
      translatedValue === baseTranslations[key] && fallbackArabicTranslations[key]
        ? fallbackArabicTranslations[key]
        : translatedValue;
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
            setDynamicTranslations(language === "ar" ? fallbackArabicTranslations : {});
          }
        } else if (!isCancelled && language === "ar") {
          setDynamicTranslations(fallbackArabicTranslations);
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
