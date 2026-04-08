import { Routes, Route } from "react-router-dom";
import { Shell } from "./components/Shell.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { BestSellersPage } from "./pages/BestSellersPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { WishlistPage } from "./pages/WishlistPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { AllProductsPage } from "./pages/AllProductsPage.jsx";
import { CategoriesPage } from "./pages/CategoriesPage.jsx";
import { ContentPage } from "./pages/ContentPage.jsx";
import { BlogPage } from "./pages/BlogPage.jsx";
import { BlogDetailPage } from "./pages/BlogDetailPage.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { AdminApp } from "./admin/AdminApp.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route
        path="*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/best-sellers" element={<BestSellersPage />} />
              <Route path="/products" element={<AllProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/pages/:slug" element={<ContentPage />} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}

export default App;
