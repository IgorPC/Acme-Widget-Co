import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Every request starting with /api (and Laravel's /up health check)
      // is forwarded to the Laravel backend, so the browser sees a single
      // origin and no CORS configuration is needed in development.
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/up': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
