import { vi } from 'vitest';
import type { ScreenSize } from '../hooks/useScreenSize';

/** A typical width for each layout. */
const WIDTHS: Record<ScreenSize, number> = { phone: 375, tablet: 800, desktop: 1280 };

let screenWidth = WIDTHS.desktop;

/** Renders the next components as if on this kind of screen (tests start on desktop). */
export function setScreenSize(size: ScreenSize) {
  screenWidth = WIDTHS[size];
}

export function resetScreenSize() {
  screenWidth = WIDTHS.desktop;
}

/**
 * jsdom has no window.matchMedia. This stand-in answers the max-width queries the app uses
 * (see useScreenSize) for the width chosen with setScreenSize.
 */
export function matchMediaForTests(query: string): MediaQueryList {
  const maxWidth = /max-width:\s*([\d.]+)px/.exec(query)?.[1];
  return {
    matches: maxWidth !== undefined && screenWidth <= Number(maxWidth),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}
