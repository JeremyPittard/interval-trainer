import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      outDir: '.svelte-kit/output/client',
      mode: 'production',
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      filename: 'sw.js',
      scope: '/',
      base: '/',
      includeAssets: [
        'favicon.png',
        'web-app-manifest-192x192.png',
        'web-app-manifest-512x512.png',
      ],
      workbox: {
        globDirectory: '.svelte-kit/output/client',
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,webp,ico,json}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'pepper',
        short_name: 'pepper',
        description: 'Random interval training simulator for sport',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?pwa=1',
        scope: '/',
        icons: [
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
