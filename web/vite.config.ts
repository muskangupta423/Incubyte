import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const API_DEV_URL = 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward /api calls to the Express server,
    // so the browser sees one origin (no CORS setup needed).
    proxy: { '/api': API_DEV_URL },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Core libraries every page needs, in their own file: they change rarely, so returning
          // users keep them cached when only our code changes. Page-specific libraries (charts,
          // forms) stay out of it, so they still download only when their page/dialog opens.
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|styled-components|@tanstack|zod)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
