import styled from 'styled-components';

/** A raised surface for grouping related content (stat cards, charts, tables). */
export const Card = styled.section`
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

export const CardDescription = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
