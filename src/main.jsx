import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Google Analytics 配置
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // 替换为你的 GA ID

// 生产环境下初始化 Google Analytics
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // 加载 gtag.js 脚本
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // 初始化 dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  console.log('✅ Google Analytics 已初始化');
}

// 开发环境下加载 Eruda 调试工具
if (import.meta.env.DEV && typeof window !== 'undefined') {
  import('eruda')
    .then(eruda => {
      if (eruda && eruda.default) {
        eruda.default.init();
        console.log('Eruda 调试工具已启动');
      }
    })
    .catch(err => {
      console.log('Eruda 加载失败（可忽略）:', err.message);
    });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
