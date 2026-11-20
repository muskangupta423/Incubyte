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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
