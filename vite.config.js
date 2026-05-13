import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import uniTailwind from '@uni-helper/vite-plugin-uni-tailwind'
import tailwindcss from 'tailwindcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const devPort = Number(process.env.VITE_DEV_PORT) || 8080

const embyDevProxyTarget =
  process.env.VITE_EMBY_DEV_PROXY_TARGET || 'https://media.blueone-media.top'

const embyApiProxy = {
  '/api': {
    target: embyDevProxyTarget,
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api/, '/emby'),
    proxyTimeout: 600_000,
    timeout: 600_000,
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
    port: devPort,
    proxy: embyApiProxy,
  },
  preview: {
    port: devPort,
    proxy: embyApiProxy,
  },
})