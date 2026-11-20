import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// jsdom doesn't implement <dialog>'s showModal()/close() (real browsers do). Minimal test-only stand-ins;
// the browser-provided behaviour (focus trap, Escape) is the browser's job and is checked manually.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

// Any request without a handler fails the test, so no test silently hits a real network.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  // Unmount rendered components and remove per-test API handlers so tests stay independent.
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
