import { createGlobalStyle } from 'styled-components';
import { darkColors, lightColors } from './tokens';

function toCssVariables(colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([token, value]) => `--color-${token}: ${value};`)
    .join('\n');
}

export const GlobalStyle = createGlobalStyle`
  :root {
    ${toCssVariables(lightColors)}
    color-scheme: light;
  }

  :root[data-theme='dark'] {
    ${toCssVariables(darkColors)}
    color-scheme: dark;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.heading};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    line-height: 1.2;
  }

  /* Visible focus for keyboard users only (not on mouse click). */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
