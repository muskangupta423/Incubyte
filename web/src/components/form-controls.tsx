import { useId } from 'react';
import styled, { css } from 'styled-components';

/** Styles shared by text inputs and selects, so all form controls look and size the same. */
export const controlStyles = css`
  width: 100%;
  min-height: ${({ theme }) => theme.layout.controlHeight};
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:hover {
    border-color: ${({ theme }) => theme.colors.secondaryText};
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`;

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const FieldHint = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const FieldError = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

interface FieldMessagesOptions {
  id?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

/**
 * Wires a control to its hint and error text for screen readers:
 * aria-describedby points at the messages and aria-invalid flags the error.
 */
export function useFieldMessages({ id, hint, error }: FieldMessagesOptions) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return {
    controlId,
    controlProps: {
      id: controlId,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy || undefined,
    },
    messages: (
      <>
        {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </>
    ),
  };
}
