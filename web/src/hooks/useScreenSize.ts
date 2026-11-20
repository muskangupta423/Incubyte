import { useSyncExternalStore } from 'react';
import { breakpoints } from '../theme/tokens';

export type ScreenSize = 'phone' | 'tablet' | 'desktop';

// "Below the breakpoint" as a max-width query. The fraction avoids a 1px overlap with min-width queries.
const PHONE_QUERY = `(max-width: ${breakpoints.tablet - 0.02}px)`;
const BELOW_DESKTOP_QUERY = `(max-width: ${breakpoints.desktop - 0.02}px)`;

/**
 * Which layout to render, for the few places where phones need different *markup* (not just CSS):
 * e.g. filters in a panel instead of inline. Same breakpoints as the CSS (theme.media).
 */
export function useScreenSize(): ScreenSize {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_QUERY);
  if (isPhone) return 'phone';
  if (isBelowDesktop) return 'tablet';
  return 'desktop';
}

/** True while the media query matches; re-renders when it starts or stops matching (e.g. rotating a tablet). */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
