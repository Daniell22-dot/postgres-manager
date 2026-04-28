import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.join(__dirname, 'src/renderer'),
  build: {
    outDir: path.join(__dirname, 'build/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src/renderer/index.html'),
    },
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      util: 'util/',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': '""',
    'process.browser': true
  },
  server: {
    port: 5173,
  },
});