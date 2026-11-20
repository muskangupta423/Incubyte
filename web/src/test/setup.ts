import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// Any request without a handler fails the test, so no test silently hits a real network.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  // Unmount rendered components and remove per-test API handlers so tests stay independent.
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
