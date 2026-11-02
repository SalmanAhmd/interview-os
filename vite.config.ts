import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages deploys the app below the repository name. The deploy workflow
 * sets BASE_PATH to `/<repository-name>/`. When it is not provided we keep the
 * conventional folder name used by this project.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? process.env.BASE_PATH || '/interview-preparation/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
