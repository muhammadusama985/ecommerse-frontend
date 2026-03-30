import { Navigate, Route, Routes } from "react-router-dom";
import { AdminProvider, useAdmin } from "./context/AdminContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { AdminNotificationProvider } from "./context/AdminNotificationContext.jsx";
import { AdminShell } from "./components/AdminShell.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { ProductsPage } from "./pages/ProductsPage.jsx";
import { CategoriesPage } from "./pages/CategoriesPage.jsx";
import { CouponsPage } from "./pages/CouponsPage.jsx";
import { BlogPage } from "./pages/BlogPage.jsx";
import { BannersPage } from "./pages/BannersPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { UsersPage } from "./pages/UsersPage.jsx";
import { ReviewsPage } from "./pages/ReviewsPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { RevenuePage } from "./pages/RevenuePage.jsx";
import "./styles/global.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminShell><DashboardPage /></AdminShell></ProtectedRoute>} />
      <Route path="products" element={<ProtectedRoute><AdminShell><ProductsPage /></AdminShell></ProtectedRoute>} />
      <Route path="categories" element={<ProtectedRoute><AdminShell><CategoriesPage /></AdminShell></ProtectedRoute>} />
      <Route path="coupons" element={<ProtectedRoute><AdminShell><CouponsPage /></AdminShell></ProtectedRoute>} />
      <Route path="blog" element={<ProtectedRoute><AdminShell><BlogPage /></AdminShell></ProtectedRoute>} />
      <Route path="banners" element={<ProtectedRoute><AdminShell><BannersPage /></AdminShell></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute><AdminShell><SettingsPage /></AdminShell></ProtectedRoute>} />
      <Route path="users" element={<ProtectedRoute><AdminShell><UsersPage /></AdminShell></ProtectedRoute>} />
      <Route path="reviews" element={<ProtectedRoute><AdminShell><ReviewsPage /></AdminShell></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute><AdminShell><OrdersPage /></AdminShell></ProtectedRoute>} />
      <Route path="revenue" element={<ProtectedRoute><AdminShell><RevenuePage /></AdminShell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AdminApp() {
  return (
    <LanguageProvider>
      <AdminNotificationProvider>
        <AdminProvider>
          <AdminRoutes />
        </AdminProvider>
      </AdminNotificationProvider>
    </LanguageProvider>
  );
}

export { AdminApp };
