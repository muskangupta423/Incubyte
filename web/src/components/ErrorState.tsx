import type { ReactNode } from 'react';
import styled from 'styled-components';

interface ErrorStateProps {
  title: string;
  message: string;
  /** e.g. a "Try again" button or a link back to safety. */
  action?: ReactNode;
}

/** role="alert" makes screen readers announce the problem as soon as it appears. */
export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <Wrapper role="alert">
      <Title>{title}</Title>
      <Message>{message}</Message>
      {action}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

const Message = styled.p`
  margin: 0;
  max-width: 32rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;
