/**
 * Design tokens — the ONE place where colours, spacing, typography, radii, shadows,
 * breakpoints and z-index are defined. Components never hard-code these values.
 *
 * Palette and fonts follow incubyte.co (deep teal #014D43, lime #D3FE73, mint #EBFFF6,
 * navy #060A1E; Fraunces + Inclusive Sans), tuned for a calm, readable data tool.
 */

export const lightColors = {
  background: '#F6F5F2',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEEE9',
  border: '#E2E1DB',
  borderStrong: '#C9C8C1',
  text: '#0A0A0D',
  textMuted: '#5C5C57',
  heading: '#014D43',
  /** Primary call-to-action: teal background, white text. */
  primary: '#014D43',
  primaryHover: '#0A6457',
  onPrimary: '#FFFFFF',
  /** Secondary call-to-action: white background, teal text and border. */
  secondaryBackground: '#FFFFFF',
  secondaryHover: '#EBFFF6',
  secondaryText: '#014D43',
  /** Active / selected state (e.g. current navigation tab). */
  accent: '#D3FE73',
  accentHover: '#E4FFA6',
  onAccent: '#0A0A0D',
  focusRing: '#014D43',
  danger: '#B42318',
  dangerHover: '#912018',
  onDanger: '#FFFFFF',
  dangerSurface: '#FDECEA',
  success: '#067963',
  shadow: 'rgba(10, 10, 13, 0.08)',
  backdrop: 'rgba(6, 10, 30, 0.45)',
  /** Charts use one brand colour per chart (single series): easy to read, no colour legend needed. */
  chartBar: '#014D43',
  chartBarHover: '#0A6457',
  chartGrid: '#E2E1DB',
};

export type ColorToken = keyof typeof lightColors;

/**
 * Same tokens for dark mode. Typed against the light set, so a missing token is a compile error.
 * Teal text would be unreadable on navy, so headings and secondary actions use mint/lime instead,
 * and the primary button uses a slightly brighter teal so it stands out from the background.
 */
export const darkColors: Record<ColorToken, string> = {
  background: '#060A1E',
  surface: '#0E1329',
  surfaceMuted: '#161C38',
  border: '#232A48',
  borderStrong: '#363E61',
  text: '#F1F1F2',
  textMuted: '#A3A6B5',
  heading: '#EBFFF6',
  primary: '#0B6E60',
  primaryHover: '#128070',
  onPrimary: '#FFFFFF',
  secondaryBackground: '#0E1329',
  secondaryHover: '#161C38',
  secondaryText: '#D3FE73',
  accent: '#D3FE73',
  accentHover: '#E4FFA6',
  onAccent: '#060A1E',
  focusRing: '#D3FE73',
  danger: '#FF8A80',
  dangerHover: '#FFA49C',
  onDanger: '#2A0A0C',
  dangerSurface: '#3A1518',
  success: '#5DD6A6',
  shadow: 'rgba(0, 0, 0, 0.45)',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  chartBar: '#D3FE73',
  chartBarHover: '#E4FFA6',
  chartGrid: '#232A48',
};

export const fonts = {
  heading: "'Fraunces', Georgia, serif",
  body: "'Inclusive Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  md: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.375rem', // 22px
  xxl: '1.75rem', // 28px
  display: '2.25rem', // 36px
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
};

/** 4px-based spacing scale. */
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  xxl: '2rem', // 32px
  xxxl: '3rem', // 48px
};

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  pill: '999px',
};

/** Breakpoints are min-widths: styles are written mobile-first, then enhanced for larger screens. */
export const breakpoints = {
  tablet: 768,
  desktop: 1024,
};

export const zIndex = {
  header: 10,
  dropdown: 20,
  dialog: 30,
  toast: 40,
};

export const layout = {
  contentMaxWidth: '1200px',
  controlHeight: '2.5rem', // 40px — buttons and inputs line up
  controlHeightSmall: '2rem', // 32px
};
