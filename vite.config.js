import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.js',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.js'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
