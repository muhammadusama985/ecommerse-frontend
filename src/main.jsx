import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ShopProvider } from "./context/ShopContext.jsx";
import "./styles/global.css";

// ✅ ADD THIS LINE - Forces 80% zoom on ALL pages
document.documentElement.style.zoom = "0.98";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <NotificationProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </NotificationProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);