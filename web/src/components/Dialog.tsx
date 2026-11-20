import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Button } from './Button';
import { CloseIcon } from './icons';

type DialogVariant = 'panel' | 'centered';

/**
 * How a page shows a dialog. Closing takes two steps so it can be animated:
 * the page sets `open` to false (the dialog plays its closing animation), and removes the dialog
 * only when `onExited` is called.
 */
export interface DialogVisibility {
  open: boolean;
  /** The user asked to close (close button, Escape, Cancel, or after saving). */
  onClose: () => void;
  /** The closing animation has finished: the dialog can now be removed. */
  onExited: () => void;
}

/**
 * Open/closed state for a dialog that carries no data of its own (e.g. a filters panel),
 * including the "closing" step in between. Render the dialog while `isShown`.
 */
export function useDialog() {
  const [state, setState] = useState<'closed' | 'open' | 'closing'>('closed');
  const visibility: DialogVisibility = {
    open: state === 'open',
    onClose: () => setState('closing'),
    onExited: () => setState('closed'),
  };
  return { isShown: state !== 'closed', show: () => setState('open'), visibility };
}

interface DialogProps extends DialogVisibility {
  title: string;
  children: ReactNode;
  /** Action buttons, kept visible at the bottom while the body scrolls. */
  footer?: ReactNode;
  /** "panel" slides in from the right (forms); "centered" is a small box (confirmations). */
  variant?: DialogVariant;
}

/**
 * Built on the native <dialog> + showModal(), which the browser makes accessible:
 * focus moves inside and is trapped there, the page behind becomes inert, and Escape closes it.
 * We add: a labelled title, a close button, opening/closing animations, and returning focus to
 * whatever opened the dialog.
 */
export function Dialog({
  open,
  onClose,
  onExited,
  title,
  children,
  footer,
  variant = 'panel',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openedFromRef = useRef<Element | null>(null);
  const titleId = useId();
  // Always calls the latest onExited, without restarting the animation when the page re-renders.
  const finishClosing = useEffectEvent(onExited);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) {
        openedFromRef.current = document.activeElement;
        dialog.showModal();
      }
      return;
    }

    if (!dialog.open) return;
    let cancelled = false;
    dialog.dataset.closing = 'true'; // starts the closing animation (see the styles below)
    void animationsFinished(dialog).then(() => {
      if (cancelled) return;
      dialog.close();
      delete dialog.dataset.closing;
      focusElement(openedFromRef.current);
      finishClosing();
    });
    return () => {
      // Re-opened before the animation ended.
      cancelled = true;
    };
  }, [open]);

  // The page removed the dialog without closing it first (e.g. navigated away).
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (!dialog?.open) return;
      dialog.close();
      focusElement(openedFromRef.current);
    };
  }, []);

  return (
    <StyledDialog
      ref={dialogRef}
      aria-labelledby={titleId}
      $variant={variant}
      onCancel={(event) => {
        // Escape: let React state decide whether (and how) the dialog closes.
        event.preventDefault();
        onClose();
      }}
    >
      <Layout>
        <Header>
          <Title id={titleId}>{title}</Title>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </Button>
        </Header>
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Layout>
    </StyledDialog>
  );
}

/**
 * Resolves when the element's running animations end — at once when there are none
 * (the user turned on "reduce motion", or an environment without animations, like tests).
 */
function animationsFinished(element: HTMLElement): Promise<unknown> {
  if (typeof element.getAnimations !== 'function') return Promise.resolve();
  return Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
}

function focusElement(element: Element | null) {
  if (element instanceof HTMLElement) element.focus();
}

/* Opening and closing animations. Closing is quicker: once the user decides, get out of the way. */
const slideInFromRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const riseAndFadeIn = keyframes`
  from { opacity: 0; transform: translateY(1rem) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideOutToRight = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
`;

const sinkAndFadeOut = keyframes`
  from { opacity: 1; transform: none; }
  to { opacity: 0; transform: translateY(1rem) scale(0.98); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

/** Panels slide in from the right; centred boxes rise slightly while fading in. Closing reverses it. */
const variantEnter = { panel: slideInFromRight, centered: riseAndFadeIn };
const variantExit = { panel: slideOutToRight, centered: sinkAndFadeOut };

const variantStyles = {
  // Full screen on phones; a panel on the right from tablet up.
  panel: css`
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;

    ${({ theme }) => theme.media.tablet} {
      width: 32rem;
      margin: 0 0 0 auto;
      border-left: 1px solid ${({ theme }) => theme.colors.border};
    }
  `,
  centered: css`
    width: calc(100% - 2 * ${({ theme }) => theme.spacing.lg});
    max-width: 28rem;
    border-radius: ${({ theme }) => theme.radii.lg};
  `,
};

const StyledDialog = styled.dialog<{ $variant: DialogVariant }>`
  padding: 0;
  border: none;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};

  ${({ $variant }) => variantStyles[$variant]}

  &[open] {
    animation: ${({ $variant }) => variantEnter[$variant]} ${({ theme }) => theme.motion.normal}
      ${({ theme }) => theme.motion.easeOut};
  }

  &[open]::backdrop {
    background: ${({ theme }) => theme.colors.backdrop};
    animation: ${fadeIn} ${({ theme }) => theme.motion.normal} ease;
  }

  /* "forwards" keeps the end state (hidden) until the dialog is actually closed. */
  &[open][data-closing] {
    animation: ${({ $variant }) => variantExit[$variant]} ${({ theme }) => theme.motion.fast}
      ease-in forwards;
  }

  &[open][data-closing]::backdrop {
    animation: ${fadeOut} ${({ theme }) => theme.motion.fast} ease-in forwards;
  }
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
