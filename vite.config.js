import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two backends share the /api prefix during development:
//   * Laravel CMS  -> http://localhost:8000
//   * Stripe demo  -> http://localhost:4242 (existing Express server)
// More specific proxy keys must be listed before the generic /api key.
const laravelApi = process.env.VITE_LARAVEL_PROXY_TARGET || 'http://localhost:8000'
const stripeApi = process.env.VITE_STRIPE_PROXY_TARGET || 'http://localhost:4242'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Laravel Sanctum + CMS endpoints
      '/sanctum': laravelApi,
      '/storage': laravelApi,
      '/api/login': laravelApi,
      '/api/logout': laravelApi,
      '/api/user': laravelApi,
      '/api/blogs': laravelApi,
      '/api/admin': laravelApi,

      // Existing Express/Stripe endpoints (/api/donations/total,
      // /api/create-payment-intent, /api/health)
      '/api': stripeApi,
    },
  },
})
