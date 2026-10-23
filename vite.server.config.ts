import { defineConfig } from 'vite';

// Bundles src/server/core.ts into one plain ES module the Supabase Edge Function imports.
export default defineConfig({
  build: {
    lib: { entry: 'src/server/core.ts', formats: ['es'], fileName: () => 'platform-core.js' },
    outDir: 'supabase/functions/_shared',
    emptyOutDir: false,
    minify: false,
    target: 'es2022',
    copyPublicDir: false,
  },
});
