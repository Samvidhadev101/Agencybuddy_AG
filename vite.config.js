import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { edgeFunctionProxy } from './edgeProxy.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    edgeFunctionProxy()
  ],
  server: {
    proxy: {
      '/xai-api': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xai-api/, '')
      }
    }
  }
})
