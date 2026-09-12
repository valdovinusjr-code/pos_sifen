import { defineConfig } from 'vite'
import { resolve } from 'node:path'

const pages = ['dashboard', 'caja', 'ventas', 'clientes', 'inventario', 'stock', 'documentos', 'admin']

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(pages.map(page => [page, resolve(import.meta.dirname, `src/pages/${page}/${page}.html`)]))
      }
    }
  }
})
