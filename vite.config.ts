import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Darts Tournament',
        short_name: 'Darts',
        description: 'Professional darts tournament management PWA',
        theme_color: '#006655',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    // Allow requests from nginx reverse proxy
    host: true,
    port: 5173,
    strictPort: false,
    // Trust proxy headers
    proxy: {}
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false
  }
})
