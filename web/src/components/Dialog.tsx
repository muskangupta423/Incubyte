import { useEffect, useId, useRef, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { Button } from './Button';
import { CloseIcon } from './icons';

type DialogVariant = 'panel' | 'centered';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Action buttons, kept visible at the bottom while the body scrolls. */
  footer?: ReactNode;
  /** "panel" slides in from the right (forms); "centered" is a small box (confirmations). */
  variant?: DialogVariant;
}

/**
 * Built on the native <dialog> + showModal(), which the browser makes accessible:
 * focus moves inside and is trapped there, the page behind becomes inert, and Escape closes it.
 * We add: a labelled title, a close button, and returning focus to whatever opened the dialog.
 */
export function Dialog({ open, title, onClose, children, footer, variant = 'panel' }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const openedFrom = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (openedFrom instanceof HTMLElement) openedFrom.focus();
    };
  }, [open]);

  return (
    <StyledDialog
      ref={dialogRef}
      aria-labelledby={titleId}
      $variant={variant}
      onCancel={(event) => {
        // Escape: let React state decide whether the dialog closes.
        event.preventDefault();
        onClose();
      }}
    >
      {open && (
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
      )}
    </StyledDialog>
  );
}

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

  &::backdrop {
    background: ${({ theme }) => theme.colors.backdrop};
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
