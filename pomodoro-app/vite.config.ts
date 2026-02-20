import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Настройки сборки
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
});
