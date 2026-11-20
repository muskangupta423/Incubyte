import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { CheckIcon, TrashIcon } from '../icons';
import { ToastContext, type ToastTone } from './toast-context';

const TOAST_DURATION_MS = 4000;

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckIcon />,
  danger: <TrashIcon />,
  neutral: null,
};

/**
 * Short confirmation messages ("Employee added"). Rendered in a polite live region,
 * so screen readers announce them without interrupting.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const showToast = useCallback((message: string, tone: ToastTone = 'neutral') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);

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
          <ToastMessage key={toast.id} $tone={toast.tone}>
            {TONE_ICONS[toast.tone]}
            {toast.message}
          </ToastMessage>
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

/** Soft tinted background, strong coloured edge and icon; the text keeps full contrast. */
const toneStyles = {
  success: css`
    border-color: ${({ theme }) => theme.colors.success};
    background: ${({ theme }) => theme.colors.successSurface};
    color: ${({ theme }) => theme.colors.text};

    svg {
      color: ${({ theme }) => theme.colors.success};
    }
  `,
  danger: css`
    border-color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerSurface};
    color: ${({ theme }) => theme.colors.text};

    svg {
      color: ${({ theme }) => theme.colors.danger};
    }
  `,
  neutral: css`
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.background};
  `,
};

const ToastMessage = styled.div<{ $tone: ToastTone }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1px solid;
  border-left-width: 4px;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  ${({ $tone }) => toneStyles[$tone]}

  svg {
    flex-shrink: 0;
  }
`;
