import {
  breakpoints,
  fonts,
  fontSizes,
  fontWeights,
  layout,
  lightColors,
  radii,
  spacing,
  zIndex,
  type ColorToken,
} from './tokens';

/**
 * Colours are exposed as CSS variables (e.g. theme.colors.primary === 'var(--color-primary)').
 * Switching light/dark only changes the variables' values (see GlobalStyle), so no component re-renders.
 */
const colors = Object.fromEntries(
  Object.keys(lightColors).map((token) => [token, `var(--color-${token})`]),
  // Object.fromEntries loses the key types; the keys are exactly the colour tokens.
) as Record<ColorToken, string>;

export const theme = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  spacing,
  radii,
  zIndex,
  layout,
  shadows: {
    sm: `0 1px 2px ${colors.shadow}`,
    md: `0 4px 16px ${colors.shadow}`,
  },
  media: {
    tablet: `@media (min-width: ${breakpoints.tablet}px)`,
    desktop: `@media (min-width: ${breakpoints.desktop}px)`,
  },
};

export type AppTheme = typeof theme;
