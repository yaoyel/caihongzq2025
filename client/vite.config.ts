/// <reference types="vite/client" />
/// <reference path="./src/types/env.d.ts" />

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
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
          target: env.VITE_API_HOST,
          changeOrigin: true,
        },
      },
    },
  }
})