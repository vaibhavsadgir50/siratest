import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/h': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/r': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/w': { target: 'ws://127.0.0.1:3000', ws: true },
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
})
