import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
  }
})
