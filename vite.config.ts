import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import fs from 'node:fs'
import path from 'node:path'
import sitemap from '@axelrindle/vite-plugin-sitemap'

const ROUTES_DIR = path.resolve(__dirname, 'src/routes')
const ENABLE_SITEMAP = process.env.ENABLE_SITEMAP === '1'

function collectRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath))
      continue
    }

    if (entry.isFile() && fullPath.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

function buildSitemapPages() {
  const routeFiles = collectRouteFiles(ROUTES_DIR)
  const routes = new Set<string>()

  for (const file of routeFiles) {
    const relative = path.relative(ROUTES_DIR, file)
    const withoutExt = relative.replace(/\.tsx$/, '')
    const normalized = withoutExt.replaceAll('\\', '/')

    // Remove route groups like (AboutUs), (Contacto), etc.
    const segments = normalized
      .split('/')
      .filter((segment) => segment !== '__root')
      .filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'))

    if (segments.at(-1) === 'index') {
      segments.pop()
    }

    const route = segments.length === 0 ? '/' : `/${segments.join('/')}`
    routes.add(route)
  }

  return [...routes]
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({ file: 'index.html', route }))
}

function getManualChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined

  const normalizedId = id.replaceAll('\\', '/')

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/scheduler/')
  ) {
    return 'react-vendor'
  }

  if (normalizedId.includes('/@tanstack/')) {
    return 'tanstack-vendor'
  }

  if (normalizedId.includes('/framer-motion/')) {
    return 'framer-motion-vendor'
  }

  if (normalizedId.includes('/lucide-react/')) {
    return 'lucide-vendor'
  }

  if (normalizedId.includes('/react-icons/')) {
    return 'react-icons-vendor'
  }

  if (normalizedId.includes('/leaflet/')) {
    return 'maps-vendor'
  }

  if (
    normalizedId.includes('/zod/') ||
    normalizedId.includes('/react-hook-form/') ||
    normalizedId.includes('/@material-tailwind/') ||
    normalizedId.includes('/react-select/')
  ) {
    return 'forms-ui-vendor'
  }

  if (
    normalizedId.includes('/swiper/') ||
    normalizedId.includes('/react-slick/') ||
    normalizedId.includes('/slick-carousel/')
  ) {
    return 'carousel-vendor'
  }

  if (
    normalizedId.includes('/axios/') ||
    normalizedId.includes('/date-fns/') ||
    normalizedId.includes('/libphonenumber-js/')
  ) {
    return 'utils-vendor'
  }

  // Let Vite/Rollup handle the rest to avoid unsafe forced splits.
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tanstackRouter({ target: 'react' }),
    {
      name: 'defer-main-css',
      enforce: 'post' as const,
      transformIndexHtml(html: string) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
          '<link rel="preload" as="style" href="$1" crossorigin onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
        )
      },
    },
    ENABLE_SITEMAP &&
      sitemap({
        baseUrl: 'https://asadajuandiaz.com',
        pages: buildSitemapPages(),
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5174,
  },
  build: {
    outDir: 'dist', // importante para Cloudflare
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (d) =>
            !/(?:maps-vendor|forms-ui-vendor|carousel-vendor|framer-motion-vendor|lucide-vendor|react-icons-vendor|utils-vendor)-[^/]+\.js$/.test(d)
        ),
    },
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
})
