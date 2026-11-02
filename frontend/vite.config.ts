/**
 * Vite configuration with optimized code splitting.
 *
 * PhD-level optimizations:
 * - Manual chunks via function for heavy libraries (Leaflet, Cloudinary, React)
 * - Vendor chunk separation for better long-term caching
 * - Dynamic imports for route-based code splitting
 * - Chunk size warning limit adjusted to 600 kB
 *
 * @see https://vitejs.dev/config/
 * @see https://rollupjs.org/configuration-options/
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'icons.svg',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        name: 'AgroConnect — Del productor al comprador',
        short_name: 'AgroConnect',
        description:
          'Plataforma que conecta productores agrícolas colombianos con compradores, sin intermediarios.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2E7D32',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Imágenes del marketplace: se cachean tras la primera visita.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tiles del mapa: caché de una semana para conectividad rural.
            urlPattern:
              /^https:\/\/([a-d]\.)?(tile\.openstreetmap\.org|tile\.opentopomap\.org|basemaps\.cartocdn\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Increase warning limit to 600 kB (map applications are inherently larger)
    chunkSizeWarningLimit: 600,

    // Disable source maps for production to reduce bundle size
    sourcemap: false,

    // Target modern browsers for smaller output
    target: 'es2020',

    rollupOptions: {
      output: {
        /**
         * Manual chunk configuration using a function.
         *
         * This approach is required by Vite 8 / Rolldown TypeScript definitions
         * and provides dynamic, path-based chunking which is more robust than
         * static package name mapping.
         *
         * @param id - The absolute path of the module being bundled
         * @returns The name of the chunk or undefined for default chunking
         */
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // React ecosystem (~140KB)
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }

            // Mapping libraries (~220KB)
            if (
              id.includes('/leaflet/') ||
              id.includes('/react-leaflet/') ||
              id.includes('/leaflet-draw/') ||
              id.includes('/leaflet.heat/') ||
              id.includes('/leaflet-geosearch/') ||
              id.includes('/react-leaflet-markercluster/')
            ) {
              return 'vendor-leaflet';
            }

            // Image processing (~50KB)
            if (id.includes('/@cloudinary/')) {
              return 'vendor-cloudinary';
            }
          }
          // Returning undefined lets Vite/Rolldown handle the rest automatically
          return undefined;
        },

        // Organize output files in subdirectories
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const ext = info[info.length - 1];

          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(assetInfo.name ?? '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name ?? '')) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name ?? '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/${ext ?? 'other'}/[name]-[hash][extname]`;
        },
      },
    },
  },

  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet'],
  },
});
