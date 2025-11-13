import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      src: fileURLToPath(new URL('./src', import.meta.url)),
      layouts: fileURLToPath(new URL('./src/layouts', import.meta.url)),
      pages: fileURLToPath(new URL('./src/pages', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      services: fileURLToPath(new URL('./src/services', import.meta.url)),
      boot: fileURLToPath(new URL('./src/boot', import.meta.url)),
      i18n: fileURLToPath(new URL('./src/i18n', import.meta.url)),
      '#q-app/wrappers': fileURLToPath(new URL('./tests/stubs/quasar-wrappers.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});

