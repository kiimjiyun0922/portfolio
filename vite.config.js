import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 2,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|framer-motion)[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
