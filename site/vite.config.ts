import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build can be served from a repo subpath (GitHub Pages) or any host.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets-build' },
})
