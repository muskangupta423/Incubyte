import styled from 'styled-components';

/** An error message inside a form or dialog; announced immediately via role="alert". */
export const InlineAlert = styled.p.attrs({ role: 'alert' })`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSurface};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
