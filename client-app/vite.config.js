import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false
    }
  },
  server: {
    port: Number(process.env.VITE_PORT || 5174),
    strictPort: true
  }
})
