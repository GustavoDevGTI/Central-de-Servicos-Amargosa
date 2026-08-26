import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '.vite-editor-cache',
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: {
      'next/link': path.resolve(process.cwd(), 'next-link.tsx'),
    },
  },
  plugins: [react()],
});
