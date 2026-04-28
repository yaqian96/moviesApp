import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import uniTailwind from '@uni-helper/vite-plugin-uni-tailwind'
import tailwindcss from 'tailwindcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
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
    proxy: {
      '/api': {
        target: 'https://media.blueone-media.top',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/emby'),
      },
    },
  },
})