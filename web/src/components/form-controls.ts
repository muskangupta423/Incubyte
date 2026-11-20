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
`;

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
