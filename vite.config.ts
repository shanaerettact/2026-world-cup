import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://worldcup.jfshield.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const raw = proxyRes.headers['set-cookie']
            if (!raw) return
            const cookies = Array.isArray(raw) ? raw : [raw]
            proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
              cookie
                .replace(/;\s*Domain=[^;]+/gi, '')
                .replace(/;\s*Secure/gi, '')
                .replace(/;\s*SameSite=\s*[^;]+/gi, '; SameSite=Lax')
                .replace(/;\s*Partitioned/gi, ''),
            )
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
