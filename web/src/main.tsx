import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyColorMode, getPreferredColorMode } from './theme/color-mode';

// Apply light/dark before the first render, so the page never flashes the wrong theme.
applyColorMode(getPreferredColorMode());

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
