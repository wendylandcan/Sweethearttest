import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// 开发环境下加载 Eruda 调试工具
if (import.meta.env.DEV) {
  import('eruda').then(eruda => {
    eruda.default.init();
    console.log('Eruda 调试工具已启动');
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
