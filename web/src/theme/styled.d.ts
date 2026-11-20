import 'styled-components';
import type { AppTheme } from './theme';

// Gives every styled component a fully typed `theme` prop.
// TypeScript only merges module types through an interface, so the empty body is intentional.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
