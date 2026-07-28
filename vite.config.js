import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 本地开发用 '/'，构建部署用 '/Python-100-Days-Web/'
  base: command === 'serve' ? '/' : '/Python-100-Days-Web/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))
