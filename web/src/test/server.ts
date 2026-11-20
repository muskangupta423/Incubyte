import { setupServer } from 'msw/node';

/**
 * Fake API for tests: intercepts fetch at the network level, so the real HTTP client and
 * TanStack Query run unchanged. Each test file registers the handlers it needs with server.use().
 */
export const server = setupServer();
