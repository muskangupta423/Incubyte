import styled, { keyframes } from 'styled-components';

interface LoadingStateProps {
  label?: string;
}

/** Announced politely to screen readers via role="status". */
export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <Wrapper role="status">
      <Spinner aria-hidden="true" />
      <span>{label}</span>
    </Wrapper>
  );
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Spinner = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
