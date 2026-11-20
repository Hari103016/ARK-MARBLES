
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor'
            }

            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }

            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
          }
        }
      }
    }
  }
})
