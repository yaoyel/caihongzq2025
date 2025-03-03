import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 80,
    host: true,
    proxy: {
      '/api': {
        target: 'localhost:3000',
        changeOrigin: true,
      },
    },
    // allowedHosts: ['localhost', '52.131.243.151'],
  },
}) 