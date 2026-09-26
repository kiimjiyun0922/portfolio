import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function metadataPlugin(siteUrl, ownerName) {
  const cleanUrl = siteUrl.replace(/\/+$/, '')
  let outputDirectory = ''
  const replaceMetadata = (source) => String(source)
    .replaceAll('__SITE_URL__', cleanUrl)
    .replaceAll('__OWNER_NAME__', ownerName)

  return {
    name: 'site-metadata',
    transformIndexHtml: replaceMetadata,
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async writeBundle() {
      for (const fileName of ['robots.txt', 'sitemap.xml']) {
        const filePath = resolve(outputDirectory, fileName)
        const source = await readFile(filePath, 'utf8')
        await writeFile(filePath, replaceMetadata(source))
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'http://localhost:5173'
  const ownerName = process.env.VITE_OWNER_NAME || env.VITE_OWNER_NAME || 'Portfolio Owner'

  return {
    base: process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '/',
    plugins: [react(), metadataPlugin(siteUrl, ownerName)],
    build: {
      // Mermaid 11.17 ships one optional parser module at ~662 KB. It remains
      // lazy-loaded only for diagrams, so keep the warning threshold above it.
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        input: {
          main: resolve(process.cwd(), 'index.html'),
          'front-system': resolve(process.cwd(), 'front-system.html'),
          'front-system-mist': resolve(process.cwd(), 'front-system-mist.html'),
          'front-system-midnight': resolve(process.cwd(), 'front-system-midnight.html'),
          'front-system-signal': resolve(process.cwd(), 'front-system-signal.html'),
          'front-system-bold': resolve(process.cwd(), 'front-system-bold.html'),
          'front-system-blueprint': resolve(process.cwd(), 'front-system-blueprint.html'),
          'front-system-bento': resolve(process.cwd(), 'front-system-bento.html'),
          'front-system-mono': resolve(process.cwd(), 'front-system-mono.html'),
          'front-systems': resolve(process.cwd(), 'front-systems.html'),
        },
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
  }
})
