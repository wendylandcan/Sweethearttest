import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerServiceWorker } from "./utils/serviceWorker.js";

// 生产环境下注册 Service Worker
if (import.meta.env.PROD && typeof window !== 'undefined') {
  registerServiceWorker();
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
