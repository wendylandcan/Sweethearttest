import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = env.VITE_SITE_URL || ''
  const port = Number(env.VITE_PORT || 5300)

  const base = (typeof process.env.VITE_BASE_PATH === 'string' && process.env.VITE_BASE_PATH) || ''

  return {
    base,
    plugins: [
      react(),
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html.replace(/__VITE_SITE_URL__/g, siteUrl)
        },
      },
      // Gzip 压缩
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 大于 10KB 的文件才压缩
        algorithm: 'gzip',
        ext: '.gz',
      }),
    ],
    server: {
      host: 'localhost',
      port,
      strictPort: false,
    },
    preview: {
      host: 'localhost',
      port,
      strictPort: false,
    },
    build: {
      // 代码分割优化
      rollupOptions: {
        output: {
          // 分离第三方库
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['framer-motion'],
            'chart-vendor': ['recharts'],
            'html2canvas-vendor': ['html2canvas'],
          },
          // 优化文件名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // 根据文件类型分类
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            } else if (/mp3|wav|ogg/i.test(ext)) {
              return `assets/audio/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
      },
      // 压缩选项
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console
          drop_debugger: true,
        },
      },
      // 分块大小警告限制
      chunkSizeWarningLimit: 1000,
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // 生成 sourcemap（可选，调试用）
      sourcemap: false,
    },
  }
})
