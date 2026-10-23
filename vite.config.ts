import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base so the build also works from a sub-folder or static host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
