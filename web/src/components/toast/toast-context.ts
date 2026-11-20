import { createContext, use } from 'react';

/**
 * success (green): something was added or saved. danger (red): something was deleted.
 * neutral: anything else, e.g. a limit was reached.
 */
export type ToastTone = 'success' | 'danger' | 'neutral';

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
