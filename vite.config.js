import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import uniTailwind from '@uni-helper/vite-plugin-uni-tailwind'
import tailwindcss from 'tailwindcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const embyApiProxy = {
  '/api': {
    target: 'https://media.blueone-media.top',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api/, '/emby'),
  },
}

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  plugins: [uni(), uniTailwind()],
  server: {
    port: 8080,
    proxy: embyApiProxy,
  },
  preview: {
    port: 8080,
    proxy: embyApiProxy,
  },
})