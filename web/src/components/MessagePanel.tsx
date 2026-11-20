import styled from 'styled-components';

/** Shared layout for full-width status messages (error, empty). */
export const MessagePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

export const MessageTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

export const MessageText = styled.p`
  margin: 0;
  max-width: 32rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;
