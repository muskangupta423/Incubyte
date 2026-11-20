import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { ToastContext } from './toast-context';

const TOAST_DURATION_MS = 4000;

interface Toast {
  id: number;
  message: string;
}

/**
 * Short confirmation messages ("Employee added"). Rendered in a polite live region,
 * so screen readers announce them without interrupting.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message }]);

    const timer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(timer);
    }, TOAST_DURATION_MS);
    timers.current.add(timer);
  }, []);

  // Don't update state after the app unmounts (e.g. between tests).
  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach(clearTimeout);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={contextValue}>
      {children}
      <Region role="status" aria-live="polite">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id}>{toast.message}</ToastMessage>
        ))}
      </Region>
    </ToastContext>
  );
}

/** Top of the screen: where people look first, and clear of the sticky pagination bar at the bottom. */
const Region = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.spacing.lg};
  right: ${({ theme }) => theme.spacing.lg};
  left: ${({ theme }) => theme.spacing.lg};
  z-index: ${({ theme }) => theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  pointer-events: none;

  ${({ theme }) => theme.media.tablet} {
    left: auto;
    align-items: flex-end;
  }
`;

const ToastMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
