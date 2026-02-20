import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Базовый путь для GitHub Pages
  base: '/pomodoro-app/',
  // Настройки сборки
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
});
