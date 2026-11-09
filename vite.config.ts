import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: { port: 3000, strictPort: true },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    // TanStack Start's plugin must come before React's plugin.
    tanstackStart(),
    viteReact(),
  ],
})
