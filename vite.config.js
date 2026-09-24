import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    // Mermaid 11.17 ships one optional parser module at ~662 KB. It remains
    // lazy-loaded only for diagrams, so keep the warning threshold above it.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 3,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|framer-motion)[\\/]/,
              priority: 2,
            },
            {
              name: 'mermaid-vendor',
              test: /node_modules[\\/](mermaid|@mermaid-js|cytoscape|cytoscape-cose-bilkent|dagre-d3-es)[\\/]/,
              includeDependenciesRecursively: true,
              maxSize: 400000,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
